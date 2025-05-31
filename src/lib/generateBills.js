// lib/genarateBills.js
export default async function genarateBills(pool, tenantId) {

    const unitCheck = await pool.query(
    `SELECT COUNT(*) AS unit_count FROM units WHERE tenant_id = $1`,
    [tenantId]
    );
    
    const unitCount = parseInt(unitCheck.rows[0].unit_count, 10);

     const units = await pool.query(
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
        [tenantId, 'occupied']
    );
    
    // Asumsi mengambil member_id pertama yang ditemukan
    const unitId = units.rows[0].unit_id;
  
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  

    for (const unit of units.rows) {
      const activeFees = await pool.query(
        `SELECT fee_id FROM fees 
         WHERE tenant_id = $1 
         AND status = 'active' 
         AND unit_status = $2
         AND is_recurring = true`,
        [tenantId, unit.status]
      );
  
      for (const fee of activeFees.rows) {
        const rateRes = await pool.query(
          `SELECT amount FROM fee_rates 
           WHERE fee_id = $1 AND effective_date <= $2 
           ORDER BY effective_date DESC LIMIT 1`,
          [fee.fee_id, thisMonth]
        );
  
        if (rateRes.rowCount > 0) {
          const amount = rateRes.rows[0].amount;
  
          // Gunakan ON CONFLICT agar tetap aman
          await pool.query(
            `INSERT INTO unit_fees (unit_id, fee_id, due_date, amount_due, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (unit_id, fee_id, due_date) DO NOTHING`,
            [unit.unit_id, fee.fee_id, thisMonth, amount, 'unpaid']
          );
        }
      }
    }
}
  
  