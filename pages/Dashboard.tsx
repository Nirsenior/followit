
import React, { useMemo } from 'react';
import {
  TrendingUp, Users, Wallet, Target, ChevronUp, ChevronDown,
  LayoutDashboard, Users as UsersIcon, Edit3, LogOut, Bell, Menu, AlertCircle
} from 'lucide-react';
import { UserProfile, Customer, INSURANCE_COMPANIES, Policy, FINANCIAL_TYPES } from '../types';
import { calcFinancialScope, calcFinancialOngoing, FinancialInputs, CommissionRates } from '../utils/commissionCalc';

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
    if ((policy.type === 'health' || policy.type === 'life' || policy.type === 'critical_illness') && policy.premiumSchedule && policy.premiumSchedule.length > 0) {
      const age = calculateAge(customerDob, targetMonth, targetYear);
      const scheduleItem = policy.premiumSchedule.find(item => item.age === age);
      return scheduleItem ? scheduleItem.premium : policy.monthlyCost;
    }
    return policy.monthlyCost;
  };

  const getStatsForPeriod = (customerList: Customer[], targetMonth: number, targetYear: number) => {
    let totalPremium = 0, totalScope = 0, totalOngoing = 0;
    customerList.forEach(c => {
      // Primary policies
      c.policies.forEach(p => {
        if (p.status === 'active' && profile.selectedCompanies.includes(p.company)) {
          const agreement = profile.agreements[p.company]?.[p.type];

          if (FINANCIAL_TYPES.includes(p.type)) {
            // Financial/pension: use dedicated commission engine
            const finInputs: FinancialInputs = {
              accumulation: p.details.accumulation || 0,
              mobility: p.details.mobility || 0,
              monthlyDeposit: p.details.monthlyDeposit || 0,
              lumpSumDeposit: p.details.lumpSumDeposit || 0
            };
            const rates: CommissionRates = {
              scope: parseFloat(agreement?.scope || '0'),
              ongoing: parseFloat(p.fixedCommissionRate || agreement?.ongoing || '0'),
              mobility: parseFloat(agreement?.mobility || '0')
            };
            totalScope += calcFinancialScope(finInputs, rates);
            totalOngoing += calcFinancialOngoing(finInputs, rates);
            totalPremium += p.monthlyCost;
          } else {
            // Standard: premium × rate
            const premium = getEffectivePremium(p, c.dateOfBirth, targetMonth, targetYear);
            totalPremium += premium;
            const rateString = p.fixedCommissionRate || agreement?.ongoing || '0';
            const ongoingRate = parseFloat(rateString) / 100;
            const scopeRate = agreement ? parseFloat(agreement.scope || '0') / 100 : 0;
            totalOngoing += premium * ongoingRate;
            if (!p.isAgentAppointmentOnly) totalScope += premium * 12 * scopeRate;
          }
        }
      });
      // Family policies
      c.familyMembers?.forEach(fm => {
        fm.policies.forEach(p => {
          if (p.status === 'active' && profile.selectedCompanies.includes(p.company)) {
            // Find a reference schedule if shared
            let scheduleToUse = p.premiumSchedule;
            if (fm.isPremiumSharedWithPrimary && (!p.premiumSchedule || p.premiumSchedule.length === 0)) {
              const primaryPrivateWithSchedule = c.policies.find(pp => (pp.type === 'health' || pp.type === 'life' || pp.type === 'critical_illness') && pp.premiumSchedule && pp.premiumSchedule.length > 0);
              if (primaryPrivateWithSchedule) {
                scheduleToUse = primaryPrivateWithSchedule.premiumSchedule;
              }
            }

            let premium = p.monthlyCost;
            if ((p.type === 'health' || p.type === 'life' || p.type === 'critical_illness') && scheduleToUse && scheduleToUse.length > 0) {
              const age = calculateAge(fm.dateOfBirth, targetMonth, targetYear);
              const scheduleItem = scheduleToUse.find(item => item.age === age);
              premium = scheduleItem ? scheduleItem.premium : p.monthlyCost;
            }

            totalPremium += premium;
            const agreement = profile.agreements[p.company]?.[p.type];
            const ongoingRate = agreement ? parseFloat(agreement.ongoing || '0') / 100 : 0;
            const scopeRate = agreement ? parseFloat(agreement.scope || '0') / 100 : 0;
            totalOngoing += premium * ongoingRate;
            if (!p.isAgentAppointmentOnly) totalScope += premium * 12 * scopeRate;
          }
        });
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

  // Group ongoing by company dynamically based on selected companies
  const companyBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    profile.selectedCompanies.forEach(co => totals[co] = 0);

    customers.forEach(c => {
      // Primary
      c.policies.forEach(p => {
        if (p.status === 'active' && profile.selectedCompanies.includes(p.company)) {
          const premium = getEffectivePremium(p, c.dateOfBirth, currentMonth, currentYear);
          const agreement = profile.agreements[p.company]?.[p.type];
          const rateString = p.fixedCommissionRate || agreement?.ongoing || '0';
          const rate = parseFloat(rateString) / 100;
          totals[p.company] += (premium * rate);
        }
      });
      // Family
      c.familyMembers?.forEach(fm => {
        fm.policies.forEach(p => {
          if (p.status === 'active' && profile.selectedCompanies.includes(p.company)) {
            let scheduleToUse = p.premiumSchedule;
            if (fm.isPremiumSharedWithPrimary && (!p.premiumSchedule || p.premiumSchedule.length === 0)) {
              const primaryPrivateWithSchedule = c.policies.find(pp => (pp.type === 'health' || pp.type === 'life' || pp.type === 'critical_illness') && pp.premiumSchedule && pp.premiumSchedule.length > 0);
              if (primaryPrivateWithSchedule) scheduleToUse = primaryPrivateWithSchedule.premiumSchedule;
            }

            let premium = p.monthlyCost;
            if ((p.type === 'health' || p.type === 'life' || p.type === 'critical_illness') && scheduleToUse && scheduleToUse.length > 0) {
              const age = calculateAge(fm.dateOfBirth, currentMonth, currentYear);
              const scheduleItem = scheduleToUse.find(item => item.age === age);
              premium = scheduleItem ? scheduleItem.premium : p.monthlyCost;
            }

            const agreement = profile.agreements[p.company]?.[p.type];
            const rateString = p.fixedCommissionRate || agreement?.ongoing || '0';
            const rate = parseFloat(rateString) / 100;
            totals[p.company] += (premium * rate);
          }
        });
      });
    });


    const totalSum = Object.values(totals).reduce((a, b) => a + b, 0);

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalSum > 0 ? (value / totalSum) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .filter(item => item.value > 0 || profile.selectedCompanies.includes(item.name));
  }, [customers, profile, currentMonth, currentYear]);

  const totalOngoingSum = companyBreakdown.reduce((acc, curr) => acc + curr.value, 0);

  // Colors for chart
  const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#94a3b8'];

  // Helper for conic gradient
  const getConicGradient = () => {
    if (totalOngoingSum === 0) return '#f1f5f9';
    let currentPerc = 0;
    const slices = companyBreakdown.map((item, i) => {
      const start = currentPerc;
      const end = currentPerc + item.percentage;
      currentPerc = end;
      return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${end}%`;
    });
    return `conic-gradient(${slices.join(', ')})`;
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">שלום, {profile.firstName} 👋</h1>
          <p className="text-slate-400 text-[13px] font-medium">סקירת ביצועים חודשית</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-sky-500 transition-colors"><Bell className="w-4.5 h-4.5" /></button>

          <div onClick={() => onNavigate('profile')} className="relative cursor-pointer group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all shadow-lg uppercase text-xs ${!profile.isSetupComplete
              ? 'bg-white text-slate-900 border-2 border-rose-500'
              : 'bg-slate-900 text-white shadow-slate-900/20 hover:scale-105 active:scale-95'
              }`}>
              {profile.firstName[0]}{profile.lastName[0]}
            </div>

            {/* Setup Incomplete Indicator */}
            {!profile.isSetupComplete && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                </span>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                  הגדרת הפרופיל לא הושלמה. לחץ להשלמה.
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {!profile.isSetupComplete && (
        <div onClick={() => onNavigate('profile')} className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-colors animate-slideUp">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-rose-800 text-[13px]">נדרשת השלמת הגדרות פרופיל</h3>
              <p className="text-[12px] text-rose-600">לחץ כאן כדי להגדיר את חברות הביטוח והסכמי העמלות שלך ולהתחיל לעבוד בצורה תקינה.</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-rose-400 rotate-90" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-sky-400" /> היקף מכירות (עמלת היקף)</h3>
            <div className="text-[9px] text-slate-400 font-bold uppercase">12 חודשים אחרונים</div>
          </div>
          <div className="h-48 flex items-end justify-between gap-1 px-1">
            {monthlyStats.map((s, i) => {
              const maxVal = Math.max(...monthlyStats.map(x => x.value)) || 1000;
              const height = (s.value / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className={`w-full rounded-t-sm transition-all duration-500 ${i === 11 ? 'bg-sky-500' : 'bg-slate-100 group-hover:bg-sky-100'}`} style={{ height: `${Math.max(height, 6)}%` }}></div>
                  <span className="text-[8px] font-bold text-slate-400 mt-2" dir="ltr">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Alerts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target className="w-3.5 h-3.5 text-emerald-400" /> סיכום וצמיחה</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
              <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"><TrendingUp className="w-3.5 h-3.5 text-white" /></div>
              <p className="text-emerald-900 text-xs font-bold leading-relaxed">גייסת {curr.count} לקוחות חדשים החודש. {curr.count > 0 ? 'כל הכבוד על המומנטום!' : 'זה הזמן להתחיל את המכירות.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">סה״כ לקוחות</div>
                <div className="text-xl font-bold text-slate-900">{customers.length}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">פרמיות פעילות</div>
                <div className="text-xl font-bold text-slate-900 tabular-nums">₪{curr.premium.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Ongoing Pie Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-400" /> פילוח עמלות נפרעים מצטבר</h3>
          <div className="text-xl font-bold text-slate-900 tabular-nums">₪{totalOngoingSum.toLocaleString()}</div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
          <div className="relative w-48 h-48 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-inner">
            <div className="absolute inset-0 rounded-full transition-all duration-700" style={{ background: getConicGradient() }}></div>
            <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">סה״כ נפרעים</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">₪{totalOngoingSum.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex-1 max-w-md space-y-3 w-full">
            {companyBreakdown.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8">אין נתוני עמלות להצגה. וודא שבחרת חברות בהגדרות והזנת לקוחות.</p>
            ) : (
              companyBreakdown.slice(0, 6).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                    <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-900">₪{item.value.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.percentage.toFixed(1)}% מהתיק</span>
                  </div>
                </div>
              ))
            )}
            {companyBreakdown.length > 6 && <p className="text-center text-[10px] text-slate-400 pt-2">+ עוד {companyBreakdown.length - 6} חברות נוספות</p>}
            <p className="text-[11px] text-slate-400 mt-4 italic text-center">הנתונים מבוססים על לקוחות פעילים והסכמי העמלות המוגדרים בפרופיל שלך.</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
