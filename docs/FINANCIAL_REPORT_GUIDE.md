# Financial Report — Fix & Maintenance Guide

**File:** `E:\Account Master\A-Sakar\7. Management MIS\Monthly MIS\Financial Report\FY-2026-27\Revised Group-Summary as on 31.08.26.xlsb`

---

## Part 1 — One-time fixes (run the macro)

**Macro file:** `scripts/FinancialReport_FixMacros.bas`

### Steps
1. Workbook open karo (macros enable karke).
2. `Alt+F11` → File → Import File… → `FinancialReport_FixMacros.bas` select karo.
3. `Alt+F8` → **`FixAll_FinancialReport`** run karo.
4. Done-msg aayega; backup same folder me `BACKUP_pre-fix_<date>.xlsb` naam se ban jayega.

### Kya fix hoga
| # | Fix | Detail |
|---|-----|--------|
| 1 | **DSCR sheet rebuild** | `I8/I9` ke `#REF!` hata diye; SVN EBITDA ab real `'New PL'!AE51` hai (PBT×82.5% nahi); Principal+Interest ab Loan-SVN schedule (rows 68–80 = next-12-months Sep-26→Aug-27) se aata hai. Expected SVN DSCR ≈ **3.3** |
| 2 | **Broken named ranges cleanup** | ~40 dead names (`Apr_11`, `SKR_BS`, `SVN_PL`, `Grp_Smry_Flr_*`…) jo deleted sheet ko point karte the |
| 3 | **Tax rate input cell** | `New PL!B65` me rate daalo (default 25.17%); O63/AD63 + monthly C63:N63 ab is cell se driven. Rate badalna ho to sirf B65 edit karo |
| 4 | **TB/BS date headers fix (sab FORMULAS)** | **Root cause**: BS Summary TB row-1 ki dates se MATCH karta hai. SAKAR TB me May–Aug ki dates 1-tarikh wali thi (1-May, 1-Aug...), aur BS Summary ki apni dates stale thi (31-May-**2024**, Aug missing). Ab dates **editable Excel formulas** hain — anchor cell + EDATE chains (neeche "Formula edit kahan karni hai" table dekho). BS Summary row-2 ki dates ab TB cells ko reference karti hain → **August-26 automatic flow karega** |
| 5 | **SAKAR DSCR principal** | `F11` ab BS ke TL balances (Mar-26 vs Aug-26 decline × 12/5) se annualized — Loan-SVN me sirf SVN ka schedule hai. **Jab SAKAR ka loan schedule mile, real values daalo** |
| 6 | **New PL automation** | SVN ka monthly tax/PAT chain (`R63:AC64`) add hua (pehle sirf YTD tha) + `AC51` ke `#REF!` fix (`=+AC14+AC9-AC49`) |
| 7 | **Auto-Check sheet** | Nayi validation sheet — TB net≈0, R&S vs PAT, DSCR ≥1, tax chain — sab formulas, naya TB paste karte hi recalc |
| 8 | **Drill-Down sheet** | Group-head dropdown → TB se account-wise breakup (FILTER-based, detail Part 1-D me) |
| — | **SVN TB "Total" (T) column** | Macro ise **touch nahi karta** — ye hidden helper columns (XFK:XFW) se current-month total nikaalta hai aur pehle se sahi hai |

### Verification (macro ke baad)
- `DSCR!J15` ≈ **3.32** (SVN: EBITDA 546.26 ÷ debt-service 164.7) — principal 150.92 + interest 13.81 L (Sep-26→Aug-27 schedule)
- `DSCR!G15` — SAKAR (principal ab annualized proxy hai; review karo)
- `Formulas → Name Manager` me ab `#REF!` wale names nahi hone chahiye
- `New PL!O64` = PBT − tax; `B65` edit karke PAT change hota dikhe
- **BS Summary Aug-26 column (F/L) me ab real values aani chahiye.** Spot-check (expected, lakhs):

| BS Row (SAKAR) | Aug-26 expected | BS Row (SVN) | Aug-26 expected |
|---|---|---|---|
| HDFC Cash Credit (R8) | **123.11 Dr** | Cash Credit (R8) | 62.31 (Cr side) |
| Trade Payable (R15) | 284.82 | Trade Payable (R15) | 54.51 |
| Cash & Bank (R29) | **−153.12 ⚠️** | Inventory (R32) | 274.66 |
| Inventory (R32) | 341.58 | GST Dept (R33) | 352.96 |
| Receivables (R30) | 52.39 | Receivables (R30) | 286.10 |

