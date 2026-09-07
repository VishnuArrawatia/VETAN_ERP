import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

// Extract workbook.xml directly to read full definedName text (SheetJS truncates refs)
const src = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xlsb-"));
execSync(`"${process.execPath}" -e "const X=require('xlsx');const wb=X.readFile(${JSON.stringify(src)});X.writeFile(wb,${JSON.stringify(path.join(tmp, "out.xlsx"))})"`, { cwd: process.cwd(), stdio: "pipe" });
// simpler: use unzip on the original if possible? .xlsb is a zip too
try {
  execSync(`unzip -o ${JSON.stringify(src)} xl/workbook.xml -d ${JSON.stringify(tmp)}`, { stdio: "pipe" });
} catch {
  execSync(`tar -xf ${JSON.stringify(src)} -C ${JSON.stringify(tmp)} xl/workbook.xml`, { stdio: "pipe" });
}
const xml = fs.readFileSync(path.join(tmp, "xl/workbook.xml"), "utf8");
const defs = xml.match(/<definedName[^>]*name="[^"]+"[^>]*>[\s\S]*?<\/definedName>/g) || [];
console.log("Total defined names:", defs.length);
for (const d of defs) {
  const name = (d.match(/name="([^"]+)"/) || [])[1];
  const text = (d.match(/>([\s\S]*)<\/definedName>/) || ["", ""])[1];
  if (/^(BS_|Sales_|OtherSales|Monthlydata|TB_|Sales_Return|Salesreturn|Sales_return|Sales_SKR|Sales_SVN)/i.test(name)) {
    console.log(`${name} => ${text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").slice(0, 400)}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
