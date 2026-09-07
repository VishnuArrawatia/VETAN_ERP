import * as xlsx from "xlsx";
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "mis");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "mis-config.json"), "utf-8"));
const TPL = path.join(CFG.dataDir, "templates");

fs.mkdirSync(TPL, { recursive: true });
fs.mkdirSync(CFG.stockUploads.dir, { recursive: true });
fs.mkdirSync(CFG.loanUploads.dir, { recursive: true });

// ---------- STOCK template ----------
const stockRows = [
  ["Company", "FY", "Month", "Item No", "Item Description", "Item Group", "Opening Qty", "Produced Qty", "Sold Qty", "Closing Qty", "Closing Value (Rs)", "Last Sale Month", "Last Sale Date"],
  ["SAKAR", "FY-2026-27", "Aug", "FGJCDBAP507", "5W Led Deep Junction Box DOB Novo", "FG - Junction Box", 1000, 5000, 4200, 1800, 216000, "2026-08", "2026-08-28"],
  ["SVN", "FY-2026-27", "Aug", "PLPDFR152", "Diffuser - Panel Light", "RM - Panel Light Parts", 500, 2000, 2400, 100, 1318, "2026-08", "2026-08-20"],
];
const wb1 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb1, xlsx.utils.aoa_to_sheet(stockRows), "SAKAR");

// ---------- LOAN template (repayment-schedule format) ----------
const loanRows = [
  ["Company", "FY", "Month", "Loan Name", "Lender", "Opening Balance", "Principal Paid", "Interest Paid", "Closing Balance"],
  ["SAKAR", "FY-2026-27", "Apr", "HDFC Term Loan No. 854", "HDFC Bank", 10500000, 275759, 125000, 10224241],
  ["SAKAR", "FY-2026-27", "May", "HDFC Term Loan No. 854", "HDFC Bank", 10224241, 277263, 123496, 9946978],
  ["SAKAR", "FY-2026-27", "Apr", "HDFC WCDL", "HDFC Bank", 3000000, 0, 45000, 3000000],
  ["SVN", "FY-2026-27", "Apr", "HDFC Term Loan No. 860", "HDFC Bank", 7500000, 0, 62500, 7500000],
  ["SVN", "FY-2026-27", "Apr", "MSME Loan", "SIDBI", 1500000, 0, 13813, 1500000],
];
const wb2 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb2, xlsx.utils.aoa_to_sheet(loanRows), "Loans");
const loanNotes = [
  ["LOAN REPAYMENT SCHEDULE FORMAT - Rules:"],
  ["1. Har loan ke har month ki ek row (Apr se Mar tak - poora FY ek hi file me)"],
  ["2. Opening Balance = pichhle month ka Closing Balance (chain aise hi chalti hai)"],
  ["3. Principal + Interest = EMI/WCDL-interest jo us month me gaya"],
  ["4. Closing Balance = Opening - Principal (interest balance me nahi jata)"],
  ["5. Naya loan ho to us month se naye rows shuru karo (Opening = sanction amount)"],
  ["6. Naya loan prepay/close ho to last row me Closing = 0"],
  ["7. Naya company add ho to bas Company column me uska code (SAKAR/SVN/<naya>)"],
  ["8. Ye file ek baar banao - month-hot ho to har month ki rows jodte jao, phir Reload"],
];
const ws2 = xlsx.utils.aoa_to_sheet(loanNotes);
wb2.SheetNames.push("Rules");
wb2.Sheets["Rules"] = ws2;

// ---------- PAYMENT register template ----------
const payRows = [
  ["Company", "FY", "Month", "Customer Code", "Customer Name", "Amount Received", "Payment Date", "Bank Reference"],
  ["SAKAR", "FY-2026-27", "Aug", "C00021", "POLYCAB INDIA LTD.", 150000, "2026-08-25", "NEFT/HDFC/004512"],
  ["SVN", "FY-2026-27", "Aug", "C00001", "PANASONIC LIFE SOLUTIONS", 250000, "2026-08-28", "RTGS/BOB/778123"],
];
const wb3 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb3, xlsx.utils.aoa_to_sheet(payRows), "Payments");

const stockPath = path.join(TPL, "STOCK-UPLOAD-TEMPLATE.xlsx");
const loanPath = path.join(TPL, "LOAN-UPLOAD-TEMPLATE.xlsx");
const payPath = path.join(TPL, "PAYMENT-UPLOAD-TEMPLATE.xlsx");
fs.writeFileSync(stockPath, xlsx.write(wb1, { type: "buffer", bookType: "xlsx" }));
fs.writeFileSync(loanPath, xlsx.write(wb2, { type: "buffer", bookType: "xlsx" }));fs.writeFileSync(payPath, xlsx.write(wb3, { type: "buffer", bookType: "xlsx" }));
fs.mkdirSync(path.join(CFG.dataDir, "uploads", "payments"), { recursive: true });

