export interface InvoiceLineItem {
  srNo: number | string;
  description: string;
  hsnSac?: string;
  qty: number;
  unitPrice: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
  isGroupHeader?: boolean;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  quoteNumber?: string;

  // Issuer Info
  issuerName: string;
  issuerAddress: string;
  issuerContact: string;
  issuerEmail: string;
  issuerGSTIN: string;
  issuerPAN: string;

  // Bill To (Client) Info
  clientName: string;
  clientAddress: string;
  clientCIN?: string;
  clientContact: string;
  clientGSTIN: string;

  // Line items & totals
  items: InvoiceLineItem[];
  totalBeforeTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;

  // Bank Info
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  ifscCode: string;

  // Signatory
  authorisedSignatory: string;

  status: "Draft" | "Pending" | "Paid" | "Overdue";
}

/**
 * Converts a number to Indian Currency Words format
 * e.g. 734083 -> "Seven Lakh Thirty Four Thousand Eighty Three Only"
 */
export function numberToIndianWords(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return "Zero Only";

  const single = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return single[n];
    const digit = n % 10;
    return `${tens[Math.floor(n / 10)]}${digit ? " " + single[digit] : ""}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (hundred > 0) {
      res += `${single[hundred]} Hundred`;
    }
    if (rest > 0) {
      res += `${res ? " " : ""}${convertTwoDigits(rest)}`;
    }
    return res;
  }

  let n = rounded;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  let parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertThreeDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  return `${parts.join(" ")} Only`;
}

export const SAMPLE_INVOICE_DATA: InvoiceRecord = {
  id: "inv-002",
  invoiceNumber: "INV/VGLTMX/002/2026",
  invoiceDate: "18 May 2026",
  quoteNumber: "Q-890243",
  issuerName: "Autonex AI 360 Private Limited",
  issuerAddress: "908, Lodha Supremus, Saki Vihar Road, Powai, Maharashtra, India, 400072",
  issuerContact: "9930769905",
  issuerEmail: "nikhilg@autonexai360.com",
  issuerGSTIN: "27ABDCA3903H1ZX",
  issuerPAN: "ABDCA3903H",

  clientName: "Thermax Limited",
  clientAddress: "D-13 - R.D.Aga Road, MIDC Industrial Area, Chinchwad-Pune-411019, MH-India",
  clientCIN: "L29299PN1980PLC022787",
  clientContact: "Niraj Patil – 70203 22108; Ranaba Waingade - 9011018306",
  clientGSTIN: "27AAACT3910D1ZS",

  items: [
    {
      srNo: 1,
      description: "Custom industrial-grade casings, cable glands & mounts (Jetson + field devices) - 7204001554-00",
      hsnSac: "998314/998316",
      qty: 1,
      unitPrice: 45000,
      taxableValue: 45000,
      cgstRate: 9,
      cgstAmount: 4050,
      sgstRate: 9,
      sgstAmount: 4050,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 53100,
    },
    {
      srNo: 2,
      description: "Safety AI Software Suite - 7204001557-00",
      hsnSac: "998314/998316",
      qty: 1,
      unitPrice: 150000,
      taxableValue: 150000,
      cgstRate: 9,
      cgstAmount: 13500,
      sgstRate: 9,
      sgstAmount: 13500,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 177000,
    },
    {
      srNo: 3,
      description: "Software webapp - 7204001558-00",
      hsnSac: "998314/998316",
      qty: 1,
      unitPrice: 300000,
      taxableValue: 300000,
      cgstRate: 9,
      cgstAmount: 27000,
      sgstRate: 9,
      sgstAmount: 27000,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 354000,
    },
    {
      srNo: 4,
      description: "System integration and on-site commissioning (7204001559-00)",
      hsnSac: "998314/998316",
      qty: 1,
      unitPrice: 60000,
      taxableValue: 60000,
      cgstRate: 9,
      cgstAmount: 5400,
      sgstRate: 9,
      sgstAmount: 5400,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 70800,
    },
    {
      srNo: "",
      description: "Components in IP speaker",
      hsnSac: "998314/998316",
      qty: 8,
      unitPrice: 0,
      taxableValue: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 0,
      isGroupHeader: true,
    },
    {
      srNo: 5,
      description: "Wi-Fi Smart Buzzers / Sirens (7204001548-00)",
      hsnSac: "",
      qty: 8,
      unitPrice: 2438,
      taxableValue: 19504,
      cgstRate: 9,
      cgstAmount: 1755,
      sgstRate: 9,
      sgstAmount: 1755,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 23015,
    },
    {
      srNo: 6,
      description: "ESP32 Controllers (7204001549-00)",
      hsnSac: "",
      qty: 8,
      unitPrice: 1100,
      taxableValue: 8800,
      cgstRate: 9,
      cgstAmount: 792,
      sgstRate: 9,
      sgstAmount: 792,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 10384,
    },
    {
      srNo: 7,
      description: "Power adapters & DC cabling (7204001550-00)",
      hsnSac: "",
      qty: 8,
      unitPrice: 450,
      taxableValue: 3600,
      cgstRate: 9,
      cgstAmount: 324,
      sgstRate: 9,
      sgstAmount: 324,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 4248,
    },
    {
      srNo: 8,
      description: "Mounting brackets / clamps (7204001551-00)",
      hsnSac: "",
      qty: 8,
      unitPrice: 450,
      taxableValue: 3600,
      cgstRate: 9,
      cgstAmount: 324,
      sgstRate: 9,
      sgstAmount: 324,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 4248,
    },
    {
      srNo: 9,
      description: "IP65 junction boxes / protective housings (7204001552-00)",
      hsnSac: "",
      qty: 8,
      unitPrice: 650,
      taxableValue: 5200,
      cgstRate: 9,
      cgstAmount: 468,
      sgstRate: 9,
      sgstAmount: 468,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 6136,
    },
    {
      srNo: 10,
      description: "Short power cables (UPS → buzzer) (7204001553-00)",
      hsnSac: "",
      qty: 8,
      unitPrice: 300,
      taxableValue: 2400,
      cgstRate: 9,
      cgstAmount: 216,
      sgstRate: 9,
      sgstAmount: 216,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 2832,
    },
    {
      srNo: 11,
      description: "LoRa Gateway and Nodes - (7204001556-00)",
      hsnSac: "998314/998316",
      qty: 8,
      unitPrice: 3000,
      taxableValue: 24000,
      cgstRate: 9,
      cgstAmount: 2160,
      sgstRate: 9,
      sgstAmount: 2160,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: 28320,
    },
  ],

  totalBeforeTax: 622104,
  cgstTotal: 55989,
  sgstTotal: 55989,
  igstTotal: 0,
  taxTotal: 111979,
  roundOff: 0,
  grandTotal: 734083,

  bankName: "HDFC Bank",
  bankBranch: "Sharanpur Road Branch",
  accountNumber: "50200113611183",
  ifscCode: "HDFC0001246",

  authorisedSignatory: "NIKHIL SUNIL GAWADE",
  status: "Paid",
};
