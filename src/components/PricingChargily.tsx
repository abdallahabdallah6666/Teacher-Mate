import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Sparkles, Tag } from 'lucide-react';
import { LicensePlan, PricingSettings } from '../types';
import { Language } from './Navbar';

interface PricingProps {
  lang: Language;
  onSelectPlanForCheckout: (plan: LicensePlan) => void;
}

export const ANNUAL_PLAN: LicensePlan = {
  id: 'pro',
  nameAr: 'الرخصة السنوية الشخصية (Personal Yearly License)',
  priceDZD: 3000,
  period: 'سنة كاملة / جهاز حاسوب واحد (1 PC)',
  popular: true,
  featuresAr: [
    'وصول شامل لجميع سنوات التعليم الابتدائي (3AP, 4AP, 5AP)',
    'توليد المذكرات التربوية الذكية بالذكاء الاصطناعي (AI Fiches)',
    'أوراق عمل الصوتيات ورسم الحروف المنقطة (Phonics)',
    'صانع البطاقات المصورة والوسائل البصرية (Flashcards)',
    'منظومة تقييم مكتسبات مادة اللغة الإنجليزية (5AP)',
    'دفتر العلامات وحساب المعدلات الفصلية لجميع الأفواج',
    'مخطط تنظيم القسم والمجموعات الطاولية',
    'تفعيل شامل لحساب الأستاذ على جهاز حاسوب واحد (1 PC)'
  ]
};

const FEATURES_EN = [
  'Full access to all primary grade levels (3AP, 4AP, 5AP)',
  'AI-powered lesson plans generator (AI Fiches)',
  'Phonics & handwriting practice worksheets',
  'Vocabulary Flashcards & visual aids creator',
  'Primary English competency assessment system (5AP)',
  'Gradebook & automatic term average calculation',
  'Classroom seating plan & group planner',
  'Full teacher license access for 1 PC'
];

export const PricingChargily: React.FC<PricingProps> = ({ lang, onSelectPlanForCheckout }) => {
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then(async res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.plans) {
          setPricingSettings(data);
        }
      })
      .catch(err => console.error('Failed to load pricing:', err));
  }, []);

  const proPlanConfig = pricingSettings?.plans?.pro;
  const currentPrice = proPlanConfig ? proPlanConfig.priceDZD : 3000;
  const promoNotice = lang === 'ar'
    ? pricingSettings?.promoNoticeAr
    : pricingSettings?.promoNoticeEn;

  const dynamicPlan: LicensePlan = {
    ...ANNUAL_PLAN,
    priceDZD: currentPrice,
    featuresAr: proPlanConfig?.featuresAr || ANNUAL_PLAN.featuresAr,
  };

  const getFeatures = () => {
    if (proPlanConfig) {
      if (lang === 'ar') return proPlanConfig.featuresAr;
      return proPlanConfig.featuresEn || FEATURES_EN;
    }
    if (lang === 'ar') return ANNUAL_PLAN.featuresAr;
    return FEATURES_EN;
  };

  return (
    <section id="pricing" className="py-16 bg-[#F8FAFC] text-slate-900 relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-block px-3.5 py-1 bg-[#0D9488] text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            <span>
              {lang === 'ar' ? 'الدفع الإلكتروني الآمن' : 'Secure Online Payment'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A]">
            {lang === 'ar' ? 'الرخصة السنوية الشخصية (Personal Yearly License)' : 'Personal Yearly License'}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {lang === 'ar'
              ? 'اشترك الآن عبر البطاقة الذهبية (Edahabia) أو بطاقة CIB البنكية للحصول على مفتاح التفعيل الفوري للبرنامج لمدة سنة كاملة.'
              : 'Subscribe securely using your Edahabia or CIB bank card and receive your instant activation key.'}
          </p>

          {promoNotice && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-800 text-xs font-extrabold animate-pulse">
              <Tag className="w-4 h-4 text-teal-600" />
              <span>{promoNotice}</span>
            </div>
          )}
        </div>

        {/* Single Centered Subscription Card */}
        <div className="max-w-xl mx-auto">
          <div className="relative bg-white rounded-xl p-6 sm:p-10 border-2 border-[#0D9488] shadow-lg ring-1 ring-[#0D9488]/20 flex flex-col justify-between space-y-8">
            
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0D9488] text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-sm flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'ar' ? (proPlanConfig?.badgeAr || 'الاشتراك السنوي الموصى به') : (proPlanConfig?.badgeEn || 'Recommended Annual Plan')}
              </span>
            </div>

            <div className="space-y-6 pt-2">
              <div className="text-center border-b border-slate-100 pb-6 space-y-2">
                <h3 className="text-2xl font-extrabold text-[#1E3A8A]">
                  {lang === 'ar' ? (proPlanConfig?.nameAr || 'الرخصة السنوية الشخصية (Personal Yearly License)') : (proPlanConfig?.nameEn || 'Personal Yearly License')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'ar' ? 'سنة كاملة لجهاز حاسوب واحد (1 PC) لكافة مستويات الابتدائي' : '1 full year access for 1 PC across all grade levels (3AP + 4AP + 5AP)'}
                </p>

                <div className="pt-4 flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">
                    {currentPrice.toLocaleString()}
                  </span>
                  <span className="text-xl font-bold text-[#0D9488]">
                    {pricingSettings?.currencyDZD || 'دج / DZD'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {lang === 'ar' ? '/ سنوياً' : '/ year'}
                  </span>
                </div>
              </div>

              {/* Included Features List */}
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                {getFeatures().map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => onSelectPlanForCheckout(dynamicPlan)}
                className="w-full py-4 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-base rounded-md shadow-md flex items-center justify-center gap-2.5 transition-all"
              >
                <CreditCard className="w-5 h-5 text-white" />
                <span>
                  {lang === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
                </span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
