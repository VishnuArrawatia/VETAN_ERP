# VETAN ERP — GRATUITY PROVISION MODULE — DESIGN DOCUMENT (v1.0, FOR APPROVAL)

**Status:** DESIGN — NO CODE WRITTEN YET. Coding starts only after approval.
**Author:** Buffy (Codebuff) • **Date:** 16 Sep 2026
**Existing code evidence:** `server/db.ts:4596-4605` (F&F gratuity), `server/db.ts:5383+` (Bonus import pattern), Bonus/Arrear register routes + screens (live in production).

---

## 1. PURPOSE & PRINCIPLE

Gratuity ek **statutory liability** hai jo har month employee ke service ke saath accumulate hoti hai, aur **exit/F&F par payment** hoti hai. VETAN me iske liye:

- **Monthly Provision Register** — employee-wise, month-wise accrual (Bonus Provision jaisa hi pattern)
- **F&F Reconciliation** — provision vs actually-paid ka clear hisaab (read-only reconciliation, F&F module ko chhue bina)
- **Payment F&F me hi hota hai** — Gratuity ka alag payment workflow NAHI banega (F&F already pays it)

**Reuse principle:** Bonus Provision ka poora proven architecture (auto-generation, Excel import, idempotency, filters, totals, Phase-2A persist-before-success, Phase-2B tombstones, union-merge protection) — Gratuity me mirror hoga. Naya persistence architecture NAHI banega.

---

## 2. FORMULA (LOCKED — existing VETAN conventions ke hisaab se)

### 2.1 Payment formula (ALREADY EXISTS — F&F, `server/db.ts:4601-4603`)

```
Gratuity Payable = (Last Drawn Basic / 26) × 15 × Completed Years of Service
                 = round to nearest ₹
Eligibility      : Completed service ≥ 5 years (vested)
Base             : base_salary (VETAN me DA component NAHI hai — established business rule)
Completed Years  : floor((exit − joining) / 365.25 days)   ← existing F&F code exactly yahi karta hai
```

> Design note: Payment of Gratuity Act, 1972 ka formula `(Basic+DA)/26 × 15 × years` hai. VETAN me DA alag component hai hi nahi, isliye base = **Basic only**. Existing F&F code se EXACT match — koi formula drift nahi.

### 2.2 Monthly provision formula (NAYA — is module ka core)

```
Monthly Provision = (Applicable Basic × 15/26) ÷ 12
                  = Applicable Basic × 0.048077   (≈ 4.81% of Basic)
                  = round to nearest ₹
```

- **Applicable Basic** = us month ka EFFECTIVE Basic (salary-revision aware — payroll engine wala hi resolution; future revision ho to naya Basic uske effective month se, purane months par nahi)
- **Har eligible month ke liye ek row** — `GRAT-{emp_id}-{YYYY-MM}`
- **Koi seasonality nahi, koi cycle-end nahi** — Bonus (Oct-25→Sep-26) ki tarah fixed cycle NAHI; gratuity joining se exit tak continuous accrual hai

### 2.3 Rounding & precision

- Monthly accrual: nearest ₹ (round)
- Cumulative: sum of rounded rows (audit-friendly — har row independently verifiable)
- Payment: F&F ka apna round (existing)

---

## 3. VESTED LOGIC

| Concept | Rule | Register me kaise dikhega |
|---|---|---|
| **Accrual start** | Joining month se (prorated nahi — full-month row; joining month se hi) | Har month ki row |
| **Vesting (payment eligibility)** | floor(service_years) ≥ 5, service = (exit − joining)/365.25 | Employee-view me `Vested: YES/NO (as on today)` |
| **Provision for non-vested employees** | **ACCrue for ALL employees** (recommended — accounting prudence, IAS-19 style liability; payment tabhi hoga jab vested ho) | Vested flag column — liability pool me sab, payment-sure me sirf vested |
| **Exit < 5 years** | F&F me gratuity_earned = 0 (existing code already aisa hi hai) | Reconciliation me "Forfeited (non-vested)" — provision rows status=FORFEITED (display-only) |

**Approval point A:** Accrual ALL employees ke liye (recommended) ya sirf vested (5+ yrs, ~38 log) ke liye? Dono option doc me hain; code ALL ke liye likha jayega jab tak aap veto na karein.

---

## 4. GENERATION MODEL — MANUAL + AUTO SPLIT (Bonus pattern ka mirror)

### 4.1 Source split

| Period | Source | Kaise aayega |
|---|---|---|
| **Historical months** (jo go-live se pehle ke hain — e.g. joining se Mar-26 tak, ya jo aap decide karein) | `MANUAL` | Excel import (template milega) — HR backdated provisions bharega |
| **Go-live month se aage** (e.g. Apr-26 ya aapka chosen start) | `SALARY_AUTO` | Generate button — monthly Salary Sheet ke effective Basic se |

### 4.2 Auto-generation rules (idempotent — Bonus generator jaisa)

