
import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import RegistrationPage from './pages/RegistrationPage';
import CustomerJournal from './pages/CustomerJournal';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import { UserProfile, Customer } from './types';
import Layout from './components/Layout';

type Screen = 'landing' | 'signup' | 'onboarding' | 'journal' | 'login' | 'dashboard' | 'profile';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');

  // Empty profile for new sessions
  const EMPTY_PROFILE: UserProfile = {
    firstName: '',
    lastName: '',
    email: '',
    selectedCompanies: [],
    agreements: {},
    paymentMethod: { cardNumber: '', expiry: '', cvv: '' },
    isSetupComplete: false
  };

  const [profile, setProfile] = useState<UserProfile>({
    ...EMPTY_PROFILE,
    selectedCompanies: ['הראל'],
    agreements: { 'הראל': { health: { scope: '10', ongoing: '10' } } },
    isSetupComplete: true
  });
  const [customers, setCustomers] = useState<Customer[]>([]);

  const navigateTo = (screen: Screen) => setCurrentScreen(screen);

  const handleLogout = () => {
    setProfile(EMPTY_PROFILE);
    setCustomers([]);
    navigateTo('landing');
  };

  const handleLogin = () => {
    setProfile(EMPTY_PROFILE);
    setCustomers([]);
    navigateTo('dashboard');
  };

  // Step 1: User signs up with basic info
  const handleSignupComplete = (basicInfo: Partial<UserProfile>) => {
    // New user starts with incomplete setup
    setProfile(prev => ({ ...prev, ...basicInfo, isSetupComplete: false }));
    navigateTo('onboarding');
  };

  // Step 2: User completes onboarding (Excel import or Manual Setup)
  const handleOnboardingComplete = (newCustomers?: Customer[], extendedProfile?: Partial<UserProfile>) => {
    if (extendedProfile) {
      setProfile(prev => ({ ...prev, ...extendedProfile, isSetupComplete: true }));
    }
    if (newCustomers && newCustomers.length > 0) {
      setCustomers(prev => [...prev, ...newCustomers]);
    }
    navigateTo('journal'); // Or dashboard
  };

  return (
    <div className="min-h-screen selection:bg-sky-100 selection:text-sky-900 font-sans">
      <Layout
        activeScreen={currentScreen}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        showSidebar={['dashboard', 'journal', 'profile'].includes(currentScreen)}
      >
        {currentScreen === 'landing' && (
          <LandingPage
            onRegister={() => navigateTo('signup')}
            onLogin={() => navigateTo('login')}
          />
        )}

        {/* New Simple Signup Screen */}
        {currentScreen === 'signup' && (
          <SignupPage
            onSignupSuccess={handleSignupComplete}
            onLoginClick={() => navigateTo('login')}
          />
        )}

        {/* The Complex Setup Screen (Formerly RegistrationPage) */}
        {currentScreen === 'onboarding' && (
          <RegistrationPage
            initialProfile={profile}
            onComplete={handleOnboardingComplete}
            onBack={() => navigateTo('signup')}
            onSkip={() => navigateTo('dashboard')}
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
            customers={customers}
            setCustomers={setCustomers}
            onNavigate={navigateTo}
            onLogout={handleLogout}
          />
        )}
        {currentScreen === 'login' && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/60 max-w-sm w-full border border-slate-100 animate-slideUp">
              <div className="mb-4 text-center">
                <div className="text-2xl font-bold text-slate-900 mb-2">Followit 360</div>
                <div className="text-slate-500 text-sm">התחברות למערכת הניהול המקצועית</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase tracking-wider">דוא״ל</label>
                  <input type="email" placeholder="agent@pro.co.il" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 mr-1 uppercase tracking-wider">סיסמה</label>
                  <input type="password" placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/30 text-sm" />
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full mt-6 bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600 active:scale-[0.98] transition-all shadow-lg shadow-sky-500/20 text-sm"
              >
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
      </Layout>
    </div>
  );
};

export default App;
