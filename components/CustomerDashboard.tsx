import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, CustomerRequest, UserProduct, UserDocument } from '../types';
import { X, User, Phone, CreditCard, LogOut, FileText, Clock, Briefcase, Edit, CheckCircle2, AlertTriangle, MapPin, Building2, Wallet, Plus, Trash2, FolderOpen, Upload, Paperclip, QrCode, Loader2, ArrowRight, Bell, PenTool, UserPlus } from 'lucide-react';
import { Button } from './Shared';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { safeStringify } from '../src/utils/safeJson';

interface CustomerDashboardProps {
  user: UserProfile;
  onClose: () => void;
  onLogout: () => void;
}

// Constants for dropdowns (Shared with Waive Form concept)
const REGION_CITIES: Record<string, string[]> = {
  "الرياض": ["الرياض","الدرعية","الخرج","الدوادمي","المجمعة","القويعية","وادي الدواسر","الزلفي","شقراء","حوطة بني تميم","الأفلاج","السليل","ضرما","المزاحمية"],
  "مكة المكرمة": ["مكة المكرمة","جدة","الطائف","رابغ","خليص","الليث","القنفذة","العرضيات","الكامل"],
  "المدينة": ["المدينة المنورة","ينبع","العلا","بدر","الحناكية","خيبر"],
  "القصيم": ["بريدة","عنيزة","الرس","البكيرية","البدائع","المذنب","عيون الجواء","رياض الخبراء"],
  "الشرقية": ["الدمام","الخبر","الظهران","القطيف","الأحساء","الجبيل","الخفجي","حفر الباطن","بقيق","رأس تنورة"],
  "عسير": ["أبها","خميس مشيط","بيشة","محايل عسير","النماص","رجال ألمع"],
  "تبوك": ["تبوك","الوجه","ضباء","تيماء","أملج","حقل"],
  "حائل": ["حائل","بقعاء","الغزالة","الشنان"],
  "الحدود الشمالية": ["عرعر","رفحاء","طريف","العويقلية"],
  "جازان": ["جيزان","صبيا","أبو عريش","صامطة","بيش","الدرب"],
  "نجران": ["نجران","شرورة","حبونا","بدر الجنوب"],
  "الباحة": ["الباحة","بلجرشي","المندق","المخواة"],
  "الجوف": ["سكاكا","القريات","دومة الجندل","طبرجل"]
};

const BANKS = [
  "البنك الأهلي السعودي (SNB)", "مصرف الراجحي", "بنك الرياض", 
  "البنك السعودي البريطاني (ساب)", "البنك السعودي الفرنسي", "بنك البلاد", 
  "بنك الجزيرة", "بنك الإنماء", "بنك الخليج الدولي - السعودية", "جهة تمويلية أخرى"
];

