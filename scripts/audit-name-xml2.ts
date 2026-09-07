import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const src = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xlsb-"));
try {
  execSync(`unzip -o "${src}" xl/workbook.xml -d "${tmp}"`, { stdio: "pipe" });
} catch {
  execSync(`tar -xf "${src}" -C "${tmp}" xl/workbook.xml`, { stdio: "pipe" });
}
const xml = fs.readFileSync(path.join(tmp, "xl/workbook.xml"), "utf8");
const defs = xml.match(/<definedName[^>]*>[\s\S]*?<\/definedName>/g) || [];
console.log("Total defined names:", defs.length);
for (const d of defs) {
  const name = (d.match(/name="([^"]+)"/) || [])[1];
  const text = (d.match(/>([\s\S]*)<\/definedName>/) || ["", ""])[1];
  const clean = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  if (/^(BS_|Sales_|OtherSales|Monthlydata|TB_|Sales_Return|Salesreturn|Sales_return)/i.test(name || "")) {
    console.log(`\n${name} => ${clean.slice(0, 500)}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
