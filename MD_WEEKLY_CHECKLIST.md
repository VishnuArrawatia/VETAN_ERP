# VETAN ERP — MD WEEKLY DATA-INTEGRITY CHECKLIST (1 PAGE)

**Har Somwar (~10 min)** | System: https://vetan-svn.vercel.app/ | Banaya gaya: 16-Sep-2026

> **Pehle 2 aadat (roz):**
> 1. Sirf yehi link — **https://vetan-svn.vercel.app/** (Alpha link kabhi nahi)
> 2. Nayi tab me kholo + **Ctrl+Shift+R** → phir login. Purana bandha tab band karo.

> **Ye checklist 100% READ-ONLY hai** — sirf dekhna hai, kuch bhi edit/save/delete NAHI karna. Har check ke saath "kya dikhna chahiye" ka baseline number diya hai; number alag ho to niche wale "Red Flag Protocol" par jao.

---

## ✅ A. HEAD-COUNT SACH (2 min)

Dashboard → **Group Executive Summary** → Headcount card:

| Kya dekhna hai | Baseline (16-Sep-2026) |
|---|---|
| Total employees | **107** |
| Company-wise | SVN-1: 47 · Sakar-I: 30 · SVN-II: 18 · Sakar-III: 10 · Zenivo: 1 · Flare: 1 |
| Koi "EMP001…EMP007" naam wala test/dummy employee | **KABHI nahi dikhna chahiye** |

✔ Match → tick. ✗ Match → Red Flag Protocol (C-1).

## ✅ B. LIABILITY CARDS (3 cards, Group Executive Summary me) (2 min)

| Card | Kya dikhna chahiye |
|---|---|
| **Bonus Provision (Oct-25 → Sep-26)** | Total ≈ **₹12,08,000** + Manual/Auto split niche |
| **Arrear Payable (Manual)** | Jo entries HR ne daali ho (0 bhi sahi hai — "No Entries" dikhe to HR se poochho ki arrear is month hai ya nahi) |
| **Gratuity Liability** | Abhi "Not Generated" ho sakta hai — jab HR "Generate Auto" chalaye, tab total aana chahiye |

✔ Teen cards numbers dikha rahe hain (₹0 ya actual) → tick. Card hi nahi dikha ya "…" atka hai → Red Flag (C-2).

## ✅ C. PAYROLL CURRENT MONTH (2 min)

Payroll Runs / Monthly Slips section:

| Kya dekhna hai | Baseline |
|---|---|
| Apr-26 | 79 payslips · May-26 | 37 payslips |
| Current month (Sep-26) | **0** = HR ne abhi process nahi kiya (theek) — month-end ke baad bhi 0 rahe to HR se poochho |

✔ Pattern samajh aa raha hai → tick.

## ✅ D. RANDOM EMPLOYEE SPOT-CHECK (2 min)

Koi bhi 2 employee kholo (jaise apna ya kisi senior ka) aur ye 4 cheezein dekho:

- [ ] **Photo** dikh rahi hai (ya khaali allowed — par purani photo wapas nahi aa sakti)
- [ ] **Mobile / UAN / Marital Status** — jo HR ne last update kiya tha wahi dikh raha hai (purani value NAHI)
- [ ] **Reporting HOD + Cost Center** — sahi bhare hue (khaali-blank achanak nahi)
- [ ] Do baar modal khole ya modal me **Refresh** dabao — **dono baar same value** (refresh ke baad value badal jaye = RED FLAG)

## ✅ E. AUDIT SILENCE CHECK (1 min)

Audit/Logs section me pichhle hafte ki entries par nazar daalo:

- [ ] Aapke naam/permission ke bina koi **"Restore" / "Purge" / "Database Clear"** entry NAHI
- [ ] "Employee Deleted/Purged" entries hain to unke peeche koi wajah (resignation etc.) ho

Ye entries bina wajah dikhen → turant Red Flag (C-3).

## ✅ F. LOGIN DIVERSITY (1 min)

Employee Directory me 2 alag company ke 1-1 employee kholo — dono ke data me **apni-apni company** dikhni chahiye (SVN wale me SVN, Sakar wale me Sakar). Cross-company data dikhe → Red Flag.

---

## 🚩 RED FLAG PROTOCOL (koi bhi check fail ho)

| Level | Kab | Kya karna |
|---|---|---|
| **C-1 (Yellow)** | Sirf number alag (headcount, bonus total) | Ek line me Vishnu/super-admin ko likho: *"Check __ me ___ dikha, expected ___"* — aur **kuch bhi khud edit/save mat karo** |
| **C-2 (Yellow)** | Card khaali/"…" ya section load na ho | Pehle **Ctrl+Shift+R** karo, 1 min baad dobara dekho; phir bhi same → C-1 jaisa report |
| **C-3 (Red)** | Purani value wapas aana, dummy employee dikhna, bina-wajah Restore/Purge entry | **Us screen ka screenshot lo + date/time note karo** → turant Vishnu ko bhejo. Uske aane tak us employee/section me koi entry na kare |

## 📝 GOLDEN RULE

> **Dekhna allowed, chhoona mana.** MD ka kaam sach ko verify karna hai — correction HR/system-admin ke through hi jayegi. Har check ~10 min me khatam, aur "data gayab ho gaya" wali complaint pehle hi pakdi jayegi.

| ✔ A | ✔ B | ✔ C | ✔ D | ✔ E | ✔ F | Sign/Date |
|---|---|---|---|---|---|---|
| ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ________ |
