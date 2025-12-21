
import React, { useState } from 'react';
import { Check, Trash2, ArrowRight, CreditCard } from 'lucide-react';
import { 
  INSURANCE_COMPANIES, 
  INSURANCE_TYPE_LABELS, 
  InsuranceType, 
  UserProfile, 
  CompanyAgreements 
} from '../types';

interface RegistrationPageProps {
  onComplete: () => void;
  onBack: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    selectedCompanies: [],
    agreements: {},
    paymentMethod: { cardNumber: '', expiry: '', cvv: '' }
  });

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

  const renderBasicInfo = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">פרטי משתמש בסיסיים</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-bold text-slate-400 mr-1 uppercase">שם פרטי *</label>
          <input 
            type="text" 
            required
            value={profile.firstName}
            onChange={(e) => updateProfile({ firstName: e.target.value })}
            className="p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 font-medium bg-slate-50/30" 
            placeholder="ישראל"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-bold text-slate-400 mr-1 uppercase">שם משפחה *</label>
          <input 
            type="text" 
            required
            value={profile.lastName}
            onChange={(e) => updateProfile({ lastName: e.target.value })}
            className="p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 font-medium bg-slate-50/30" 
            placeholder="ישראלי"
          />
        </div>
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-bold text-slate-400 mr-1 uppercase">כתובת מייל *</label>
        <input 
          type="email" 
          required
          value={profile.email}
          onChange={(e) => updateProfile({ email: e.target.value })}
          className="p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 font-medium bg-slate-50/30" 
          placeholder="email@example.com"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-bold text-slate-400 mr-1 uppercase">סיסמה *</label>
        <input 
          type="password" 
          required
          value={profile.password}
          onChange={(e) => updateProfile({ password: e.target.value })}
          className="p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-900 font-medium bg-slate-50/30" 
          placeholder="********"
        />
      </div>
    </div>
  );

  const renderCompanySelection = () => (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">בחירת חברות ביטוח</h2>
      <p className="mb-4 text-slate-500">בחר את החברות איתן אתה עובד. תוכל לעדכן את הרשימה בכל עת.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INSURANCE_COMPANIES.map(company => {
          const isSelected = profile.selectedCompanies.includes(company);
          return (
            <button
              key={company}
              onClick={() => toggleCompany(company)}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between font-bold ${
                isSelected 
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

  const renderCommissionAgreements = () => (
    <div className="animate-fadeIn space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900">הגדרת הסכמי עמלות</h2>
        <p className="text-slate-500">מלא את נתוני העמלות עבור כל חברה שבחרת. ניתן להשאיר שדות ריקים.</p>
      </div>

      {profile.selectedCompanies.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-lg font-medium text-slate-400">לא נבחרו חברות ביטוח בשלב הקודם.</p>
          <button onClick={() => setStep(2)} className="mt-4 text-sky-500 font-bold hover:underline">חזור לבחירת חברות</button>
        </div>
      ) : (
        profile.selectedCompanies.map(company => (
          <div key={company} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-6 pb-2 border-b border-slate-50 flex items-center gap-2 text-slate-900">
              <span className="w-2 h-8 bg-sky-400 rounded-full"></span>
              הסכמים מול {company}
            </h3>
            
            <div className="space-y-8">
              {(['private', 'pension', 'financial', 'elementary', 'abroad'] as InsuranceType[]).map(type => (
                <div key={type} className="bg-slate-50/30 p-4 rounded-xl">
                  <h4 className="font-bold text-sky-600 mb-3 text-sm">{INSURANCE_TYPE_LABELS[type]}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1">היקף (%)</label>
                      <input 
                        type="number" 
                        className="p-2.5 border border-slate-200 rounded-lg outline-none text-slate-900 font-medium" 
                        value={profile.agreements[company]?.[type]?.scope || ''}
                        onChange={(e) => handleAgreementChange(company, type, 'scope', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1">נפרעים (%)</label>
                      <input 
                        type="number" 
                        className="p-2.5 border border-slate-200 rounded-lg outline-none text-slate-900 font-medium" 
                        value={profile.agreements[company]?.[type]?.ongoing || ''}
                        onChange={(e) => handleAgreementChange(company, type, 'ongoing', e.target.value)}
                      />
                    </div>
                    {(type === 'pension' || type === 'financial') && (
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1">ניוד (%)</label>
                        <input 
                          type="number" 
                          className="p-2.5 border border-slate-200 rounded-lg outline-none text-slate-900 font-medium" 
                          value={profile.agreements[company]?.[type]?.mobility || ''}
                          onChange={(e) => handleAgreementChange(company, type, 'mobility', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPaymentMethod = () => (
    <div className="animate-fadeIn max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-900">הזנת אמצעי תשלום</h2>
      <p className="mb-8 text-center text-slate-500">הזן פרטי אשראי לחיוב חודשי על השימוש בפלטפורמה.</p>
      
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <CreditCard className="w-10 h-10 text-sky-400" />
            <div className="text-lg font-bold">InsurCard</div>
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
            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium"
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
              className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 mb-1 mr-1 uppercase">CVV</label>
            <input 
              type="text" 
              placeholder="000"
              value={profile.paymentMethod.cvv}
              onChange={(e) => updateProfile({ paymentMethod: { ...profile.paymentMethod, cvv: e.target.value } })}
              className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-900 font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const stepsCount = 4;
  const progress = (step / stepsCount) * 100;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 font-bold flex items-center gap-2 hover:text-slate-900 transition-colors">
            <ArrowRight className="w-5 h-5" /> ביטול
          </button>
          <div className="text-xl font-bold text-slate-900 tracking-tight">Insur<span className="text-sky-500">Agent</span> Pro</div>
          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-28 px-6">
        <div className="bg-white/50 p-1 rounded-2xl mb-8 flex justify-between gap-1 border border-slate-100 shadow-sm">
          {[1, 2, 3, 4].map(s => (
            <button
              key={s}
              disabled={s > step}
              onClick={() => setStep(s)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-xs whitespace-nowrap ${
                step === s ? 'bg-slate-900 text-white shadow-lg' : 
                step > s ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'
              }`}
            >
              {s === 1 ? 'פרטים' : s === 2 ? 'חברות' : s === 3 ? 'עמלות' : 'תשלום'}
            </button>
          ))}
        </div>

        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          {step === 1 && renderBasicInfo()}
          {step === 2 && renderCompanySelection()}
          {step === 3 && renderCommissionAgreements()}
          {step === 4 && renderPaymentMethod()}

          <div className="mt-12 flex justify-between items-center border-t border-slate-100 pt-10">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-8 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                חזרה
              </button>
            ) : <div />}

            {step < 4 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="px-10 py-3.5 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-95 transition-all"
              >
                המשך לשלב הבא
              </button>
            ) : (
              <button 
                onClick={onComplete}
                className="px-14 py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
              >
                סיימתי, אפשר לצאת לדרך
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
