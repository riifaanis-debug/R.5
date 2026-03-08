
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Calculator from './components/Calculator';
import Performance from './components/Performance';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import WaiveServices from './components/WaiveServices';
import Services from './components/Services';
import BackToTop from './components/BackToTop';
import { Section, SectionHeader, Card, Button, StripContainer } from './components/Shared';
import { Check, Scale, MessageCircle, Lock, Monitor, FileText, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { Terms, Privacy, Complaints, Contact, AboutPage, GoalPage, VisionPage, MessagePage, MissionPage, ServicesPage, AcceptableUse, CookiePolicy, IntellectualProperty } from './components/StaticPages';
import { ServiceDetailPage } from './components/ServiceDetailPage';
import WaiveRequestForm from './components/WaiveRequestForm';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ContractPage from './components/ContractPage';
import ClientCard from './components/ClientCard';

// Sub-components for long text sections
const StorySection = () => {
  const { t, direction } = useLanguage();
  return (
    <Section id="story">
      <Card className="bg-story-gradient dark:bg-none dark:bg-[#1a0520] border-gold/90 shadow-xl">
        <h2 className={`text-xl font-bold text-brand dark:text-gold mb-2 ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-colors tracking-tight`}>{t('story_title')}</h2>
        <div className={`space-y-3 text-sm leading-relaxed text-muted dark:text-gray-300 ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-colors`}>
          <p>{t('story_p1')}</p>
          <p>{t('story_p2')}</p>
          <p>{t('story_p3')}</p>
        </div>
      </Card>
    </Section>
  );
};

const WhySection = () => {
  const { t } = useLanguage();
  return (
    <Section id="why-rv">
      <Card>
        <SectionHeader 
          eyebrow={t('why_eyebrow')} 
          title={t('why_title')} 
          subtitle={t('why_subtitle')}
        />
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { icon: <Check size={14} />, title: t('why_1_title'), text: t('why_1_text') },
            { icon: <Scale size={14} />, title: t('why_2_title'), text: t('why_2_text') },
            { icon: <MessageCircle size={14} />, title: t('why_3_title'), text: t('why_3_text') },
            { icon: <Lock size={14} />, title: t('why_4_title'), text: t('why_4_text') }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-white to-[#F6F0E4] border border-gold/70 flex items-center justify-center text-gold shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-brand dark:text-gray-100 mb-0.5 transition-colors">{item.title}</div>
                <div className="text-xs text-muted dark:text-gray-400 transition-colors">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
};

const HowItWorksSection = () => {
  const { t, direction } = useLanguage();

  const steps = [
    { 
      title: t('step_1_title'), 
      text: t('step_1_text'),
      icon: "01"
    },
    { 
      title: t('step_2_title'), 
      text: t('step_2_text'),
      icon: "02"
    },
    { 
      title: t('step_3_title'), 
      text: t('step_3_text'),
      icon: "03"
    },
    { 
      title: t('step_4_title'), 
      text: t('step_4_text'),
      icon: "04"
    },
  ];

  return (
    <Section id="how-it-works">
      <Card className="bg-white dark:bg-[#1a0520] border-gold/30 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>

        <SectionHeader 
          eyebrow={t('how_eyebrow')} 
          title={t('how_title')} 
          subtitle={t('how_subtitle')}
        />
        
        <div className="mt-8 space-y-8 relative">
          {/* Vertical Connecting Line */}
          <div className={`absolute top-0 bottom-0 ${direction === 'rtl' ? 'right-[23px]' : 'left-[23px]'} w-[1px] bg-gradient-to-b from-gold/50 via-gold/20 to-transparent hidden md:block`}></div>

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col md:flex-row gap-6 ${direction === 'rtl' ? 'md:pr-12' : 'md:pl-12'}`}
            >
              {/* Step Number Circle */}
              <div className={`absolute top-0 ${direction === 'rtl' ? 'right-0' : 'left-0'} w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-[#22042C] border border-gold/30 flex items-center justify-center text-gold font-black text-lg shadow-lg z-10 hidden md:flex`}>
                {step.icon}
              </div>

              {/* Mobile Step Header */}
              <div className="flex items-center gap-4 md:hidden mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand border border-gold/30 flex items-center justify-center text-gold font-black text-sm shrink-0">
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-brand dark:text-gold tracking-tight">{step.title}</h3>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-brand dark:text-gold mb-3 hidden md:block tracking-tight">{step.title}</h3>
                <div className="bg-page dark:bg-white/5 p-5 rounded-2xl border border-gold/10 hover:border-gold/30 transition-all duration-300 group">
                  <p className="text-sm text-muted dark:text-gray-300 leading-relaxed transition-colors group-hover:text-brand dark:group-hover:text-white">
                    {step.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </Section>
  );
};

const AudienceSection = () => {
  const { t, direction } = useLanguage();
  const audienceItems = [
    { tag: t('aud_1_tag'), title: t('aud_1_title'), text: t('aud_1_text') },
    { tag: t('aud_2_tag'), title: t('aud_2_title'), text: t('aud_2_text') },
    { tag: t('aud_3_tag'), title: t('aud_3_title'), text: t('aud_3_text') },
  ];

  const [isPaused, setIsPaused] = useState(false);

  return (
    <Section id="audience">
      <Card className="overflow-hidden">
        <SectionHeader 
          eyebrow={t('aud_eyebrow')} 
          title={t('aud_title')} 
          subtitle={t('aud_subtitle')}
        />
        <div 
          className="relative w-full overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div 
            className="flex gap-4"
            animate={isPaused ? {} : {
              x: direction === 'rtl' ? ["50%", "0%"] : ["0%", "-50%"],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25,
                ease: "linear",
              },
            }}
            style={{ width: 'max-content' }}
          >
            {/* Duplicate items for seamless loop */}
            {[...audienceItems, ...audienceItems].map((item, i) => (
              <div key={i} className="min-w-[210px] max-w-[210px] bg-white dark:bg-[#12031a] rounded-[18px] border border-gold/70 dark:border-white/10 p-3 shadow-sm transition-colors">
                <div className="text-[11px] text-gold mb-1">{item.tag}</div>
                <div className="text-[13px] font-extrabold text-brand dark:text-gray-100 mb-1 transition-colors">{item.title}</div>
                <div className="text-[12px] text-muted dark:text-gray-400 transition-colors">{item.text}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </Card>
    </Section>
  );
};

const CTASection = () => {
  const { t } = useLanguage();
  return (
    <Section id="cta-block">
      <Card className="bg-gradient-to-br from-[#FFFDF5] to-[#F6ECD4] dark:from-[#1a0b25] dark:to-[#0f0216] border-gold/90 shadow-xl">
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="text-[14px] font-extrabold text-brand dark:text-gold transition-colors">{t('cta_title')}</div>
            <div className="text-[12px] text-muted dark:text-gray-300 mt-1 transition-colors">{t('cta_text')}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="https://wa.me/966125911227" target="_blank" rel="noopener noreferrer">
              <Button>{t('cta_whatsapp')}</Button>
            </a>
            <a href="#/services" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">{t('cta_all_services')}</Button>
            </a>
          </div>
        </div>
      </Card>
    </Section>
  );
};

const PlatformSection = () => {
  const { t } = useLanguage();
  return (
    <Section id="platform">
      <Card>
        <SectionHeader 
          eyebrow={t('plat_eyebrow')} 
          title={t('plat_title')} 
          subtitle={t('plat_subtitle')}
        />
        <div className="grid grid-cols-1 gap-2">
          {[
            { icon: <FileText size={16} />, title: t('plat_1_title'), text: t('plat_1_text') },
            { icon: <Monitor size={16} />, title: t('plat_2_title'), text: t('plat_2_text') },
            { icon: <Bell size={16} />, title: t('plat_3_title'), text: t('plat_3_text') },
          ].map((item, i) => (
            <div key={i} className="rounded-[14px] bg-white dark:bg-[#12031a] border border-gold/50 dark:border-white/10 p-2.5 flex items-start gap-2 transition-colors">
              <div className="text-gold pt-0.5">{item.icon}</div>
              <div>
                <div className="text-[13px] font-extrabold text-brand dark:text-gray-100 mb-0.5 transition-colors">{item.title}</div>
                <div className="text-[12px] text-muted dark:text-gray-400 transition-colors">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
};

const TimelineSection = () => {
  const { t, direction } = useLanguage();
  return (
    <Section id="timeline">
      <Card>
        <SectionHeader eyebrow={t('time_eyebrow')} title={t('time_title')} />
        <div className={`relative flex flex-col gap-2 ${direction === 'rtl' ? 'pr-2' : 'pl-2'}`}>
          {/* Vertical Line */}
          <div className={`absolute top-1 ${direction === 'rtl' ? 'right-[11px]' : 'left-[11px]'} w-[2px] h-full bg-gold/50`} />
          
          {[
            { title: t('time_1_title'), text: t('time_1_text') },
            { title: t('time_2_title'), text: t('time_2_text') },
            { title: t('time_3_title'), text: t('time_3_text') },
            { title: t('time_4_title'), text: t('time_4_text') },
          ].map((item, i) => (
            <div key={i} className={`relative ${direction === 'rtl' ? 'pr-6' : 'pl-6'}`}>
              <div className={`w-[10px] h-[10px] rounded-full bg-gold absolute ${direction === 'rtl' ? 'right-[7px]' : 'left-[7px]'} top-[5px] shadow-[0_0_0_4px_rgba(199,169,105,0.25)] z-10`} />
              <div className="text-[13px] font-extrabold text-brand dark:text-gray-100 mb-0.5 transition-colors">{item.title}</div>
              <div className="text-[12px] text-muted dark:text-gray-400 transition-colors">{item.text}</div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
};

const LandingPage: React.FC = () => (
  <>
    <Header />
    <Hero />
    <div className="relative mt-10 z-10">
      <About />
      <StorySection />
      <WhySection />
      <Services />
      <Performance />
      <HowItWorksSection />
      <Calculator />
      <AudienceSection />
      <WaiveServices />
      <FAQ />
      <CTASection />
      <TimelineSection />
      <Footer />
    </div>
    <BackToTop />
  </>
);

const WaiveLandingPage: React.FC = () => (
  <>
    <Header />
    <Hero />
    <div className="relative mt-10 z-10">
      <About />
      <StorySection />
      <WhySection />
      <Services />
      <Performance />
      <HowItWorksSection />
      <WaiveServices />
      <FAQ />
      <TimelineSection />
      <Footer />
    </div>
    <BackToTop />
  </>
);

const AppContent: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [showAuth, setShowAuth] = useState(false);
  const [waivePrefill, setWaivePrefill] = useState<any>(null);
  const [showWaiveForm, setShowWaiveForm] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle Login Button Click from Header (via event or prop)
  useEffect(() => {
    const handleOpenAuth = () => setShowAuth(true);
    const handleOpenWaiveForm = (e: any) => {
      setWaivePrefill(e.detail);
      setShowWaiveForm(true);
    };
    window.addEventListener('open-auth', handleOpenAuth);
    window.addEventListener('open-waive-form', handleOpenWaiveForm);
    return () => {
      window.removeEventListener('open-auth', handleOpenAuth);
      window.removeEventListener('open-waive-form', handleOpenWaiveForm);
    };
  }, []);

  const getComponent = () => {
    if (route.startsWith('#/service/')) {
      const fullType = route.replace('#/service/', '');
      const [type, subType] = fullType.split('/');
      return <ServiceDetailPage type={type} subType={subType} />;
    }

    if (route.startsWith('#/contract/')) {
      const submissionId = route.replace('#/contract/', '');
      return user ? (
        <ContractPage 
          submissionId={submissionId} 
          onClose={() => window.location.hash = '#/dashboard'} 
        />
      ) : <LandingPage />;
    }

    switch(route) {
      case '#/services': return <ServicesPage />;
      case '#/terms': return <Terms />;
      case '#/privacy': return <Privacy />;
      case '#/complaints': return <Complaints />;
      case '#/contact': return <Contact />;
      case '#/about': return <AboutPage />;
      case '#/goal': return <GoalPage />;
      case '#/vision': return <VisionPage />;
      case '#/message': return <MessagePage />;
      case '#/mission': return <MissionPage />;
      case '#/acceptable-use': return <AcceptableUse />;
      case '#/cookies': return <CookiePolicy />;
      case '#/intellectual-property': return <IntellectualProperty />;
      case '#/waive-landing': return <WaiveLandingPage />;
      case '#/client-card': return <ClientCard />;
      case '#/admin': return user?.role === 'admin' ? (
        <AdminDashboard 
          onClose={() => window.location.hash = '#/'}
          onLogout={logout}
        />
      ) : <LandingPage />;
      case '#/dashboard': return user ? (
        <CustomerDashboard 
          user={{
            id: user.id,
            fullName: '',
            email: '',
            nationalId: user.national_id || '',
            mobile: user.phone || '',
            joinDate: new Date().toISOString()
          }} 
          onClose={() => window.location.hash = '#/'}
          onLogout={logout}
        />
      ) : <LandingPage />;
      default: return <LandingPage />;
    }
  };

  return (
    <main className="w-full max-w-full overflow-x-hidden mx-auto min-h-screen bg-page dark:bg-[#06010a] transition-colors duration-300">
      {getComponent()}
      {showAuth && !user && <AuthPage onClose={() => setShowAuth(false)} />}
      {showWaiveForm && (
        <WaiveRequestForm 
          prefill={waivePrefill} 
          onClose={() => {
            setShowWaiveForm(false);
            setWaivePrefill(null);
          }} 
        />
      )}
    </main>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
