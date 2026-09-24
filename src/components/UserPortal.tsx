import React, { useState, useEffect } from 'react';
import { Download, Key, Send, CheckCircle2, Clock, MessageSquare, Monitor, HardDrive, Laptop, ShieldCheck, RefreshCw, Copy, Check, LifeBuoy } from 'lucide-react';
import { UserProfile, SupportInquiry, LicenseRecord } from '../types';

interface UserPortalProps {
  isAr: boolean;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenLicense: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  isAr,
  user,
  onOpenAuth,
  onOpenLicense,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'license' | 'inquiries'>('downloads');
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState<boolean>(false);

  // New ticket form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportInquiry['category']>('استفسار عن التفعيل');
  const [message, setMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch inquiries when user is logged in
  useEffect(() => {
    if (user) {
      fetchUserInquiries();
    }
  }, [user]);

  const fetchUserInquiries = async () => {
    if (!user) return;
    setLoadingInquiries(true);
    try {
      const res = await fetch(`/api/inquiries?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setSubmittingInquiry(true);
    setInquirySuccess(false);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.fullName,
          wilaya: user.wilaya,
          subject,
          category,
          message,
        })
      });
      const data = await res.json();
      if (data.success) {
        setInquirySuccess(true);
        setSubject('');
        setMessage('');
        fetchUserInquiries();
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleCopyKey = () => {
    if (user?.licenseKey) {
      navigator.clipboard.writeText(user.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (!user) {
    return (
      <section id="portal" className="py-16 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center mx-auto shadow-sm">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1E3A8A]">
            {isAr ? 'بوابة الأساتذة والعملاء المشتركين' : 'Espace Enseignant / Espace Client'}
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'يرجى تسجيل الدخول أو إنشاء حساب أستاذ جديد للوصول لتنزيلات تطبيق سطح المكتب (Desktop App)، عرض مفتاح التفعيل، وإرسال الاستفسارات لفريق الدعم.'
              : 'Veuillez vous connecter pour accéder aux téléchargements, gérer votre licence et contacter le support.'}
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-sm rounded-md shadow-md transition-all"
          >
            {isAr ? 'تسجيل الدخول / إنشاء حساب أستاذ' : 'Se Connecter / S\'inscrire'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="portal" className="py-16 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* User Portal Header Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-[#0D9488] font-bold text-xs">
                {user.role === 'admin' ? 'حساب المشرف (Admin)' : 'حساب أستاذ مسجل'}
              </span>
              <span className="text-xs text-slate-500 font-medium">الولاية: {user.wilaya}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1E3A8A]">{user.fullName}</h2>
            <p className="text-xs text-slate-600">
              البريد: <span className="font-mono text-slate-800">{user.email}</span> • المدرسة: {user.schoolName || 'الابتدائية'} • المستوى: {user.primaryGrade}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#F8FAFC] p-4 rounded-md border border-slate-200">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">حالة الرخصة:</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${user.licenseStatus === 'active' ? 'bg-[#0D9488]' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold text-[#1E3A8A]">
                  {user.licenseStatus === 'active' ? 'رخصة نشطة (Pro DZ)' : 'فترة تجريبية'}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenLicense}
              className="px-3 py-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs rounded shadow-sm mr-2"
            >
              تنشيط مفتاح
            </button>
          </div>
        </div>

        {/* Portal Tabs Navigation */}
        <div className="border-b border-slate-200 flex items-center gap-4 text-sm font-bold">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'downloads'
                ? 'border-[#0D9488] text-[#0D9488]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تنزيل برنامج سطح المكتب' : 'Téléchargements App'}</span>
          </button>

          <button
            onClick={() => setActiveTab('license')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'license'
                ? 'border-[#0D9488] text-[#0D9488]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isAr ? 'مفتاح التفعيل والتراخيص' : 'Ma Licence & Clés'}</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'inquiries'
                ? 'border-[#0D9488] text-[#0D9488]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isAr ? 'الدعم الفني والرسائل' : 'Support & Inquiries'}</span>
            {inquiries.filter(i => i.status === 'replied').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            )}
          </button>
        </div>

        {/* TAB 1: DOWNLOADS */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1E3A8A]">
                    {isAr ? 'تحميل تطبيق "رفيق المعلم" لسطح المكتب (v2.4.0)' : 'Télécharger Teacher Companion v2.4.0'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAr ? 'يعمل أوفلاين 100% دون الحاجة إلى إنترنت بعد التثبيت والتفعيل الأول' : 'Fonctionne à 100% Hors-ligne'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-md">
                  تحديث أوت 2026 جاهز
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Windows Package */}
                <div className="p-5 bg-[#F8FAFC] rounded-lg border border-teal-200 space-y-4 hover:border-[#0D9488] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-[#0D9488] rounded-md border border-teal-200">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E3A8A]">Windows Installer (.exe)</h4>
                      <p className="text-[11px] text-slate-500">Windows 10 / 11 (64-bit) • 128 MB</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• يتضمن جميع القوالب والسندات الرسمية</li>
                    <li>• تنصيب تلقائي سريع بأقل من دقيقة</li>
                  </ul>
                  <a
                    href="#download-exe"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('جاري تنزيل برنامج Teacher_Companion_v2.4_Setup.exe...');
                    }}
                    className="w-full py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل مثبت Windows</span>
                  </a>
                </div>

                {/* Portable USB Package */}
                <div className="p-5 bg-[#F8FAFC] rounded-lg border border-slate-200 space-y-4 hover:border-[#0D9488] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-[#1E3A8A] rounded-md border border-blue-200">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E3A8A]">النسخة المحمولة (Portable ZIP)</h4>
                      <p className="text-[11px] text-slate-500">تشغيل مباشرة من الفلاش ديسك • 145 MB</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• مناسبة لجميع أجهزة المدارس بدون صلاحيات مشرف</li>
                    <li>• حفظ البيانات مباشرة على الفلاش الميموري</li>
                  </ul>
                  <a
                    href="#download-zip"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('جاري تنزيل ملف Teacher_Companion_v2.4_Portable.zip...');
                    }}
                    className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل ZIP المحمول</span>
                  </a>
                </div>

                {/* Mac DMG Package */}
                <div className="p-5 bg-[#F8FAFC] rounded-lg border border-slate-200 space-y-4 hover:border-[#0D9488] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1E3A8A]">macOS Package (.dmg)</h4>
                      <p className="text-[11px] text-slate-500">Apple Silicon M1/M2/M3 & Intel • 150 MB</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• دعم شاشات الرتينا العالية الدقة</li>
                    <li>• دعم التصدير المباشر ببرامج Apple PDF</li>
                  </ul>
                  <a
                    href="#download-dmg"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('جاري تنزيل ملف Teacher_Companion_v2.4_macOS.dmg...');
                    }}
                    className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل macOS (.dmg)</span>
                  </a>
                </div>

              </div>
            </div>

            {/* Offline Activation Quick Guide */}
            <div className="bg-[#F8FAFC] p-5 rounded-lg border border-slate-200 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-[#1E3A8A] text-sm">
                <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                <span>كيفية تفعيل البرنامج أوفلاين في المدرسة:</span>
              </div>
              <p>1. قم بتنصيب تطبيق "Teacher Companion" على حاسوبك الشخصي أو حاسوب القسم.</p>
              <p>2. افتح التطبيق، واضغط على خيار "تفعيل الرخصة".</p>
              <p>3. أدخل مفتاح التفعيل الخاص بك الظاهر في تبويب "مفتاح التفعيل والتراخيص".</p>
              <p>4. سيتعرّف التطبيق على الرخصة ويحفظ ملف التفعيل المحلي فورياً ويعمل للأبد بدون حاجتك للإنترنت.</p>
            </div>
          </div>
        )}

        {/* TAB 2: MY LICENSE */}
        {activeTab === 'license' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-[#1E3A8A]">
                {isAr ? 'مفتاح التفعيل المرتبط بحسابك' : 'Votre Clé d\'Activation Active'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'مفتاح تسلسلي يتكون من 16 رمزا مخصصا لتنشيط البرنامج أوفلاين' : 'Clé de licence à 16 caractères pour l\'activation de l\'application PC'}
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-medium">مفتاح التفعيل الخاص بك:</div>
                  <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#1E3A8A] tracking-wider mt-1">
                    {user.licenseKey || 'TC-ALG-PRO-8899-X2K1'}
                  </div>
                </div>

                <button
                  onClick={handleCopyKey}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-[#1E3A8A] font-bold text-xs rounded-md border border-slate-300 shadow-sm flex items-center gap-2 w-fit"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-4 h-4 text-[#0D9488]" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>نسخ المفتاح</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">نوع الخطة:</span>
                  <span className="font-bold text-slate-800">خطة المحترفين (Pro DZ)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">حالة التفعيل:</span>
                  <span className="font-bold text-[#0D9488]">نشطة ومفعلة</span>
                </div>
                <div>
                  <span className="text-slate-500 block">تاريخ الانتهاء:</span>
                  <span className="font-bold text-slate-800">01 سبتمبر 2027</span>
                </div>
                <div>
                  <span className="text-slate-500 block">الأجهزة المسموحة:</span>
                  <span className="font-bold text-slate-800">حاسوبان (2 PCs)</span>
                </div>
              </div>

            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onOpenLicense}
                className="px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs rounded-md shadow-sm"
              >
                تنشيط مفتاح جديد أو تمديد الاشتراك
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPORT & INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* New Inquiry Form */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-[#1E3A8A]">
                {isAr ? 'إرسال استفسار أو تذكرة دعم' : 'Envoyer une Demande d\'Assistance'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'يتلقى فريق الدعم البيداغوجي والفني رسائلك ويجيب عليها خلال أقل من 24 ساعة' : 'Notre équipe vous répond sous 24h'}
              </p>

              {inquirySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span>تم إرسال استفسارك بنجاح! سيتم إخطارك بالرد هنا.</span>
                </div>
              )}

              <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">نوع الاستفسار</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0D9488]"
                  >
                    <option value="استفسار عن التفعيل">استفسار عن التفعيل والدفع</option>
                    <option value="مشكلة في البرنامج">مساعدة فنية في تثبيت أو تشغيل البرنامج</option>
                    <option value="اقتراح ميزة جديدة">اقتراح ميزة أو إضافة بيداغوجية</option>
                    <option value="طلب فترات تدريبية">طلب دليل أو تدريب مخصص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">موضوع الرسالة</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: كيفية تصدير ملفات تقييم المكتسبات"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E3A8A] mb-1">تفاصيل الاستفسار</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك بالتفصيل..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingInquiry ? 'جاري الإرسال...' : 'إرسال الاستفسار'}</span>
                </button>
              </form>
            </div>

            {/* Inquiries History */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-[#1E3A8A]">
                  {isAr ? 'سجل الاستفسارات والردود' : 'Historique de vos Demandes'}
                </h3>
                <button
                  onClick={fetchUserInquiries}
                  className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900"
                  title="تحديث"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInquiries ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {inquiries.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>لم تقم بإرسال أي استفسار حتى الآن.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#1E3A8A] border border-blue-200 font-bold rounded">
                            {inq.category}
                          </span>
                          <h4 className="text-sm font-bold text-[#1E3A8A] mt-1">{inq.subject}</h4>
                          <p className="text-[11px] text-slate-500">
                            تاريخ الإرسال: {new Date(inq.createdAt).toLocaleDateString('ar-DZ')}
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded border ${
                          inq.status === 'replied'
                            ? 'bg-teal-50 border-teal-200 text-[#0D9488]'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {inq.status === 'replied' ? 'تم الرد' : 'قيد المراجعة'}
                        </span>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-200 text-xs text-slate-700">
                        {inq.message}
                      </div>

                      {/* Admin Reply Panel */}
                      {inq.adminReply && (
                        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-md text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-[#0D9488]">
                            <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                            <span>رد فريق الدعم الفني:</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed pr-5">{inq.adminReply}</p>
                          {inq.repliedAt && (
                            <div className="text-[10px] text-slate-500 pr-5">
                              {new Date(inq.repliedAt).toLocaleDateString('ar-DZ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
