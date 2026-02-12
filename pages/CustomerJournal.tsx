
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, Search, Plus, LogOut, X, Edit3, Trash2, LayoutDashboard,
  Table as TableIcon, FileText, CheckCircle2, AlertCircle, Save, Download, ChevronDown, ChevronUp, Check, ArrowUpCircle, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  INSURANCE_TYPE_LABELS, 
  PRIVATE_SUB_POLICIES, 
  InsuranceType, 
  Customer, 
  Policy, 
  UserProfile, 
  PremiumScheduleItem 
} from '../types';

/* --- Constants & Helpers --- */
const ELEMENTARY_OPTIONS = {
  'רכב': ['מקיף', 'חובה', 'צד ג\''],
  'דירה': ['תכולה', 'צד ג\'', 'מבנה'],
  'עסק': ['אחריות מקצועית', 'תכולה', 'צד ג\'', 'מבנה']
};

/* --- Sub-Components --- */

const ExcelPremiumUploader: React.FC<{ onScheduleParsed: (schedule: PremiumScheduleItem[]) => void }> = ({ onScheduleParsed }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [mapping, setMapping] = useState({ age: '', premium: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setData(XLSX.utils.sheet_to_json(ws));
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-sky-500" /> טבלת התפתחות פרמיה (XLSX)
        </h5>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:border-sky-500 hover:text-sky-600 transition-all"
        >
          העלה קובץ אקסל
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFile} accept=".xlsx, .xls" className="hidden" />
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4 animate-fadeIn bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <label className="text-[9px] font-bold text-slate-400 mb-1 block uppercase">עמודת גיל</label>
            <select 
              value={mapping.age} 
              onChange={(e) => setMapping({ ...mapping, age: e.target.value })} 
              className="w-full p-2 text-[10px] border border-slate-200 rounded-lg outline-none bg-white"
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
              className="w-full p-2 text-[10px] border border-slate-200 rounded-lg outline-none bg-white"
            >
              <option value="">בחר...</option>
              {Object.keys(data[0]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button 
            onClick={() => {
              const schedule = data.map(row => ({ 
                age: parseInt(row[mapping.age]), 
                premium: parseFloat(String(row[mapping.premium]).replace(/[^\d.]/g, '')) 
              })).filter(i => !isNaN(i.age) && !isNaN(i.premium));
              onScheduleParsed(schedule);
              setData(null);
            }} 
            className="col-span-2 bg-sky-500 text-white py-2 rounded-lg font-bold text-[10px] shadow-md"
          >
            טען נתונים
          </button>
        </div>
      )}
    </div>
  );
};

