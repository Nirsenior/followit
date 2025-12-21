
import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, Search, Calendar, PieChart, Plus, LogOut, Bell, Menu, 
  X, FileText, ChevronRight, ChevronLeft, Upload, Edit3, Trash2, LayoutDashboard,
  CheckCircle2, AlertCircle, Table as TableIcon, ArrowRight, Save
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  INSURANCE_TYPE_LABELS, 
  PRIVATE_SUB_POLICIES, 
  InsuranceType, 
  Customer, 
  Policy, 
  INSURANCE_COMPANIES,
  UserProfile,
  PremiumScheduleItem
} from '../types';

interface CustomerJournalProps {
  profile: UserProfile;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onLogout: () => void;
  onNavigate: (s: any) => void;
}

const CustomerJournal: React.FC<CustomerJournalProps> = ({ profile, customers, setCustomers, onLogout, onNavigate }) => {
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
    if (!agreement) return { scope: 0, ongoing: 0, mobility: 0 };
    const scopeRate = parseFloat(agreement.scope || '0') / 100;
    const ongoingRate = parseFloat(agreement.ongoing || '0') / 100;
    let scope = 0, ongoing = 0;
    if (policy.status === 'active') {
       ongoing = premium * ongoingRate;
       if (!policy.isAgentAppointmentOnly) scope = premium * 12 * scopeRate;
    }
    return { scope, ongoing };
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.firstName.includes(searchQuery) || c.lastName.includes(searchQuery) || c.id.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar */}
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
            <Edit3 className="w-5 h-5" /> עריכת פרופיל
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-standard">
            <LogOut className="w-5 h-5" /> התנתקות
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-8">
            <button className="lg:hidden p-2 text-slate-900"><Menu /></button>
            <h1 className="text-xl font-bold tracking-tight">יומן לקוחות</h1>
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
               <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent font-bold text-sm outline-none px-2 cursor-pointer border-l border-slate-200">
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent font-bold text-sm outline-none px-2 cursor-pointer">
                 {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
               </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="חיפוש לפי שם או ת״ז..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-11 pl-4 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm w-72 transition-all"
              />
              <Search className="absolute right-4 top-3 w-4 h-4 text-slate-400" />
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> לקוח חדש
            </button>
          </div>
        </header>

        {/* Professional Table */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-right border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                     <th className="p-5 text-right">שם הלקוח</th>
                     <th className="p-5 text-right">ת״ז</th>
                     <th className="p-5 text-right">חברה</th>
                     <th className="p-5 text-right">סוג ביטוח</th>
                     <th className="p-5 text-left">תשלום חודשי</th>
                     <th className="p-5 text-left">עמלת נפרעים</th>
                     <th className="p-5 text-left">עמלת היקף</th>
                     <th className="p-5 text-center">סטטוס</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredCustomers.length === 0 ? (
                     <tr>
                       <td colSpan={8} className="p-24 text-center text-slate-400 italic font-medium">לא נמצאו לקוחות במערכת</td>
                     </tr>
                   ) : (
                     filteredCustomers.map(customer => customer.policies.map((policy, pIdx) => {
                       const premium = getEffectivePremium(policy, customer.dateOfBirth, selectedMonth, selectedYear);
                       const comms = calculateCommissions(policy, premium);
                       return (
                        <tr key={`${customer.id}-${pIdx}`} onClick={() => setViewingCustomer(customer)} className="hover:bg-sky-50/30 transition-colors cursor-pointer group">
                          <td className="p-5 font-bold text-slate-900 text-right">
                            {pIdx === 0 ? `${customer.firstName} ${customer.lastName}` : ''}
                          </td>
                          <td className="p-5 text-slate-500 text-sm text-right">{pIdx === 0 ? customer.id : ''}</td>
                          <td className="p-5 text-slate-700 font-medium text-right">{policy.company}</td>
                          <td className="p-5 text-slate-600 text-sm text-right">{INSURANCE_TYPE_LABELS[policy.type]}</td>
                          <td className="p-5 text-left font-bold tabular-nums">₪{premium.toLocaleString()}</td>
                          <td className="p-5 text-left text-emerald-600 font-bold tabular-nums">₪{comms.ongoing.toLocaleString()}</td>
                          <td className="p-5 text-left text-sky-600 font-bold tabular-nums">
                            {policy.isAgentAppointmentOnly ? '—' : `₪${comms.scope.toLocaleString()}`}
                          </td>
                          <td className="p-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              policy.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {policy.status === 'active' ? 'פעיל' : 'מבוטל'}
                            </span>
                          </td>
                        </tr>
                       );
                     }))
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
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
          onUpdate={(updated) => { setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c)); setViewingCustomer(null); }}
        />
      )}
    </div>
  );
};

