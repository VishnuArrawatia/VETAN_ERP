import fs from "fs";

const src = fs.readFileSync("scripts/FinancialReport_FixMacros.bas", "utf8");
const lines = src.split(/\r?\n/);
const bad = new Map<string, number[]>();
lines.forEach((ln, i) => {
  for (const ch of ln) {
    const code = ch.codePointAt(0)!;
    // Windows-1252 safe zone: 0x20-0x7E plus common cp1252 chars (em-dash etc.)
    if (code > 0x7e) {
      const arr = bad.get(ch) || [];
      arr.push(i + 1);
      bad.set(ch, arr);
    }
  }
});
if (bad.size === 0) {
  console.log("✅ Sab ASCII-safe hai — import me character issue nahi.");
} else {
  console.log("Non-ASCII characters found:");
  for (const [ch, lns] of bad) {
    console.log(`  "${ch}" U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")} — lines: ${lns.slice(0, 8).join(", ")}${lns.length > 8 ? ` (+${lns.length - 8} more)` : ""}`);
  }
}
// Also verify structure: Option Explicit, Sub/End Sub balance
let subs = 0, ends = 0;
for (const ln of lines) {
  const t = ln.trim();
  if (/^(Public |Private )?Sub\s/.test(t)) subs++;
  if (/^End Sub$/.test(t)) ends++;
  if (/^(Public |Private )?Function\s/.test(t)) subs++;
  if (/^End Function$/.test(t)) ends++;
}
console.log(`\nSub/Function count: ${subs}, End count: ${ends} ${subs === ends ? "✅ balanced" : "❌ MISMATCH"}`);
console.log("First line:", JSON.stringify(lines[0]));
// BOM check
const buf = fs.readFileSync("scripts/FinancialReport_FixMacros.bas");
console.log("BOM present:", buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? "YES (import issue ho sakta)" : "no");
// CRLF check
console.log("Line endings:", src.includes("\r\n") ? "CRLF ✅" : "LF only (VBA prefers CRLF)");
