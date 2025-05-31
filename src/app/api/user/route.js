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
      const query = `
        SELECT 

          u.id as user_id,
          u.tenant_id,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role
        FROM users u
        WHERE u.tenant_id = $1
        ORDER BY u.name;
      `;
      const result = await pool.query(query, [tenantId]);
  
      if (result.rows.length === 0) {
        return errorResponse(
          'Not Found',
          'Tenant not found',
          404
        );          
      }

      return successResponse(
        result.rows[0],
        'User details fetched successfully',
        200
      );
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      return errorResponse(
        'Internal Server Error',
        error.message,
        500
      );
    }
}