- `POST /api/gratuity-provisions/generate { from_month, to_month }` — sirf ye range generate karta hai
- Row id `GRAT-{emp}-{month}` — **existing row ho to skip** (duplicate kabhi nahi)
- **MANUAL rows kabhi overwrite nahi hote** — manual protection (Bonus me proven)
- Source of Basic: us month ka effective Basic (salary_revisions se resolve — payroll engine ka exact rule; Apr-26 Basic se Apr-26 accrual)
- Audit log entry: "Gratuity Provisions Generated — N rows (X skipped)"

### 4.3 Import (Excel template — Bonus template jaisa)

Columns: `EMPLOYEE CODE | MONTH (Oct-25 format ya 2025-10) | BASIC (optional — blank ho to employee ka us-month effective Basic) | GRATUITY AMOUNT (optional — blank ho to Basic×15/26/12) | REMARKS`

- Duplicate (employee+month existing MANUAL) → SKIPPED
- Invalid employee/month → per-row error report (Bonus import jaisa)
- Operator audit entry

**Approval point B:** Historical start month kya rakhna hai? (Recommendation: **Apr-26 se SALARY_AUTO**, Oct-25→Mar-26 ki tarah backdated gratuity ka Track A nahi hai — chahein to Apr-25 ya joining-se bhi import karwa sakte hain; import open-ended hai.)

---

## 5. F&F RECONCILIATION (read-only — F&F module untouched)

### 5.1 Data model

F&F already `gratuity_earned` save karta hai (`ff_settlements` table, `server/db.ts:4757`). Reconciliation **koi naya write nahi karta** — dono collections ko read karke compare karta hai:

```
Per-employee:
  Cumulative Provision = Σ gratuity_provisions[emp].amount        (register se)
  Gratuity Paid (F&F)  = Σ ff_settlements[emp].gratuity_earned    (jahan status = PAID/APPROVED)
  Balance Liability    = max(0, Cumulative Provision − Paid)
  Variance             = Cumulative Provision − F&F Payable at exit
  Variance Reason      = rounding drift / Basic revision lag / mid-month joining
```

### 5.2 Reconciliation view (register ke andar tab)

- Employee-wise: Months accrued | Cumulative Provision | Vested | F&F Status | Paid | Balance
- Exit-hue employees: Variance column highlighted (±₹ flag jab |variance| > ₹500)
- **F&F settlement approve hone par register rows auto-flag hoti hain** `SETTLED` (display metadata — amount change NAHI hota, sirf status badge; ye ek chhota write hai jo settlement-save ke baad hoga, Phase-2A persist ke saath)

### 5.3 Boundary rules

- F&F module ke calculation me **koi change nahi** — uska `(Basic/26)×15×floor(years)` formula as-is rahega
- Register payment force nahi karta — F&F hi single payment surface hai
- Non-vested exit: F&F ₹0 deta hai; register rows FORFEITED badge (provision reverse-entry accounting me manual journal ke liye note — VETAN me auto-reversal NAHI, sirf badge)

---

## 6. DATA MODEL

```ts
// New collection: gratuity_provisions (full-store me — Supabase authoritative, union-merge + tombstone covered)
{
  id: 'GRAT-SV1ST0001-2026-04',      // deterministic — idempotency key
  employee_id, employee_name, emp_code,
  company, unit, department,
  month: '2026-04',
  base_salary: 20000,                 // us month ka effective Basic
  accrual_rate: 0.048077,             // 15/26/12 — display ke liye
  amount: 962,                        // rounded monthly provision
  source: 'MANUAL' | 'SALARY_AUTO',
  status: 'ACCUMULATED' | 'SETTLED' | 'FORFEITED',
  ff_settlement_id: null,             // SETTLED hone par F&F reference
  remarks, created_by, created_at, updated_at
}
```

- **SQLite mirror:** bonus jaisa `_mirrorGratuityProvision()` (known pre-existing gap jo bonus me bhi hai — SQLite reload path is collection ko reload nahi karta; Supabase authoritative hai, local mirror sirf dev convenience)
- **Settings:** rate constants ek jagah (`GRATUITY_DAYS=15, DIVISOR=26, MONTHS=12`) — hard-code classified INTENTIONAL CONSTANT, future me configurable ho sakta hai par ab nahi

---

## 7. API (existing style — session auth, Phase-2A awaited persists)

| Route | Method | Auth | Kaam |
|---|---|---|---|
| `/api/gratuity-provisions` | GET | any HR session (incl. MANAGEMENT) | rows + totals `{overall, manual_total, auto_total, vested_liability, employee_wise, month_wise}` — filters: employee_id, month, company, unit, department |
| `/api/gratuity-provisions/generate` | POST | HR | idempotent auto-generation (range) |
| `/api/gratuity-provisions/import` | POST | HR | Excel rows import (max 1000/batch) |
| `/api/gratuity-provisions` | POST | HR | single manual entry (duplicate-protected) |
| `/api/gratuity-provisions/:id` | DELETE | SUPER_HR only | junk-cleanup (Bonus jaisa) |
| `/api/gratuity-reconciliation` | GET | HR/MANAGEMENT | per-employee provision-vs-paid view (read-only, F&F se join) |

