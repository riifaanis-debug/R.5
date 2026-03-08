import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white' | 'gold';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-14", variant = 'default', showText = true }) => {
  const isWhite = variant === 'white';
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-full h-full flex items-center justify-center">
        <img 
          src="https://mrkzgulfup.com/uploads/17723308921271.png" 
          alt="Rifans Financial" 
          className={`max-w-full max-h-full object-contain transition-all duration-500 
            ${isWhite 
              ? 'brightness-0 invert' 
              : 'dark:brightness-125 dark:contrast-110'
            }`}
          referrerPolicy="no-referrer"
        />
        {/* Subtle glow for dark mode to make the logo pop */}
        <div className="absolute inset-0 bg-gold/5 blur-xl rounded-full opacity-0 dark:opacity-100 pointer-events-none" />
      </div>
    </div>
  );
};

export default Logo;
