// /src/app/api/register/route.js

import bcrypt from 'bcryptjs';
import { pool } from '../../../../lib/db';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import Cookies from "js-cookie";
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';
import { errorResponse, successResponse } from '@/utils/apiResponse';


export async function POST(req) {
    try {
        apiKeyMiddleware(req);

        const { email, password } = await req.json();
       // console.log("data", email, password)
        
        // Cek apakah email ada di database
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1 and role = $2', [email, 'admin_tenant']);
        
        if (userResult.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'Akun tidak ditemukan' }), { status: 404 });
        }

        // cek tenant
        const tenantResult = await pool.query('SELECT * FROM tenants WHERE tenant_id = $1', [userResult.rows[0].tenant_id]);

        if (tenantResult.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'Akun tidak ditemukan' }), { status: 404 });
        }

        const tenant = tenantResult.rows[0];

        // Validasi email
        if (!validator.isEmail(email)) {
            return new Response(JSON.stringify({ message: 'Alamat email tidak valid' }), { status: 400 });
        }

        // Verifikasi password
        const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ message: 'Kata sandi tidak valid' }), { status: 401 });
        }

        // Generate JWT token
        const token = jwt.sign(
            { tenantId: userResult.rows[0].tenant_id, email: userResult.rows[0].email , userId: userResult.rows[0].id, role: userResult.rows[0].role, tenantName: tenant.tenant_name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } 
        );


        //Cookies.set("token.app.oq", token, { expires: 7, secure: true });

        return successResponse(token, 'Login success', 200);

        
    } catch (error) {
        console.error('Kesalahan Login:', error);
        return errorResponse('Internal Server Error', error.message, 500);
    }
}