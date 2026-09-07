import { read, utils } from "xlsx";
const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });
const ws = wb.Sheets["Loan-SVN"];
const ref = ws["!ref"] as string;
console.log("REF:", ref);
const lastCol = ref.split(":")[1].replace(/\d/g, "");
const lastRow = Number(ref.split(":")[1].replace(/\D/g, ""));
console.log("lastCol:", lastCol, "lastRow:", lastRow);

// print rows 1-8 across all columns to map header structure
for (let r = 1; r <= 8; r++) {
  const parts: string[] = [`R${r}`];
  let colNum = 1;
  while (colNum <= 60) {
    let letter = "";
    let n = colNum;
    while (n > 0) { const rem = (n - 1) % 26; letter = String.fromCharCode(65 + rem) + letter; n = Math.floor((n - 1) / 26); }
    const v = ws[letter + r]?.v;
    if (v !== undefined && v !== "") parts.push(`${letter}=${String(v).slice(0, 28)}`);
    colNum++;
  }
  console.log(parts.join(" | ").slice(0, 900));
}

// sample data rows: first row of each FY block + SAP Closing rows
console.log("\n--- month-row samples (col A,B) ---");
const seen = new Set<string>();
for (let r = 4; r <= lastRow; r++) {
  const a = ws["A" + r]?.v, b = ws["B" + r]?.v;
  if (a !== undefined && String(a).trim() !== "") {
    const key = String(a);
    if (!seen.has(key) && seen.size < 40) { seen.add(key); 
      const d = ws["D" + r]?.v, e = ws["E" + r]?.v, f = ws["F" + r]?.v;
      console.log(`R${r}: A=${a} B=${b ?? ""} | D=${d ?? ""} E=${e ?? ""} F=${f ?? ""}`);
    }
  }
}