⚠️ **SAKAR Cash negative** = ya to bank OD galat grouping me hai, ya Mar-26 column (D) me OD nahi tha. D8 (Mar) vs F8 (Aug) dono dekho — agar Mar me cash theek tha aur Aug me negative hai to bank accounts TB me reclassify hone chahiye.

---

## Part 1-B — Formula edit kahan karni hai (sab kuch formulas hai, VBA ki zaroorat nahi)

| Kya badalna hai | Cell | Current formula | Kya karna hai |
|---|---|---|---|
| **SAKAR months roll karna** | `Master-TB-Sakar!K1` | `=DATE(2026,5,31)` | Sirf ye anchor edit karo — L1:N1 (`=EDATE(...)`), U1 (`=EOMONTH($K$1,-2)`) aur BS Summary dates khud update honge |
| **SVN months roll karna** | `Master-TB-SVN!H1` | `=DATE(2026,4,30)` | Sirf ye anchor edit karo — I1:S1 EDATE-chain se follow karte hain |
| **Income-tax rate** | `New PL!B65` | `25.17%` | Rate badlo — O63/AD63, monthly C63:N63 aur PAT rows sab recalc honge |
| **SAKAR DSCR principal** | `DSCR!F11` | `=MAX(0,(('BS Summary'!D10+'BS Summary'!D11)-('BS Summary'!F10+'BS Summary'!F11))*12/5)` | Real loan schedule mile to isko schedule-sum se replace karo (formula hi rakhna, value paste na karo) |
| **SVN DSCR schedule window** | `DSCR!I9`, `I11` | `=SUM('Loan-SVN'!$F$68:$F$80,...)/100000` | Agle saal schedule shift ho to rows 68:80 badalna |
| **BS manual patches** | `BS Summary` D/F cols | e.g. `+421.55` hardcoded | TB data ab real flow kar raha hai — in patches ko review karke hatao ya TB me merge karo |

---

## Part 1-C — PL & BS kaise AUTO banati hai (architecture)

Aapki requirement ("PL & BS automation se ban sakti h") already formula-level par kaam karti hai — ye samajhna important hai:

**New PL (C:N = SAKAR months, R:AC = SVN months):**
- Har month-column ki saari rows `TB_SKR` / `TB_SVN` named ranges se **label-match** karke TB balances kheenchti hain → TB me naya month paste karo, PL khud update
- Subtotals upar se chain hote hain (`C51 = +C14+C9-C49`, `C62 = +C56-C59-C60`)
- Tax = `C63 = C62*$B$65`, PAT = `C62-C63` → sirf **B65 me rate** badlo
- YTD (`O`/`AD`) = `SUM(monthly)`, Lakhs (`P`/`AE`) = `YTD/100000`

**BS Summary (D/E/F = SAKAR, K/L = SVN):**
- Row-2 dates formulas hain: D2/K2 = opening Mar-26 (TB anchor ref), **F2/L2 = LOOKUP formula jo latest completed FY month dhundhta hai** (`>=DATE(2026,4,1)` aur `<=TODAY()`) → TB me naya month aate hi BS ka current column khud us par jump karta hai
- Har row `BS_Liability_SKR/SVN`, `BS_Assets_SKR/SVN` named ranges se **grouping-label match** karke balance leti hai

**Monthly routine ab bas itna hai:**
1. SAKAR TB: next column me `=EDATE($N$1,1)` + Sep balances paste (DataTB se)
2. SVN TB: next column me sirf balances paste (dates pehle se EDATE-chain me hain)
3. `New PL` me next monthly column copy (formulas pattern same rahega, tax chain khud chalegi)
4. **Auto-Check sheet kholo — sab "OK" hona chahiye** (REVIEW aaye to wahi dekho)5. BS Summary F/L column me naye month ke values aa gaye honge — koi date edit ki zaroorat nahi

## Part 1-D — Drill-Down: group head pe click/dropdown se account breakup

**'Drill-Down' sheet** (macro Step 8 se banti hai) — statement me kisi bhi group head ka account-wise breakup dekhne ke liye:

| Cell | Kya hai |
|---|---|
| `B2` | Entity dropdown — **SAKAR / SVN** |
| `B3` | **Group Head dropdown** — sirf wahi heads jo TB grouping me exist karte hain (SAKAR TB col-G + SVN TB col-B se) |
| `B4` | **As-on date** (default `=TODAY()`, edit karke koi bhi month dekh sakte ho — 31-Aug-26 type karo) |
| Row 8 se | **Dynamic spill**: G/L code, account name, us month ka balance, share % — sab FILTER formula se |
| `D6` | Selected group ka total |

