
import { pool, withTransaction } from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';
import { successResponse, errorResponse } from '../../../../utils/apiResponse';

// export async function POST(req) {
//     try {
//         apiKeyMiddleware(req);
//         const authHeader = req.headers.get('authorization');
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//           return errorResponse(
//             'Unauthorized',
//             'Token not provided',
//             401
//           );  
//         }

//         const token = authHeader.split(' ')[1];
//         let decodedToken;

//         try {
//           decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//         } catch (error) {
//           return errorResponse(
//             'Unauthorized',
//             'Invalid or expired token',
//             401
//           );
//         }

//        // console.log('decodedToken', decodedToken);

//         const { tenantId } = decodedToken;
//         const createdBy = decodedToken.userId;
        
//         const {unitId, categoryId, transactionDate, amount, transactionType, transactionDescription, createdByType, createdAt, bills, paymentMethod, status, image} = await req.json();
        

//         if (!unitId || !amount || !bills || bills.length === 0) {
//           return errorResponse([], "Missing required fields", 400);
//         }

//         async function ensureUnitFeeExists(unitId, feeId, dueDate, amountDue) {
//           const existing = await pool.query(
//             `SELECT unit_fee_id FROM unit_fees
//              WHERE unit_id = $1 AND fee_id = $2 AND due_date = $3`,
//             [unitId, feeId, dueDate]
//           );
        
//           if (existing.rows.length > 0) {
//             return existing.rows[0].unit_fee_id;
//           }
        
//           const inserted = await pool.query(
//             `INSERT INTO unit_fees (unit_id, fee_id, due_date, amount_due, status)
//              VALUES ($1, $2, $3, $4, 'unpaid')
//              RETURNING unit_fee_id`,
//             [unitId, feeId, dueDate, amountDue]
//           );
        
//           return inserted.rows[0].unit_fee_id;
//         }
        

//         await pool.query("BEGIN");

//         // Fungsi untuk mendapatkan ID transaksi berikutnya
//         async function getNextTransactionId() {
//           const result = await pool.query('SELECT MAX(transaction_id) as max_id FROM transactions');
//           const lastTransactionId = result.rows[0].max_id;
//           return lastTransactionId ? lastTransactionId + 1 : 1;
//         }

//         // Fungsi untuk mendapatkan ID invoice berikutnya
//         async function getNextInvoiceID() {
//           const result = await pool.query('SELECT MAX(invoice_id) as max_id FROM invoices');
//           const lastInvoiceId = result.rows[0].max_id;
//           return lastInvoiceId ? lastInvoiceId + 1 : 1;
//         }

//         // Generate ID transaksi unik
//         const transactionIdG = await getNextTransactionId();
//         const generateTransactionID = (id) => {
//           const now = new Date();
//           const day = String(now.getDate()).padStart(2, '0');
//           const month = String(now.getMonth() + 1).padStart(2, '0');
//           const year = String(now.getFullYear()).slice(-2);
//           return `TRX${day}${month}${year}${id}`;
//         };

//         const trxUniqueId = generateTransactionID(transactionIdG);

//         // Generate ID invoice unik
//         const InvoiceIdG = await getNextInvoiceID();
//         const generateInvoiceID = (id) => {
//           const now = new Date();
//           const day = String(now.getDate()).padStart(2, '0');
//           const month = String(now.getMonth() + 1).padStart(2, '0');
//           const year = String(now.getFullYear()).slice(-2);
//           return `INV${day}${month}${year}${id}`;
//         };

//         const invUniqueId = generateInvoiceID(InvoiceIdG);

//         // 1. Insert into transactions
//         const formattedTransactionDate = new Date(transactionDate).toISOString();

//         const trxRes = await pool.query(
//           `INSERT INTO transactions (unique_id, tenant_id, category_id, transaction_date, amount, transaction_type, description, created_at, user_id, created_by_type, payment_method, transfer_proof, status, updated_at, updated_by)  
//           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)  
//           RETURNING transaction_id`, 
//           [
//             trxUniqueId,
//             tenantId,
//             categoryId,
//             formattedTransactionDate,  
//             amount,
//             transactionType,
//             transactionDescription,
//             createdAt,
//             createdBy,
//             createdByType,
//             paymentMethod,
//             image,
//             status,
//             createdBy
//           ]
//         );

