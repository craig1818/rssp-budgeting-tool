import { useState, useMemo, useEffect } from "react";

const LOGO = "https://images.squarespace-cdn.com/content/v1/66fcd92795b74e6b2cace575/957e4fb7-7b89-4116-a0e0-7e7bdf4f68dc/SkillPath_logo_landscape_colour.png?format=1500w";
const UNIS = {
  "University of Melbourne": "Melbourne", "Deakin University": "Melbourne",
  "University of Technology Sydney": "Sydney", "Australian National University": "Canberra",
  "Curtin University": "Perth", "University of Queensland": "Brisbane",
  "University of Sydney": "Sydney", "Western Sydney University": "Sydney",
};
const CITY_WEEKLY = {
  Melbourne: { accom: 435, transport: 50, food: 220, personal: 41, clothing: 17, entertainment: 22 },
  Sydney: { accom: 600, transport: 55, food: 220, personal: 96, clothing: 17, entertainment: 22 },
  Canberra: { accom: 278, transport: 43, food: 220, personal: 42, clothing: 17, entertainment: 50 },
  Perth: { accom: 293, transport: 44, food: 220, personal: 40, clothing: 17, entertainment: 50 },
  Brisbane: { accom: 499, transport: 55, food: 220, personal: 47, clothing: 17, entertainment: 20 },
};
const FIELDS = [
  { name: "Agriculture", band: 1, csp: 4738 }, { name: "Clinical Psychology", band: 1, csp: 4738 },
  { name: "Education", band: 1, csp: 4738 }, { name: "English", band: 1, csp: 4738 },
  { name: "Indigenous & Foreign Languages", band: 1, csp: 4738 }, { name: "Mathematics", band: 1, csp: 4738 },
  { name: "Nursing", band: 1, csp: 4738 }, { name: "Statistics", band: 1, csp: 4738 },
  { name: "Allied Health", band: 2, csp: 9537 }, { name: "Architecture", band: 2, csp: 9537 },
  { name: "Built Environment", band: 2, csp: 9537 }, { name: "Computing", band: 2, csp: 9537 },
  { name: "Engineering", band: 2, csp: 9537 }, { name: "Environmental Studies", band: 2, csp: 9537 },
  { name: "Other Health", band: 2, csp: 9537 }, { name: "Pathology", band: 2, csp: 9537 },
  { name: "Professional Pathway Psychology", band: 2, csp: 9537 },
  { name: "Professional Pathway Social Work", band: 2, csp: 9537 },
  { name: "Science", band: 2, csp: 9537 }, { name: "Surveying", band: 2, csp: 9537 },
  { name: "Visual & Performing Arts", band: 2, csp: 9537 },
  { name: "Dentistry", band: 3, csp: 13558 }, { name: "Medicine", band: 3, csp: 13558 },
  { name: "Veterinary Science", band: 3, csp: 13558 },
  { name: "Accounting", band: 4, csp: 17399 }, { name: "Administration", band: 4, csp: 17399 },
  { name: "Behavioural Science", band: 4, csp: 17399 }, { name: "Commerce", band: 4, csp: 17399 },
  { name: "Communications", band: 4, csp: 17399 }, { name: "Economics", band: 4, csp: 17399 },
  { name: "Law", band: 4, csp: 17399 }, { name: "Society & Culture", band: 4, csp: 17399 },
];
const PRE_ARRIVAL = {
  India: [["Overstay exit fine", 933], ["Flight from India (approx)", 750], ["Airport transfers", 200]],
  Thailand: [["Overstay exit fine", 1000], ["Flight from Thailand (approx)", 600], ["Airport transfers", 200]],
  Malaysia: [["Overstay exit fine", 180], ["Flight from Malaysia (approx)", 600], ["Airport transfers", 200]],
};
const DEF_SETUP = [["Start up spending money", 1000], ["Temporary accommodation on arrival", 1500], ["Bond for rental", 1200], ["Basic household items", 1500]];
const DEF_STUDY_ESS = [["Textbooks and stationery", 500], ["Laptop", 500], ["Official in-person English test", 460]];
const LC_LABELS = { accom: "Accommodation", transport: "Transport", food: "Food", personal: "Personal", clothing: "Clothing", entertainment: "Entertainment" };
const UNI_TOTAL = 15000;
const C = { navy: "#385592", pink: "#fed2ca", coral: "#de5240", cyan: "#cdf0f1", teal: "#2dcd9e" };
const RA_TABLE = [
  { situation: "Single", threshold: 152.00, ceiling: 439.20, max: 215.40 },
];
const SSL_PER_PERIOD = 1349; const SSL_PERIODS_PER_YEAR = 2; const SSL_ANNUAL = SSL_PER_PERIOD * SSL_PERIODS_PER_YEAR;
const SPARK_MAX_AMT = 5000; const SPARK_RATE = 0.07; const SPARK_FEE_RATE = 0.05; const SPARK_REPAY_YEARS = 4;

function calcTax(t, br) { if (t <= 0) return 0; let x = 0; for (const [l, h, r] of br) { if (t <= l) break; x += Math.max(0, Math.min(t, h) - l) * r; } return Math.round(x); }
function calcYA(fnW, mx, fr, t1E, t1R, t2R) { if (fnW <= fr) return mx; const r = fnW <= t1E ? (fnW - fr) * t1R : (t1E - fr) * t1R + (fnW - t1E) * t2R; return Math.max(0, Math.round((mx - r) * 100) / 100); }
function calcRA(fnR, th, mx, tp) { if (fnR <= th) return 0; return Math.min(Math.round((fnR - th) * tp * 100) / 100, mx); }
/* Income test reduction per fortnight — independent of CRA.
   The reduction amount is subtracted from the COMBINED payment (YA + CRA). */
function calcIncomeTestReduction(fnW, fr, t1E, t1R, t2R) {
  if (fnW <= fr) return 0;
  if (fnW <= t1E) return Math.round((fnW - fr) * t1R * 100) / 100;
  return Math.round(((t1E - fr) * t1R + (fnW - t1E) * t2R) * 100) / 100;
}
function calcHR(tx, d, a) { if (tx < a.hecsThreshold || d <= 0) return 0; let r = 0; if (tx <= a.hecsBand2) r = (tx - a.hecsThreshold) * a.hecsRate1; else if (tx <= a.hecsBand3) r = (a.hecsBand2 - a.hecsThreshold) * a.hecsRate1 + (tx - a.hecsBand2) * a.hecsRate2; else r = tx * a.hecsRate3; return Math.min(Math.round(r), Math.round(d)); }

function calcSparkSummary(dd, amts, studyYrs) {
  const sel = dd.filter((v, i) => v && i < studyYrs);
  if (sel.length === 0) return null;
  let drawn = 0, fee = 0, principal = 0, graceInterest = 0;
  for (let i = 0; i < 3; i++) {
    if (!dd[i] || i >= studyYrs) continue;
    const amt = amts[i] || SPARK_MAX_AMT;
    drawn += amt;
    const f = amt * SPARK_FEE_RATE;
    fee += f;
    const p = amt + f;
    principal += p;
    const grYrs = studyYrs - i;
    graceInterest += p * SPARK_RATE * grYrs;
  }
  const bal = principal + graceInterest;
  const n = SPARK_REPAY_YEARS * 12; const mr = SPARK_RATE / 12;
  const pmt = bal * mr / (1 - Math.pow(1 + mr, -n));
  const totalRepaid = pmt * n;
  return { drawn, fee, principal, graceInterest, balAtRepay: Math.round(bal), monthly: Math.round(pmt), annualRepay: Math.round(pmt * 12), totalInterest: Math.round(graceInterest + (totalRepaid - bal)), totalRepaid: Math.round(totalRepaid) };
}

const fmt = v => { if (v == null) return "-"; const n = v < 0; return n ? `($${Math.abs(Math.round(v)).toLocaleString("en-AU")})` : `$${Math.round(v).toLocaleString("en-AU")}`; };
const fmt2 = v => { if (v == null) return "-"; const n = v < 0; const abs = Math.abs(v).toFixed(2); return n ? `($${abs})` : `$${abs}`; };

