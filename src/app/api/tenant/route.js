import { pool } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';

export async function GET(req) {
    try {
      apiKeyMiddleware(req);
      
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

      const token = authHeader.split(' ')[1];

      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return new Response(
          JSON.stringify({
            status: 'fail',
            message: 'Invalid or expired token',
            data: null,
          }),
          { status: 401 }
        );
      }
  
      const { tenantId } = decodedToken;

      const query = `
        SELECT 
          t.tenant_id,
          t.tenant_name,
          t.unique_name,
          t.unique_id,
          t.tenant_email,
          t.tenant_address,
            COUNT(DISTINCT m.member_id)::INTEGER AS total_units,
            COUNT(DISTINCT f.fee_id)::INTEGER AS total_fees
        FROM tenants t
        LEFT JOIN members m ON t.tenant_id = m.tenant_id
        LEFT JOIN fees f ON t.tenant_id = f.tenant_id
        WHERE t.tenant_id = $1
        GROUP BY t.tenant_id, t.tenant_name
        ORDER BY t.tenant_name;

      `;
      const result = await pool.query(query, [tenantId]);
  
      if (result.rows.length === 0) {
        return new Response(
            JSON.stringify({
                status: 'fail',
                message: 'Tenant not found',
                data: null,
            }),
            { status: 404 }
        );
      }

      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Tenant details retrieved successfully',
          data: result.rows[0],
        }),
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      return new Response(
        JSON.stringify({
            status: 'error',
            message: 'Internal Server Error',
            data: null,
          }),
        { status: 500 }
      );
    }
}