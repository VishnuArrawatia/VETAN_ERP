# 📋 Freebuff Threads Index — Master List

> **Ye kaise use kare:** Jab bhi kisi purane topic par kaam karna ho, kisi bhi thread me bas likho:
> *"FREEBUFF_THREADS_INDEX.md padho, [topic] ka section load karo, wahi continue karo"*
> Main wahan se poora context (files, decisions, pending kaam) utha lunga.
>
> **Rule:** Har important kaam khatam hone par main is file ko update karunga (Status, Last-worked, Next step).

---

## Active / Open Threads

| # | Topic (Sheet ka naam) | Status | Last worked | Kahan ka context hai | Next step |
|---|---|---|---|---|---|
| 1 | **Financial Report MIS** (FY-2026-27, Sakar+SVN) | ✅ 8/8 FIXES DONE + macro-module removed (no more popups) | 2026-09-06 | `docs/FINANCIAL_REPORT_GUIDE.md` (E: folder me bhi copy), neeche **Section A** | Baad me: Drill-Down test, networth decision, orphan groups |
| 2 | **MIS Web App** (Section B) | 🟢 v3.18 — TB Review Gate live (validate + AI + Accept) | 2026-09-07 | `mis/` folder + F:\Financial Report | User: Gemini API key (AI-explanations ke liye, optional) + vendor→customer links + June-2025 sales + SVN TB ₹509 Cr opening-check + Jul-Aug IWSR/CN + 2 naye SVN loans + SVN PL-mapping + SVN stock + payment |
| 3 | **Workforce ERP** (F:\Workforce\WORKFORCE-2026.html) | 🟡 App complete, latest build F-drive pe deploy (PF Challan + Commission Rates + Departments sab included). Note: user naye reports ke liye freebuff prefer karta hai — workforce pe sirf chhote fixes | 2026-09-06 | neeche **Section C** | User se F-drive file test karwana |
| 4 | **VETAN ERP** (vetan-svn.vercel.app — SVN Group Payroll/HR) | 🟢 Production live — last fix 02-Sep (cold-start data loss) | 2026-09-02 | git history (219 commits) + neeche **Section D** | Pending list Section D me — payslips Jun–Aug, Loan sync, HOD/Users sync, ESS onboarding |

## Completed Threads

| # | Topic | Kya hua tha | Files | Date |
|---|---|---|---|---|
| — | *(abhi koi nahi — jaise hi koi thread poora hoga, yahan aayega)* | | | |

---

## Section B - MIS Web App — **v3 LIVE: Stock + DSCR + YoY Compare + multi-company** (updated 2026-09-07)

### v3.18 (2026-09-07) — TB REVIEW GATE (validate → AI-explain → OK → Accept)
- **validateTB engine** loader me — 6 checks: Trial-Balance (har month debit=credit, OB + 12 months), Opening/Total-Change (prev-store se diff), **Spike** (latest month vs prior-3-avg, 3x+), Unmapped, Future-Month, Sum-Mismatch (OB+months vs Total-col)
- **tb-review.json** + store.tbReview — severity error/warning/info, status open/ok/accepted + user-note
- **UI: 🛡️ TB Review tab** — cards (Open/OK/Accepted), filter (open/all/ok), har row pe **OK** button (note prompt), **🤖 AI Explanation** (Gemini API — key mis-config `ai.gemini.apiKey` me; **key na ho to offline CA-rules fallback** — CA-explanations Hinglish me), **✅ Accept & Finalise** (open issues force-accept with confirm), **↩️ Re-open** (naya TB)
- **Pehli run results: 49 issues (6 errors)** — SVN TB me Opening ₹509 Cr imbalance (SAP dump check karna), 22 Spike-warnings (Director Travelling Aug 4×), 21 Sum-Mismatch
- Monthly-routine me step-7 add (guide PART-2): TB Review 3-min
- **v3.18.1:** TB history (FY-24-25: 512 ledgers, FY-25-26: 534 ledgers) CSV se load — SAP 42-col UTF-16, **parse-drift 0**, SAP hierarchy se PL/BS auto-classify, PL me OB/Total normalize (revenue ka OB purane saal ka cumulative hai → sirf month-movements count). **TB Review ab CURRENT FY tak hi limited** — history finalized, usme actionable issue nahi dikhta
- **Data-note (next):** FY-24-25 register vs TB Domestic Sale ka ~20% gap (register=item-wise only) — SAP naye dump se reconcile baaki
- **v3.18.2 (07-Sep):** **CSV quote-bug FIX** — loader ke 4 custom CSV-parsers me SAP stray-quotes (`5Mil"`) rows swallow karte the → **45% sales data drop** (FY-24-25: 9,532→17,241 rows ₹46.2→85.3 Cr; FY-25-26: 10,541→13,733 ₹68.6→91.1 Cr). Ab `parseCsvText()` shared robust parser — quote sirf field-start par, beech me literal

