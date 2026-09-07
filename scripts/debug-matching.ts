import * as XLSX from "xlsx";
const { read, utils } = XLSX;

const wb = read("D:/c drive/Desktop/Surya Roshni, Ledger reconcilation (Aug-26).xlsx", { type: "file" });

// Sales sample
const s = utils.sheet_to_json(wb.Sheets["SVN-Sales-Surya Roshni"], { header: 1, defval: "" }) as any[];
console.log("=== SALES SHEET - First 12 entries ===");
for (let i = 2; i < Math.min(14, s.length); i++) {
  console.log(`Row ${i}: Origin=${s[i][2]} No=${s[i][3]} Ref1=${s[i][4]} Bill=${s[i][5]} Ref3=${s[i][6]} Amt=${s[i][9]}`);
}

// Working sample
const w = utils.sheet_to_json(wb.Sheets["Working"], { header: 1, defval: "" }) as any[];
console.log("\n=== WORKING SHEET - First 15 Surya entries ===");
let count = 0;
for (let i = 1; i < w.length && count < 15; i++) {
  if (String(w[i][5]) === "4001472") {
    count++;
    console.log(`Row ${i}: DocType=${w[i][8]} PostDate=${w[i][9]} DocNo=${w[i][11]} Ref=${w[i][12]} Amt=${w[i][14]} Text=${w[i][21]}`);
  }
}

// Also check Purchase sheet
const p = utils.sheet_to_json(wb.Sheets["SVN-Purchase from Surya"], { header: 1, defval: "" }) as any[];
console.log("\n=== PURCHASE SHEET - First 12 entries ===");
for (let i = 2; i < Math.min(14, p.length); i++) {
  console.log(`Row ${i}: Origin=${p[i][2]} No=${p[i][3]} Ref1=${p[i][4]} Bill=${p[i][5]} Ref3=${p[i][6]} Amt=${p[i][9]}`);
}
