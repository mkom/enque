import { pool } from '../../../lib/db';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';
import { updateMemberStatus } from '../../../services/memberService';

export async function POST(req) {
    try {

        apiKeyMiddleware(req);
        await pool.query("SET TIME ZONE 'Asia/Jakarta'");
        
        await pool.query('BEGIN'); 
        const tenantId = req.headers.get('x-tenant-id');
        const { memberName, memberAddress, memberNoPhone, memberStatus, statusPeriod} = await req.json();

        const existingMemberAddress = await pool.query('SELECT * FROM members WHERE house_number = $1', [memberAddress]);
        if (existingMemberAddress.rows.length > 0) {
            return new Response(JSON.stringify({ 
              message: [{ text: 'Alamat sudah terdaftar', field: 'address' }]
                //field: 'address' 
             }),
             { status: 400 }
            );
        }

        const memberResult = await pool.query(
            'INSERT INTO members (member_name, house_number, no_hp, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [memberName, memberAddress, memberNoPhone, tenantId]
        );
        const memberId = memberResult.rows[0].member_id;

        const memberStatusResult = await pool.query(
            'INSERT INTO member_status_history (status, status_date, member_id) VALUES ($1, $2, $3) RETURNING *',
            [memberStatus, statusPeriod, memberId]
        );

        // Ambil daftar iuran aktif yang sesuai dengan member_status
        const activeFees = await pool.query(
          'SELECT * FROM fees WHERE tenant_id = $1 AND status = $2 AND member_status = $3',
          [tenantId, 'active', memberStatus] // Filter berdasarkan memberStatus
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
          let invoiceIds = [];
          let currentMonth = new Date(firstFeeDate);

          if(activeFees.is_recurring === true) {
            while (currentMonth <= today) {
              // Buat invoice untuk bulan tertentu
              const invoiceResult = await pool.query(
                  'INSERT INTO invoices (member_id, total_amount, status, created_at) VALUES ($1, 0, $2, NOW()) RETURNING *',
                  [memberId, 'unpaid']
              );
              const invoiceId = invoiceResult.rows[0].invoice_id;
              invoiceIds.push(invoiceId);

              const generateInvoiceID = (id) => {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0'); 
                const month = String(now.getMonth() + 1).padStart(2, '0'); 
                const year = String(now.getFullYear()).slice(-2); 
            
                return `INV${day}${month}${year}${id}`;
              };

              const uniqueIdInv = generateInvoiceID(invoiceId);

              await pool.query(
                'UPDATE invoices SET unique_id = $1 WHERE invoice_id = $2',
                [uniqueIdInv, invoiceId]
              );

              let totalAmount = 0;

              // Tambahkan fee untuk invoice ini
              for (const fee of activeFees.rows) {
                  const feeRate = await pool.query(
                      'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
                      [fee.fee_id, currentMonth]
                  );

                  if (feeRate.rows.length > 0) {
                      const amount = feeRate.rows[0].amount;
                      totalAmount += amount;

                      await pool.query(
                          'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
                          [memberId, invoiceId, fee.fee_id, currentMonth, amount, 'unpaid']
                      );
                  }
              }

              // Update total invoice setelah semua fee ditambahkan
              await pool.query(
                  'UPDATE invoices SET total_amount = $1 WHERE invoice_id = $2',
                  [totalAmount, invoiceId]
              );

              // Pindah ke bulan berikutnya
              currentMonth.setMonth(currentMonth.getMonth() + 1);
            }
          }
          else {

            // const invoiceResult = await pool.query(
            //   'INSERT INTO invoices (member_id, total_amount, status, created_at) VALUES ($1, 0, $2, NOW()) RETURNING *',
            //   [memberId, 'unpaid']
            // );

            // const invoiceId = invoiceResult.rows[0].invoice_id;
            // invoiceIds.push(invoiceId);
        
            // const generateInvoiceID = (id) => {
            //   const now = new Date();
            //   const day = String(now.getDate()).padStart(2, '0'); 
            //   const month = String(now.getMonth() + 1).padStart(2, '0'); 
            //   const year = String(now.getFullYear()).slice(-2); 
        
            //   return `INV${day}${month}${year}${id}`;
            // };
        
            // const uniqueIdInv = generateInvoiceID(invoiceId);
        
            // await pool.query(
            //   'UPDATE invoices SET unique_id = $1 WHERE invoice_id = $2',
            //   [uniqueIdInv, invoiceId]
            // );
        
            // let totalAmount = 0;

            // // Tambahkan fee untuk invoice ini
            // for (const fee of activeFees.rows) {
            //     const feeRate = await pool.query(
            //         'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
            //         [fee.fee_id, statusPeriod]
            //     );

            //     if (feeRate.rows.length > 0) {
            //         const amount = feeRate.rows[0].amount;
            //         totalAmount += amount;

            //         await pool.query(
            //             'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
            //             [memberId, invoiceId, fee.fee_id, statusPeriod, amount, 'unpaid']
            //         );
            //     }
            // }

            // // Update total invoice setelah semua fee ditambahkan
            // await pool.query(
            //     'UPDATE invoices SET total_amount = $1 WHERE invoice_id = $2',
            //     [totalAmount, invoiceId]
            // );
          }
        


        }


        await pool.query('COMMIT');
      
        return new Response(
            JSON.stringify({
                message: 'Success',
                data: memberResult.rows,
                status: memberStatusResult.rows,
            }),
            { status: 201 }
        );
    } catch (error) {
        await pool.query('ROLLBACK');
    
        console.error('Gagal', error);
        return new Response(
            JSON.stringify({ message: 'Internal Server Error', error: error.message }),
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function PUT(req) {
  try {

      apiKeyMiddleware(req);
      await pool.query("SET TIME ZONE 'Asia/Jakarta'");

      await pool.query('BEGIN'); 
      const { memberName, memberAddress, memberNoPhone, memberStatus, statusPeriod, memberId} = await req.json();
      
      const status_date = new Date(statusPeriod)
      .toISOString()
      .split('T')[0];

       // Ambil data member sebelum di-update
      const oldMemberData = await pool.query(
        'SELECT status FROM member_status_history WHERE member_id = $1 ORDER BY status_date DESC LIMIT 1',
        [memberId]
      );

      const oldStatus = oldMemberData.rows.length > 0 ? oldMemberData.rows[0].status : null;


      // Jika status berubah, tambahkan ke history dan update fees/invoices jika perlu
    //   if (oldStatus !== memberStatus) {
    //     await pool.query(
    //         'INSERT INTO member_status_history (status, status_date, member_id) VALUES ($1, $2, $3)',
    //         [memberStatus, status_date, memberId]
    //     );

          
    // }

    
      const memberResult = await pool.query(
          'UPDATE members SET member_name = $1, house_number = $2, no_hp = $3  WHERE member_id = $4 RETURNING *',
          [memberName, memberAddress, memberNoPhone, memberId]
      );
      

      if (memberResult.rowCount === 0) {
          return null; // Tidak ditemukan member dengan id tersebut
      }

     // console.log(statusPeriod)

      const memberID = memberResult.rows[0].member_id;
    
      const existingMonth = await pool.query(
        'SELECT * FROM member_status_history WHERE member_id = $1 AND status_date = $2',
        [memberID, status_date]
      );

      const existingStatus = await pool.query(
        'SELECT * FROM member_status_history WHERE member_id = $1 AND status = $2',
        [memberID, memberStatus]
      );

    

      const existingBoth = await pool.query(
        'SELECT * FROM member_status_history WHERE member_id = $1 AND status_date = $2 AND status = $3',
        [memberID, status_date, memberStatus]
      );

      // console.log("Ada Bulan "+existingMonth.rows.length)
      // console.log("Ada status "+existingStatus.rows.length)
      // console.log("ada 22  "+existingBoth.rows.length)

    
    
      if (existingBoth.rows.length > 0) {
        console.log("Data sudah ada, tidak perlu update atau insert.");
      }
     
      else if (existingMonth.rows.length > 0 && existingStatus.rows.length === 0) {
        await pool.query(
          'UPDATE member_status_history SET status = $2 WHERE member_id = $3 AND status_date = $1 RETURNING *',
          [status_date, memberStatus, memberID]
        );
      }

      else if (existingMonth.rows.length > 0 && existingStatus.rows.length > 0 && existingStatus.rows[0].status !== memberStatus) {
        await pool.query(
          'UPDATE member_status_history SET status = $2 WHERE member_id = $3 AND status_date = $1 RETURNING *',
          [status_date, memberStatus, memberID]
        );
      }
      
      else if (existingMonth.rows.length === 0 && existingStatus.rows.length > 0) {
        await pool.query(
          'INSERT INTO member_status_history (status_date, status, member_id) VALUES ($1, $2, $3) RETURNING *',
          [status_date, memberStatus, memberID]
        );
      }

      else if (existingMonth.rows.length > 0 && existingStatus.rows.length > 0 && existingBoth.rows.length === 0) {
        await pool.query(
          'INSERT INTO member_status_history (status_date, status, member_id) VALUES ($1, $2, $3) RETURNING *',
          [status_date, memberStatus, memberID]
        );
      }
      
      else {
        await pool.query(
          'INSERT INTO member_status_history (status_date, status, member_id) VALUES ($1, $2, $3) RETURNING *',
          [status_date, memberStatus, memberID]
        );

        //Hanya buat tagihan jika status berubah ke 'Dihuni'
        if (memberStatus === 'occupied') {
          const existingFee = await pool.query(
            'SELECT * FROM member_fees WHERE member_id = $1', [memberId]
          );

          if (existingFee.rows.length === 0) {
        
              // Buat invoice baru
              const invoiceResult = await pool.query(
                  'INSERT INTO invoices (member_id, total_amount, status) VALUES ($1, 0, $3) RETURNING invoice_id',
                  [memberId, 'unpaid']
              );

              const InvoiceId = invoiceResult.rows[0].invoice_id;

              // Generate unique invoice ID
              const generateInvoiceID = (id) => {
                  const now = new Date();
                  const day = String(now.getDate()).padStart(2, '0');
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  const year = String(now.getFullYear()).slice(-2);
                  return `INV${day}${month}${year}${id}`;
              };

              const uniqueIdInv = generateInvoiceID(InvoiceId);

               // Ambil daftar iuran aktif yang sesuai dengan member_status
              const activeFees = await pool.query(
                'SELECT fee_id FROM fees WHERE tenant_id = $1 AND status = $2 AND member_status = $3',
                [tenantId, 'active', memberStatus] // Filter berdasarkan memberStatus
              );

              let totalAmount = 0;

              // Tambahkan fee untuk invoice ini
              for (const fee of activeFees.rows) {
                const feeRate = await pool.query(
                    'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
                    [fee.fee_id, currentMonth]
                );

                if (feeRate.rows.length > 0) {
                    const amount = feeRate.rows[0].amount;
                    totalAmount += amount;

                    await pool.query(
                        'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
                        [memberId, InvoiceId, fee.fee_id, currentMonth, amount, 'unpaid']
                    );
                }
              }

               // Update unique_id pada invoice
              await pool.query(
                'UPDATE invoices SET unique_id = $1, total_amount = $2 WHERE invoice_id = $3',
                [uniqueIdInv,totalAmount, InvoiceId]
              );


          }
        } else {
        
          // Ambil Member fee di bulan terpilih
          const unpaidFee = await pool.query(
            `SELECT invoice_id FROM member_fees 
            WHERE member_id = $1 AND status = 'unpaid'
            AND due_date = $2`,
            [memberId, statusPeriod]
          );

          if (unpaidFee.rows.length > 0) {
            for (const invoice of unpaidFee.rows) {
                const invoiceId = invoice.invoice_id;
    
                // Hapus semua member_fees yang terkait dengan invoice ini
                await pool.query(
                    'DELETE FROM member_fees WHERE invoice_id = $1',
                    [invoiceId]
                );
    
                // Hapus invoice itu sendiri
                await pool.query(
                    'DELETE FROM invoices WHERE invoice_id = $1',
                    [invoiceId]
                );
            }
          }

        }
      }

     


      await pool.query('COMMIT');
      return new Response(
          JSON.stringify({
              status: 201,
              message: 'Edit data berhasil',
              data: memberResult.rows,
          }),
          { status: 201 }
      );
  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan edit  data:', error);
      return new Response(
          JSON.stringify({ message: 'Internal Server Error', error: error.message }),
          { status: error.message === 'Unauthorized' ? 401 : 500 }
      );
  }
}

export async function DELETE(req) {
  try {
      apiKeyMiddleware(req);
      await pool.query('BEGIN'); 
      const {memberId } = await req.json();
    
      if (!memberId) {
        return new Response(JSON.stringify({ message: "ID wajib diisi" }), { status: 400 });
      }

      
      const checkFee = await pool.query("SELECT * FROM members WHERE member_id = $1", [memberId]);
      if (checkFee.rows.length === 0) {
        return new Response(JSON.stringify({ message: "Member tidak ditemukan" }), { memberId: 404 });
      }

       // Cek apakah fee masih memiliki relasi di tabel lain (misalnya tbl_fee_rates)
      // const checkRelations = await pool.query("SELECT * FROM tbl_fee_rates WHERE fee_id = $1", [feeId]);
      // if (checkRelations.rows.length > 0) {
      //   return new Response(JSON.stringify({ message: "Tidak dapat menghapus, fee masih digunakan" }), { status: 400 });
      // }

       // Hapus fee dari tabel tbl_fees
      await pool.query("DELETE FROM members WHERE member_id = $1", [memberId]);

      await pool.query('COMMIT');
      return new Response(
          JSON.stringify({
              status: 200,
              message: 'Hapus data berhasil',
              //data: feeResult.rows,
          }),
          { status: 200 }
      );
  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan Hapus  data:', error);
      return new Response(
          JSON.stringify({ message: 'Internal Server Error', error: error.message }),
          { status: error.message === 'Unauthorized' ? 401 : 500 }
      );
  }
}

export async function GET(req) {
  try {
    // Middleware untuk validasi API key (opsional, jika Anda menggunakan API key)
    apiKeyMiddleware(req);

    const tenantId = req.headers.get('x-tenant-id');
    
    // Ambil token dari header Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          status: 'fail',
          message: 'Unauthorized',
          data: null,
        }),
        { status: 401 }
      );
    }

    const query = `
        WITH latest_status AS (
          SELECT DISTINCT ON (m.member_id) 
              m.member_id,
              m.member_name,
              m.house_number,
              m.no_hp,
              ms.status_history_id,
              ms.status_date,
              ms.status
          FROM public.members m
          LEFT JOIN public.member_status_history ms 
              ON m.member_id = ms.member_id
          WHERE m.tenant_id = $1
          ORDER BY m.member_id, ms.status_date DESC
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
              ) FILTER (WHERE h.member_id IS NOT NULL), '[]'::jsonb
          ) AS status_history
      FROM latest_status ls
      LEFT JOIN public.member_status_history h 
          ON ls.member_id = h.member_id
      GROUP BY ls.member_id, ls.member_name, ls.house_number, ls.no_hp, 
              ls.status_history_id, ls.status_date, ls.status
      ORDER BY ls.member_id,
      ls.status_date DESC;

    `;
    const result = await pool.query(query,[tenantId]);

    if (result.rows.length === 0) {
      return new Response(
          JSON.stringify({
              status: 'fail',
              message: 'Data not found',
              data: [],
          }),
          { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Data retrieved successfully',
        data: result.rows,
        // members:[result.member_id]
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error fetching:', error);
    return new Response(
      JSON.stringify({
          status: 'error',
          message: 'Internal Server Error',
          data: [],
        }),
      { status: 500 }
    );
  }
}