import { pool } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import { apiKeyMiddleware } from '../../../middleware/apiKeyMiddleware';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export async function POST(req) {
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
      await pool.query('BEGIN'); 

      const { feeName, feeType, feeStatus, effective_date, amount, unitStatus} = await req.json();

      if (!feeName || !feeType || !feeStatus || !effective_date) {
          return errorResponse('Bad Request', 'Missing required fields', 400);
      }

      // console.log("Processing fee with details:", {
      //     feeName,
      //     feeType,
      //     feeStatus,
      //     effective_date
      // });

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const dueDate = firstDayOfMonth.toISOString().slice(0, 10); // YYYY-MM-DD

      const feeResult = await pool.query(
          'INSERT INTO fees (fee_name, is_recurring, status, tenant_id, unit_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [feeName, feeType, feeStatus, tenantId, unitStatus]
      );

      const feeId = feeResult.rows[0].fee_id;

      const feeRatestResult = await pool.query(
          'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING *',
          [effective_date, amount, feeId]
      );

      const unitCheck = await pool.query(
        `SELECT COUNT(*) AS unit_count FROM units WHERE tenant_id = $1`,
        [tenantId]
      );
      
      const unitCount = parseInt(unitCheck.rows[0].unit_count, 10);
      
      if (unitCount > 0) {
        const unitResult = await pool.query(
          `SELECT
              u.unit_id,
              u.house_number,
              us.status_history_id,
              us.status_date,
              us.status
            FROM public.units u
            LEFT JOIN public.unit_status_history us 
              ON u.unit_id = us.unit_id
            WHERE u.tenant_id = $1
            AND us.status = $2`,
          [tenantId, unitStatus]
        );
      
        // Asumsi mengambil member_id pertama yang ditemukan
        const unitId = unitResult.rows[0].unit_id;
      
        // Ambil daftar iuran aktif yang sesuai dengan unit_status
        const activeFees = await pool.query(
          'SELECT fee_id FROM fees WHERE tenant_id = $1 AND status = $2 AND unit_status = $3 AND fee_id = $4',
          [tenantId, 'active', unitStatus, feeId] // Filter berdasarkan unitStatus
        );
      
        const oldestFeeDate = await pool.query(
          'SELECT MIN(effective_date) as start_date FROM fee_rates WHERE fee_id = $1',
          [feeId]
        );
      
        const firstFeeDate = oldestFeeDate.rows[0].start_date ? new Date(oldestFeeDate.rows[0].start_date) : null;
        const today = new Date();
      
        let currentMonth = new Date(firstFeeDate);

        if(feeType === 'true') {
  
         // console.log("feeType bulanan");

          while (currentMonth <= today) {
            let totalAmount = 0;
      
            for (const fee of activeFees.rows) {
              const feeRate = await pool.query(
                'SELECT amount FROM fee_rates WHERE fee_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1',
                [fee.fee_id, currentMonth]
              );
        
              if (feeRate.rows.length > 0) {
                const amount = feeRate.rows[0].amount;
                totalAmount += amount;
        
                await pool.query(
                  'INSERT INTO unit_fees (unit_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5)',
                  [unitId, fee.fee_id, currentMonth, amount, 'unpaid']
                );
              }
            }
        
            // Pindah ke bulan berikutnya
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }

        } else {

          //console.log("feeType tidak bulanan");
          await pool.query(
            'INSERT INTO unit_fees (unit_id, fee_id, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5)',
            [unitId, feeId, effective_date, amount, 'unpaid']
          );
          
        }
      
      }
      
      await pool.query('COMMIT');
    
      return successResponse(
          feeResult.rows,
          'Data Successfully created',
          201
      );

    } catch (error) {
      await pool.query('ROLLBACK');
  
      console.error('Gagal', error);
      return errorResponse(
          'Internal Server Error',
          'An error occurred while creating data',
          500
      );
    }
}

