
import React, { useEffect } from 'react';
import { 
  ArrowRight, Phone, Mail, MapPin, Send, ShieldCheck, FileText, 
  AlertCircle, ArrowLeft, Home, Banknote, Scale, Building2, 
  Receipt, BarChart3, MessageSquare, Briefcase, ChevronLeft, RefreshCw,
  CheckCircle
} from 'lucide-react';
import { Button, Card, SectionHeader } from './Shared';
import Footer from './Footer';
import Calculator from './Calculator';
import Logo from './Logo';
import { safeStringify } from '../src/utils/safeJson';

// Layout Wrapper
export const PageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflowX = 'hidden';
    document.body.style.position = 'relative';
  }, []);

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = '#/';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F4FA] dark:bg-[#06010a] flex flex-col transition-colors duration-300 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#12031a] border-b border-gold/20 p-4 sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-[520px] mx-auto flex justify-between items-center px-2">
          <button 
            onClick={handleGoHome}
            className="flex items-center gap-2 text-[12px] font-bold text-brand dark:text-gold hover:text-gold transition-colors"
          >
            <ArrowRight size={18} />
            العودة للرئيسية
          </button>
          <Logo className="w-[120px] h-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-[520px] mx-auto p-4 py-8 overflow-x-hidden">
        <h1 className="text-[22px] font-extrabold text-brand dark:text-white mb-6 border-r-4 border-gold pr-3 leading-tight">
          {title}
        </h1>
        <div className="w-full">
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Main Services Directory Page
export const ServicesPage: React.FC = () => {
  const allServices = [
    { id: 'debt_solutions', name: 'حلول المديونيات', desc: 'جدولة الديون، توحيد الالتزامات، ومعالجة التعثرات.', icon: <RefreshCw className="text-gold" size={24} /> },
    { id: 'banking', name: 'الخدمات المصرفية', desc: 'تنظيم الحسابات والتعاملات البنكية الرقمية.', icon: <Building2 className="text-gold" size={24} /> },
    { id: 'legal', name: 'الخدمات القضائية والعدلية', desc: 'تمثيل قانوني ومعالجة طلبات التنفيذ.', icon: <Scale className="text-gold" size={24} /> },
    { id: 'realestate', name: 'الخدمات العقارية', desc: 'تقييم، توثيق، ووساطة عقارية احترافية.', icon: <Home className="text-gold" size={24} /> },
    { id: 'credit', name: 'الخدمات الائتمانية', desc: 'تصحيح السجل الائتماني وتحسين تقييم سمة.', icon: <BarChart3 className="text-gold" size={24} /> },
    { id: 'consulting', name: 'الخدمات الاستشارية', desc: 'استشارات مالية وائتمانية لإدارة الديون.', icon: <MessageSquare className="text-gold" size={24} /> },
    { id: 'zakat', name: 'الخدمات الزكوية والضريبية', desc: 'الامتثال الضريبي وإعداد الإقرارات للمنشآت.', icon: <Receipt className="text-gold" size={24} /> },
    { id: 'waive-landing', name: 'خدمات الإعفاء من المديونية', desc: 'دراسة طلبات الإعفاء من الالتزامات المالية وفق الضوابط.', icon: <ShieldCheck className="text-gold" size={24} />, isWaive: true },
  ];

  return (
    <PageLayout title="دليل الخدمات">
      <div className="grid grid-cols-1 gap-4">
        {allServices.map((service) => (
          <a 
            key={service.id} 
            href={service.isWaive ? '#/waive-landing' : `#/service/${service.id}`}
            className="group block bg-white dark:bg-[#1a0b25] p-5 rounded-[24px] border border-gold/20 shadow-sm hover:border-gold hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-extrabold text-brand dark:text-white group-hover:text-gold transition-colors">{service.name}</h3>
                <p className="text-[12px] text-muted dark:text-gray-400 mt-1">{service.desc}</p>
              </div>
              <ChevronLeft size={18} className="text-gold opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-brand rounded-[24px] text-center text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gold/5 pointer-events-none" />
         <h4 className="text-[16px] font-extrabold text-gold mb-2">تواصل معنا الآن</h4>
         <p className="text-[12px] opacity-80 mb-4 px-4">فريقنا متاح للإجابة على جميع استفساراتك المالية.</p>
         <a href="#/contact">
           <Button className="w-full h-11 bg-white text-brand hover:bg-gold transition-colors">اتصل بنا</Button>
         </a>
      </div>
    </PageLayout>
  );
};

export const Terms: React.FC = () => (
  <PageLayout title="الشروط والأحكام">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <div className="space-y-6 text-[13px] leading-7 text-muted dark:text-gray-300 text-justify">
        <p>أهلاً بك في منصة ريفانس المالية. يرجى قراءة الشروط والأحكام التالية بعناية قبل استخدام خدماتنا.</p>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">1. قبول الشروط</h3>
          <p>بمجرد استخدامك للمنصة أو طلب أي من خدماتنا، فإنك توافق على الالتزام بهذه الشروط وجميع القوانين واللوائح المعمول بها في المملكة العربية السعودية.</p>
        </div>
      </div>
    </div>
  </PageLayout>
);

export const Privacy: React.FC = () => (
  <PageLayout title="سياسة الخصوصية">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <div className="space-y-6 text-[13px] leading-7 text-muted dark:text-gray-300 text-justify">
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 mb-4">
          <ShieldCheck size={20} />
          <span className="font-bold">نلتزم بأعلى معايير حماية البيانات وفق أنظمة الأمن السيبراني السعودية.</span>
        </div>
        <p>تستخدم بياناتك حصراً لغرض دراسة أهليتك التمويلية والتواصل مع الجهات التمويلية نيابة عنك.</p>
      </div>
    </div>
  </PageLayout>
);

export const Complaints: React.FC = () => (
  <PageLayout title="الشكاوي والاقتراحات">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <div className="space-y-4">
        <p className="text-[13px] text-muted dark:text-gray-300 leading-7">
          نحرص دائماً على رضاكم. سيتم التعامل مع طلبك بكل جدية وسرية.
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-4 rounded-[14px] border border-gray-100 dark:border-white/10">
            <Mail className="text-gold" size={20} />
            <div className="text-[13px] font-bold text-brand dark:text-white">complaints@rifanss.com</div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);

export const Contact: React.FC = () => {
  const [formData, setFormData] = React.useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify(formData)
      });
      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ في الاتصال.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="اتصل بنا">
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-2 gap-4">
          <a href="tel:966125911227" className="bg-white dark:bg-[#1a0b25] p-5 rounded-[24px] border border-gold/20 shadow-sm flex flex-col items-center gap-2 hover:border-gold transition-all">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <Phone size={20} />
            </div>
            <div className="text-[13px] font-bold text-brand dark:text-white">012 591 1227</div>
          </a>
          <a href="mailto:r.iifaanis@gmail.com" className="bg-white dark:bg-[#1a0b25] p-5 rounded-[24px] border border-gold/20 shadow-sm flex flex-col items-center gap-2 hover:border-gold transition-all">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <Mail size={20} />
            </div>
            <div className="text-[13px] font-bold text-brand dark:text-white">r.iifaanis@gmail.com</div>
          </a>
        </div>

        <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
          <h3 className="text-[15px] font-extrabold text-brand dark:text-gold mb-4 flex items-center gap-2">
            <Send size={18} />
            أرسل لنا رسالة
          </h3>
          
          {isSuccess ? (
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center animate-in zoom-in duration-300">
               <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
               <p className="text-[13px] font-bold text-green-800">تم إرسال رسالتك بنجاح!</p>
               <p className="text-[11px] text-green-600 mt-1">سنتواصل معك في أقرب وقت ممكن.</p>
               <button onClick={() => setIsSuccess(false)} className="mt-4 text-[11px] font-bold text-brand underline">إرسال رسالة أخرى</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5">الاسم الكامل</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 rounded-[12px] border border-gold/20 text-[13px] focus:border-gold outline-none bg-gray-50 dark:bg-white/5" 
                  placeholder="أدخل اسمك"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2.5 rounded-[12px] border border-gold/20 text-[13px] focus:border-gold outline-none bg-gray-50 dark:bg-white/5" 
                  placeholder="example@mail.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5">الموضوع</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2.5 rounded-[12px] border border-gold/20 text-[13px] focus:border-gold outline-none bg-gray-50 dark:bg-white/5" 
                  placeholder="عنوان الرسالة"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1.5">الرسالة</label>
                <textarea 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full p-2.5 rounded-[12px] border border-gold/20 text-[13px] focus:border-gold outline-none bg-gray-50 dark:bg-white/5 min-h-[100px]" 
                  placeholder="كيف يمكننا مساعدتك؟"
                ></textarea>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-gold-gradient text-brand font-bold shadow-lg">
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export const AboutPage: React.FC = () => (
  <PageLayout title="من نحن">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <p className="text-[13px] leading-7 text-muted dark:text-gray-300">ريفانس المالية منصة إلكترونية رائدة تقدّم خدمات مالية رقمية واستشارية.</p>
    </div>
  </PageLayout>
);

export const GoalPage: React.FC = () => (
  <PageLayout title="هدفنا">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <p className="text-[13px] leading-7 text-muted dark:text-gray-300">إحداث فرق ملموس في حياة عملائنا من خلال حلول مالية واقعية.</p>
    </div>
  </PageLayout>
);

export const VisionPage: React.FC = () => (
  <PageLayout title="رؤيتنا">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <p className="text-[13px] leading-7 text-muted dark:text-gray-300">أن نصبح العلامة التجارية الأبرز في مجال الحلول التمويلية.</p>
    </div>
  </PageLayout>
);

export const MessagePage: React.FC = () => (
  <PageLayout title="رسالتنا">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <p className="text-[13px] leading-7 text-muted dark:text-gray-300">تمكين الأفراد من مواجهة تحدياتهم المالية بثقة.</p>
    </div>
  </PageLayout>
);

export const MissionPage: React.FC = () => (
  <PageLayout title="مهمتنا">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <p className="text-[13px] leading-7 text-muted dark:text-gray-300">توفير حلول تمويلية مبتكرة لكل عميل بشكل فردي.</p>
    </div>
  </PageLayout>
);

export const AcceptableUse: React.FC = () => (
  <PageLayout title="سياسة الاستخدام المقبول">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <div className="space-y-6 text-[13px] leading-7 text-muted dark:text-gray-300 text-justify">
        <p>تحدد هذه السياسة المعايير التي يجب الالتزام بها عند استخدام منصة ريفانس المالية.</p>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">1. السلوكيات المحظورة</h3>
          <p>يُحظر استخدام المنصة لأي غرض غير قانوني، أو محاولة اختراق الأنظمة، أو نشر محتوى مضلل أو ضار.</p>
        </div>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">2. حماية الأنظمة</h3>
          <p>يجب عدم القيام بأي نشاط يؤدي إلى تعطيل أو إثقال كاهل البنية التحتية للمنصة.</p>
        </div>
      </div>
    </div>
  </PageLayout>
);

export const CookiePolicy: React.FC = () => (
  <PageLayout title="سياسة ملفات تعريف الارتباط">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <div className="space-y-6 text-[13px] leading-7 text-muted dark:text-gray-300 text-justify">
        <p>نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وتحليل حركة المرور على الموقع.</p>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">1. أنواع ملفات تعريف الارتباط</h3>
          <p>نستخدم ملفات تعريف ارتباط ضرورية لتشغيل الموقع، وملفات تحليلية لفهم كيفية تفاعل المستخدمين مع المحتوى.</p>
        </div>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">2. التحكم في ملفات تعريف الارتباط</h3>
          <p>يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك، ولكن قد يؤثر ذلك على وظائف معينة في الموقع.</p>
        </div>
      </div>
    </div>
  </PageLayout>
);

export const IntellectualProperty: React.FC = () => (
  <PageLayout title="سياسة الملكية الفكرية">
    <div className="bg-white dark:bg-[#1a0b25] rounded-[24px] p-6 border border-gold/30 shadow-sm">
      <div className="space-y-6 text-[13px] leading-7 text-muted dark:text-gray-300 text-justify">
        <p>جميع المحتويات الموجودة على منصة ريفانس المالية محمية بموجب قوانين الملكية الفكرية.</p>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">1. حقوق المحتوى</h3>
          <p>العلامات التجارية، النصوص، الصور، والبرمجيات هي ملكية خاصة لريفانس المالية ولا يجوز استخدامها دون إذن كتابي مسبق.</p>
        </div>
        <div>
          <h3 className="font-bold text-brand dark:text-gold mb-2">2. الإبلاغ عن الانتهاكات</h3>
          <p>إذا كنت تعتقد أن أي محتوى على موقعنا ينتهك حقوق الملكية الفكرية الخاصة بك، يرجى التواصل معنا فوراً.</p>
        </div>
      </div>
    </div>
  </PageLayout>
);
