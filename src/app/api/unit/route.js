import { pool } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';
import { errorResponse, successResponse } from '@/utils/apiResponse';


export async function POST(req) {
    try {

      apiKeyMiddleware(req);

      // Ambil token dari header Authorization
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
    

        await pool.query("SET TIME ZONE 'Asia/Jakarta'");
        await pool.query('BEGIN'); 

        const { unitName, houseNumber, unitHoHP, unitStatus, statusPeriod} = await req.json();

        const existingUnitAddress = await pool.query('SELECT * FROM units WHERE house_number = $1', [houseNumber]);
        
        if (existingUnitAddress.rows.length > 0) {
            return new Response(JSON.stringify({ 
              message: [{ text: 'Alamat sudah terdaftar', field: 'address' }]
                //field: 'address' 
             }),
             { status: 400 }
            );
        }

        const unitResult = await pool.query(
            'INSERT INTO units (unit_name, house_number, no_hp, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [unitName, houseNumber, unitHoHP, tenantId]
        );

        const unitId = unitResult.rows[0].unit_id;

        const unitStatusResult = await pool.query(
            'INSERT INTO unit_status_history (status, status_date, unit_id) VALUES ($1, $2, $3) RETURNING *',
            [unitStatus, statusPeriod, unitId]
        );

        // Ambil daftar iuran aktif yang sesuai dengan unit_status
        const activeFees = await pool.query(
          'SELECT * FROM fees WHERE tenant_id = $1 AND status = $2 AND unit_status = $3',
          [tenantId, 'active', unitStatus] // Filter berdasarkan unitStatus
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


        await pool.query('COMMIT');

        return successResponse(
            unitResult.rows,
            'Data created successfully',
            201
        );
      
    } catch (error) {
        await pool.query('ROLLBACK');
    
        console.error('Gagal', error);
        return errorResponse(
            error.message,
            'Internal Server Error',
            500
        );
    }
}

export async function PUT(req) {
  try {

      apiKeyMiddleware(req);
      // Ambil token dari header Authorization
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

      await pool.query("SET TIME ZONE 'Asia/Jakarta'");
      await pool.query('BEGIN'); 

      const { unitId, unitName, houseNumber, unitHoHP, unitStatus, statusPeriod} = await req.json();
      
      const status_date = new Date(statusPeriod)
      .toISOString()
      .split('T')[0];

       // Ambil data member sebelum di-update
      const oldMemberData = await pool.query(
        'SELECT status FROM unit_status_history WHERE unit_id = $1 ORDER BY status_date DESC LIMIT 1',
        [unitId]
      );

      const oldStatus = oldMemberData.rows.length > 0 ? oldMemberData.rows[0].status : null;

      const memberResult = await pool.query(
          'UPDATE units SET unit_name = $1, house_number = $2, no_hp = $3  WHERE unit_id = $4 RETURNING *',
          [unitName, houseNumber, unitHoHP, unitId]
      );
      

      if (memberResult.rowCount === 0) {
          return null; // Tidak ditemukan unit dengan id tersebut
      }

      const unitID = memberResult.rows[0].unit_id;

      const handleInvoiceForMember = async (unitID, unitStatus, status_date, tenantId) => {
        /*
        Jika update member menjadi kosong (vacant)
        - Jika status "paid" → Tidak melakukan apa-apa
        - Jika status "unpaid" → Ubah status di `member_fees` & `invoices` menjadi "Not Billable"
    
        Jika update member menjadi isi (occupied)
        - Jika status "paid" → Tidak melakukan apa-apa
        - Jika status "unpaid" → Ubah status di `member_fees` & `invoices` menjadi "unpaid"
        */
    
        const existingUnitFees = await pool.query(
            'SELECT * FROM unit_fees WHERE unit_id = $1 AND due_date = $2',
            [unitID, status_date]
        );

        //console.log(existingUnitFees)
    
        // Jika tidak ada data, keluar dari fungsi
        if (existingUnitFees.rows.length === 0) return;
    
        const currentStatus = existingUnitFees.rows[0].status;

        // console.log(memberStatus);
        // console.log(currentStatus);
    
        if (unitStatus === 'occupied' && currentStatus === 'unpaid') {
         
            const unitFeesInvoice = await pool.query(
                'UPDATE unit_fees SET status = $1 WHERE unit_id = $2 AND due_date = $3 RETURNING unit_fee_id',
                ['unpaid', unitID, status_date]
            );
    
        } 
    
        if (unitStatus === 'vacant' && currentStatus === 'unpaid') {
            const unitFeesInvoice = await pool.query(
                'UPDATE unit_fees SET status = $1 WHERE unit_id = $2 AND due_date = $3 RETURNING unit_fee_id',
                ['Not Billable', unitID, status_date]
            );
    

        }
      };
    
    
      const existingMonth = await pool.query(
        'SELECT * FROM unit_status_history WHERE unit_id = $1 AND status_date = $2',
        [unitId, status_date]
      );

      const existingStatus = await pool.query(
        'SELECT * FROM unit_status_history WHERE unit_id = $1 AND status = $2',
        [unitId, unitStatus]
      );

    

      const existingBoth = await pool.query(
        'SELECT * FROM unit_status_history WHERE unit_id = $1 AND status_date = $2 AND status = $3',
        [unitId, status_date, unitStatus]
      );

      // console.log("Ada Bulan "+existingMonth.rows.length)
      // console.log("Ada status "+existingStatus.rows.length)
      // console.log("ada 22  "+existingBoth.rows.length)

    
    
      if (existingBoth.rows.length > 0) {
        //console.log("Data sudah ada, tidak perlu update atau insert.");
        await handleInvoiceForMember(unitID, unitStatus, status_date, tenantId);
      }
     
      else if (existingMonth.rows.length > 0 && existingStatus.rows.length === 0) {
        //console.log("Bulan ada, status tidak ada");
        await pool.query(
          'UPDATE unit_status_history SET status = $2 WHERE unit_id = $3 AND status_date = $1 RETURNING *',
          [status_date, unitStatus, unitId]
        );

        await handleInvoiceForMember(unitID, unitStatus, status_date, tenantId);
      }

      else if (existingMonth.rows.length > 0 && existingStatus.rows.length > 0 && existingStatus.rows[0].status !== unitStatus) {
        //console.log("Bulan ada, status ada");
        await pool.query(
          'UPDATE unit_status_history SET status = $2 WHERE unit_id = $3 AND status_date = $1 RETURNING *',
          [status_date, unitStatus, unitId]
        );
        await handleInvoiceForMember(unitID, unitStatus, status_date, tenantId);
      }
      
      else if (existingMonth.rows.length === 0 && existingStatus.rows.length > 0) {
        //console.log("Bulan tidak ada, status ada");
        await pool.query(
          'INSERT INTO unit_status_history (status_date, status, unit_id) VALUES ($1, $2, $3) RETURNING *',
          [status_date, unitStatus, unitId]
        );
        await handleInvoiceForMember(unitID, unitStatus, status_date, tenantId);
      }

      else if (existingMonth.rows.length > 0 && existingStatus.rows.length > 0 && existingBoth.rows.length === 0) {
        //console.log("Bulan  ada, status ada duanya tidak ada");
        await pool.query(
          'INSERT INTO unit_status_history (status_date, status, unit_id) VALUES ($1, $2, $3) RETURNING *',
          [status_date, unitStatus, unitId]
        );
        await handleInvoiceForMember(unitID, unitStatus, status_date, tenantId);

      }
      
      else {
        await pool.query(
          'INSERT INTO unit_status_history (status_date, status, unit_id) VALUES ($1, $2, $3) RETURNING *',
          [status_date, unitStatus, unitId]
        );

        await handleInvoiceForMember(unitID, unitStatus, status_date, tenantId);



        // console.log(memberStatus);
        // console.log(statusPeriod);

        // if (memberStatus === 'occupied') {
        //   const existingFee = await pool.query(
        //       'SELECT * FROM member_fees WHERE member_id = $1', [memberID]
        //   );
      
        //   if (existingFee.rows.length === 0) {
        //       // Buat invoice baru
        //       const invoiceResult = await pool.query(
        //           'INSERT INTO invoices (member_id, total_amount, status) VALUES ($1, 0, $2) RETURNING invoice_id',
        //           [memberId, 'unpaid']
        //       );
      
        //       const invoiceId = invoiceResult.rows[0].invoice_id;
      
        //       // Generate unique invoice ID
        //       const generateInvoiceID = (id) => {
        //           const now = new Date();
        //           const day = String(now.getDate()).padStart(2, '0');
        //           const month = String(now.getMonth() + 1).padStart(2, '0');
        //           const year = String(now.getFullYear()).slice(-2);
        //           return `INV${day}${month}${year}${id}`;
        //       };
      
        //       const uniqueIdInv = generateInvoiceID(invoiceId);
      
        //       // Ambil daftar iuran aktif yang sesuai dengan member_status
        //       const activeFees = await pool.query(
        //           'SELECT fee_id FROM fees WHERE tenant_id = $1 AND status = $2 AND member_status = $3',
        //           [tenantId, 'active', memberStatus]
        //       );
      
        //       let totalAmount = 0;
      
        //       // Tambahkan fee untuk invoice ini
        //       for (const fee of activeFees.rows) {
        //           const { fee_id } = fee; // Destructuring agar lebih rapi
      
        //           const feeRate = await pool.query(
        //               'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
        //               [fee_id, currentMonth]
        //           );
      
        //           if (feeRate.rows.length > 0) {
        //               const amount = feeRate.rows[0].amount;
        //               totalAmount += amount;
      
        //               await pool.query(
        //                   'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
        //                   [memberId, invoiceId, fee_id, currentMonth, amount, 'unpaid']
        //               );
        //           }
        //       }
      
        //       // Update unique_id pada invoice
        //       await pool.query(
        //           'UPDATE invoices SET unique_id = $1, total_amount = $2 WHERE invoice_id = $3',
        //           [uniqueIdInv, totalAmount, invoiceId]
        //       );
        //   }
        // } else {
        //     // Ambil Member fee di bulan terpilih
        //     const unpaidFee = await pool.query(
        //         `SELECT invoice_id FROM member_fees 
        //         WHERE member_id = $1 AND status = 'unpaid'
        //         AND due_date = $2`,
        //         [memberId, statusPeriod]
        //     );

        //     console.log(unpaidFee)
        
        //     if (unpaidFee.rows.length > 0) {
        //         for (const invoice of unpaidFee.rows) {
        //             const { invoice_id } = invoice;
        
        //             // Hapus semua member_fees yang terkait dengan invoice ini
        //             await pool.query(
        //                 'DELETE FROM member_fees WHERE invoice_id = $1',
        //                 [invoice_id]
        //             );
        
        //             // Hapus invoice hanya jika tidak ada fee lain yang terkait
        //             const checkFees = await pool.query(
        //                 'SELECT COUNT(*) FROM member_fees WHERE invoice_id = $1',
        //                 [invoice_id]
        //             );
        
        //             if (checkFees.rows[0].count === "0") {
        //                 await pool.query(
        //                     'DELETE FROM invoices WHERE invoice_id = $1',
        //                     [invoice_id]
        //                 );
        //             }
        //         }
        //     }
        // }
      

      }

     


      await pool.query('COMMIT');
      return successResponse(
          memberResult.rows,
          'Data updated successfully',
          201
      );
  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan edit  data:', error);
      return errorResponse(
          error.message,
          'Internal Server Error',
          500
      );
  }
}

export async function DELETE(req) {
  try {
    apiKeyMiddleware(req);

    await pool.query('BEGIN'); 
    
    const {unitId } = await req.json();
  
    if (!unitId) {
      return new Response(JSON.stringify({ message: "ID wajib diisi" }), { status: 400 });
    }

    // Ambil token dari header Authorization
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

    const checkFee = await pool.query("SELECT * FROM units WHERE unit_id = $1 AND tenant_id = $2", [unitId, tenantId]);
      if (checkFee.rows.length === 0) {
        return successResponse
          (null,
            'Data not found',
            404
          );
      }
      
      
      await pool.query("DELETE FROM units WHERE unit_id = $1", [unitId]);
      await pool.query('COMMIT');

      return successResponse(
          null,
          'Data deleted successfully',
          200
      );

  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan Hapus  data:', error);
      return errorResponse(
          error.message,
          'Internal Server Error',
          500
      );  
  }
}

export async function GET(req) {
  try {
    apiKeyMiddleware(req);

    // Ambil token dari header Authorization
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

    const query = `
        WITH latest_status AS (
          SELECT DISTINCT ON (u.unit_id) 
              u.unit_id,
              u.unit_name,
              u.house_number,
              u.no_hp,
              us.status_history_id,
              us.status_date,
              us.status
          FROM public.units u
          LEFT JOIN public.unit_status_history us 
              ON u.unit_id = us.unit_id
          WHERE u.tenant_id = $1
          ORDER BY u.unit_id, us.status_date DESC
      )
      SELECT 
          ls.*,
          COALESCE(
              jsonb_agg(
                  jsonb_build_object(
                      'status_date', h.status_date,
                      'status', h.status
                  )
                  ORDER BY h.status_date DESC
              ) FILTER (WHERE h.unit_id IS NOT NULL), '[]'::jsonb
          ) AS status_history
      FROM latest_status ls
      LEFT JOIN public.unit_status_history h 
          ON ls.unit_id = h.unit_id
      GROUP BY ls.unit_id, ls.unit_name, ls.house_number, ls.no_hp, 
              ls.status_history_id, ls.status_date, ls.status
      ORDER BY ls.unit_id,
      ls.status_date DESC;

    `;
    const result = await pool.query(query,[tenantId]);

    if (result.rows.length === 0) {
      return successResponse(
        [],
        'Data not found',
        200
      );  
    }

    return successResponse(
      result.rows,
      'Member data fetched successfully',
      200
    );
    
  } catch (error) {
    console.error('Error fetching:', error);
    return errorResponse(
      error.message,
      'Internal Server Error',
      500
    );
  }
}