//         if (trxRes.rowCount === 0) {
//           return null; 
//         }

//         const trxId = trxRes.rows[0].transaction_id;

//         // 2. Insert into transaction_fees
//         for (const bill of bills) {
//           let billId = bill.bill_id;

//           // Jika bill_id belum ada, buat baru
//           if (!billId) {
//             billId = await ensureUnitFeeExists(unitId, bill.fee_id, bill.due_date, bill.amount_due);
//           }

//           await pool.query(
//             `INSERT INTO transaction_fees (transaction_id, unit_fee_id, amount_paid)
//             VALUES ($1, $2, $3)`,
//             [trxId, billId, bill.editable_amount]
//           );

//           // Update juga bill_id supaya dipakai nanti di invoice_fees dan update
//           bill.bill_id = billId;
//         }


//         const invoiceStatus = status === 'pending' ? 'pending' : 'paid';

//         // 3. Insert into invoices
//         const invRes = await pool.query(
//           `INSERT INTO invoices (invoice_number, total_amount, status, created_at, updated_at)
//           VALUES ($1, $2, $3, NOW(), NOW())
//           RETURNING invoice_id`,
//           [invUniqueId, amount, invoiceStatus]
//         );

//         if (invRes.rowCount === 0) {
//           return null; 
//         }

//         const invId = invRes.rows[0].invoice_id;

//         // 4. Insert into invoice_fees
//         for (const bill of bills) {
//           await pool.query(
//             `INSERT INTO invoice_fees (invoice_id, unit_fee_id, amount)
//             VALUES ($1, $2, $3)`,
//             [invId, bill.bill_id, bill.editable_amount]
//           );
//         }

//         // 5. Update member_fees
//         for (const bill of bills) {
//           const { bill_id, editable_amount } = bill;
        
//           await pool.query(`
//             UPDATE unit_fees
//             SET 
//               amount_paid = COALESCE(amount_paid, 0) + $1,
//               status = CASE
//                 WHEN $3 = 'pending' THEN 'pending'
//                 WHEN COALESCE(amount_paid, 0) + $1 >= amount_due THEN 'paid'
//                 WHEN COALESCE(amount_paid, 0) + $1 > 0 THEN 'partial'
//                 ELSE 'unpaid'
//               END,
//               paid_at = CASE
//                 WHEN $3 = 'pending' THEN NULL
//                 WHEN COALESCE(amount_paid, 0) + $1 >= amount_due THEN 
//                   CASE 
//                     WHEN $3 ~ '^\d{4}-\d{2}-\d{2}$' THEN TO_DATE($3, 'YYYY-MM-DD') 
//                     ELSE NULL 
//                   END
//                 ELSE NULL
//               END
//             WHERE unit_fee_id = $2
//           `, [parseFloat(editable_amount), bill_id, transactionDate]);
//         }
        
//         await pool.query("COMMIT");
      
//         return successResponse({transaction_id: trxId, invoice_id: invId }, 'Payment Successful', 201);

//     } catch (error) {
//         console.error('Gagal menyimpan pembayaran:', error);
//         return errorResponse(
//             error.message === 'Unauthorized' ? 'Not authorized' : 'Internal server error',
//             [],
//             error.message === 'Unauthorized' ? 401 : 500
//         );
//     }
// }