export async function GET(req) {
    try {
      // Middleware untuk validasi API key (opsional, jika Anda menggunakan API key)
      apiKeyMiddleware(req);

      // Ambil token dari header Authorization
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
        WITH latest_amount AS (
            SELECT 
              f.fee_id,
              f.fee_name,
              f.status,
              f.unit_status,
              f.is_recurring,
              fr.rate_id,
              fr.effective_date::TEXT AS effective_date,
              fr.amount
            FROM public.fees f
            LEFT JOIN public.fee_rates fr 
            ON f.fee_id = fr.fee_id
            AND fr.effective_date = (
              SELECT MAX(effective_date) 
              FROM public.fee_rates 
              WHERE fee_id = f.fee_id
              AND effective_date <= CURRENT_DATE
            )
            WHERE f.tenant_id = $1  
          )
          SELECT 
            ls.*,
            COALESCE(json_agg(
              jsonb_build_object(
                'effective_date', h.effective_date::TEXT,
                'amount', h.amount
              )
              ORDER BY h.effective_date DESC
            ) FILTER (WHERE h.fee_id IS NOT NULL), '[]') AS amount_history
          FROM latest_amount ls
          LEFT JOIN public.fee_rates h 
            ON ls.fee_id = h.fee_id
          GROUP BY ls.fee_id, ls.fee_name, ls.is_recurring, ls.status, ls.unit_status, ls.rate_id, ls.effective_date, ls.amount
          ORDER BY ls.fee_id;
      `;
      const result = await pool.query(query,[tenantId]);
  
      if (result.rows.length === 0) {
        return successResponse([], 'No data found', 200);
      }

     return successResponse(
        result.rows,
        'Data successfully retrieved',
        200
      );
      
    } catch (error) {
      console.error('Error fetching Fees:', error);
      return errorResponse(
        'Internal Server Error',
        'An error occurred while fetching data',
        500
      );
    }
}

export async function PUT(req) {
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
      await pool.query('BEGIN'); 

      const { feeName, feeType, feeStatus, effective_date, amount, unitStatus, feeID } = await req.json();

      const feeResult = await pool.query(
          'UPDATE fees SET fee_name = $1, is_recurring = $2, status = $3, unit_status = $4 WHERE fee_id = $5 RETURNING *',
          [feeName, feeType, feeStatus, unitStatus, feeID]
      );

      if (feeResult.rowCount === 0) {
          return null; // Tidak ditemukan fee dengan id tersebut
      }

      const feeId = feeResult.rows[0].fee_id;

      //untuk bulanan
      const updateFeesAndInvoices = async (amount, effective_date, feeId) => {
        try {
          // Update unit_fees untuk due_date >= effectiveDate
          const updateUnitFeesQuery = await pool.query(
            `UPDATE unit_fees 
             SET amount_due = $1 
             WHERE due_date >= $2 
             AND status = 'unpaid' 
             AND fee_id = $3 
             RETURNING unit_fee_id`,
            [amount, effective_date, feeId]
          );
      
        } catch (error) {
          console.error("Terjadi kesalahan:", error);
        }
      };
      
      // Mengecek apakah ada entri dengan kombinasi fee_id dan effective_month
      const existingMonth = await pool.query(
        'SELECT * FROM fee_rates WHERE fee_id = $1 AND effective_date = $2',
        [feeId, effective_date]
      );

      // Mengecek apakah ada entri dengan kombinasi fee_id dan amount
      const existingAmount = await pool.query(
        'SELECT * FROM fee_rates WHERE fee_id = $1 AND amount = $2',
        [feeId, amount]
      );

      // Mengecek apakah ada entri yang memiliki kedua nilai
      const existingBoth = await pool.query(
        'SELECT * FROM fee_rates WHERE fee_id = $1 AND effective_date = $2 AND amount = $3',
        [feeId, effective_date, amount]
      );

      // console.log("Ada Bulan "+existingMonth.rows.length)
      // console.log("Ada amount "+existingAmount.rows.length)
      // console.log("ada 22  "+existingBoth.rows.length)

      // Kondisi 1: Jika keduanya ada, tidak melakukan apa-apa
      if (existingBoth.rows.length > 0) {
        console.log("Data sudah ada, tidak perlu update atau insert.");

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
      
      }
      // Kondisi 2: Jika effective_month ada dan amount tidak ada, lakukan update amount
      else if (existingMonth.rows.length > 0 && existingAmount.rows.length === 0) {
        await pool.query(
          'UPDATE fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_date = $1 RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
      }
      // Kondisi 3: Jika effective_month ada dan amount ada tetapi berbeda, lakukan update
      else if (existingMonth.rows.length > 0 && existingAmount.rows.length > 0 && existingAmount.rows[0].amount !== feeRates) {
        await pool.query(
          'UPDATE fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_date = $1 RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
        
      }

      // Kondisi 4: Jika effective_month tidak ada tetapi amount ada, lakukan insert
      else if (existingMonth.rows.length === 0 && existingAmount.rows.length > 0) {
        await pool.query(
          'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );
      }

      else if (existingMonth.rows.length > 0 && existingAmount.rows.length > 0 && existingBoth.rows.length === 0) {
        await pool.query(
          'UPDATE fee_rates SET amount = $2 WHERE fee_id = $3 AND effective_date = $1 RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        if(feeType !== true) {
          await updateFeesAndInvoices(amount, effective_date, feeId);
        }
      }
      // Kondisi 5: Jika keduanya tidak ada, lakukan insert
      else {
        await pool.query(
          'INSERT INTO fee_rates (effective_date, amount, fee_id) VALUES ($1, $2, $3) RETURNING rate_id, amount, fee_id',
          [effective_date, amount, feeId]
        );

        await updateFeesAndInvoices(amount, effective_date, feeId);

        
      }

      await pool.query('COMMIT');
      return successResponse(
          feeResult.rows,
          'Data Successfully updated',
          200
      );
  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan edit data:', error);
      return errorResponse(
          'Internal Server Error',
          'An error occurred while updating data',
          500
      );
  }
}

export async function DELETE(req) {
  try {
      apiKeyMiddleware(req);
      await pool.query('BEGIN'); 

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
      const { feeId } = await req.json();
    
      if (!feeId) {
        return errorResponse(
          'Bad Request',
          'feeId is required',
          400
        );    
      }

      // Cek apakah fee_id ada di database
      const checkFee = await pool.query("SELECT * FROM fees WHERE fee_id = $1", [feeId]);
      if (checkFee.rows.length === 0) {
        return successResponse(
          null,
          'Fee not found',
          404
        );  
      }

       // Cek apakah fee masih memiliki relasi di tabel lain (misalnya tbl_fee_rates)
      // const checkRelations = await pool.query("SELECT * FROM tbl_fee_rates WHERE fee_id = $1", [feeId]);
      // if (checkRelations.rows.length > 0) {
      //   return new Response(JSON.stringify({ message: "Tidak dapat menghapus, fee masih digunakan" }), { status: 400 });
      // }

       // Hapus fee dari tabel tbl_fees
      await pool.query("DELETE FROM fees WHERE fee_id = $1", [feeId]);

      await pool.query('COMMIT');
      return successResponse(
          null,
          'Data Successfully deleted',
          200
      );
  } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Kesalahan Hapus  data:', error);
      return errorResponse(
          'Internal Server Error',
          'An error occurred while deleting data',
          500
      );
  }
}

