import React from 'react';
import { Button } from './Button';

interface SocialLoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: 'google' | 'facebook' | 'apple';
  isLoading?: boolean;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, className = '', ...props }) => {
  const config = {
    google: {
      label: 'Google',
      icon: (
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.35,11.1H12v3.8h5.6c-0.2,1.3-0.9,2.4-2,3.1v2.6h3.2c1.9-1.7,3-4.3,3-7.4C21.8,12.3,21.6,11.7,21.35,11.1z" fill="#4285F4"/>
          <path d="M12,21.8c2.7,0,5-0.9,6.7-2.4l-3.2-2.6c-0.9,0.6-2,1-3.4,1c-2.6,0-4.8-1.7-5.6-4.1H3.1v2.5C4.8,19.6,8.2,21.8,12,21.8z" fill="#34A853"/>
          <path d="M6.4,13.7c-0.2-0.7-0.3-1.4-0.3-2.1c0-0.7,0.1-1.4,0.3-2.1V7H3.1C2.4,8.5,2,10.2,2,12c0,1.8,0.4,3.5,1.1,5l3.3-2.5V13.7z" fill="#FBBC05"/>
          <path d="M12,4.8c1.5,0,2.8,0.5,3.8,1.5l2.9-2.9C16.9,1.8,14.7,1,12,1C8.2,1,4.8,3.2,3.1,6.5l3.3,2.5C7.2,6.5,9.4,4.8,12,4.8z" fill="#EA4335"/>
        </svg>
      ),
      bg: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    },
    facebook: {
      label: 'Facebook',
      icon: (
        <svg className="w-5 h-5 mr-3 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v2.225h-1.541c-1.134 0-2.311 1.05-2.311 2.222v.835h3.88l-.586 3.667h-3.294v7.962C22.439 20.3 26 15.659 26 10.392 26 3.998 19.333-1.186 11.111-1.186S-3.778 3.998-3.778 10.392c0 5.679 4.102 10.457 9.879 11.3V23.691z" transform="translate(3.778 1.186)"/>
        </svg>
      ),
      bg: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    },
    apple: {
      label: 'Apple',
      icon: (
        <svg className="w-5 h-5 mr-3 text-black" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.311-1.273 3.714 1.35.104 2.715-.688 3.56-1.701z"/>
        </svg>
      ),
      bg: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    },
  };

  const { label, icon, bg } = config[provider];

  return (
    <Button
      type="button"
      className={`relative w-full ${bg} transition-transform hover:scale-[1.02] active:scale-[0.98] font-medium py-3 rounded-xl shadow-sm`}
      {...props}
    >
      {icon}
      <span>Continuar con {label}</span>
      {props.isLoading && (
         <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
         </div>
      )}
    </Button>
  );
};