export async function POST(req) {
  try {
    apiKeyMiddleware(req);

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 'Token not provided', 401);
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return errorResponse('Unauthorized', 'Invalid or expired token', 401);
    }

    const { tenantId, userId: createdBy } = decodedToken;
    
    const {
      unitId, categoryId, transactionDate, amount, transactionType,
      transactionDescription, createdByType, createdAt,
      bills, paymentMethod, status, image
    } = await req.json();

    if (!unitId || !amount || !bills || bills.length === 0) {
      return errorResponse([], "Missing required fields", 400);
    }

    await pool.query("BEGIN");

    // Helper functions
    const getNextId = async (table, idField) => {
      const result = await pool.query(`SELECT MAX(${idField}) as max_id FROM ${table}`);
      return result.rows[0].max_id ? result.rows[0].max_id + 1 : 1;
    };

    const formatDateID = (prefix, id) => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      return `${prefix}${dd}${mm}${yy}${id}`;
    };

    console.log('bills', bills);

    const ensureUnitFeeExists = async (bill) => {
      if (!bill.fee_id) {
        throw new Error(`Missing fee_id in bill: ${JSON.stringify(bill)}`);
      }
      const existing = await pool.query(
        `SELECT unit_fee_id FROM unit_fees 
         WHERE unit_id = $1 AND fee_id = $2 AND due_date = $3`,
        [unitId, bill.fee_id, bill.due_date]
      );

      if (existing.rows.length > 0) {
        return existing.rows[0].unit_fee_id;
      }

      const inserted = await pool.query(
        `INSERT INTO unit_fees (unit_id, fee_id, due_date, amount_due, amount_paid, status)
         VALUES ($1, $2, $3, $4, 0, 'unpaid')
         RETURNING unit_fee_id`,
        [unitId, bill.fee_id, bill.due_date, bill.amount_due]
            );

      console.log('inserted', inserted);

      return inserted.rows[0].unit_fee_id;
    };

    // Step 1: Insert into transactions
    const trxIdVal = await getNextId('transactions', 'transaction_id');
    const trxUniqueId = formatDateID('TRX', trxIdVal);

    const trxRes = await pool.query(
      `INSERT INTO transactions (unique_id, tenant_id, category_id, transaction_date, amount, transaction_type, description, created_at, user_id, created_by_type, payment_method, transfer_proof, status, updated_at, updated_by)  
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)  
       RETURNING transaction_id`, 
      [
        trxUniqueId, tenantId, categoryId, new Date(transactionDate).toISOString(),
        amount, transactionType, transactionDescription, createdAt,
        createdBy, createdByType, paymentMethod, image, status, createdBy
      ]
    );

    const trxId = trxRes.rows[0].transaction_id;

    // Step 2: Insert into transaction_fees (create fee if needed)
    const unitFeeIds = [];

    for (const bill of bills) {
      const unitFeeId = bill.bill_id > 0 
        ? bill.bill_id 
        : await ensureUnitFeeExists(bill);

      unitFeeIds.push(unitFeeId);

      await pool.query(
        `INSERT INTO transaction_fees (transaction_id, unit_fee_id, amount_paid)
         VALUES ($1, $2, $3)`,
        [trxId, unitFeeId, bill.editable_amount]
      );
    }

    // Step 3: Insert into invoices
    const invoiceIdVal = await getNextId('invoices', 'invoice_id');
    const invoiceUniqueId = formatDateID('INV', invoiceIdVal);
    const invoiceStatus = status === 'pending' ? 'pending' : 'paid';

    const invRes = await pool.query(
      `INSERT INTO invoices (invoice_number, total_amount, status, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING invoice_id`,
      [invoiceUniqueId, amount, invoiceStatus]
    );

    const invoiceId = invRes.rows[0].invoice_id;

    // Step 4: Insert into invoice_fees
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      const unitFeeId = unitFeeIds[i];

      await pool.query(
        `INSERT INTO invoice_fees (invoice_id, unit_fee_id, amount)
         VALUES ($1, $2, $3)`,
        [invoiceId, unitFeeId, bill.editable_amount]
      );
    }

    // Step 5: Update unit_fees
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      const unitFeeId = unitFeeIds[i];

      await pool.query(
        `UPDATE unit_fees
         SET amount_paid = COALESCE(amount_paid, 0) + $1,
             status = CASE
               WHEN $3 = 'pending' THEN 'pending'
               WHEN COALESCE(amount_paid, 0) + $1 >= amount_due THEN 'paid'
               WHEN COALESCE(amount_paid, 0) + $1 > 0 THEN 'partial'
               ELSE 'unpaid'
             END,
             paid_at = CASE
               WHEN $3 = 'pending' THEN NULL
               WHEN COALESCE(amount_paid, 0) + $1 >= amount_due THEN 
                 CASE 
                   WHEN $4 ~ '^\d{4}-\d{2}-\d{2}$' THEN TO_DATE($4, 'YYYY-MM-DD') 
                   ELSE NULL 
                 END
               ELSE NULL
             END
         WHERE unit_fee_id = $2`,
        [
          parseFloat(bill.editable_amount), unitFeeId,
          status, new Date(transactionDate).toISOString()
        ]
      );
    }

    await pool.query("COMMIT");

    return successResponse(
      { transaction_id: trxId, invoice_id: invoiceId },
      'Payment Successful',
      201
    );

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error('Payment failed:', error);
    return errorResponse(
      error.message === 'Unauthorized' ? 'Not authorized' : 'Internal server error',
      [],
      error.message === 'Unauthorized' ? 401 : 500
    );
  }
}


