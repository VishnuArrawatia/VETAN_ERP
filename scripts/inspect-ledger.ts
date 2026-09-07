import { read, utils } from "xlsx";

const filePath = "D:/c drive/Desktop/Surya Roshni, Ledger reconcilation (Aug-26).xlsx";
const wb = read(filePath, { type: "file" });

console.log("📄 Sheets:", wb.SheetNames);
console.log("");

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const json = utils.sheet_to_json(ws, { header: 1, defval: "" });
  console.log(`\n=== Sheet: "${name}" (${json.length} rows) ===`);
  // Print first 20 rows to understand structure
  for (let i = 0; i < Math.min(25, json.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(json[i]));
  }
}
