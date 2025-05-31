import { pool } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';
import { errorResponse, successResponse } from '@/utils/apiResponse';

export async function GET(req) {
    try {
      apiKeyMiddleware(req);
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(
          'Unauthorized',
          'Authorization header missing or malformed',
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

      //console.log("tenantId", tenantId)

      const query = `
        SELECT 
          t.tenant_id,
          t.tenant_name,
          t.unique_name,
          t.unique_id,
          t.tenant_email,
          t.tenant_address,
            COUNT(DISTINCT u.unit_id)::INTEGER AS total_units,
            COUNT(DISTINCT f.fee_id)::INTEGER AS total_fees
        FROM tenants t
        LEFT JOIN units u ON t.tenant_id = u.tenant_id
        LEFT JOIN fees f ON t.tenant_id = f.tenant_id
        WHERE t.tenant_id = $1
        GROUP BY t.tenant_id, t.tenant_name
        ORDER BY t.tenant_name;

      `;
      const result = await pool.query(query, [tenantId]);
  
      if (result.rows.length === 0) {
        return errorResponse(
          [],
          'Tenant not found',
          404
        );          
      }

      return successResponse(
        result.rows[0],
        'Tenant details fetched successfully',
        200
      );
      
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      return errorResponse(
        'Internal Server Error',
        error.message,
        500
      );
    }
}