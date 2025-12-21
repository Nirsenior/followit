
import React, { useMemo } from 'react';
import { 
  TrendingUp, Users, Wallet, Target, ChevronUp, ChevronDown, 
  LayoutDashboard, Users as UsersIcon, Edit3, LogOut, Bell, Menu
} from 'lucide-react';
import { UserProfile, Customer, INSURANCE_COMPANIES, Policy } from '../types';

interface DashboardProps {
  profile: UserProfile;
  customers: Customer[];
  onNavigate: (s: any) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, customers, onNavigate, onLogout }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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

  const getStatsForPeriod = (customerList: Customer[], targetMonth: number, targetYear: number) => {
    let totalPremium = 0, totalScope = 0, totalOngoing = 0;
    customerList.forEach(c => {
      c.policies.forEach(p => {
        if (p.status === 'active') {
          const premium = getEffectivePremium(p, c.dateOfBirth, targetMonth, targetYear);
          totalPremium += premium;
          const agreement = profile.agreements[p.company]?.[p.type];
          const ongoingRate = agreement ? parseFloat(agreement.ongoing || '5') / 100 : 0.05;
          const scopeRate = agreement ? parseFloat(agreement.scope || '10') / 100 : 0.1;
          totalOngoing += premium * ongoingRate; 
          if (!p.isAgentAppointmentOnly) totalScope += premium * 12 * scopeRate; 
        }
      });
    });
    return { count: customerList.length, premium: totalPremium, scope: totalScope, ongoing: totalOngoing };
  };

  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const m = d.getMonth(), y = d.getFullYear();
      const filtered = customers.filter(c => {
        const cd = new Date(c.createdAt);
        return cd.getFullYear() < y || (cd.getFullYear() === y && cd.getMonth() <= m);
      });
      const stats = getStatsForPeriod(filtered, m, y);
      return { label: `${m + 1}/${y.toString().slice(2)}`, value: stats.scope };
    });
  }, [customers, profile]);

  const curr = getStatsForPeriod(customers, currentMonth, currentYear);
  const totalOngoingSum: number = customers.reduce((acc, c) => {
    return acc + c.policies.filter(p => p.status === 'active').reduce((pAcc, p) => {
      const premium = getEffectivePremium(p, c.dateOfBirth, currentMonth, currentYear);
      const rate = profile.agreements[p.company]?.[p.type] ? parseFloat(profile.agreements[p.company]?.[p.type]?.ongoing || '5') / 100 : 0.05;
      return pAcc + (premium * rate);
    }, 0);
  }, 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex">
        <div className="p-8 text-xl font-bold border-b border-slate-800 tracking-tight">
          Insur<span className="text-sky-400">Agent</span> Pro
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/20">
            <LayoutDashboard className="w-5 h-5" /> דשבורד
          </button>
          <button onClick={() => onNavigate('journal')} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-standard text-slate-400">
            <UsersIcon className="w-5 h-5" /> יומן לקוחות
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

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        <header className="flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-bold tracking-tight">שלום, {profile.firstName} 👋</h1>
             <p className="text-slate-400 text-sm font-medium">סקירת ביצועים חודשית</p>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400 hover:text-sky-500 transition-colors"><Bell className="w-5 h-5" /></button>
              <div onClick={() => onNavigate('profile')} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/20 uppercase">
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Chart Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-sky-400" /> היקף מכירות (עמלת היקף)</h3>
              <div className="text-[10px] text-slate-400 font-bold uppercase">12 חודשים אחרונים</div>
            </div>
            <div className="h-60 flex items-end justify-between gap-1.5 px-2">
               {monthlyStats.map((s, i) => {
                 const maxVal = Math.max(...monthlyStats.map(x => x.value)) || 1000;
                 const height = (s.value / maxVal) * 100;
                 return (
                   <div key={i} className="flex-1 flex flex-col items-center group">
                     <div className={`w-full rounded-t-md transition-all duration-500 ${i === 11 ? 'bg-sky-500' : 'bg-slate-100 group-hover:bg-sky-100'}`} style={{ height: `${Math.max(height, 6)}%` }}></div>
                     <span className="text-[9px] font-bold text-slate-400 mt-3">{s.label}</span>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Performance Alerts */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> סיכום וצמיחה</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-8">
               <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
                 <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"><TrendingUp className="w-4 h-4 text-white" /></div>
                 <p className="text-emerald-900 text-sm font-bold leading-relaxed">גייסת {curr.count} לקוחות חדשים החודש. {curr.count > 0 ? 'כל הכבוד על המומנטום!' : 'זה הזמן להתחיל את המכירות.'}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">סה״כ לקוחות</div>
                    <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">פרמיות פעילות</div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">₪{curr.premium.toLocaleString()}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Ongoing Pie Chart */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-400" /> פילוח עמלות נפרעים מצטבר</h3>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">₪{totalOngoingSum.toLocaleString()}</div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-around gap-16">
            <div className="relative w-64 h-64 rounded-full flex items-center justify-center border-8 border-slate-50 shadow-inner">
               <div className="absolute inset-0 rounded-full" style={{ background: totalOngoingSum > 0 ? `conic-gradient(#0ea5e9 0% 35%, #10b981 35% 70%, #0f172a 70% 100%)` : '#f1f5f9' }}></div>
               <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">סה״כ מצטבר</span>
                 <span className="text-xl font-bold text-slate-900 tabular-nums">₪{totalOngoingSum.toLocaleString()}</span>
               </div>
            </div>

            <div className="flex-1 max-w-md space-y-3">
               {INSURANCE_COMPANIES.slice(0,3).map((co, i) => (
                 <div key={co} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${i===0 ? 'bg-sky-500' : i===1 ? 'bg-emerald-500' : 'bg-slate-900'}`}></div>
                     <span className="font-bold text-slate-700 text-sm">{co}</span>
                   </div>
                   <span className="text-xs font-bold text-slate-400">{(35 - i*5)}% מהתיק</span>
                 </div>
               ))}
               <p className="text-[11px] text-slate-400 mt-4 italic text-center">הנתונים מבוססים על לקוחות פעילים והסכמי העמלות האישיים שלך.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