// ---------- BUDGET template (user ke real Rent/Interest/Dep numbers ke saath example) ----------
const budRows = [
  ["Company", "FY", "Month", "Head", "Sub-Unit", "Budget Amount", "Remarks"],
  ["SVN", "FY-2026-27", "Apr", "Rent Expenses", "SVN-1", 2103828, "3.90Cr FY total"],
  ["SVN", "FY-2026-27", "Apr", "Rent Expenses", "SVN-2", 1000000, ""],
  ["SAKAR", "FY-2026-27", "Apr", "Rent Expenses", "Sakar-1", 807100, ""],
  ["SAKAR", "FY-2026-27", "Apr", "Rent Expenses", "Sakar-2", 75000, ""],
  ["SAKAR", "FY-2026-27", "Apr", "Rent Expenses", "Sakar-3", 316500, ""],
  ["SVN", "FY-2026-27", "Aug", "Finance Cost-Interest", "CC A/c", 1803021, "loan-wise bhi chalega"],
  ["SVN", "FY-2026-27", "Aug", "Finance Cost-Interest", "Loan A/c", 1051473, ""],
  ["SVN", "FY-2026-27", "Aug", "Finance Cost-Interest", "New Busi loan", 520833, ""],
  ["SVN", "FY-2026-27", "Aug", "Finance Cost-Interest", "Car loan", 4498, ""],
  ["SAKAR", "FY-2026-27", "Aug", "Finance Cost-Interest", "CC A/c", 465000, ""],
  ["SAKAR", "FY-2026-27", "Aug", "Finance Cost-Interest", "Loan A/c", 74415, ""],
  ["SAKAR", "FY-2026-27", "Aug", "Depreciation", "SVN-1", 2048942, "sub-unit me daal sakte ho"],
  ["SAKAR", "FY-2026-27", "Aug", "Depreciation", "Sakar-1", 334814, ""],
  ["SVN", "FY-2026-27", "Aug", "Salary", "SVN-1", 2500000, "naya head - bas row jodo"],
  ["SVN", "FY-2026-27", "Aug", "Sales", "SVN-1", 60000000, "sales budget bhi isi me"],
];
const budNotes = [
  ["BUDGET UPLOAD FORMAT - Rules:"],
  ["1. Har row = Company + FY + Month + Head + Sub-Unit ka budget amount"],
  ["2. Head = PL/BS ka group-name (Rent Expenses, Finance Cost-Interest, Depreciation, Salary, Sales...)"],
  ["3. Sub-Unit optional - SVN-1/SVN-2/Sakar-1... (unit-wise tracking ke liye)"],
  ["4. 3-saal budget: har FY ke liye rows (FY-2026-27, FY-2027-28, FY-2028-29)"],
  ["5. Month me 'Apr'..'Mar' likho - har month alag row (year-total row NAHI)"],
  ["6. Sales/revenue budget bhi isi format me (Head = Sales) - Budget-vs-Actual me aayega"],
  ["7. File uploads\\budget folder me daalo -> Reload Data"],
  ["8. Actual TB ke group se auto-match hoga - head ka naam PL group jaisa hi rakho"],
];
const wb4 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb4, xlsx.utils.aoa_to_sheet(budRows), "Budget");
xlsx.utils.book_append_sheet(wb4, xlsx.utils.aoa_to_sheet(budNotes), "Rules");
const budPath = path.join(TPL, "BUDGET-UPLOAD-TEMPLATE.xlsx");
fs.writeFileSync(budPath, xlsx.write(wb4, { type: "buffer", bookType: "xlsx" }));
fs.mkdirSync(path.join(CFG.dataDir, "uploads", "budget"), { recursive: true });

// ---------- CUSTOMER-MASTER template (group-party links) ----------
const cmRows = [
  ["Group Name", "Full Party Name", "Entity", "Customer Code", "Vendor Code"],
  ["CENTURY LED", "CENTURY LED LIMITED", "SAKAR", "C00005", ""],
  ["CENTURY LED", "CENTURY LED LIMITED", "SVN", "C00112", ""],
  ["PRESS FIT PIPE AND PROFILE", "PRESS FIT PIPE AND PROFILE", "SAKAR", "C00133", ""],
  ["PRESS FIT PIPE AND PROFILE", "PRESS FIT PIPE AND PROFILE", "SVN", "C00078", ""],
  ["EXAMPLE PARTY", "Example Industries Pvt Ltd", "SAKAR", "C00021", "V00123"],
];
const cmNotes = [
  ["CUSTOMER MASTER - Group-party links. Rules:"],
  ["1. Har link = ek row (Group Name + Entity + Customer Code / Vendor Code)"],
  ["2. Ek party jo dono company me customer hai - uske dono codes ki 2 rows (same Group Name)"],
  ["3. Vendor code (rejection-channel) ho to Vendor Code column me daalo"],
  ["4. Naya party = nayi rows - bas Group Name same rakho"],
  ["5. Fill karke is file ko 'CUSTOMER-MASTER.xlsx' naam se uploads folder me daalo -> Reload Data"],
  ["6. Ye Group Customers tab + Customer 360 ka group-rollup banata hai"],
];
const wb5 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb5, xlsx.utils.aoa_to_sheet(cmRows), "Links");
xlsx.utils.book_append_sheet(wb5, xlsx.utils.aoa_to_sheet(cmNotes), "Rules");
const cmPath = path.join(TPL, "CUSTOMER-MASTER-TEMPLATE.xlsx");
fs.writeFileSync(cmPath, xlsx.write(wb5, { type: "buffer", bookType: "xlsx" }));

console.log("Templates written:");
console.log("  " + stockPath);
console.log("  " + loanPath);
console.log("  " + payPath);
console.log("  " + budPath);
console.log("  " + cmPath);
console.log("Upload folders ready:");
console.log("  " + CFG.stockUploads.dir);
console.log("  " + CFG.loanUploads.dir);