### v3.17 (2026-09-07) — FG-Purchase ledger CSV (channel-2 rejection + GRPO/CM split)
- **parseFgPurchaseCsv** loader me — 510101008 FG-Purchase ledger (17-col UTF-16): **PC(A/P Credit Memo)=rejection, PD(GRPO)=normal inward** (rejection me EXCLUDE — warna 13× overstate), OB/JE/PU/BC=skip
- History: 20 credit-memos ₹18L (Apr-24→Mar-26) + current-FY workbook se — total **26 purchase-memos ₹19.7L** channel-2 me
- **Workbook FG-Purchase sheet me bhi docType-tagging** (credit-memo/goods-receipt regex) — server dono jagah GRPO exclude karta hai
- **Vendor-codes (V####) sab UNLINKED** — user CUSTOMER-MASTER template se vendor→customer link karega, phir customer-name auto
- Rejection-report ab do-channel ka total: CN ₹3.92 Cr + purchase-memos ₹19.7L — 3-saal history ke saath

### v3.16 (2026-09-07) — Credit-Note history CSV (3-saal rejection data)
- **parseCreditNoteCsv** loader me — SAP UTF-16 CN-report (34 cols) + fragment-repair v2 (**positional mapping** qty/rate/taxable, tax-code-leak fix) → **99.96% validated**
- `CreditNote-SAKAR-Apr2024-Aug2026.csv` → 8,502 rows (Apr-24→Mar-26) | **uptoMonth=2026-04 overlap-guard** (current-FY workbook CN-SKR se, double-count skip ✓ 1,243 rows)
- **Rejections 10,059 rows**: FY-24-25 ₹1.53Cr / FY-25-26 ₹1.91Cr / FY-26-27 ₹0.80Cr — **~3% consistent rejection-rate**
- Rejection-tab: all-time top customers live (Century ₹90.5L, Kolors ₹62.3L) — Customer-360 me purana bhi include
- SVN CN history pending (E: me SAKAR ki hi CSV thi) — mile to config `creditNoteCsv.files` me ek line

### v3.15 (2026-09-07) — Historical sales CSVs LOADED (3-year data live)
- **SAP B1 UTF-16 CSV direct parser** loader me (`parseSalesCsv`) — SAP ka fragment-bug (big numbers me unquoted comma → "12" + "450.00" fragments) auto-repair + **qty×rate==taxable validation** (98.7% pass, baki flag)
- User ke `E:\...\11 Data\Sales Register\` ki 3 files → `workbooks\csv\` copies: **FY-2024-25.csv (9,532 rows) + FY-2025-26.csv (10,541)** config me registered | `FY-2026-27-Apr-Aug.csv` backup-only (workbook IWSR se duplicate hota — double-count guard)
- **Sales ab 29,398 rows** (2024-04 → 2026-08) — FG-Analysis / Compare-YoY me 3-saal ka data live
- **Pehla YoY insight: SAKAR Apr–Aug = ₹17.11 Cr → ₹17.81 Cr → ₹25.42 Cr (+42.8% YoY)** | SVN Apr–Aug ₹49.88 Cr
- **⚠️ Data-gap found: FY-2025-26 me June-2025 MISSING hai** — raw SAP export me hi sirf 7 rows; SAP team se poora June-25 register nikalwana hoga (guide 1G me note)
- Naya CSV add karne ka rule: `mis-config.json → salesCsvFiles.files` me ek line (entity ke saath); **current-FY CSV config me mat daalna jab tak workbook IWSR me wahi months hain**

### v3.14 (2026-09-07) — Multi-workbook sales support
- Loader refactor: `parseSalesWorkbook()` helper — **list me jitni sales-workbooks, sab parse** (main + purane saal)
- mis-config: `salesWorkbooks.list` — `Sales Register FY-2024-25.xlsx`, `Sales Register FY-2025-26.xlsx` (workbooks folder me, abhi files pending — warning + skip hota hai)
- Sheet-name override per-file possible (`"iwsr": {"SAKAR": "...", ...}`)
- Sales-data FY-wise apne-aap alag hoga (month se FY derive hota hai) — Compare/YoY me purane saal ready
- Answer to user: **alag-alag ya ek single file — dono chalega** (guide 1G me likha)

### v3.13 (2026-09-07) — SAKAR stock LIVE (Apr–Aug real SAP data)
- User ke `E:\A-Sakar\11 Data\Closing Stock\` wali 5 files (Store Summary With Landed Cost) copies `uploads\stock\STOCK-<M>-2026-SAKAR.xlsx` naam se
- **173,945 stock-rows** parse (34-35k/month), SAP-format auto-detect ✓
- **Aug-26 closing: 6.82 Cr nos / ₹14.50 Cr** | Moving 89.9 Cr₹-items / Slow 316 / Non-Mov 545 / Dead 99 items
- **Opening-fix**: opening ab sirf PEHLE month (Apr) ka sum hota hai — pehle har month ka opening jodta tha (36 Cr galat → 8.28 Cr sahi; balance: 8.28+33.25−34.71=6.82 ✓)
- 58 warehouses live (Main Store ₹5.16Cr, Sakar-3 ₹2.17Cr, Non-Moving-WH ₹2.08Cr...)
- SVN RPS file archive me mil gayi — config path updated (`11. Archieve/Loans/`), loans 678 ✓

### v3.12 (2026-09-07) — Templates ek folder me (5 templates + README)
- **F:\Financial Report\templates\** ab complete kit: STOCK | LOAN | PAYMENT | BUDGET | **CUSTOMER-MASTER** (naya) + **"README - KAUNSA TEMPLATE KAB.txt"** (kaunsa file kab/kahan dalna)
- **CUSTOMER-MASTER-TEMPLATE.xlsx naya**: group-party links Excel me bharo → uploads\ me `CUSTOMER-MASTER.xlsx` naam se → loader JSON-master ke saath merge karta hai (dup-safe)
- Templates app me bhi (footer corner ⬇ Templates) — ab README.txt bhi wahan se download hota hai

### v3.11a (2026-09-07) — Stock tab: Warehouse-wise breakdown
- **Warehouse Summary table** (har WH ka items/qty/value + Dead-WH & Non-Mov-WH qty) — latest month snapshot, TOTAL row ke saath
- **View dropdown**: "Item-wise" (original) ↔ "Item × Warehouse" (kaunsa item kis WH me kitna) — Dead/Non-Mov WH qty columns ke saath
- Zero-stock WH bhi dikhenge (items=0), sort value-desc

### v3.11 (2026-09-07) — SAP B1 stock-report DIRECT support
- **SAP B1 query-report export as-is upload hota hai** (no template needed) — loader format sniff karta hai ("Item No." + "Warehouse Code" header)
- **Rule: file-name me month** (STOCK-Apr-2026.xlsx / STOCK-May.xlsx) — warna warning + skip
- Company auto: filename/sheet me "svn" → SVN, warna `sapDefaultCompany` (default SAKAR) — mis-config me
- Column-mapping auto: ItemNo/Desc/Category/Group/WH/Store/Opening/Inward(=Produced)/Outward(=Sold)/Closing Qty+Value
- **Dead/Non-Moving ab SAP-warehouse-se**: "Dead Stock" WH → Dead, "Non Moving/Slow Moving" WH → Non-Moving (partial bhi flag)
- Multi-warehouse closing = sum (item ka total across WHs); Store-Name/WH-code row me save
- Test: sample 6-row file → 6 rows parsed, classification sahi (Non-Mov WH items flagged)

### v3.10 (2026-09-06) — Loan Detail Excel + PDF export
- **DSCR tab me export toolbar**: month-selector (ALL/poora-FY ya ek month) + `📊 Excel Export` + `🖨 Print / PDF`
- **Excel** (`report=loans`): 3 sheets — Loan Master (per-loan FY summary: Opening/Principal/Interest/Closing + source) | Month Detail (row-level, Manual-Edit flag ke saath) | DSCR Summary (month-matrix)
- **PDF**: `/mis/loan-print` — print-ready HTML (auto-print dialog khulta hai → "Save as PDF" chuno); company-wise Loan Summary + Month-wise Detail tables; branding har page par
- server.ts me DSCR logic `buildDSCR(fy)` helper me refactor (export + API dono use karte hain); F-drive app-copy synced

**v3.9 (SVN LOANS INTEGRATED — user ne integrate ka green-signal diya):**
- **Source mila**: `E:\...\11. Data\Loans\SVN Term Loan RPS Working till closure - Revised.xlsx` (Term Loan sheet: 6 blocks D/H/L/P/T/X, Car Loan sheet: 1 block, Loan Summery)
- **Loader me svnLoanRps integration**: 6 Term loans + Car loan (monthly P/I actuals, 21-22→29-30) + 4 summary-only loans (802920431, ECGS-803641167, DBS x2 — EMI 60/40 P/I placeholder, closingBalance stored, `summaryOnly` flag)
- **678 loan-rows total** (306 SAKAR + 372 SVN)
- **SVN Apr-Jul DS ₹19.4L/month** (schedule actuals), **Aug ₹35.56L** (master EMI total, exactly user ke summary jaisa ✓)
- DSCR=0 tab tak jab SVN PL-groups map nahi (Ledger Mapping se Sales/Expense group karo)
- 2 naye SVN loans (user 2-4 din me manually add karega — DSCR tab ke Manual Add se, ya Loan Summery sheet me daal kar batao)
- loan-master-SVN.json = reference master (sanction/EMI/balance)

**v3.8 (loan-correction + manual-edit round):**
- **USER CORRECTION ACCEPTED**: Loan-SVN sheet = SAKAR ke loans (pehle se confirm tha, config `"SAKAR": "Loan-SVN"`)
- **USER INSTRUCTION (important): "abhi start mat hona, pehle saare loan collect karo"** — SVN ke loan-sheets (bank-loans: HDFC TL 86062301/86170998, BBG-WC x4, Term Loan-HDFC/DBS/ECGS, CC-interest) + car-loan (HDFC 146434665) user de raha hai — **WAITING state: saare loans collect hone tak naya loan-build nahi**
- **Manual Loan Edit/Add/Delete APIs + UI** (DSCR tab me) — sheet-se-aayi rows edit, naya loan add, manual-delete — future me user khud re-edit kar sake
- SVN ke screenshots ke loan-blocks: 12+ columns ke triplets (same parse-logic extend hoga jab user bolega)

**v3.7b (CORRECTION): Loan-SVN sheet me actually SAKAR ke loans hain (user-confirmed) — config `"SAKAR": "Loan-SVN"` kar diya. SAKAR DSCR LIVE: Apr-Aug DSCR 0.19-0.22× (DS ₹15.75L/month, 5 HDFC loans). SVN loans pending (jab schedule aaye).**

**v3.7 (loan-sheet auto-parse round):**
- **Loan-SVN sheet DIRECT parse** — koi upload nahi chahiye! Config `loanSheets` — column-blocks (D/H/L/P/T = Total|Principle|Interest triplets, R2 = loan-names, A=FY-code, B=month) auto-detect
- FY-code fix (26-27 → FY-2026-27) + month-case fix (JUN/jun/Jun sab)
- DSCR ab SVN ke liye Apr–Aug Principal+Interest se live (DSCR=0 tab tak jab tak SVN PL-groups map nahi hote — Ledger Mapping karna hoga)
- SAKAR ke liye: uploads/loans me repayment-schedule file (template format) — Loan-SKR sheet hai to bolo, auto-parse kar dunga

**v3.6 (budget round):**
- **BUDGET-UPLOAD-TEMPLATE.xlsx** (user ke real Rent/Finance-Cost/Dep numbers example me) — Company|FY|Month|Head|SubUnit|Amount|Remarks
- **uploads\budget\** folder + loader parse (Rules sheet skip)
- **🎯 Budget vs Actual tab**: head→PL-group auto-match (synonym fallback: Finance Cost-Interest→Finance Cost), Budget|Actual|Variance ₹+% + On-track/Over/Under status + sub-unit breakdown, upto-month selector, 3-saal support via FY column
- Demo upload se end-to-end tested (Depreciation matched, Sales/Interest matched; unmatched = naming warning dikhata hai)
- Template copy `uploads/budget/` me demo ke liye daali thi — user real budget daal kar replace kare

**v3.5 (branding round):**
- **Excel exports branded**: har exported file me top title-block (report-name + ⚡ Powered by: Vishnu Intelligence Services + Generated timestamp + Entity/FY meta) + footer branding row — brandSheet() helper se saare 5 exports (sales/plbs/unmapped/rejections/cgroup) covered
- UI header + footer me bhi Vishnu Intelligence Services badge (pehle se tha)
- Export button ab cgroup tab se bhi kaam karta hai

**v3.4 (loan-schedule round):**
- **Loan format upgraded to REPAYMENT-SCHEDULE**: Company|FY|Month|LoanName|Lender|OpeningBal|PrincipalPaid|InterestPaid|ClosingBal (template regen with Rules sheet) — user khud schedule banayega, dono company + future companies covered
- DSCR API/UI me **month-end Loan Balance row + per-loan FY closing balance** add (P/I totals + closing per loan)
- Guide Part-1D schedule-rules se update

**v3.3 (data-quality + guide round):**
- **ROOT-CAUSE of "data galat"**: SAP-dump continuation rows (15.5k+16k rows) month-blank the — loader me **carry-forward + saneMonth guard** fix kiya. Ab sales months clean: Apr ₹18.8Cr → May ₹24.7Cr → Jun ₹31.8Cr ✓
- **Coverage gap mila**: TB Aug tak hai par IWSR/CN sirf Apr–Jun — **user se Jul+Aug ke registers chahiye** (sabse important action)
- **OPERATIONS_GUIDE.md** F: drive me — Part 1: teeno+2 formats (IWSR existing-format confirmed, CN, Stock, Loan, Payment) | Part 2: monthly close routine 15-min table | Part 3: quality rules | Part 4: coverage status | Part 5: report-map
- App ka ek professional monthly-cycle system ban gaya hai: SAP dumps → uploads → Reload → full MIS

**v3.2 (customer-group round):**
- **customer-master.json** (F: drive) — ek party ke saare company-codes + vendor-codes ek block me; **24 group-parties AUTO-DETECT** hue naam-match se (Century LED ₹4.4Cr, Press Fit, Koncept, Biocon...) — seed file already saved
- **👥 Group Customers tab** — group vs company-wise customer behaviour dono: SAKAR sales | SVN sales | Group Total | Rej | Payments | Balanced/SAKAR-heavy/SVN-heavy tag; "sirf group parties" toggle
- Sales/rejections rows me `groupParty` tag enrich hota hai loader me; payments me bhi
- Master edit = customer-master.json haath se (naya link jodo → Reload Data) — UI editor baad me
- **Note:** "data galat" doubt par: group-TB view me ledger merge ab bhi code-based hai — TB me SAKAR/SVN ke ledger codes alag hain to combined figure check karna; customer-group report isse unaffected

**v3.1 (user feedback round):**
- **Ledger Mapping hidden** — nav se hata, ab sirf footer-corner "⚙ Mapping" link se khulta hai
- **Group consolidated view** — nav me dropdown "🏢 Group (Sakar+SVN combined)" → PL/BS me dono company merge (same ledger-code combine), `/api/mis/group-tb`
- **Month-wise: Qty + Amount dono tables** + avg-realisation card (`byValue=amount|qty`)
- **Auto-refresh** — filters badlo → turant update (Apply optional; search 400ms debounce)
- **Customer dropdown** — sales-se-auto-pick datalist (type karo, suggest hoga); customer data format = sales register hi (code+name), alag file nahi chahiye
- **Payment register format** = `PAYMENT-UPLOAD-TEMPLATE.xlsx` (Company|FY|Month|CustCode|CustName|Amount|Date|Reference) → `uploads\payments\` → reload
- **Templates hidden corner** — footer "⬇ Templates" → teeno (Stock/Loan/Payment) download from app

**v3 additions (user request):**
- **Companies**: config `companies` list — SAKAR + SVN, future me naya add = 1 line
- **Stock tab**: monthly stock upload (`F:/Financial Report/uploads/stock/`, template `templates/STOCK-UPLOAD-TEMPLATE.xlsx`) → Opening/Produced/Sold/Closing + **Dead / Non-Moving / Slow / Moving classification** (rules: dead=12mo, non-moving=6mo — config me badal sakte ho)
- **DSCR tab**: month-wise per company = EBITDA (TB: revenue−opex) ÷ Debt Service (loan upload `uploads/loans/`, template `LOAN-UPLOAD-TEMPLATE.xlsx`: Company|FY|Month|LoanName|Principal|Interest). Loan data aate hi DSCR fill ho jayega (abhi 0 = upload pending)
- **Compare (YoY) tab**: From/To month chuno (Apr–Aug etc.) → FY-wise sales compare + growth%
- **F:/Workforce untouched** — user ka concern, app sirf `F:/Financial Report` use karti hai
- `README_MONTHLY.txt` F: me — monthly routine + naya-FY + nayi-company steps

**STATUS: v3 RUNNING** — `http://localhost:3001/mis`. **Saara data F-drive par: `F:\Financial Report`** (C-drive space ki wajah se user ne F: bola). **F:/Workforce folder ko app touch nahi karti.**

**F:\Financial Report structure:**
- `workbooks/` — sales+TB workbook yahan replace karte raho (month-wise)
- `mis-store.json` — parsed data (auto)
- `ledger-map.json` — **user mapping** (naye ledger → PL/BS group)
- `app/` — app-code ki copy (running copy workspace `mis/` folder me hai)

**v2 naye features (user ke 3 points par):**
1. **FY system Apr–Mar**: `tbWorkbooks.years` config me har FY ka apna TB-file block — naya FY = naya block, current-year file replace hoti rahegi. UI me FY dropdown.
2. **Ledger Mapping tab**: TB me naya ledger aaye aur group na ho → 51 unmapped ledgers list → **PL/BS dropdown + group dropdown → Save** → turant PL/BS statement me dikhne lagega (mapping `ledger-map.json` me persist, loader me user-mapping TB-columns se pehle check hoti hai)
3. **PL & BS tabs**: group-wise OB + April→March monthly + Total, group-row click = ledger breakup drill-down, Excel export bhi

**Files (sab `mis/` folder me):**
| File | Kya hai |
|---|---|
| `mis/mis-config.json` | **USER-EDITABLE config** — sheet names, columns, customer-vendor links, FG categories |
| `mis/loader.ts` + `mis/run-loader.ts` | Workbook parser — IWSR/CN/Purchase sheets read karke `mis-store.json` banata hai |
| `mis/server.ts` | Express API server (port 3001) — reports + Excel export |
| `mis/public/index.html` | UI — Dashboard, Sales, Month-wise matrix, FG Analysis, Rejections, Customer 360 tabs |
| `mis/start-mis.ps1` | Server start + health-check script |
| `mis/mis-store.json` | Parsed data (auto-generated, delete mat karna) |

**Kaise chalana hai (next session):** `powershell -File mis/restart-mis.ps1` → browser me `http://localhost:3001/mis`

**Working features abhi:** Entity/Month filters, Item/Customer grouping, search, month×group matrix, FG trend, Rejection dono channels (CN + purchase), Customer 360 (sales/rej/payments/outstanding), Excel export (har report), Reload-Data button (workbook update ke baad).

**Pending (Phase-1 baaki):**
- [ ] Payments upload UI (abhi API hai `/api/mis/payments`, UI form nahi) — user bank sheet format de
- [ ] Historical scan — purani workbooks (31-July, Jun-26, 31.07.26) se 2-3 saal ka data merge karna
- [ ] PL & BS module (TB sheets se) — Phase-1 ka bada hissa
- [ ] Budget template + Budget-vs-Actual
- [ ] Schedule III view + Excel-like presentation view
- [ ] Customer-Vendor links: config me abhi 1 example hai — user ko asli links dena hoga (kaunse vendor-code kaunse customer-code se linked)

**Original requirements (reference):**

**User ke decisions (final):**
1. Platform = **Web app** (local, browser me)
2. Data format = **same as current workbook** (SAP TB + IWSR-SKR/SVN + CN-SKR/SVN formats)
3. Budget = design me template ready rahega, file user **baad me** dega

**Planned reports:** PL & BS (auto), Ratios dashboard (GP%, EBITDA%, DSCR, Current/Quick, Debtor/Inventory days), Item-wise sales (month×item, FG 2-3yr trend, top-N), Customer-wise sales (top customers, concentration), Budget vs Actual, Rejection analysis (CN/IWSR), Labour cost analysis

**Feature additions — Round 2 (user ne 06-Sep ko bataya):**
1. **Excel export** — koi bhi report kabhi bhi Excel me download ho sake
2. **TB replace anytime** — naya TB upload karne par purana replace (version history ke saath)
3. **Excel-like presentation view** — reports ko Excel jaisa look dena (present karne ke liye)
4. **Schedule III view** — PL & BS ko Schedule III format me bhi dikhana
5. **Rejection 2 channels se** (customer-level tracking):
   - Channel 1: **Credit Note** booking se customer rejection
   - Channel 2: **Purchase invoice** (return) se rejection — Vendor code ko Customer code se **link** karna hoga (mapping table)
6. **Customer 360 report** (per customer):
   - Sales (sales register se)
   - Rejections (CN + linked-vendor purchase-returns, dono channels)
   - **Payments received** (bank payments user khud update karke laga dega — Excel sheet upload hoga: customer, amount, date, ref)
   - Net position = Sales − Rejections − Payments received (receivable/outstanding view)

**Design impact:** Customer↔Vendor master-mapping table + Bank-payments register (monthly upload #3) app schema me add hoga.

**Phases:**
- Phase 1: Upload + validation + Item/Customer reports + PL/BS auto
- Phase 2: Ratios + Budget compare + FG multi-year analysis
- Phase 3: Drill-downs, alerts, consolidated group view

**Shuru karne se pehle chahiye (user se):**
- [ ] 2-3 saal ka historical data — purani workbooks E: folder me already hain (`Financial-Summary as on 31-July-2026.xlsb`, `New Financial Report -Jun-26.xlsb`, `Revised Group-Summary as on 31.07.26.xlsb` etc.) — Buffy inko scan karke extract kar lega
- [ ] Confirm: sales register (IWSR) me customer-ka-naam column hai ya item-only? (workbook scan se pata chalega)
- [ ] Budget template ka format design karna hai (Buffy karega)

**Note:** Financial Report thread (Section A) se TB/grouping structure reuse hoga — wo already clean hai.

---

## Section A — Financial Report MIS (Sakar + SVN, FY-2026-27)

**Workbook:** `E:\Account Master\A-Sakar\7. Management MIS\Monthly MIS\Financial Report\FY-2026-27\Revised Group-Summary as on 31.08.26.xlsb` (macro version `.xlsm` me hai — wahi active hai)

**Kya ho chuka hai (poora detail guide me):**
- 8-step fix-macro `FixAll_FinancialReport` (v2.3) — DSCR rebuild, TB/BS date formulas, tax input cell (B65), dead-names cleanup, Auto-Check sheet, Drill-Down sheet (group-head → account breakup, 100% formulas)
- v2.3 module workbook me **live** (COM automation se deploy kiya — user ke Import-dialog ki zaroorat nahi padi)
- Runtime bugs jo path me fix kiye: D7/D8 paren bug, D8 multi-line compile bug, em-dash/LF import issues, FreezePanes 0x800A9C68 (ab On Error wrapped)
- **COM-automation lesson (yaad rakhna):** VBComponents rename/copy operations session corrupt kar sakte hain — solution: workbook save+close+reopen, phir clean import. PS1 scripts ASCII-only + CRLF hone chahiye (PowerShell 5.1 non-ASCII parse fail karta hai). `Application.Run` se MsgBox-popups avoid hote hain.

**User ki 3 badi requirements (yaad rakhne wali):**
1. **Sab calculations Excel formulas se** — VBA sirf one-time formula-installer, calculation me VBA zero
2. **PL & BS automation se banne chahiye** — TB paste → statements auto (F2/L2 auto-LOOKUP already installed)
3. **Drill-down chahiye** — group head pe click/dropdown se breakup (Drill-Down sheet, FILTER-based)

**Pending / next:**
- [x] ~~Drill-Down build~~ — **DONE via direct-COM method** (VBA run-mode stuck tha, isliye PowerShell se sheet directly banayi — same formulas/dropdowns, 100% formula-driven)
- [x] Final verify saved file: 8/8 fixes ✅ (scan: `scripts/verify-macro-results.ts`)
- [ ] User: Drill-Down sheet test kare (B2 entity, B3 group-head, B4 date) — Sales/Semeter Cost breakup dikhna chahiye
- [ ] BS networth double-count (D4/D5 patches) — user ka decision pending (sirf discussion hua tha)
- [ ] Orphan TB groups mapping ("Other Income" 18 accounts, "Sales & Distribution Exp", "Direct Exp") — SAP dump me grouping theek karni hogi
- [ ] SAKAR real loan schedule mile to DSCR!F11 proxy replace karna
- [ ] Option A (professional format + repair) — user ne abhi hold pe rakha hai

**Key files:**
| File | Kya hai |
|---|---|
| `docs/FINANCIAL_REPORT_GUIDE.md` | Full guide — run steps, verification values, formula-edit cheat-sheet |
| `scripts/FinancialReport_FixMacros.bas` | v2.3 macro (E: ke workbook-folder me bhi copy hai) — FreezePanes fix included |
| `scripts/verify-macro-results.ts` | Saved-workbook scan — 8 fixes verify karta hai (path me `.xlsm` point karta hai) |

---

## Section C — Workforce ERP (F:\Workforce\WORKFORCE-2026.html)

**File:** `F:\Workforce\WORKFORCE-2026.html` (single-file offline app — browser me kholo, localStorage me data save hota hai)
**Source code:** `workforce-erp/` folder (React + Vite). Build: `npm run build` phir `node tools/inline-single.cjs` → root me `WORKFORCE-2026.html` banta hai → F-drive pe copy hota hai.

**App me kya hai (sab modules):** Dashboard · Workers · Attendance (Excel/CSV import ke saath) · Leave Ledger · Loans & Advance · Wages/Report · **Contractor Bills & PF Challan** · Payroll · Settings. Topbar me **"Month Excel"** button — multi-sheet xlsx export (Summary, Payroll, Attendance, Loans, Contractor Bills, PF Challans, Worker Master). Backup/Restore JSON bhi hai.

**PF Challan kahan hai (user confusion tha):** alag menu NAHI hai — **Contractor Bills screen ke andar** hai. Contractor row me "PF Challan" button (Employee+Employer PF > 0 hone par active) + neeche "PF Challan Log" card. Challan No auto: `CH-YYYYMM-###`.

**Aaj (06-Sep-2026) hua:** Contractor Commission Rates feature (Settings me — effective-by-month, 12h/11h/8h ₹/payday, base April-2026 = ₹20/₹20/₹20) + Departments master list. **Commission rates ab UNIT/LOCATION-wise bhi** — Settings me Company/Unit select (All Units common + unit-specific override), "Save Rate" button alag row me (pehle user ko save nahi dikhta tha), table me unit column, duplicate-entry replace confirm, ContractorBills + Excel export per-worker unit rate use karte hain. Latest build F-drive pe deploy kiya (MD5 `2C6196F0...` verified). Purani F-drive build ka backup: `F:\Workforce\WORKFORCE-2026.backup-2026-09-06.html`.

**Pending / next:**
- [ ] User F-drive file kholkar test kare — especially Contractor Bills → PF Challan button aur Settings → Commission Rates
- [ ] User ke naye change-requests aaye to handle karein (note: user frustrated hai slow progress se — chhote focused fixes hi karein, har change ke turant baad F-drive pe deploy karein)

**Deploy shortcut (har change ke baad):** build → root `WORKFORCE-2026.html` → `Copy-Item` to `F:\Workforce\WORKFORCE-2026.html` (backup pehle le lo).

*Section C added: 2026-09-06 by Cline (Workforce thread — latest build deployed to F-drive)*
| `scripts/deploy-v23.ps1` | COM-automation deploy — Excel attach/open, module replace, subs run, save, verify |

---

**Technical lesson (agar future me phir deploy karna ho):** VBA `Application.Run` stuck run-mode/macro-security me fail hota hai — **direct-COM sheet-build** (`scripts/final-deploy.ps1`) hamesha kaam karta hai. Zombie Excel instances (invisible, lock-holding) `Get-Process EXCEL | ? MainWindowTitle -eq ''` se pakdo, kill karo, phir read-write kholo.

*Last updated: 2026-09-06 by Buffy (Financial Report thread — 8/8 fixes verified in saved file, Drill-Down via direct-COM)*

- [MIS] Sales figures ka source ab **Statement (New PL)** hai — /api/mis/sales-summary (register fallback). FY-2026-27 total = 118.38 Cr (SAKAR 42.82 + SVN 75.55, Apr-Aug). stmtPL parser loader me, 3 statement files F:/Financial Report/workbooks/statements/. Register sirf item-detail ke liye.

---

## Section D — VETAN ERP (vetan-svn.vercel.app — SVN Group Payroll/HR Suite)

*Added 2026-09-07 by Buffy — user ne bola VETAN index me nahi tha, isliye git-history + audit-reports se reconstruct kiya.*

**App:** https://vetan-svn.vercel.app (Vercel + Supabase) | **Repo:** yahi workspace (`C:\Users\SAKAR\VETAN_ERP_Freebuff`) | **Login (admin):** `vishnu` / `Varrawatia`
**Stack:** React+Vite PWA ("SVN GROUP - VETAN ERP") + `api/_app.cjs` serverless bundle (`api/server-entry.ts` se rebuild hota hai) + Supabase (`vetan_erp_store` row `live`, `vetan_erp_backups`, normalized `vetan_*` tables — `supabase/migrations/001`) | SQLite `Payroll.db` sirf local-dev

### Kya-kya hua (git-history se, latest pehle — 219 commits, last 02-Sep-2026)
- **Cold-start data-loss fix** — employee updates 2-3 din me revert ho rahe the (02-Sep, last commit `c54f295`)
- **Keep-warm cron (200 staff)** + dedicated `/api/health` endpoint + mobile optimization
- **ESS Leave system hardening:** HOD routing (name→employee-ID resolve), Emergency HR Override (audit-trail ke saath), auto-escalation PENDING_HOD ko touch nahi karta, notification bell (red badge), security enforcement
- **Payroll engine fixes:** pay_days persistence, salary-revision effective-date (point-in-time rate — May ka increment April me leak nahi hota), payslip snapshot-locking + CLOSED payroll immutability, Salary Slip/Excel me FULL-MONTH rate heads, orphaned payroll-run cleanup (run-ID grouping), unlock race-condition, attendance accumulate (overwrite nahi) + admin attendance cleanup endpoints (DELETE/UPDATE by ID)
- **Employee Master:** PF compliance fields (UAN, PF Member ID, Form 11, verification), Active-Workspace company auto-filter
- **Masters:** 6 companies, 100 employees (8 staff + 92 workers), 120 payslips (Apr 88 + May 32)
- **Docs:** `AUDIT_REPORT.md` (production audit — compliance PASS), `MASTER_CHECK_REPORT.md` (04-Sep: 0 FAIL / 18 WARN), HR User Guide ×3 (real screenshots wala + PWA-install steps), `docs/logo-options.html`, `docs/OPENING_BALANCE_TEMPLATE.md` (1-Apr-2026), `SUPABASE_SETUP.md`

### Pending / known issues (MASTER_CHECK 04-Sep + baad ka)
- [ ] **Payslips sirf Apr–May tak** — Jun/Jul/Aug missing (payroll-run + attendance data chahiye)
- [ ] **Loan Master EMPTY** — workspace `loans.json` me 27 loans (25 ACTIVE) unsynced baithe hain
- [ ] **Live store me HOD = 0** (SQLite me 4 hain: Alok Sharma, Ritesh Saxena, Sanjay Rawat, Vimal Kumar) + 3 users missing (USR011 varrawatia, USR012 vks, USR009 audit)
- [ ] **Shift Master EMPTY**, Contractor Master empty
- [ ] **ESS onboarding pending:** sab 100 employees `needs_password_change=true`; EMP006/EMP007 ke password hi nahi
- [ ] **Data gaps:** 92 workers me category/gender/DOB/aadhaar missing, 39 phone missing, 6 PAN format-fail, 11 UAN 12-digit nahi, 73 employees ke departments Department-Master me nahi hain
- [ ] `employees.json` vs live store drift (10 only-in-dump, 5 only-in-store)
- [ ] Repo me **uncommitted VETAN changes** baithe hain: `api/_app.cjs`, `server/db.ts`, `src/App.tsx`, `src/lib/supabaseData.ts`, `src/lib/offlineStore.ts`, `src/components/DatabaseHealthView.tsx` — 02-Sep ke baad ke (commit user ki permission se hi)

**Note:** MIS app (`mis/` folder) bhi isi repo me hai — wo Section B ka hai, VETAN se alag.
