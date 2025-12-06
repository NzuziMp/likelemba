import * as XLSX from 'xlsx';

interface PaymentRecord {
  id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  member_phone?: string;
  member_address?: string;
  receipt_order?: number;
  amount_due: number;
  amount_paid: number;
  is_paid: boolean;
  payment_date: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  cycle_number: number;
}

interface MonthlyPayments {
  month: string;
  monthDate: Date;
  cycleNumber: number;
  payments: PaymentRecord[];
  paidCount: number;
  totalCount: number;
}

interface GroupInfo {
  id: string;
  name: string;
  payment_frequency: string;
  payment_method?: string;
  current_cycle: number;
  monthly_amount: number;
  start_date: string;
  end_date?: string;
  number_of_members: number;
  total_per_cycle?: number | null;
  service_fee?: number | null;
}

export const exportToExcel = (
  group: GroupInfo,
  monthlyPayments: MonthlyPayments[]
) => {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['Group Payment Report'],
    [''],
    ['Group Name:', group.name],
    ['Payment Amount per Member:', `$${group.monthly_amount.toFixed(2)}`],
    ['Payment Frequency:', group.payment_frequency],
    ['Payment Method:', group.payment_method || 'N/A'],
    ['Total Members:', group.number_of_members],
    ['Current Cycle:', group.current_cycle],
    ['Start Date:', new Date(group.start_date).toLocaleDateString()],
    ['End Date:', group.end_date ? new Date(group.end_date).toLocaleDateString() : 'N/A'],
    ...(group.total_per_cycle ? [['Total per Cycle:', `$${group.total_per_cycle.toFixed(2)}`]] : []),
    ...(group.service_fee ? [['Service Fee:', `$${group.service_fee.toFixed(2)}`]] : []),
    [''],
  ];

  const allPayments: any[] = [];
  monthlyPayments.forEach((monthData) => {
    allPayments.push([monthData.month, '', '', '', '', '', '']);
    allPayments.push(['Member Name', 'Email', 'Phone', 'Receipt Order', 'Amount', 'Status', 'Paid Date']);

    monthData.payments.forEach((payment) => {
      allPayments.push([
        payment.member_name,
        payment.member_email,
        payment.member_phone || 'N/A',
        payment.receipt_order || 'N/A',
        `$${payment.amount_due.toFixed(2)}`,
        payment.is_paid ? 'PAID' : 'UNPAID',
        payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-',
      ]);
    });

    allPayments.push(['']);
  });

  const finalData = [...summaryData, ...allPayments];

  const worksheet = XLSX.utils.aoa_to_sheet(finalData);

  worksheet['!cols'] = [
    { width: 25 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Report');

  XLSX.writeFile(workbook, `${group.name}_Payment_Report.xlsx`);
};

export const exportToPDF = (
  group: GroupInfo,
  monthlyPayments: MonthlyPayments[]
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to export PDF');
    return;
  }

  const totalPaid = monthlyPayments.reduce((sum, m) => sum + m.paidCount, 0);
  const totalPayments = monthlyPayments.reduce((sum, m) => sum + m.totalCount, 0);
  const overallPercentage = totalPayments > 0 ? (totalPaid / totalPayments) * 100 : 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${group.name} - Payment Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #1e293b;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e293b;
          margin: 0;
        }
        .header p {
          color: #64748b;
          margin: 5px 0;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          background: #f8fafc;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }
        .summary-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
        }
        .cycle {
          margin-bottom: 30px;
          break-inside: avoid;
        }
        .cycle-header {
          background: #3b82f6;
          color: white;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
          font-size: 18px;
          font-weight: bold;
        }
        .cycle-info {
          background: #dbeafe;
          padding: 10px 20px;
          font-size: 14px;
          color: #1e40af;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #cbd5e1;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        tr:hover {
          background-color: #f8fafc;
        }
        .status-paid {
          display: inline-block;
          padding: 4px 12px;
          background-color: #22c55e;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-unpaid {
          display: inline-block;
          padding: 4px 12px;
          background-color: #94a3b8;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .cycle { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${group.name}</h1>
        <p>Payment Report</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Payment Amount</h3>
          <p>$${group.monthly_amount.toFixed(2)}</p>
        </div>
        <div class="summary-card">
          <h3>Total Members</h3>
          <p>${group.number_of_members}</p>
        </div>
        <div class="summary-card">
          <h3>Completion Rate</h3>
          <p>${overallPercentage.toFixed(0)}%</p>
        </div>
        ${group.total_per_cycle ? `
        <div class="summary-card">
          <h3>Total per Cycle</h3>
          <p>$${group.total_per_cycle.toFixed(2)}</p>
        </div>` : ''}
        ${group.service_fee ? `
        <div class="summary-card">
          <h3>Service Fee</h3>
          <p>$${group.service_fee.toFixed(2)}</p>
        </div>` : ''}
        ${group.payment_method ? `
        <div class="summary-card">
          <h3>Payment Method</h3>
          <p style="font-size: 18px;">${group.payment_method}</p>
        </div>` : ''}
      </div>

      ${monthlyPayments
        .map(
          (monthData) => `
        <div class="cycle">
          <div class="cycle-header">${monthData.month}</div>
          <div class="cycle-info">
            Cycle ${monthData.cycleNumber} - ${monthData.paidCount} of ${monthData.totalCount} paid
            (${monthData.totalCount > 0 ? ((monthData.paidCount / monthData.totalCount) * 100).toFixed(0) : 0}%)
          </div>
          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Receipt Order</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              ${monthData.payments
                .map(
                  (payment) => `
                <tr>
                  <td>${payment.member_name}</td>
                  <td>${payment.member_email}</td>
                  <td>${payment.member_phone || 'N/A'}</td>
                  <td>${payment.receipt_order || 'N/A'}</td>
                  <td>$${payment.amount_due.toFixed(2)}</td>
                  <td>
                    <span class="status-${payment.is_paid ? 'paid' : 'unpaid'}">
                      ${payment.is_paid ? 'PAID' : 'UNPAID'}
                    </span>
                  </td>
                  <td>${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        )
        .join('')}

      <div class="footer">
        <p>This report was generated by Likelemba Payment Tracking System</p>
        <p>Group Start Date: ${new Date(group.start_date).toLocaleDateString()} | Payment Frequency: ${group.payment_frequency}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};

export const exportToWord = (
  group: GroupInfo,
  monthlyPayments: MonthlyPayments[]
) => {
  const totalPaid = monthlyPayments.reduce((sum, m) => sum + m.paidCount, 0);
  const totalPayments = monthlyPayments.reduce((sum, m) => sum + m.totalCount, 0);
  const overallPercentage = totalPayments > 0 ? (totalPaid / totalPayments) * 100 : 0;

  let content = `
GROUP PAYMENT REPORT
${group.name}

Generated on: ${new Date().toLocaleDateString()}

========================================
SUMMARY
========================================

Group Name: ${group.name}
Payment Amount per Member: $${group.monthly_amount.toFixed(2)}
Payment Frequency: ${group.payment_frequency}
Payment Method: ${group.payment_method || 'N/A'}
Total Members: ${group.number_of_members}
Current Cycle: ${group.current_cycle}
Start Date: ${new Date(group.start_date).toLocaleDateString()}
End Date: ${group.end_date ? new Date(group.end_date).toLocaleDateString() : 'N/A'}
${group.total_per_cycle ? `Total per Cycle: $${group.total_per_cycle.toFixed(2)}` : ''}
${group.service_fee ? `Service Fee: $${group.service_fee.toFixed(2)}` : ''}
Overall Completion: ${overallPercentage.toFixed(0)}%
Total Paid: ${totalPaid} of ${totalPayments}

========================================
PAYMENT DETAILS BY CYCLE
========================================

`;

  monthlyPayments.forEach((monthData) => {
    const percentage = monthData.totalCount > 0
      ? ((monthData.paidCount / monthData.totalCount) * 100).toFixed(0)
      : 0;

    content += `\n${monthData.month}\n`;
    content += `Cycle ${monthData.cycleNumber} - ${monthData.paidCount} of ${monthData.totalCount} paid (${percentage}%)\n`;
    content += `${'─'.repeat(120)}\n`;
    content += `${'Member Name'.padEnd(20)} ${'Email'.padEnd(30)} ${'Phone'.padEnd(15)} ${'Order'.padEnd(8)} ${'Amount'.padEnd(12)} ${'Status'.padEnd(10)} ${'Paid Date'.padEnd(15)}\n`;
    content += `${'─'.repeat(120)}\n`;

    monthData.payments.forEach((payment) => {
      const memberName = payment.member_name.padEnd(20).substring(0, 20);
      const email = payment.member_email.padEnd(30).substring(0, 30);
      const phone = (payment.member_phone || 'N/A').padEnd(15).substring(0, 15);
      const order = (payment.receipt_order?.toString() || 'N/A').padEnd(8);
      const amount = `$${payment.amount_due.toFixed(2)}`.padEnd(12);
      const status = (payment.is_paid ? 'PAID' : 'UNPAID').padEnd(10);
      const paidDate = (payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-').padEnd(15);

      content += `${memberName} ${email} ${phone} ${order} ${amount} ${status} ${paidDate}\n`;
    });

    content += '\n';
  });

  content += `\n========================================\n`;
  content += `Report generated by Likelemba Payment Tracking System\n`;
  content += `========================================\n`;

  const blob = new Blob([content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${group.name}_Payment_Report.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
