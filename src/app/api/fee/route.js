import { pool } from '../../../lib/db';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';

export async function POST(req) {
    try {
        apiKeyMiddleware(req);
        await pool.query('BEGIN'); 

        const { feeName, feeType, feeStatus, effective_date, amount, member_status} = await req.json();
        const tenantId = req.headers.get('x-tenant-id');
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const dueDate = firstDayOfMonth.toISOString().slice(0, 10); // YYYY-MM-DD

        const feeResult = await pool.query(
            'INSERT INTO fees (fee_name, is_recurring, status, tenant_id, member_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [feeName, feeType, feeStatus, tenantId, member_status]
        );

        const feeId = feeResult.rows[0].fee_id;

        const feeRatestResult = await pool.query(
            'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING *',
            [effective_date, amount, feeId]
        );

        const memberCheck = await pool.query(
          `SELECT COUNT(*) AS member_count FROM members WHERE tenant_id = $1`,
          [tenantId]
        );
        
        const memberCount = parseInt(memberCheck.rows[0].member_count, 10);
        
        if (memberCount > 0) {
          const memberResult = await pool.query(
            `SELECT
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
              AND ms.status = $2`,
            [tenantId, member_status]
          );
        
          // Asumsi mengambil member_id pertama yang ditemukan
          const memberId = memberResult.rows[0].member_id;
        
          // Ambil daftar iuran aktif yang sesuai dengan member_status
          const activeFees = await pool.query(
            'SELECT fee_id FROM fees WHERE tenant_id = $1 AND status = $2 AND member_status = $3',
            [tenantId, 'active', member_status] // Filter berdasarkan memberStatus
          );
        
          const oldestFeeDate = await pool.query(
            'SELECT MIN(effective_date) as start_date FROM fee_rates WHERE fee_id = $1',
            [feeId]
          );
        
          const firstFeeDate = oldestFeeDate.rows[0].start_date ? new Date(oldestFeeDate.rows[0].start_date) : null;
          const today = new Date();
        
          let invoiceIds = [];
          let currentMonth = new Date(firstFeeDate);
        
          if(feeType === true) {
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
  
          } else {
           
            const invoiceResult = await pool.query(
              'INSERT INTO invoices (member_id, total_amount, status, created_at) VALUES ($1,$2, $3, NOW()) RETURNING *',
              [memberId, amount, 'unpaid']
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
        
           // let totalAmount = 0;

            await pool.query(
              'INSERT INTO member_fees (member_id, invoice_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6)',
              [memberId, invoiceId, feeId, effective_date, amount, 'unpaid']
            );
          }
         
        }
        
        await pool.query('COMMIT');
      
        return new Response(
            JSON.stringify({
                message: 'Berhasil',
                fee: feeResult.rows,
                feeRates: feeRatestResult.rows,
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
        WITH latest_amount AS (
            SELECT 
              f.fee_id,
              f.fee_name,
              f.status,
              f.member_status,
              f.is_recurring,
              fr.rate_id,
              fr.effective_date::TEXT AS effective_date,
              fr.amount
            FROM public.fees f
            LEFT JOIN public.fee_rates fr 
            ON f.fee_id = fr.fee_id
            AND fr.effective_date = (
              SELECT MAX(effective_date) 
              FROM public.fee_rates 
              WHERE fee_id = f.fee_id
              AND effective_date <= CURRENT_DATE
            )
            WHERE f.tenant_id = $1  
          )
          SELECT 
            ls.*,
            COALESCE(json_agg(
              jsonb_build_object(
                'effective_date', h.effective_date::TEXT,
                'amount', h.amount
              )
              ORDER BY h.effective_date DESC
            ) FILTER (WHERE h.fee_id IS NOT NULL), '[]') AS amount_history
          FROM latest_amount ls
          LEFT JOIN public.fee_rates h 
            ON ls.fee_id = h.fee_id
          GROUP BY ls.fee_id, ls.fee_name, ls.is_recurring, ls.status, ls.member_status, ls.rate_id, ls.effective_date,ls.amount
          ORDER BY ls.fee_id;
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
        }),
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Error fetching Fees:', error);
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

export async function PUT(req) {
  try {
      apiKeyMiddleware(req);
      await pool.query('BEGIN'); 
      const { feeName, feeType, feeStatus, effective_date, amount, feeID, member_status } = await req.json();
      // console.log(feeName, feeType, feeStatus, effective_date, amount, feeID)

      const feeResult = await pool.query(
          'UPDATE fees SET fee_name = $1, is_recurring = $2, status = $3, member_status = $5 WHERE fee_id = $4 RETURNING *',
          [feeName, feeType, feeStatus, feeID, member_status]
      );

      if (feeResult.rowCount === 0) {
          return null; // Tidak ditemukan fee dengan id tersebut
      }

      const feeId = feeResult.rows[0].fee_id;

      //untuk bulanan

      const updateFeesAndInvoices = async (amount, effective_date, feeId) => {
        try {
          // Update member_fees untuk due_date >= effectiveDate
          const updateMemberFeesQuery = await pool.query(
            `UPDATE member_fees 
             SET amount_due = $1 
             WHERE due_date >= $2 
             AND status = 'unpaid' 
             AND fee_id = $3 
             RETURNING invoice_id`,
            [amount, effective_date, feeId]
          );
      
          const invoiceIds = updateMemberFeesQuery.rows.map(row => row.invoice_id);
      
          if (invoiceIds.length > 0) {
            await pool.query(
              `UPDATE invoices 
               SET total_amount = $1 
               WHERE invoice_id = ANY($2)`,
              [amount, invoiceIds]
            );
          }
      
          // Ambil invoice_id untuk member_fees yang statusnya "paid"
          const paidFeesQuery = await pool.query(
            `SELECT invoice_id, amount_due, due_date 
             FROM member_fees 
             WHERE due_date >= $1 
             AND status = 'paid' 
             AND fee_id = $2`,
            [effective_date, feeId]
          );
      
          // Jika ada yang "paid", masukkan ke invoice_adjustments
          if (paidFeesQuery.rows.length > 0) {
            const values = paidFeesQuery.rows.map(row => `(${row.invoice_id}, ${row.amount_due}, '${row.due_date}')`).join(",");
      
            await pool.query(
              `INSERT INTO invoice_adjustments (invoice_id, adjustment_amount, adjustment_date) 
              VALUES ${values}`
            );
          }
      
          //console.log("Update selesai!");
        } catch (error) {
          console.error("Terjadi kesalahan:", error);
        }
      };

      
      // Mengecek apakah ada entri dengan kombinasi fee_id dan effective_month
      const existingMonth = await pool.query(
        'SELECT * FROM fee_rates WHERE fee_id = $1 AND effective_date = $2',
        [feeId, effective_date]
      );

      // Mengecek apakah ada entri dengan kombinasi fee_id dan amount
      const existingAmount = await pool.query(
        'SELECT * FROM fee_rates WHERE fee_id = $1 AND amount = $2',
        [feeId, amount]
      );

      // Mengecek apakah ada entri yang memiliki kedua nilai
      const existingBoth = await pool.query(
        'SELECT * FROM fee_rates WHERE fee_id = $1 AND effective_date = $2 AND amount = $3',
        [feeId, effective_date, amount]
      );

      // console.log("Ada Bulan "+existingMonth.rows.length)
      // console.log("Ada amount "+existingAmount.rows.length)
      // console.log("ada 22  "+existingBoth.rows.length)

      // Kondisi 1: Jika keduanya ada, tidak melakukan apa-apa
      if (existingBoth.rows.length > 0) {
        console.log("Data sudah ada, tidak perlu update atau insert.");

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
      

      }
      // Kondisi 2: Jika effective_month ada dan amount tidak ada, lakukan update amount
      else if (existingMonth.rows.length > 0 && existingAmount.rows.length === 0) {
        await pool.query(
          'UPDATE fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_date = $1 RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
      }
      // Kondisi 3: Jika effective_month ada dan amount ada tetapi berbeda, lakukan update
      else if (existingMonth.rows.length > 0 && existingAmount.rows.length > 0 && existingAmount.rows[0].amount !== feeRates) {
        await pool.query(
          'UPDATE fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_date = $1 RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
        
      }

      // Kondisi 4: Jika effective_month tidak ada tetapi amount ada, lakukan insert
      else if (existingMonth.rows.length === 0 && existingAmount.rows.length > 0) {
        await pool.query(
          'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );
      }

      else if (existingMonth.rows.length > 0 && existingAmount.rows.length > 0 && existingBoth.rows.length === 0) {
        await pool.query(
          'UPDATE fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_date = $1 RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
      }
      // Kondisi 5: Jika keduanya tidak ada, lakukan insert
      else {
        await pool.query(
          'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        await updateFeesAndInvoices(amount, effective_date, feeId);


        // // Update member_fees untuk due_date >= effectiveDate
        // const updateMemberFeesQuery = await pool.query(
        //   'UPDATE member_fees SET amount_due = $1 WHERE due_date >= $2 AND status = $3 AND fee_id = $4 RETURNING invoice_id',
        //   [amount, effective_date, 'unpaid' , feeId]
        // );

        // // console.log(effective_date)
        // // console.log(amount)
        // // console.log(feeId)

        // if (updateMemberFeesQuery.rows.length === 0) {
        //  // console.log("Tidak ada data yang diperbarui di member_fees.");
        // }

        //  // Ambil semua invoice_id yang terkait
        // const invoiceIds = updateMemberFeesQuery.rows.map(row => row.invoice_id);
      
        // if(invoiceIds.length > 0) {
        //   const updateInvoices = await pool.query(
        //     'UPDATE invoices SET total_amount  = $1 WHERE invoice_id = ANY($2)',
        //     [amount, invoiceIds]
        //   );
        // }

        // // Ambil invoice_id untuk member_fees yang statusnya "paid"
        // const paidFeesQuery = await pool.query(
        //   `SELECT invoice_id, amount_due, due_date 
        //    FROM member_fees 
        //    WHERE due_date >= $1 
        //    AND status = 'paid' 
        //    AND fee_id = $2`,
        //   [effective_date, feeId]
        // );

        // // Jika ada yang "paid", masukkan ke invoice_adjustments
        // if (paidFeesQuery.rows.length > 0) {
        //   const adjustments = paidFeesQuery.rows.map(row => `(${row.invoice_id}, ${row.amount_due}, '${row.due_date}')`).join(",");

        //   const insertAdjustments = await pool.query(
        //     `INSERT INTO invoice_adjustments (invoice_id, adjustment_amount, adjustment_date) 
        //     VALUES ${adjustments}`
        //   );

        //   //console.log(`Berhasil menambahkan ${insertAdjustments.rowCount} data ke invoice_adjustments.`);
        // }

        
      }

      await pool.query('COMMIT');
      return new Response(
          JSON.stringify({
              status: 201,
              message: 'Edit data berhasil',
              data: feeResult.rows,
          }),
          { status: 201 }
      );
  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan edit data:', error);
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
      const {feeId } = await req.json();
    
      if (!feeId) {
        return new Response(JSON.stringify({ message: "ID wajib diisi" }), { status: 400 });
      }

      // Cek apakah fee_id ada di database
      const checkFee = await pool.query("SELECT * FROM fees WHERE fee_id = $1", [feeId]);
      if (checkFee.rows.length === 0) {
        return new Response(JSON.stringify({ message: "Fee tidak ditemukan" }), { status: 404 });
      }

       // Cek apakah fee masih memiliki relasi di tabel lain (misalnya tbl_fee_rates)
      // const checkRelations = await pool.query("SELECT * FROM tbl_fee_rates WHERE fee_id = $1", [feeId]);
      // if (checkRelations.rows.length > 0) {
      //   return new Response(JSON.stringify({ message: "Tidak dapat menghapus, fee masih digunakan" }), { status: 400 });
      // }

       // Hapus fee dari tabel tbl_fees
      await pool.query("DELETE FROM fees WHERE fee_id = $1", [feeId]);

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

