
import React, { useState } from 'react';
import { 
  User, Shield, CreditCard, LogOut, Save, Plus, Trash2, X, AlertTriangle, 
  LayoutDashboard, Users, Edit3
} from 'lucide-react';
import { UserProfile, INSURANCE_COMPANIES, INSURANCE_TYPE_LABELS, InsuranceType } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onNavigate: (s: any) => void;
  onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, setProfile, onNavigate, onLogout }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(JSON.parse(JSON.stringify(profile)));
  const [activeTab, setActiveTab] = useState<'personal' | 'agreements' | 'account'>('personal');

  const handleSave = () => { 
    // Save the changes to the global state and mark as complete
    setProfile({ ...localProfile, isSetupComplete: true }); 
    // Navigate back to the main dashboard
    onNavigate('dashboard');
  };

  const updatePayment = (field: string, value: string) => {
    setLocalProfile({
      ...localProfile,
      paymentMethod: { ...localProfile.paymentMethod, [field]: value }
    });
  };

  const removeCompany = (company: string) => {
    const next = localProfile.selectedCompanies.filter(c => c !== company);
    setLocalProfile({ ...localProfile, selectedCompanies: next });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900" dir="rtl">
      {/* Standardized Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex">
        <div className="p-8 text-xl font-bold border-b border-slate-800 tracking-tight">
          Insur<span className="text-sky-400">Agent</span> Pro
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-standard text-slate-400">
            <LayoutDashboard className="w-5 h-5" /> דשבורד
          </button>
          <button onClick={() => onNavigate('journal')} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-standard text-slate-400">
            <Users className="w-5 h-5" /> יומן לקוחות
          </button>
          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/20">
            <Edit3 className="w-5 h-5" /> פרופיל
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-standard">
            <LogOut className="w-5 h-5" /> התנתקות
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 max-w-6xl mx-auto w-full relative">
        <header className="flex justify-between items-center mb-10">
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">הגדרות חשבון</h1>
           <div className="flex items-center gap-4">
             <button onClick={handleSave} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2">
               <Save className="w-5 h-5" /> {profile.isSetupComplete ? 'שמור שינויים' : 'סיים הגדרה ושמור'}
             </button>
           </div>
        </header>

        {/* Warning Banner for Incomplete Setup */}
        {!profile.isSetupComplete && (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl mb-8 flex items-start gap-4 animate-slideUp">
             <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6 text-rose-500" />
             </div>
             <div>
               <h3 className="font-bold text-rose-800 text-lg">הגדרת החשבון טרם הושלמה</h3>
               <p className="text-rose-600 mt-1">כדי להתחיל לעבוד עם המערכת בצורה תקינה, אנא עבור על הלשוניות מטה:<br/>
               1. בחר את <b>חברות הביטוח</b> איתן אתה עובד.<br/>
               2. הגדר את <b>הסכמי העמלות</b> שלך.<br/>
               3. וודא שפרטי התשלום שלך מעודכנים.<br/>
               בסיום, לחץ על <b>"סיים הגדרה ושמור"</b>.
               </p>
             </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {[
              { id: 'personal', label: 'פרטים אישיים', icon: <User className="w-4 h-4" /> },
              { id: 'agreements', label: 'הסכמי עמלות', icon: <Shield className="w-4 h-4" /> },
              { id: 'account', label: 'תשלום ומנוי', icon: <CreditCard className="w-4 h-4" /> }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-5 flex items-center justify-center gap-3 font-bold transition-standard text-sm ${activeTab === tab.id ? 'bg-white text-sky-600 border-b-2 border-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-10">
            {activeTab === 'personal' && (
              <div className="space-y-10 animate-fadeIn">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">שם פרטי</label>
                    <input type="text" value={localProfile.firstName} onChange={e => setLocalProfile({...localProfile, firstName: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-white text-slate-900 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">שם משפחה</label>
                    <input type="text" value={localProfile.lastName} onChange={e => setLocalProfile({...localProfile, lastName: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-white text-slate-900 font-medium" />
                  </div>
                </div>

                <div className="space-y-5">
                   <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-2 uppercase tracking-wide">חברות ביטוח בהסדר</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                     {INSURANCE_COMPANIES.map(company => {
                       const isSelected = localProfile.selectedCompanies.includes(company);
                       return (
                         <button key={company} onClick={() => {
                           const next = isSelected ? localProfile.selectedCompanies.filter(c => c !== company) : [...localProfile.selectedCompanies, company];
                           setLocalProfile({...localProfile, selectedCompanies: next});
                         }} className={`p-3 rounded-xl border-2 transition-standard font-bold text-xs ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                           {company}
                         </button>
                       );
                     })}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'agreements' && (
              <div className="space-y-8 animate-fadeIn">
                {localProfile.selectedCompanies.length === 0 ? (
                  <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">טרם בחרת חברות ביטוח בלשונית הפרטים האישיים.</p>
                    <button onClick={() => setActiveTab('personal')} className="mt-4 text-sky-500 font-bold hover:underline">לחץ כאן לבחירת חברות</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    {localProfile.selectedCompanies.map(company => (
                      <div key={company} className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200 space-y-6 animate-slideUp">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div> הסכמים: {company}
                          </h3>
                          <button 
                            onClick={() => removeCompany(company)}
                            className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                            title={`הסר את ${company} מהרשימה`}
                          >
                            <Trash2 className="w-4 h-4" /> הסר חברה
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {(['private', 'pension', 'elementary', 'financial', 'abroad'] as InsuranceType[]).map(type => (
                            <div key={type} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                              <h4 className="font-bold text-sm text-sky-600">{INSURANCE_TYPE_LABELS[type]}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">עמלת היקף</label>
                                  <input type="number" value={localProfile.agreements[company]?.[type]?.scope || ''} onChange={e => {
                                    const next = {...localProfile.agreements};
                                    if (!next[company]) next[company] = {};
                                    next[company][type] = {...(next[company][type] || {}), scope: e.target.value};
                                    setLocalProfile({...localProfile, agreements: next});
                                  }} className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium bg-white" />
                                  <span className="absolute left-3 bottom-2.5 text-slate-400 text-xs font-bold">%</span>
                                </div>
                                <div className="relative">
                                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">עמלת נפרעים</label>
                                  <input type="number" value={localProfile.agreements[company]?.[type]?.ongoing || ''} onChange={e => {
                                    const next = {...localProfile.agreements};
                                    if (!next[company]) next[company] = {};
                                    next[company][type] = {...(next[company][type] || {}), ongoing: e.target.value};
                                    setLocalProfile({...localProfile, agreements: next});
                                  }} className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium bg-white" />
                                  <span className="absolute left-3 bottom-2.5 text-slate-400 text-xs font-bold">%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-12 animate-fadeIn max-w-xl mx-auto py-6">
                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                  <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">אמצעי תשלום פעיל</div>
                      <div className="text-xl font-mono tracking-widest tabular-nums">
                        {localProfile.paymentMethod.cardNumber || '**** **** **** ****'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">תוקף</div>
                      <div className="text-lg font-mono">{localProfile.paymentMethod.expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                  <div className="mt-6 font-bold text-sm opacity-60 uppercase">{localProfile.firstName} {localProfile.lastName}</div>
                  <CreditCard className="absolute top-1/2 right-4 w-32 h-32 text-white/5 -translate-y-1/2 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                   <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-2 uppercase tracking-wide">עריכת פרטי תשלום</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1">מספר כרטיס אשראי</label>
                       <input 
                         type="text" 
                         value={localProfile.paymentMethod.cardNumber}
                         onChange={(e) => updatePayment('cardNumber', e.target.value)}
                         className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium bg-white" 
                         placeholder="0000 0000 0000 0000"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1">תוקף (MM/YY)</label>
                         <input 
                           type="text" 
                           value={localProfile.paymentMethod.expiry}
                           onChange={(e) => updatePayment('expiry', e.target.value)}
                           className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium bg-white" 
                           placeholder="12/28"
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1">CVV</label>
                         <input 
                           type="text" 
                           value={localProfile.paymentMethod.cvv}
                           onChange={(e) => updatePayment('cvv', e.target.value)}
                           className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium bg-white" 
                           placeholder="000"
                         />
                       </div>
                     </div>
                   </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">כתובת מייל לעדכונים</label>
                      <input type="email" value={localProfile.email} onChange={e => setLocalProfile({...localProfile, email: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl outline-none text-slate-900 font-medium bg-white" />
                   </div>
                </div>

                <div className="pt-12 text-center border-t border-slate-50 space-y-4">
                   <button className="text-rose-500 font-bold hover:bg-rose-50 px-8 py-3 rounded-2xl transition-standard text-xs border border-rose-100">
                     ביטול מנוי InsurAgent Pro
                   </button>
                   <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">שימו לב: ביטול המנוי יפסיק את הגישה ליומן הלקוחות ולמנוע חישוב העמלות באופן מיידי.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