**Kaam kaise karta hai (sab editable formulas):**
- `D8` = `FILTER` + `CHOOSE(MATCH(B2,...))` — entity ke TB se wo rows nikaalta hai jinka group-label `B3` se match karta hai, aur `MATCH(B4, dates, 1)` se **us date tak ka latest month column** uthata hai
- Group-head list sheet ke hidden `Z` column me hai — naya TB group add karo to dropdown khud include ho jayega (macro dobara chalana hoga list refresh ke liye, ya Z column khud update kar lo)
- Excel **365** chahiye (FILTER/spill). Purane Excel me dropdown chalega par spill nahi — B8 me message dikhega

**Mapping-gaps jo drill-down ne pakde (TB me theek karna hoga):**
1. **SVN TB me "Forex Gain/Loss" group hi nahi** → PL ki Forex row SVN ke liye hamesha 0
2. **Orphan groups** (TB me hain, statements me kabhi nahi aate): SVN me "Other Income" (18 accounts!), "Sales & Distribution Exp" (2), "Direct Exp" (2), "Total" — inhe TB grouping me sahi PL/BS label do
3. SAKAR "Change in inventory" group me 1 account hai, isliye change calc sirf closing level par hai — opening linkage manual hai

---

## Part 2 — Known issues jo manual hain (macro inko nahi chhedta)

1. ~~**BS Summary purana hai**~~ — **Macro se fix ho gaya** (TB date headers month-end set kiye, Aug-26 ab flow karta hai). Lekin BS ke D/F columns me kuch **manual add-on patches** hain (jaise `+421.55`, `(53154903-11000000)/100000`) jo TB ke alawa extra amount jodte the — ab real TB data aayega to **ye double-count kar sakte hain**. Ek baar review karke hardcode patches hatana.
2. **SVN PBT negative (Apr–May: −34.56 L)** lekin SVN side me tax/PAT formulas blank hain — R63:AC63/64 range me chain add karni hogi jaise SAKAR ki add hui. (YTD AD63/AD64 theek hai.)
3. `Gross Margine %` spelling, `R27` stray value (−6.61), labour analysis rows R71–85 sirf April me bhare hain.
4. **GST balances Lakhs me nahi** (`I2 = 2.34 Cr` raw) — ya scale badlo ya header me "₹" likho.
5. ~~SVN TB "Total" column~~ — **clarified**: T = hidden helper columns se current-month total, sahi hai, macro nahi chhedta.

---

## Part 3 — Monthly automation options

**A. Rollover macro (recommended, sheet-native)**
Har month: naya month column insert, EOMONTH header auto-update, TB masters me "September - Balance" column ready, validation checks run. Ek button `Run_Monthly_Rollover`.

**B. Validation dashboard sheet**
`TB total vs BS Summary`, `BS retained earnings vs PL PAT`, `CN/IWSR rejections vs PL rows`, `DSCR sanity` — har check pass/fail + red flag.

**C. Data-refresh pipeline (Node/SheetJS — already isi project me hai)**
ERP dumps (CN, IWSR, FG Purchase) paste → script verify kare row counts, duplicates, month-wise totals → report compare kare pichhle month se. Parse-only hota hai, file ko Excel me hi save karna padta hai.

---

## Part 4 — Verification scripts (project me already hain)

- `scripts/inspect-financial-report.ts` — structure overview
- `scripts/diagnose-financial-report*.ts` — errors, named ranges, PL layout
- `scripts/verify-dscr-inputs*.ts` — DSCR ke input values
- Run: `npx tsx scripts/<file>.ts`

---

## Snapshot (as scanned, 31.08.26 file)

| Metric | SAKAR (YTD) | SVN (YTD) |
|---|---|---|
| Sales | ₹42.82 Cr | ₹75.55 Cr |
| Gross Margin | ~14.9–19.5% monthly | — |
| EBITDA | ₹259.63 L | ₹546.26 L |
| Finance Cost | ₹26.58 L | ₹146.33 L |
| PBT | ₹216.36 L | ₹304.96 L |

*SVN PBT note: YTD 304.96 L me Apr–May ka −34.56 L included hai; monthly trend strong recovery dikha raha hai.*
