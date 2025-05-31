import { pool } from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export async function GET(req) {
    try {
      // Middleware untuk validasi API key (opsional, jika Anda menggunakan API key)
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
          
      let query = `
      SELECT 
          f.fee_name,
          u.house_number,
          u.unit_id,
          f.fee_id,
          f.is_recurring,
          COUNT(uf.unit_fee_id) AS total_bills,
          SUM(uf.amount_due)::text AS total,
          MIN(uf.due_date) AS from,
          MAX(uf.due_date) AS until,
          ush.status AS latest_status

      FROM unit_fees uf
      JOIN units u ON uf.unit_id = u.unit_id
      JOIN fees f ON uf.fee_id = f.fee_id

      -- Ambil status terakhir dari semua status
      LEFT JOIN (
          SELECT DISTINCT ON (unit_id)
              unit_id,
              status,
              status_date
          FROM unit_status_history
          ORDER BY unit_id, status_date DESC
      ) ush ON ush.unit_id = u.unit_id

      WHERE uf.status != 'paid' 
      AND f.status = 'active'
      AND u.tenant_id = $1
      AND ush.status = 'occupied'

      GROUP BY f.fee_name, u.house_number, u.unit_id, f.fee_id, f.is_recurring, ush.status
      ORDER BY u.house_number, f.fee_name;
      `;

      const result = await pool.query(query, [tenantId]);
  
      if (result.rows.length === 0) {
        return successResponse([], 'Data not found', 200);
      }

      return successResponse(result.rows, 'Data retrieved successfully', 200);
  
    } catch (error) {
     // console.error('Error fetching Fees:', error);
     return errorResponse('Internal Server Error', [], 500);
    }
  }