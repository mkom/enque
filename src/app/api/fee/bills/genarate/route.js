import { pool } from "@/lib/db";
import { apiKeyMiddleware } from "@/middleware/apiKeyMiddleware";
import { successResponse, errorResponse } from "@/utils/apiResponse";
import genarateBills from "@/lib/generateBills";
import jwt from 'jsonwebtoken';

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
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const check = await pool.query(
            'SELECT 1 FROM billing_runs WHERE tenant_id = $1 AND run_month = $2',
            [tenantId, currentMonth]
        );


        if (check.rowCount > 0) return; 

        await genarateBills(pool, tenantId);
        await pool.query(
            `INSERT INTO billing_runs (tenant_id, run_month) VALUES ($1, $2)`,
            [tenantId, currentMonth]
        );

        return successResponse(
            null,
            'Billing process completed successfully',
            200
        );

    } catch (err) {
        console.error('[Generate Tagihan Error]', err);
        return errorResponse(
            'Internal Server Error',
            'An error occurred while processing the request',
            500
        );
    }
  }