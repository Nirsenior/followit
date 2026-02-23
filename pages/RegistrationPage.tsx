
import React, { useState, useEffect } from 'react';
import { Check, Trash2, ArrowRight, CreditCard, FileText, Settings2, Shield, User, Wallet, Plus, X } from 'lucide-react';
import {
  INSURANCE_COMPANIES,
  INSURANCE_TYPE_LABELS,
  InsuranceType,
  UserProfile,
  Customer,
  CompanyAgreements
} from '../types';

interface RegistrationPageProps {
  initialProfile: UserProfile;
  onComplete: (customers?: Customer[], profile?: Partial<UserProfile>) => void;
  onBack: () => void;
  onSkip: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ initialProfile, onComplete, onBack, onSkip }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [globalAgreements, setGlobalAgreements] = useState<CompanyAgreements>({
    health: { scope: '', ongoing: '' },
    life: { scope: '', ongoing: '' },
    critical_illness: { scope: '', ongoing: '' },
    pension: { scope: '', ongoing: '', mobility: '' },
    financial: { scope: '', ongoing: '', mobility: '' },
    elementary: { scope: '' },
    abroad: { scope: '' }
  });
  const [editingCompany, setEditingCompany] = useState<string | null>(null);

  // Sync with initial profile if it changes (e.g. name passed from signup)
  useEffect(() => {
    setProfile(prev => ({ ...prev, ...initialProfile }));
  }, [initialProfile]);

  const updateProfile = (fields: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...fields }));
  };

  const toggleCompany = (company: string) => {
    const isSelected = profile.selectedCompanies.includes(company);
    const newSelection = isSelected
      ? profile.selectedCompanies.filter(c => c !== company)
      : [...profile.selectedCompanies, company];

    const newAgreements = { ...profile.agreements };
    if (!isSelected && !newAgreements[company]) {
      newAgreements[company] = {};
    }

    updateProfile({ selectedCompanies: newSelection, agreements: newAgreements });
  };

  const handleAgreementChange = (company: string, type: InsuranceType, field: string, value: string) => {
    setProfile(prev => {
      const companyAgreements = prev.agreements[company] || {};
      const typeValues = companyAgreements[type] || {};

      return {
        ...prev,
        agreements: {
          ...prev.agreements,
          [company]: {
            ...companyAgreements,
            [type]: {
              ...typeValues,
              [field]: value
            }
          }
        }
      };
    });
  };

  const applyGlobalDefaults = () => {
    setProfile(prev => {
      const nextAgreements = { ...prev.agreements };
      prev.selectedCompanies.forEach(company => {
        nextAgreements[company] = JSON.parse(JSON.stringify(globalAgreements));
      });
      return { ...prev, agreements: nextAgreements };
    });
    setStep(3);
  };

  /* --- Render Steps --- */

  const renderCompanySelection = () => (
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 flex items-center justify-center gap-2">
          <Plus className="w-6 h-6 text-sky-500" />
          הגדר את חברות הביטוח שאתה עובד מולן
        </h2>
        <p className="text-slate-500 text-sm">בחר את החברות איתן אתה עובד. תוכל לעדכן את הרשימה בכל עת.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INSURANCE_COMPANIES.map(company => {
          const isSelected = profile.selectedCompanies.includes(company);
          return (
            <button
              key={company}
              onClick={() => toggleCompany(company)}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between font-bold ${isSelected
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                : 'bg-white border-slate-100 text-slate-900 hover:border-slate-300'
                }`}
            >
              {company}
              {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderGlobalAgreements = () => (
    <div className="animate-fadeIn space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 border-b-4 border-sky-500 w-fit mx-auto pb-1">הגדרת הסכם ברירת מחדל</h2>
        <p className="text-slate-500 text-sm">הגדר שיעורי עמלות כלליים שיחולו על כל החברות שבחרת. תוכל לדייק כל חברה ספציפית בשלב הבא.</p>
      </div>

      <div className="grid gap-4">
        {(['health', 'life', 'critical_illness', 'pension', 'financial', 'elementary', 'abroad'] as InsuranceType[]).map(type => (
          <div key={type} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              {INSURANCE_TYPE_LABELS[type]}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">היקף (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 bg-white font-bold"
                  value={globalAgreements[type]?.scope || ''}
                  onChange={(e) => setGlobalAgreements(prev => ({
                    ...prev,
                    [type]: { ...prev[type], scope: e.target.value }
                  }))}
                />
              </div>
              {type !== 'elementary' && type !== 'abroad' && (
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">נפרעים (%)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 bg-white font-bold"
                    value={globalAgreements[type]?.ongoing || ''}
                    onChange={(e) => setGlobalAgreements(prev => ({
                      ...prev,
                      [type]: { ...prev[type], ongoing: e.target.value }
                    }))}
                  />
                </div>
              )}
              {(type === 'pension' || type === 'financial') && (
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">ניוד (%)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 bg-white font-bold"
                    value={globalAgreements[type]?.mobility || ''}
                    onChange={(e) => setGlobalAgreements(prev => ({
                      ...prev,
                      [type]: { ...prev[type], mobility: e.target.value }
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFineTuning = () => (
    <div className="animate-fadeIn space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 border-b-4 border-emerald-500 w-fit mx-auto pb-1">דיוק והתאמת הסכמים</h2>
        <p className="text-slate-500 text-sm">הנתונים שהזנת חולקו לכל החברות. כאן תוכל לערוך חברה ספציפית אם יש לה הסכם שונה.</p>
      </div>

      <div className="space-y-3">
        {profile.selectedCompanies.map(company => (
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
            <button
              onClick={() => setEditingCompany(company)}
              className="px-6 py-2 rounded-xl font-bold text-sm transition-all border bg-white border-slate-200 text-slate-600 hover:border-sky-500 hover:text-sky-600"
            >
              עריכה
            </button>
          </div>
        ))}
      </div>

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
              {(['health', 'life', 'critical_illness', 'pension', 'financial', 'elementary', 'abroad'] as InsuranceType[]).map(type => {
                const isRestricted = editingCompany === 'שלמה' && (type === 'health' || type === 'life' || type === 'critical_illness');
                return (
                  <div key={type} className={`p-5 rounded-2xl border transition-all space-y-4 ${isRestricted ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-sky-50/30 border-sky-100/50'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-sm ${isRestricted ? 'text-slate-400' : 'text-sky-700'}`}>{INSURANCE_TYPE_LABELS[type]}</h4>
                      {isRestricted && <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">לא רלוונטי</span>}
                      <div className={`h-px flex-1 mx-4 opacity-50 ${isRestricted ? 'bg-slate-200' : 'bg-sky-100'}`}></div>
                    </div>
                    {!isRestricted ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider mr-1">עמלת היקף (%)</label>
                          <input
                            type="number"
                            placeholder="0"
                            className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white font-bold text-slate-900 transition-all"
                            value={profile.agreements[editingCompany]?.[type]?.scope || ''}
                            onChange={(e) => handleAgreementChange(editingCompany, type, 'scope', e.target.value)}
                          />
                        </div>
                        {type !== 'elementary' && type !== 'abroad' && (
                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider mr-1">עמלת נפרעים (%)</label>
                            <input
                              type="number"
                              placeholder="0"
                              className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white font-bold text-slate-900 transition-all"
                              value={profile.agreements[editingCompany]?.[type]?.ongoing || ''}
                              onChange={(e) => handleAgreementChange(editingCompany, type, 'ongoing', e.target.value)}
                            />
                          </div>
                        )}
                        {(type === 'pension' || type === 'financial') && (
                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider mr-1">עמלת ניוד (%)</label>
                            <input
                              type="number"
                              placeholder="0"
                              className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 bg-white font-bold text-slate-900 transition-all"
                              value={profile.agreements[editingCompany]?.[type]?.mobility || ''}
                              onChange={(e) => handleAgreementChange(editingCompany, type, 'mobility', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-bold text-center py-2">
                        חברת שלמה אינה משווקת ביטוחי בריאות, חיים או מחלות קשות
                      </p>
                    )}
                  </div>
                );
              })}
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
  );

  const renderPaymentMethod = () => (
    <div className="animate-fadeIn max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-slate-900">הפעלת מנוי</h2>
        <p className="text-slate-500 text-sm">הזן פרטי אשראי לחיוב חודשי על השימוש בפלטפורמה.</p>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <CreditCard className="w-10 h-10 text-sky-400" />
            <div className="text-lg font-bold">FollowCard</div>
          </div>
          <div className="text-2xl tracking-[0.2em] mb-8 font-mono">
            {profile.paymentMethod.cardNumber || '**** **** **** ****'}
          </div>
          <div className="flex justify-between">
            <div>
              <div className="text-[10px] uppercase opacity-40">בעל הכרטיס</div>
              <div className="font-medium text-sm">{profile.firstName} {profile.lastName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase opacity-40">תוקף</div>
              <div className="font-medium text-sm">{profile.paymentMethod.expiry || 'MM/YY'}</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">מספר כרטיס</label>
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            value={profile.paymentMethod.cardNumber}
            onChange={(e) => updateProfile({ paymentMethod: { ...profile.paymentMethod, cardNumber: e.target.value } })}
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium bg-white placeholder:text-slate-300 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">תוקף</label>
            <input
              type="text"
              placeholder="MM/YY"
              value={profile.paymentMethod.expiry}
              onChange={(e) => updateProfile({ paymentMethod: { ...profile.paymentMethod, expiry: e.target.value } })}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium bg-white placeholder:text-slate-300 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">CVV</label>
            <input
              type="text"
              placeholder="000"
              value={profile.paymentMethod.cvv}
              onChange={(e) => updateProfile({ paymentMethod: { ...profile.paymentMethod, cvv: e.target.value } })}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium bg-white placeholder:text-slate-300 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { id: 1, label: 'חברות ביטוח', render: renderCompanySelection },
    { id: 2, label: 'הסכם ברירת מחדל', render: renderGlobalAgreements },
    { id: 3, label: 'דיוק והתאמה', render: renderFineTuning },
    { id: 4, label: 'אמצעי תשלום', render: renderPaymentMethod }
  ];

  const currentStepObj = steps.find(s => s.id === step);
  const stepsCount = steps.length;
  const progress = (step / stepsCount) * 100;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="text-slate-400 font-bold flex items-center gap-2 hover:text-slate-900 transition-colors">
              <ArrowRight className="w-5 h-5" /> {step === 1 ? 'חזרה' : 'שלב קודם'}
            </button>
          </div>

          <div className="text-xl font-bold text-slate-900 tracking-tight hidden md:block">Followit <span className="text-sky-500">360</span></div>

          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-24 px-6">
        <div className="bg-white/50 p-1 rounded-2xl mb-8 flex justify-between gap-1 border border-slate-100 shadow-sm">
          {steps.map(s => (
            <button
              key={s.id}
              disabled={s.id > step}
              onClick={() => setStep(s.id)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-xs whitespace-nowrap ${step === s.id ? 'bg-slate-900 text-white shadow-lg' :
                step > s.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          {currentStepObj?.render()}

          <div className="mt-8 flex justify-between items-center border-t border-slate-100 pt-6">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-8 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                חזרה
              </button>
            ) : <div />}

            {step < stepsCount ? (
              <button
                onClick={step === 2 ? applyGlobalDefaults : () => setStep(step + 1)}
                className="px-10 py-3.5 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-95 transition-all"
              >
                המשך לשלב הבא
              </button>
            ) : (
              <button
                onClick={() => onComplete([], profile)}
                className="px-14 py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
              >
                סיימתי, אפשר לצאת לדרך
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onSkip}
            className="text-slate-500 font-bold hover:text-sky-600 transition-all flex items-center gap-2 py-3 px-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-200"
          >
            דלג על הגדרה כרגע <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
