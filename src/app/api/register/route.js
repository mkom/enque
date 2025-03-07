// /src/app/api/register/route.js

import bcrypt from 'bcryptjs';
import { pool } from '../../../lib/db';
import validator from 'validator';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';

export async function POST(req) {
    try {
        apiKeyMiddleware(req);

         // Mulai transaksi
      
        await pool.query('BEGIN'); // Memulai transaksi

        // Ambil data JSON dari body request
        const { email, password, tenant_name, tenant_type } = await req.json();

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
        const existingUserByEmail = await pool.query('SELECT * FROM tenants WHERE tenant_email = $1', [email]);
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
            'INSERT INTO tenants (tenant_email, tenant_password, tenant_name, tenant_type, unique_id) VALUES ($1, $2, $3, $4, $5) RETURNING tenant_id',
            [email,hashedPassword,tenant_name, tenant_type, uniqueId]
        );

       

        const tenant_id = tenantResult.rows[0].tenant_id;

        // const feeResult = await pool.query(
        //    `INSERT INTO fees (tenant_id, fee_name, is_recurring, status)
        //     SELECT $1, 'IPL', TRUE, 'active'
        //     WHERE NOT EXISTS (SELECT 1 FROM fees WHERE tenant_id = $1);
        //     `, [tenant_id]);

        //console.log(feeResult)

        // Memeriksa apakah fee berhasil dimasukkan atau sudah ada
        // let feeId;
        // if (feeResult.rows.length > 0) {
        //     // Jika fee baru berhasil dimasukkan
        //     feeId = feeResult.rows[0].fee_id;
        // } else {
        //     // Jika fee sudah ada, ambil fee_id yang ada
        //     const existingFeeResult = await pool.query(
        //         'SELECT fee_id FROM fees WHERE tenant_id = $1 LIMIT 1', [tenant_id]
        //     );
        //     feeId = existingFeeResult.rows[0].fee_id;
        // }

        // // Memasukkan rate untuk fee
        // await pool.query(
        //     'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING *',
        //     [new Date().toISOString().slice(0, 7) + '-01', '100000', feeId]
        // );
       

        await pool.query('COMMIT');
      

      
        return new Response(
            JSON.stringify({
                message: 'Registrasi berhasil',
                tenant: tenantResult.rows[0],
            }),
            { status: 201 }
        );
    } catch (error) {
        await pool.query('ROLLBACK');
    
        console.error('Kesalahan Registrasi:', error);
        return new Response(
            JSON.stringify({ message: 'Internal Server Error', error: error.message }),
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}