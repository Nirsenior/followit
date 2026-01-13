
import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import CustomerJournal from './pages/CustomerJournal';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import { UserProfile, Customer } from './types';

type Screen = 'landing' | 'registration' | 'journal' | 'login' | 'dashboard' | 'profile';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    selectedCompanies: [],
    agreements: {},
    paymentMethod: { cardNumber: '', expiry: '', cvv: '' }
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const navigateTo = (screen: Screen) => setCurrentScreen(screen);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchMe = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setProfile(prev => ({ ...prev, ...userData }));
        setCurrentScreen('dashboard');
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchMe(token);
    }
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setProfile(prev => ({ ...prev, ...data.user }));
      setCurrentScreen('dashboard');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigateTo('landing');
  };

  return (
    <div className="min-h-screen selection:bg-sky-100 selection:text-sky-900">
      {currentScreen === 'landing' && (
        <LandingPage
          onRegister={() => navigateTo('registration')}
          onLogin={() => navigateTo('login')}
        />
      )}
      {currentScreen === 'registration' && (
        <RegistrationPage
          onComplete={() => navigateTo('journal')}
          onBack={() => navigateTo('landing')}
        />
      )}
      {currentScreen === 'journal' && (
        <CustomerJournal
          profile={profile}
          customers={customers}
          setCustomers={setCustomers}
          onLogout={handleLogout}
          onNavigate={navigateTo}
        />
      )}
      {currentScreen === 'dashboard' && (
        <Dashboard
          profile={profile}
          customers={customers}
          onNavigate={navigateTo}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'profile' && (
        <ProfileSettings
          profile={profile}
          setProfile={setProfile}
          onNavigate={navigateTo}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'login' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
          <div className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/60 max-w-md w-full border border-slate-100 animate-slideUp">
            <div className="mb-8 text-center">
              <div className="text-2xl font-bold text-slate-900 mb-2">InsurAgent Pro</div>
              <div className="text-slate-500 text-sm">התחברות למערכת הניהול המקצועית</div>
            </div>

            <div className="space-y-4">
              {authError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold">{authError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase tracking-wider">דוא״ל</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="agent@pro.co.il"
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase tracking-wider">סיסמה</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30"
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full mt-8 bg-sky-500 text-white py-4 rounded-xl font-bold hover:bg-sky-600 active:scale-[0.98] transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {authLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              כניסה מאובטחת
            </button>
            <button
              onClick={() => navigateTo('landing')}
              className="w-full mt-4 text-slate-400 font-medium hover:text-sky-600 text-sm transition-colors"
            >
              חזרה לדף הבית
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;
