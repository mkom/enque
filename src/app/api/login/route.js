// /src/app/api/register/route.js

import bcrypt from 'bcryptjs';
import { pool } from '../../../lib/db';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';


export async function POST(req) {
    try {
        apiKeyMiddleware(req);

        const { email, password } = await req.json();
        // Cek apakah email ada di database
        const tenantResult = await pool.query('SELECT * FROM tenants WHERE tenant_email = $1', [email]);
        // console.log('Email:', email);
        // console.log('Query Result:', userResult);
        if (tenantResult.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'Akun tidak ditemukan' }), { status: 404 });
        }

        const tenant = tenantResult.rows[0];

        // Validasi email
        if (!validator.isEmail(email)) {
            return new Response(JSON.stringify({ message: 'Alamat email tidak valid' }), { status: 400 });
        }

        // Verifikasi password
        const passwordMatch = await bcrypt.compare(password, tenant.tenant_password);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ message: 'Kata sandi tidak valid' }), { status: 401 });
        }

        // **Cek apakah user memiliki tenant**
        const tenantCheck = await pool.query('SELECT * FROM tenants WHERE tenant_id = $1', [tenant.tenant_id]);
        if (tenantCheck.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'Akun telah dihapus' }), { status: 403 });
        }

        // Generate JWT token
        const token = jwt.sign(
            { tenantId: tenant.tenant_id, email: tenant.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } 
        );
        
        // Kembalikan respon sukses dengan data pengguna dan tenant
        return new Response(
            JSON.stringify({ message: 'Login berhasi', token }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Kesalahan Login:', error);
        return new Response(
            JSON.stringify({ message: 'Internal Server Error', error: error.message }),
            { status: 500 }
        );
    }
}