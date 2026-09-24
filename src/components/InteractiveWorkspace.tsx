import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Calculator,
  FileCheck2,
  Printer,
  Copy,
  Check,
  RefreshCw,
  LayoutGrid,
  Users,
  Award,
  AlertCircle
} from 'lucide-react';
import { PRIMARY_SUBJECTS, UNITS_PER_GRADE } from '../data/syllabus';
import { GradeLevel, LessonCard, AssessmentExam, StudentGrade } from '../types';

interface WorkspaceProps {
  isAr: boolean;
  activeModuleId?: string;
}

export const InteractiveWorkspace: React.FC<WorkspaceProps> = ({ isAr, activeModuleId }) => {
  const [activeTab, setActiveTab] = useState<'card' | 'exam' | 'grades' | 'seating'>('card');
  
  // Lesson Card State
  const [grade, setGrade] = useState<GradeLevel>('4AP');
  const [selectedSubject, setSelectedSubject] = useState<string>('اللغة العربية والإنتاج الكتابي');
  const [unit, setUnit] = useState<string>('المقطع 02: الصحة والرياضة والتغذية السليمة');
  const [topic, setTopic] = useState<string>('الفاعل وأنواعه في الجملة الفعلية');
  const [loadingCard, setLoadingCard] = useState<boolean>(false);
  const [generatedCard, setGeneratedCard] = useState<LessonCard | null>(null);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);

  // Exam Creator State
  const [examGrade, setExamGrade] = useState<GradeLevel>('5AP');
  const [examSubject, setExamSubject] = useState<string>('الرياضيات والتفكير المنطقي');
  const [examTerm, setExamTerm] = useState<1 | 2 | 3>(1);
  const [examTopic, setExamTopic] = useState<string>('الأعداد الكبيرة والأشكال الهندسية والوضعية المركبة');
  const [loadingExam, setLoadingExam] = useState<boolean>(false);
  const [generatedExam, setGeneratedExam] = useState<AssessmentExam | null>(null);

  // Gradebook State
  const [students, setStudents] = useState<StudentGrade[]>([
    { id: '1', studentName: 'أحمد ياسين بن علي', gender: 'M', continuousAssessment: 9.5, testScore: 8.5, examScore: 8.5, finalAverage: 8.83, observationAr: 'ممتاز، واصل الاجتهاد' },
    { id: '2', studentName: 'مريم براهيمي', gender: 'F', continuousAssessment: 8.0, testScore: 7.5, examScore: 8.0, finalAverage: 7.83, observationAr: 'جيد جداً، نتائج مستقرة' },
    { id: '3', studentName: 'أمير قادري', gender: 'M', continuousAssessment: 6.0, testScore: 5.5, examScore: 6.0, finalAverage: 5.83, observationAr: 'تلميذ متوسط، يرجى المتابعة' },
    { id: '4', studentName: 'فاطمة الزهراء شريفي', gender: 'F', continuousAssessment: 9.0, testScore: 9.5, examScore: 9.0, finalAverage: 9.16, observationAr: 'ممتازة، نموذج للاقتداء' }
  ]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newCont, setNewCont] = useState<number>(8);
  const [newExam, setNewExam] = useState<number>(7.5);

  // Seating plan state
  const [desksCount, setDesksCount] = useState<number>(12);

  // Handlers for Lesson Card generation
  const handleGenerateLessonCard = async () => {
    setLoadingCard(true);
    setGeneratedCard(null);

    try {
      const res = await fetch('/api/gemini/lesson-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          subject: selectedSubject,
          unit,
          topic,
          durationMinutes: 45
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGeneratedCard(json.data);
      } else {
        alert(json.error || 'حدث خطأ أثناء الاتصال بالخادم');
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالذكاء الاصطناعي حالياً');
    } finally {
      setLoadingCard(false);
    }
  };

  // Handler for Exam Generation
  const handleGenerateExam = async () => {
    setLoadingExam(true);
    setGeneratedExam(null);

    try {
      const res = await fetch('/api/gemini/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: examGrade,
          subject: examSubject,
          term: examTerm,
          topic: examTopic
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGeneratedExam(json.data);
      } else {
        alert(json.error || 'حدث خطأ أثناء توليد التقويم');
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالسيرفر');
    } finally {
      setLoadingExam(false);
    }
  };

  // Add Student to Gradebook
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;

    // Formula: Average = (ContinuousAssessment + TestScore + ExamScore*2) / 4
    const avg = Number(((newCont + newExam * 2) / 3).toFixed(2));
    let obs = 'متوسط';
    if (avg >= 8.5) obs = 'ممتاز، واصل الاجتهاد والتفوق';
    else if (avg >= 7.0) obs = 'حسن، نتائج مرضية';
    else if (avg >= 5.0) obs = 'مستحسن، يحتاج مزيد التركيز';
    else obs = 'ضعيف، يتطلب تكثيف الجهود والمعالجة التربوية';

    const newEntry: StudentGrade = {
      id: Date.now().toString(),
      studentName: newStudentName,
      gender: 'M',
      continuousAssessment: newCont,
      testScore: newExam,
      examScore: newExam,
      finalAverage: avg,
      observationAr: obs
    };

    setStudents([...students, newEntry]);
    setNewStudentName('');
  };

  const handleCopyCardText = () => {
    if (!generatedCard) return;
    const text = `المذكرة التربوية: ${generatedCard.titleAr}\nالمستوى: ${generatedCard.grade} | المادة: ${generatedCard.subject}\nالأهداف: ${generatedCard.objectives?.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  return (
    <section id="workspace" className="py-16 bg-white text-slate-900 relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Title Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-block px-3.5 py-1 bg-[#0D9488] text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-sm">
            <span>{isAr ? 'منصة التجربة المباشرة للبرنامج' : 'Espace de Démo en Ligne'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E3A8A]">
            {isAr ? 'جرب أدوات الذكاء الاصطناعي مباشرة في متصفحك' : 'Testez les Modules IA Directement'}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {isAr
              ? 'اختر إحدى الوحدات أدناه لتشغيل مولد المذكرات التربوية، صانع الاختبارات الرسمية، كراس العلامات، أو تنظيم القسم.'
              : 'Générez des fiches pédagogiques, sujets d\'examen et carnets de notes selon les standards algériens.'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-all border ${
              activeTab === 'card'
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#0D9488]" />
            <span>{isAr ? '1. المذكرة التربوية AI' : 'Fiche Pédagogique AI'}</span>
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-all border ${
              activeTab === 'exam'
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-[#0D9488]" />
            <span>{isAr ? '2. منشئ الاختبارات' : 'Générateur d\'Examens'}</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-all border ${
              activeTab === 'grades'
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4 text-[#0D9488]" />
            <span>{isAr ? '3. دفتر العلامات والمعدلات' : 'Carnet de Notes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('seating')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-all border ${
              activeTab === 'seating'
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-[#0D9488]" />
            <span>{isAr ? '4. مخطط تنظيم الطاولات' : 'Plan de Classe'}</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="bg-[#F8FAFC] rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: AI LESSON CARD GENERATOR */}
          {activeTab === 'card' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Grade selection */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                    {isAr ? 'المستوى الدراسي' : 'Niveau'}
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0D9488] font-semibold"
                  >
                    <option value="3AP">السنة الثالثة ابتدائي (3AP)</option>
                    <option value="4AP">السنة الرابعة ابتدائي (4AP)</option>
                    <option value="5AP">السنة الخامسة ابتدائي (5AP)</option>
                  </select>
                </div>

                {/* Subject selection */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                    {isAr ? 'المادة الدراسية' : 'Matière'}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0D9488] font-semibold"
                  >
                    {PRIMARY_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.nameAr}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit selection */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                    {isAr ? 'المقطع التعلمي' : 'Séquence'}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0D9488] text-xs font-medium"
                  >
                    {(UNITS_PER_GRADE[grade] || []).map((u, idx) => (
                      <option key={idx} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Title */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                    {isAr ? 'عنوان الدرس / الظاهرة' : 'Sujet de la leçon'}
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: الفاعل وأنواعه / الكسور1"
                    className="w-full bg-white border border-slate-200 rounded-md px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0D9488] font-medium"
                  />
                </div>

              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateLessonCard}
                  disabled={loadingCard}
                  className="px-6 py-2.5 rounded-md bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                >
                  {loadingCard ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري الصياغة التربوية عبر الذكاء الاصطناعي...' : 'Génération en cours...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'صياغة المذكرة التربوية الآن' : 'Générer la Fiche AI'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Result */}
              {generatedCard && (
                <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6 space-y-6 animate-fadeIn shadow-sm">
                  
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {generatedCard.grade} | {generatedCard.subject}
                      </span>
                      <h3 className="text-xl font-bold text-[#1E3A8A] mt-2">
                        {generatedCard.titleAr}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {generatedCard.unit} • الحصة: {generatedCard.durationMinutes} دقيقة
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyCardText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200"
                      >
                        {copiedCard ? <Check className="w-4 h-4 text-[#0D9488]" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCard ? 'تم النسخ!' : 'نسخ النص'}</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة المذكرة</span>
                      </button>
                    </div>
                  </div>

                  {/* Objectives & Means Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-[#F8FAFC] rounded-md border border-slate-200">
                      <h4 className="font-bold text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#0D9488]" />
                        <span>الأهداف التعلمية والمستهدفة:</span>
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {generatedCard.objectives?.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-[#F8FAFC] rounded-md border border-slate-200">
                      <h4 className="font-bold text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0D9488]" />
                        <span>السندات والوسائل التعليمية:</span>
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {generatedCard.didacticMeans?.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 3 Didactic Stages Table */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#1E3A8A]">
                      مراحل وسير الدرس التربوي (3 مراحل):
                    </h4>

                    <div className="space-y-3">
                      {generatedCard.stages?.map((st, i) => (
                        <div key={i} className="p-4 rounded-md bg-[#F8FAFC] border border-slate-200 text-xs space-y-2">
                          <div className="flex justify-between items-center text-[#1E3A8A] font-bold border-b border-slate-200 pb-2">
                            <span>{st.titleAr}</span>
                            <span className="bg-teal-50 text-[#0D9488] px-2 py-0.5 rounded border border-teal-200">{st.timingMinutes} دقيقة</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="font-semibold text-slate-500 block mb-1">نشاط الأستاذ:</span>
                              <p className="text-slate-700 leading-relaxed">{st.teacherActivities}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500 block mb-1">نشاط المتعلم:</span>
                              <p className="text-slate-700 leading-relaxed">{st.studentActivities}</p>
                            </div>
                          </div>

                          <div className="pt-2 text-[11px] text-amber-800 font-medium border-t border-slate-200">
                            استراتيجية التقويم: {st.evaluationStrategy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXAM CREATOR */}
          {activeTab === 'exam' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">المستوى</label>
                  <select
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value as GradeLevel)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 font-semibold"
                  >
                    <option value="3AP">السنة الثالثة (3AP)</option>
                    <option value="4AP">السنة الرابعة (4AP)</option>
                    <option value="5AP">السنة الخامسة (5AP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">المادة</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 font-semibold"
                  >
                    {PRIMARY_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.nameAr}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">الفصل الدراسي</label>
                  <select
                    value={examTerm}
                    onChange={(e) => setExamTerm(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 font-semibold"
                  >
                    <option value={1}>الفصل الأول</option>
                    <option value={2}>الفصل الثاني</option>
                    <option value={3}>الفصل الثالث</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">مجال الاختبار</label>
                  <input
                    type="text"
                    value={examTopic}
                    onChange={(e) => setExamTopic(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3.5 py-2 text-sm text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateExam}
                  disabled={loadingExam}
                  className="px-6 py-2.5 rounded-md bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                >
                  {loadingExam ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إعداد موضوع الاختبار والوضعية الإدماجية...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>إنشاء موضوع الاختبار (الجيل الثاني)</span>
                    </>
                  )}
                </button>
              </div>

              {generatedExam && (
                <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6 space-y-6 animate-fadeIn text-slate-800 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        اختبار الفصل {generatedExam.term} | {generatedExam.grade}
                      </span>
                      <h3 className="text-xl font-bold text-[#1E3A8A] mt-2">{generatedExam.titleAr}</h3>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold rounded-md shadow-sm"
                    >
                      طباعة ورق الاختبار
                    </button>
                  </div>

                  <div className="space-y-4">
                    {generatedExam.exercises?.map((ex, i) => (
                      <div key={i} className="p-4 bg-[#F8FAFC] rounded-md border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between text-[#1E3A8A] font-bold">
                          <span>{ex.title}</span>
                          <span className="text-slate-500">السلم: {ex.points} نقاط</span>
                        </div>
                        <p className="text-slate-700 font-medium">{ex.instruction}</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                          {ex.questions?.map((q, qIdx) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Integration Situation */}
                    {generatedExam.integrationSituation && (
                      <div className="p-5 bg-amber-50 border border-amber-200 rounded-md space-y-3 text-xs">
                        <div className="flex justify-between font-bold text-amber-900 text-sm">
                          <span>الوضعية الإدماجية المركبة</span>
                          <span>08 نقاط</span>
                        </div>
                        <p className="text-amber-950 leading-relaxed font-medium">
                          {generatedExam.integrationSituation.context}
                        </p>
                        <div className="font-bold text-amber-900">التعليمات:</div>
                        <ul className="list-disc list-inside space-y-1 text-amber-950">
                          {generatedExam.integrationSituation.instructions?.map((ins, i) => (
                            <li key={i}>{ins}</li>
                          ))}
                        </ul>

                        {/* Rubric grid */}
                        <div className="pt-2">
                          <span className="font-bold text-amber-900 block mb-1">شبكة المعايير وسلّم التنقيط:</span>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {generatedExam.integrationSituation.rubricGrid?.map((r, i) => (
                              <div key={i} className="bg-white p-2 rounded border border-amber-200 flex justify-between">
                                <span className="text-slate-800">{r.criteria}</span>
                                <span className="font-bold text-[#0D9488]">{r.points} ن</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GRADEBOOK & AVERAGE CALCULATOR */}
          {activeTab === 'grades' && (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-md border border-slate-200 flex flex-wrap justify-between items-center gap-4 text-xs shadow-sm">
                <div>
                  <h4 className="font-bold text-[#1E3A8A] text-sm">حاسبة معدلات التعليم الابتدائي الجزائرية</h4>
                  <p className="text-slate-500">القاعدة الرسمية: (معدل المراقبة المستمرة + علامة الامتحان × 2) ÷ 3</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-teal-50 text-[#0D9488] border border-teal-200 rounded font-bold">
                    معاملات الجيل الثاني مفعلة
                  </span>
                </div>
              </div>

              {/* Add Student Form */}
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-md border border-slate-200 text-xs shadow-sm">
                <div>
                  <label className="block text-[#1E3A8A] font-bold mb-1">اسم التلميذ(ة)</label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="مثال: يونس حمداوي"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[#1E3A8A] font-bold mb-1">التقويم المستمر (10)</label>
                  <input
                    type="number"
                    step="0.25"
                    max="10"
                    min="0"
                    value={newCont}
                    onChange={(e) => setNewCont(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#1E3A8A] font-bold mb-1">علامة الاختبار (10)</label>
                  <input
                    type="number"
                    step="0.25"
                    max="10"
                    min="0"
                    value={newExam}
                    onChange={(e) => setNewExam(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-md transition-colors shadow-sm"
                  >
                    حساب وإضافة لكراس التنقيط
                  </button>
                </div>
              </form>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-xs text-slate-700 text-center">
                  <thead className="bg-slate-100 text-[#1E3A8A] font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-right">اسم التلميذ</th>
                      <th className="p-3">التقويم المستمر</th>
                      <th className="p-3">الاختبار الموحد</th>
                      <th className="p-3 font-extrabold text-[#0D9488]">المعدل الفصلي (/10)</th>
                      <th className="p-3 text-right">ملاحظة الأستاذ التلقائية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-3 text-right font-bold text-slate-900">{st.studentName}</td>
                        <td className="p-3">{st.continuousAssessment.toFixed(2)}</td>
                        <td className="p-3">{st.examScore.toFixed(2)}</td>
                        <td className="p-3 font-bold text-[#0D9488] text-sm bg-teal-50">{st.finalAverage.toFixed(2)}</td>
                        <td className="p-3 text-right font-medium text-[#0D9488]">{st.observationAr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: SEATING PLANNER */}
          {activeTab === 'seating' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-md border border-slate-200 text-xs shadow-sm">
                <div>
                  <h4 className="font-bold text-[#1E3A8A] text-sm">مخطط تنظيم القسم والجلوس الشبه تفاعلي</h4>
                  <p className="text-slate-500">توزيع الطاولات المزدوجة والمجموعات مع شاشة الرؤية</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDesksCount(Math.min(16, desksCount + 2))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 font-bold"
                  >
                    + إضافة طاولتين
                  </button>
                  <button
                    onClick={() => setDesksCount(Math.max(6, desksCount - 2))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 font-bold"
                  >
                    - إنقاص طاولتين
                  </button>
                </div>
              </div>

              {/* Classroom Layout Visual */}
              <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-4">
                <div className="w-full bg-[#1E3A8A] py-2.5 rounded text-center font-bold text-white text-xs shadow-sm">
                  السبورة الرئيسية ومصطبة الأستاذ
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {Array.from({ length: desksCount }).map((_, i) => (
                    <div key={i} className="p-3 bg-[#F8FAFC] rounded-md border border-slate-200 space-y-2 hover:border-[#0D9488] transition-colors">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500">
                        <span>طاولة مزدوجة {i + 1}</span>
                        <span className="text-[#0D9488] font-bold">صف {Math.floor(i/4) + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <div className="bg-white p-2 rounded text-center text-slate-800 border border-slate-200">
                          {students[i % students.length]?.studentName.split(' ')[0] || `تلميذ A${i+1}`}
                        </div>
                        <div className="bg-white p-2 rounded text-center text-slate-800 border border-slate-200">
                          {students[(i + 1) % students.length]?.studentName.split(' ')[0] || `تلميذ B${i+1}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
