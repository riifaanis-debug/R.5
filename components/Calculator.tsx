import React, { useState, useEffect } from 'react';
import { Section, SectionHeader, Card } from './Shared';
import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { safeStringify } from '../src/utils/safeJson';

const Calculator: React.FC = () => {
  const { token, user } = useAuth();
  const [salary, setSalary] = useState<number>(10000);
  const [obligations, setObligations] = useState<number>(2000);
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-prefill from profile
  useEffect(() => {
    if (user?.email) {
      const savedProfile = localStorage.getItem(`profile_${user.email}`);
      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        if (data.salary) setSalary(parseFloat(data.salary));
        if (data.products) {
          const totalObs = data.products.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
          // If they have products, we might want to use that as obligations
          // But maybe they want to manually override. Let's set it if it's > 0.
          if (totalObs > 0) setObligations(totalObs);
        }
      }
    }
  }, [user]);
  const [result, setResult] = useState<{
    dbr: number;
    maxInstallment: number;
    available: number;
    status: string;
    statusColor: string;
    icon: React.ReactNode;
    advice: string;
  } | null>(null);

  useEffect(() => {
    calculate();
  }, [salary, obligations]);

  const calculate = () => {
    if (!salary || salary <= 0) {
      setResult(null);
      return;
    }

    const DBR_LIMIT = 0.45; // 45% standard limit
    const maxInstallment = salary * DBR_LIMIT;
    const obs = obligations || 0;
    
    // Calculate actual DBR
    const actualDbr = (obs / salary) * 100;
    // Cap visual DBR at 100% for the gauge
    const visualDbr = Math.min(actualDbr, 100); 
    
    const available = Math.max(0, maxInstallment - obs);

    let status = '';
    let statusColor = '';
    let icon = null;
    let advice = '';

    if (actualDbr <= 30) {
      status = 'ملاءة مالية ممتازة';
      statusColor = 'text-emerald-600';
      icon = <CheckCircle size={24} className="text-emerald-600" />;
      advice = 'وضعك المالي سليم جداً، لديك فرصة عالية للحصول على تمويل إضافي بأفضل الشروط.';
    } else if (actualDbr <= 45) {
      status = 'ملاءة مالية جيدة';
      statusColor = 'text-blue-600';
      icon = <TrendingUp size={24} className="text-blue-600" />;
      advice = 'وضعك مستقر وتلتزم بالحدود النظامية (45%). لديك إمكانية للحصول على تمويل.';
    } else if (actualDbr <= 65) {
      status = 'التزامات مرتفعة';
      statusColor = 'text-amber-600';
      icon = <Info size={24} className="text-amber-600" />;
      advice = 'التزاماتك تجاوزت الحد النظامي للإقراض الجديد. قد تحتاج إلى جدولة لترتيب وضعك.';
    } else {
      status = 'عبء مالي حرج';
      statusColor = 'text-red-600';
      icon = <AlertTriangle size={24} className="text-red-600" />;
      advice = 'أنت في مرحلة خطر التعثر المالي. ننصحك بالتواصل معنا فوراً لدراسة حلول إعادة الهيكلة.';
    }

    setResult({
      dbr: visualDbr, // Use actualDbr for text if you want >100%, but visually visualDbr
      maxInstallment,
      available,
      status,
      statusColor,
      icon,
      advice
    });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSalary(isNaN(val) ? 0 : val);
  };

  const handleObligationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setObligations(isNaN(val) ? 0 : val);
  };

  // Helper for gauge color
  const getGaugeColor = (pct: number) => {
    if (pct <= 30) return '#10B981'; // emerald-500
    if (pct <= 45) return '#3B82F6'; // blue-500
    if (pct <= 65) return '#D97706'; // amber-600
    return '#DC2626'; // red-600
  };

  return (
    <Section id="calculator">
      <Card>
        <SectionHeader
          eyebrow="أدوات ذكية"
          title="حاسبة الالتزامات التفاعلية"
          subtitle="حرك المؤشرات لترى كيف تتغير ملاءتك المالية وقدرتك التمويلية."
        />

        <div className="space-y-6 mt-4">
          {/* Inputs Section */}
          <div className="space-y-6 bg-white/50 p-2 rounded-xl">
            {/* Salary Input */}
            <div>
              <div className="flex justify-between mb-2 items-center">
                <label className="text-[12px] font-bold text-brand flex items-center gap-1">
                   الراتب الشهري
                </label>
                <div className="flex items-center gap-1 bg-white border border-gold/30 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-muted">ر.س</span>
                  <input
                    type="number"
                    value={salary || ''}
                    onChange={handleSalaryChange}
                    className="w-16 text-left text-sm font-bold text-brand focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <input
                type="range"
                min="3000"
                max="50000"
                step="500"
                value={salary}
                onChange={handleSalaryChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold"
                style={{ background: `linear-gradient(to left, #C7A969 0%, #C7A969 ${(salary-3000)/(50000-3000)*100}%, #e5e7eb ${(salary-3000)/(50000-3000)*100}%, #e5e7eb 100%)` }}
              />
              <div className="flex justify-between mt-1 text-[10px] text-muted/60 font-sans dir-ltr">
                <span>50k</span>
                <span>3k</span>
              </div>
            </div>

            {/* Obligations Input */}
            <div>
              <div className="flex justify-between mb-2 items-center">
                <label className="text-[12px] font-bold text-brand">الأقساط الشهرية</label>
                <div className="flex items-center gap-1 bg-white border border-gold/30 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-muted">ر.س</span>
                  <input
                    type="number"
                    value={obligations || ''}
                    onChange={handleObligationsChange}
                    className="w-16 text-left text-sm font-bold text-brand focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(salary, 5000)} // Allow range up to salary
                step="100"
                value={obligations}
                onChange={handleObligationsChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand"
                style={{ background: `linear-gradient(to left, #22042C 0%, #22042C ${(obligations)/(Math.max(salary, 5000))*100}%, #e5e7eb ${(obligations)/(Math.max(salary, 5000))*100}%, #e5e7eb 100%)` }}
              />
            </div>
          </div>

          {/* Results Visualization */}
          {result && (
            <div className="relative pt-2 pb-2 animate-in fade-in duration-500">
               {/* Gauge Circle SVG */}
               <div className="flex justify-center mb-6 relative">
                  <svg viewBox="0 0 36 36" className="w-40 h-40 transform -rotate-90 drop-shadow-lg">
                    {/* Background Circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="2.5"
                    />
                    {/* Progress Circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={getGaugeColor(result.dbr)}
                      strokeWidth="2.5"
                      strokeDasharray={`${result.dbr}, 100`}
                      className="transition-[stroke-dasharray] duration-700 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Gauge Content / Tooltip */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                    {showTooltip ? (
                      <div 
                        className="bg-white/95 absolute inset-2 rounded-full flex flex-col items-center justify-center p-2 border border-gold/30 shadow-inner cursor-pointer animate-in fade-in zoom-in duration-200"
                        onClick={() => setShowTooltip(false)}
                      >
                        <p className="text-[9px] font-bold text-brand mb-1">ما هي نسبة الاستقطاع؟</p>
                        <p className="text-[9px] text-muted leading-relaxed">
                           هي نسبة ما تدفعه شهرياً من راتبك لسداد الديون.
                           <br/>
                           الحد النظامي الصحي هو 45% لضمان الاستقرار.
                        </p>
                        <span className="text-[8px] text-gold mt-1 font-bold">(اضغط للعودة)</span>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => setShowTooltip(true)} 
                          className="flex items-center gap-1 mb-0.5 group focus:outline-none transition-transform active:scale-95"
                        >
                          <span className="text-[10px] text-muted font-medium select-none">نسبة الاستقطاع</span>
                          <Info size={11} className="text-muted/60 group-hover:text-gold transition-colors" />
                        </button>
                        <span className={`text-2xl font-bold ${result.statusColor} tabular-nums leading-none`}>
                          {(obligations/salary*100).toFixed(1)}%
                        </span>
                        <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full bg-white/80 border ${result.statusColor.replace('text-', 'border-')} ${result.statusColor}`}>
                          {result.status}
                        </span>
                      </>
                    )}
                  </div>
               </div>

               {/* Stats Cards */}
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-[16px] border border-gold/10 shadow-sm text-center group hover:border-gold/40 transition-colors">
                    <div className="text-[10px] text-muted mb-1 group-hover:text-brand transition-colors">الراتب المتبقي</div>
                    <div className="text-xl font-bold text-brand tabular-nums">
                      {(salary - obligations).toLocaleString()} <span className="text-[10px] font-normal text-muted">ر.س</span>
                    </div>
                  </div>
                  <div className="bg-gold-gradient p-[1px] rounded-[16px] shadow-sm">
                    <div className="bg-white h-full w-full rounded-[15px] p-3 text-center flex flex-col justify-center items-center">
                        <div className="text-[10px] text-muted mb-1">القدرة التمويلية (المتبقية)</div>
                        <div className="text-xl font-bold text-brand tabular-nums">
                        {Math.floor(result.available).toLocaleString()} <span className="text-[10px] font-normal text-muted">ر.س</span>
                        </div>
                    </div>
                  </div>
               </div>

               {/* Advice Box */}
               <div className={`p-4 rounded-[16px] border flex flex-col gap-2 transition-colors duration-300 ${
                 result.dbr > 45 
                   ? 'bg-red-50/50 border-red-100' 
                   : (result.dbr > 30 ? 'bg-blue-50/50 border-blue-100' : 'bg-emerald-50/50 border-emerald-100')
               }`}>
                  <div className="flex items-center gap-2">
                    {result.icon}
                    <div className={`text-[12px] font-extrabold ${result.statusColor}`}>تحليل المستشار المالي</div>
                  </div>
                  <div className="text-[11px] text-gray-600 leading-relaxed pr-[32px]">
                    {result.advice}
                  </div>
               </div>

               {/* Request Consultation Button */}
               <button 
                onClick={async () => {
                   try {
                     const response = await fetch("/api/submit-request", {
                       method: "POST",
                       headers: { 
                         "Content-Type": "application/json",
                         ...(token ? { "Authorization": `Bearer ${token}` } : {})
                       },
                       body: safeStringify({
                         type: "consultation_request",
                         salary,
                         obligations,
                         dbr: (obligations/salary*100).toFixed(1),
                         status: result.status
                       })
                     });
                     if (response.ok) {
                       alert("تم إرسال طلب الاستشارة بنجاح. سيتواصل معك مستشارنا المالي قريباً.");
                       window.dispatchEvent(new CustomEvent('request-submitted'));
                     }
                   } catch (error) {
                     console.error(error);
                   }
                 }}
                 className="w-full mt-4 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 transition-all shadow-md active:scale-[0.98]"
               >
                 طلب استشارة مالية مجانية
               </button>
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
};

export default Calculator;