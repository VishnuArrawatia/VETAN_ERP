import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Users,
  ClipboardList,
  Banknote,
  RefreshCw,
  Landmark,
  UserPlus,
  Lock,
  Unlock,
  Coins,
  Printer,
  ChevronRight
} from 'lucide-react';

type Lang = 'hi' | 'en';
type ChapterId =
  | 'overview'
  | 'daily'
  | 'new-employee'
  | 'attendance'
  | 'leave'
  | 'loans'
  | 'revision'
  | 'payroll'
  | 'heads'
  | 'freeze'
  | 'checklist';

interface HrErpProcessSystemProps {
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
  onNavigate?: (tab: string) => void;
}

interface Step {
  title: string;
  menu: string;
  detail: string;
  tip?: string;
  danger?: string;
  goTab?: string;
}

interface Chapter {
  id: ChapterId;
  icon: React.ReactNode;
  titleHi: string;
  titleEn: string;
  summaryHi: string;
  summaryEn: string;
  stepsHi: Step[];
  stepsEn: Step[];
}

const CHAPTERS: Chapter[] = [
  {
    id: 'overview',
    icon: <BookOpen size={16} />,
    titleHi: '1. ERP ka bada picture (sabse pehle yeh samjho)',
    titleEn: '1. Big picture of the ERP',
    summaryHi: 'VETAN ERP me kaam ka sahi order yeh hai. Is order ko todoge toh salary galat banegi.',
    summaryEn: 'This is the correct order of work in VETAN ERP. Breaking this order causes wrong salary.',
    stepsHi: [
      {
        title: 'Mahine ka asli flow',
        menu: 'Poora cycle',
        detail:
          '1) Employee master theek → 2) Attendance update → 3) Leave/Miss-punch approve → 4) Attendance Commit & Lock → 5) Loan/Advance check → 6) Draft Salary Calculate → 7) Advance/Other fill → 8) Excel check → 9) Salary Freeze & Lock.',
        tip: 'Freeze se pehle jitni baar chaho draft dubara bana sakte ho. Freeze ke baad Super Admin PIN se hi unlock.'
      },
      {
        title: 'Do alag cheezein mat milao',
        menu: 'Important',
        detail:
          'Permanent salary heads (Basic/HRA/Special…) employee structure pe hain. Monthly variable (Advance/Other/Canteen/Bonus incentive) Payroll Inputs pe hain. Loan alag Loan Management pe hai.',
        danger: 'Attendance lock ke bina salary calculate nahi honi chahiye — system ab block karta hai.'
      }
    ],
    stepsEn: [
      {
        title: 'The real monthly flow',
        menu: 'Full cycle',
        detail:
          '1) Fix employee master → 2) Update attendance → 3) Approve leave/miss-punch → 4) Commit & Lock attendance → 5) Check loan/advance → 6) Draft salary → 7) Fill advance/other → 8) Excel check → 9) Freeze salary.',
        tip: 'Before freeze you can recalculate freely. After freeze only Super Admin PIN unlocks.'
      },
      {
        title: 'Do not mix these two',
        menu: 'Important',
        detail:
          'Permanent salary heads live on employee structure. Monthly variables live in Payroll Inputs. Loans live in Loan Management.',
        danger: 'Salary calculate is blocked until attendance is committed & locked.'
      }
    ]
  },
  {
    id: 'daily',
    icon: <ClipboardList size={16} />,
    titleHi: '2. Roz ka HR kaam (Daily)',
    titleEn: '2. Daily HR work',
    summaryHi: 'Rozane jo cheezein HR ko check karni chahiye.',
    summaryEn: 'What HR should check every day.',
    stepsHi: [
      {
        title: 'Login & unit select',
        menu: 'Left sidebar → Company dropdown',
        detail: 'Apni unit select karo (SVN-1 / SVN-II / Sakar-I…). GROUP Dashboard reports ke liye hai; unit kaam ke liye specific company lo.',
        goTab: 'dashboard'
      },
      {
        title: 'Pending approvals dekho',
        menu: 'Leave Management / Dashboard',
        detail: 'HOD ke baad aayi leave, miss-punch, gate pass pending list clear karo. Approve se pehle attendance locked toh nahi — locked ho toh pehle unlock.',
        goTab: 'leaves'
      },
      {
        title: 'Naye joiners / exit',
        menu: 'Employee Master',
        detail: 'Naya employee aaya ho toh code, company, DOJ, bank, PF/ESIC flags, salary heads sahi daalo. Exit hone pe status update + F&F alag process.',
        goTab: 'employees'
      }
    ],
    stepsEn: [
      {
        title: 'Login & select unit',
        menu: 'Left sidebar → Company dropdown',
        detail: 'Select your unit. GROUP Dashboard is for overview; day-to-day work needs a specific company.',
        goTab: 'dashboard'
      },
      {
        title: 'Clear pending approvals',
        menu: 'Leave Management / Dashboard',
        detail: 'Clear HR-pending leave, miss-punch, gate pass. If attendance is locked, unlock before approving items that post to attendance.',
        goTab: 'leaves'
      },
      {
        title: 'Joiners / exits',
        menu: 'Employee Master',
        detail: 'For joiners set code, company, DOJ, bank, PF/ESIC, salary heads. For exits update status and run F&F separately.',
        goTab: 'employees'
      }
    ]
  },
  {
    id: 'new-employee',
    icon: <UserPlus size={16} />,
    titleHi: '3. Naya employee kaise add karein',
    titleEn: '3. How to add a new employee',
    summaryHi: 'Galat company ID se baad me attendance/payroll filter toot jata hai — yahan careful raho.',
    summaryEn: 'Wrong company ID breaks attendance/payroll filters later — be careful here.',
    stepsHi: [
      {
        title: 'Employee Master kholo',
        menu: 'Core HRMS → Employee Master → Add Employee',
        detail: 'Employee Code mandatory hai (company ke existing format me). Duplicate code mat dalo.',
        goTab: 'employees'
      },
      {
        title: 'Corporate Unit sahi choose karo',
        menu: 'Corporate Unit dropdown',
        detail: 'Sirf master IDs use karo: SVN-1, SVN-II, Sakar-I, Sakar-III, Flare-1, Zenivo-1. “SVN II / Sakar I” jaisi galat spelling mat choose karo.',
        danger: 'Galat unit = employee list/filter me nahi dikhega.'
      },
      {
        title: 'Salary heads + PF/ESIC',
        menu: 'Same form',
        detail: 'Basic, HRA, Special, Conveyance, Edu, Medical daalo. PF/ESIC/PT opt-in flags theek tick karo. Yeh permanent structure hai — baad me Increment/Restructure se change hoga.'
      }
    ],
    stepsEn: [
      {
        title: 'Open Employee Master',
        menu: 'Core HRMS → Employee Master → Add Employee',
        detail: 'Employee Code is mandatory. Do not duplicate codes.',
        goTab: 'employees'
      },
      {
        title: 'Pick correct Corporate Unit',
        menu: 'Corporate Unit dropdown',
        detail: 'Use master IDs only: SVN-1, SVN-II, Sakar-I, Sakar-III, Flare-1, Zenivo-1.',
        danger: 'Wrong unit means the employee disappears from filters.'
      },
      {
        title: 'Salary heads + PF/ESIC',
        menu: 'Same form',
        detail: 'Enter Basic/HRA/Special/etc and PF/ESIC/PT flags. This is permanent structure; later changes go through Increment/Restructure.'
      }
    ]
  },
  {
    id: 'attendance',
    icon: <Calendar size={16} />,
    titleHi: '4. Attendance monthly update & lock',
    titleEn: '4. Monthly attendance update & lock',
    summaryHi: 'Attendance lock ke bina salary nahi banegi. Yeh sabse important gate hai.',
    summaryEn: 'Salary will not run without attendance lock. This is the main gate.',
    stepsHi: [
      {
        title: 'Attendance Register kholo',
        menu: 'Core HRMS → Attendance Register',
        detail: 'Sahi month select karo. Company/unit left side se confirm karo.',
        goTab: 'attendance'
      },
      {
        title: 'Excel upload ya manual entry',
        menu: 'Upload / Verify grid',
        detail: 'Present, Absent, Weekly Off, Paid Holiday, Leave, LWP, OT bharo. Errors clear karo.'
      },
      {
        title: 'Commit & lock dabao',
        menu: 'Verify step → Commit & lock',
        detail: 'Yeh button ab attendance ko LOCK karta hai. Lock ke baad edit nahi hoga jab tak Unlock Sheets na dabao.',
        tip: 'Leave/Miss-punch approve pehle kar lo — lock ke baad woh attendance pe post nahi ho payenge.',
        danger: 'Sirf Save mat samjho — salary ke liye LOCK zaroori hai.'
      }
    ],
    stepsEn: [
      {
        title: 'Open Attendance Register',
        menu: 'Core HRMS → Attendance Register',
        detail: 'Select the correct month and unit.',
        goTab: 'attendance'
      },
      {
        title: 'Excel upload or manual entry',
        menu: 'Upload / Verify grid',
        detail: 'Fill Present/Absent/WO/PH/Leave/LWP/OT. Clear validation errors.'
      },
      {
        title: 'Click Commit & lock',
        menu: 'Verify step → Commit & lock',
        detail: 'This locks attendance. Edits need Unlock Sheets first.',
        tip: 'Approve leave/miss-punch before lock — posting is blocked while locked.',
        danger: 'Lock is mandatory before salary calculate.'
      }
    ]
  },
  {
    id: 'leave',
    icon: <Users size={16} />,
    titleHi: '5. Leave & Miss-punch approval',
    titleEn: '5. Leave & miss-punch approval',
    summaryHi: 'Final HR approve se attendance update hoti hai (agar month locked na ho).',
    summaryEn: 'Final HR approval posts into attendance (if month is not locked).',
    stepsHi: [
      {
        title: 'Leave Management',
        menu: 'Core HRMS → Leave Management',
        detail: 'PENDING_HR requests approve/reject karo. HOD ke baad hi HR final karta hai.',
        goTab: 'leaves'
      },
      {
        title: 'Miss-punch / Attendance correction',
        menu: 'Related ESS/HR correction queues',
        detail: 'Approve pe requested status attendance me lagta hai (Absent→Present etc.).'
      },
      {
        title: 'Agar error aaye “attendance locked”',
        menu: 'Attendance → Unlock Sheets',
        detail: 'Pehle unlock karo, approve karo, phir dobara Commit & lock. Salary se pehle yeh complete hona chahiye.'
      }
    ],
    stepsEn: [
      {
        title: 'Leave Management',
        menu: 'Core HRMS → Leave Management',
        detail: 'Approve/reject PENDING_HR requests after HOD.',
        goTab: 'leaves'
      },
      {
        title: 'Miss-punch / corrections',
        menu: 'Correction queues',
        detail: 'Approval posts requested status into monthly attendance.'
      },
      {
        title: 'If you see “attendance locked”',
        menu: 'Attendance → Unlock Sheets',
        detail: 'Unlock → approve → Commit & lock again before salary.'
      }
    ]
  },
  {
    id: 'loans',
    icon: <Landmark size={16} />,
    titleHi: '6. Loan, Advance, Other deductions',
    titleEn: '6. Loan, Advance, Other deductions',
    summaryHi: 'Teen alag jagah — milana mat.',
    summaryEn: 'Three different places — do not mix them.',
    stepsHi: [
      {
        title: 'Loan EMI check / Skip',
        menu: 'Comp & Benefits → Loan Management',
        detail: 'Active loans, EMI, outstanding yahan. Skip EMI month-wise yahi se. Salary calculate pe EMI auto cut hoti hai.',
        goTab: 'loans',
        tip: 'Payroll CLOSED hone ke baad Skip EMI band hai.',
        danger: 'Skip ke baad agar salary pehle ban chuki ho (DRAFT) toh dubara Calculate karo taaki slip update ho.'
      },
      {
        title: 'Advance & Other fill/check',
        menu: 'Payroll → Payroll Input & Deduction System → Monthly Variable Inputs',
        detail: 'Columns: Advance, Other, Canteen, Uniform, Bonus Incentive… Draft salary ke baad yahan values daalo/save karo.',
        goTab: 'payroll'
      },
      {
        title: 'Totals se verify',
        menu: 'Same Payroll Inputs page (upar cards)',
        detail: 'Loan & Advance Recovery, TDS & Other Recoveries, Net Payable cards se unit total check karo.'
      }
    ],
    stepsEn: [
      {
        title: 'Loan EMI check / Skip',
        menu: 'Comp & Benefits → Loan Management',
        detail: 'Manage EMI/outstanding/skip here. EMI auto-applies on salary calculate.',
        goTab: 'loans',
        tip: 'Skip EMI is blocked after payroll is CLOSED.',
        danger: 'If draft slips already exist, recalculate after skip.'
      },
      {
        title: 'Fill/check Advance & Other',
        menu: 'Payroll → Input System → Monthly Variable Inputs',
        detail: 'Edit Advance/Other/Canteen/etc after draft salary.',
        goTab: 'payroll'
      },
      {
        title: 'Verify with totals',
        menu: 'Payroll Inputs summary cards',
        detail: 'Use Loan & Advance / Other / Net Payable cards to cross-check.'
      }
    ]
  },
  {
    id: 'revision',
    icon: <RefreshCw size={16} />,
    titleHi: '7. Salary Increment & Restructure',
    titleEn: '7. Salary Increment & Restructure',
    summaryHi: 'Permanent heads change yahan. Effective date zaroori hai.',
    summaryEn: 'Permanent head changes happen here. Effective date is mandatory.',
    stepsHi: [
      {
        title: 'Salary Revisions kholo',
        menu: 'Comp & Benefits → Salary Revisions',
        detail: 'Mode choose: Increment (net Gross badhe) ya Restructure (heads shift).',
        goTab: 'revisions'
      },
      {
        title: 'Scope choose karo',
        menu: 'One / Current Unit / All Employees',
        detail: 'Ek employee, poori unit, ya sab companies. Unit-wide ke liye left side specific company select honi chahiye (GROUP nahi).'
      },
      {
        title: 'Har head pe + / −',
        menu: 'Heads grid',
        detail: 'Example: Special −1000, HRA +1000. Neeche Old/New Gross breakup dekho. Effective Date daalo → Commit.',
        tip: 'Naya monthly variable head add karna ho toh Payroll → Masters → Add Head (yahan permanent 6 heads fixed hain).'
      }
    ],
    stepsEn: [
      {
        title: 'Open Salary Revisions',
        menu: 'Comp & Benefits → Salary Revisions',
        detail: 'Choose Increment (net gross up) or Restructure (shift heads).',
        goTab: 'revisions'
      },
      {
        title: 'Choose scope',
        menu: 'One / Current Unit / All Employees',
        detail: 'For unit-wide, select a specific company first (not GROUP).'
      },
      {
        title: 'Use + / − on each head',
        menu: 'Heads grid',
        detail: 'Example: Special −1000, HRA +1000. Check breakup, set effective date, commit.',
        tip: 'To add a monthly variable head: Payroll → Masters → Add Head.'
      }
    ]
  },
  {
    id: 'payroll',
    icon: <Banknote size={16} />,
    titleHi: '8. Draft salary banana',
    titleEn: '8. Run draft salary',
    summaryHi: 'Attendance locked hone ke baad hi Calculate chalao.',
    summaryEn: 'Run Calculate only after attendance is locked.',
    stepsHi: [
      {
        title: 'Payroll module',
        menu: 'Comp & Benefits → Payroll',
        detail: 'Pehle “Payroll Input & Deduction System” / Register me month+unit confirm karo.',
        goTab: 'payroll'
      },
      {
        title: 'Calculate / Draft Run',
        menu: 'Salary Register → Calculate',
        detail: 'System PF/ESIC/PT/Loan EMI auto nikalta hai (master rules se). Variable inputs preserve rehte hain recalculate pe.',
        danger: 'Agar attendance missing/unlocked hai toh error aayega — pehle attendance complete karo.'
      },
      {
        title: 'Payslip / Excel check',
        menu: 'Register / Export',
        detail: 'Gross, deductions, net verify. Galat ho toh inputs theek karke dubara Calculate.'
      }
    ],
    stepsEn: [
      {
        title: 'Open Payroll',
        menu: 'Comp & Benefits → Payroll',
        detail: 'Confirm month and unit.',
        goTab: 'payroll'
      },
      {
        title: 'Calculate / Draft Run',
        menu: 'Salary Register → Calculate',
        detail: 'PF/ESIC/PT/Loan EMI auto-calc from masters. Variable inputs are preserved on recalc.',
        danger: 'Missing/unlocked attendance returns an error.'
      },
      {
        title: 'Check payslips / Excel',
        menu: 'Register / Export',
        detail: 'Verify totals; fix inputs and recalculate if needed.'
      }
    ]
  },
  {
    id: 'heads',
    icon: <Coins size={16} />,
    titleHi: '9. Naya Earning/Deduction head add karna',
    titleEn: '9. Add a new earning/deduction head',
    summaryHi: 'Monthly variable heads ke liye Masters use karo.',
    summaryEn: 'Use Masters for monthly variable heads.',
    stepsHi: [
      {
        title: 'Masters tab kholo',
        menu: 'Payroll → Payroll Input → Earning & Deduction Masters',
        detail: 'Add Head (Earning) ya Add Head (Deduction). Name + Code do → Save.',
        goTab: 'payroll'
      },
      {
        title: 'Phir Inputs sheet me use',
        menu: 'Monthly Variable Inputs Sheet',
        detail: 'Naya head list me aayega; month-wise amounts bharo. Yeh permanent Basic/HRA structure nahi badalta.'
      }
    ],
    stepsEn: [
      {
        title: 'Open Masters',
        menu: 'Payroll → Input → Earning & Deduction Masters',
        detail: 'Add Head for earning or deduction with name/code.',
        goTab: 'payroll'
      },
      {
        title: 'Use in Inputs sheet',
        menu: 'Monthly Variable Inputs Sheet',
        detail: 'Fill month amounts. This does not change permanent Basic/HRA structure.'
      }
    ]
  },
  {
    id: 'freeze',
    icon: <Lock size={16} />,
    titleHi: '10. Salary Freeze & Unlock',
    titleEn: '10. Salary Freeze & Unlock',
    summaryHi: 'Freeze = final. Uske baad edits band.',
    summaryEn: 'Freeze is final. Edits stop afterwards.',
    stepsHi: [
      {
        title: 'Freeze & Lock',
        menu: 'Payroll Register → Freeze & Lock',
        detail: 'Confirm ke baad run CLOSED. Attendance/salary edits us month pe block.',
        goTab: 'payroll'
      },
      {
        title: 'Galati ho toh Unlock',
        menu: 'Admin Un-Lock & Reset',
        detail: 'Sirf Super Admin PIN se. Status DRAFT pe aata hai — phir corrections + recalculate + dubara freeze.',
        tip: 'PIN default environment me configured security PIN hai — production me change rakho.'
      }
    ],
    stepsEn: [
      {
        title: 'Freeze & Lock',
        menu: 'Payroll Register → Freeze & Lock',
        detail: 'Run becomes CLOSED; month edits block.',
        goTab: 'payroll'
      },
      {
        title: 'Unlock if mistake',
        menu: 'Admin Un-Lock & Reset',
        detail: 'Super Admin PIN only. Back to DRAFT → fix → recalculate → freeze again.',
        tip: 'Keep production PIN changed from defaults.'
      }
    ]
  },
  {
    id: 'checklist',
    icon: <CheckCircle2 size={16} />,
    titleHi: '11. Month-end checklist (print/save)',
    titleEn: '11. Month-end checklist',
    summaryHi: 'Har mahine freeze se pehle yeh tick karo.',
    summaryEn: 'Tick this before every freeze.',
    stepsHi: [
      {
        title: 'Freeze se pehle 10 checks',
        menu: 'Checklist',
        detail:
          '□ Unit sahi selected\n□ Saari attendance committed + locked\n□ Leave/miss-punch clear\n□ New joiners/exits updated\n□ Loans EMI/Skip checked\n□ Draft salary calculated\n□ Advance/Other filled\n□ PF/ESIC/PT samples checked\n□ Excel/register totals match\n□ Freeze & Lock done + audit note'
      }
    ],
    stepsEn: [
      {
        title: '10 checks before freeze',
        menu: 'Checklist',
        detail:
          '□ Correct unit selected\n□ Attendance committed + locked\n□ Leave/miss-punch cleared\n□ Joiners/exits updated\n□ Loan EMI/Skip checked\n□ Draft salary calculated\n□ Advance/Other filled\n□ PF/ESIC/PT sample checked\n□ Excel/register totals match\n□ Freeze & Lock + audit note'
      }
    ]
  }
];

