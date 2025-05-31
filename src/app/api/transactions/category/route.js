import { pool } from "@/lib/db";
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from "@/middleware/apiKeyMiddleware";
import { errorResponse, successResponse } from '@/utils/apiResponse';

export async function POST(req){
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
        
       // const { tenantId } = decodedToken;
        const body = await req.json();
        const { category_name, description } = body;

        if (!category_name || !description) {
            return errorResponse(
                'Bad Request',
                'Category name and description are required',
                400
            );
        }

        const query = `
            INSERT INTO transaction_categories (category_name, description)
            VALUES ($1, $2)
            RETURNING category_id, category_name, description
        `;
        const values = [category_name, description];
        const result = await pool.query(query, values);

        return successResponse(
            result.rows[0],
            'Transaction category created successfully',
            201
        );

    } catch (error) {
        console.error('Error creating:', error);
        return errorResponse(
            error.message,
            'Internal Server Error',
            500
        );
    }
}
export async function PUT(req){
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
        
       // const { tenantId } = decodedToken;
        const body = await req.json();
        const { category_id, category_name, description } = body;

        if (!category_id || !category_name || !description) {
            return errorResponse(
                'Bad Request',
                'Category ID, name and description are required',
                400
            );
        }

        const query = `
            UPDATE transaction_categories
            SET category_name = $1, description = $2
            WHERE category_id = $3
            RETURNING category_id, category_name, description
        `;
        const values = [category_name, description, category_id];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return errorResponse(
                'Not Found',
                'Category not found',
                404
            );
        }

        return successResponse(
            result.rows[0],
            'Transaction category updated successfully',
            200
        );

    } catch (error) {
        console.error('Error updating:', error);
        return errorResponse(
            error.message,
            'Internal Server Error',
            500
        );
    }
}
export async function DELETE(req){
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
        
       // const { tenantId } = decodedToken;
        const body = await req.json();
        const { category_id } = body;

        if (!category_id) {
            return errorResponse(
                'Bad Request',
                'Category ID is required',
                400
            );
        }

        const query = `
            DELETE FROM transaction_categories
            WHERE category_id = $1
            RETURNING category_id, category_name, description
        `;
        const values = [category_id];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return errorResponse(
                'Not Found',
                'Category not found',
                404
            );
        }

        return successResponse(
            result.rows[0],
            'Transaction category deleted successfully',
            200
        );

    } catch (error) {
        console.error('Error deleting:', error);
        return errorResponse(
            error.message,
            'Internal Server Error',
            500
        );
    }
}
export async function GET(req){
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
        
       // const { tenantId } = decodedToken;
        const query = `
            SELECT 
            category_id,
            category_name,
            description
            FROM transaction_categories
            WHERE category_name != 'Iuran'
            ORDER BY category_id ASC 
        `;
        const result = await pool.query(query, []);
        if (result.rows.length === 0) {
            return successResponse(
                [],
                'No categories found',
                200
            );
        }
        return successResponse(
            result.rows,
            'Transaction categories fetched successfully',
            200
        );

    }
    catch (error) {
        console.error('Error fetching:', error);
        return errorResponse(
            error.message,
            'Internal Server Error',
            500
        );
    }
}