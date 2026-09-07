import { read, utils } from "xlsx";
import fs from "fs";
import path from "path";

// search all xlsx in E:/Account Master/A-Sakar/11. Data/Loans/
const dir = "E:/Account Master/A-Sakar/11. Data/Loans";
console.log("Files in Loans dir:");
for (const f of fs.readdirSync(dir)) {
  const st = fs.statSync(path.join(dir, f));
  console.log(`  ${f} (${(st.size / 1024).toFixed(0)}KB, ${st.mtime.toISOString().slice(0, 10)})`);
}

const targets = ["802920431", "803641167", "8817320000005890", "8817320000005951", "DBS"];
const search = (p: string) => {
  try {
    const wb = read(p, { type: "file" });
    for (const sn of wb.SheetNames) {
      const w = wb.Sheets[sn];
      const ref = w["!ref"] as string;
      if (!ref) continue;
      const lastR = Number(ref.split(":")[1].replace(/\D/g, ""));
      const lastC = ref.split(":")[1].replace(/\d/g, "");
      const lastCN = lastC.split("").reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);
      for (let r = 1; r <= Math.min(lastR, 6); r++) {
        for (let c = 0; c <= Math.min(lastCN, 30); c++) {
          const v = w[utils.encode_col(c) + r]?.v;
          if (v == null) continue;
          const s = String(v);
          for (const t of targets) if (s.includes(t)) return `${path.basename(p)} > ${sn} > ${utils.encode_col(c)}${r}: ${s.slice(0, 50)}`;
        }
      }
    }
  } catch {}
  return null;
};

for (const f of fs.readdirSync(dir)) {
  if (!/\.xlsx?$/i.test(f)) continue;
  const hit = search(path.join(dir, f));
  if (hit) console.log("FOUND:", hit);
}
console.log("search done");
