import { pool } from '../../../../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../../../../middleware/apiKeyMiddleware';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export async function GET(req, context) {
  const params = await context.params;
  const { unitId, feeId } = params;
  
  const { searchParams } = new URL(req.url);
  const allbill = searchParams.get('allbill') || 'false';
  
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

      let query = `
       SELECT 
        u.unit_id,
        u.house_number,
        u.unit_name,
        f.fee_id,
        f.fee_name,

        json_agg(
          jsonb_build_object(
            'fee_id', f.fee_id::text,
            'unit_fee_id', uf.unit_fee_id,
            'bill_id', uf.unit_fee_id,
            'due_date_formatted', to_char(uf.due_date, 'Month YYYY'),
            'due_date', uf.due_date,
            'amount_due', uf.amount_due::text,
            'amount_paid', uf.amount_paid::text,
            'status', uf.status,
            'is_recurring', f.is_recurring
          )
        ) AS items

      FROM units u
      JOIN unit_fees uf ON u.unit_id = uf.unit_id
      JOIN fees f ON uf.fee_id = f.fee_id

      WHERE f.status = 'active'
        AND u.tenant_id = $1
        AND u.unit_id = $2
        AND f.fee_id = $3`;

      if (allbill === 'false') {
        query += ` AND uf.status != 'paid'`;
      }

      query += ` GROUP BY u.unit_id, u.house_number, u.unit_name, f.fee_id, f.fee_name`;
  
      const result = await pool.query(query, [tenantId, unitId, feeId]);
  
      if (result.rows.length === 0) {
        return successResponse([], 'Data not found', 200);
      }

      return successResponse(result.rows, 'Data retrieved successfully', 200);
  
    } catch (error) {
     // console.error('Error fetching Fees:', error);
     return errorResponse('Internal Server Error', [], 500);
    }
  }