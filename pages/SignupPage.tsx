
import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface SignupPageProps {
  onSignupSuccess: (basicInfo: Partial<UserProfile>) => void;
  onLoginClick: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onLoginClick }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName && formData.email && formData.password) {
      onSignupSuccess(formData);
    }
  };

  const SocialButton: React.FC<{ provider: 'google' | 'apple'; label: string }> = ({ provider, label }) => (
    <button 
      type="button"
      onClick={() => onSignupSuccess({ firstName: 'User', lastName: 'Social', email: 'user@social.com' })} // Simulating social auth
      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.99]"
    >
      {provider === 'google' ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.79.05 2.41-1.05 3.96-.86.66.1 2.53.31 3.43 1.6-3.01 1.4-2.48 5.62.37 6.94-.53 1.62-1.37 3.37-2.84 4.51zM12.03 5.37c.7-1.16.59-3.07-.95-4.14-1.38 1.11-1.67 3.08-.95 4.14.7.98 1.2.98 1.9 0z"/>
        </svg>
      )}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-slate-900 z-0"></div>
      
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-slate-100 animate-slideUp">
        <div className="p-10 pb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">יצירת חשבון חדש</h1>
          <p className="text-slate-500 text-sm">הצטרפו למאות סוכנים שכבר משתמשים ב-InsurAgent Pro</p>
        </div>

        <div className="px-10 pb-10 space-y-6">
          <div className="flex flex-col gap-3">
             <SocialButton provider="google" label="המשך באמצעות Google" />
             <SocialButton provider="apple" label="המשך באמצעות Apple" />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-bold">או הרשמה במייל</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1 uppercase">שם פרטי</label>
                  <input 
                    type="text" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30 text-slate-900 font-medium"
                    required
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1 uppercase">שם משפחה</label>
                  <input 
                    type="text" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30 text-slate-900 font-medium"
                  />
               </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1 uppercase">כתובת מייל</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30 text-slate-900 font-medium"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block mr-1 uppercase">סיסמה</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30 text-slate-900 font-medium"
                placeholder="לפחות 8 תווים"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              צור חשבון <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            יש לך כבר חשבון? <button onClick={onLoginClick} className="text-sky-500 font-bold hover:underline">התחבר כאן</button>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-[10px] text-slate-400 max-w-md">
        בלחיצה על "צור חשבון" אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו. 
      </div>
    </div>
  );
};

export default SignupPage;
