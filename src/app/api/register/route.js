// /src/app/api/register/route.js

import bcrypt from 'bcryptjs';
import { pool } from '../../../lib/db';
import validator from 'validator';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';
import { errorResponse, successResponse } from '@/utils/apiResponse';
import { da } from 'date-fns/locale';

export async function POST(req) {
    try {
        apiKeyMiddleware(req);

         // Mulai transaksi
      
        await pool.query('BEGIN'); // Memulai transaksi

        // Ambil data JSON dari body request
        const { email, password, tenant_name, tenant_type, role } = await req.json();

       // console.log('Data yang diterima:', { email, password, tenant_name, tenant_type, role });

        // Validasi email
        if (!validator.isEmail(email)) {
            return new Response(JSON.stringify({ 
                message: 'Alamat email tidak valid' ,
                field: 'email' 
            }), { status: 400 });
        }

        // Validasi password
        if (!password || password.length < 8) {
            return new Response(JSON.stringify({ 
                message: 'Kata sandi harus terdiri dari minimal 8 karakter',
                field: 'password' 
             }), { status: 400 });
        }

        // Cek apakah email sudah terdaftar
        const existingUserByEmail = await pool.query('SELECT * FROM users WHERE email = $1 AND role=$2', [email, role]);
        if (existingUserByEmail.rows.length > 0) {
            return new Response(JSON.stringify({ 
                message: 'Email sudah terdaftar',
                field: 'email' 
             }), { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        async function getNextTenantId() {
            const result = await pool.query('SELECT MAX(tenant_id) as max_id FROM tenants');
            const lastTenantId = result.rows[0].max_id;
            return lastTenantId ? lastTenantId + 1 : 1;
        }

        const tenantId = await getNextTenantId();
        const generateUniqueID = (id) => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0'); // Ambil tanggal (DD)
            const month = String(now.getMonth() + 1).padStart(2, '0'); // Ambil bulan (MM)
            const year = String(now.getFullYear()).slice(-2); // Ambil 2 digit terakhir tahun (YY)
        
            return `${day}${month}${year}${id}`;
        };
        const uniqueId = generateUniqueID(tenantId);

    
        const tenantResult = await pool.query(
            'INSERT INTO tenants (tenant_email, tenant_name, tenant_type, unique_id) VALUES ($1, $2, $3, $4) RETURNING tenant_id',
            [email, tenant_name, tenant_type, uniqueId]
        );

    
        const tenant_id = tenantResult.rows[0].tenant_id;
        const userResult = await pool.query(
            'INSERT INTO users (email, password, role, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, hashedPassword, role, tenant_id]
        );

        const user_id = userResult.rows[0].id;

        await pool.query('COMMIT');
        return successResponse
        (
            { data: { user_id, tenant_id } },
            'Register is success',
            201
        );

    } catch (error) {
        await pool.query('ROLLBACK');
    
        console.error('Kesalahan Registrasi:', error);
        return errorResponse(
            'Error registering user',
            error,
            500
          );
    }
}