const DOCUMENT_TYPES = [
  "تقرير طبي",
  "قرار انهاء الخدمة",
  "مشهد تقييم إعاقة",
  "مشهد ضمان اجتماعي",
  "قرار الهيئة الطبية",
  "قرار طبي",
  "مستندات اخرى"
];

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onClose, onLogout }) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'contracts' | 'notifications'>('profile');
  const [userData, setUserData] = useState<UserProfile>(user);
  const [requests, setRequests] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  const generateFileNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `RF-${datePart}-${randomPart}`;
  };
  
  // Document Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [showRequestTypeSelector, setShowRequestTypeSelector] = useState(false);

  useEffect(() => {
    if (authUser) {
      fetchData();
      fetchNotifications();
      fetchContracts();
    }

    const handleRefresh = () => {
      fetchData();
      fetchNotifications();
      fetchContracts();
    };
    window.addEventListener('request-submitted', handleRefresh);
    window.addEventListener('signature-submitted', handleRefresh);
    return () => {
      window.removeEventListener('request-submitted', handleRefresh);
      window.removeEventListener('signature-submitted', handleRefresh);
    };
  }, [authUser]);

  const fetchData = async () => {
    if (!authUser) return;
    try {
      setIsLoading(true);
      
      // Fetch user requests from API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/my-submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }

      // Load profile from localStorage (profile is still local for now as per current structure)
      const savedProfile = localStorage.getItem(`profile_${authUser.id}`);
      let currentProfile: UserProfile;
      
      const authNationalId = authUser.nationalId || authUser.national_id || '';
      let authMobile = authUser.mobile || authUser.phone || '';
      
      // Convert +9665... to 05...
      if (authMobile.startsWith('+966')) {
        authMobile = '0' + authMobile.substring(4);
      } else if (authMobile.startsWith('966')) {
        authMobile = '0' + authMobile.substring(3);
      } else if (authMobile.startsWith('5') && authMobile.length === 9) {
        authMobile = '0' + authMobile;
      }

      if (savedProfile) {
        currentProfile = JSON.parse(savedProfile);
      } else {
        currentProfile = { ...user };
      }

      // Pre-fill from auth data - ALWAYS sync these two fields
      currentProfile.nationalId = authNationalId;
      currentProfile.mobile = authMobile;
      
      setUserData(currentProfile);
      
      if (authUser.role !== 'admin' && (!currentProfile.fullName || currentProfile.fullName === '')) {
        setShowCompleteProfile(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!authUser) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContracts = async () => {
    if (!authUser) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/my-contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // For now, we'll just update locally and could call an API if implemented
      const updatedNotifications = notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n);
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!authUser) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: 1 }));
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const onlyNumbers = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete') {
      e.preventDefault();
    }
  };

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setUserData({...userData, mobile: cleaned});
    setProfileError('');
  };

  const handleSaveProfile = () => {
    setProfileError('');
    
    // Validate required fields
    if (!userData.firstName || !userData.middleName || !userData.lastName || !userData.region || !userData.city || !userData.jobStatus || !userData.bank || !userData.mobile) {
      setProfileError('يرجى إكمال جميع الحقول المطلوبة المميزة بعلامة (*)');
      return;
    }

    if (!userData.mobile || !/^05[0-9]{8}$/.test(userData.mobile)) {
      setProfileError('رقم الجوال يجب أن يتكون من 10 أرقام ويبدأ بـ 05');
      return;
    }

    // Update fullName
    const fullName = `${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim();

    let fileNumber = userData.fileNumber;
    if (!fileNumber || fileNumber === 'RF-####-####') {
      fileNumber = generateFileNumber();
    }
    const updatedData = { ...userData, fullName, fileNumber };
    localStorage.setItem(`profile_${user.id}`, safeStringify(updatedData));
    setUserData(updatedData);
    setIsEditing(false);
    setShowCompleteProfile(false);
  };

  // Product Management Handlers
  const addProduct = () => {
    setUserData({
      ...userData,
      products: [...(userData.products || []), { id: Date.now(), type: '', amount: '', accountNumber: '' }]
    });
  };

  const removeProduct = (id: number) => {
    setUserData({
      ...userData,
      products: userData.products?.filter(p => p.id !== id)
    });
  };

  const updateProduct = (id: number, field: 'type' | 'amount' | 'accountNumber', value: string) => {
    setUserData({
      ...userData,
      products: userData.products?.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  // Document Management Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedDocType) {
      const file = e.target.files[0];
      const newDoc: UserDocument = {
        id: Date.now(),
        type: selectedDocType,
        fileName: file.name,
        date: new Date().toLocaleDateString('ar-SA')
      };
      
      setUserData({
        ...userData,
        documents: [...(userData.documents || []), newDoc]
      });
      
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedDocType('');
    }
  };

  const removeDocument = (id: number) => {
    setUserData({
      ...userData,
      documents: userData.documents?.filter(d => d.id !== id)
    });
  };

  const handleOpenRequestForm = (type: string) => {
    setShowRequestTypeSelector(false);
    if (type === 'waive_request' || type === 'rescheduling_request') {
      // Dispatch event to open WaiveRequestForm with pre-filled data
      window.dispatchEvent(new CustomEvent('open-waive-form', { 
        detail: { ...userData, requestType: type } 
      }));
    } else if (type === 'consultation_request') {
      // Scroll to calculator or open a specific consultation form
      window.location.hash = '#/calculator';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      executing: 'bg-purple-100 text-purple-700 border-purple-200',
      contract_signature: 'bg-gold/20 text-brand border-gold/30',
      completed: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = {
      pending: 'جديد',
      processing: 'تحت الإجراء',
      executing: 'قيد التنفيذ',
      contract_signature: 'بانتظار التوقيع',
      completed: 'مكتمل',
      rejected: 'مرفوض',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end transition-opacity duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-[450px] h-full bg-[#F9F8FC] dark:bg-[#06010a] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-gold/20">
        
        {/* Complete Profile Popup */}
        {showCompleteProfile && (
          <div className="absolute inset-0 z-[100] bg-brand/90 backdrop-blur-md flex items-center justify-center p-4 text-right overflow-y-auto">
            <div className="bg-white dark:bg-[#12031a] w-full max-w-[340px] rounded-[24px] p-5 shadow-2xl border border-gold/30 animate-in zoom-in-95 duration-300 my-auto">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-gold/20">
                  <UserPlus className="text-gold" size={28} />
                </div>
                <h3 className="text-lg font-bold text-brand dark:text-white">إكمال ملفك الشخصي</h3>
                <p className="text-[10px] text-muted mt-1 leading-relaxed">يرجى تزويدنا ببعض المعلومات الإضافية لنتمكن من خدمتك بشكل أفضل</p>
              </div>

              <div className="space-y-3">
                {profileError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle size={12} />
                    {profileError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">اسم العميل (ثلاثي) <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      placeholder="الأول"
                      value={userData.firstName || ''}
                      onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="الأوسط"
                      value={userData.middleName || ''}
                      onChange={(e) => setUserData({...userData, middleName: e.target.value})}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="الأخير"
                      value={userData.lastName || ''}
                      onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">العمر</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="بالسنوات"
                      onKeyDown={onlyNumbers}
                      value={userData.age || ''}
                      onChange={(e) => setUserData({...userData, age: e.target.value.replace(/\D/g, '')})}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">رقم الهوية</label>
                    <div className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] font-bold text-brand dark:text-white flex items-center justify-center">
                      {userData.nationalId || '—'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">رقم الجوال <span className="text-red-500">*</span></label>
                    <div className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] font-bold tracking-wider text-brand dark:text-white flex items-center justify-center dir-ltr">
                      {userData.mobile || '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">الحالة الوظيفية <span className="text-red-500">*</span></label>
                    <select 
                      value={userData.jobStatus || ''} 
                      onChange={(e) => { setUserData({...userData, jobStatus: e.target.value}); setProfileError(''); }}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                    >
                      <option value="">اختر الحالة</option>
                      <option value="موظف حكومي">موظف حكومي</option>
                      <option value="موظف قطاع خاص">موظف قطاع خاص</option>
                      <option value="متقاعد">متقاعد</option>
                      <option value="لا يوجد عمل">لا يوجد عمل</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">المنطقة <span className="text-red-500">*</span></label>
                    <select 
                      value={userData.region || ''} 
                      onChange={(e) => { setUserData({...userData, region: e.target.value, city: ''}); setProfileError(''); }}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                    >
                      <option value="">اختر</option>
                      {Object.keys(REGION_CITIES).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">المدينة <span className="text-red-500">*</span></label>
                    <select 
                      value={userData.city || ''} 
                      onChange={(e) => { setUserData({...userData, city: e.target.value}); setProfileError(''); }}
                      className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                      disabled={!userData.region}
                    >
                      <option value="">اختر</option>
                      {userData.region && REGION_CITIES[userData.region]?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand dark:text-gold/80 px-1">الجهة المالية <span className="text-red-500">*</span></label>
                  <select 
                    value={userData.bank || ''} 
                    onChange={(e) => { setUserData({...userData, bank: e.target.value}); setProfileError(''); }}
                    className="w-full p-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] focus:border-gold outline-none dark:text-white"
                  >
                    <option value="">اختر البنك أو الجهة التمويلية</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  className="w-full py-3 mt-2 bg-gold text-brand hover:bg-gold/90 border-none text-sm"
                >
                  حفظ ومتابعة
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white dark:bg-[#12031a] p-5 border-b border-gold/10 flex items-center justify-between sticky top-0 z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center border border-gold/20">
                 <User size={20} />
              </div>
              <div>
                 <h2 className="text-[14px] font-bold text-brand dark:text-white">{userData.fullName}</h2>
                 <p className="text-[10px] text-muted">ملف رقم: <span className="font-mono text-gold">{userData.fileNumber || ''}</span></p>
              </div>
           </div>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
             <X size={18} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-1.5 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`flex-1 min-w-[80px] py-2.5 rounded-[12px] text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1
               ${activeTab === 'profile' ? 'bg-brand text-gold shadow-md' : 'bg-white text-muted border border-gray-100 hover:bg-gray-50'}`}
           >
             <User size={14} />
             بياناتي
           </button>
           <button 
             onClick={() => setActiveTab('requests')}
             className={`flex-1 min-w-[80px] py-2.5 rounded-[12px] text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1
               ${activeTab === 'requests' ? 'bg-brand text-gold shadow-md' : 'bg-white text-muted border border-gray-100 hover:bg-gray-50'}`}
           >
             <FileText size={14} />
             طلباتي
           </button>
           <button 
             onClick={() => setActiveTab('contracts')}
             className={`flex-1 min-w-[80px] py-2.5 rounded-[12px] text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1
               ${activeTab === 'contracts' ? 'bg-brand text-gold shadow-md' : 'bg-white text-muted border border-gray-100 hover:bg-gray-50'}`}
           >
             <PenTool size={14} />
             عقودي
           </button>
           <button 
             onClick={() => setActiveTab('notifications')}
             className={`flex-1 min-w-[80px] py-2.5 rounded-[12px] text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 relative
               ${activeTab === 'notifications' ? 'bg-brand text-gold shadow-md' : 'bg-white text-muted border border-gray-100 hover:bg-gray-50'}`}
           >
             <Bell size={14} />
             التنبيهات
             {unreadCount > 0 && (
               <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-white">
                 {unreadCount}
               </span>
             )}
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
           
           {activeTab === 'requests' && (
             <div className="space-y-3">
               {isLoading ? (
                 <div className="flex justify-center py-10">
                   <Loader2 className="animate-spin text-gold" size={32} />
                 </div>
               ) : requests.length > 0 ? (
                 requests.map((req) => (
                   <div key={req.id} className="bg-white dark:bg-[#12031a] p-4 rounded-[16px] border border-gold/20 shadow-sm group hover:border-gold/50 transition-all text-right">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-gold block animate-pulse"></span>
                           <h3 className="text-[13px] font-bold text-brand dark:text-white">
                             {req.type === 'waive_request' ? 'طلب إعفاء' : 
                              req.type === 'rescheduling_request' ? 'إعادة جدولة' : 'طلب استشارة'}
                           </h3>
                         </div>
                         {getStatusBadge(req.status)}
                      </div>
                      <div className="text-[11px] text-muted font-mono mb-2 flex items-center gap-2 justify-end">
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(req.timestamp).toLocaleDateString('ar-SA')}</span>
                        <span className="bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{req.id}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-50 dark:border-white/5 pt-2 mt-2">
                        {req.type === 'waive_request' ? `طلب إعفاء للجهة: ${req.data.bank}` : 
                         req.type === 'rescheduling_request' ? `إعادة جدولة للمنتجات التمويلية - ${req.data.bank}` :
                         `استشارة براتب: ${req.data.salary}`}
                      </p>

                      {req.status === 'contract_signature' && (
                        <div className="mt-3 p-2 bg-brand/5 border border-gold/20 rounded-lg flex items-center justify-between animate-pulse">
                           <span className="text-[10px] font-bold text-brand">العقد جاهز للتوقيع</span>
                           <button 
                              onClick={() => window.location.hash = `#/contract/${req.id}`}
                              className="text-[9px] font-bold text-white bg-brand px-3 py-1 rounded-full hover:bg-brand/90 transition-all shadow-sm"
                           >
                              توقيع الآن
                           </button>
                        </div>
                      )}
                   </div>
                 ))
               ) : (
                 <div className="text-center py-10 text-muted flex flex-col items-center gap-3">
                    <FileText size={40} className="opacity-20" />
                    <p className="text-[12px]">لا توجد طلبات حالياً</p>
                    
                    {!showRequestTypeSelector ? (
                      <Button onClick={() => setShowRequestTypeSelector(true)} className="mt-2">تقديم طلب جديد</Button>
                    ) : (
                      <div className="w-full max-w-[280px] space-y-2 animate-in slide-in-from-bottom-2">
                         <p className="text-[11px] font-bold text-brand mb-2">اختر نوع الطلب:</p>
                         <button 
                           onClick={() => handleOpenRequestForm('waive_request')}
                           className="w-full p-3 bg-white border border-gold/30 rounded-xl text-[12px] font-bold text-brand hover:bg-gold/5 flex items-center justify-between group"
                         >
                           <span>طلب إعفاء من الالتزامات</span>
                           <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                         </button>
                         <button 
                           onClick={() => handleOpenRequestForm('rescheduling_request')}
                           className="w-full p-3 bg-white border border-gold/30 rounded-xl text-[12px] font-bold text-brand hover:bg-gold/5 flex items-center justify-between group"
                         >
                           <span>إعادة جدولة المنتجات التمويلية</span>
                           <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                         </button>
                         <button 
                           onClick={() => handleOpenRequestForm('consultation_request')}
                           className="w-full p-3 bg-white border border-gold/30 rounded-xl text-[12px] font-bold text-brand hover:bg-gold/5 flex items-center justify-between group"
                         >
                           <span>طلب استشارة مالية</span>
                           <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                         </button>
                         <button 
                           onClick={() => setShowRequestTypeSelector(false)}
                           className="text-[11px] text-red-500 font-bold mt-2"
                         >
                           إلغاء
                         </button>
                      </div>
                    )}
                 </div>
               )}

               {/* Always show "New Request" button if not empty and not selecting */}
               {requests.length > 0 && !showRequestTypeSelector && (
                 <div className="mt-6">
                    <Button onClick={() => setShowRequestTypeSelector(true)} className="w-full py-3">تقديم طلب جديد</Button>
                 </div>
               )}
               
               {requests.length > 0 && showRequestTypeSelector && (
                  <div className="mt-6 bg-white dark:bg-[#12031a] p-4 rounded-2xl border border-gold/20 animate-in slide-in-from-bottom-2">
                      <p className="text-[11px] font-bold text-brand dark:text-gold mb-3">اختر نوع الطلب:</p>
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleOpenRequestForm('waive_request')}
                          className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[12px] font-bold text-brand dark:text-white hover:border-gold transition-all text-right flex justify-between items-center"
                        >
                          <span>طلب إعفاء من الالتزامات</span>
                          <ArrowRight size={14} className="rotate-180" />
                        </button>
                        <button 
                          onClick={() => handleOpenRequestForm('rescheduling_request')}
                          className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[12px] font-bold text-brand dark:text-white hover:border-gold transition-all text-right flex justify-between items-center"
                        >
                          <span>إعادة جدولة المنتجات التمويلية</span>
                          <ArrowRight size={14} className="rotate-180" />
                        </button>
                        <button 
                          onClick={() => handleOpenRequestForm('consultation_request')}
                          className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[12px] font-bold text-brand dark:text-white hover:border-gold transition-all text-right flex justify-between items-center"
                        >
                          <span>طلب استشارة مالية</span>
                          <ArrowRight size={14} className="rotate-180" />
                        </button>
                      </div>
                      <button 
                        onClick={() => setShowRequestTypeSelector(false)}
                        className="w-full text-center text-[11px] text-muted mt-3"
                      >
                        إلغاء
                      </button>
                  </div>
               )}

               <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-[12px] border border-blue-100 dark:border-blue-800 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
                      يتم تحديث حالة الطلبات بشكل يومي. في حال وجود استفسار عاجل، يمكنك التواصل مع خدمة العملاء عبر الواتساب.
                    </p>
                  </div>
               </div>
             </div>
           )}

           {activeTab === 'contracts' && (
             <div className="space-y-3">
               <h3 className="text-[13px] font-bold text-brand dark:text-white mb-2 px-1">عقودي الإلكترونية</h3>
               {isLoading ? (
                 <div className="flex justify-center py-10">
                   <Loader2 className="animate-spin text-gold" size={32} />
                 </div>
               ) : contracts.length > 0 ? (
                 contracts.map((contract) => {
                   const req = requests.find(r => r.id === contract.submission_id) || { id: contract.submission_id, status: 'unknown', type: contract.type };
                   return (
                     <div key={contract.id} className="bg-white dark:bg-[#12031a] p-4 rounded-[16px] border border-gold/20 shadow-sm group hover:border-gold/50 transition-all text-right">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                             <PenTool className="text-gold" size={16} />
                             <h3 className="text-[13px] font-bold text-brand dark:text-white">
                               عقد تقديم خدمات رقم {contract.submission_id}
                             </h3>
                           </div>
                           {getStatusBadge(req.status)}
                        </div>
                        <p className="text-[11px] text-muted mb-3">
                          {contract.type === 'waive_request' ? 'طلب إعفاء من الالتزامات' : 
                           contract.type === 'rescheduling_request' ? 'إعادة جدولة المنتجات التمويلية' : 'طلب استشارة مالية'}
                        </p>
                        
                        {req.status === 'contract_signature' ? (
                          <div className="mt-3 p-3 bg-brand/5 border border-gold/20 rounded-xl flex items-center justify-between animate-pulse">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gold rounded-full"></div>
                                <span className="text-[11px] font-bold text-brand">العقد جاهز للتوقيع</span>
                             </div>
                             <button 
                                onClick={() => window.location.hash = `#/contract/${contract.submission_id}`}
                                className="text-[10px] font-bold text-white bg-brand px-4 py-1.5 rounded-full hover:bg-brand/90 transition-all shadow-sm"
                             >
                                توقيع العقد الآن
                             </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              window.location.hash = `#/contract/${contract.submission_id}`;
                            }}
                            className="w-full py-2.5 bg-white text-brand font-bold text-[12px] rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gold/30"
                          >
                            <FileText size={14} />
                            {contract.signed_at ? 'عرض العقد المكتمل' : 'عرض تفاصيل العقد'}
                          </button>
                        )}
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-10 text-muted flex flex-col items-center gap-3">
                    <PenTool size={40} className="opacity-20" />
                    <p className="text-[12px]">لا توجد عقود حالياً</p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'notifications' && (
             <div className="space-y-3">
               <div className="flex justify-between items-center mb-2 px-1">
                 <h3 className="text-[13px] font-bold text-brand dark:text-white">التنبيهات</h3>
                 {unreadCount > 0 && (
                   <button onClick={markAllAsRead} className="text-[10px] text-gold hover:underline">
                     تحديد الكل كمقروء
                   </button>
                 )}
               </div>
               
               {notifications.length > 0 ? (
                 notifications.map((notif) => (
                   <div 
                     key={notif.id} 
                     onClick={() => !notif.is_read && markAsRead(notif.id)}
                     className={`p-4 rounded-[16px] border transition-all text-right cursor-pointer relative
                       ${notif.is_read 
                         ? 'bg-white dark:bg-[#12031a] border-gray-100 dark:border-white/5 opacity-80' 
                         : 'bg-white dark:bg-[#12031a] border-gold/30 shadow-sm ring-1 ring-gold/10'}`}
                   >
                     {!notif.is_read && (
                       <span className="absolute top-4 left-4 w-2 h-2 bg-gold rounded-full"></span>
                     )}
                     <div className="flex items-center gap-2 mb-1">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                         ${notif.type === 'payment_reminder' ? 'bg-red-50 text-red-500' : 
                           notif.type === 'contract_signature' ? 'bg-gold text-white' : 'bg-gold/10 text-gold'}`}>
                         {notif.type === 'payment_reminder' ? <Wallet size={14} /> : 
                          notif.type === 'contract_signature' ? <PenTool size={14} /> : <Bell size={14} />}
                       </div>
                       <h4 className="text-[12px] font-bold text-brand dark:text-white">{notif.title}</h4>
                     </div>
                     <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                       {notif.message}
                     </p>

                      {notif.type === 'contract_signature' && !notif.is_read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `#/contract/${notif.submission_id}`;
                            markAsRead(notif.id);
                          }}
                          className="w-full mt-2 py-2 bg-gold text-brand font-bold text-[11px] rounded-lg shadow-sm hover:bg-gold/90 transition-all flex items-center justify-center gap-2"
                        >
                          <PenTool size={12} />
                          توقيع العقد الآن
                        </button>
                      )}

                     <div className="text-[9px] text-muted flex items-center gap-1 justify-end mt-2">
                       <Clock size={10} />
                       {new Date(notif.created_at).toLocaleString('ar-SA')}
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-10 text-muted flex flex-col items-center gap-3">
                    <Bell size={40} className="opacity-20" />
                    <p className="text-[12px]">لا توجد تنبيهات حالياً</p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'profile' && (
             <div className="space-y-4 pb-10">
               
               {/* Digital ID Card */}
               <div className="mb-6">
                  <div className="relative w-full aspect-[1.58/1] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 bg-[#2d053a] group">
                    {/* Grain Overlay */}
                    <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.15'/%3E%3C/svg%3E")` }}></div>
                    
                    {/* Watermark */}
                    <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[45%] h-[65%] opacity-[0.08] pointer-events-none" style={{ background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Cpath d='M150 80h115c75 0 125 40 125 115 0 63-35 102-86 113l112 112-58 58-140-140h-30v140h-78V80zm78 70v118h40c35 0 56-20 56-59 0-39-21-59-56-59h-40z' fill='%23f4d48a'/%3E%3C/svg%3E") center/contain no-repeat` }}></div>

                    <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                        {/* Header */}
                        <div className="flex justify-end items-start">
                            <div className="text-right">
                                <div className="text-[20px] font-black text-[#f4d48a] leading-none">ريفانس المالية</div>
                                <div className="text-[10px] font-bold text-[#f4d48a] tracking-widest mt-1 border-t border-[#f4d48a]/40 pt-0.5">RIFANIS FINANCE</div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-2 mb-2 w-full">
                            <div className="flex justify-between items-center text-white w-full border-b border-gold/10 pb-1.5">
                                <div className="text-[11px] font-bold text-[#f4d48a]">الاسم :</div>
                                <div className="text-[12px] font-black text-left">{userData.fullName}</div>
                            </div>
                            <div className="flex justify-between items-center text-white w-full border-b border-gold/10 pb-1.5">
                                <div className="text-[10px] font-bold text-[#f4d48a]">رقم الملف :</div>
                                <div className="text-[11px] font-black font-mono tracking-wider text-left" dir="ltr">{userData.fileNumber || 'RF-0000-0000'}</div>
                            </div>
                            <div className="flex justify-between items-center text-white w-full border-b border-gold/10 pb-1.5">
                                <div className="text-[10px] font-bold text-[#f4d48a]">رقم الهوية :</div>
                                <div className="text-[11px] font-black font-mono tracking-wider text-left" dir="ltr">{userData.nationalId}</div>
                            </div>
                            <div className="flex justify-between items-center text-white w-full border-b border-gold/10 pb-1.5">
                                <div className="text-[10px] font-bold text-[#f4d48a]">رقم الجوال :</div>
                                <div className="text-[11px] font-black font-mono tracking-wider text-left" dir="ltr">{userData.mobile || '9665XXXXXXXX'}</div>
                            </div>
                        </div>
                    </div>
                  </div>
               </div>

               {/* Info Sections with Improved Design */}
               <div className="space-y-5">
                  {/* Personal Info */}
                  <div className="bg-white dark:bg-[#12031a] rounded-[28px] border border-gold/20 p-6 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                           <User size={18} />
                        </div>
                        <h3 className="text-[15px] font-black text-brand dark:text-gold">البيانات الشخصية</h3>
                     </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Triple Name */}
                    <div className="grid grid-cols-3 gap-2">
                       <div>
                          <label className="text-[10px] text-muted block mb-1.5">الاسم الأول</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={userData.firstName || ''} 
                              onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                              className="w-full p-2 rounded-[10px] border border-gray-200 text-[12px] focus:border-gold outline-none"
                            />
                          ) : (
                            <div className="text-[13px] font-medium text-brand dark:text-white p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5">
                              {userData.firstName || ''}
                            </div>
                          )}
                       </div>
                       <div>
                          <label className="text-[10px] text-muted block mb-1.5">الاسم الأوسط</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={userData.middleName || ''} 
                              onChange={(e) => setUserData({...userData, middleName: e.target.value})}
                              className="w-full p-2 rounded-[10px] border border-gray-200 text-[12px] focus:border-gold outline-none"
                            />
                          ) : (
                            <div className="text-[13px] font-medium text-brand dark:text-white p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5">
                              {userData.middleName || ''}
                            </div>
                          )}
                       </div>
                       <div>
                          <label className="text-[10px] text-muted block mb-1.5">العائلة</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={userData.lastName || ''} 
                              onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                              className="w-full p-2 rounded-[10px] border border-gray-200 text-[12px] focus:border-gold outline-none"
                            />
                          ) : (
                            <div className="text-[13px] font-medium text-brand dark:text-white p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5">
                              {userData.lastName || ''}
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Age */}
                        <div>
                            <label className="text-[10px] text-muted block mb-1.5">العمر</label>
                            {isEditing ? (
                                <input 
                                type="text" 
                                inputMode="numeric"
                                value={userData.age || ''} 
                                onChange={(e) => setUserData({...userData, age: e.target.value.replace(/\D/g, '')})}
                                className="w-full p-2 rounded-[10px] border border-gray-200 text-[12px] focus:border-gold outline-none"
                                placeholder="بالسنوات"
                                />
                            ) : (
                                <div className="text-[13px] font-medium text-brand dark:text-white p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5">
                                {userData.age || ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* National ID */}
                        <div>
                            <label className="text-[10px] text-muted block mb-1.5">رقم الهوية</label>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={userData.nationalId || ''} 
                                    readOnly
                                    className="w-full p-2 rounded-[10px] border border-gray-200 text-[12px] focus:border-gold outline-none bg-gray-50 cursor-not-allowed opacity-80"
                                />
                            ) : (
                                <div className="text-[13px] font-medium text-brand dark:text-white font-mono p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5 flex items-center gap-2">
                                    <CreditCard size={12} />
                                    {userData.nationalId || ''}
                                </div>
                            )}
                        </div>
                        {/* Mobile */}
                        <div>
                           <label className="text-[10px] text-muted block mb-1.5">رقم الجوال</label>
                           {isEditing ? (
                                <input 
                                  type="tel" 
                                  inputMode="numeric"
                                  value={userData.mobile || ''} 
                                  readOnly
                                  className="w-full p-2 rounded-[10px] border border-gray-200 text-[12px] font-bold tracking-wider focus:border-gold outline-none dir-ltr text-left bg-gray-50 cursor-not-allowed opacity-80"
                                  placeholder="05xxxxxxxx"
                                />
                            ) : (
                                <div className="text-[13px] font-medium text-brand dark:text-white p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5 dir-ltr text-right">
                                   {userData.mobile || ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Job Status */}
                        <div>
                            <label className="text-[10px] text-muted block mb-1.5">الحالة الوظيفية</label>
                            {isEditing ? (
                            <select 
                                value={userData.jobStatus || ''} 
                                onChange={(e) => setUserData({...userData, jobStatus: e.target.value})}
                                className="w-full p-2.5 rounded-[10px] border border-gray-200 text-[12px] bg-white focus:border-gold outline-none"
                            >
                                <option value="">اختر الحالة</option>
                                <option value="موظف حكومي">موظف حكومي</option>
                                <option value="موظف قطاع خاص">موظف قطاع خاص</option>
                                <option value="متقاعد">متقاعد</option>
                                <option value="لا يوجد عمل">لا يوجد عمل</option>
                            </select>
                            ) : (
                            <div className="text-[13px] font-medium text-brand dark:text-white p-2 bg-gray-50 dark:bg-white/5 rounded-[10px] border border-gray-100 dark:border-white/5">
                                {userData.jobStatus || ''}
                            </div>
                            )}
                        </div>
                    </div>
                  </div>
               </div>

               {/* Location Info */}
               <div className="bg-white dark:bg-[#12031a] rounded-[28px] border border-gold/20 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                  <h3 className="text-[15px] font-black text-gold flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                        <MapPin size={18} />
                      </div>
                      العنوان
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                      {/* Region */}
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-muted px-1 uppercase tracking-wider">المنطقة / Region</label>
                          {isEditing ? (
                             <select 
                                value={userData.region || ''} 
                                onChange={(e) => setUserData({...userData, region: e.target.value, city: ''})}
                                className="w-full p-3 rounded-[14px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[12px] focus:border-gold outline-none dark:text-white"
                             >
                                <option value="">اختر المنطقة</option>
                                {Object.keys(REGION_CITIES).map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                          ) : (
                             <div className="text-[13px] font-bold text-brand dark:text-white p-3 bg-gray-50 dark:bg-white/5 rounded-[14px] border border-gray-50 dark:border-white/5">
                                {userData.region || '---'}
                             </div>
                          )}
                      </div>
                      {/* City */}
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-muted px-1 uppercase tracking-wider">المدينة / City</label>
                          {isEditing ? (
                             <select 
                                value={userData.city || ''} 
                                onChange={(e) => setUserData({...userData, city: e.target.value})}
                                className="w-full p-3 rounded-[14px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[12px] focus:border-gold outline-none dark:text-white"
                                disabled={!userData.region}
                             >
                                <option value="">اختر المدينة</option>
                                {userData.region && REGION_CITIES[userData.region]?.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          ) : (
                             <div className="text-[13px] font-bold text-brand dark:text-white p-3 bg-gray-50 dark:bg-white/5 rounded-[14px] border border-gray-50 dark:border-white/5">
                                {userData.city || '---'}
                             </div>
                          )}
                      </div>
                  </div>
               </div>

               {/* Financial Info */}
               <div className="bg-white dark:bg-[#12031a] rounded-[28px] border border-gold/20 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                  <h3 className="text-[15px] font-black text-gold flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                        <Building2 size={18} />
                      </div>
                      البيانات المالية والالتزام
                  </h3>
                  
                  <div className="mb-6 space-y-1.5">
                      <label className="text-[10px] font-black text-muted px-1 uppercase tracking-wider">الجهة المالية (البنك) / Financial Entity</label>
                      {isEditing ? (
                          <select 
                             value={userData.bank || ''} 
                             onChange={(e) => setUserData({...userData, bank: e.target.value})}
                             className="w-full p-3 rounded-[14px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[12px] focus:border-gold outline-none dark:text-white"
                          >
                             <option value="">اختر البنك</option>
                             {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                      ) : (
                          <div className="text-[13px] font-bold text-brand dark:text-white p-3 bg-gray-50 dark:bg-white/5 rounded-[14px] border border-gray-50 dark:border-white/5">
                             {userData.bank || '---'}
                          </div>
                      )}
                  </div>

                  {/* Products List */}
                  <div className="bg-gray-50 dark:bg-black/20 rounded-[20px] p-4 border border-gray-100 dark:border-white/5">
                      <div className="flex justify-between items-center mb-4">
                          <label className="text-[12px] font-black text-brand dark:text-gold flex items-center gap-2">
                             <Wallet size={14} />
                             الالتزامات القائمة
                          </label>
                          {isEditing && (
                             <button type="button" onClick={addProduct} className="text-[10px] font-black text-brand bg-gold px-3 py-1.5 rounded-full hover:bg-gold/90 flex items-center gap-1.5 shadow-sm">
                                <Plus size={12} /> إضافة التزام
                             </button>
                          )}
                      </div>

                      <div className="space-y-3">
                         {(userData.products && userData.products.length > 0) ? userData.products.map((product, idx) => (
                            <div key={product.id} className="flex gap-3 items-center bg-white dark:bg-white/5 p-3 rounded-[16px] shadow-sm border border-gray-50 dark:border-white/5 group">
                                 <div className="flex-1">
                                    {isEditing ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            <select 
                                                value={product.type}
                                                onChange={(e) => updateProduct(product.id, 'type', e.target.value)}
                                                className="w-full p-2 rounded-[10px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] focus:border-gold outline-none dark:text-white"
                                            >
                                                <option value="">نوع المنتج</option>
                                                <option value="تمويل شخصي">تمويل شخصي</option>
                                                <option value="تمويل عقاري">تمويل عقاري</option>
                                                <option value="التمويل التأجيري">التمويل التأجيري</option>
                                                <option value="بطاقة ائتمانية">بطاقة ائتمانية</option>
                                            </select>
                                            <input 
                                                type="text"
                                                placeholder="رقم الحساب"
                                                inputMode="numeric"
                                                value={product.accountNumber || ''}
                                                onChange={(e) => updateProduct(product.id, 'accountNumber', e.target.value.replace(/\D/g, ''))}
                                                className="w-full p-2 rounded-[10px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] focus:border-gold outline-none dark:text-white"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            <div className="text-[12px] font-black text-brand dark:text-white">{product.type || 'غير محدد'}</div>
                                            <div className="text-[10px] font-mono text-muted">A/C: {product.accountNumber || '---'}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="w-28">
                                    {isEditing ? (
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                inputMode="numeric"
                                                value={product.amount}
                                                onChange={(e) => updateProduct(product.id, 'amount', e.target.value.replace(/\D/g, ''))}
                                                className="w-full p-2 pr-7 rounded-[10px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] font-bold focus:border-gold outline-none dark:text-white text-left"
                                                placeholder="المبلغ"
                                            />
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted font-bold">ر.س</span>
                                        </div>
                                    ) : (
                                        <div className="text-[13px] font-black text-brand dark:text-gold text-left tabular-nums">
                                            {product.amount ? Number(product.amount).toLocaleString() : '0'}
                                            <span className="text-[9px] mr-1 text-muted">ر.س</span>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (userData.products!.length > 1) && (
                                    <button onClick={() => removeProduct(product.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                         )) : (
                            <div className="text-center text-[11px] text-muted py-4 bg-white/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">لا توجد التزامات مضافة</div>
                         )}
                      </div>
                      
                      {/* Total */}
                      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted uppercase tracking-wider">إجمالي المديونية / Total Debt</span>
                            <span className="text-[11px] text-brand/60 dark:text-gold/60 font-bold">مجموع الالتزامات القائمة</span>
                         </div>
                         <div className="text-[18px] font-black text-brand dark:text-gold tabular-nums flex items-baseline gap-1">
                            {userData.products?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
                            <span className="text-[10px] font-bold text-muted">ر.س</span>
                         </div>
                      </div>
                  </div>
               </div>

               {isEditing && (
                  <div className="mt-4">
                     <button 
                       onClick={handleSaveProfile} 
                       className="w-full py-3 bg-gold text-brand rounded-[14px] text-[13px] font-bold shadow-md hover:bg-gold/90 transition-all flex items-center justify-center gap-2"
                     >
                       <CheckCircle2 size={16} />
                       حفظ التغييرات
                     </button>
                  </div>
               )}
               </div>
             </div>
           )}

        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#12031a]">
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 text-[12px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 py-3 rounded-[14px] hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
           >
             <LogOut size={16} />
             تسجيل الخروج
           </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;