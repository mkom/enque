// app/api/bills/print/route.js
import puppeteer from "puppeteer";
import genarateBill from "@/utils/pdf/generateBill";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const unitId = searchParams.get("unitId");
  const feeId = searchParams.get("feeId");
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(
        'Unauthorized',
        'Authorization header missing or malformed',
        401
        );
    }

    const token = authHeader.split(' ')[1];


  if (!unitId || !feeId) {
    return new Response("Missing unitId or feeId", { status: 400 });
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/fee/bills/${unitId}/${feeId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
        'Authorization': `Bearer ${token}`,
    },
  });
  
  const billsData = await res.json();

  const html = genarateBill(billsData.data);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=tagihan-${unitId}.pdf",
    },
  });
}
