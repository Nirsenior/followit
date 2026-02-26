
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, Search, Plus, LogOut, X, Edit3, Trash2, LayoutDashboard,
  Table as TableIcon, FileText, CheckCircle2, AlertCircle, Save, Download, ChevronDown, ChevronUp, Check, ArrowUpCircle, ArrowRight,
  UserPlus, Heart, Baby, ShieldCheck, UploadCloud, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  INSURANCE_TYPE_LABELS,
  PRIVATE_SUB_POLICIES,
  INDIVIDUAL_POLICY_COMPANIES,
  InsuranceType,
  Customer,
  Policy,
  UserProfile,
  PremiumScheduleItem,
  FamilyMember,
  Relationship,
  FINANCIAL_TYPES
} from '../types';
import { POLICY_MASTER_LIST, getCoveragesForCompanyAndType, CoverageCategory } from '../data/policy_master_list';
import { INVESTMENT_TRACKS } from '../data/investment_tracks';
import { calcFinancialScope, calcFinancialOngoing, FinancialInputs, CommissionRates } from '../utils/commissionCalc';

/* --- Constants & Helpers --- */
const ELEMENTARY_OPTIONS = {
  'רכב': ['מקיף', 'חובה', 'צד ג\''],
  'מבנה': ['מבנה', 'תכולה', 'צד ג\'', 'חבות מעבידים'],
  'עסק': ['תכולה', 'מבנה', 'צד ג\'', 'חבות מעבידים', 'חבות מוצר', 'עבודות חוץ', 'אחריות מקצועית']
};

/* --- Helpers --- */
const calculateAge = (dob: string, targetMonth: number, targetYear: number) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  let age = targetYear - birthDate.getFullYear();
  const m = targetMonth - birthDate.getMonth();
  if (m < 0) age--;
  return age;
};

const getEffectivePremium = (policy: Policy, customerDob: string, targetMonth: number, targetYear: number) => {
  if ((policy.type === 'health' || policy.type === 'life' || policy.type === 'critical_illness') && policy.premiumSchedule && policy.premiumSchedule.length > 0) {
    const age = calculateAge(customerDob, targetMonth, targetYear);
    const scheduleItem = policy.premiumSchedule.find(item => item.age === age);
    return scheduleItem ? scheduleItem.premium : policy.monthlyCost;
  }
  return policy.monthlyCost;
};

const calculateCustomerTotalPremium = (customer: Customer, targetMonth: number, targetYear: number) => {
  let total = 0;
  // Primary policies
  customer.policies.forEach(p => {
    total += getEffectivePremium(p, customer.dateOfBirth, targetMonth, targetYear);
  });
  // Family policies
  customer.familyMembers?.forEach(fm => {
    fm.policies.forEach(p => {
      // Find a reference schedule if shared
      let scheduleToUse = p.premiumSchedule;
      if (fm.isPremiumSharedWithPrimary && (!p.premiumSchedule || p.premiumSchedule.length === 0)) {
        // Find a health/life/critical policy in primary that has a schedule
        const primaryPrivateWithSchedule = customer.policies.find(pp => (pp.type === 'health' || pp.type === 'life' || pp.type === 'critical_illness') && pp.premiumSchedule && pp.premiumSchedule.length > 0);
        if (primaryPrivateWithSchedule) {
          scheduleToUse = primaryPrivateWithSchedule.premiumSchedule;
        }
      }

      if ((p.type === 'health' || p.type === 'life' || p.type === 'critical_illness') && scheduleToUse && scheduleToUse.length > 0) {
        const age = calculateAge(fm.dateOfBirth, targetMonth, targetYear);
        const scheduleItem = scheduleToUse.find(item => item.age === age);
        total += scheduleItem ? scheduleItem.premium : p.monthlyCost;
      } else {
        total += p.monthlyCost;
      }
    });
  });
  return total;
};



/* --- Sub-Components --- */

