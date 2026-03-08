
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Logo from './Logo';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  highlight?: boolean;
}

const menuItems: MenuItem[] = [
  { label: 'الصفحة الرئيسية', href: '#/' },
  { label: 'احصل على استشارة', href: '#/contact', highlight: true },
  { label: 'من نحن', href: '#/about' },
  { label: 'اتصل بنا', href: '#/contact' },
  { label: 'حلول المديونيات', href: '#/service/debt_solutions' },
  { label: 'الخدمات القضائية والعدلية', href: '#/service/legal' },
  { label: 'الخدمات المصرفية', href: '#/service/banking' },
  { label: 'الخدمات العقارية', href: '#/service/realestate' },
  { label: 'الخدمات الزكوية والضريبية', href: '#/service/zakat' },
  { label: 'خدمات الإعفاء من المديونية', href: '#/waive-landing', highlight: true },
  { label: 'الخدمات الائتمانية', href: '#/service/credit' },
  { label: 'الخدمات الاستشارية', href: '#/service/consulting' },
];

const socialLinks = [
    { href: "https://www.instagram.com/rifaniis", icon: "https://j.top4top.io/p_3606dy9q00.png", label: "Instagram" },
    { href: "https://x.com/rifaniis", icon: "https://l.top4top.io/p_3606y8uyv7.png", label: "X" },
    { href: "https://wa.me/966125911227", icon: "https://d.top4top.io/p_3610plh810.png", label: "WhatsApp" },
    { href: "https://www.snapchat.com/add/rifaniis", icon: "https://f.top4top.io/p_3606vb8in1.png", label: "Snapchat" },
    { href: "mailto:r.iifaanis@gmail.com", icon: "https://i.top4top.io/p_36065rqnc4.png", label: "Email" },
];

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleLinkClick = () => {
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-[320px] h-full bg-white dark:bg-brand shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gold/10">
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-muted hover:text-brand hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-colors">
             <X size={24} />
           </button>
           <Logo className="w-[140px] h-auto" />
        </div>
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            {menuItems.map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.href} 
                  onClick={handleLinkClick}
                  className={`block px-8 py-4 text-sm font-black transition-all text-right border-r-4
                    ${item.highlight 
                      ? 'text-gold bg-gold/5 border-gold' 
                      : 'text-brand dark:text-white hover:bg-gold/5 border-transparent hover:border-gold/30'
                    }`}
                >
                    {item.label}
                </a>
            ))}
        </div>
        <div className="p-8 bg-gray-50 dark:bg-black/40 border-t border-gold/10 flex flex-col items-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-brand/40 dark:text-gold/40 mb-6">RIFANS FINANCIAL</div>
            <div className="flex items-center gap-6">
                {socialLinks.map((link, i) => (
                    <a key={i} href={link.href} target="_blank" rel="noopener noreferrer" className="opacity-40 hover:opacity-100 hover:scale-125 transition-all">
                        <img src={link.icon} alt={link.label} className="w-6 h-6 object-contain" />
                    </a>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
