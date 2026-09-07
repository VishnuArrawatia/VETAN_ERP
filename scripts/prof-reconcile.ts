import { read, utils } from "xlsx";
const wb = read("E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb", { type: "file" });
// New PL rows 3-8 (SAKAR)
const rows = utils.sheet_to_json(wb.Sheets["New PL"], { header: 1 }) as any[][];
const months = ["Apr", "May", "Jun", "Jul", "Aug"];
console.log("=== New PL SAKAR monthly (₹) ===");
for (const ri of [2, 3, 4, 5, 6, 7]) {
  const label = String(rows[ri]?.[1] ?? "").trim().slice(0, 24) || `R${ri + 1}`;
  const vals = [rows[ri]?.[2], rows[ri]?.[3], rows[ri]?.[4], rows[ri]?.[5], rows[ri]?.[6]].map(c => (typeof c === "number" ? c : 0));
  console.log(`  ${label.padEnd(26)} ${vals.map(v => (v / 1e7).toFixed(2) + " Cr").join("  ")}`);
}
const sales = (r: number) => (typeof rows[r]?.[2] === "number" ? rows[r][2] : 0);
console.log("\nNote: New PL = SAKAR P&L statement (authoritative, has Jul-Aug)");
console.log("IWSR register me sirf Apr-Jun hai, Jul-Aug IWSR abhi paste nahi hua");