const ExcelPremiumUploader: React.FC<{
  onScheduleParsed: (schedule: PremiumScheduleItem[], columns: string[]) => void,
  onReset: () => void,
  hasData: boolean
}> = ({ onScheduleParsed, onReset, hasData }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [mapping, setMapping] = useState({ age: '', premium: '' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoMap = (json: any[]) => {
    if (!json || json.length === 0) return;
    const firstRow = json[0];
    const keys = Object.keys(firstRow);
    const ageKey = keys.find(k => k.includes('גיל') || k.toLowerCase() === 'age');
    const premiumKey = keys.find(k => k.includes('פרמיה') || k.includes('סכום') || k.toLowerCase().includes('premium'));

    setMapping({
      age: ageKey || '',
      premium: premiumKey || ''
    });
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        setData(json);
        autoMap(json);
      } catch (err) {
        console.error("Parse error", err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {!data && !hasData && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center
            ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50'}
          `}
        >
          <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-sky-500' : 'text-slate-300'}`} />
          <div className="text-[13px] font-bold text-slate-700 mb-1">גרור והשלך טבלת התפתחות פרמיה</div>
          <p className="text-[10px] text-slate-400 font-medium">תומך בקבצי XLSX או XLS בלבד</p>
          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} accept=".xlsx, .xls" className="hidden" />
        </div>
      )}

      {data && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h5 className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-500" /> וידוא ופענוח נתונים
            </h5>
            <button onClick={() => setData(null)} className="text-[10px] font-bold text-rose-500 hover:underline">ביטול</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-400 mb-1 block uppercase">עמודת גיל</label>
              <select
                value={mapping.age}
                onChange={(e) => setMapping({ ...mapping, age: e.target.value })}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-bold"
              >
                <option value="">בחר...</option>
                {Object.keys(data[0]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 mb-1 block uppercase">עמודת פרמיה</label>
              <select
                value={mapping.premium}
                onChange={(e) => setMapping({ ...mapping, premium: e.target.value })}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-bold"
              >
                <option value="">בחר...</option>
                {Object.keys(data[0]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Mini Preview Table */}
          <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
            <table className="w-full text-right text-[10px]">
              <thead className="bg-slate-100 text-slate-500 font-bold">
                <tr>
                  <th className="p-1 px-3">גיל</th>
                  <th className="p-1 px-3">פרמיה</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {data.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-1 px-3 font-bold">{row[mapping.age] || '-'}</td>
                    <td className="p-1 px-3 font-bold">₪{row[mapping.premium] || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 5 && <div className="p-1 text-center text-[8px] text-slate-400 font-bold bg-white border-t border-slate-100">+{data.length - 5} שורות נוספות</div>}
          </div>

          <button
            onClick={() => {
              const schedule = data.map(row => ({
                age: parseInt(row[mapping.age]),
                premium: parseFloat(String(row[mapping.premium]).replace(/[^\d.]/g, ''))
              })).filter(i => !isNaN(i.age) && !isNaN(i.premium));

              const columns = Object.keys(data[0]).filter(k => k !== mapping.age);
              onScheduleParsed(schedule, columns);
              setData(null);
            }}
            className="w-full bg-emerald-500 text-white py-2.5 rounded-lg font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            אישור וטעינת הטבלה למערכת
          </button>
        </div>
      )}

      {hasData && !data && (
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-800">טבלת פרמיה נטענה בהצלחה</span>
          </div>
          <button onClick={onReset} className="text-rose-500 hover:text-rose-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const PolicyConfigurator: React.FC<{
  activeTab: InsuranceType;
  setActiveTab: (t: InsuranceType) => void;
  profile: UserProfile;
  currentInputs: any;
  setCurrentInputs: (i: any) => void;
  onAddPolicy: () => void;
  buttonLabel: string;
  layout?: 'default' | 't-shape';
}> = ({ activeTab, setActiveTab, profile, currentInputs, setCurrentInputs, onAddPolicy, buttonLabel, layout = 'default' }) => {
  const [elementaryCategory, setElementaryCategory] = useState<keyof typeof ELEMENTARY_OPTIONS>('רכב');
  const [elementaryCoverage, setElementaryCoverage] = useState<string>('מקיף');
  const [elementaryAmount, setElementaryAmount] = useState<number>(0);

  const [isManualEntry, setIsManualEntry] = useState(false);

  useEffect(() => {
    if (activeTab === 'elementary') {
      // Logic for defaulting category if needed
    }
  }, [activeTab, currentInputs.id]);

  const handleAdd = () => {
    onAddPolicy();
  };

  const activeInsuranceTypes = useMemo(() => {
    const types = new Set<InsuranceType>();
    profile.selectedCompanies.forEach(company => {
      const companyAgreements = profile.agreements[company] || {};
      (Object.keys(companyAgreements) as InsuranceType[]).forEach(type => {
        const agreement = companyAgreements[type];
        if (agreement && (agreement.isActive || agreement.scope || agreement.ongoing || agreement.mobility)) {
          types.add(type);
        }
      });
    });
    return (Object.keys(INSURANCE_TYPE_LABELS) as InsuranceType[]).filter(t => types.has(t));
  }, [profile]);

  const filteredCompaniesUnderTab = useMemo(() => {
    return profile.selectedCompanies.filter(company => {
      const agreement = profile.agreements[company]?.[activeTab];
      const isActivated = agreement && (agreement.isActive || agreement.scope || agreement.ongoing || agreement.mobility);
      if (!isActivated) return false;
      if (activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') {
        return INDIVIDUAL_POLICY_COMPANIES.includes(company);
      }
      return true;
    });
  }, [profile, activeTab]);

  const renderContent = () => {
    return (
      <div className="pt-4 border-t border-slate-100">
        {(activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  פירוט {INSURANCE_TYPE_LABELS[activeTab]} - {currentInputs.company || 'נא לבחור חברה'}
                </h4>
                {currentInputs.company && (
                  <span className="text-[10px] text-slate-400 font-medium">כיסויי {INSURANCE_TYPE_LABELS[activeTab]} מותאמים ל{currentInputs.company}</span>
                )}
              </div>
              {currentInputs.company !== 'שלמה' && (
                <button
                  onClick={() => setIsManualEntry(!isManualEntry)}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700 underline underline-offset-4"
                >
                  {isManualEntry ? 'חזרה להעלאת אקסל' : 'הזנה ידנית במקום אקסל'}
                </button>
              )}
            </div>

            {currentInputs.company === 'שלמה' ? (
              <div className="p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 text-center space-y-3 animate-pulse">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-amber-900">שימו לב: שלמה חברה לביטוח</h5>
                  <p className="text-[11px] text-amber-700 font-medium max-w-xs mx-auto leading-relaxed">
                    חברה זו אינה משווקת ביטוחי בריאות (פרט).
                    ניתן להפיק דרכה ביטוחי רכב, דירה, עסק וחו"ל בלבד.
                  </p>
                </div>
              </div>
            ) : !isManualEntry ? (
              <div className="space-y-4">
                <ExcelPremiumUploader
                  hasData={!!(currentInputs.premiumSchedule && currentInputs.premiumSchedule.length > 0)}
                  onScheduleParsed={(sched, cols) => setCurrentInputs({ ...currentInputs, premiumSchedule: sched, excelColumns: cols })}
                  onReset={() => setCurrentInputs({ ...currentInputs, premiumSchedule: [], excelColumns: [] })}
                />

                {(!currentInputs.premiumSchedule || currentInputs.premiumSchedule.length === 0) && (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex gap-3">
                    <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-sky-700 leading-relaxed font-medium">
                      העלאת טבלת התפתחות פרמיה היא הדרך המומלצת להבטיח חישוב עמלת נפרעים מדויק לאורך שנים.
                      המערכת תדע לחשב את העמלה הצפויה בכל גיל באופן אוטומטי.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {(currentInputs.company
                  ? getCoveragesForCompanyAndType(currentInputs.company, activeTab as CoverageCategory)
                  : []).map(sub => (
                    <div key={sub} className="flex items-center justify-between group">
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors text-right flex-1 ml-4 leading-tight font-medium">{sub}</span>
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          className="w-full p-1.5 pl-7 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 bg-white shadow-sm transition-all font-bold"
                          placeholder="0"
                          value={currentInputs.details.subPolicies?.[sub] || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCurrentInputs({
                              ...currentInputs,
                              details: {
                                ...currentInputs.details,
                                subPolicies: { ...currentInputs.details.subPolicies, [sub]: val }
                              }
                            });
                          }}
                        />
                        <span className="absolute left-2 top-1.5 text-[10px] text-slate-300 font-bold">₪</span>
                      </div>
                    </div>
                  ))}

                {(!currentInputs.company) && (
                  <div className="col-span-2 py-8 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <div className="text-slate-400 font-bold text-xs">בחר חברת ביטוח כדי להזין נתונים ידנית</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'elementary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mr-1">בחר קטגוריה</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(ELEMENTARY_OPTIONS) as Array<keyof typeof ELEMENTARY_OPTIONS>).map(cat => {
                  const categoryTotal = Object.entries(currentInputs.details?.subPolicies || {})
                    .filter(([key]) => key.startsWith(`${cat} - `))
                    .reduce((sum, [_, val]) => sum + (parseFloat(val as any) || 0), 0);

                  return (
                    <button
                      key={cat}
                      onClick={() => setElementaryCategory(cat)}
                      className={`relative py-4 rounded-2xl font-black text-sm transition-all border-2 flex flex-col items-center gap-1 ${elementaryCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-xl transform scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-sky-200 hover:bg-sky-50/30'}`}
                    >
                      <span>{cat}</span>
                      {categoryTotal > 0 && (
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${elementaryCategory === cat ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 animate-pulse'}`}>
                          ₪{categoryTotal}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 animate-slideDown">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mr-1">פירוט כיסויים: {elementaryCategory}</label>
                {activeTab === 'elementary' && (
                  <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">ניתן למלא מספר סוגים במקביל</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-y-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {ELEMENTARY_OPTIONS[elementaryCategory].map(opt => {
                  const storageKey = `${elementaryCategory} - ${opt}`;
                  return (
                    <div key={opt} className="flex items-center justify-between group">
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors text-right flex-1 ml-4 leading-tight font-bold">{opt}</span>
                      <div className="relative w-32 shrink-0">
                        <input
                          type="number"
                          className="w-full p-2 pl-8 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 bg-white shadow-sm transition-all font-black"
                          placeholder="0"
                          value={currentInputs.details.subPolicies?.[storageKey] || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCurrentInputs({
                              ...currentInputs,
                              details: {
                                ...currentInputs.details,
                                subPolicies: { ...currentInputs.details.subPolicies, [storageKey]: val }
                              }
                            });
                          }}
                        />
                        <span className="absolute left-2 top-2 text-[10px] text-slate-300 font-bold">₪</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 bg-slate-50 rounded-xl p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">סה"כ פרמיה חודשית (אלמנטרי)</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  ₪{Object.values(currentInputs.details?.subPolicies || {}).reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0)}
                </span>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-500 opacity-20" />
            </div>
          </div>
        )}

        {FINANCIAL_TYPES.includes(activeTab) && (
          <div className="space-y-6 animate-fadeIn">
            <h4 className="text-[13px] font-bold text-slate-900 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              הזנת נתונים: {INSURANCE_TYPE_LABELS[activeTab]}
            </h4>

            {/* Establishment Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">תאריך הקמה</label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-sky-500 outline-none transition-all font-bold text-xs"
                  value={currentInputs.details.establishmentDate || ''}
                  onChange={e => setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, establishmentDate: e.target.value } })}
                />
              </div>
            </div>

            {/* Financial Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">סכום צבירה (₪)</label>
                <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-sky-500 outline-none transition-all font-bold text-xs" placeholder="0" value={currentInputs.details.accumulation || ''} onChange={e => setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, accumulation: parseFloat(e.target.value) || 0 } })} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">סכום ניוד (₪)</label>
                <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-sky-500 outline-none transition-all font-bold text-xs" placeholder="0" value={currentInputs.details.mobility || ''} onChange={e => setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, mobility: parseFloat(e.target.value) || 0 } })} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">הפקדה חודשית (₪)</label>
                <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-sky-500 outline-none transition-all font-bold text-xs" placeholder="0" value={currentInputs.details.monthlyDeposit || ''} onChange={e => setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, monthlyDeposit: parseFloat(e.target.value) || 0 } })} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">הפקדה חד פעמית (₪)</label>
                <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-sky-500 outline-none transition-all font-bold text-xs" placeholder="0" value={currentInputs.details.lumpSumDeposit || ''} onChange={e => setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, lumpSumDeposit: parseFloat(e.target.value) || 0 } })} />
              </div>
            </div>

            {/* Investment Track Selector */}
            {currentInputs.company && INVESTMENT_TRACKS[currentInputs.company] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">מסלולי השקעה</label>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${(currentInputs.details.investmentTracks || []).reduce((s: number, t: any) => s + (t.weight || 0), 0) === 100
                    ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {(currentInputs.details.investmentTracks || []).reduce((s: number, t: any) => s + (t.weight || 0), 0)}% / 100%
                  </span>
                </div>
                <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {INVESTMENT_TRACKS[currentInputs.company].map((track: string) => {
                    const existing = (currentInputs.details.investmentTracks || []).find((t: any) => t.trackName === track);
                    return (
                      <div key={track} className="flex items-center justify-between gap-4 group">
                        <span className="text-xs text-slate-600 font-bold flex-1 text-right">{track}</span>
                        <div className="relative w-24 shrink-0">
                          <input
                            type="number"
                            min="0" max="100"
                            className="w-full p-1.5 pl-7 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 bg-white shadow-sm transition-all font-black text-center"
                            placeholder="0"
                            value={existing?.weight || ''}
                            onChange={(e) => {
                              const weight = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                              const tracks = [...(currentInputs.details.investmentTracks || [])].filter((t: any) => t.trackName !== track);
                              if (weight > 0) tracks.push({ trackName: track, weight });
                              setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, investmentTracks: tracks } });
                            }}
                          />
                          <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-300 font-bold">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Commission Preview */}
            {currentInputs.company && (() => {
              const agreement = profile.agreements[currentInputs.company]?.[activeTab];
              if (!agreement) return null;
              const finInputs: FinancialInputs = {
                accumulation: currentInputs.details.accumulation || 0,
                mobility: currentInputs.details.mobility || 0,
                monthlyDeposit: currentInputs.details.monthlyDeposit || 0,
                lumpSumDeposit: currentInputs.details.lumpSumDeposit || 0
              };
              const rates: CommissionRates = {
                scope: parseFloat(agreement.scope || '0'),
                ongoing: parseFloat(agreement.ongoing || '0'),
                mobility: parseFloat(agreement.mobility || '0')
              };
              const scopeVal = calcFinancialScope(finInputs, rates);
              const ongoingVal = calcFinancialOngoing(finInputs, rates);
              const hasData = finInputs.accumulation > 0 || finInputs.mobility > 0 || finInputs.monthlyDeposit > 0 || finInputs.lumpSumDeposit > 0;

              return hasData ? (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl animate-fadeIn">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-3">תצוגת עמלות משוערת</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">עמלת היקף (חד פעמי)</div>
                      <div className="text-2xl font-black tabular-nums mt-1">₪{scopeVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">עמלת נפרעים (חודשי)</div>
                      <div className="text-2xl font-black tabular-nums mt-1 text-emerald-400">₪{ongoingVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                    <Info className="w-3 h-3" />
                    מחושב לפי הסכם עם {currentInputs.company} ({rates.scope}% היקף, {rates.ongoing}% נפרעים)
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {activeTab === 'abroad' && (
          <div className="space-y-3 animate-fadeIn">
            <label className="text-[13px] font-bold text-slate-900 block">עלות חודשית משוערת / פרמיה</label>
            <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-sky-500 outline-none transition-all font-bold text-xs" placeholder="0" value={currentInputs.cost || ''} onChange={e => setCurrentInputs({ ...currentInputs, cost: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
      </div>
    );
  };

  if (layout === 't-shape') {
    return (
      <div className="flex gap-6 h-full">
        {/* Left Side - Policy Type List */}
        <div className="w-52 shrink-0 space-y-2">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 mr-1">סוג כיסוי</label>
          {activeInsuranceTypes.map(type => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setCurrentInputs({ ...currentInputs, details: { ...currentInputs.details, subPolicies: {} } });
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all font-bold text-xs ${activeTab === type ? 'bg-white border-slate-900 text-slate-900 shadow-md transform scale-[1.01]' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
            >
              <span>{INSURANCE_TYPE_LABELS[type]}</span>
              {activeTab === type && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
            </button>
          ))}
        </div>

        {/* Center - Company and Details */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mr-1">חברת ביטוח</label>
              <select
                value={currentInputs.company}
                onChange={e => {
                  const newCompany = e.target.value;
                  if (activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') {
                    setCurrentInputs({ ...currentInputs, company: newCompany, details: { ...currentInputs.details, subPolicies: {} } });
                  } else {
                    setCurrentInputs({ ...currentInputs, company: newCompany });
                  }
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-slate-900 font-bold text-xs shadow-sm focus:border-sky-500 transition-all"
              >
                <option value="" disabled>בחר חברה...</option>
                {filteredCompaniesUnderTab.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="h-full flex items-center pt-3.5">
              <label className="flex items-center gap-3 cursor-pointer group bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm hover:border-sky-500 transition-all w-full">
                <input type="checkbox" checked={currentInputs.isAgentAppointment} onChange={e => setCurrentInputs({ ...currentInputs, isAgentAppointment: e.target.checked })} className="w-5 h-5 accent-sky-500 rounded-lg border-slate-200" />
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block group-hover:text-slate-900">מינוי סוכן בלבד</span>
                  <span className="text-[9px] text-slate-400 font-medium">פוליסה קיימת (נפרעים בלבד)</span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50">
            {renderContent()}
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleAdd}
                className="bg-sky-500 text-white px-6 py-2 rounded-xl font-black hover:bg-sky-600 transition-all flex items-center gap-2 text-sm shadow-lg shadow-sky-500/30 active:scale-95"
              >
                <Plus className="w-6 h-6" /> {buttonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex bg-slate-50 border-b border-slate-200 p-1">
        {activeInsuranceTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              setActiveTab(type);
              setCurrentInputs({ ...currentInputs, company: '', details: { ...currentInputs.details, subPolicies: {} } });
            }}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-standard ${activeTab === type ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {INSURANCE_TYPE_LABELS[type]}
          </button>
        ))}
        {activeInsuranceTypes.length === 0 && (
          <div className="p-3 text-[10px] text-slate-400 font-bold italic w-full text-center">אין הסכמים פעילים בפרופיל</div>
        )}
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block mr-1 uppercase">חברת ביטוח</label>
            <select
              value={currentInputs.company}
              onChange={e => {
                const newCompany = e.target.value;
                if (activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') {
                  setCurrentInputs({ ...currentInputs, company: newCompany, details: { ...currentInputs.details, subPolicies: {} } });
                } else {
                  setCurrentInputs({ ...currentInputs, company: newCompany });
                }
              }}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white text-slate-900 font-medium text-sm"
            >
              <option value="" disabled>בחר חברה...</option>
              {filteredCompaniesUnderTab.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-4">
            <label className="flex items-center gap-4 cursor-pointer group">
              <input type="checkbox" checked={currentInputs.isAgentAppointment} onChange={e => setCurrentInputs({ ...currentInputs, isAgentAppointment: e.target.checked })} className="w-6 h-6 accent-sky-500 rounded-lg border-slate-200" />
              <span className="text-base font-bold text-slate-600 group-hover:text-slate-900 transition-colors">מינוי סוכן בלבד (נפרעים בלבד)</span>
            </label>
          </div>
        </div>

        {renderContent()}

        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <button onClick={handleAdd} className="bg-sky-50 text-sky-600 px-8 py-3 rounded-2xl font-bold hover:bg-sky-100 transition-all flex items-center gap-2 text-base shadow-sm">
            <Plus className="w-5 h-5" /> {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddFamilyMemberModal: React.FC<{
  onClose: () => void,
  onSubmit: (member: FamilyMember) => void,
  profile: UserProfile,
  primaryDOB: string
}> = ({ onClose, onSubmit, profile, primaryDOB }) => {
  const [form, setForm] = useState<Omit<FamilyMember, 'policies'>>({
    id: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    relationship: 'child',
    isPremiumSharedWithPrimary: false
  });

  const [policies, setPolicies] = useState<Policy[]>([]);

  const activeInsuranceTypes = useMemo(() => {
    const types = new Set<InsuranceType>();
    profile.selectedCompanies.forEach(company => {
      const companyAgreements = profile.agreements[company] || {};
      Object.keys(companyAgreements).forEach(type => {
        const agreement = companyAgreements[type as InsuranceType];
        if (agreement && (agreement.scope || agreement.ongoing || agreement.mobility)) {
          types.add(type as InsuranceType);
        }
      });
    });
    return Array.from(types);
  }, [profile]);

  const [activeTab, setActiveTab] = useState<InsuranceType>(activeInsuranceTypes[0] || 'health');
  const [currentInputs, setCurrentInputs] = useState<any>({
    company: '',
    cost: 0,
    isAgentAppointment: false,
    premiumSchedule: [] as PremiumScheduleItem[],
    details: { subPolicies: {} } as any
  });

  const handleAddPolicyToMember = () => {
    if (!currentInputs.company) return alert('נא לבחור חברת ביטוח');
    let totalCost = currentInputs.cost;
    if ((activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') && currentInputs.details.subPolicies) {
      totalCost = Object.values(currentInputs.details.subPolicies as Record<string, number>).reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
    }
    const newPolicy: Policy = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTab,
      company: currentInputs.company,
      isAgentAppointmentOnly: currentInputs.isAgentAppointment,
      monthlyCost: totalCost,
      premiumSchedule: currentInputs.premiumSchedule,
      excelColumns: currentInputs.excelColumns,
      details: { ...currentInputs.details },
      issueDate: new Date().toLocaleDateString('he-IL'),
      status: 'active'
    };
    setPolicies([...policies, newPolicy]);
    setCurrentInputs({ ...currentInputs, cost: 0, isAgentAppointment: false, premiumSchedule: [], details: { subPolicies: {} } });
  };

  const isChild = form.relationship === 'child';
  const age = useMemo(() => {
    if (!form.dateOfBirth) return 0;
    const birthDate = new Date(form.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [form.dateOfBirth]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slideUp">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-sky-500" /> הוספת בן משפחה
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-200">פרטים אישיים</h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block mr-1 uppercase">קשר משפחתי</label>
                    <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value as Relationship })} className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-bold">
                      <option value="spouse">בן/בת זוג</option>
                      <option value="child">ילד/ה</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block mr-1 uppercase">שם פרטי</label>
                      <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block mr-1 uppercase">שם משפחה</label>
                      <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block mr-1 uppercase">תאריך הנפקה</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-bold" />
                  </div>
                  {isChild && age < 18 && (
                    <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={form.isPremiumSharedWithPrimary} onChange={e => setForm({ ...form, isPremiumSharedWithPrimary: e.target.checked })} className="w-5 h-5 accent-sky-500 rounded border-slate-200" />
                        <span className="text-xs font-bold text-sky-700">שתף טבלת התפתחות פרמיה עם המבוטח הראשי</span>
                      </label>
                      <p className="text-[9px] text-sky-600/70 mt-2 leading-relaxed">עבור ילדים מתחת לגיל 18, ניתן להשתמש באותה טבלת אקסל של ההורה לחישובים.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">פוליסות שנוספו ({policies.length})</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {policies.map((p, idx) => (
                    <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group">
                      <div className="text-right">
                        <div className="font-bold text-xs text-slate-900">{p.company} • {INSURANCE_TYPE_LABELS[p.type]}</div>
                        <div className="text-[10px] text-slate-500">₪{p.monthlyCost.toLocaleString()}</div>
                      </div>
                      <button onClick={() => setPolicies(policies.filter((_, i) => i !== idx))} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <PolicyConfigurator
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                profile={profile}
                currentInputs={currentInputs}
                setCurrentInputs={setCurrentInputs}
                onAddPolicy={handleAddPolicyToMember}
                buttonLabel="הוסף פוליסה לבן המשפחה"
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="px-10 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors text-base">ביטול</button>
          <button
            disabled={!form.firstName || !form.dateOfBirth}
            onClick={() => onSubmit({ ...form, policies } as FamilyMember)}
            className="px-14 py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 hover:bg-sky-600 disabled:opacity-30 active:scale-[0.98] transition-all text-base"
          >
            הוסף בן משפחה
          </button>
        </div>
      </div>
    </div>
  );
};

const AddCustomerModal: React.FC<{ onClose: () => void, onSubmit: (c: Customer) => void, profile: UserProfile }> = ({ onClose, onSubmit, profile }) => {

  const [form, setForm] = useState<Omit<Customer, 'createdAt'>>({
    id: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    policies: []
  });

  const activeInsuranceTypes = useMemo(() => {
    const types = new Set<InsuranceType>();
    profile.selectedCompanies.forEach(company => {
      const companyAgreements = profile.agreements[company] || {};
      Object.keys(companyAgreements).forEach(type => {
        const agreement = companyAgreements[type as InsuranceType];
        if (agreement && (agreement.scope || agreement.ongoing || agreement.mobility)) {
          types.add(type as InsuranceType);
        }
      });
    });
    return Array.from(types);
  }, [profile]);

  const [activeTab, setActiveTab] = useState<InsuranceType>(activeInsuranceTypes[0] || 'health');
  const [currentInputs, setCurrentInputs] = useState<any>({
    company: '',
    cost: 0,
    isAgentAppointment: false,
    premiumSchedule: [] as PremiumScheduleItem[],
    details: { subPolicies: {} } as any
  });

  const handleAddPolicyToForm = () => {
    if (!currentInputs.company) return alert('נא לבחור חברת ביטוח');

    const isDuplicate = form.policies.some(p => p.type === activeTab && p.company === currentInputs.company);
    if (isDuplicate) {
      alert(`לא ניתן להוסיף שתי פוליסות מאותו סוג (${INSURANCE_TYPE_LABELS[activeTab]}) באותה חברה (${currentInputs.company}) ללקוח אחד.`);
      return;
    }

    let totalCost = currentInputs.cost;
    if ((activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') && currentInputs.details.subPolicies) {
      totalCost = Object.values(currentInputs.details.subPolicies as Record<string, number>).reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
    }

    const newPolicy: Policy = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTab,
      company: currentInputs.company,
      isAgentAppointmentOnly: currentInputs.isAgentAppointment,
      monthlyCost: totalCost,
      premiumSchedule: currentInputs.premiumSchedule,
      excelColumns: currentInputs.excelColumns,
      details: { ...currentInputs.details },
      issueDate: new Date().toLocaleDateString('he-IL'),
      status: 'active'
    };

    setForm({ ...form, policies: [...form.policies, newPolicy] });
    setCurrentInputs({ ...currentInputs, cost: 0, isAgentAppointment: false, premiumSchedule: [], details: { subPolicies: {} } });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-slate-50 w-full max-w-7xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slideUp">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </span>
            הקמת לקוח חדש
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Bar - Personal Details */}
        <div className="px-10 py-6 bg-white border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">שם פרטי</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold bg-slate-50 focus:bg-white focus:border-sky-500 transition-all text-sm"
                placeholder="ישראל"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">שם משפחה</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold bg-slate-50 focus:bg-white focus:border-sky-500 transition-all text-sm"
                placeholder="ישראלי"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">תעודת זהות</label>
              <input
                type="text"
                value={form.id}
                onChange={e => setForm({ ...form, id: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold bg-slate-50 focus:bg-white focus:border-sky-500 transition-all text-sm"
                placeholder="000000000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">תאריך הנפקה</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold bg-slate-50 focus:bg-white focus:border-sky-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content - Center/Left */}
          <div className="flex-1 overflow-y-auto p-10 space-y-6">
            <PolicyConfigurator
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              profile={profile}
              currentInputs={currentInputs}
              setCurrentInputs={setCurrentInputs}
              onAddPolicy={handleAddPolicyToForm}
              buttonLabel="הוסף פוליסה זו ללקוח"
              layout="t-shape"
            />
          </div>

          {/* Right Sidebar - Policies List */}
          <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">פוליסות שנוספו ({form.policies.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {form.policies.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-bold leading-relaxed text-slate-500">טרם נוספו פוליסות<br />אנא בחר חברה וכיסוי משמאל</p>
                </div>
              ) : (
                form.policies.map((p, idx) => (
                  <div key={p.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center group animate-fadeIn">
                    <div className="text-right">
                      <div className="font-bold text-[11px] text-slate-900 leading-tight">{p.company}</div>
                      <div className="text-[10px] text-sky-600 font-bold">{INSURANCE_TYPE_LABELS[p.type]}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 font-medium">₪{p.monthlyCost.toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => setForm({ ...form, policies: form.policies.filter((_, i) => i !== idx) })}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-slate-500">סה״כ פרמיה:</span>
                <span className="text-base font-black text-slate-900">₪{form.policies.reduce((sum, p) => sum + p.monthlyCost, 0).toLocaleString()}</span>
              </div>
              <button
                disabled={!form.id || !form.firstName || form.policies.length === 0}
                onClick={() => onSubmit({ ...form, createdAt: new Date().toISOString() })}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-sky-600 disabled:opacity-30 disabled:bg-slate-300 active:scale-[0.98] transition-all text-sm"
              >
                סיימתי והוספתי
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewCustomerModal: React.FC<{ customer: Customer, onClose: () => void, profile: UserProfile, onUpdate: (c: Customer) => void }> = ({ customer, onClose, profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>({ ...customer });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [isAddFamilyMemberOpen, setIsAddFamilyMemberOpen] = useState(false);


  const activeInsuranceTypes = useMemo(() => {
    const types = new Set<InsuranceType>();
    profile.selectedCompanies.forEach(company => {
      const companyAgreements = profile.agreements[company] || {};
      Object.keys(companyAgreements).forEach(type => {
        const agreement = companyAgreements[type as InsuranceType];
        if (agreement && (agreement.scope || agreement.ongoing || agreement.mobility)) {
          types.add(type as InsuranceType);
        }
      });
    });
    return Array.from(types);
  }, [profile]);

  const [activeTab, setActiveTab] = useState<InsuranceType>(activeInsuranceTypes[0] || 'health');
  const [currentInputs, setCurrentInputs] = useState<any>({
    company: '',
    cost: 0,
    isAgentAppointment: false,
    premiumSchedule: [] as PremiumScheduleItem[],
    details: { subPolicies: {} } as any
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleEditExistingPolicy = (policy: Policy) => {
    setEditingPolicyId(policy.id);
    setActiveTab(policy.type);
    setCurrentInputs({
      id: policy.id,
      company: policy.company,
      cost: policy.monthlyCost,
      isAgentAppointment: policy.isAgentAppointmentOnly,
      premiumSchedule: policy.premiumSchedule || [],
      excelColumns: policy.excelColumns || [],
      details: { ...policy.details }
    });
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetInputs = () => {
    setEditingPolicyId(null);
    setCurrentInputs({
      company: '',
      cost: 0,
      isAgentAppointment: false,
      premiumSchedule: [] as PremiumScheduleItem[],
      details: { subPolicies: {} } as any
    });
  };

  const handleSaveOrUpdatePolicy = () => {
    if (!currentInputs.company) return alert('נא לבחור חברת ביטוח');

    let totalCost = currentInputs.cost;
    if ((activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') && currentInputs.details.subPolicies) {
      totalCost = Object.values(currentInputs.details.subPolicies as Record<string, number>).reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
    }

    const updatedPolicies = [...editedCustomer.policies];

    if (editingPolicyId) {
      const idx = updatedPolicies.findIndex(p => p.id === editingPolicyId);
      if (idx !== -1) {
        updatedPolicies[idx] = {
          ...updatedPolicies[idx],
          type: activeTab,
          company: currentInputs.company,
          isAgentAppointmentOnly: currentInputs.isAgentAppointment,
          monthlyCost: totalCost,
          premiumSchedule: currentInputs.premiumSchedule,
          details: { ...currentInputs.details }
        };
      }
    } else {
      const isDuplicate = editedCustomer.policies.some(p => p.type === activeTab && p.company === currentInputs.company);
      if (isDuplicate) {
        alert(`לא ניתן להוסיף שתי פוליסות מאותו סוג (${INSURANCE_TYPE_LABELS[activeTab]}) באותה חברה (${currentInputs.company}) ללקוח אחד.`);
        return;
      }

      const newPolicy: Policy = {
        id: Math.random().toString(36).substr(2, 9),
        type: activeTab,
        company: currentInputs.company,
        isAgentAppointmentOnly: currentInputs.isAgentAppointment,
        monthlyCost: totalCost,
        premiumSchedule: currentInputs.premiumSchedule,
        excelColumns: currentInputs.excelColumns,
        details: { ...currentInputs.details },
        issueDate: new Date().toLocaleDateString('he-IL'),
        status: 'active'
      };
      updatedPolicies.push(newPolicy);
    }

    setEditedCustomer({ ...editedCustomer, policies: updatedPolicies });
    resetInputs();
  };

  const handleTogglePolicyStatus = (policyId: string) => {
    setEditedCustomer(prev => ({
      ...prev,
      policies: prev.policies.map(p => p.id === policyId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)
    }));
  };

  const handleRemovePolicy = (policyId: string) => {
    setEditedCustomer(prev => ({
      ...prev,
      policies: prev.policies.filter(p => p.id !== policyId)
    }));
    if (editingPolicyId === policyId) resetInputs();
  };

  const handleSave = () => {
    // Aggressive Auto-commit: If user is editing a policy or adding a new one with meaningful values,
    // we should merge it into the list before final save.
    let finalCustomer = { ...editedCustomer };

    // Logic for determining if there is "pending" unsaved work in the editor
    const isPrivateDirty = (activeTab === 'health' || activeTab === 'life' || activeTab === 'critical_illness') && Object.values(currentInputs.details?.subPolicies || {}).some((v: any) => parseFloat(v) > 0);
    const isOtherDirty = currentInputs.cost > 0 ||
      (currentInputs.details?.accumulation || 0) > 0 ||
      (currentInputs.details?.deposit || 0) > 0 ||
      (currentInputs.details?.mobility || 0) > 0 ||
      (currentInputs.details?.monthlyDeposit || 0) > 0 ||
      (currentInputs.details?.lumpSumDeposit || 0) > 0;

    const isElementaryDirty = activeTab === 'elementary' && Object.values(currentInputs.details?.subPolicies || {}).some((v: any) => parseFloat(v) > 0);

    const hasPendingChanges = isPrivateDirty || isOtherDirty || isElementaryDirty;

    if (hasPendingChanges) {
      let totalCost = currentInputs.cost;
      if (['health', 'life', 'critical_illness', 'elementary'].includes(activeTab) && currentInputs.details.subPolicies) {
        totalCost = Object.values(currentInputs.details.subPolicies as Record<string, number>).reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
      }

      const updatedPolicies = [...finalCustomer.policies];
      if (editingPolicyId) {
        // Update existing item in the array
        const idx = updatedPolicies.findIndex(p => p.id === editingPolicyId);
        if (idx !== -1) {
          updatedPolicies[idx] = {
            ...updatedPolicies[idx],
            type: activeTab,
            company: currentInputs.company,
            isAgentAppointmentOnly: currentInputs.isAgentAppointment,
            monthlyCost: totalCost,
            premiumSchedule: currentInputs.premiumSchedule,
            excelColumns: currentInputs.excelColumns,
            details: { ...currentInputs.details }
          };
        }
      } else {
        // Create new item if it doesn't already exist for this company/type combo
        const isDuplicate = finalCustomer.policies.some(p => p.type === activeTab && p.company === currentInputs.company);
        if (!isDuplicate) {
          updatedPolicies.push({
            id: Math.random().toString(36).substr(2, 9),
            type: activeTab,
            company: currentInputs.company,
            isAgentAppointmentOnly: currentInputs.isAgentAppointment,
            monthlyCost: totalCost,
            premiumSchedule: currentInputs.premiumSchedule,
            excelColumns: currentInputs.excelColumns,
            details: { ...currentInputs.details },
            issueDate: new Date().toLocaleDateString('he-IL'),
            status: 'active'
          });
        }
      }
      finalCustomer.policies = updatedPolicies;
    }

    setSaveStatus('saving');
    setTimeout(() => {
      onUpdate(finalCustomer);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 800);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-slideUp flex flex-col max-h-[92vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-8 text-right">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-bold text-4xl shadow-lg shadow-slate-900/20">{editedCustomer.firstName[0]}</div>
            <div>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={editedCustomer.firstName} onChange={e => setEditedCustomer({ ...editedCustomer, firstName: e.target.value })} className="p-3 border border-slate-200 rounded-xl text-xl font-bold bg-white focus:border-sky-500 outline-none shadow-sm transition-all" placeholder="שם פרטי" />
                  <input type="text" value={editedCustomer.lastName} onChange={e => setEditedCustomer({ ...editedCustomer, lastName: e.target.value })} className="p-3 border border-slate-200 rounded-xl text-xl font-bold bg-white focus:border-sky-500 outline-none shadow-sm transition-all" placeholder="שם משפחה" />
                </div>
              ) : (
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{editedCustomer.firstName} {editedCustomer.lastName}</h2>
              )}
              <div className="text-slate-400 text-base font-medium mt-2">
                {isEditing ? (
                  <div className="flex gap-6 items-center">
                    <span className="text-xs font-bold uppercase tracking-wider">ת״ז:</span>
                    <input type="text" value={editedCustomer.id} onChange={e => setEditedCustomer({ ...editedCustomer, id: e.target.value })} className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white w-40 focus:border-sky-500 outline-none" />
                    <span className="text-xs font-bold uppercase tracking-wider">תאריך הנפקה:</span>
                    <input type="date" value={editedCustomer.dateOfBirth} onChange={e => setEditedCustomer({ ...editedCustomer, dateOfBirth: e.target.value })} className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white w-48 focus:border-sky-500 outline-none" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">ת״ז:</span> <span className="text-slate-600 font-bold">{editedCustomer.id}</span>
                    <span className="mx-2 opacity-30">•</span>
                    <span className="opacity-60">תאריך הנפקה:</span> <span className="text-slate-600 font-bold">{editedCustomer.dateOfBirth}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <button
                onClick={() => { setIsEditing(false); resetInputs(); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400"
                title="חזרה לתצוגה"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={() => { setIsEditing(true); resetInputs(); }}
                className="px-8 py-2.5 bg-sky-50 text-sky-600 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-100 transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4" /> ערוך לקוח
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400"><X /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white" ref={scrollRef}>
          {isEditing && (
            <div className="mb-12 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {editingPolicyId ? <Edit3 className="w-5 h-5 text-sky-500" /> : <Plus className="w-5 h-5 text-sky-500" />}
                  {editingPolicyId ? 'עריכת פוליסה קיימת' : 'הוספת פוליסה חדשה'}
                </h3>
                {editingPolicyId && (
                  <button onClick={resetInputs} className="text-xs text-slate-400 hover:text-slate-600 font-bold border border-slate-200 px-3 py-1 rounded-lg">בטל עריכה / הוסף חדש</button>
                )}
              </div>
              <PolicyConfigurator
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                profile={profile}
                currentInputs={currentInputs}
                setCurrentInputs={setCurrentInputs}
                onAddPolicy={handleSaveOrUpdatePolicy}
                buttonLabel={editingPolicyId ? "עדכן פוליסה" : "הוסף פוליסה לרשימה"}
              />
            </div>
          )}

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h3 className="text-xl font-bold text-slate-900">פוליסות קיימות ({editedCustomer.policies.length})</h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {editedCustomer.policies.map(p => (
                <div key={p.id} className={`p-8 rounded-[2rem] border transition-all ${p.status === 'active' ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-50 border-slate-200 grayscale opacity-60'} ${editingPolicyId === p.id ? 'ring-2 ring-sky-500 border-sky-500' : ''}`}>
                  <div className="flex justify-between items-start mb-8">
                    <div className="text-right">
                      <div className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">{INSURANCE_TYPE_LABELS[p.type]}</div>
                      <div className="text-2xl font-bold text-slate-900">{p.company}</div>
                      <div className="text-xs text-slate-400 mt-1">הופק ב: {p.issueDate}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-700'}`}>
                        {p.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </span>
                      {isEditing && (
                        <div className="flex gap-2">
                          <button onClick={() => handleEditExistingPolicy(p)} className="text-sky-500 hover:text-sky-700 transition-colors p-1.5 hover:bg-sky-50 rounded-lg" title="ערוך בחלק העליון"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleRemovePolicy(p.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg" title="מחק פוליסה"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-bold text-slate-900 tabular-nums">
                        ₪{p.monthlyCost.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-normal mt-1 uppercase tracking-wider">עלות חודשית סה״כ</div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleTogglePolicyStatus(p.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${p.status === 'active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        >
                          {p.status === 'active' ? 'ביטול פוליסה' : 'שחזור פוליסה'}
                        </button>
                      )}
                    </div>

                    {!isEditing && (p.type === 'health' || p.type === 'life' || p.type === 'critical_illness') && (
                      <div className="bg-slate-50/50 p-6 rounded-2xl space-y-4 border border-slate-100">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">פירוט כיסויים:</h5>
                        <div className="grid grid-cols-1 gap-3">
                          {p.excelColumns && p.excelColumns.length > 0 ? (
                            p.excelColumns.map(col => (
                              <div key={col} className="flex justify-between text-xs items-center group">
                                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{col}</span>
                                <span className="text-[10px] text-slate-400 font-bold italic">מתוך טבלת פרמיה</span>
                              </div>
                            ))
                          ) : (
                            Object.entries(p.details.subPolicies || {}).map(([sub, val]) => {
                              if ((val as number) === 0) return null;
                              return (
                                <div key={sub} className="flex justify-between text-xs items-center group">
                                  <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{sub}</span>
                                  <span className="font-bold tabular-nums">₪{(val as number).toLocaleString()}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {!isEditing && p.type === 'elementary' && (
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="text-xs text-slate-500 italic">
                          {p.details.elementaryCategory || 'כללי'} • {p.details.elementaryCoverage || 'כיסוי'}
                        </div>
                      </div>
                    )}

                    {!isEditing && FINANCIAL_TYPES.includes(p.type) && (
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(p.details.accumulation || 0) > 0 && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">צבירה (₪)</label>
                            <div className="text-xs font-bold">₪{(p.details.accumulation || 0).toLocaleString()}</div>
                          </div>
                        )}
                        {(p.details.mobility || 0) > 0 && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">ניוד (₪)</label>
                            <div className="text-xs font-bold">₪{(p.details.mobility || 0).toLocaleString()}</div>
                          </div>
                        )}
                        {(p.details.monthlyDeposit || 0) > 0 && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">הפקדה חודשית (₪)</label>
                            <div className="text-xs font-bold">₪{(p.details.monthlyDeposit || 0).toLocaleString()}</div>
                          </div>
                        )}
                        {(p.details.lumpSumDeposit || 0) > 0 && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">הפקדה חד פעמית (₪)</label>
                            <div className="text-xs font-bold">₪{(p.details.lumpSumDeposit || 0).toLocaleString()}</div>
                          </div>
                        )}
                        {p.details.investmentTracks && p.details.investmentTracks.length > 0 && (
                          <div className="col-span-full">
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">מסלולי השקעה</label>
                            <div className="flex flex-wrap gap-1">
                              {p.details.investmentTracks.map((t: any) => (
                                <span key={t.trackName} className="text-[9px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">{t.trackName} ({t.weight}%)</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Family Members Section */}
            <div className="bg-slate-50/30 p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 mt-12">
              <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-rose-500" /> בני משפחה
                </h3>
                {isEditing && (
                  <button
                    onClick={() => setIsAddFamilyMemberOpen(true)}
                    className="bg-sky-50 text-sky-600 px-4 py-1.5 rounded-xl font-bold text-[11px] hover:bg-sky-100 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> הוסף בן משפחה
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {!editedCustomer.familyMembers || editedCustomer.familyMembers.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium italic">אין בני משפחה רשומים</p>
                  </div>
                ) : (
                  editedCustomer.familyMembers.map((member, mIdx) => (
                    <div key={member.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                            {member.relationship === 'spouse' ? <Heart className="w-5 h-5 text-rose-400" /> : <Baby className="w-5 h-5 text-sky-400" />}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900">{member.firstName} {member.lastName}</div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                              {member.relationship === 'spouse' ? 'בן/בת זוג' : 'ילד/ה'} • ₪{member.policies.reduce((sum, p) => sum + p.monthlyCost, 0).toLocaleString()} לחודש
                            </div>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newFamily = editedCustomer.familyMembers?.filter((_, i) => i !== mIdx);
                              setEditedCustomer({ ...editedCustomer, familyMembers: newFamily });
                            }}
                            className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 p-1.5 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Member Policies */}
                      <div className="space-y-2">
                        {member.policies.map(p => (
                          <div key={p.id} className="bg-white/60 p-3 rounded-xl border border-slate-100/50 flex justify-between items-center">
                            <div className="text-[11px] font-bold text-slate-700">{p.company} • {INSURANCE_TYPE_LABELS[p.type]}</div>
                            <div className="text-[10px] tabular-nums font-bold text-slate-500">₪{p.monthlyCost.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Family Member Modal Integration */}
        {isAddFamilyMemberOpen && (
          <AddFamilyMemberModal
            onClose={() => setIsAddFamilyMemberOpen(false)}
            onSubmit={(member) => {
              const currentFamily = editedCustomer.familyMembers || [];
              setEditedCustomer({ ...editedCustomer, familyMembers: [...currentFamily, member] });
              setIsAddFamilyMemberOpen(false);
            }}
            profile={profile}
            primaryDOB={editedCustomer.dateOfBirth}
          />
        )}

        {isEditing && (
          <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-center">
            <button
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              className={`px-24 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center gap-3 ${saveStatus === 'saved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                }`}
            >
              {saveStatus === 'saving' ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : saveStatus === 'saved' ? (
                <><Check className="w-6 h-6" /> נשמר בהצלחה</>
              ) : (
                <><Save className="w-6 h-6" /> שמור שינויים ביומן</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomerJournal: React.FC<{
  profile: UserProfile;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onLogout: () => void;
  onNavigate: (s: any) => void;
}> = ({ profile, customers, setCustomers, onLogout, onNavigate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 26 }, (_, i) => currentYear - i);
  }, []);

  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  const calculateCommissions = (policy: Policy, premium: number) => {
    const agreement = profile.agreements[policy.company]?.[policy.type];
    if (!agreement) return { scope: 0, ongoing: 0 };
    const scopeRate = parseFloat(agreement.scope || '0') / 100;
    const ongoingRate = parseFloat(agreement.ongoing || '0') / 100;

    let scope = 0;
    let ongoing = 0;

    if (policy.status === 'active') {
      ongoing = premium * ongoingRate;
      if (!policy.isAgentAppointmentOnly) {
        scope = premium * 12 * scopeRate;
      }
    }
    return { scope, ongoing };
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const fullSearchString = `${c.firstName} ${c.lastName} ${c.id}`.toLowerCase();
      return fullSearchString.includes(searchQuery.toLowerCase());
    });
  }, [customers, searchQuery]);

  const handleExportReport = () => {
    alert(`מפיק דוח עבור חודש ${months[selectedMonth]} ${selectedYear}... (PDF מדמה הורדה)`);
  };

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> לקוח חדש
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl">
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-white font-bold text-sm outline-none px-2 cursor-pointer border-l border-slate-200">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-white font-bold text-sm outline-none px-2 cursor-pointer">
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="חיפוש לפי שם או ת״ז..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl py-2.5 pr-11 pl-4 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm w-72 transition-all text-right"
              />
              <Search className="absolute right-4 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <th className="p-3 text-right">שם לקוח</th>
                    <th className="p-3 text-right">ת״ז לקוח</th>
                    <th className="p-3 text-right">חברת ביטוח</th>
                    <th className="p-3 text-right">סוג ביטוח</th>
                    <th className="p-3 text-right">תאריך הפקה</th>
                    <th className="p-3 text-left">תשלום חודשי</th>
                    <th className="p-3 text-left">עמלת נפרעים</th>
                    <th className="p-3 text-left">עמלת היקף</th>
                    <th className="p-3 text-center">סטטוס פוליסה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-24 text-center text-slate-400 italic font-medium">לא נמצאו לקוחות מתאימים</td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => customer.policies
                      .filter(p => profile.selectedCompanies.includes(p.company))
                      .map((policy) => {
                        const premium = getEffectivePremium(policy, customer.dateOfBirth, selectedMonth, selectedYear);
                        const comms = calculateCommissions(policy, premium);

                        return (
                          <tr key={`${customer.id}-${policy.id}`} onClick={() => setViewingCustomer(customer)} className="hover:bg-sky-50/30 transition-colors cursor-pointer group">
                            <td className="p-3 font-bold text-slate-900 text-right">
                              <div className="flex flex-col">
                                <span className="flex items-center gap-2">
                                  {customer.firstName} {customer.lastName}
                                  {customer.familyMembers && customer.familyMembers.length > 0 && (
                                    <span className="bg-sky-100 text-sky-600 p-1 rounded-lg" title="פוליסה משפחתית">
                                      <Heart className="w-3 h-3 fill-current" />
                                    </span>
                                  )}
                                </span>
                                {customer.familyMembers && customer.familyMembers.length > 0 && (
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    כולל {customer.familyMembers.length} בני משפחה
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-500 text-sm text-right">{customer.id}</td>
                            <td className="p-3 text-slate-700 font-medium text-right">{policy.company}</td>
                            <td className="p-3 text-slate-600 text-sm text-right">
                              {INSURANCE_TYPE_LABELS[policy.type]}
                              {policy.details.elementaryCategory && ` (${policy.details.elementaryCategory})`}
                            </td>
                            <td className="p-3 text-slate-400 text-xs text-right">{policy.issueDate}</td>
                            <td className="p-3 text-left font-bold tabular-nums">
                              <div className="flex flex-col items-end">
                                <span>₪{premium.toLocaleString()}</span>
                                {customer.familyMembers && customer.familyMembers.length > 0 && (
                                  <span className="text-[9px] text-sky-600 font-bold mt-0.5">
                                    סה״כ משפחתי: ₪{calculateCustomerTotalPremium(customer, selectedMonth, selectedYear).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-left text-emerald-600 font-bold tabular-nums">₪{comms.ongoing.toLocaleString()}</td>
                            <td className="p-3 text-left text-sky-600 font-bold tabular-nums">
                              {policy.isAgentAppointmentOnly ? '—' : `₪${comms.scope.toLocaleString()}`}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${policy.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                {policy.status === 'active' ? 'פעיל' : 'לא פעיל'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 flex justify-center z-30 lg:mr-[240px]">
          <button onClick={handleExportReport} className="bg-sky-500 text-white px-12 py-3.5 rounded-xl font-bold shadow-xl shadow-sky-500/20 hover:bg-sky-600 transition-all flex items-center gap-3 active:scale-95">
            <Download className="w-5 h-5" /> הפק דוח חודשי (PDF)
          </button>
        </footer>
      </main>

      {
        isAddModalOpen && (
          <AddCustomerModal
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={(newC) => { setCustomers(prev => [...prev, newC]); setIsAddModalOpen(false); }}
            profile={profile}
          />
        )
      }

      {
        viewingCustomer && (
          <ViewCustomerModal
            customer={viewingCustomer}
            onClose={() => setViewingCustomer(null)}
            profile={profile}
            onUpdate={(updated) => {
              setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
            }}
          />
        )
      }
    </>
  );
};

export default CustomerJournal;