export async function PUT(req) {
  try {
      apiKeyMiddleware(req);
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

      // console.log('decodedToken', decodedToken);

      const { tenantId } = decodedToken;
      const createdBy = decodedToken.userId;
      
      const {transactionId, memberId, categoryId, transactionDate, amount, transactionType, transactionDescription, createdByType,createdAt,bills,paymentMethod,status,image} = await req.json();
      
      await pool.query("BEGIN");

      // 1. Update TRANSACTIONS
      await pool.query(`
        UPDATE transactions
        SET
          category_id = $1,
          transaction_date = $2,
          transaction_type = $3,
          amount = $4,
          description = $5,
          payment_method = $6,
          status = $7,
          transfer_proof = $8,
          updated_at = NOW(),
          updated_by = $10
        WHERE transaction_id = $9
      `, [
        categoryId, 
        transactionDate,
        transactionType, 
        amount,
        transactionDescription, 
        paymentMethod, 
        status,
        image, 
        transactionId, 
        createdBy
      ]);


      // 2. Hapus dan insert ulang TRANSACTION_FEES
      await pool.query(`DELETE FROM transaction_fees WHERE transaction_id = $1`, [transactionId]);

      for (const bill of bills) {
        await pool.query(`
          INSERT INTO transaction_fees (transaction_id, amount_paid, unit_fee_id)
          VALUES ($1, $2, $3)
        `, [transactionId, bill.editable_amount, bill.bill_id]);
      }

      // 3. (Opsional) Update status MEMBER_FEES jika sudah lunas
      for (const bill of bills) {
        const amountDue = parseFloat(bill.amount_due || 0);
        const amountPaid = parseFloat(bill.editable_amount || 0);

        if (amountPaid >= amountDue) {
          await pool.query(`
            UPDATE unit_fees
            SET status = 'paid', amount_paid = $2, paid_at = $3
            WHERE unit_fee_id = $1
          `, [bill.bill_id, amountPaid, transactionDate]);
        }
      }

      // 3. Update atau buat INVOICE
      // Cek apakah sudah ada invoice yang berisi unit_fee_id yang terlibat
      let invoiceId = null;

      const invoiceResult = await pool.query(`
        SELECT i.invoice_id
        FROM invoices i
        JOIN invoice_fees inf ON i.invoice_id = inf.invoice_id
        WHERE inf.unit_fee_id = ANY($1::int[])
        LIMIT 1
            `, [bills.map(b => b.bill_id)]);

      if (invoiceResult.rows.length > 0) {
        // Sudah ada invoice, update
        invoiceId = invoiceResult.rows[0].invoice_id;

        // Update status dan total_amount dengan amount yang baru
        await pool.query(`
          UPDATE invoices 
          SET total_amount = $1,
              status = 'paid',
              updated_at = $3
          WHERE invoice_id = $2
        `, [amount, invoiceId, createdAt]);

        // Update invoice_fees amounts
        await pool.query(`DELETE FROM invoice_fees WHERE invoice_id = $1`, [invoiceId]);
        
        // Insert new invoice_fees records
        for (const bill of bills) {
          await pool.query(`
            INSERT INTO invoice_fees (invoice_id, unit_fee_id, amount)
            VALUES ($1, $2, $3)
          `, [invoiceId, bill.bill_id, bill.editable_amount]);
        }
      

      } else {
        // Belum ada invoice → buat baru
        const InvoiceIdG = await generateInvoiceID();
        const generateInvoiceID = (id) => {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = String(now.getFullYear()).slice(-2);
          return `INV${day}${month}${year}${id}`;
        };

        const invUniqueId = generateInvoiceID(InvoiceIdG);

          const insertInvoice = await pool.query(`
            INSERT INTO invoices (invoice_number, member_id, total_amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING invoice_id
          `, [
            invUniqueId,
            memberId,
            amount, // Use the amount from parameters instead of recalculating
            status === 'pending' ? 'pending' : 'paid',
            createdAt || new Date()
          ]);

          invoiceId = insertInvoice.rows[0].invoice_id;

          // Insert invoice_fees
          for (const bill of bills) {
            await pool.query(`
              INSERT INTO invoice_fees (invoice_id, member_fee_id, amount)
              VALUES ($1, $2, $3)
            `, [invoiceId, bill.bill_id, bill.editable_amount]);
          }
      }

      
      await pool.query("COMMIT");
    
      return successResponse({transaction_id: transactionId }, 'Payment success', 201);

  } catch (error) {
      console.error('Gagal menyimpan pembayaran:', error);
      return errorResponse(
          error.message === 'Unauthorized' ? 'Tidak diotorisasi' : 'Terjadi kesalahan internal',
          [],
          error.message === 'Unauthorized' ? 401 : 500
      );
  }
}

