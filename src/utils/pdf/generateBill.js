import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from "@/utils/formatRupiah";

function generateBill(data) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(new Date(date), "MMMM yyyy", { locale: id });
    };

    //console.log(data)
    
    const rows = data[0].items?.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td> ${item?.due_date && `${formatDate(item?.due_date)}`}</td>
        <td class="right"> ${formatRupiah(parseInt(item?.amount_due - item?.amount_paid))}</td>
      </tr>
    `).join("");
  
  
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .info p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
          th { background: #f0f0f0; text-align: left; }
          .right { text-align: right; }
          .total-row td { font-weight: bold; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>Detail Tagihan</h2>
        <div class="info">
          <p><strong>No Unit:</strong> ${data[0].house_number}</p>
          <p><strong>Nama:</strong> ${data[0].unit_name}</p>
          <p><strong>Jenis Iuran:</strong> ${data[0].fee_name}</p>
        </div>
  
        <table>
          <thead>
            <tr><th>No</th><th>Periode</th><th class="right">Jumlah</th></tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="2">Total</td>
              <td class="right"> 
              ${formatRupiah(
                data[0]?.items.reduce(
                      (total, item) =>
                          total + (item?.amount_due - item?.amount_paid),
                      0
                  )
              )}
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
  
  export default generateBill;