const PolicyConfigurator: React.FC<{
  activeTab: InsuranceType;
  setActiveTab: (t: InsuranceType) => void;
  availableCompanies: string[];
  currentInputs: any;
  setCurrentInputs: (i: any) => void;
  onAddPolicy: () => void;
  buttonLabel: string;
}> = ({ activeTab, setActiveTab, availableCompanies, currentInputs, setCurrentInputs, onAddPolicy, buttonLabel }) => {
  const [elementaryCategory, setElementaryCategory] = useState<'רכב' | 'דירה' | 'עסק'>('רכב');
  const [elementaryCoverage, setElementaryCoverage] = useState<string>('מקיף');
  const [elementaryAmount, setElementaryAmount] = useState<number>(0);

  useEffect(() => {
    if (activeTab === 'elementary' && currentInputs.details?.elementaryCategory) {
      setElementaryCategory(currentInputs.details.elementaryCategory);
      setElementaryCoverage(currentInputs.details.elementaryCoverage || ELEMENTARY_OPTIONS[currentInputs.details.elementaryCategory as keyof typeof ELEMENTARY_OPTIONS][0]);
      setElementaryAmount(currentInputs.cost || 0);
    }
  }, [activeTab, currentInputs.id]);

  const handleAdd = () => {
    if (activeTab === 'elementary') {
      const details = { ...currentInputs.details, elementaryCategory, elementaryCoverage };
      setCurrentInputs({ ...currentInputs, cost: elementaryAmount, details });
      setTimeout(() => onAddPolicy(), 0);
    } else {
      onAddPolicy();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex bg-slate-50 border-b border-slate-200 p-1">
        {(Object.keys(INSURANCE_TYPE_LABELS) as InsuranceType[]).map(type => (
          <button 
            key={type} 
            onClick={() => setActiveTab(type)} 
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-standard ${activeTab === type ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {INSURANCE_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">חברת ביטוח</label>
            <select value={currentInputs.company} onChange={e => setCurrentInputs({...currentInputs, company: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white text-slate-900 font-medium">
               {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={currentInputs.isAgentAppointment} onChange={e => setCurrentInputs({...currentInputs, isAgentAppointment: e.target.checked})} className="w-5 h-5 accent-sky-500 rounded border-slate-200" />
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">מינוי סוכן בלבד (נפרעים בלבד)</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50">
           {activeTab === 'private' && (
              <div className="space-y-6 animate-fadeIn">
                 <h4 className="text-sm font-bold text-slate-900">פירוט פוליסת פרט</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                   {PRIVATE_SUB_POLICIES.map(sub => (
                     <div key={sub} className="flex items-center justify-between group">
                        <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{sub}</span>
                        <div className="relative w-28">
                          <input 
                            type="number" 
                            className="w-full p-1.5 pl-6 border border-slate-200 rounded-lg text-[11px] outline-none focus:border-sky-500 bg-white" 
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
                          <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-300 font-bold">₪</span>
                        </div>
                     </div>
                   ))}
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                   <ExcelPremiumUploader onScheduleParsed={(sched) => setCurrentInputs({...currentInputs, premiumSchedule: sched})} />
                 </div>
              </div>
           )}

           {activeTab === 'elementary' && (
             <div className="space-y-6 animate-fadeIn">
               <h4 className="text-sm font-bold text-slate-900">פירוט אלמנטרי</h4>
               <div className="grid grid-cols-3 gap-6">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">קטגוריה</label>
                     <select 
                       value={elementaryCategory} 
                       onChange={e => {
                         const cat = e.target.value as any;
                         setElementaryCategory(cat);
                         setElementaryCoverage(ELEMENTARY_OPTIONS[cat][0]);
                       }}
                       className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-bold"
                     >
                        <option value="רכב">ביטוח רכב</option>
                        <option value="דירה">ביטוח דירה</option>
                        <option value="עסק">ביטוח עסק</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">כיסוי</label>
                     <select 
                       value={elementaryCoverage} 
                       onChange={e => setElementaryCoverage(e.target.value)}
                       className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-bold"
                     >
                        {(ELEMENTARY_OPTIONS[elementaryCategory] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">סכום חופשי (₪)</label>
                     <input 
                       type="number" 
                       className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-bold" 
                       placeholder="0" 
                       value={elementaryAmount || ''} 
                       onChange={e => setElementaryAmount(parseFloat(e.target.value) || 0)} 
                     />
                  </div>
               </div>
             </div>
           )}

           {(activeTab === 'pension' || activeTab === 'financial') && (
             <div className="space-y-6 animate-fadeIn">
               <h4 className="text-sm font-bold text-slate-900">הזנת סכומים: {INSURANCE_TYPE_LABELS[activeTab]}</h4>
               <div className="grid grid-cols-3 gap-6">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">סכום צבירה</label>
                     <input type="number" className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={currentInputs.details.accumulation || ''} onChange={e => setCurrentInputs({...currentInputs, details: {...currentInputs.details, accumulation: parseFloat(e.target.value) || 0}})} />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">סכום הפקדה</label>
                     <input type="number" className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={currentInputs.details.deposit || ''} onChange={e => setCurrentInputs({...currentInputs, details: {...currentInputs.details, deposit: parseFloat(e.target.value) || 0}})} />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">סכום ניוד</label>
                     <input type="number" className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={currentInputs.details.mobility || ''} onChange={e => setCurrentInputs({...currentInputs, details: {...currentInputs.details, mobility: parseFloat(e.target.value) || 0}})} />
                  </div>
               </div>
               <div className="text-[10px] text-slate-400 italic mt-4">הזן פרמיה חודשית כללית לחישוב עמלה (אם קיימת):</div>
               <input type="number" placeholder="פרמיה חודשית (₪)" className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={currentInputs.cost || ''} onChange={e => setCurrentInputs({...currentInputs, cost: parseFloat(e.target.value) || 0})} />
             </div>
           )}

           {activeTab === 'abroad' && (
             <div className="space-y-4 animate-fadeIn">
               <label className="text-sm font-bold text-slate-900 block">עלות חודשית משוערת / פרמיה</label>
               <input type="number" className="w-full p-3 border border-slate-200 rounded-xl bg-white" value={currentInputs.cost || ''} onChange={e => setCurrentInputs({...currentInputs, cost: parseFloat(e.target.value) || 0})} />
             </div>
           )}
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button onClick={handleAdd} className="bg-sky-50 text-sky-600 px-8 py-3 rounded-xl font-bold hover:bg-sky-100 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddCustomerModal: React.FC<{ onClose: () => void, onSubmit: (c: Customer) => void, availableCompanies: string[] }> = ({ onClose, onSubmit, availableCompanies }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', id: '', dateOfBirth: '', policies: [] as Policy[] });
  const [activeTab, setActiveTab] = useState<InsuranceType>('private');
  const [currentInputs, setCurrentInputs] = useState({ 
    company: availableCompanies[0] || '', 
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
    if (activeTab === 'private' && currentInputs.details.subPolicies) {
        totalCost = Object.values(currentInputs.details.subPolicies as Record<string, number>).reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
    }

    const newPolicy: Policy = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTab,
      company: currentInputs.company,
      isAgentAppointmentOnly: currentInputs.isAgentAppointment,
      monthlyCost: totalCost,
      premiumSchedule: currentInputs.premiumSchedule,
      details: { ...currentInputs.details },
      issueDate: new Date().toLocaleDateString('he-IL'),
      status: 'active'
    };

    setForm({ ...form, policies: [...form.policies, newPolicy] });
    setCurrentInputs({ ...currentInputs, cost: 0, isAgentAppointment: false, premiumSchedule: [], details: { subPolicies: {} } });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slideUp">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-bold text-slate-900">הקמת לקוח חדש</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">פרטי לקוח</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">שם פרטי</label>
                    <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium bg-white" placeholder="ישראל" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">שם משפחה</label>
                    <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium bg-white" placeholder="ישראלי" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">תעודת זהות</label>
                    <input type="text" value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium bg-white" placeholder="000000000" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">תאריך לידה</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium bg-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">פוליסות שנוספו ({form.policies.length})</h4>
                 <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                   {form.policies.map((p, idx) => (
                     <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group">
                        <div className="text-right">
                          <div className="font-bold text-xs text-slate-900">{p.company} • {INSURANCE_TYPE_LABELS[p.type]}</div>
                          <div className="text-[10px] text-slate-500">₪{p.monthlyCost.toLocaleString()}</div>
                        </div>
                        <button onClick={() => setForm({...form, policies: form.policies.filter((_, i) => i !== idx)})} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   ))}
                 </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <PolicyConfigurator 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                availableCompanies={availableCompanies}
                currentInputs={currentInputs}
                setCurrentInputs={setCurrentInputs}
                onAddPolicy={handleAddPolicyToForm}
                buttonLabel="הוסף פוליסה זו ללקוח"
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">ביטול</button>
          <button 
            disabled={!form.id || !form.firstName || form.policies.length === 0} 
            onClick={() => onSubmit({...form, createdAt: new Date().toISOString()})} 
            className="px-16 py-3.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-30 active:scale-[0.98] transition-all"
          >
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewCustomerModal: React.FC<{ customer: Customer, onClose: () => void, availableCompanies: string[], onUpdate: (c: Customer) => void }> = ({ customer, onClose, availableCompanies, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>({ ...customer });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<InsuranceType>('private');
  const [currentInputs, setCurrentInputs] = useState<any>({ 
    company: availableCompanies[0] || '', 
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
      details: { ...policy.details }
    });
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetInputs = () => {
    setEditingPolicyId(null);
    setCurrentInputs({ 
      company: availableCompanies[0] || '', 
      cost: 0, 
      isAgentAppointment: false, 
      premiumSchedule: [] as PremiumScheduleItem[],
      details: { subPolicies: {} } as any
    });
  };

  const handleSaveOrUpdatePolicy = () => {
    if (!currentInputs.company) return alert('נא לבחור חברת ביטוח');

    let totalCost = currentInputs.cost;
    if (activeTab === 'private' && currentInputs.details.subPolicies) {
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
    const isPrivateDirty = activeTab === 'private' && Object.values(currentInputs.details?.subPolicies || {}).some((v: any) => parseFloat(v) > 0);
    const isOtherDirty = currentInputs.cost > 0 || 
                         (currentInputs.details?.accumulation || 0) > 0 || 
                         (currentInputs.details?.deposit || 0) > 0 || 
                         (currentInputs.details?.mobility || 0) > 0;
    const isElementaryDirty = activeTab === 'elementary' && (currentInputs.details?.elementaryCategory);

    const hasPendingChanges = isPrivateDirty || isOtherDirty || isElementaryDirty;

    if (hasPendingChanges) {
      let totalCost = currentInputs.cost;
      if (activeTab === 'private' && currentInputs.details.subPolicies) {
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
       <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-slideUp flex flex-col max-h-[95vh]">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
             <div className="flex items-center gap-6 text-right">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-3xl">{editedCustomer.firstName[0]}</div>
                <div>
                   {isEditing ? (
                     <div className="grid grid-cols-2 gap-2">
                       <input type="text" value={editedCustomer.firstName} onChange={e => setEditedCustomer({...editedCustomer, firstName: e.target.value})} className="p-2 border border-slate-200 rounded-lg text-lg font-bold bg-white" placeholder="שם פרטי" />
                       <input type="text" value={editedCustomer.lastName} onChange={e => setEditedCustomer({...editedCustomer, lastName: e.target.value})} className="p-2 border border-slate-200 rounded-lg text-lg font-bold bg-white" placeholder="שם משפחה" />
                     </div>
                   ) : (
                     <h2 className="text-2xl font-bold text-slate-900">{editedCustomer.firstName} {editedCustomer.lastName}</h2>
                   )}
                   <div className="text-slate-400 text-sm font-medium mt-1">
                     {isEditing ? (
                       <div className="flex gap-4 items-center">
                         <span className="text-[11px] font-bold">ת״ז:</span>
                         <input type="text" value={editedCustomer.id} onChange={e => setEditedCustomer({...editedCustomer, id: e.target.value})} className="p-1.5 border border-slate-200 rounded text-xs bg-white w-32" />
                         <span className="text-[11px] font-bold">תאריך לידה:</span>
                         <input type="date" value={editedCustomer.dateOfBirth} onChange={e => setEditedCustomer({...editedCustomer, dateOfBirth: e.target.value})} className="p-1.5 border border-slate-200 rounded text-xs bg-white w-36" />
                       </div>
                     ) : (
                       `ת״ז: ${editedCustomer.id} • תאריך לידה: ${editedCustomer.dateOfBirth}`
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
          
          <div className="flex-1 overflow-y-auto p-10 bg-white" ref={scrollRef}>
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
                   availableCompanies={availableCompanies}
                   currentInputs={currentInputs}
                   setCurrentInputs={setCurrentInputs}
                   onAddPolicy={handleSaveOrUpdatePolicy}
                   buttonLabel={editingPolicyId ? "עדכן פוליסה" : "הוסף פוליסה לרשימה"}
                 />
               </div>
             )}

             <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-2">פוליסות קיימות ({editedCustomer.policies.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {editedCustomer.policies.map(p => (
                     <div key={p.id} className={`p-8 rounded-[2.5rem] border-2 transition-all ${p.status === 'active' ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-200 grayscale opacity-60'} ${editingPolicyId === p.id ? 'ring-2 ring-sky-500 border-sky-500' : ''}`}>
                       <div className="flex justify-between items-start mb-6">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">{INSURANCE_TYPE_LABELS[p.type]}</div>
                            <div className="text-xl font-bold text-slate-900">{p.company}</div>
                            <div className="text-[11px] text-slate-400">הופק ב: {p.issueDate}</div>
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

                          {!isEditing && p.type === 'private' && (
                            <div className="bg-slate-50/50 p-6 rounded-2xl space-y-4 border border-slate-100">
                               <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">פירוט כיסויים:</h5>
                               <div className="grid grid-cols-1 gap-3">
                                  {PRIVATE_SUB_POLICIES.map(sub => {
                                    const val = p.details.subPolicies?.[sub] || 0;
                                    if (val === 0) return null;
                                    return (
                                      <div key={sub} className="flex justify-between text-xs items-center group">
                                         <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{sub}</span>
                                         <span className="font-bold tabular-nums">₪{(val as number).toLocaleString()}</span>
                                      </div>
                                    );
                                  })}
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

                          {!isEditing && (p.type === 'pension' || p.type === 'financial') && (
                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid grid-cols-3 gap-3">
                               <div>
                                  <label className="text-[9px] font-bold text-slate-400 block mb-1">צבירה (₪)</label>
                                  <div className="text-xs font-bold">₪{(p.details.accumulation || 0).toLocaleString()}</div>
                               </div>
                               <div>
                                  <label className="text-[9px] font-bold text-slate-400 block mb-1">הפקדה (₪)</label>
                                  <div className="text-xs font-bold">₪{(p.details.deposit || 0).toLocaleString()}</div>
                               </div>
                               <div>
                                  <label className="text-[9px] font-bold text-slate-400 block mb-1">ניוד (₪)</label>
                                  <div className="text-xs font-bold">₪{(p.details.mobility || 0).toLocaleString()}</div>
                               </div>
                            </div>
                          )}
                       </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {isEditing && (
             <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-center">
                <button 
                  onClick={handleSave} 
                  disabled={saveStatus !== 'idle'}
                  className={`px-24 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
                    saveStatus === 'saved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
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

  const calculateAge = (dob: string, targetMonth: number, targetYear: number) => {
    const birthDate = new Date(dob);
    let age = targetYear - birthDate.getFullYear();
    const m = targetMonth - birthDate.getMonth();
    if (m < 0) age--;
    return age;
  };

  const getEffectivePremium = (policy: Policy, customerDob: string, targetMonth: number, targetYear: number) => {
    if (policy.type === 'private' && policy.premiumSchedule && policy.premiumSchedule.length > 0) {
      const age = calculateAge(customerDob, targetMonth, targetYear);
      const scheduleItem = policy.premiumSchedule.find(item => item.age === age);
      return scheduleItem ? scheduleItem.premium : policy.monthlyCost;
    }
    return policy.monthlyCost;
  };

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
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900" dir="rtl">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex">
        <div className="p-8 text-xl font-bold border-b border-slate-800 tracking-tight">
          Insur<span className="text-sky-400">Agent</span> Pro
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-standard text-slate-400">
            <LayoutDashboard className="w-5 h-5" /> דשבורד
          </button>
          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/20">
            <Users className="w-5 h-5" /> יומן לקוחות
          </button>
          <button onClick={() => onNavigate('profile')} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-standard text-slate-400">
            <Edit3 className="w-5 h-5" /> פרופיל
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-standard">
            <LogOut className="w-5 h-5" /> התנתקות
          </button>
        </div>
      </aside>

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

        <div className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-right border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                     <th className="p-5 text-right">שם לקוח</th>
                     <th className="p-5 text-right">ת״ז לקוח</th>
                     <th className="p-5 text-right">חברת ביטוח</th>
                     <th className="p-5 text-right">סוג ביטוח</th>
                     <th className="p-5 text-right">תאריך הפקה</th>
                     <th className="p-5 text-left">תשלום חודשי</th>
                     <th className="p-5 text-left">עמלת נפרעים</th>
                     <th className="p-5 text-left">עמלת היקף</th>
                     <th className="p-5 text-center">סטטוס פוליסה</th>
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
                              <td className="p-5 font-bold text-slate-900 text-right">
                                {customer.firstName} {customer.lastName}
                              </td>
                              <td className="p-5 text-slate-500 text-sm text-right">{customer.id}</td>
                              <td className="p-5 text-slate-700 font-medium text-right">{policy.company}</td>
                              <td className="p-5 text-slate-600 text-sm text-right">
                                {INSURANCE_TYPE_LABELS[policy.type]}
                                {policy.details.elementaryCategory && ` (${policy.details.elementaryCategory})`}
                              </td>
                              <td className="p-5 text-slate-400 text-xs text-right">{policy.issueDate}</td>
                              <td className="p-5 text-left font-bold tabular-nums">₪{premium.toLocaleString()}</td>
                              <td className="p-5 text-left text-emerald-600 font-bold tabular-nums">₪{comms.ongoing.toLocaleString()}</td>
                              <td className="p-5 text-left text-sky-600 font-bold tabular-nums">
                                {policy.isAgentAppointmentOnly ? '—' : `₪${comms.scope.toLocaleString()}`}
                              </td>
                              <td className="p-5 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  policy.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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

        <footer className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 flex justify-center z-30 lg:mr-72">
          <button onClick={handleExportReport} className="bg-sky-500 text-white px-12 py-3.5 rounded-xl font-bold shadow-xl shadow-sky-500/20 hover:bg-sky-600 transition-all flex items-center gap-3 active:scale-95">
            <Download className="w-5 h-5" /> הפק דוח חודשי (PDF)
          </button>
        </footer>
      </main>

      {isAddModalOpen && (
        <AddCustomerModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSubmit={(newC) => { setCustomers(prev => [...prev, newC]); setIsAddModalOpen(false); }}
          availableCompanies={profile.selectedCompanies}
        />
      )}

      {viewingCustomer && (
        <ViewCustomerModal 
          customer={viewingCustomer} 
          onClose={() => setViewingCustomer(null)}
          availableCompanies={profile.selectedCompanies}
          onUpdate={(updated) => { 
            setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c)); 
          }}
        />
      )}
    </div>
  );
};

export default CustomerJournal;