export async function GET(req) {
  try {
      apiKeyMiddleware(req);
  
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
      SELECT 
      t.amount::text,
      array_agg(tf.unit_fee_id::text) AS bill_id,
      array_agg(uf.due_date ORDER BY uf.due_date) AS periods, -- kumpulkan semua periode
      t.transaction_date,
      f.fee_id,
      f.fee_name,
      f.is_recurring,
      u.house_number,
      u.unit_id,
      u.unit_name,
      t.payment_method,
      t.status,
      t.transaction_id,
      t.unique_id,
      t.transfer_proof
    FROM transactions t
    JOIN transaction_categories tc ON t.category_id = tc.category_id
    JOIN transaction_fees tf ON t.transaction_id = tf.transaction_id
    JOIN unit_fees uf ON tf.unit_fee_id = uf.unit_fee_id
    JOIN units u ON uf.unit_id = u.unit_id
    JOIN fees f ON uf.fee_id = f.fee_id
    WHERE t.category_id = 1 
    AND u.tenant_id = $1
    GROUP BY 
      t.amount, 
      t.transaction_date,
      f.fee_id,
      f.fee_name,
      f.is_recurring,
      u.house_number,
      u.unit_id,
      u.unit_name,
      t.payment_method,
      t.status,
      t.transaction_id,
      t.unique_id,
      t.transfer_proof
    ORDER BY t.created_at DESC;
    `;

    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return successResponse([], 'Data not found', 200);
    }

    return successResponse(result.rows, 'Data retrieved successfully', 200);

  } catch (error) {
    return errorResponse('Internal Server Error', [], 500);
  }
}

export async function DELETE(req) {
  try {
      apiKeyMiddleware(req);

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
      const {trxId } = await req.json();

      await pool.query('BEGIN'); 
      await pool.query(`
        UPDATE unit_fees
        SET amount_paid = 0,
            status = 'unpaid',
            paid_at = NULL
        WHERE unit_fee_id IN (
          SELECT unit_fee_id FROM transaction_fees WHERE transaction_id = $1
        )
      `, [trxId]);
      
      await pool.query("DELETE FROM transactions WHERE transaction_id = $1", [trxId]);

      await pool.query('COMMIT');

      return successResponse([], 'Transaction deleted successfully', 200)

  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan Hapus  data:', error);
      return errorResponse(
        error.message,
        'Internal Server Error',
        500
      );  
      // return new Response(
      //     JSON.stringify({ message: 'Internal Server Error', error: error.message }),
      //     { status: error.message === 'Unauthorized' ? 401 : 500 }
      // );
  }
}

