
import React, { useState } from 'react';
import {
  User, Shield, CreditCard, LogOut, Save, Plus, Trash2, X, AlertTriangle,
  LayoutDashboard, Users, Edit3, Settings2
} from 'lucide-react';
import { UserProfile, INSURANCE_COMPANIES, INSURANCE_TYPE_LABELS, InsuranceType, Customer, FINANCIAL_TYPES } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onNavigate: (s: any) => void;
  onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, setProfile, customers, setCustomers, onNavigate, onLogout }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(JSON.parse(JSON.stringify(profile)));
  const [activeTab, setActiveTab] = useState<'personal' | 'agreements' | 'account'>('personal');
  const [agreementStep, setAgreementStep] = useState(1);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [globalAgreements, setGlobalAgreements] = useState<Record<string, { scope?: string, ongoing?: string, mobility?: string, isActive?: boolean }>>({
    health: {}, life: {}, critical_illness: {}, pension: {}, elementary: { isActive: false }, gemel: {}, hishtalmut: {}, gemel_invest: {}, long_term_savings: {}, abroad: {}
  });

  const [pendingChange, setPendingChange] = useState<{
    company: string | 'GLOBAL',
    type: InsuranceType,
    oldValue: string,
    newValue: string
  } | null>(null);

  const applyGlobalDefaults = () => {
    const nextAgreements = { ...localProfile.agreements };
    localProfile.selectedCompanies.forEach(company => {
      if (!nextAgreements[company]) nextAgreements[company] = {};

      (Object.keys(globalAgreements) as InsuranceType[]).forEach(type => {
        nextAgreements[company][type] = {
          ...nextAgreements[company][type],
          ...globalAgreements[type]
        };
      });
    });
    setLocalProfile(prev => ({ ...prev, agreements: nextAgreements }));
    setAgreementStep(3);
  };

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

  const applyChange = (isRetroactive: boolean) => {
    if (!pendingChange) return;

    const { company, type, newValue, oldValue } = pendingChange;

    // Update Customers/Policies if NOT retroactive (lock old policies)
    // or if retroactive (clear overrides to ensure they follow new rate)
    setCustomers(prevCustomers => prevCustomers.map(customer => ({
      ...customer,
      policies: customer.policies.map(policy => {
        if (policy.type === type && (company === 'GLOBAL' || policy.company === company)) {
          if (isRetroactive) {
            // Retroactive: simply remove any overrides so it follows the new global/company agreement
            const { fixedCommissionRate, ...rest } = policy;
            return rest;
          } else {
            // New Only: lock current policies to the OLD rate
            return { ...policy, fixedCommissionRate: oldValue || '0' };
          }
        }
        return policy;
      }),
      familyMembers: customer.familyMembers?.map(fm => ({
        ...fm,
        policies: fm.policies.map(policy => {
          if (policy.type === type && (company === 'GLOBAL' || policy.company === company)) {
            if (isRetroactive) {
              const { fixedCommissionRate, ...rest } = policy;
              return rest;
            } else {
              return { ...policy, fixedCommissionRate: oldValue || '0' };
            }
          }
          return policy;
        })
      }))
    })));

    // Finally update the profile agreement
    if (company === 'GLOBAL') {
      setGlobalAgreements(prev => ({
        ...prev,
        [type]: { ...prev[type], ongoing: newValue }
      }));
    } else {
      setLocalProfile(prev => ({
        ...prev,
        agreements: {
          ...prev.agreements,
          [company]: {
            ...prev.agreements[company],
            [type]: { ...prev.agreements[company]?.[type], ongoing: newValue }
          }
        }
      }));
    }

    setPendingChange(null);
  };

  const removeCompany = (company: string) => {
    const next = localProfile.selectedCompanies.filter(c => c !== company);
    setLocalProfile({ ...localProfile, selectedCompanies: next });
  };

  return (
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
            <p className="text-rose-600 mt-1">כדי להתחיל לעבוד עם המערכת בצורה תקינה, אנא עבור על הלשוניות מטה:<br />
              1. בחר את <b>חברות הביטוח</b> איתן אתה עובד.<br />
              2. הגדר את <b>הסכמי העמלות</b> שלך.<br />
              3. וודא שפרטי התשלום שלך מעודכנים.<br />
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
                  <input type="text" value={localProfile.firstName} onChange={e => setLocalProfile({ ...localProfile, firstName: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-white text-slate-900 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">שם משפחה</label>
                  <input type="text" value={localProfile.lastName} onChange={e => setLocalProfile({ ...localProfile, lastName: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-white text-slate-900 font-medium" />
                </div>
              </div>

            </div>
          )}

          {activeTab === 'agreements' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex bg-slate-50 p-1 rounded-2xl mb-8 border border-slate-100 shadow-sm overflow-x-auto">
                {[
                  { id: 1, label: 'חברות' },
                  { id: 2, label: 'הסכם ברירת מחדל' },
                  { id: 3, label: 'דיוק והתאמה' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setAgreementStep(s.id)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-xs whitespace-nowrap ${agreementStep === s.id ? 'bg-slate-900 text-white shadow-lg' :
                      agreementStep > s.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {agreementStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">בחר את החברות איתן אתה עובד</h2>
                    <p className="text-slate-500 text-xs">לחץ על החברות הרלוונטיות כדי להוסיף אותן להסכמי העמלות שלך.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {INSURANCE_COMPANIES.map(company => {
                      const isSelected = localProfile.selectedCompanies.includes(company);
                      return (
                        <button key={company} onClick={() => {
                          const next = isSelected ? localProfile.selectedCompanies.filter(c => c !== company) : [...localProfile.selectedCompanies, company];
                          setLocalProfile({ ...localProfile, selectedCompanies: next });
                        }} className={`p-3 rounded-xl border-2 transition-standard font-bold text-xs ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                          {company}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setAgreementStep(2)}
                      disabled={localProfile.selectedCompanies.length === 0}
                      className="px-10 py-3 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      המשך לשלב הבא
                    </button>
                  </div>
                </div>
              )}

              {agreementStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-slate-900">הסכם ברירת מחדל (Master Agreement)</h2>
                    <p className="text-slate-500 text-xs mt-1">הזן את העמלות שאתה מקבל ברוב החברות. זה יחסוך לך המון זמן!</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(['health', 'life', 'critical_illness', 'pension', 'gemel', 'hishtalmut', 'gemel_invest', 'long_term_savings', 'elementary', 'abroad'] as InsuranceType[]).map(type => (
                      <div key={type} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
                          <h4 className="font-bold text-slate-900">{INSURANCE_TYPE_LABELS[type]}</h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {type === 'elementary' ? (
                            <div className="col-span-full">
                              <label className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-xl border border-slate-200 hover:border-sky-500 transition-all w-fit">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 accent-sky-500 rounded border-slate-200"
                                  checked={globalAgreements[type]?.isActive || false}
                                  onChange={(e) => setGlobalAgreements(prev => ({
                                    ...prev,
                                    [type]: { ...prev[type], isActive: e.target.checked }
                                  }))}
                                />
                                <span className="font-bold text-slate-700 text-sm">האם מוכר אלמנטרי? (כן/לא)</span>
                              </label>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">
                                  {FINANCIAL_TYPES.includes(type) ? 'היקף הפקדות (%)' : 'היקף (%)'}
                                </label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 bg-slate-50/50 font-bold"
                                  value={globalAgreements[type]?.scope || ''}
                                  onChange={(e) => setGlobalAgreements(prev => ({
                                    ...prev,
                                    [type]: { ...prev[type], scope: e.target.value }
                                  }))}
                                />
                              </div>
                              {type !== 'abroad' && (
                                <div className="flex flex-col">
                                  <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">נפרעים (%)</label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 bg-slate-50/50 font-bold"
                                    value={globalAgreements[type]?.ongoing || ''}
                                    onChange={(e) => {
                                      setPendingChange({
                                        company: 'GLOBAL',
                                        type,
                                        oldValue: globalAgreements[type]?.ongoing || '0',
                                        newValue: e.target.value
                                      });
                                    }}
                                  />
                                </div>
                              )}
                              {FINANCIAL_TYPES.includes(type) && (
                                <div className="flex flex-col">
                                  <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">היקף ניוד (%)</label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 bg-slate-50/50 font-bold"
                                    value={globalAgreements[type]?.mobility || ''}
                                    onChange={(e) => setGlobalAgreements(prev => ({
                                      ...prev,
                                      [type]: { ...prev[type], mobility: e.target.value }
                                    }))}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-between gap-4">
                    <button onClick={() => setAgreementStep(1)} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors">חזרה</button>
                    <button
                      onClick={applyGlobalDefaults}
                      className="px-12 py-3.5 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-95 transition-all"
                    >
                      החל על כל החברות והמשך
                    </button>
                  </div>
                </div>
              )}

              {agreementStep === 3 && (
                <div className="animate-fadeIn space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">דיוק והתאמת הסכמים</h2>
                    <p className="text-slate-500 text-xs">כאן תוכל לערוך חברה ספציפית אם יש לה הסכם שונה מהברירת מחדל הכללית.</p>
                  </div>

                  <div className="space-y-3">
                    {localProfile.selectedCompanies.map(company => (
                      <div key={company} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-sky-200 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                            {company.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{company}</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">הסכם מותאם אישית</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingCompany(company)}
                            className="px-6 py-2 rounded-xl font-bold text-sm transition-all border border-slate-200 text-slate-600 hover:border-sky-500 hover:text-sky-600"
                          >
                            עריכה
                          </button>
                          <button
                            onClick={() => removeCompany(company)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-between">
                    <button onClick={() => setAgreementStep(2)} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors">חזרה להסכם כללי</button>
                    <button onClick={handleSave} className="px-10 py-3.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all">סיום ושמירת הכל</button>
                  </div>
                </div>
              )}

              {/* Edit Drawer Overlay */}
              {editingCompany && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                  <div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setEditingCompany(null)}
                  />
                  <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slideLeft flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <Settings2 className="w-5 h-5 text-sky-500" />
                        <h3 className="text-lg font-bold text-slate-900">עריכת הסכם: {editingCompany}</h3>
                      </div>
                      <button
                        onClick={() => setEditingCompany(null)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {(['health', 'life', 'critical_illness', 'pension', 'gemel', 'hishtalmut', 'gemel_invest', 'long_term_savings', 'elementary', 'abroad'] as InsuranceType[]).map(type => (
                        <div key={type} className="bg-sky-50/30 p-5 rounded-2xl border border-sky-100/50 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sky-700 text-sm">{INSURANCE_TYPE_LABELS[type]}</h4>
                            <div className="h-px flex-1 bg-sky-100 mx-4 opacity-50"></div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {type === 'elementary' ? (
                              <label className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-xl border border-slate-200 hover:border-sky-500 transition-all">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 accent-sky-500 rounded border-slate-200"
                                  checked={localProfile.agreements[editingCompany]?.[type]?.isActive || false}
                                  onChange={(e) => {
                                    const next = { ...localProfile.agreements };
                                    if (!next[editingCompany]) next[editingCompany] = {};
                                    next[editingCompany][type] = { ...(next[editingCompany][type] || {}), isActive: e.target.checked };
                                    setLocalProfile({ ...localProfile, agreements: next });
                                  }}
                                />
                                <span className="font-bold text-slate-700 text-sm">האם מוכר אלמנטרי? (כן/לא)</span>
                              </label>
                            ) : (
                              <>
                                <div className="flex flex-col">
                                  <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider mr-1">
                                    {FINANCIAL_TYPES.includes(type) ? 'עמלת היקף הפקדות (%)' : 'עמלת היקף (%)'}
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white font-bold text-slate-900 transition-all"
                                    value={localProfile.agreements[editingCompany]?.[type]?.scope || ''}
                                    onChange={(e) => {
                                      const next = { ...localProfile.agreements };
                                      if (!next[editingCompany]) next[editingCompany] = {};
                                      next[editingCompany][type] = { ...(next[editingCompany][type] || {}), scope: e.target.value };
                                      setLocalProfile({ ...localProfile, agreements: next });
                                    }}
                                  />
                                </div>
                                {type !== 'abroad' && (
                                  <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider mr-1">עמלת נפרעים (%)</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white font-bold text-slate-900 transition-all"
                                      value={localProfile.agreements[editingCompany]?.[type]?.ongoing || ''}
                                      onChange={(e) => {
                                        setPendingChange({
                                          company: editingCompany,
                                          type,
                                          oldValue: localProfile.agreements[editingCompany]?.[type]?.ongoing || '0',
                                          newValue: e.target.value
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                                {FINANCIAL_TYPES.includes(type) && (
                                  <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider mr-1">עמלת היקף ניוד (%)</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white font-bold text-slate-900 transition-all"
                                      value={localProfile.agreements[editingCompany]?.[type]?.mobility || ''}
                                      onChange={(e) => {
                                        const next = { ...localProfile.agreements };
                                        if (!next[editingCompany]) next[editingCompany] = {};
                                        next[editingCompany][type] = { ...(next[editingCompany][type] || {}), mobility: e.target.value };
                                        setLocalProfile({ ...localProfile, agreements: next });
                                      }}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                      <button
                        onClick={() => setEditingCompany(null)}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
                      >
                        שמירה וסגירה
                      </button>
                    </div>
                  </div>
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
                  <input type="email" value={localProfile.email} onChange={e => setLocalProfile({ ...localProfile, email: e.target.value })} className="w-full p-4 border border-slate-200 rounded-2xl outline-none text-slate-900 font-medium bg-white" />
                </div>
              </div>

              <div className="pt-12 text-center border-t border-slate-50 space-y-4">
                <button className="text-rose-500 font-bold hover:bg-rose-50 px-8 py-3 rounded-2xl transition-standard text-xs border border-rose-100">
                  ביטול מנוי Followit 360
                </button>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">שימו לב: ביטול המנוי יפסיק את הגישה ליומן הלקוחות ולמנוע חישוב העמלות באופן מיידי.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Effectivity Modal */}
      {pendingChange && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 grayscale-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setPendingChange(null)} />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn border border-slate-100">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce-subtle">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">עדכון עמלת נפרעים</h3>
                <p className="text-slate-500 text-sm leading-relaxed px-4">
                  ביצעת שינוי בשיעור עמלת הנפרעים במוצר <span className="text-slate-900 font-bold">"{INSURANCE_TYPE_LABELS[pendingChange.type]}"</span>
                  {pendingChange.company !== 'GLOBAL' ? ` עבור חברת ${pendingChange.company}` : ' באופן גורף'}.
                  <br />
                  כיצד תרצה להחיל את השינוי על תיק הלקוחות הקיים?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => applyChange(true)}
                  className="group relative w-full p-5 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-500 rounded-2xl transition-all text-right overflow-hidden"
                >
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Save className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-black text-slate-900 group-hover:text-emerald-900">עדכון רטרואקטיבי (גורף)</div>
                  <div className="text-[11px] text-slate-400 group-hover:text-emerald-700 font-medium">החלת האחוז החדש ({pendingChange.newValue}%) על כל הפוליסות הקיימות במערכת.</div>
                </button>

                <button
                  onClick={() => applyChange(false)}
                  className="group relative w-full p-5 bg-slate-50 hover:bg-sky-50 border-2 border-slate-100 hover:border-sky-500 rounded-2xl transition-all text-right overflow-hidden"
                >
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    < CreditCard className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="font-black text-slate-900 group-hover:text-sky-900">עדכון מיום השינוי בלבד</div>
                  <div className="text-[11px] text-slate-400 group-hover:text-sky-700 font-medium">שמירה על האחוז הישן ({pendingChange.oldValue}%) לפוליסות קיימות, והפעלת האחוז החדש רק למכירות עתידיות.</div>
                </button>
              </div>

              <button
                onClick={() => setPendingChange(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest pt-4"
              >
                ביטול השינוי
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfileSettings;
