import React, { useState, useEffect, useRef } from 'react';
import { Section, SectionHeader, Card, Button } from './Shared';
import { Search, Map as MapIcon, Layers, X, MapPin, Ruler, ExternalLink, Locate, FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PlotData {
  id: string;
  type: 'residential' | 'commercial' | 'agricultural';
  points: string; // SVG polygon points
  center: { x: number, y: number };
  data: {
    city: string;
    district: string;
    planNumber: string;
    plotNumber: string;
    area: number;
    landUse: string;
    borders: { dir: string; len: string; neighbor: string }[];
    streets: { name: string; width: string; dir: string }[];
    valuation: {
      pricePerMeter: number;
      totalValue: number;
      lastUpdate: string;
      transactionCount: number;
      trend: 'up' | 'down' | 'stable';
    };
  }
}

// Mock Data for Interactive Plots - A small neighborhood block
const INTERACTIVE_PLOTS: PlotData[] = [
  {
    id: 'plot-25',
    type: 'residential',
    points: "250,200 350,180 370,280 270,300", // Rhombus shape
    center: { x: 310, y: 240 },
    data: {
      city: "مكة المكرمة",
      district: "حي العوالي",
      planNumber: "2094",
      plotNumber: "25",
      area: 450.50,
      landUse: "سكني",
      borders: [
        { dir: "شمالاً", len: "20.00 م", neighbor: "قطعة 24" },
        { dir: "جنوباً", len: "20.00 م", neighbor: "قطعة 26" },
        { dir: "شرقاً", len: "22.50 م", neighbor: "شارع عرض 15م" },
        { dir: "غرباً", len: "22.50 م", neighbor: "قطعة 30" },
      ],
      streets: [{ name: "شارع داخلي", width: "15 متر", dir: "شرق" }],
      valuation: { pricePerMeter: 3800, totalValue: 1711900, lastUpdate: "2025-02-20", transactionCount: 12, trend: 'up' }
    }
  },
  {
    id: 'plot-26',
    type: 'commercial',
    points: "370,280 470,260 490,360 390,380",
    center: { x: 430, y: 320 },
    data: {
      city: "مكة المكرمة",
      district: "حي العوالي",
      planNumber: "2094",
      plotNumber: "26",
      area: 600.00,
      landUse: "تجاري",
      borders: [
        { dir: "شمالاً", len: "30.00 م", neighbor: "قطعة 25" },
        { dir: "جنوباً", len: "30.00 م", neighbor: "شارع تجاري" },
        { dir: "شرقاً", len: "20.00 م", neighbor: "ممر مشاة" },
        { dir: "غرباً", len: "20.00 م", neighbor: "قطعة 31" },
      ],
      streets: [{ name: "طريق الملك فهد", width: "40 متر", dir: "جنوب" }],
      valuation: { pricePerMeter: 6500, totalValue: 3900000, lastUpdate: "2025-02-18", transactionCount: 55, trend: 'up' }
    }
  },
  {
    id: 'plot-24',
    type: 'residential',
    points: "150,220 250,200 270,300 170,320",
    center: { x: 210, y: 260 },
    data: {
      city: "مكة المكرمة",
      district: "حي العوالي",
      planNumber: "2094",
      plotNumber: "24",
      area: 420.00,
      landUse: "سكني",
      borders: [
        { dir: "شمالاً", len: "21.00 م", neighbor: "قطعة 23" },
        { dir: "جنوباً", len: "21.00 م", neighbor: "قطعة 25" },
        { dir: "شرقاً", len: "20.00 م", neighbor: "شارع 15" },
        { dir: "غرباً", len: "20.00 م", neighbor: "حديقة" },
      ],
      streets: [{ name: "شارع داخلي", width: "12 متر", dir: "شرق" }],
      valuation: { pricePerMeter: 3650, totalValue: 1533000, lastUpdate: "2025-02-15", transactionCount: 8, trend: 'stable' }
    }
  },
  {
    id: 'plot-27',
    type: 'residential',
    points: "470,260 570,240 590,340 490,360",
    center: { x: 530, y: 300 },
    data: {
      city: "مكة المكرمة",
      district: "حي العوالي",
      planNumber: "2094",
      plotNumber: "27",
      area: 500.00,
      landUse: "سكني",
      borders: [
        { dir: "شمالاً", len: "25.00 م", neighbor: "قطعة 26" },
        { dir: "جنوباً", len: "25.00 م", neighbor: "شارع" },
        { dir: "شرقاً", len: "20.00 م", neighbor: "جار" },
        { dir: "غرباً", len: "20.00 م", neighbor: "جار" },
      ],
      streets: [{ name: "شارع 20", width: "20 متر", dir: "جنوب" }],
      valuation: { pricePerMeter: 3900, totalValue: 1950000, lastUpdate: "2025-02-21", transactionCount: 15, trend: 'down' }
    }
  }
];

const RealEstateMap: React.FC = () => {
  const [searchValues, setSearchValues] = useState({ city: 'مكة', plan: '', plot: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [result, setResult] = useState<PlotData['data'] | null>(null);
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Simulate map loading effect
  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValues.plan || !searchValues.plot) return;

    setIsLoading(true);
    setResult(null);
    setSelectedPlotId(null);
    setSearchError(false);

    // Simulate API Search
    setTimeout(() => {
      const foundPlot = INTERACTIVE_PLOTS.find(
        p => p.data.planNumber === searchValues.plan && p.data.plotNumber === searchValues.plot
      );

      if (foundPlot) {
        setSelectedPlotId(foundPlot.id);
        setResult(foundPlot.data);
      } else {
        setSearchError(true);
      }
      setIsLoading(false);
    }, 1500);
  };

  const handlePlotClick = (plot: PlotData) => {
    setSelectedPlotId(plot.id);
    setIsLoading(true);
    setSearchError(false);
    
    // Simulate fetching details
    setTimeout(() => {
        setResult(plot.data);
        // Auto fill search inputs to reflect clicked plot
        setSearchValues(prev => ({
            ...prev, 
            plan: plot.data.planNumber,
            plot: plot.data.plotNumber
        }));
        setIsLoading(false);
    }, 400);
  };

  const handleGenerateReport = () => {
    setIsGeneratingFile(true);
    setTimeout(() => {
      setIsGeneratingFile(false);
      
      // Create a mock text file content
      const content = `
      المملكة العربية السعودية
      منصة ريفانس المالية - تقرير ملف الأرض
      --------------------------------
      تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}
      
      [بيانات الموقع]
      المدينة: ${result?.city}
      الحي: ${result?.district}
      رقم المخطط: ${result?.planNumber}
      رقم القطعة: ${result?.plotNumber}
      
      [بيانات الأرض]
      المساحة: ${result?.area} متر مربع
      الاستخدام: ${result?.landUse}
      
      [التقييم العقاري التقريبي]
      سعر المتر التقديري: ${result?.valuation.pricePerMeter} ريال
      إجمالي القيمة السوقية: ${result?.valuation.totalValue.toLocaleString()} ريال
      حالة السوق: ${result?.valuation.trend === 'up' ? 'مرتفع' : result?.valuation.trend === 'down' ? 'منخفض' : 'مستقر'}
      
      * هذا التقرير استرشادي ومبني على بيانات السوق الحالية.
      `;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rifans_Report_${result?.planNumber}_${result?.plotNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    }, 2500);
  };

  // Helper to get plot colors
  const getPlotStyles = (type: string, isSelected: boolean) => {
    const baseOpacity = isSelected ? 0.8 : 0.4;
    const strokeWidth = isSelected ? 3 : 1;
    
    let fill = '';
    let stroke = '';

    switch (type) {
      case 'residential': 
        fill = `rgba(59, 130, 246, ${baseOpacity})`; // Blue
        stroke = isSelected ? '#1E40AF' : '#60A5FA';
        break;
      case 'commercial': 
        fill = `rgba(239, 68, 68, ${baseOpacity})`; // Red
        stroke = isSelected ? '#991B1B' : '#F87171';
        break;
      default: 
        fill = `rgba(34, 197, 94, ${baseOpacity})`; // Green
        stroke = isSelected ? '#166534' : '#4ADE80';
    }
    
    if (isSelected) {
        fill = 'rgba(199, 169, 105, 0.85)'; // Gold for selection
        stroke = '#22042C'; // Brand Dark
    }

    return { fill, stroke, strokeWidth };
  };

  return (
    <Section id="rf-realestate-map">
      <SectionHeader 
        eyebrow="خدمات عقارية" 
        title="الخريطة العقارية التفاعلية" 
        subtitle="ابحث برقم المخطط والقطعة لاستعراض البيانات، الحدود، والتقييم الفوري."
      />

      <div className="relative w-full h-[550px] rounded-[24px] overflow-hidden border border-gold/50 shadow-2xl bg-[#e5e7eb] group select-none ring-4 ring-black/5">
        
        {/* Map Background Layer (Simulated Satellite) */}
        <div className={`absolute inset-0 w-full h-full bg-[#e5e7eb] transition-opacity duration-1000 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Satellite Texture Simulation */}
            <div className="absolute inset-0 opacity-60" style={{ 
               backgroundImage: 'url("https://www.transparenttextures.com/patterns/shattered-island.png")',
               backgroundSize: 'cover',
               filter: 'contrast(120%) sepia(20%)'
            }}></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-200/40 to-gray-300/40 mix-blend-multiply"></div>
            
            {/* Street Grid (Decorative) */}
            <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
                <line x1="0" y1="320" x2="800" y2="200" stroke="#fff" strokeWidth="40" />
                <line x1="200" y1="600" x2="400" y2="0" stroke="#fff" strokeWidth="30" />
                <line x1="500" y1="600" x2="600" y2="0" stroke="#fff" strokeWidth="20" />
            </svg>
        </div>

        {/* Interactive SVG Layer */}
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="selected-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#C7A969" floodOpacity="0.8" />
                </filter>
            </defs>
            
            {/* Render Plots */}
            {INTERACTIVE_PLOTS.map((plot) => {
                const isSelected = selectedPlotId === plot.id;
                const styles = getPlotStyles(plot.type, isSelected);
                
                return (
                    <g key={plot.id} 
                       onClick={() => handlePlotClick(plot)} 
                       className="cursor-pointer transition-all duration-300 hover:opacity-90"
                       style={{ transformOrigin: 'center', transition: 'transform 0.3s' }}
                    >
                        <polygon 
                            points={plot.points}
                            fill={styles.fill}
                            stroke={styles.stroke}
                            strokeWidth={styles.strokeWidth}
                            className="transition-all duration-300 ease-out"
                            filter={isSelected ? "url(#selected-glow)" : ""}
                        />
                        
                        {/* Plot Number */}
                        <text 
                            x={plot.center.x} 
                            y={plot.center.y}
                            fill={isSelected ? "#22042C" : "white"}
                            fontSize={isSelected ? "16" : "12"}
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            pointerEvents="none"
                            style={{textShadow: '0px 1px 3px rgba(0,0,0,0.6)'}}
                        >
                            {plot.data.plotNumber}
                        </text>

                        {/* Pin Icon when selected */}
                        {isSelected && (
                           <foreignObject x={plot.center.x - 12} y={plot.center.y - 34} width="24" height="24">
                              <div className="animate-bounce">
                                <MapPin className="text-brand fill-gold drop-shadow-lg" size={24} />
                              </div>
                           </foreignObject>
                        )}
                    </g>
                );
            })}
        </svg>

        {/* Loading Overlay */}
        {!mapLoaded && (
           <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <span className="text-xs text-muted">جاري تحميل الخريطة...</span>
             </div>
           </div>
        )}

        {/* Map Controls (Floating) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
           <button className="w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-brand hover:bg-gray-50 active:scale-95 transition-all" title="طبقات الخريطة">
             <Layers size={18} />
           </button>
           <button className="w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-100 flex items-center justify-center text-brand hover:bg-gray-50 active:scale-95 transition-all" title="تحديد موقعي">
             <Locate size={18} />
           </button>
        </div>

        {/* Search Panel (Floating Top-Left) */}
        <div className={`absolute top-4 left-4 right-14 md:right-auto md:w-[340px] z-30 transition-all duration-500 ease-in-out ${result ? 'opacity-0 pointer-events-none translate-y-[-20px]' : 'opacity-100 translate-y-0'}`}>
           <Card className="!p-0 overflow-hidden shadow-2xl backdrop-blur-xl bg-white/95 border-0 ring-1 ring-black/5">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button className="flex-1 py-3 text-[11px] font-bold text-brand border-b-2 border-brand bg-white">بحث بالمخطط</button>
                <button className="flex-1 py-3 text-[11px] font-bold text-muted hover:bg-gray-50 transition-colors">بحث بالصك</button>
              </div>

              {/* Form */}
              <form onSubmit={handleSearch} className="p-4 space-y-3">
                 <div>
                   <label className="text-[10px] font-bold text-brand block mb-1.5">المدينة</label>
                   <select 
                     className="w-full h-9 px-3 rounded-[10px] border border-gray-200 text-[12px] outline-none focus:border-gold bg-gray-50 focus:bg-white transition-colors"
                     value={searchValues.city}
                     onChange={(e) => setSearchValues({...searchValues, city: e.target.value})}
                   >
                     <option value="">اختر المدينة...</option>
                     <option value="مكة">مكة المكرمة</option>
                     <option value="الرياض">الرياض</option>
                     <option value="جدة">جدة</option>
                   </select>
                 </div>
                 
                 <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-brand block mb-1.5">رقم المخطط</label>
                      <input 
                        type="text" 
                        placeholder="2094"
                        className="w-full h-9 px-3 rounded-[10px] border border-gray-200 text-[12px] outline-none focus:border-gold font-mono text-center bg-gray-50 focus:bg-white transition-colors"
                        value={searchValues.plan}
                        onChange={(e) => setSearchValues({...searchValues, plan: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-brand block mb-1.5">رقم القطعة</label>
                      <input 
                        type="text" 
                        placeholder="25"
                        className="w-full h-9 px-3 rounded-[10px] border border-gray-200 text-[12px] outline-none focus:border-gold font-mono text-center bg-gray-50 focus:bg-white transition-colors"
                        value={searchValues.plot}
                        onChange={(e) => setSearchValues({...searchValues, plot: e.target.value})}
                      />
                    </div>
                 </div>

                 <Button type="submit" disabled={isLoading} className="w-full h-10 mt-2 shadow-md gap-2 text-[12px]">
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Search size={14} />
                        <span>بحث واستعلام</span>
                      </>
                    )}
                 </Button>

                 {searchError && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-[10px] mt-2 animate-in fade-in slide-in-from-top-1 border border-red-100">
                        <AlertCircle size={12} />
                        <span>عذراً، لم يتم العثور على نتائج. جرب (مخطط 2094 قطعة 25)</span>
                    </div>
                 )}
              </form>
           </Card>
        </div>

        {/* Result Bottom Sheet (Slide Up) */}
        <div className={`absolute inset-x-0 bottom-0 z-40 transition-transform duration-500 ease-out transform ${result ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-gold/20 overflow-hidden max-h-[85%] flex flex-col">
                
                {/* Drag Handle / Close */}
                <div className="bg-[#FFFBF2] p-3 flex justify-between items-center border-b border-gold/10 shrink-0 cursor-pointer" onClick={() => { setResult(null); setSelectedPlotId(null); }}>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white border border-gold/20 flex items-center justify-center text-gold shadow-sm">
                           <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-extrabold text-brand">ملف الأرض</h3>
                            <p className="text-[10px] text-muted flex items-center gap-1">
                                <MapIcon size={10} />
                                {result?.city} - {result?.district}
                            </p>
                        </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                {result && (
                <div className="overflow-y-auto p-4 pb-8 custom-scrollbar">
                     {/* Key Stats Grid */}
                     <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-gray-50 rounded-[12px] p-2 text-center border border-gray-100">
                          <span className="text-[9px] text-muted block mb-0.5">رقم القطعة</span>
                          <span className="text-[13px] font-extrabold text-brand">{result.plotNumber}</span>
                        </div>
                        <div className="bg-gray-50 rounded-[12px] p-2 text-center border border-gray-100">
                          <span className="text-[9px] text-muted block mb-0.5">رقم المخطط</span>
                          <span className="text-[13px] font-extrabold text-brand">{result.planNumber}</span>
                        </div>
                        <div className="bg-gray-50 rounded-[12px] p-2 text-center border border-gray-100">
                          <span className="text-[9px] text-muted block mb-0.5">المساحة</span>
                          <span className="text-[13px] font-extrabold text-brand dir-ltr">{result.area} <span className="text-[9px]">م²</span></span>
                        </div>
                     </div>

                     {/* Borders & Streets */}
                     <div className="mb-4">
                       <h4 className="text-[11px] font-bold text-brand mb-2 flex items-center gap-1">
                         <Ruler size={12} className="text-gold" />
                         الحدود والأطوال
                       </h4>
                       <div className="border border-gray-100 rounded-[12px] overflow-hidden text-[10px]">
                         {result.borders.map((b, i) => (
                           <div key={i} className="flex border-b border-gray-100 last:border-0">
                             <div className="w-14 bg-gray-50 p-2 font-bold text-muted border-l border-gray-100 flex items-center justify-center">{b.dir}</div>
                             <div className="flex-1 p-2 text-brand font-medium flex justify-between items-center">
                                <span>{b.neighbor}</span>
                                <span className="bg-[#FFFBF2] px-1.5 py-0.5 rounded text-gold border border-gold/20">{b.len}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>

                     {/* Valuation Box */}
                     <div className="relative rounded-[16px] overflow-hidden mb-4 p-4 text-white shadow-lg group">
                       <div className="absolute inset-0 bg-gradient-to-br from-brand via-[#3B0E49] to-brand transition-transform duration-1000 group-hover:scale-105"></div>
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                       
                       <div className="relative z-10">
                         <div className="flex justify-between items-start mb-3">
                           <div>
                              <div className="text-[10px] opacity-80 mb-0.5">القيمة السوقية التقديرية</div>
                              <div className="text-[22px] font-extrabold tracking-tight tabular-nums">
                                {result.valuation.totalValue.toLocaleString()} <span className="text-[10px] font-normal">ريال</span>
                              </div>
                           </div>
                           {result.valuation.trend === 'up' && (
                               <span className="bg-green-500/20 border border-green-400/30 text-green-100 px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                                  سعر مرتفع
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                               </span>
                           )}
                         </div>
                         
                         <div className="h-px bg-white/10 my-2"></div>
                         
                         <div className="flex justify-between items-center text-[10px] opacity-90">
                           <span>سعر المتر: <strong>{result.valuation.pricePerMeter} ريال</strong></span>
                           <span>آخر تحديث: {result.valuation.lastUpdate}</span>
                         </div>
                       </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-2">
                        <Button 
                            onClick={handleGenerateReport} 
                            disabled={isGeneratingFile}
                            className={`flex-1 h-10 text-[12px] gap-2 shadow-md ${isGeneratingFile ? 'bg-gray-100 text-muted border-gray-200' : 'bg-gold-gradient text-brand'}`}
                        >
                            {isGeneratingFile ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>جاري الإعداد...</span>
                            </>
                            ) : (
                            <>
                                <FileText size={14} />
                                <span>إصدار ملف الأرض (PDF)</span>
                            </>
                            )}
                        </Button>
                        
                        <a href="https://map.earthapp.com.sa" target="_blank" rel="noopener noreferrer" className="block">
                            <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 text-muted hover:text-brand hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                <ExternalLink size={16} />
                            </button>
                        </a>
                     </div>
                </div>
                )}
            </div>
        </div>

        {/* Info Legend (Bottom Left) */}
        <div className={`absolute bottom-4 left-4 z-20 transition-opacity duration-300 ${result ? 'opacity-0' : 'opacity-100'}`}>
           <div className="bg-white/90 backdrop-blur-md rounded-[12px] shadow-md p-2.5 text-[9px] text-muted border border-gold/20">
             <div className="flex items-center gap-2 mb-1.5">
               <span className="w-2.5 h-2.5 rounded bg-red-500/80 border border-red-600 shadow-[0_0_5px_rgba(239,68,68,0.4)]"></span>
               <span>تجاري</span>
             </div>
             <div className="flex items-center gap-2 mb-1.5">
               <span className="w-2.5 h-2.5 rounded bg-blue-500/80 border border-blue-600 shadow-[0_0_5px_rgba(59,130,246,0.4)]"></span>
               <span>سكني</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded bg-green-500/80 border border-green-600 shadow-[0_0_5px_rgba(34,197,94,0.4)]"></span>
               <span>زراعي</span>
             </div>
           </div>
        </div>

      </div>
    </Section>
  );
};

export default RealEstateMap;