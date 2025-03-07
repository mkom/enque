import { pool } from '../../../../lib/db';
import { read, utils } from "xlsx";
import { apiKeyMiddleware } from '../../../../middleware/apiKeyMiddleware';
import { NextResponse } from "next/server";

export async function POST(req) {
    let transactionStarted = false; // Menandai apakah transaksi telah dimulai

    try {
        apiKeyMiddleware(req);

        // Ambil file dari form-data
        const formData = await req.formData();
        const file = formData.get('file'); 
        //const statusPeriod = formData.get('statusPeriod'); 
        const tenantId = formData.get('tenantId');


        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
        }

        // if (!statusPeriod || !tenantId) {
        //     return NextResponse.json({ error: "Parameter statusPeriod dan tenantId diperlukan" }, { status: 400 });
        // }

        if (!tenantId) {
          return NextResponse.json({ error: "Gagal impor data" }, { status: 400 });
      }

        // Simpan file ke buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        let records = [];
        if (file.name.endsWith(".csv") || file.name.endsWith(".xlsx")) {
            const workbook = read(fileBuffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            records = utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            return NextResponse.json({ error: "Format file tidak valid, hanya .csv dan .xlsx yang diterima" }, { status: 400 });
        }

        if (records.length === 0) {
            return NextResponse.json({ error: "File kosong atau format salah" }, { status: 400 });
        }

        await pool.query('BEGIN'); 
        transactionStarted = true; // Menandai bahwa transaksi telah dimulai

        const memberStatus = "occupied";
        let errors = [];

        for (const record of records) {
            const { nama, no_rumah, no_hp } = record;

            const existingMember = await pool.query(
                "SELECT * FROM members WHERE house_number = $1",
                [no_rumah]
            );

            if (existingMember.rows.length > 0) {
                errors.push(`No Rumah ${no_rumah} sudah terdaftar`);
                continue; // Skip proses insert jika alamat sudah ada
            }

            const memberResult = await pool.query(
                "INSERT INTO members (member_name, house_number, no_hp, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *",
                [nama, no_rumah, no_hp, tenantId]
            );

            const memberId = memberResult.rows[0].member_id;

            const queryPeriodDefault = `
              SELECT 
                  fr.effective_date
              FROM public.fee_rates fr
              WHERE fr.effective_date = (
                  SELECT MIN(effective_date) 
                  FROM public.fee_rates 
                  WHERE fee_id = fr.fee_id
              )
              AND fr.fee_id IN (
                  SELECT fee_id FROM public.fees 
                  WHERE tenant_id = $1 
                  AND is_recurring = 'true'
              )
              ORDER BY fr.fee_id;

            `;

            const getPeriodDefault = await pool.query(queryPeriodDefault,[tenantId]);
            const statusPeriod = getPeriodDefault.rows[0].effective_date;

           // console.log(statusPeriod)

            await pool.query(
                "INSERT INTO member_status_history (status, status_date, member_id) VALUES ($1, $2, $3)",
                [memberStatus, statusPeriod, memberId]
            );
        }

        await pool.query('COMMIT');

        if (errors.length > 0) {
            return NextResponse.json({ message: "Data berhasil diimpor dengan beberapa kesalahan", errors }, { status: 206 });
        }

        return NextResponse.json({ message: "Data berhasil diimpor" }, { status: 200 });

    } catch (error) {
        if (transactionStarted) {
            await pool.query('ROLLBACK'); // Rollback hanya jika transaksi sudah dimulai
        }
        console.error("Error import data:", error);
        return NextResponse.json({ error: "Terjadi kesalahan saat mengimpor data" }, { status: 500 });
    }
}
