import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { read } from "xlsx";

const src = "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";

// Attempt 1: SheetJS Names with all props
const wb = read(src, { type: "file" });
const names: any[] = ((wb as any).Workbook || {}).Names || [];
console.log("SheetJS Names count:", names.length);
const sample = names.find((n) => /^(BS_|Sales_SKR|Monthlydata)/i.test(String(n.Name || "")));
if (sample) console.log("Sample keys:", Object.keys(sample), JSON.stringify(sample).slice(0, 600));

// Attempt 2: copy locally then extract workbook.xml
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xlsb-"));
const local = path.join(tmp, "book.xlsb");
fs.copyFileSync(src, local);
let xml = "";
try {
  execSync(`unzip -o "${local}" xl/workbook.xml -d "${tmp}"`, { stdio: "pipe" });
} catch {
  execSync(`tar --force-local -xf "${local}" -C "${tmp}" xl/workbook.xml`, { stdio: "pipe" });
}
xml = fs.readFileSync(path.join(tmp, "xl/workbook.xml"), "utf8");
const defs = xml.match(/<definedName[^>]*>[\s\S]*?<\/definedName>/g) || [];
console.log("\nXML defined names:", defs.length);
for (const d of defs) {
  const name = (d.match(/name="([^"]+)"/) || [])[1];
  const text = (d.match(/>([\s\S]*)<\/definedName>/) || ["", ""])[1];
  const clean = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#10;/g, " ");
  if (/^(BS_|Sales_|OtherSales|Monthlydata|TB_|Sales_Return|Salesreturn|Sales_return)/i.test(name || "")) {
    console.log(`\n${name} => ${clean.slice(0, 600)}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
