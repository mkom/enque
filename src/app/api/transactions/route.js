import { pool } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';
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
        
       const { tenantId, userId: createdBy } = decodedToken;

        const body = await req.json();
        const { amount, transactionDate, description, paymentMethod, status, transactionType, categoryId, note , createdByType, createdAt, image} = body;

        if (!amount || !transactionDate || !description || !paymentMethod || !status || !transactionType || !categoryId) {
            return errorResponse(
                'Bad Request',
                'All fields are required',
                400
            );
        }

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

        const trxIdVal = await getNextId('transactions', 'transaction_id');
        const trxUniqueId = formatDateID('TRX', trxIdVal);

        const query = `
            INSERT INTO transactions (unique_id, tenant_id, user_id, amount, transaction_date, description, payment_method, status, transaction_type, category_id, created_by_type, created_at, note, transfer_proof, updated_at, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15)
            RETURNING *
        `;

        const values = [
            trxUniqueId, 
            tenantId, 
            createdBy, 
            amount, 
            transactionDate, 
            description, 
            paymentMethod, 
            status, 
            transactionType, 
            categoryId, 
            createdByType, 
            createdAt, 
            note, 
            image, 
            createdBy
        ];

        const result = await pool.query(query, values);

        return successResponse(
            result.rows[0],
            'Transaction created successfully',
            201
        );
    } catch (error) {
        console.error('Error creating transaction:', error);
        return errorResponse(
            error.message,
            'Internal Server Error',
            500
        );
    }
}
export async function PUT(req){}
export async function DELETE(req){}
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
        
        const { tenantId } = decodedToken;

        const query = `
            SELECT 
                t.transaction_id, 
                t.unique_id,
                t.amount, 
                t.transaction_date, 
                t.description, 
                t.payment_method,
                t.status, 
                t.transaction_type,
                u.name AS user_name,
                tc.category_name AS transaction_category
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN transaction_categories tc ON t.category_id = tc.category_id
            WHERE t.tenant_id = $1
            ORDER BY t.created_at DESC
        `;

        const result = await pool.query(query,[tenantId]);

        if (result.rows.length === 0) {
            return successResponse(
                [],
                'Data not found',
                200
            );  
        }
        return successResponse(
            result.rows,
            'Transactions fetched successfully',
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