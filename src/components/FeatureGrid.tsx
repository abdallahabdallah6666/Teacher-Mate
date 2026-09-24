import React, { useState } from 'react';
import {
  UserCheck,
  Award,
  Sparkles,
  Calendar,
  BookOpen,
  Calculator,
  FileText,
  FolderArchive,
  FileSpreadsheet,
  PenTool,
  Book,
  Gamepad2,
  Grid,
  CheckCircle2,
} from 'lucide-react';
import { DESKTOP_FEATURES } from '../data/desktopFeatures';
import { Language } from './Navbar';

interface FeatureGridProps {
  lang: Language;
}

const ICON_MAP: Record<string, React.ElementType> = {
  UserCheck,
  Award,
  Sparkles,
  Calendar,
  BookOpen,
  Calculator,
  FileText,
  FolderArchive,
  FileSpreadsheet,
  PenTool,
  Book,
  Gamepad2,
  Grid
};

export const FeatureGrid: React.FC<FeatureGridProps> = ({ lang }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    {
      id: 'all',
      ar: 'الكل',
      fr: 'Tous',
      en: 'All'
    },
    {
      id: 'إدارة وتنظيم',
      ar: 'إدارة وتنظيم',
      fr: 'Gestion & Admin',
      en: 'Classroom Admin'
    },
    {
      id: 'ذكاء اصطناعي وبيداغوجيا',
      ar: 'ذكاء اصطناعي وبيداغوجيا',
      fr: 'IA & Pédagogie',
      en: 'AI & Pedagogy'
    },
    {
      id: 'تقويم وتنقيط',
      ar: 'تقويم وتنقيط',
      fr: 'Évaluation & Notes',
      en: 'Assessment & Grades'
    },
    {
      id: 'أنشطة ووسائل',
      ar: 'أنشطة ووسائل',
      fr: 'Activités & Outils',
      en: 'Activities & Resources'
    }
  ];

  const filteredFeatures = selectedCategory === 'all'
    ? DESKTOP_FEATURES
    : DESKTOP_FEATURES.filter(f => f.category === selectedCategory);

  return (
    <section id="features" className="py-16 bg-[#F8FAFC] text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-block px-3.5 py-1 bg-[#0D9488] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
            <span>
              {lang === 'ar' && 'منظومة حاسوب مخصصة لأستاذ اللغة الإنجليزية'}
              {lang === 'fr' && 'Suite logicielle pour enseignants d\'Anglais'}
              {lang === 'en' && 'Desktop Teaching Suite for Primary English'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E3A8A]">
            {lang === 'ar' && 'بعض مميزات برنامج رفيق المعلم (English Edition)'}
            {lang === 'fr' && 'Principales fonctionnalités de Teacher Companion'}
            {lang === 'en' && 'Key Features of Teacher Companion (English Edition)'}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {lang === 'ar' && 'تغطية شاملة لجميع السجلات الإدارية والبيداغوجية لمادة اللغة الإنجليزية، إعداد مذكرات دروس My Book of English بالذكاء الاصطناعي، بطاقات الفونكس والفلاب كاردز، وتقييم مكتسبات 5AP.'}
            {lang === 'fr' && 'Couverture complète des outils administratifs et pédagogiques pour l\'enseignement de l\'anglais au primaire en Algérie.'}
            {lang === 'en' && 'Comprehensive set of tools for primary English teaching in Algeria: AI lesson plans, phonics worksheets, flashcards, and 5AP competency evaluations.'}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                selectedCategory === cat.id
                  ? 'bg-[#1E3A8A] text-white border border-[#1E3A8A]'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {lang === 'ar' && cat.ar}
              {lang === 'fr' && cat.fr}
              {lang === 'en' && cat.en}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => {
            const Icon = ICON_MAP[feature.iconName] || Sparkles;

            const title = lang === 'ar' ? feature.titleAr : lang === 'fr' ? feature.titleFr : feature.titleEn;
            const description = lang === 'ar' ? feature.descriptionAr : lang === 'fr' ? feature.descriptionFr : feature.descriptionEn;
            const tag = lang === 'ar' ? feature.tagAr : lang === 'fr' ? feature.tagFr : feature.tagEn;
            const highlights = lang === 'ar' ? feature.highlightsAr : lang === 'fr' ? feature.highlightsFr : feature.highlightsEn;

            return (
              <div
                key={feature.id}
                className="group p-6 bg-white rounded-lg border border-slate-200 hover:border-[#0D9488] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-md bg-blue-50 text-[#1E3A8A] group-hover:bg-teal-50 group-hover:text-[#0D9488] flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#1E3A8A] border border-slate-200">
                      {tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#1E3A8A] group-hover:text-[#0D9488] transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* Highlights Bullet List */}
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    {highlights.slice(0, 4).map((item, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="text-[11px] text-[#0D9488] font-semibold">
                    {lang === 'ar' && 'مدمج في تطبيق سطح المكتب PC'}
                    {lang === 'fr' && 'Inclus dans l\'application PC'}
                    {lang === 'en' && 'Included in Desktop PC App'}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
