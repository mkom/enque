import { errorResponse, successResponse } from '@/utils/apiResponse';
import jwt from 'jsonwebtoken';
import { pool } from '../../../../lib/db';
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';

export async function GET(req) {
  try {
    // Middleware untuk validasi API key (opsional, jika Anda menggunakan API key)
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
      i.invoice_id,
      i.invoice_number,
      i.status AS invoice_status,
      i.total_amount::text AS invoice_total,
      TO_CHAR(i.created_at, 'YYYY-MM-DD HH24:MI:SS') AS invoice_created_at,

      t.transaction_id,
      t.unique_id AS transaction_unique_id,
      t.amount::text,
      TO_CHAR(t.transaction_date, 'YYYY-MM-DD') AS transaction_date,
      t.payment_method,
      t.status,
      t.transfer_proof,
      t.description,

      u.unit_name,
      u.house_number,

      json_agg(
        DISTINCT jsonb_build_object(
        'unit_fee_id', uf.unit_fee_id,
        'fee_id', f.fee_id,
        'fee_name', f.fee_name,
        'is_recurring', f.is_recurring,
        'due_date', TO_CHAR(uf.due_date, 'YYYY-MM-DD'),
        'amount_paid', uf.amount_paid::text
        )
      ) AS items

      FROM transactions t
      JOIN transaction_fees tf ON t.transaction_id = tf.transaction_id
      JOIN unit_fees uf ON tf.unit_fee_id = uf.unit_fee_id
      JOIN invoice_fees inf ON uf.unit_fee_id = inf.unit_fee_id
      JOIN invoices i ON inf.invoice_id = i.invoice_id
      JOIN fees f ON uf.fee_id = f.fee_id
      JOIN units u ON uf.unit_id = u.unit_id

      WHERE u.tenant_id = $1

      GROUP BY 
      i.invoice_id,
      i.invoice_number,
      i.status,
      i.total_amount,
      i.created_at,
      t.transaction_id,
      t.unique_id,
      t.amount,
      t.transaction_date,
      t.payment_method,
      t.status,
      t.transfer_proof,
      t.description,
      u.unit_name,
      u.house_number

      ORDER BY t.transaction_date DESC
    `;

    const result = await pool.query(query,[tenantId]);

    if (result.rows.length === 0) {
      return successResponse([], 'Data not found', 200);
    }

    return successResponse(result.rows, 'Data retrieved successfully', 200);

  } catch (error) {
   // console.error('Error fetching Fees:', error);
    return errorResponse(
      'Error fetching Invoices',
      error.message,
      500
    );
  }
}