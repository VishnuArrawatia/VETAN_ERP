# VETAN ERP — HR TEAM GUIDE (1 PAGE)

**Date: 16-Sep-2026** | System: vetan-svn (production) | Fix version: `1c8a860`

---

## 🔗 1. SIRF YEHI LINK USE KARO

> ## https://vetan-svn.vercel.app/

- ❌ **Alpha link (`vetan-erp-yddg-alpha`) KABHI mat kholo** — purana hai, use band kar do
- Bookmark me sirf upar wala link rakho, baaki VETAN ke bookmarks DELETE karo

## 🔄 2. HAMESHA FRESH TAB ME KHOLO (sabse zaroori aadat)

- **Roz pehli baar:** browser kholo → link type karo → **Ctrl+Shift+R** (hard refresh) → phir login
- **Purana bandha tab (kal/parsol wala) BAND karo** — purana tab purana data dikha sakta hai
- Agar kuch "purane values" dikhen: **pehle hard-refresh karo, phir ghabrao**

## 👤 3. EMPLOYEE PROFILE EDIT — SAHI TARIKA

1. Employee ka **Profile Ledger** kholo → ab ye **hamesha server ka LATEST data** laata hai
2. Jo badalna hai badlo (Mobile, UAN, HOD, Cost Center...)
3. **Save** karo → sirf badle hue fields server jaate hain (doosre fields par koi asar nahi)
4. **Confirm karna ho to modal ke NEECHE-LEFT wala naya "🔄 Refresh" button dabao** — bina modal band kiye latest saved data aa jayega
5. Purana tarika (modal band karke firse kholna) ab zaroori nahi — Refresh button kaafi hai

## ✅ 4. SAVE HUA YA NAHI — KAISE PAKE

- Save par green success banner aata hai
- **Modal me Refresh dabao** → jo dikhega wahi server ka sach hai
- Har save ka record **audit-log** me safe rehta hai (kisne, kab, kya badla)

## 🚫 5. YE KABHI MAT KARNA

| ❌ Nahi karna | Kyun |
|---|---|
| Alpha link se entry | Do jagah data alag ho jata hai |
| Purane tab me kaam | Purani copy dikhti/pakdti hai |
| "Restore Backup" prompt ko OK karna | Purana snapshot sab mita dega (ab PIN ke bina possible hi nahi, par fir bhi) |
| Do log EK SATH ek hi employee ke profile me | Aage jhagda ho sakta hai — baari-baari karo (system phir bhi dono ko bachata hai) |
| Bank/UAN blank karke chhodna | Payroll/bank file ruk sakti hai |

## 🆘 6. PROBLEM LAGE TO

1. **Hard-refresh (Ctrl+Shift+R)** karke dekho — 90% problems isi se theek
2. Fir bhi issue ho: **screenshot + time + employee code** ke saath Vishnu sir ko bhejo
3. Audit-log me har action ka record hai — kuch chhupta nahi, data hamesha trace hoga

---
*Technical note: ye guide ke peeche ka fix — profile modal ab fresh server data load karta hai, save sirf changed fields bhejta hai, aur modal ke andar Refresh button hai. Commit `1c8a860`.*
