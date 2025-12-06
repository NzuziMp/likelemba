import * as XLSX from 'xlsx';

export interface ImportedMember {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  membership_amount: number;
  receipt_order: number;
}

export interface ImportResult {
  success: boolean;
  members: ImportedMember[];
  errors: string[];
}

export const parseImportFile = async (file: File): Promise<ImportResult> => {
  const errors: string[] = [];
  const members: ImportedMember[] = [];

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);

    if (rows.length === 0) {
      return {
        success: false,
        members: [],
        errors: ['The file is empty or has no data rows.'],
      };
    }

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      const fullName = row['full_name'] || row['Full Name'] || row['name'] || row['Name'];
      if (!fullName || String(fullName).trim() === '') {
        rowErrors.push(`Row ${rowNumber}: Missing full name`);
      }

      const email = row['email'] || row['Email'];
      if (!email || String(email).trim() === '') {
        rowErrors.push(`Row ${rowNumber}: Missing email`);
      } else if (!isValidEmail(String(email))) {
        rowErrors.push(`Row ${rowNumber}: Invalid email format`);
      }

      const phone = row['phone'] || row['Phone'];
      if (!phone || String(phone).trim() === '') {
        rowErrors.push(`Row ${rowNumber}: Missing phone`);
      }

      const membershipAmount = row['membership_amount'] || row['Membership Amount'] || row['amount'] || row['Amount'];
      if (!membershipAmount || isNaN(Number(membershipAmount)) || Number(membershipAmount) <= 0) {
        rowErrors.push(`Row ${rowNumber}: Invalid membership amount`);
      }

      const receiptOrder = row['receipt_order'] || row['Receipt Order'] || row['order'] || row['Order'] || row['position'] || row['Position'];
      if (!receiptOrder || isNaN(Number(receiptOrder)) || Number(receiptOrder) <= 0) {
        rowErrors.push(`Row ${rowNumber}: Invalid receipt order`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        members.push({
          full_name: String(fullName).trim(),
          email: String(email).trim().toLowerCase(),
          phone: String(phone).trim(),
          address: row['address'] || row['Address'] ? String(row['address'] || row['Address']).trim() : undefined,
          membership_amount: Number(membershipAmount),
          receipt_order: Number(receiptOrder),
        });
      }
    });

    const duplicateEmails = findDuplicates(members.map(m => m.email));
    if (duplicateEmails.length > 0) {
      errors.push(`Duplicate emails found: ${duplicateEmails.join(', ')}`);
    }

    const duplicateOrders = findDuplicates(members.map(m => m.receipt_order));
    if (duplicateOrders.length > 0) {
      errors.push(`Duplicate receipt orders found: ${duplicateOrders.join(', ')}`);
    }

    return {
      success: errors.length === 0,
      members,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      members: [],
      errors: [`Failed to parse file: ${error.message}`],
    };
  }
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const findDuplicates = (arr: (string | number)[]): (string | number)[] => {
  const seen = new Set();
  const duplicates = new Set();

  arr.forEach(item => {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  });

  return Array.from(duplicates);
};

export const downloadTemplate = () => {
  const template = [
    {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      membership_amount: 100,
      receipt_order: 1,
    },
    {
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      address: '456 Oak Ave',
      membership_amount: 100,
      receipt_order: 2,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

  XLSX.writeFile(workbook, 'members_template.xlsx');
};
