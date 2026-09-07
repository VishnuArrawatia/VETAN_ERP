import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];
const bs = wb.Sheets["BS Summary"];
const tb = wb.Sheets["Master-TB-Sakar"];
console.log("New PL !ref:", pl["!ref"]);
console.log("BS Summary !ref:", bs["!ref"]);
console.log("Master-TB-Sakar !ref:", tb["!ref"]);

// scan whole New PL for any cell beyond row 1000
const range = utils.decode_range(pl["!ref"]);
console.log("PL max row in ref:", range.e.r + 1);
const keys = Object.keys(pl).filter((k) => !k.startsWith("!"));
let maxRow = 0;
for (const k of keys) {
  const r = utils.decode_cell(k).r;
  if (r > maxRow) maxRow = r;
}
console.log("PL max row with any cell:", maxRow + 1, " (total cells:", keys.length, ")");
// list cells beyond row 200 if any
const far = keys.filter((k) => utils.decode_cell(k).r >= 200).slice(0, 20);
console.log("Cells beyond row 200:", far.length ? far.join(", ") : "NONE");
