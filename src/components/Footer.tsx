import React from 'react';
import { BookOpenCheck, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { Language } from './Navbar';

interface FooterProps {
  lang: Language;
  onNavigateToSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onNavigateToSection }) => {
  return (
    <footer className="bg-[#1E3A8A] text-slate-200 text-xs border-t border-blue-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-9 h-9 rounded-md bg-[#0D9488] flex items-center justify-center text-white shadow-sm">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Teacher Companion</span>
            </div>

            <p className="text-slate-300 leading-relaxed font-normal">
              {lang === 'ar' && 'مكتب العمل والبيئة البيداغوجية الشاملة المدعومة بالذكاء الاصطناعي والمصممة خصيصاً لمُعلمي المدارس الابتدائية الجزائرية (3AP, 4AP, 5AP).'}
              {lang === 'fr' && 'Workspace intelligent pour les enseignants du primaire en Algérie.'}
              {lang === 'en' && 'Desktop workspace for primary English teachers in Algeria (3AP, 4AP, 5AP).'}
            </p>

            <div className="flex items-center gap-2 text-[#0D9488] font-bold text-[11px] bg-white/10 px-3 py-1.5 rounded-md border border-white/10 w-fit">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span className="text-teal-200">
                {lang === 'ar' && 'متوافق مع دليل المفتشية العامة للتربية'}
                {lang === 'fr' && 'Conforme aux normes du Ministère'}
                {lang === 'en' && 'Aligned with Ministry Standards'}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'ar' && 'روابط الوصول السريع'}
              {lang === 'fr' && 'Navigation'}
              {lang === 'en' && 'Navigation'}
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button onClick={() => onNavigateToSection('features')} className="hover:text-teal-300 transition-colors">
                  {lang === 'ar' && 'مميزات البرنامج'}
                  {lang === 'fr' && 'Fonctionnalités'}
                  {lang === 'en' && 'Features'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateToSection('pricing')} className="hover:text-teal-300 transition-colors">
                  {lang === 'ar' && 'الاشتراكات والأسعار'}
                  {lang === 'fr' && 'Abonnements & Tarifs'}
                  {lang === 'en' && 'Subscription & Pricing'}
                </button>
              </li>
            </ul>
          </div>

          {/* Payments & Chargily */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'ar' && 'الدفع الإلكتروني والتفعيل'}
              {lang === 'fr' && 'Paiement Sécurisé'}
              {lang === 'en' && 'Online Payment'}
            </h4>
            <p className="text-slate-300 leading-relaxed font-normal">
              {lang === 'ar' && 'نقبل جميع البطاقات البنكية الجزائرية CIB والبطاقة الذهبية لبريد الجزائر عبر بوابة Chargily Pay v2 الرسمية.'}
              {lang === 'fr' && 'Paiement sécurisé par la carte Edahabia et CIB via Chargily Pay.'}
              {lang === 'en' && 'Secure payment via Edahabia and CIB card using Chargily Pay.'}
            </p>

            <div className="p-3 bg-blue-950/80 rounded-md border border-blue-800 space-y-1">
              <div className="text-[11px] font-bold text-teal-300">💳 Chargily Pay v2 Integrated</div>
              <div className="text-[10px] text-slate-300">
                {lang === 'ar' && 'تفعيل فوري آلي تلقائي عقب إتمام العملية'}
                {lang === 'fr' && 'Activation automatique immédiate'}
                {lang === 'en' && 'Instant automatic activation after payment'}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'ar' && 'الدعم الفني والتواصل'}
              {lang === 'fr' && 'Contact & Support'}
              {lang === 'en' && 'Contact & Support'}
            </h4>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Algiers, Algeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-300 shrink-0" />
                <span>support@teachercompanion.dz</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-300 shrink-0" />
                <span dir="ltr">+213 (0) 23 88 99 00</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-blue-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-300 font-medium">
          <p>© {new Date().getFullYear()} Teacher Companion Algeria. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> for primary school teachers in Algeria
          </p>
        </div>

      </div>
    </footer>
  );
};
