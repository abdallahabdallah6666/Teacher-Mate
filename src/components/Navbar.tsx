import React from 'react';
import { BookOpenCheck, Globe, ChevronDown, LogIn, LayoutDashboard, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';

export type Language = 'ar' | 'fr' | 'en';

interface NavbarProps {
  activeLang: Language;
  onChangeLang: (lang: Language) => void;
  onNavigateToSection?: (sectionId: string) => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onOpenHub: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeLang,
  onChangeLang,
  onNavigateToSection,
  currentUser,
  onOpenLogin,
  onOpenHub,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand ONLY (Icon + Title) */}
          <div 
            className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer" 
            onClick={() => onNavigateToSection?.('hero')}
          >
            <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm shrink-0">
              <BookOpenCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1E3A8A]">
                Teacher Companion
              </span>
              <span className="text-[10px] font-bold text-[#0D9488]">
                {activeLang === 'ar' && 'طبعة أستاذ اللغة الإنجليزية بالجزائر'}
                {activeLang === 'fr' && 'Édition Enseignant d\'Anglais'}
                {activeLang === 'en' && 'Algerian Primary English Edition'}
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            
            {/* Hub or Login Button */}
            {currentUser ? (
              <button
                onClick={onOpenHub}
                className="bg-[#1E3A8A] hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-[#0D9488]" />
                <span>
                  {activeLang === 'ar' && 'مساحة Hub الأساتذة'}
                  {activeLang === 'fr' && 'Espace Hub'}
                  {activeLang === 'en' && 'Teacher Hub'}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-slate-100 hover:bg-slate-200 text-[#1E3A8A] border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all"
              >
                <LogIn className="w-4 h-4 text-[#1E3A8A]" />
                <span>
                  {activeLang === 'ar' && 'تسجيل الدخول'}
                  {activeLang === 'fr' && 'Se connecter'}
                  {activeLang === 'en' && 'Log In'}
                </span>
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-[#0D9488] absolute left-2.5 rtl:right-2.5 pointer-events-none z-10" />
              <select
                value={activeLang}
                onChange={(e) => onChangeLang(e.target.value as Language)}
                className="appearance-none bg-slate-100 text-slate-800 text-xs font-bold pl-8 pr-7 rtl:pr-8 rtl:pl-7 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <option value="ar">العربية (Ar)</option>
                <option value="fr">Français (Fr)</option>
                <option value="en">English (En)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 rtl:left-2 pointer-events-none z-10" />
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
