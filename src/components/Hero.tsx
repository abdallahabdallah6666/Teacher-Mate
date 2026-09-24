import React from 'react';
import { Download, CreditCard, ShieldCheck, CheckCircle2, LogIn } from 'lucide-react';
import { Language } from './Navbar';

interface HeroProps {
  lang: Language;
  onOpenDownload: () => void;
  onOpenPricing: () => void;
  onOpenLogin: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  lang,
  onOpenDownload,
  onOpenPricing,
  onOpenLogin,
}) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-[#F8FAFC] text-slate-900 py-12 sm:py-16 border-b border-slate-200">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Hero Card */}
        <div className="bg-[#1E3A8A] text-white p-8 sm:p-12 lg:p-14 rounded-xl overflow-hidden relative shadow-lg">
          {/* Geometric circle background element */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-800/40 rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#0D9488] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>
                {lang === 'ar' && 'برنامج سطح المكتب لأستاذ اللغة الإنجليزية بالتعليم الابتدائي (3AP, 4AP, 5AP)'}
                {lang === 'fr' && 'Logiciel PC pour enseignants d\'Anglais du Primaire (3AP, 4AP, 5AP)'}
                {lang === 'en' && 'Desktop Suite for Primary English Teachers in Algeria (3AP, 4AP, 5AP)'}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">
              {lang === 'ar' && 'منظومة سطح المكتب المتكاملة لأستاذ اللغة الإنجليزية بالابتدائي الجزائري'}
              {lang === 'fr' && 'La suite logicielle complète pour les enseignants d\'Anglais du Primaire en Algérie'}
              {lang === 'en' && 'The Complete Desktop Companion for Primary English Teachers in Algeria'}
            </h1>

            {/* Subtitle */}
            <p className="text-blue-100 text-base sm:text-lg leading-relaxed font-normal">
              {lang === 'ar' && 'برنامج حاسوب يعمل 100% بدون إنترنت. مصمم خصيصاً لمرافقة أستاذ الإنجليزية في إعداد المذكرات التربوية الذكية (AI Fiches)، أوراق عمل الصوتيات والحروف (Phonics)، البطاقات المصورة (Flashcards)، تقييم مكتسبات 5AP، وكشوف النقاط وفق منهاج My Book of English.'}
              {lang === 'fr' && 'Logiciel PC fonctionnant 100% hors-ligne. Conçu spécifiquement pour accompagner l\'enseignant d\'Anglais dans la génération de fiches pédagogiques IA, fiches d\'exercices de phonétique, cartes d\'images (Flashcards), évaluations des acquis 5AP et carnets de notes selon le programme officiel My Book of English.'}
              {lang === 'en' && 'Offline desktop workspace for Algerian primary English teachers. Generate AI lesson plans, phonics worksheets, vocabulary flashcards, 5AP English competency evaluations, and gradebooks seamlessly.'}
            </p>

            {/* Action Buttons: Download, Subscribe Now, and Log In */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={onOpenDownload}
                className="bg-white text-[#1E3A8A] hover:bg-slate-100 px-5 sm:px-6 py-3.5 rounded-md font-extrabold shadow-md flex items-center gap-2 text-sm transition-all"
              >
                <Download className="w-5 h-5 text-[#1E3A8A]" />
                <span>
                  {lang === 'ar' && 'تحميل'}
                  {lang === 'fr' && 'Télécharger'}
                  {lang === 'en' && 'Download'}
                </span>
              </button>

              <button
                onClick={onOpenPricing}
                className="bg-[#0D9488] hover:bg-teal-700 text-white px-5 sm:px-6 py-3.5 rounded-md font-extrabold shadow-sm flex items-center gap-2 text-sm transition-all"
              >
                <CreditCard className="w-5 h-5 text-white" />
                <span>
                  {lang === 'ar' && 'اشترك الآن'}
                  {lang === 'fr' && 'S\'abonner'}
                  {lang === 'en' && 'Subscribe Now'}
                </span>
              </button>

              <button
                onClick={onOpenLogin}
                className="bg-blue-900/80 hover:bg-blue-900 text-white border border-blue-400/40 px-5 sm:px-6 py-3.5 rounded-md font-extrabold shadow-sm flex items-center gap-2 text-sm transition-all"
              >
                <LogIn className="w-5 h-5 text-teal-300" />
                <span>
                  {lang === 'ar' && 'تسجيل الدخول'}
                  {lang === 'fr' && 'Se connecter'}
                  {lang === 'en' && 'Log In'}
                </span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-blue-100 font-medium border-t border-blue-700/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488] fill-[#0D9488]/20" />
                <span>
                  {lang === 'ar' && 'منهاج اللغة الإنجليزية الجيل الثاني (My Book of English)'}
                  {lang === 'fr' && 'Programme officiel d\'Anglais (My Book of English)'}
                  {lang === 'en' && 'Official Algerian Curriculum (My Book of English)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488] fill-[#0D9488]/20" />
                <span>
                  {lang === 'ar' && 'تفعيل آلي بواسطة الذهبية / CIB عبر Chargily'}
                  {lang === 'fr' && 'Activation instantanée via Edahabia / CIB (Chargily)'}
                  {lang === 'en' && 'Chargily Pay Instant License (Edahabia / CIB)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488] fill-[#0D9488]/20" />
                <span>
                  {lang === 'ar' && 'يعمل 100% بدون إنترنت على الكمبيوتر'}
                  {lang === 'fr' && 'Fonctionne 100% Hors-ligne sur PC'}
                  {lang === 'en' && '100% Offline PC Software'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