Sab mutations: `persistDataSync()` awaited → fail par 500 (no fake success). Audit logs on every mutation.

---

## 8. SCREENS (existing UI style — Bonus/Arrear register jaisa)

### 8.1 Gratuity Register screen (naya `GratuityRegister.tsx`)

- **Header:** `GRATUITY PROVISION — CONTINUOUS LIABILITY` (+ total pool badge)
- **Summary cards:** Total Provision | Manual | Auto | Vested Liability (5+ yrs) | Settled (paid via F&F)
- **Table:** Employee | Company | Month | Basic | Rate | Accrual | Source | Status
- **Filters:** Employee, Month, Company, Unit, Source
- **Buttons:** ➕ Add Manual | ⚙️ Generate Auto (from/to month) | 📥 Import Excel | 📤 Export | 📄 Template Download
- **Employee-view toggle:** per-employee cumulative (months count, vested flag, paid, balance)

### 8.2 Reconciliation tab (same screen ka tab-2)

- Employee-wise provision vs F&F paid table, variance flags
- Exit-hue employees ka focused view

### 8.3 MD Dashboard (optional, 1 line)

- Teesra card: **Gratuity Liability ₹X** (Bonus/Arrear cards ke saath — kal ka pattern reuse)

### 8.4 App.tsx wiring

- HR menu me "Gratuity Register" tab (Bonus Register ke bagal me)
- Read-only for MANAGEMENT

---

## 9. TESTING PLAN (Phase-Bonus harness jaisa — fake cloud, ZERO production writes)

| # | Test | Expected |
|---|---|---|
| 1 | Formula: Basic 20000 → monthly ₹962 (20000×15/26/12, rounded) | PASS |
| 2 | Salary revision: Apr Basic 20000, May-26 se 22000 → Apr ₹962, May ₹1058 | month-effective Basic |
| 3 | Idempotency: generate 3× → same rows, no duplicates | PASS |
| 4 | Manual protection: generate MANUAL rows ko overwrite nahi karta | PASS |
| 5 | Import: Oct-25 style months + invalid rows per-row errors | PASS |
| 6 | Duplicate protection: manual re-import → SKIPPED | PASS |
| 7 | Vested flag: 4.9 yrs = NO, 5.1 yrs = YES (365.25-based) | matches F&F logic |
| 8 | Recycle survival: mutation → cloud → cold start → row intact | PASS |
| 9 | Concurrency: 2 instances, alag entities → union survives | PASS (Phase-2A/2B/2C reuse) |
| 10 | Cloud failure: persist fail → 500, no fake success | PASS |
| 11 | Reconciliation: provision ₹9620 (10 months) vs F&F paid ₹11538 (Basic 20000, 6 yrs) → variance flagged | correct math |
| 12 | Non-vested exit: F&F ₹0, register FORFEITED badge | PASS |
| 13 | Regression: Phase-1 security 33/33, Phase-2A/2B/2C, Form16, bundle — no regression | PASS |

---

## 10. OUT OF SCOPE (explicit)

- F&F calculation formula me koi change (existing `(Basic/26)×15×floor(years)` as-is)
- Payment of Gratuity Act ka auto-compliance engine (Form-G, notices, nomination) — future
- ₹20L tax-cap ka automatic computation — sirf flag/note register me (payment par CA ka kaam)
- Leave-encashment ya F&F ke baaki components me kuch bhi
- Accounting journal export — future
- SQLite-reload gap fix (bonus ka pre-existing gap — alag phase)

---

## 11. ROLLBACK & SAFETY

- Feature purely **additive** — existing collections/code untouched (F&F sirf read hoga)
- Rollback = routes/screens remove; data harmless rehta hai
- Production deploy aapke explicit aadesh par hi (established process)

---

## 12. ESTIMATE

| Item | Size |
|---|---|
| `server/db.ts` — collection + generate + import + reconciliation (~350 lines, Bonus mirror) | Medium |
| `server/app.ts` — 6 routes (~120 lines) | Small |
| `src/components/GratuityRegister.tsx` (register + reconciliation tabs) | Medium |
| `src/App.tsx` — 1 tab wiring | Tiny |
| MD dashboard gratuity card | Tiny |
| Test harness (13 tests) | Medium |

---

# APPROVAL CHECKLIST (aap tick karein)

| # | Decision | Recommendation | Aapka answer |
|---|---|---|---|
| A | Accrual kiske liye | **ALL employees** (liability pool me sab, payment sirf vested) | ☐ |
| B | Auto-generation start month | **Apr-26** (Salary Sheet reliable wahi se hai); older months Excel-import se | ☐ |
| C | Reconciliation write | **Sirf SETTLED badge** on F&F approval (amounts kabhi auto-change nahi) | ☐ |
| D | MD dashboard card | **Haan, teesra card** (Gratuity Liability) | ☐ |
| E | Deploy | **Local commit only** — deploy aapke aadesh par | ☐ |
