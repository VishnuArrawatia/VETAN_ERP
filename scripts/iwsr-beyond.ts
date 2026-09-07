import { read, utils } from "xlsx";
const p = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(p, { type: "file", cellDates: true });
const ws = wb.Sheets["IWSR-SKR"];
const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
// header full
const hdr = rows[0];
console.log("HDR:", hdr.map((c, i) => `${i}:${String(c ?? "").slice(0, 16)}`).join(" | "));
// For rows 3580..3620, scan full width for numbers
function nums(r: any[]): { i: number; v: number }[] {
  const out: { i: number; v: number }[] = [];
  r.forEach((c, i) => { if (typeof c === "number" && c !== 0) out.push({ i, v: c }); });
  return out;
}
for (let i = 3580; i < 3620 && i < rows.length; i++) {
  const r = rows[i] || [];
  const n = nums(r);
  if (n.length) {
    console.log(`R${i + 1}: nums=${n.map(x => `${x.i}:${x.v}`).join(",")} | text-cols:`, r.map((c, ci) => (typeof c === "string" && c.trim() ? `${ci}:"${c.slice(0, 14)}"` : "")).filter(Boolean).slice(0, 6).join(" "));
  }
}
// count rows with any number in amount-ish columns (index >= 27) beyond 3580
let withAmt = 0, checked = 0;
for (let i = 3580; i < rows.length; i++) {
  const r = rows[i] || [];
  checked++;
  if (r.some((c, ci) => ci >= 27 && typeof c === "number" && c !== 0)) withAmt++;
}
console.log(`rows 3581..${rows.length}: checked=${checked} withAmount(col>=28)=${withAmt}`);