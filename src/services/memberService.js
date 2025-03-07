
const pool = require('../lib/db');

async function updateMemberStatus(member_id, status_date, status) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1️⃣ Update status baru atau insert jika belum ada
        await client.query(
            `INSERT INTO member_status_history (member_id, status_date, status)
             VALUES ($1, $2, $3)
             ON CONFLICT (member_id, status_date) 
             DO UPDATE SET status = $3`,
            [member_id, status_date, status]
        );

        // 2️⃣ Isi bulan kosong dengan status sebelumnya
        await client.query(
            `WITH last_status AS (
                SELECT member_id, status_date, status 
                FROM member_status_history 
                WHERE member_id = $1 
                AND status_date < $2 
                ORDER BY status_date DESC 
                LIMIT 1
            ), missing_months AS (
                SELECT generate_series(
                    (SELECT TO_DATE((SELECT status_date FROM last_status), 'YYYY-MM') + INTERVAL '1 month'),
                    TO_DATE($2, 'YYYY-MM') - INTERVAL '1 month',
                    INTERVAL '1 month'
                )::DATE AS status_date
            )
            INSERT INTO member_status_history (member_id, status_date, status)
            SELECT $1, TO_CHAR(status_date, 'YYYY-MM'), (SELECT status FROM last_status)
            FROM missing_months
            ON CONFLICT (member_id, status_date) DO NOTHING;`,
            [member_id, status_date]
        );

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

module.exports = { updateMemberStatus };
