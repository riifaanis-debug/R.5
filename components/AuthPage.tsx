import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Shared';
import { User, Phone, CreditCard, ArrowRight, Loader2, AlertCircle, Lock, UserPlus, LogIn } from 'lucide-react';
import Logo from './Logo';

interface AuthPageProps {
  onClose: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onClose }) => {
  const [isUserMode, setIsUserMode] = useState(true);
  const [formData, setFormData] = useState({
    nationalId: '',
    mobile: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { loginOrRegisterUser, loginWithEmail } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'nationalId' || name === 'mobile') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const validateInput = () => {
    if (isUserMode) {
      if (!formData.nationalId) return "يرجى إدخال رقم الهوية";
      if (!/^[0-9]{10}$/.test(formData.nationalId)) return "رقم الهوية يجب أن يتكون من 10 أرقام";
      if (!formData.mobile) return "يرجى إدخال رقم الجوال";
      if (!/^05[0-9]{8}$/.test(formData.mobile)) return "رقم الجوال يجب أن يتكون من 10 أرقام ويبدأ بـ 05";
    } else {
      if (!formData.email) return "يرجى إدخال البريد الإلكتروني";
      if (!formData.password) return "يرجى إدخال كلمة المرور";
    }
    return null;
  };

  const onlyNumbers = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete') {
      e.preventDefault();
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isUserMode) {
        const loggedInUser = await loginOrRegisterUser(formData.nationalId, formData.mobile);
        if (loggedInUser.role === 'admin') {
          window.location.hash = '#/admin';
        } else {
          window.location.hash = '#/dashboard';
        }
      } else {
        const loggedInUser = await loginWithEmail(formData.email, formData.password);
        if (loggedInUser.role === 'admin') {
          window.location.hash = '#/admin';
        } else {
          window.location.hash = '#/dashboard';
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "بيانات الدخول غير صحيحة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-[320px] bg-white dark:bg-[#12031a] rounded-[24px] shadow-2xl overflow-hidden border border-gold/20 animate-in zoom-in-95 duration-300">
        <div className="p-5">
          <div className="text-center mb-4">
            <Logo className="w-[120px] h-auto justify-center mb-2 mx-auto" />
            <h2 className="text-lg font-bold text-brand dark:text-white">
              {isUserMode ? 'تسجيل الدخول' : 'دخول الإدارة'}
            </h2>
            <p className="text-muted text-[11px] mt-1">
              {isUserMode ? 'مرحباً بك في ريفانس المالية' : 'لوحة تحكم المسؤول'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl mb-4">
            <button
              onClick={() => { setIsUserMode(true); setError(''); }}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${isUserMode ? 'bg-white dark:bg-brand text-brand dark:text-gold shadow-sm' : 'text-muted'}`}
            >
              عميل
            </button>
            <button
              onClick={() => { setIsUserMode(false); setError(''); }}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${!isUserMode ? 'bg-white dark:bg-brand text-brand dark:text-gold shadow-sm' : 'text-muted'}`}
            >
              إدارة
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle size={16} />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleInitialSubmit} className="space-y-3" noValidate>
            {isUserMode ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand dark:text-gold/80 px-1">رقم الهوية الوطنية</label>
                  <div className="relative group">
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-gold transition-colors" size={18} />
                    <input
                      type="text"
                      name="nationalId"
                      inputMode="numeric"
                      value={formData.nationalId}
                      onChange={handleChange}
                      onKeyDown={onlyNumbers}
                      maxLength={10}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-gold outline-none transition-all dark:text-white"
                      placeholder="10 أرقام"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand dark:text-gold/80 px-1">رقم الجوال</label>
                  <div className="relative group flex items-center">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-gold transition-colors" size={18} />
                    <input
                      type="text"
                      name="mobile"
                      inputMode="numeric"
                      value={formData.mobile}
                      onChange={handleChange}
                      onKeyDown={onlyNumbers}
                      maxLength={10}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold tracking-wider focus:border-gold outline-none transition-all dark:text-white text-left dir-ltr"
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <p className="text-[9px] text-muted px-1">يجب أن يتكون من 10 أرقام ويبدأ بـ 05</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand dark:text-gold/80 px-1">البريد الإلكتروني</label>
                  <div className="relative group">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-gold transition-colors" size={18} />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-gold outline-none transition-all dark:text-white text-left dir-ltr"
                      placeholder="admin@rifans.sa"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand dark:text-gold/80 px-1">كلمة المرور</label>
                  <div className="relative group">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-gold transition-colors" size={18} />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:border-gold outline-none transition-all dark:text-white text-left dir-ltr"
                      placeholder="••••"
                    />
                  </div>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full py-2.5 mt-3 text-sm gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                <>
                  {isUserMode ? 'تسجيل الدخول' : 'دخول المسؤول'}
                  <ArrowRight size={18} className="rotate-180" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
