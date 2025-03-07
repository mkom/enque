import { pool } from '../../../../lib/db';
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';

export async function POST(req) {
    try {
        apiKeyMiddleware(req);
        await pool.query('BEGIN'); 

        const { memberId, date, amount, paymentMethod, image, feeId, status} = await req.json();

        console.log("Date "+date)
        console.log('Transfer proof (image URL):', image); // Cetak panjang URL
        console.log('Image URL length:', image.length);
        console.log('paymentMethod:', paymentMethod); // Cetak panjang URL


        async function getNextTransactionId() {
          // Ambil ID transaksi terakhir berdasarkan urutan
          const result = await pool.query('SELECT MAX(transaction_id) as max_id FROM tbl_transactions');
          const lastTransactionId = result.rows[0].max_id;
        
          // Return ID transaksi berikutnya, jika tidak ada maka mulai dari 1
          return lastTransactionId ? lastTransactionId + 1 : 1;
        }

        async function getNextInvoiceID() {
          // Ambil ID transaksi terakhir berdasarkan urutan
          const result = await pool.query('SELECT MAX(invoice_id) as max_id FROM tbl_invoices');
          const lastInvoiceId = result.rows[0].max_id;
        
          // Return ID transaksi berikutnya, jika tidak ada maka mulai dari 1
          return lastInvoiceId ? lastInvoiceId + 1 : 1;
        }

        const transactionId = await getNextTransactionId();
        const generateTransactionID = (id) => {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0'); // Ambil tanggal (DD)
          const month = String(now.getMonth() + 1).padStart(2, '0'); // Ambil bulan (MM)
          const year = String(now.getFullYear()).slice(-2); // Ambil 2 digit terakhir tahun (YY)
      
          return `TRX${day}${month}${year}${id}`;
        };
        const uniqueId = generateTransactionID(transactionId);
      

        const trxResult = await pool.query(
            'INSERT INTO tbl_transactions (member_id, transaction_date, amount, payment_method, status, transfer_proof, unique_id) VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING *',
            [memberId, date, amount, paymentMethod, status, image,uniqueId]
        );

        const trxId = trxResult.rows[0].transaction_id;
        const InvoiceId = await getNextInvoiceID();
        const generateInvoiceID = (id) => {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0'); // Ambil tanggal (DD)
          const month = String(now.getMonth() + 1).padStart(2, '0'); // Ambil bulan (MM)
          const year = String(now.getFullYear()).slice(-2); // Ambil 2 digit terakhir tahun (YY)
      
          return `INV${day}${month}${year}${id}`;
        };

        const uniqueIdInv = generateInvoiceID(InvoiceId);
        const statusInv = (status === 'completed'?'paid':'unpaid');
       
        const invoiceResult = await pool.query(
            'INSERT INTO tbl_invoices (member_id, fee_id, total_amount, status, unique_id,transaction_id) VALUES ($1, $2, $3,$4, $5, $6) RETURNING*',
            [memberId, feeId, amount, statusInv, uniqueIdInv, trxId]
        );


        await pool.query('COMMIT');
      
        return new Response(
            JSON.stringify({
                message: 'Berhasil',
                transaction: trxResult.rows,
                invoice: invoiceResult.rows,
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
    
    if (!tenantId) {
      return new Response(
        JSON.stringify({
          error: 'Tenant ID is required' 
          }),
        { status: 500 }
      );
    }

    const query = `
      SELECT 
          t.transaction_id,
          t.member_id,
          m.member_address,
          f.fee_name,
          t.unique_id,
          t.amount,
          t.transaction_date,
          t.payment_method,
          t.status,
          t.transfer_proof
      FROM tbl_transactions t
      INNER JOIN tbl_members m ON m.member_id = t.member_id
      INNER JOIN tbl_invoices i ON i.transaction_id = t.transaction_id AND i.member_id = m.member_id
      INNER JOIN tbl_fees f ON f.fee_id = i.fee_id AND f.tenant_id = m.tenant_id
      WHERE m.tenant_id = f.tenant_id
      AND m.tenant_id = $1
      AND f.tenant_id = $1
      ORDER BY t.transaction_id DESC
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
   // console.error('Error fetching Fees:', error);
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
      const { feeName, feeType, feeStatus, feeDescription, feePeriod,  feeMemberStatus, feeDueDate, feeRates, id } = await req.json();

      const feeResult = await pool.query(
          'UPDATE tbl_fees SET fee_name = $1, fee_type = $2, status = $3, description = $4, due_date = $6, member_status = $7 WHERE fee_id = $5 RETURNING *',
          [feeName, feeType, feeStatus, feeDescription, id, feeDueDate, feeMemberStatus]
      );

      if (feeResult.rowCount === 0) {
          return null; // Tidak ditemukan fee dengan id tersebut
      }

      const feeId = feeResult.rows[0].fee_id;
      
      // Mengecek apakah ada entri dengan kombinasi fee_id dan effective_month
      const existingMonth = await pool.query(
        'SELECT * FROM tbl_fee_rates WHERE fee_id = $1 AND effective_month = $2',
        [feeId, feePeriod]
      );

      // Mengecek apakah ada entri dengan kombinasi fee_id dan amount
      const existingAmount = await pool.query(
        'SELECT * FROM tbl_fee_rates WHERE fee_id = $1 AND amount = $2',
        [feeId, feeRates]
      );

      // Mengecek apakah ada entri yang memiliki kedua nilai
      const existingBoth = await pool.query(
        'SELECT * FROM tbl_fee_rates WHERE fee_id = $1 AND effective_month = $2 AND amount = $3',
        [feeId, feePeriod, feeRates]
      );

      console.log("Ada Bulan "+existingMonth.rows.length)
      console.log("Ada amount "+existingAmount.rows.length)
      console.log("ada 22  "+existingBoth.rows.length)

      // Kondisi 1: Jika keduanya ada, tidak melakukan apa-apa
      if (existingBoth.rows.length > 0) {
        console.log("Data sudah ada, tidak perlu update atau insert.");
      }

      // // Kondisi 1.1: Jika keduanya ada, tidak melakukan apa-apa
      // if ( existingMonth.rows.length === 1 && existingAmount.rows.length === 1 && existingBoth.rows.length === 0) {
      //   await pool.query(
      //     'UPDATE tbl_fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_month = $1 RETURNING rate_id, amount, fee_id',
      //     [feePeriod, feeRates, feeId]
      //   );
      // }

      // if (existingBoth.rows.length > 0 && existingMonth.rows.length > 0 && existingAmount.rows.length > 0) {
      //   await pool.query(
      //     'UPDATE tbl_fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_month = $1 RETURNING rate_id, amount, fee_id',
      //     [feePeriod, feeRates, feeId]
      //   );
      // }

      // // Kondisi 1.2: Jika keduanya ada, tidak melakukan apa-apa
      // if (existingBoth.rows.length > 0 && existingMonth.rows.length > 0 && existingAmount.rows.length > 0) {
      //   await pool.query(
      //     'UPDATE tbl_fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_month = $1 RETURNING rate_id, amount, fee_id',
      //     [feePeriod, feeRates, feeId]
      //   );
      // }


      // Kondisi 2: Jika effective_month ada dan amount tidak ada, lakukan update amount
      else if (existingMonth.rows.length > 0 && existingAmount.rows.length === 0) {
        await pool.query(
          'UPDATE tbl_fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_month = $1 RETURNING rate_id, amount, fee_id',
          [feePeriod, feeRates, feeId]
        );
      }
      // Kondisi 3: Jika effective_month ada dan amount ada tetapi berbeda, lakukan update
      else if (existingMonth.rows.length > 0 && existingAmount.rows.length > 0 && existingAmount.rows[0].amount !== feeRates) {
        await pool.query(
          'UPDATE tbl_fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_month = $1 RETURNING rate_id, amount, fee_id',
          [feePeriod, feeRates, feeId]
        );
      }

      // Kondisi 4: Jika effective_month tidak ada tetapi amount ada, lakukan insert
      else if (existingMonth.rows.length === 0 && existingAmount.rows.length > 0) {
        await pool.query(
          'INSERT INTO tbl_fee_rates (effective_month, amount, fee_id) VALUES ($1, $2, $3) RETURNING rate_id, amount, fee_id',
          [feePeriod, feeRates, feeId]
        );
      }

      else if (existingMonth.rows.length > 0 && existingAmount.rows.length > 0 && existingBoth.rows.length === 0) {
        await pool.query(
          'UPDATE tbl_fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_month = $1 RETURNING rate_id, amount, fee_id',
          [feePeriod, feeRates, feeId]
        );
      }


      // Kondisi 5: Jika keduanya tidak ada, lakukan insert
      else {
        await pool.query(
          'INSERT INTO tbl_fee_rates (effective_month, amount, fee_id) VALUES ($1, $2, $3) RETURNING rate_id, amount, fee_id',
          [feePeriod, feeRates, feeId]
        );
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
      const checkFee = await pool.query("SELECT * FROM tbl_fees WHERE fee_id = $1", [feeId]);
      if (checkFee.rows.length === 0) {
        return new Response(JSON.stringify({ message: "Fee tidak ditemukan" }), { status: 404 });
      }

       // Cek apakah fee masih memiliki relasi di tabel lain (misalnya tbl_fee_rates)
      // const checkRelations = await pool.query("SELECT * FROM tbl_fee_rates WHERE fee_id = $1", [feeId]);
      // if (checkRelations.rows.length > 0) {
      //   return new Response(JSON.stringify({ message: "Tidak dapat menghapus, fee masih digunakan" }), { status: 400 });
      // }

       // Hapus fee dari tabel tbl_fees
      await pool.query("DELETE FROM tbl_fees WHERE fee_id = $1", [feeId]);

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

