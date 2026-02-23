
import React from 'react';
import { ShieldCheck, TrendingUp, Users, ArrowLeft } from 'lucide-react';

interface LandingPageProps {
  onRegister: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onRegister, onLogin }) => {
  const marketingText = {
    title: "הבית המקצועי של סוכני הביטוח",
    subtitle: "ניהול עמלות שקוף, מעקב לקוחות דינמי וצמיחה עסקית - הכל בפלטפורמה אחת חכמה.",
    features: [
      {
        icon: <ShieldCheck className="w-6 h-6 text-sky-500" />,
        title: "שקיפות מלאה",
        text: "כל הסכמי העמלות שלך במבט אחד, ללא הפתעות וחישובים ידניים."
      },
      {
        icon: <TrendingUp className="w-6 h-6 text-sky-500" />,
        title: "מנוע רווחיות",
        text: "ניתוח צמיחה וחיזוי הכנסות המבוסס על נתוני אמת מהיומן."
      },
      {
        icon: <Users className="w-6 h-6 text-sky-500" />,
        title: "ניהול חכם",
        text: "יומן לקוחות אינטראקטיבי המרכז את כל תיק הלקוחות שלך."
      }
    ]
  };

  return (
    <div className="bg-slate-50 min-h-screen selection:bg-sky-100">
      <header className="fixed top-0 inset-x-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            Followit <span className="text-sky-500">360</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onLogin}
              className="px-5 py-2.5 text-slate-600 font-bold hover:text-sky-600 transition-colors"
            >
              כניסה
            </button>
            <button
              onClick={onRegister}
              className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            >
              להרשמה
            </button>
          </div>
        </div>
      </header>

      <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-slate-900 tracking-tight leading-tight">
            {marketingText.title}
          </h1>
          <p className="text-xl text-slate-500 mb-12 leading-relaxed">
            {marketingText.subtitle}
          </p>
          <button
            onClick={onRegister}
            className="bg-sky-500 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-sky-600 shadow-xl shadow-sky-500/25 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto"
          >
            בואו נצא לדרך <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Promotional Video Section */}
        <section className="mb-32 animate-fadeIn relative">
          <div className="max-w-5xl mx-auto px-4">
            <div className="relative group">
              {/* Decorative background glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-emerald-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 aspect-video flex items-center justify-center">
                {/* Mock Video Content/Thumbnail */}
                <img
                  src="https://picsum.photos/seed/explainer/1200/675"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.3]"
                  alt="Explainer Video Preview"
                />

                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/40 group-hover:scale-110 transition-transform cursor-pointer">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">ראו את Followit 360 בפעולה</h3>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-widest px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">סרטון הדגמה • דקה וחצי של יעילות</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-10 mb-32">
          {marketingText.features.map((feature, idx) => (
            <div key={idx} className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/50">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-3/5">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">נבנה על ידי סוכנים, עבור סוכנים.</h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                אנחנו יודעים כמה זמן מושקע בניהול דוחות עמלות וחישובי נפרעים. הפלטפורמה שלנו עושה את העבודה הקשה בשבילך, כדי שתוכל להתמקד בדבר החשוב באמת - הלקוחות שלך.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3 overflow-hidden flex-row-reverse">
                  {[1, 2, 3].map(i => (
                    <img key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-900" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" />
                  ))}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-white font-bold">+500</span> סוכנים כבר הצטרפו
                </div>
              </div>
            </div>
            <div className="md:w-2/5">
              <img src="https://picsum.photos/seed/dashboard/600/400" className="rounded-2xl shadow-2xl grayscale-[0.2] brightness-90" alt="Platform" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        </div>
      </main>

      <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-100">
        &copy; {new Date().getFullYear()} Followit 360. פותח באהבה לסוכני ישראל.
      </footer>
    </div>
  );
};

export default LandingPage;
