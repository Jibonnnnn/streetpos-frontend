/**
 * Opens a clean print window for the element with id="receipt-print-area".
 * Uses a narrow thermal-friendly page size.
 */
export function printReceipt() {
  const area = document.getElementById("receipt-print-area");
  if (!area) {
    console.warn("receipt-print-area not found");
    return;
  }

  const win = window.open("", "_blank", "width=420,height=700");
  if (!win) {
    window.print();
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            margin: 0;
            padding: 8px;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
          }
          @media print {
            @page {
              margin: 4mm;
              size: 80mm auto;
            }
            body {
              width: 72mm;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>${area.innerHTML}</body>
    </html>
  `);
  win.document.close();
  win.focus();

  setTimeout(() => {
    win.print();
  }, 250);
}