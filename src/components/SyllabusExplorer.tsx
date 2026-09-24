import React, { useState } from 'react';
import { Clock, ShieldCheck, FileSpreadsheet, Globe, Layers, BookOpen } from 'lucide-react';
import { PRIMARY_SUBJECTS, UNITS_PER_GRADE } from '../data/syllabus';
import { GradeLevel } from '../types';

interface SyllabusExplorerProps {
  isAr: boolean;
}

export const SyllabusExplorer: React.FC<SyllabusExplorerProps> = ({ isAr }) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('3AP');

  const gradeDetails: Record<GradeLevel, { titleAr: string; titleFr: string; bookName: string; desc: string }> = {
    '3AP': {
      titleAr: 'السنة الثالثة ابتدائي - مادة اللغة الإنجليزية (3AP)',
      titleFr: '3rd Year Primary - My First Book of English',
      bookName: 'My Book of English - 3AP (وزارة التربية الوطنية)',
      desc: 'مرحلة الاكتشاف الأولى: التعرف على الحروف الإنجليزية، الصوتيات الأساسية (Phonics)، التحيات، الأسرة، المدرسة، والمنزل.'
    },
    '4AP': {
      titleAr: 'السنة الرابعة ابتدائي - مادة اللغة الإنجليزية (4AP)',
      titleFr: '4th Year Primary - My Book of English 4AP',
      bookName: 'My Book of English - 4AP (وزارة التربية الوطنية)',
      desc: 'مرحلة التوسع وتثبيت المكتسبات: المهن، الأطعمة والمشتريات بالدينار الجزائري، الجسم والصحة، والحيوانات والمعالم الجغرافية.'
    },
    '5AP': {
      titleAr: 'السنة الخامسة ابتدائي - مادة اللغة الإنجليزية (5AP)',
      titleFr: '5th Year Primary - My Book of English 5AP',
      bookName: 'My Book of English - 5AP (وزارة التربية الوطنية)',
      desc: 'مرحلة التتويج وتقييم المكتسبات: الشخصيات والمعالم التاريخية بالجزائر، التكنولوجيا، القصص والمشاريع المدرسية للتحضير للمتوسط.'
    }
  };

  return (
    <section id="syllabus" className="py-16 bg-[#1E3A8A] text-white border-t border-b border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D9488] text-white text-xs font-extrabold uppercase tracking-widest shadow-sm">
            <Globe className="w-4 h-4 text-white" />
            <span>{isAr ? 'منهاج اللغة الإنجليزية بالابتدائي الجزائري' : 'Official Algerian English Syllabus'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {isAr ? 'تكامل مع مقرر كتاب الإنجليزية (My Book of English)' : 'Full Alignment with My Book of English 3AP - 5AP'}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            {isAr
              ? 'تتوافق جميع مذكرات، تمارين، واختبارات التطبيق مع المقاطع المعتمدة رسمياً لدى وزارة التربية الوطنية والمفتشية العامة.'
              : 'All lesson plans, exercises, and exams align with the Ministry of Education progressions.'}
          </p>
        </div>

        {/* Grade Switcher */}
        <div className="flex justify-center gap-3">
          {(['3AP', '4AP', '5AP'] as GradeLevel[]).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-6 py-3 rounded-lg font-extrabold text-sm transition-all flex items-center gap-2 ${
                selectedGrade === g
                  ? 'bg-[#0D9488] text-white shadow-lg border border-teal-300'
                  : 'bg-blue-900/60 text-blue-200 hover:bg-blue-900 border border-blue-700/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{gradeDetails[g].titleAr}</span>
            </button>
          ))}
        </div>

        {/* Grade Overview Banner */}
        <div className="bg-blue-950/80 border border-blue-800 rounded-xl p-6 flex flex-wrap justify-between items-center gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-400 text-amber-950">
                {selectedGrade} English
              </span>
              <h3 className="text-lg font-bold text-white">{gradeDetails[selectedGrade].titleAr}</h3>
            </div>
            <p className="text-xs text-blue-200 leading-relaxed">{gradeDetails[selectedGrade].desc}</p>
          </div>

          <div className="bg-blue-900/60 p-3 rounded-lg border border-blue-700/60 text-right space-y-1">
            <span className="text-[11px] font-bold text-teal-300 block">الكتاب المدرسي المقرر:</span>
            <span className="text-xs font-extrabold text-white block">{gradeDetails[selectedGrade].bookName}</span>
            <span className="text-[11px] text-blue-200 block">الحجم الساعي الرسمي: 1h30 / الأسبوع لكل فوج</span>
          </div>
        </div>

        {/* Sequences per Selected Grade */}
        <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0D9488]" />
              <h4 className="text-base font-bold text-[#1E3A8A]">
                {isAr ? `مقاطع التعلم الرسمية لـ ${selectedGrade} (English Sequences)` : `Official Sequences for ${selectedGrade}`}
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {UNITS_PER_GRADE[selectedGrade]?.length || 5} Sequences
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {UNITS_PER_GRADE[selectedGrade]?.map((seq, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#0D9488] transition-all space-y-2">
                <span className="text-[10px] font-extrabold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Sequence #{idx + 1}
                </span>
                <p className="text-xs font-bold text-[#1E3A8A] leading-relaxed">
                  {seq}
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>My Book of English</span>
                  <span className="text-[#0D9488] font-semibold">مذكرات + أوراق عمل AI</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Teaching Domains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {PRIMARY_SUBJECTS.map((sub) => (
            <div
              key={sub.id}
              className="bg-white text-slate-900 rounded-xl p-5 border border-slate-200 hover:border-[#0D9488] shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`w-3 h-3 rounded-full ${sub.color}`} />
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3 text-[#0D9488]" />
                    {sub.weeklyHours} سا/أسبوع
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-[#1E3A8A]">{sub.nameAr}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{sub.nameFr}</p>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-[#0D9488] uppercase tracking-wider block">
                  محاور الحصص التطبيقية:
                </span>
                <ul className="space-y-1">
                  {sub.domains.map((dom, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-[#0D9488] text-sm leading-none">•</span>
                      <span>{dom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
