import { pool } from '../../../../lib/db';
import { read, utils } from "xlsx";
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';
import { NextResponse } from "next/server";
import { successResponse, errorResponse } from '@/utils/apiResponse';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    let transactionStarted = false; // Menandai apakah transaksi telah dimulai

    try {
        apiKeyMiddleware(req);

        // Ambil file dari form-data
        const formData = await req.formData();
        const file = formData.get('file'); 
        
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(
                'Unauthorized',
                'Token not provided',
                401
            );  
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return errorResponse(
                'Unauthorized',
                'Invalid or expired token',
                401
            );
        }
    
        const { tenantId } = decodedToken;

        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
        }

        // Simpan file ke buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        let records = [];
        if (file.name.endsWith(".csv") || file.name.endsWith(".xlsx")) {
            const workbook = read(fileBuffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            records = utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            return NextResponse.json({ error: "Format file tidak valid, hanya .csv dan .xlsx yang diterima" }, { status: 400 });
        }

        if (records.length === 0) {
            return NextResponse.json({ error: "File kosong atau format salah" }, { status: 400 });
        }

        await pool.query('BEGIN'); 
        transactionStarted = true; // Menandai bahwa transaksi telah dimulai

        const unitStatus = "occupied";
        let errors = [];

        for (const record of records) {
            const { no_unit, penghuni, no_hp } = record;

            const existingMember = await pool.query(
                "SELECT * FROM units WHERE house_number = $1",
                [no_unit]
            );

          

            if (existingMember.rows.length > 0) {
                errors.push(`No Unit ${no_unit} sudah terdaftar`);
                continue; // Skip proses insert jika alamat sudah ada
            }

            const unitsResult = await pool.query(
                "INSERT INTO units (unit_name, house_number, no_hp, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *",
                [penghuni, no_unit, no_hp, tenantId]
            );

            const unitId = unitsResult.rows[0].unit_id;
            const queryPeriodDefault = `
              SELECT 
                  fr.effective_date
                    FROM public.fee_rates fr
                    WHERE fr.effective_date = (
                  SELECT MIN(effective_date) 
                  FROM public.fee_rates 
                  WHERE fee_id = fr.fee_id
              )
              AND fr.fee_id IN (
                  SELECT fee_id FROM public.fees 
                  WHERE tenant_id = $1 
                  AND is_recurring = 'true'
              )
              ORDER BY fr.fee_id;

            `;

            const getPeriodDefault = await pool.query(queryPeriodDefault,[tenantId]);
            const statusPeriod = getPeriodDefault.rows[0].effective_date;

            const unitStatusResult = await pool.query(
                'INSERT INTO unit_status_history (status, status_date, unit_id) VALUES ($1, $2, $3) RETURNING *',
                [unitStatus, statusPeriod, unitId]
            );

             // Ambil daftar iuran aktif yang sesuai dengan unit_status
            const activeFees = await pool.query(
                'SELECT * FROM fees WHERE tenant_id = $1 AND status = $2 AND unit_status = $3',
                [tenantId, 'active', unitStatus] 
            );

             // Ambil tanggal efektif pertama kali iuran dimulai
            const oldestFeeDate = await pool.query(
                'SELECT MIN(effective_date) as start_date FROM fee_rates WHERE fee_id IN (SELECT fee_id FROM fees WHERE tenant_id = $1)',
                [tenantId]
            );

            const firstFeeDate = oldestFeeDate.rows[0].start_date ? new Date(oldestFeeDate.rows[0].start_date) : null;
            const today = new Date();

            // Jika ada iuran aktif yang cocok dengan status member
            if (activeFees.rows.length > 0 && firstFeeDate) {

                //let invoiceIds = [];
                let currentMonth = new Date(firstFeeDate);
    
                if (activeFees.rows.length > 0) {
                // Cek apakah ada fee yang recurring
                const hasRecurringFees = activeFees.rows.some(fee => fee.is_recurring === true);
            
                if (hasRecurringFees) {
                    // console.log("Fee ini adalah recurring.");
            
                    while (currentMonth <= today) {
                        await createMemberFees(currentMonth, unitId, activeFees.rows.filter(fee => fee.is_recurring));
                        currentMonth.setMonth(currentMonth.getMonth() + 1);
                    }
                }
            
                // Tangani fee yang tidak recurring (one-time fee)
                const oneTimeFees = activeFees.rows.filter(fee => !fee.is_recurring);
                if (oneTimeFees.length > 0) {
                    //console.log("Menambahkan one-time fee.");
                    await createMemberFees(today, unitId, oneTimeFees);
                }
                }
    
                // async function createInvoiceForMonth(date, memberId, fees) {
                //   const invoiceResult = await pool.query(
                //       'INSERT INTO invoices (member_id, total_amount, status, created_at) VALUES ($1, 0, $2, NOW()) RETURNING *',
                //       [memberId, 'unpaid']
                //   );
                //   const invoiceId = invoiceResult.rows[0].invoice_id;
    
                //   const generateInvoiceID = (id) => {
                //       const now = new Date();
                //       const day = String(now.getDate()).padStart(2, '0'); 
                //       const month = String(now.getMonth() + 1).padStart(2, '0'); 
                //       const year = String(now.getFullYear()).slice(-2); 
                //       return `INV${day}${month}${year}${id}`;
                //   };
    
                //   const uniqueIdInv = generateInvoiceID(invoiceId);
    
                //   await pool.query(
                //       'UPDATE invoices SET unique_id = $1 WHERE invoice_id = $2',
                //       [uniqueIdInv, invoiceId]
                //   );
    
                //   let totalAmount = 0;
                //   for (const fee of fees) {
                //       const feeRate = await pool.query(
                //           'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
                //           [fee.fee_id, date]
                //       );
    
                //       if (feeRate.rows.length > 0) {
                //           const amount = feeRate.rows[0].amount;
                //           totalAmount += amount;
    
                //           await pool.query(
                //               'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
                //               [memberId, invoiceId, fee.fee_id, date, amount, 'unpaid']
                //           );
                //       }
                //   }
    
                //   await pool.query(
                //       'UPDATE invoices SET total_amount = $1 WHERE invoice_id = $2',
                //       [totalAmount, invoiceId]
                //   );
                
                // }
    
                //fungsi membuat mmber_fees
                async function createMemberFees(date, unitId, fees) {
                let totalAmount = 0;
                for (const fee of fees) {
                    const feeRate = await pool.query(
                        'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
                        [fee.fee_id, date]
                    );
    
                    if (feeRate.rows.length > 0) {
                        const amount = feeRate.rows[0].amount;
                        totalAmount += amount;
    
                        await pool.query(
                            'INSERT INTO unit_fees (unit_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5)',
                            [unitId, fee.fee_id, date, amount, 'unpaid']
                        );
                    }
                }
                }
            
            }

            // const queryPeriodDefault = `
            //   SELECT 
            //       fr.effective_date
            //   FROM public.fee_rates fr
            //   WHERE fr.effective_date = (
            //       SELECT MIN(effective_date) 
            //       FROM public.fee_rates 
            //       WHERE fee_id = fr.fee_id
            //   )
            //   AND fr.fee_id IN (
            //       SELECT fee_id FROM public.fees 
            //       WHERE tenant_id = $1 
            //       AND is_recurring = 'true'
            //   )
            //   ORDER BY fr.fee_id;

            // `;

            // const getPeriodDefault = await pool.query(queryPeriodDefault,[tenantId]);
            // const statusPeriod = getPeriodDefault.rows[0].effective_date;

           // console.log(statusPeriod)

            // await pool.query(
            //     "INSERT INTO member_status_history (status, status_date, member_id) VALUES ($1, $2, $3)",
            //     [memberStatus, statusPeriod, memberId]
            // );

             // Ambil daftar iuran aktif yang sesuai dengan member_status
            // const activeFees = await pool.query(
            //     'SELECT * FROM fees WHERE tenant_id = $1 AND status = $2 AND member_status = $3',
            //     [tenantId, 'active', memberStatus] // Filter berdasarkan memberStatus
            // );
  
            // // Ambil tanggal efektif pertama kali iuran dimulai
            // const oldestFeeDate = await pool.query(
            //     'SELECT MIN(effective_date) as start_date FROM fee_rates WHERE fee_id IN (SELECT fee_id FROM fees WHERE tenant_id = $1)',
            //     [tenantId]
            // );
          
            // const firstFeeDate = oldestFeeDate.rows[0].start_date ? new Date(oldestFeeDate.rows[0].start_date) : null;
            // const today = new Date();

            // // Jika ada iuran aktif yang cocok dengan status member
            // if (activeFees.rows.length > 0 && firstFeeDate) {

            //     //let invoiceIds = [];
            //     let currentMonth = new Date(firstFeeDate);
    
            //     if (activeFees.rows.length > 0) {
            //     // Cek apakah ada fee yang recurring
            //     const hasRecurringFees = activeFees.rows.some(fee => fee.is_recurring === true);
            
            //     if (hasRecurringFees) {
            //         // console.log("Fee ini adalah recurring.");
            
            //         while (currentMonth <= today) {
            //             await createInvoiceForMonth(currentMonth, memberId, activeFees.rows.filter(fee => fee.is_recurring));
            //             currentMonth.setMonth(currentMonth.getMonth() + 1);
            //         }
            //     }
            
            //     // Tangani fee yang tidak recurring (one-time fee)
            //     const oneTimeFees = activeFees.rows.filter(fee => !fee.is_recurring);
            //     if (oneTimeFees.length > 0) {
            //         //console.log("Menambahkan one-time fee.");
            //         await createInvoiceForMonth(today, memberId, oneTimeFees);
            //     }
            //     }
    
            //     // Fungsi untuk membuat invoice
            //     async function createInvoiceForMonth(date, memberId, fees) {
            //     const invoiceResult = await pool.query(
            //         'INSERT INTO invoices (member_id, total_amount, status, created_at) VALUES ($1, 0, $2, NOW()) RETURNING *',
            //         [memberId, 'unpaid']
            //     );
            //     const invoiceId = invoiceResult.rows[0].invoice_id;
    
            //     const generateInvoiceID = (id) => {
            //         const now = new Date();
            //         const day = String(now.getDate()).padStart(2, '0'); 
            //         const month = String(now.getMonth() + 1).padStart(2, '0'); 
            //         const year = String(now.getFullYear()).slice(-2); 
            //         return `INV${day}${month}${year}${id}`;
            //     };
    
            //     const uniqueIdInv = generateInvoiceID(invoiceId);
    
            //     await pool.query(
            //         'UPDATE invoices SET unique_id = $1 WHERE invoice_id = $2',
            //         [uniqueIdInv, invoiceId]
            //     );
    
            //     let totalAmount = 0;
            //     for (const fee of fees) {
            //         const feeRate = await pool.query(
            //             'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
            //             [fee.fee_id, date]
            //         );
    
            //         if (feeRate.rows.length > 0) {
            //             const amount = feeRate.rows[0].amount;
            //             totalAmount += amount;
    
            //             await pool.query(
            //                 'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
            //                 [memberId, invoiceId, fee.fee_id, date, amount, 'unpaid']
            //             );
            //         }
            //     }
    
            //     await pool.query(
            //         'UPDATE invoices SET total_amount = $1 WHERE invoice_id = $2',
            //         [totalAmount, invoiceId]
            //     );
                
            //     }
                
            // }
        }

        await pool.query('COMMIT');

        if (errors.length > 0) {
            return NextResponse.json({ message: "Data berhasil diimpor dengan beberapa kesalahan", errors }, { status: 206 });
        }

        return NextResponse.json({ message: "Data berhasil diimpor" }, { status: 200 });

    } catch (error) {
        if (transactionStarted) {
            await pool.query('ROLLBACK'); // Rollback hanya jika transaksi sudah dimulai
        }
        console.error("Error import data:", error);
        return NextResponse.json({ error: "Terjadi kesalahan saat mengimpor data" }, { status: 500 });
    }
}