export default function HrErpProcessSystem({
  lang: langProp,
  onLangChange,
  onNavigate
}: HrErpProcessSystemProps) {
  const [langInternal, setLangInternal] = useState<Lang>('hi');
  const lang = langProp ?? langInternal;
  const setLang = (l: Lang) => {
    onLangChange?.(l);
    if (!langProp) setLangInternal(l);
  };
  const [activeId, setActiveId] = useState<ChapterId>('overview');

  const active = useMemo(
    () => CHAPTERS.find(c => c.id === activeId) || CHAPTERS[0],
    [activeId]
  );

  const steps = lang === 'hi' ? active.stepsHi : active.stepsEn;
  const title = lang === 'hi' ? active.titleHi : active.titleEn;
  const summary = lang === 'hi' ? active.summaryHi : active.summaryEn;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4 print:space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 md:p-6 print:bg-white print:text-slate-900 print:border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 print:text-slate-500">
              VETAN ERP · HR Process System
            </p>
            <h2 className="text-lg md:text-xl font-black mt-1">
              {lang === 'hi'
                ? 'Poora kaam kaise karein — Step-by-Step Process'
                : 'How to run the ERP — Step-by-Step Process'}
            </h2>
            <p className="text-xs text-indigo-100/90 mt-1 max-w-2xl print:text-slate-600">
              {lang === 'hi'
                ? 'Har HR ke liye: menu path, kya click karna hai, kis order me kaam karna hai, aur common galti kahan hoti hai.'
                : 'For every HR: menu path, what to click, correct order, and common mistakes.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <div className="bg-white/10 p-0.5 rounded-lg flex border border-white/15">
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer ${lang === 'hi' ? 'bg-white text-slate-900' : 'text-white/80'}`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer ${lang === 'en' ? 'bg-white text-slate-900' : 'text-white/80'}`}
              >
                English
              </button>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl cursor-pointer"
            >
              <Printer size={13} />
              {lang === 'hi' ? 'Print / PDF' : 'Print / PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chapter nav */}
        <aside className="lg:col-span-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 sticky top-2">
            {CHAPTERS.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-semibold transition flex items-start gap-2 cursor-pointer ${
                  activeId === c.id
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`mt-0.5 ${activeId === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {c.icon}
                </span>
                <span className="flex-1 leading-snug">
                  {lang === 'hi' ? c.titleHi : c.titleEn}
                </span>
                <ChevronRight size={12} className={`mt-0.5 ${activeId === c.id ? 'opacity-80' : 'opacity-30'}`} />
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <section className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{summary}</p>
            </div>

            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="rounded-xl border border-slate-150 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                      <p className="text-[10px] font-mono text-indigo-700 mt-0.5 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
                        {lang === 'hi' ? 'Path: ' : 'Path: '}{step.menu}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-8">
                    {step.detail}
                  </p>
                  {step.tip && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 ml-8">
                      <strong>{lang === 'hi' ? 'Tip: ' : 'Tip: '}</strong>{step.tip}
                    </p>
                  )}
                  {step.danger && (
                    <p className="text-[11px] text-rose-800 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 ml-8 flex gap-1.5">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      <span><strong>{lang === 'hi' ? 'Dhyan: ' : 'Caution: '}</strong>{step.danger}</span>
                    </p>
                  )}
                  {step.goTab && onNavigate && (
                    <div className="pl-8 print:hidden">
                      <button
                        type="button"
                        onClick={() => onNavigate(step.goTab!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        {lang === 'hi' ? 'Us module pe jao' : 'Go to module'}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                disabled={CHAPTERS.findIndex(c => c.id === activeId) === 0}
                onClick={() => {
                  const idx = CHAPTERS.findIndex(c => c.id === activeId);
                  if (idx > 0) setActiveId(CHAPTERS[idx - 1].id);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                {lang === 'hi' ? '← Pichla' : '← Previous'}
              </button>
              <button
                type="button"
                disabled={CHAPTERS.findIndex(c => c.id === activeId) === CHAPTERS.length - 1}
                onClick={() => {
                  const idx = CHAPTERS.findIndex(c => c.id === activeId);
                  if (idx < CHAPTERS.length - 1) setActiveId(CHAPTERS[idx + 1].id);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white disabled:opacity-40 cursor-pointer"
              >
                {lang === 'hi' ? 'Agla →' : 'Next →'}
              </button>
            </div>
          </div>

          {/* Quick map printable */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-950 leading-relaxed">
            <p className="font-bold mb-1">
              {lang === 'hi' ? 'Ek nazar me mahine ka order' : 'Month order at a glance'}
            </p>
            <p className="font-mono text-[10px] md:text-[11px]">
              Attendance Update → Leave/Miss-punch Approve → Attendance LOCK → Loan/Advance Check → Draft Salary → Variable Inputs → Excel Check → Salary FREEZE
            </p>
          </div>
        </section>
      </div>

      {/* Print-all chapters (hidden on screen) */}
      <div className="hidden print:block space-y-8">
        {CHAPTERS.map(ch => (
          <div key={ch.id} className="break-inside-avoid">
            <h3 className="text-sm font-black text-slate-900 border-b pb-1 mb-2">
              {lang === 'hi' ? ch.titleHi : ch.titleEn}
            </h3>
            <p className="text-[11px] text-slate-600 mb-2">{lang === 'hi' ? ch.summaryHi : ch.summaryEn}</p>
            <ol className="list-decimal pl-5 space-y-2 text-[11px] text-slate-800">
              {(lang === 'hi' ? ch.stepsHi : ch.stepsEn).map((s, i) => (
                <li key={i}>
                  <strong>{s.title}</strong> — <em>{s.menu}</em>
                  <div className="whitespace-pre-line mt-0.5">{s.detail}</div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