const Inp = ({ label, value, onChange, min, max, step, note, warn, dollar, disabled }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs font-medium" style={{ color: C.navy }}>{label}</label>
    <div className={dollar ? "relative" : ""}>
      {dollar && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>}
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step || 1} disabled={disabled}
        className={`border rounded py-1.5 text-sm bg-white focus:outline-none focus:ring-2 w-full ${dollar ? "pl-6 pr-2" : "px-2"} ${disabled ? "opacity-50" : ""}`}
        style={{ borderColor: warn ? C.coral : "#d1d5db", focusRingColor: C.teal }} />
    </div>
    {note && <span className={`text-xs ${warn ? "font-medium" : ""}`} style={{ color: warn ? C.coral : "#9ca3af" }}>{note}</span>}
  </div>
);
const Sel = ({ label, value, onChange, options, note }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs font-medium" style={{ color: C.navy }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="border rounded py-1.5 px-2 text-sm bg-white focus:outline-none focus:ring-2 w-full" style={{ borderColor: "#d1d5db" }}>
      {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
    {note && <span className="text-xs text-gray-400">{note}</span>}
  </div>
);
const Section = ({ title, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${C.teal}` }}>
      <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: C.navy }}>{title}</h3>
    </div>
    {children}
  </div>
);
const PinkNote = ({ children }) => (
  <div className="p-3 rounded text-xs mb-3" style={{ backgroundColor: C.pink, color: C.navy }}>{children}</div>
);
const Check = ({ label, checked, onChange, note, disabled, children }) => (
  <label className={`flex items-start gap-2 py-1 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
    <input type="checkbox" checked={checked} onChange={e => !disabled && onChange(e.target.checked)}
      disabled={disabled} className="mt-0.5 rounded" style={{ accentColor: C.teal }} />
    <div className="flex-1"><span className="text-sm" style={{ color: C.navy }}>{label}</span>
      {note && <div className="text-xs text-gray-400">{note}</div>}
      {children}</div>
  </label>
);

export default function App() {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ age: 22, country: "India", uni: "University of Melbourne", studyYears: 3, fieldOfStudy: "Computing" });
  const fld = FIELDS.find(f => f.name === profile.fieldOfStudy) || FIELDS[0];
  const [assumptions, setAssumptions] = useState({
    studentSavings: 0, hoursPerWeek: 15, hourlyWage: 24, partTimeStartMonth: 6, postStudyStartSalary: 70000,
    uniAccomMonths: 6, uniOther: 0,
    yaMaxRate: 677.20, austudyMaxRate: 677.20,
    freeArea: 539, taper1End: 646, taper1Rate: 0.50, taper2Rate: 0.60,
    raThreshold: 152, raMax: 215.40, raTaper: 0.75,
    taxBrackets: [[0, 18200, 0], [18200, 45000, 0.16], [45000, 135000, 0.30], [135000, 190000, 0.37], [190000, Infinity, 0.45]],
    hecsThreshold: 67000, hecsRate1: 0.15, hecsBand2: 125000, hecsRate2: 0.17, hecsBand3: 179285, hecsRate3: 0.10,
    hecsIndexation: 0.032, annualCspCost: 9537, ssafFee: 365,
    wageGrowth: 0.03, inflation: 0.03, totalYears: 10, livingCosts: null,
  });
  const [detailPeriod, setDetailPeriod] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [showY1Split, setShowY1Split] = useState(false);
  const [sslYears, setSSLYears] = useState([false, false, false]);
  const [sparkDD, setSparkDD] = useState([false, false, false]);
  const [sparkAmts, setSparkAmts] = useState([5000, 5000, 5000]);
  const [setupItems, setSetupItems] = useState(DEF_SETUP.map(([l, v]) => [l, v]));
  const [studyEssItems, setStudyEssItems] = useState(DEF_STUDY_ESS.map(([l, v]) => [l, v]));
  /* CHANGE 1: Add paItems state for editable pre-arrival costs */
  const [paItems, setPaItems] = useState(PRE_ARRIVAL[profile.country].map(([l, v]) => [l, v]));

  const sslEnabled = sslYears.some((v, i) => v && i < profile.studyYears);
  const toggleExp = k => setExpanded(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleSpark = i => setSparkDD(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  const updateSparkAmt = (i, v) => setSparkAmts(prev => { const n = [...prev]; n[i] = Math.min(Math.max(0, v), SPARK_MAX_AMT); return n; });
  const toggleSSL = i => setSSLYears(prev => { const n = [...prev]; n[i] = !n[i]; return n; });

  const p = profile; const a = assumptions;
  const city = UNIS[p.uni]; const cityDef = CITY_WEEKLY[city];
  const lc = a.livingCosts || cityDef;
  const lcTotal = Object.keys(LC_LABELS).reduce((s, k) => s + (lc[k] ?? cityDef[k]), 0);
  const cityAnnual = lcTotal * 52;
  const weeklyAccom = lc.accom ?? cityDef.accom;
  const weeklyOther = lcTotal - weeklyAccom;
  const weeklyWages = a.hoursPerWeek * a.hourlyWage;
  const uniAccomVal = Math.round(a.uniAccomMonths * weeklyAccom * (52 / 12));
  const uniOtherVal = Math.max(0, UNI_TOTAL - uniAccomVal);
  const uniTotal = uniAccomVal + uniOtherVal;
  const setupTotal = setupItems.reduce((s, [, v]) => s + v, 0);
  const studyEssTotal = studyEssItems.reduce((s, [, v]) => s + v, 0);

  const upP = (k, v) => setProfile(pr => ({ ...pr, [k]: v }));
  const upA = (k, v) => setAssumptions(pr => ({ ...pr, [k]: v }));
  const upLC = (k, v) => setAssumptions(pr => ({ ...pr, livingCosts: { ...(pr.livingCosts || cityDef), [k]: v } }));
  const resetLC = () => setAssumptions(pr => ({ ...pr, livingCosts: { ...cityDef } }));
  /* CHANGE 4 (part): Include paItems in resetSetup */
  const resetSetup = () => { setPaItems(PRE_ARRIVAL[p.country].map(([l, v]) => [l, v])); setSetupItems(DEF_SETUP.map(([l, v]) => [l, v])); setStudyEssItems(DEF_STUDY_ESS.map(([l, v]) => [l, v])); };

  useEffect(() => { const f = FIELDS.find(f => f.name === p.fieldOfStudy); if (f) setAssumptions(pr => ({ ...pr, annualCspCost: f.csp })); }, [p.fieldOfStudy]);
  const [prevCity, setPrevCity] = useState(city);
  useEffect(() => { if (city !== prevCity) { setAssumptions(pr => ({ ...pr, livingCosts: { ...CITY_WEEKLY[city] } })); setPrevCity(city); } }, [city, prevCity]);
  /* CHANGE 2: Auto-reset paItems when country changes */
  const [prevCountry, setPrevCountry] = useState(p.country);
  useEffect(() => { if (p.country !== prevCountry) { setPaItems(PRE_ARRIVAL[p.country].map(([l, v]) => [l, v])); setPrevCountry(p.country); } }, [p.country, prevCountry]);

  /* CHANGE 3: Compute paTotal from editable state instead of hardcoded PA_TOTALS */
  const paTotal = paItems.reduce((s, [, v]) => s + v, 0);
  const setupY1 = paTotal + setupTotal + studyEssTotal;
  const sparkSummary = useMemo(() => calcSparkSummary(sparkDD, sparkAmts, p.studyYears), [sparkDD, sparkAmts, p.studyYears]);
  const sslAnnualForYear = y => (y >= 1 && y <= 3 && y <= p.studyYears && sslYears[y - 1]) ? SSL_ANNUAL : 0;

  /* ═══ YEAR LOOP — core calculation engine ═══ */
  const allPeriods = useMemo(() => {
    const rows = []; let hd = 0, sslD = 0, sparkBal = 0;
    const fnAccom = weeklyAccom * 2; const fnW = weeklyWages * 2;
    const sparkRepayStartYear = p.studyYears + 1;
    const sparkRepayEndYear = p.studyYears + SPARK_REPAY_YEARS;

    // Year 1 H1 & H2
    const age1 = p.age; const isYA1 = age1 < 25;
    const payType1 = isYA1 ? "Youth Allowance" : "Austudy";
    const maxR1 = isYA1 ? a.yaMaxRate : a.austudyMaxRate;
    /* Income test reduction per fortnight (based on fortnightly wages when working) */
    const incTestRedFn1 = calcIncomeTestReduction(fnW, a.freeArea, a.taper1End, a.taper1Rate, a.taper2Rate);
    const h1Work = Math.max(0, 6 - a.partTimeStartMonth);
    const h2Work = Math.max(0, 12 - a.partTimeStartMonth) - h1Work;
    const h1WF = h1Work / 6; const h2WF = h2Work / 6;
    const accomMH1 = Math.min(a.uniAccomMonths, 6);
    const accomMH2 = Math.max(0, a.uniAccomMonths - 6);
    const uniAccomH1 = Math.round(accomMH1 * weeklyAccom * (52 / 12));
    const uniAccomH2 = Math.round(accomMH2 * weeklyAccom * (52 / 12));
    const ucH1 = uniAccomH1 + uniOtherVal; const ucH2 = uniAccomH2;
    const fullY1WorkFrac = Math.max(0, 12 - a.partTimeStartMonth) / 12;
    /* For tax: estimate full-year taxable income using the blended gov payment approach */
    const craPerFnFull1 = calcRA(fnAccom, a.raThreshold, a.raMax, a.raTaper);
    const combinedMaxFn1 = maxR1 + craPerFnFull1;
    const netGovPerFnWorking1 = Math.max(0, combinedMaxFn1 - incTestRedFn1);
    const netGovPerFnNotWorking1 = combinedMaxFn1;
    const fullY1Wages = weeklyWages * 52 * fullY1WorkFrac;
    const fullY1GovPayment = (netGovPerFnWorking1 * fullY1WorkFrac + netGovPerFnNotWorking1 * (1 - fullY1WorkFrac)) * 26;
    const fullY1Taxable = fullY1Wages + fullY1GovPayment;
    const fullY1Tax = calcTax(fullY1Taxable, a.taxBrackets);
    const y1ssl = sslAnnualForYear(1);
    const y1sparkAmt = sparkAmts[0] || SPARK_MAX_AMT;
    const y1spark = (sparkDD[0] && p.studyYears >= 1) ? y1sparkAmt : 0;

    const halves = [];
    for (let half = 1; half <= 2; half++) {
      const wf = half === 1 ? h1WF : h2WF;
      const wks = 26; const fns = 13;
      const wages = weeklyWages * wks * wf;
      const uc = half === 1 ? ucH1 : ucH2;
      const ac = weeklyAccom * wks; const oth = weeklyOther * wks; const liv = ac + oth;
      const setup = half === 1 ? setupY1 : 0;
      const ucAccomThis = half === 1 ? uniAccomH1 : uniAccomH2;
      /* RA fix: during uni-covered months student pays $0 rent (no RA);
         during self-funded months student pays full rent (full RA) */
      const uniCoveredMonths = half === 1 ? accomMH1 : accomMH2;
      const selfFundedWeeks = Math.max(0, wks - uniCoveredMonths * (52 / 12));
      const selfFundedFns = selfFundedWeeks / 2;
      const uniCoveredFns = fns - selfFundedFns;
      const fnFullAccom = weeklyAccom * 2;
      const craPerFnSelf = calcRA(fnFullAccom, a.raThreshold, a.raMax, a.raTaper);

      /* ═══ COMBINED INCOME TEST (YA + CRA) ═══
         Per Commonwealth regs, CRA has no separate income test.
         CRA is added to the base payment; the income test reduction
         is applied to the COMBINED total (YA + CRA).
         We compute net gov payment across 4 fortnight types:
           working × self-funded, working × uni-covered,
           non-working × self-funded, non-working × uni-covered */
      const workSelfFns = wf * selfFundedFns;
      const workUniFns = wf * uniCoveredFns;
      const noWorkSelfFns = (1 - wf) * selfFundedFns;
      const noWorkUniFns = (1 - wf) * uniCoveredFns;

      const netPerFnWorkSelf = Math.max(0, maxR1 + craPerFnSelf - incTestRedFn1);
      const netPerFnWorkUni = Math.max(0, maxR1 - incTestRedFn1);
      const netPerFnNoWorkSelf = maxR1 + craPerFnSelf;
      const netPerFnNoWorkUni = maxR1;

      const govNet = Math.round(
        (netPerFnWorkSelf * workSelfFns + netPerFnWorkUni * workUniFns
         + netPerFnNoWorkSelf * noWorkSelfFns + netPerFnNoWorkUni * noWorkUniFns) * 100) / 100;
      const govMaxYA = Math.round(maxR1 * fns * 100) / 100;
      const govMaxCRA = Math.round(craPerFnSelf * selfFundedFns * 100) / 100;
      const govIncomeTestReduction = -(govMaxYA + govMaxCRA - govNet);

      const savings = half === 1 ? a.studentSavings : 0;
      const totI = savings + wages + govNet + uc;
      const halfTaxable = wages + govNet;
      const tax = fullY1Taxable > 0 ? Math.round(fullY1Tax * (halfTaxable / fullY1Taxable)) : 0;
      hd += (a.annualCspCost + a.ssafFee) / 2;
      const totD = tax;
      const hSsl = half === 1 ? y1ssl : 0;
      const hSpark = half === 1 ? y1spark : 0;
      if (half === 1) { sslD += y1ssl; }
      const netFin = hSsl + hSpark;
      const netCF = totI - totD - liv - setup + netFin;
      halves.push({
        id: `y1h${half}`, year: 1, half, label: "Year 1",
        sublabel: half === 1 ? "H1 (Mths 1–6)" : "H2 (Mths 7–12)",
        isStudy: true, isTransition: false, isHalf: true,
        ageThisYear: age1, paymentType: payType1,
        studentSavings: savings, wages, taxableIncome: halfTaxable,
        govMaxYA, govMaxCRA, govIncomeTestReduction, govNetPayment: govNet,
        uniContrib: uc, totalIncome: totI, tax, hecsRepay: 0, totalDeductions: totD,
        accomCost: ac, accomUniCovered: Math.min(ucAccomThis, ac),
        accomSelfFunded: Math.max(0, ac - ucAccomThis),
        otherLivingCost: oth, livingCosts: liv, setupCosts: setup,
        sslDrawdown: hSsl, sparkDrawdown: hSpark, sparkRepay: 0, sslRepay: 0,
        netFinancing: netFin, netCashflow: totI - totD - liv - setup, netCashflowTotal: netCF,
        hecsDebt: Math.max(0, hd), sslDebtBal: sslD, sparkBalance: 0,
      });
    }
    if (sparkDD[0] && p.studyYears >= 1) sparkBal = y1sparkAmt * (1 + SPARK_FEE_RATE);

    const h1d = halves[0], h2d = halves[1];
    const sumF = (a, b, ...ks) => { const o = {}; for (const k of ks) o[k] = (a[k] || 0) + (b[k] || 0); return o; };
    const y1t = {
      id: "y1", year: 1, half: 0, label: "Year 1", sublabel: "Study",
      isStudy: true, isTransition: false, isHalf: false, ageThisYear: age1, paymentType: payType1,
      ...sumF(h1d, h2d, "studentSavings", "wages", "govMaxYA", "govMaxCRA", "govNetPayment", "uniContrib", "tax", "hecsRepay",
        "accomCost", "accomUniCovered", "accomSelfFunded", "otherLivingCost", "livingCosts", "setupCosts",
        "sslDrawdown", "sparkDrawdown", "sparkRepay", "sslRepay", "netFinancing", "netCashflow", "netCashflowTotal"),
      govIncomeTestReduction: (h1d.govIncomeTestReduction || 0) + (h2d.govIncomeTestReduction || 0),
      taxableIncome: (h1d.taxableIncome || 0) + (h2d.taxableIncome || 0),
      totalIncome: (h1d.totalIncome || 0) + (h2d.totalIncome || 0),
      totalDeductions: (h1d.totalDeductions || 0) + (h2d.totalDeductions || 0),
      hecsDebt: h2d.hecsDebt, sslDebtBal: sslD, sparkBalance: sparkBal > 0 ? Math.round(sparkBal) : 0,
    };
    rows.push(y1t, ...halves);

    // Years 2+
    for (let y = 2; y <= a.totalYears; y++) {
      const isStudy = y <= p.studyYears;
      const isTransition = y === p.studyYears + 1;
      const age = p.age + y - 1;
      const isYA = age < 25;
      const payType = isYA ? "Youth Allowance" : "Austudy";
      const maxR = isYA ? a.yaMaxRate : a.austudyMaxRate;
      const inf = Math.pow(1 + a.inflation, y - 1);
      const wgM = isStudy ? 1 : Math.pow(1 + a.wageGrowth, y - p.studyYears - 1);
      let wages = 0, govMaxYA = 0, govMaxCRA = 0, govIncomeTestReduction = 0, govNetPayment = 0;
      let tax = 0, hr = 0, taxableInc = 0;
      const ac = weeklyAccom * 52 * inf; const oth = weeklyOther * 52 * inf;
      let ySsl = 0, ySpark = 0, ySparkRep = 0, ySslRep = 0;

      if (isStudy) {
        wages = weeklyWages * 52;
        /* Combined income test: CRA has no separate income test.
           YA + CRA combined, then income test reduction applied to total. */
        const craPerFn = calcRA(fnAccom, a.raThreshold, a.raMax, a.raTaper);
        const incTestRedFn = calcIncomeTestReduction(fnW, a.freeArea, a.taper1End, a.taper1Rate, a.taper2Rate);
        const combinedMaxFn = maxR + craPerFn;
        const netPerFn = Math.max(0, combinedMaxFn - incTestRedFn);
        const fns = 26;
        govMaxYA = Math.round(maxR * fns * 100) / 100;
        govMaxCRA = Math.round(craPerFn * fns * 100) / 100;
        govNetPayment = Math.round(netPerFn * fns * 100) / 100;
        govIncomeTestReduction = -(govMaxYA + govMaxCRA - govNetPayment);
        taxableInc = wages + govNetPayment;
        tax = calcTax(taxableInc, a.taxBrackets);
        hd += (a.annualCspCost + a.ssafFee) * inf;
        ySsl = sslAnnualForYear(y);
        if (ySsl > 0) sslD += ySsl;
        if (y <= 3 && y <= p.studyYears && sparkDD[y - 1]) {
          const amt = sparkAmts[y - 1] || SPARK_MAX_AMT;
          ySpark = amt; sparkBal += amt * (1 + SPARK_FEE_RATE);
        }
      } else {
        const sal = a.postStudyStartSalary * wgM;
        wages = sal; taxableInc = sal;
        tax = calcTax(sal, a.taxBrackets);
        hd *= (1 + a.hecsIndexation);
        hr = calcHR(sal, hd, a); hd -= hr;
        sslD *= (1 + a.hecsIndexation);
        if (hd <= 0 && sslD > 0) { ySslRep = calcHR(sal, sslD, a); sslD -= ySslRep; }
        if (y >= sparkRepayStartYear && y <= sparkRepayEndYear && sparkSummary) {
          if (y === sparkRepayStartYear) sparkBal = sparkSummary.balAtRepay;
          const mr = SPARK_RATE / 12; let repThisYear = 0;
          for (let m = 0; m < 12; m++) { if (sparkBal <= 0) break; sparkBal += sparkBal * mr; const pmt = Math.min(sparkSummary.monthly, sparkBal); sparkBal -= pmt; repThisYear += pmt; }
          ySparkRep = Math.round(repThisYear);
        }
        if (y > sparkRepayEndYear) sparkBal = 0;
      }
      const liv = ac + oth;
      const totI = wages + govNetPayment;
      const totD = tax + hr;
      const netFin = ySsl + ySpark - ySparkRep - ySslRep;
      rows.push({
        id: `y${y}`, year: y, half: 0, label: `Year ${y}`,
        sublabel: isStudy ? "Study" : isTransition ? "Job Search / Working" : "Working",
        isStudy, isTransition, isHalf: false, ageThisYear: age, paymentType: payType,
        studentSavings: 0, wages, taxableIncome: taxableInc,
        govMaxYA, govMaxCRA, govIncomeTestReduction, govNetPayment,
        uniContrib: 0, totalIncome: totI, tax, hecsRepay: hr, totalDeductions: totD,
        accomCost: ac, accomUniCovered: 0, accomSelfFunded: ac,
        otherLivingCost: oth, livingCosts: liv, setupCosts: 0,
        sslDrawdown: ySsl, sparkDrawdown: ySpark, sparkRepay: ySparkRep, sslRepay: ySslRep,
        netFinancing: netFin, netCashflow: totI - totD - liv, netCashflowTotal: totI - totD - liv + netFin,
        hecsDebt: Math.max(0, hd), sslDebtBal: Math.max(0, Math.round(sslD)), sparkBalance: Math.max(0, Math.round(sparkBal)),
      });
    }
    return rows;
  }, [profile, assumptions, cityAnnual, setupY1, weeklyWages, weeklyAccom, weeklyOther, uniTotal, uniAccomVal, uniOtherVal, sslYears, sparkDD, sparkAmts, sparkSummary]);

  const periods = useMemo(() => {
    if (showY1Split) return allPeriods.filter(p => p.id !== "y1");
    return allPeriods.filter(p => !p.isHalf);
  }, [allPeriods, showY1Split]);

  const cumCF = useMemo(() => { let c = 0; return periods.map(pr => { c += pr.netCashflowTotal; return c; }); }, [periods]);
  const anyFinancing = sslEnabled || sparkDD.some((v, i) => v && i < p.studyYears);

  const ROWS = [
    { key: "h_i", label: "INCOME", hdr: true },
    { key: "sv", label: "Student Savings", f: "studentSavings" },
    { key: "uc", label: "University Contribution", f: "uniContrib" },
    { key: "gov_ya", label: "Max YA / Austudy Entitlement", f: "govMaxYA", studyOnly: true, parent: "gov_net", indent: 1 },
    { key: "gov_cra", label: "Max Rent Assistance Entitlement", f: "govMaxCRA", studyOnly: true, parent: "gov_net", indent: 1 },
    { key: "gov_red", label: "Less: Income Test Reduction", f: "govIncomeTestReduction", studyOnly: true, parent: "gov_net", indent: 1 },
    { key: "gov_net", label: "Government Payment (YA + Rent Assist)", f: "govNetPayment", studyOnly: true, expandable: true, tip: "Click to see income test detail" },
    { key: "w", label: "Wages (Part-time / Full-time)", f: "wages" },
    { key: "ti", label: "Total Income", f: "totalIncome", sub: true },
    { key: "h_e", label: "EXPENDITURE", hdr: true },
    { key: "sc", label: "Setup Costs (Year 1)", f: "setupCosts" },
    { key: "lc_accom", label: "Accommodation", f: "accomCost", parent: "lc", indent: 1 },
    { key: "lc_accom_uni", label: "of which: Uni Contribution", f: "accomUniCovered", parent: "lc", indent: 2, note: true },
    { key: "lc_accom_self", label: "of which: Self-funded", f: "accomSelfFunded", parent: "lc", indent: 2, note: true },
    { key: "lc_other", label: "Other Living Costs", f: "otherLivingCost", parent: "lc", indent: 1 },
    { key: "lc", label: "Total Living Costs", f: "livingCosts", expandable: true, tip: "Click to see cost breakdown" },
    { key: "h_d", label: "DEDUCTIONS", hdr: true },
    { key: "tx_inc", label: "Taxable Income", f: "taxableIncome", parent: "tx", indent: 1, muted: true },
    { key: "tx", label: "Tax", f: "tax", expandable: true, tip: "Click to see taxable income" },
    { key: "hc", label: "HECS Repayment", f: "hecsRepay" },
    { key: "td", label: "Total Deductions", f: "totalDeductions", sub: true },
    { key: "h_n", label: "", hdr: true },
    { key: "net_op", label: "Net Cash Flow Before Financing", f: "netCashflow", total: true },
    ...(anyFinancing ? [
      { key: "h_f", label: "FINANCING", hdr: true },
      ...(sslEnabled ? [
        { key: "h_ssl", label: "Student Start-up Loan", hdr: true, subhdr: true },
        { key: "ssl_dd", label: "SSL Drawdown", f: "sslDrawdown", studyOnly: true, indent: 1 },
        { key: "ssl_rp", label: "SSL Repayment", f: "sslRepay", indent: 1 },
      ] : []),
      ...(sparkDD.some((v, i) => v && i < p.studyYears) ? [
        { key: "h_spark", label: "Spark Loan", hdr: true, subhdr: true },
        { key: "spark_dd", label: "Spark Loan Drawdown", f: "sparkDrawdown", indent: 1 },
        { key: "spark_rp", label: "Spark Loan Repayment", f: "sparkRepay", indent: 1 },
      ] : []),
      { key: "nf", label: "Net Financing", f: "netFinancing", sub: true },
    ] : []),
    { key: "h_n2", label: "", hdr: true },
    { key: "net", label: anyFinancing ? "Net Cash Flow (incl. Financing)" : "Net Cash Flow", f: "netCashflowTotal", total: true },
    { key: "cum", label: "Cumulative Cash Flow", f: "cumCashflow", cum: true },
    { key: "h_debt", label: "DEBT POSITIONS", hdr: true },
    { key: "debt", label: "HECS Debt Outstanding", f: "hecsDebt", debt: true },
    ...(sslEnabled ? [{ key: "ssl_bal", label: "SSL Debt Outstanding", f: "sslDebtBal", debt: true }] : []),
    ...(sparkDD.some((v, i) => v && i < p.studyYears) ? [{ key: "spark_bal", label: "Spark Loan Balance", f: "sparkBalance", debt: true }] : []),
  ];

  const TABS = [["profile", "Student Profile"], ["setup", "Setup Costs"], ["assumptions", "Assumptions"], ["funding", "Funding"], ["cashflows", "Annual Cashflows"]];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="rounded-lg p-4 mb-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #4a6aaa 100%)` }}>
          <div className="flex items-center gap-4">
            <img src={LOGO} alt="Skill Path" className="h-10 object-contain" style={{ filter: "brightness(0) invert(1)" }} onError={e => { e.target.style.display = "none"; }} />
            <div>
              <h1 className="text-lg font-bold text-white">RSSP Student Budgeting Tool</h1>
              <p className="text-xs text-white opacity-70">All currency values are in Australian dollars</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-4 border-b overflow-x-auto" style={{ borderColor: "#e5e7eb" }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap"
              style={{ borderColor: tab === k ? C.teal : "transparent", color: tab === k ? C.navy : "#9ca3af", fontWeight: tab === k ? 700 : 500 }}>
              {l}
            </button>
          ))}
        </div>

        {/* ═══ STUDENT PROFILE ═══ */}
        {tab === "profile" && (
          <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: C.navy }}>Student Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Inp label="Age at Year 1" value={p.age} onChange={v => upP("age", v)} min={17} max={60} note={`${p.age < 25 ? "Youth Allowance" : "Austudy"} eligible`} />
              <Sel label="Country of Origin" value={p.country} onChange={v => upP("country", v)} options={Object.keys(PRE_ARRIVAL)} />
              <Sel label="University" value={p.uni} onChange={v => upP("uni", v)} options={Object.keys(UNIS)} note={`City: ${city}`} />
              <Inp label="Study Duration (years)" value={p.studyYears} onChange={v => upP("studyYears", v)} min={1} max={6} />
              <Sel label="Field of Study" value={p.fieldOfStudy} onChange={v => upP("fieldOfStudy", v)} options={FIELDS.map(f => ({ value: f.name, label: f.name }))} />
            </div>
            <div className="mt-6 p-4 rounded text-xs" style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
              <strong>Disclaimer:</strong> This budgeting tool is provided to students in the RSSP as a guide to assist them in their understanding of the potential costs associated with studying in Australia. The model is indicative only and has not taken into account the student's personal situation. Students should seek professional advice based on their individual circumstances.
            </div>
          </div>
        )}

        {/* ═══ SETUP COSTS ═══ */}
        {tab === "setup" && (
          <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold" style={{ color: C.navy }}>Year 1 Setup Costs</h2>
              <button onClick={resetSetup} className="text-xs underline" style={{ color: C.navy }}>Reset All</button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {/* CHANGE 4: Pre-Arrival column now editable with inputs */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold uppercase" style={{ color: C.navy }}>Pre-Arrival ({p.country})</h3>
                  <button onClick={() => setPaItems(PRE_ARRIVAL[p.country].map(([l, v]) => [l, v]))} className="text-xs underline" style={{ color: C.navy }}>Reset</button>
                </div>
                {paItems.map(([n, c], i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-0.5">
                    <span>{n}</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" value={c} onChange={e => { const v = [...paItems]; v[i] = [n, parseFloat(e.target.value) || 0]; setPaItems(v); }}
                        className="border rounded py-0.5 pl-5 pr-1 text-sm text-right w-full" style={{ borderColor: "#d1d5db" }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 mt-1 border-t"><span>Subtotal</span><span className="font-mono">{fmt(paTotal)}</span></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold uppercase" style={{ color: C.navy }}>Initial Setup</h3>
                  <button onClick={() => setSetupItems(DEF_SETUP.map(([l, v]) => [l, v]))} className="text-xs underline" style={{ color: C.navy }}>Reset</button>
                </div>
                {setupItems.map(([n, c], i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-0.5">
                    <span>{n}</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" value={c} onChange={e => { const v = [...setupItems]; v[i] = [n, parseFloat(e.target.value) || 0]; setSetupItems(v); }}
                        className="border rounded py-0.5 pl-5 pr-1 text-sm text-right w-full" style={{ borderColor: "#d1d5db" }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 mt-1 border-t"><span>Subtotal</span><span className="font-mono">{fmt(setupTotal)}</span></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold uppercase" style={{ color: C.navy }}>Study Essentials</h3>
                  <button onClick={() => setStudyEssItems(DEF_STUDY_ESS.map(([l, v]) => [l, v]))} className="text-xs underline" style={{ color: C.navy }}>Reset</button>
                </div>
                {studyEssItems.map(([n, c], i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-0.5">
                    <span>{n}</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" value={c} onChange={e => { const v = [...studyEssItems]; v[i] = [n, parseFloat(e.target.value) || 0]; setStudyEssItems(v); }}
                        className="border rounded py-0.5 pl-5 pr-1 text-sm text-right w-full" style={{ borderColor: "#d1d5db" }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 mt-1 border-t"><span>Subtotal</span><span className="font-mono">{fmt(studyEssTotal)}</span></div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded flex justify-between items-center" style={{ backgroundColor: C.cyan }}>
              <span className="text-sm font-semibold" style={{ color: C.navy }}>Total Year 1 Setup Costs</span>
              <span className="text-lg font-bold font-mono" style={{ color: C.navy }}>{fmt(setupY1)}</span>
            </div>
          </div>
        )}

        {/* ═══ ASSUMPTIONS ═══ */}
        {tab === "assumptions" && (
          <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#e5e7eb" }}>
            <Section title="Savings, Part-time Work and Employment">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <Inp label="Student Savings (Year 1)" value={a.studentSavings} onChange={v => upA("studentSavings", v)} step={100} dollar note="Lump sum in Year 1 H1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <Inp label="Part time work – hours/week" value={a.hoursPerWeek} onChange={v => upA("hoursPerWeek", v)} min={0} max={48} />
                <Inp label="Hourly wage" value={a.hourlyWage} onChange={v => upA("hourlyWage", v)} step={0.5} dollar />
                <Inp label="PT work starts (month)" value={a.partTimeStartMonth} onChange={v => upA("partTimeStartMonth", v)} min={1} max={12} note={`First ${a.partTimeStartMonth - 1} months no work`} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Post-study salary (annual)" value={a.postStudyStartSalary} onChange={v => upA("postStudyStartSalary", v)} step={1000} dollar />
              </div>
            </Section>
            <Section title="University Contribution">
              <PinkNote>Total university contribution is capped at {fmt(UNI_TOTAL)}. Accommodation portion is calculated from months × weekly rate; the remainder automatically fills as "Other".</PinkNote>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Accommodation months covered" value={a.uniAccomMonths} onChange={v => upA("uniAccomMonths", v)} min={0} max={12}
                  note={`= ${fmt(uniAccomVal)} accom + ${fmt(uniOtherVal)} other`} />
              </div>
            </Section>
            <Section title="YA / Austudy">
              <PinkNote>
                Youth Allowance is for students under 25. Austudy is for students 25 and over. This model assumes the student is single with no children and living away from home. Payments reduce in accordance with a personal income test as described below. More info:{" "}
                <a href="https://www.servicesaustralia.gov.au/youth-allowance" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>Youth Allowance</a> |{" "}
                <a href="https://www.servicesaustralia.gov.au/austudy" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>Austudy</a>
              </PinkNote>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Inp label="YA Max (fortnightly)" value={a.yaMaxRate} onChange={() => {}} step={0.1} dollar disabled
                  note="Single, no children, 18+, away from home" />
                <Inp label="Austudy Max (fortnightly)" value={a.austudyMaxRate} onChange={() => {}} step={0.1} dollar disabled
                  note="Single, no children" />
              </div>
              <div className="p-3 rounded text-xs mb-2" style={{ backgroundColor: "#f0f4ff", color: C.navy, border: `1px solid ${C.navy}20` }}>
                <h4 className="font-semibold mb-1">How the personal income test works</h4>
                <p className="mb-1"><strong>Youth Allowance / Austudy (students):</strong> You can earn up to <strong>${a.freeArea}</strong> per fortnight before your payment is affected (the "income free area"). For each dollar earned between ${a.freeArea} and ${a.taper1End}, your combined payment reduces by <strong>50 cents</strong>. For each dollar above ${a.taper1End}, your combined payment reduces by <strong>60 cents</strong>. The reduction is applied to your total payment (YA/Austudy + Rent Assistance combined). An Income Bank allows you to accumulate unused free area credits in low-income fortnights to offset higher-income fortnights.</p>
              </div>
            </Section>
            <Section title="Rent Assistance">
              <PinkNote>
                Rent Assistance is an additional payment for eligible students. This model assumes the student is single and is not sharing.{" "}
                <a href="https://www.servicesaustralia.gov.au/how-much-rent-assistance-you-can-get?context=22206" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>More info</a>
              </PinkNote>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: C.cyan }}>
                      <th className="text-left p-2 font-semibold" style={{ color: C.navy }}>If you're</th>
                      <th className="text-left p-2 font-semibold" style={{ color: C.navy }}>Your fortnightly rent is more than</th>
                      <th className="text-left p-2 font-semibold" style={{ color: C.navy }}>To get the maximum payment your fortnightly rent is at least</th>
                      <th className="text-left p-2 font-semibold" style={{ color: C.navy }}>The maximum fortnightly payment is</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RA_TABLE.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td className="p-2">{row.situation}</td>
                        <td className="p-2 font-mono">{fmt2(row.threshold)}</td>
                        <td className="p-2 font-mono">{fmt2(row.ceiling)}</td>
                        <td className="p-2 font-mono font-semibold">{fmt2(row.max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 rounded text-xs" style={{ backgroundColor: "#f0f4ff", color: C.navy, border: `1px solid ${C.navy}20` }}>
                <h4 className="font-semibold mb-1">How Rent Assistance works</h4>
                <p className="mb-1">Rent Assistance is calculated based on the rent you pay. For every $1 of fortnightly rent you pay above the rent threshold ({fmt(a.raThreshold)}), you receive <strong>75 cents</strong> in Rent Assistance, up to the maximum payment.</p>
                <p>Rent Assistance is <strong>not subject to a separate income test</strong>. It is added to your qualifying payment (YA or Austudy) to form a combined maximum rate. The personal income test reduction is then applied to this combined total. This means your Rent Assistance is only affected once the income test reduction exceeds your base YA/Austudy amount.</p>
              </div>
            </Section>
            <Section title="Expenses">
              <PinkNote>
                These are Skill Path assumptions based on the government cost of living calculator at{" "}
                <a href="https://costofliving.studyaustralia.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>costofliving.studyaustralia.gov.au</a>.
                Defaults update when you change university. You can override any value below.
              </PinkNote>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium" style={{ color: C.navy }}>Weekly living costs — {city}</span>
                <button onClick={resetLC} className="text-xs underline" style={{ color: C.navy }}>Reset to defaults</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {Object.entries(LC_LABELS).map(([k, label]) => (
                  <Inp key={k} label={label} value={lc[k] ?? cityDef[k]} onChange={v => upLC(k, v)} min={0} step={1} dollar
                    note={lc[k] !== cityDef[k] ? `Default: $${cityDef[k]}` : ""} />
                ))}
              </div>
              <div className="flex justify-between items-center p-2 rounded text-sm" style={{ backgroundColor: C.cyan }}>
                <span className="font-medium" style={{ color: C.navy }}>Total Weekly</span>
                <span className="font-mono font-semibold" style={{ color: C.navy }}>${lcTotal.toLocaleString()}/wk</span>
              </div>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <span>Annual (×52)</span><span className="font-mono">{fmt(cityAnnual)}</span>
              </div>
            </Section>
            <Section title="Tuition Fees">
              <PinkNote>
                More information about tuition fees and the HECS scheme is available{" "}
                <a href="https://www.studyassist.gov.au/financial-and-study-support/commonwealth-supported-places/student-contribution-amounts" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>here</a>.
              </PinkNote>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Annual Tuition Fees (CSP FTSE)" value={a.annualCspCost} onChange={() => {}} step={100} dollar disabled
                  note={`${p.fieldOfStudy} — Band ${fld.band}`} />
              </div>
            </Section>
            <Section title="HECS-HELP Repayment">
              <PinkNote>These rates are set by the Australian Government and are not editable. More information is available at <a href="https://www.ato.gov.au/individuals-and-families/study-and-training-support-loans/repaying-your-loan" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>ato.gov.au</a>.</PinkNote>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Threshold" value={a.hecsThreshold} onChange={() => {}} step={1000} dollar disabled />
                <Inp label="Rate 1 (above threshold)" value={a.hecsRate1} onChange={() => {}} step={0.01} disabled />
                <Inp label="Band 2" value={a.hecsBand2} onChange={() => {}} step={1000} dollar disabled />
                <Inp label="Rate 2 (above Band 2)" value={a.hecsRate2} onChange={() => {}} step={0.01} disabled />
                <Inp label="Band 3" value={a.hecsBand3} onChange={() => {}} step={1000} dollar disabled />
                <Inp label="Rate 3 (above Band 3)" value={a.hecsRate3} onChange={() => {}} step={0.01} disabled />
                <Inp label="HECS Indexation Rate" value={a.hecsIndexation} onChange={() => {}} step={0.001} note="0.032 = 3.2%" disabled />
              </div>
            </Section>
            <Section title="SSAF (Student Services & Amenities Fee)">
              <PinkNote>
                It can be deferred via SA-HELP and is added to your HELP debt. Max $373/yr. Details at{" "}
                <a href="https://www.studyassist.gov.au/financial-and-study-support/sa-help" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, textDecoration: "underline" }}>studyassist.gov.au (SA-HELP)</a>.
              </PinkNote>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Annual SSAF (deferred via SA-HELP)" value={a.ssafFee} onChange={v => upA("ssafFee", v)} step={1} dollar note="Added to HELP debt each study year" />
              </div>
            </Section>
            <Section title="Tax Brackets (2025-26)">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr style={{ backgroundColor: C.cyan }}>
                    <th className="text-left p-2">From</th><th className="text-left p-2">To</th><th className="text-left p-2">Rate</th>
                  </tr></thead>
                  <tbody>{a.taxBrackets.map(([lo, hi, r], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td className="p-2 font-mono">{fmt(lo)}</td>
                      <td className="p-2 font-mono">{hi === Infinity ? "+" : fmt(hi)}</td>
                      <td className="p-2">{(r * 100).toFixed(0)}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Section>
            <Section title="Growth Rates">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Wage Growth (annual)" value={a.wageGrowth} onChange={v => upA("wageGrowth", v)} step={0.01} note="0.03 = 3%" />
                <Inp label="Inflation (annual)" value={a.inflation} onChange={v => upA("inflation", v)} step={0.01} note="Applied to living costs & tuition fees" />
              </div>
            </Section>
            <Section title="Model Settings">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Inp label="Total Model Years" value={a.totalYears} onChange={v => upA("totalYears", v)} min={p.studyYears + 1} max={20} />
              </div>
            </Section>
          </div>
        )}

        {/* ═══ FUNDING ═══ */}
        {tab === "funding" && (
          <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: C.navy }}>Funding Options</h2>
            <p className="text-xs text-gray-500 mb-4">
              The income and expense assumptions on the previous page may create a monetary shortfall in your budget. This page provides some funding options for you to consider to bridge any gap between income and expenses.
            </p>
            <div className="mb-5 p-3 rounded" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: C.navy }}>Annual Cashflow Gap (before financing)</h4>
              <div className="flex gap-3 flex-wrap">
                {allPeriods.filter(p => !p.isHalf && p.isStudy).map(pr => (
                  <div key={pr.id} className="text-center px-3 py-1.5 rounded" style={{ backgroundColor: pr.netCashflow < 0 ? "#fef2f2" : C.cyan }}>
                    <div className="text-xs font-medium" style={{ color: C.navy }}>{pr.label}</div>
                    <div className="text-sm font-mono font-semibold" style={{ color: pr.netCashflow < 0 ? C.coral : C.navy }}>{fmt(pr.netCashflow)}</div>
                  </div>
                ))}
              </div>
            </div>
            <Section title="Student Start-up Loan (SSL)">
              <PinkNote>Government loan of {fmt(SSL_PER_PERIOD)} per semester ({fmt(SSL_ANNUAL)}/yr). Added to your HELP debt and repaid via compulsory HECS repayments after your HECS balance is cleared.</PinkNote>
              <div className="flex gap-3 flex-wrap">
                {[0, 1, 2].map(i => (
                  <div key={i} className="p-3 rounded" style={{ backgroundColor: sslYears[i] && i < p.studyYears ? "#f0fdf4" : "#f9fafb", border: `1px solid ${sslYears[i] && i < p.studyYears ? C.teal : "#e5e7eb"}`, opacity: i >= p.studyYears ? 0.4 : 1 }}>
                    <Check label={`Year ${i + 1}`} checked={sslYears[i] && i < p.studyYears} onChange={() => toggleSSL(i)}
                      disabled={i >= p.studyYears} note={i >= p.studyYears ? "Beyond study duration" : `${fmt(SSL_ANNUAL)}/yr`} />
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Spark Private Loan">
              <PinkNote>Private loan up to {fmt(SPARK_MAX_AMT)}/year during study. {(SPARK_RATE * 100).toFixed(0)}% interest, {(SPARK_FEE_RATE * 100).toFixed(0)}% admin fee. Interest accrues during study (grace period), repaid over {SPARK_REPAY_YEARS} years post-study.</PinkNote>
              <div className="flex gap-3 flex-wrap mb-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="p-3 rounded" style={{ backgroundColor: sparkDD[i] && i < p.studyYears ? "#f0fdf4" : "#f9fafb", border: `1px solid ${sparkDD[i] && i < p.studyYears ? C.teal : "#e5e7eb"}`, opacity: i >= p.studyYears ? 0.4 : 1 }}>
                    <Check label={`Year ${i + 1}`} checked={sparkDD[i] && i < p.studyYears} onChange={() => toggleSpark(i)}
                      disabled={i >= p.studyYears} note={i >= p.studyYears ? "Beyond study duration" : ""}>
                      {sparkDD[i] && i < p.studyYears && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs" style={{ color: C.navy }}>Amount:</span>
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                            <input type="number" value={sparkAmts[i]} onChange={e => updateSparkAmt(i, parseFloat(e.target.value) || 0)}
                              min={0} max={SPARK_MAX_AMT} className="border rounded py-1 pl-5 pr-1 text-sm w-full" style={{ borderColor: "#d1d5db" }} />
                          </div>
                          <span className="text-xs text-gray-400">max {fmt(SPARK_MAX_AMT)}</span>
                        </div>
                      )}
                    </Check>
                  </div>
                ))}
              </div>
              {sparkSummary && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#f8fafc", border: `1px solid ${C.navy}20` }}>
                  <h4 className="text-xs font-bold uppercase mb-2" style={{ color: C.navy }}>Spark Loan Summary</h4>
                  <div className="space-y-1">
                    {[
                      ["Total Drawn", fmt(sparkSummary.drawn)],
                      ["Admin Fee (5%)", fmt(sparkSummary.fee)],
                      ["Principal (incl. fee)", fmt(sparkSummary.principal)],
                      ["Grace Period Interest", fmt(Math.round(sparkSummary.graceInterest))],
                      ["Balance at Repayment Start", fmt(Math.round(sparkSummary.balAtRepay))],
                      ["Monthly Repayment", fmt(sparkSummary.monthly)],
                      ["Total Interest", fmt(Math.round(sparkSummary.totalInterest))],
                      ["Total Repaid", fmt(Math.round(sparkSummary.totalRepaid))],
                    ].map(([label, val], i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5" style={{ borderBottom: i < 7 ? "1px solid rgba(56,85,146,0.15)" : "none" }}>
                        <span className="text-sm font-semibold" style={{ color: C.navy }}>{label}</span>
                        <span className="text-sm font-mono text-right" style={{ color: C.navy }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!sparkSummary && <div className="text-xs text-gray-400 italic">Select at least one drawdown year to see loan summary.</div>}
            </Section>
          </div>
        )}

        {/* ═══ ANNUAL CASHFLOWS ═══ */}
        {tab === "cashflows" && (
          <div className="bg-white rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
            <div className="p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: C.navy }}>Annual Cashflows — {p.uni} ({city})</h2>
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: C.navy }}>
                  <input type="checkbox" checked={showY1Split} onChange={e => setShowY1Split(e.target.checked)} style={{ accentColor: C.teal }} />
                  Show Year 1 half-year split
                </label>
              </div>
              <p className="text-xs text-gray-500">Click any column header for breakdown · Click row labels with ▸ to expand detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: C.navy }}>
                    <th className="text-left px-3 py-2 font-semibold sticky left-0 min-w-44 z-10" style={{ backgroundColor: C.navy, color: "white" }}></th>
                    {periods.map(pr => (
                      <th key={pr.id}
                        onClick={() => { if (pr.id === "y1") setShowY1Split(true); else setDetailPeriod(detailPeriod === pr.id ? null : pr.id); }}
                        className="px-2 py-2 text-right font-semibold min-w-24 cursor-pointer transition"
                        style={{ color: "white", backgroundColor: pr.isHalf ? "#4a6da8" : detailPeriod === pr.id ? C.coral : C.navy }}>
                        <div className="font-semibold">{pr.isHalf ? pr.sublabel : pr.label}</div>
                        <div className="text-xs font-normal" style={{ opacity: 0.7 }}>{pr.sublabel === "Study" || pr.isHalf ? "Study" : pr.sublabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, ri) => {
                    if (row.hdr) return (
                      <tr key={row.key}>
                        <td colSpan={periods.length + 1} className="px-3 py-2 font-bold text-xs uppercase tracking-wider sticky left-0 z-10"
                          style={{ backgroundColor: row.subhdr ? "#f0f4ff" : "#f3f4f6", color: C.navy, borderTop: row.subhdr ? "none" : ri > 0 ? `2px solid ${C.navy}30` : "none" }}>
                          {row.label}
                        </td>
                      </tr>
                    );
                    if (row.parent && !expanded.has(row.parent)) return null;
                    const isTotal = row.total; const isSub = row.sub; const isCum = row.cum; const isDebt = row.debt;
                    const isNetHighlight = row.key === "net" || row.key === "net_op";
                    return (
                      <tr key={row.key} style={{ backgroundColor: isNetHighlight ? `${C.teal}15` : isTotal ? "#f0fdf4" : "white", borderBottom: "1px solid #f3f4f6" }}>
                        <td className="px-3 py-1.5 sticky left-0 z-10"
                          style={{ backgroundColor: isNetHighlight ? `${C.teal}15` : isTotal ? "#f0fdf4" : "white", paddingLeft: `${12 + (row.indent || 0) * 16}px`, cursor: row.expandable ? "pointer" : "default", color: row.muted ? "#9ca3af" : row.note ? C.teal : C.navy, fontWeight: isSub || isTotal || isCum || isDebt || isNetHighlight ? 600 : 400, fontStyle: row.note || row.muted ? "italic" : "normal" }}
                          onClick={() => row.expandable && toggleExp(row.key)}>
                          {row.expandable && <span className="mr-1">{expanded.has(row.key) ? "▾" : "▸"}</span>}
                          {row.label}
                        </td>
                        {periods.map((pr, pi) => {
                          if (row.f === "cumCashflow") {
                            const v = cumCF[pi]; const neg = v < 0;
                            return <td key={pr.id} className="p-2 text-right font-mono" style={{ color: neg ? C.coral : "#92400e", fontWeight: 600, backgroundColor: isNetHighlight ? `${C.teal}30` : "transparent" }}>{fmt(v)}</td>;
                          }
                          const val = pr[row.f];
                          if (row.studyOnly && !pr.isStudy) return <td key={pr.id} className="p-2 text-center text-gray-300" style={{ backgroundColor: isNetHighlight ? `${C.teal}30` : "transparent" }}>-</td>;
                          if (val === 0 && !isSub && !isTotal && !isNetHighlight) return <td key={pr.id} className="p-2 text-center text-gray-300" style={{ backgroundColor: isNetHighlight ? `${C.teal}30` : "transparent" }}>-</td>;
                          const neg = val < 0;
                          return (
                            <td key={pr.id} className="p-2 text-right font-mono"
                              style={{ color: neg ? C.coral : row.muted ? "#9ca3af" : isNetHighlight ? "#065f46" : isTotal ? C.navy : isCum ? "#92400e" : isDebt ? C.coral : C.navy,
                                fontWeight: isSub || isTotal || isCum || isDebt || isNetHighlight ? 600 : 400,
                                fontStyle: row.muted ? "italic" : "normal",
                                backgroundColor: isNetHighlight ? `${C.teal}30` : "transparent" }}>
                              {fmt(val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {detailPeriod && (() => {
              const pr = allPeriods.find(p => p.id === detailPeriod);
              if (!pr) return null;
              const wks = pr.isHalf ? 26 : 52;
              return (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold" style={{ color: C.navy }}>{pr.label} {pr.isHalf ? pr.sublabel : ""} Breakdown</h3>
                    <button onClick={() => setDetailPeriod(null)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: C.cyan, color: C.navy }}>Close</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <h4 className="font-semibold uppercase mb-1" style={{ color: C.navy }}>Income</h4>
                      {pr.studentSavings > 0 && <div>Student Savings: {fmt(pr.studentSavings)}</div>}
                      <div>Wages ({wks} wks): {fmt(pr.wages)}</div>
                      {pr.isStudy && <div>Government Payment: {fmt(pr.govNetPayment)}</div>}
                      {pr.isStudy && <div style={{ paddingLeft: 12, color: "#6b7280" }}>Max {pr.paymentType}: {fmt(pr.govMaxYA)}</div>}
                      {pr.isStudy && <div style={{ paddingLeft: 12, color: "#6b7280" }}>Max Rent Assistance: {fmt(pr.govMaxCRA)}</div>}
                      {pr.isStudy && <div style={{ paddingLeft: 12, color: "#6b7280" }}>Income Test Reduction: {fmt(pr.govIncomeTestReduction)}</div>}
                      {pr.uniContrib > 0 && <div>Uni Contribution: {fmt(pr.uniContrib)}</div>}
                      <div className="font-semibold mt-1">Total Income: {fmt(pr.totalIncome)}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold uppercase mb-1" style={{ color: C.navy }}>Tax & HECS</h4>
                      <div>Taxable income: {fmt(pr.taxableIncome)}</div>
                      <div>Tax: {fmt(pr.tax)}</div>
                      <div>HECS repayment: {fmt(pr.hecsRepay)}</div>
                      <div>CSP added to debt: {fmt(a.annualCspCost)}</div>
                      <div>SSAF (SA-HELP): {fmt(a.ssafFee)}</div>
                      <div>Debt outstanding: {fmt(pr.hecsDebt + pr.hecsRepay)}</div>
                      <div>Remaining: {fmt(pr.hecsDebt)}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold uppercase mb-1" style={{ color: C.navy }}>Living Costs ({city})</h4>
                      <div>Accommodation ({wks} wks × {fmt(weeklyAccom)}): {fmt(pr.accomCost)}</div>
                      {pr.accomUniCovered > 0 && <div style={{ color: C.teal }}>  of which uni covered: {fmt(pr.accomUniCovered)}</div>}
                      {pr.accomUniCovered > 0 && <div>  of which self-funded: {fmt(pr.accomSelfFunded)}</div>}
                      <div>Other living costs: {fmt(pr.otherLivingCost)}</div>
                      <div className="font-semibold">Total: {fmt(pr.livingCosts)}</div>
                      {pr.setupCosts > 0 && (<>
                        <h4 className="font-semibold uppercase mt-3 mb-1" style={{ color: C.navy }}>Setup Costs</h4>
                        <div>Pre-arrival ({p.country}): {fmt(paTotal)}</div>
                        <div>Initial setup: {fmt(setupTotal)}</div>
                        <div>Study essentials: {fmt(studyEssTotal)}</div>
                        <div className="font-semibold">Total: {fmt(pr.setupCosts)}</div>
                      </>)}
                      {(pr.sslDrawdown > 0 || pr.sparkDrawdown > 0 || pr.sparkRepay > 0 || pr.sslRepay > 0) && (
                        <>
                          <h4 className="font-semibold uppercase mt-3 mb-1" style={{ color: C.navy }}>Financing</h4>
                          {pr.sslDrawdown > 0 && <div>SSL drawdown: {fmt(pr.sslDrawdown)}</div>}
                          {pr.sparkDrawdown > 0 && <div>Spark drawdown: {fmt(pr.sparkDrawdown)}</div>}
                          {pr.sparkRepay > 0 && <div>Spark repayment: {fmt(-pr.sparkRepay)}</div>}
                          {pr.sslRepay > 0 && <div>SSL repayment: {fmt(-pr.sslRepay)}</div>}
                          <div className="font-semibold">Net financing: {fmt(pr.netFinancing)}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}