/* --- AddCustomerModal --- */
const AddCustomerModal: React.FC<{ onClose: () => void, onSubmit: (c: Customer) => void, availableCompanies: string[] }> = ({ onClose, onSubmit, availableCompanies }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', id: '', dateOfBirth: '', policies: [] as Policy[] });
  const [activeTab, setActiveTab] = useState<InsuranceType>('private');
  const [currentInputs, setCurrentInputs] = useState({ company: availableCompanies[0] || '', cost: 0, isAgentAppointment: false, premiumSchedule: [] as PremiumScheduleItem[] });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slideUp">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
          <h2 className="text-2xl font-bold text-slate-900">לקוח חדש במערכת</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">פרטי לקוח</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">תעודת זהות</label>
                    <input type="text" value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium" placeholder="000000000" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">שם פרטי</label>
                      <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium" placeholder="ישראל" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">שם משפחה</label>
                      <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium" placeholder="ישראלי" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1 uppercase">תאריך לידה</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex bg-slate-50 border-b border-slate-200 p-1">
                  {(Object.keys(INSURANCE_TYPE_LABELS) as InsuranceType[]).map(type => (
                    <button key={type} onClick={() => setActiveTab(type)} className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-standard ${activeTab === type ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      {INSURANCE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-2 gap-5 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1">חברת ביטוח</label>
                      <select value={currentInputs.company} onChange={e => setCurrentInputs({...currentInputs, company: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl outline-none bg-slate-50/50 text-slate-900 font-medium">
                         {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block mr-1">פרמיה חודשית</label>
                      <input type="number" value={currentInputs.cost || ''} onChange={e => setCurrentInputs({...currentInputs, cost: parseFloat(e.target.value)})} className="w-full p-3.5 pl-8 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium" placeholder="0.00" />
                      <span className="absolute left-3 bottom-3.5 text-slate-400 text-sm font-bold">₪</span>
                    </div>
                  </div>

                  {activeTab === 'private' && (
                    <div className="mb-6">
                      <ExcelPremiumUploader onScheduleParsed={(sched) => setCurrentInputs({...currentInputs, premiumSchedule: sched})} />
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={currentInputs.isAgentAppointment} onChange={e => setCurrentInputs({...currentInputs, isAgentAppointment: e.target.checked})} className="w-5 h-5 accent-sky-500 rounded border-slate-200 transition-standard" />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">מינוי סוכן בלבד</span>
                    </label>
                    <button onClick={() => {
                      if (!currentInputs.company || (!currentInputs.cost && currentInputs.premiumSchedule.length === 0)) return alert('נא למלא פרטי פוליסה');
                      const p: Policy = { id: Math.random().toString(36).substr(2, 9), type: activeTab, company: currentInputs.company, isAgentAppointmentOnly: currentInputs.isAgentAppointment, monthlyCost: currentInputs.cost, premiumSchedule: currentInputs.premiumSchedule, details: {}, issueDate: new Date().toLocaleDateString('he-IL'), status: 'active' };
                      setForm({...form, policies: [...form.policies, p]});
                      setCurrentInputs({ ...currentInputs, cost: 0, isAgentAppointment: false, premiumSchedule: [] });
                    }} className="bg-sky-50 text-sky-600 px-6 py-2.5 rounded-xl font-bold hover:bg-sky-100 transition-standard flex items-center gap-2">
                      <Plus className="w-4 h-4" /> הוסף פוליסה
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                 {form.policies.map((p, i) => (
                   <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group animate-slideUp">
                      <div className="flex items-center gap-4 text-right">
                         <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-[10px]">
                           {p.type.substring(0,2).toUpperCase()}
                         </div>
                         <div>
                           <div className="font-bold text-sm text-slate-900">{p.company} • {INSURANCE_TYPE_LABELS[p.type]}</div>
                           <div className="text-[11px] text-slate-400">
                             {p.premiumSchedule ? 'מבוסס אקסל' : `פרמיה: ₪${p.monthlyCost}`} {p.isAgentAppointmentOnly && '• מינוי סוכן'}
                           </div>
                         </div>
                      </div>
                      <button onClick={() => setForm({...form, policies: form.policies.filter((_, idx) => idx !== i)})} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">ביטול</button>
          <button disabled={!form.id || !form.dateOfBirth || form.policies.length === 0} onClick={() => onSubmit({...form, createdAt: new Date().toISOString()})} className="px-12 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-30 active:scale-[0.98] transition-all">
            הוסף לקוח למערכת
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- View/Edit CustomerModal --- */
const ViewCustomerModal: React.FC<{ customer: Customer, onClose: () => void, availableCompanies: string[], onUpdate: (c: Customer) => void }> = ({ customer, onClose, availableCompanies, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>({ ...customer });
  const [activeTab, setActiveTab] = useState<InsuranceType>('private');
  const [newPolicyInputs, setNewPolicyInputs] = useState({ company: availableCompanies[0] || '', cost: 0, isAgentAppointment: false, premiumSchedule: [] as PremiumScheduleItem[] });

  const handleSave = () => {
    onUpdate(editedCustomer);
    setIsEditing(false);
  };

  const addPolicy = () => {
    if (!newPolicyInputs.company || (!newPolicyInputs.cost && newPolicyInputs.premiumSchedule.length === 0)) return alert('נא למלא פרטי פוליסה');
    const p: Policy = { id: Math.random().toString(36).substr(2, 9), type: activeTab, company: newPolicyInputs.company, isAgentAppointmentOnly: newPolicyInputs.isAgentAppointment, monthlyCost: newPolicyInputs.cost, premiumSchedule: newPolicyInputs.premiumSchedule, details: {}, issueDate: new Date().toLocaleDateString('he-IL'), status: 'active' };
    setEditedCustomer({ ...editedCustomer, policies: [...editedCustomer.policies, p] });
    setNewPolicyInputs({ ...newPolicyInputs, cost: 0, isAgentAppointment: false, premiumSchedule: [] });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
       <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-slideUp flex flex-col max-h-[90vh]">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
             <div className="flex items-center gap-6 text-right">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl">{editedCustomer.firstName[0]}</div>
                <div>
                   {isEditing ? (
                     <div className="grid grid-cols-2 gap-2">
                       <input type="text" value={editedCustomer.firstName} onChange={e => setEditedCustomer({...editedCustomer, firstName: e.target.value})} className="p-2 border border-slate-200 rounded-lg text-lg font-bold" />
                       <input type="text" value={editedCustomer.lastName} onChange={e => setEditedCustomer({...editedCustomer, lastName: e.target.value})} className="p-2 border border-slate-200 rounded-lg text-lg font-bold" />
                     </div>
                   ) : (
                     <h2 className="text-2xl font-bold text-slate-900">{editedCustomer.firstName} {editedCustomer.lastName}</h2>
                   )}
                   <p className="text-slate-400 text-sm font-medium italic">
                     {isEditing ? (
                       <input type="text" value={editedCustomer.id} onChange={e => setEditedCustomer({...editedCustomer, id: e.target.value})} className="mt-1 p-1 border border-slate-200 rounded text-xs" />
                     ) : (
                       `ת״ז: ${editedCustomer.id} • יומולדת: ${editedCustomer.dateOfBirth}`
                     )}
                   </p>
                </div>
             </div>
             <div className="flex gap-3">
                {isEditing ? (
                  <button onClick={handleSave} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"><Save className="w-4 h-4" /> שמור שינויים</button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-sky-50 text-sky-600 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-100 transition-all"><Edit3 className="w-4 h-4" /> עריכה</button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-standard text-slate-400"><X /></button>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/10">
             {isEditing && (
               <div className="bg-white p-8 rounded-2xl border border-sky-100 shadow-sm space-y-6">
                 <h4 className="text-sm font-bold text-sky-600 uppercase tracking-widest border-b border-sky-50 pb-2">הוספת פוליסה חדשה במהלך עריכה</h4>
                 <div className="flex bg-slate-50 p-1 rounded-xl mb-4">
                    {(Object.keys(INSURANCE_TYPE_LABELS) as InsuranceType[]).map(type => (
                      <button key={type} onClick={() => setActiveTab(type)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === type ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        {INSURANCE_TYPE_LABELS[type]}
                      </button>
                    ))}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">חברה</label>
                      <select value={newPolicyInputs.company} onChange={e => setNewPolicyInputs({...newPolicyInputs, company: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none">
                         {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">פרמיה</label>
                      <input type="number" value={newPolicyInputs.cost || ''} onChange={e => setNewPolicyInputs({...newPolicyInputs, cost: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none" placeholder="0" />
                    </div>
                    <div className="col-span-1 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newPolicyInputs.isAgentAppointment} onChange={e => setNewPolicyInputs({...newPolicyInputs, isAgentAppointment: e.target.checked})} className="w-4 h-4 accent-sky-500" />
                        <span className="text-[10px] font-bold text-slate-600">סוכן בלבד</span>
                      </label>
                    </div>
                    <button onClick={addPolicy} className="col-span-1 bg-sky-500 text-white p-2.5 rounded-xl text-xs font-bold hover:bg-sky-600 transition-all">הוסף פוליסה</button>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editedCustomer.policies.map(p => (
                  <div key={p.id} className={`p-8 rounded-[2.5rem] border-2 transition-standard ${p.status === 'active' ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
                    <div className="flex justify-between items-start mb-6">
                       <div className="text-right">
                         <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">{INSURANCE_TYPE_LABELS[p.type]}</div>
                         <div className="text-xl font-bold text-slate-900">{p.company}</div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                           {p.status === 'active' ? 'פעיל' : 'מבוטל'}
                         </span>
                         {isEditing && (
                           <button onClick={() => setEditedCustomer({...editedCustomer, policies: editedCustomer.policies.filter(pol => pol.id !== p.id)})} className="text-rose-500 hover:text-rose-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                         )}
                       </div>
                    </div>
                    <div className="flex justify-between items-end">
                       <div className="text-2xl font-bold text-slate-900 tabular-nums">
                         {isEditing ? (
                           <div className="flex items-center gap-1">
                             <span className="text-sm text-slate-400">₪</span>
                             <input type="number" value={p.monthlyCost} onChange={e => setEditedCustomer({...editedCustomer, policies: editedCustomer.policies.map(pol => pol.id === p.id ? {...pol, monthlyCost: parseFloat(e.target.value)} : pol)})} className="w-24 p-1 border border-slate-200 rounded text-xl" />
                           </div>
                         ) : (
                           p.premiumSchedule ? 'דינמי (אקסל)' : `₪${p.monthlyCost.toLocaleString()}`
                         )}
                       </div>
                       <button onClick={() => setEditedCustomer({...editedCustomer, policies: editedCustomer.policies.map(pol => pol.id === p.id ? {...pol, status: pol.status === 'active' ? 'inactive' : 'active' } as Policy : pol)})} className={`px-4 py-2 rounded-xl text-xs font-bold transition-standard ${p.status === 'active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>
                         {p.status === 'active' ? 'ביטול' : 'שחזור'}
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

/* --- Excel Uploader Component --- */
const ExcelPremiumUploader: React.FC<{ onScheduleParsed: (schedule: PremiumScheduleItem[]) => void }> = ({ onScheduleParsed }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [mapping, setMapping] = useState({ age: '', premium: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2"><TableIcon className="w-4 h-4 text-sky-500" /> התפתחות פרמיה (XLSX)</h5>
        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:border-sky-500 hover:text-sky-600 transition-standard">בחר קובץ</button>
        <input type="file" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            const wb = XLSX.read(evt.target?.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            setData(XLSX.utils.sheet_to_json(ws));
          };
          reader.readAsBinaryString(file);
        }} accept=".xlsx, .xls" className="hidden" />
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">עמודת גיל</label>
            <select value={mapping.age} onChange={(e) => setMapping({...mapping, age: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none bg-white">
              <option value="">בחר...</option>
              {Object.keys(data[0]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">עמודת פרמיה</label>
            <select value={mapping.premium} onChange={(e) => setMapping({...mapping, premium: e.target.value})} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none bg-white">
              <option value="">בחר...</option>
              {Object.keys(data[0]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => {
            const schedule = data.map(row => ({ age: parseInt(row[mapping.age]), premium: parseFloat(String(row[mapping.premium]).replace(/[^\d.]/g, '')) }))
              .filter(i => !isNaN(i.age) && !isNaN(i.premium));
            onScheduleParsed(schedule);
          }} className="col-span-2 bg-sky-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-500/20">טען נתונים</button>
        </div>
      )}
    </div>
  );
};

export default CustomerJournal;
