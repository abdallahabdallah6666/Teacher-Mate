import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, School, Lock, ArrowRight, ShieldCheck, CheckCircle, UserPlus, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { ALGERIAN_WILAYAS } from '../data/syllabus';
import { UserProfile, GradeLevel, LicensePlan } from '../types';
import { Language } from './Navbar';

interface SignupModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  selectedPlanForCheckout?: LicensePlan | null;
  onSignupSuccess: (user: UserProfile) => void;
}

type SignupStep = 'form' | 'payment' | 'success';

export const SignupModal: React.FC<SignupModalProps> = ({
  lang,
  isOpen,
  onClose,
  selectedPlanForCheckout,
  onSignupSuccess,
}) => {
  const [step, setStep] = useState<SignupStep>('form');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [wilaya, setWilaya] = useState<string>('16 - الجزائر');
  const [schoolName, setSchoolName] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>('فيسبوك / مواقع التواصل');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [primaryGrade, setPrimaryGrade] = useState<GradeLevel>('4AP');

  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError(null);
      setPaymentError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentError(null);

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError(
        lang === 'ar' ? 'يرجى إدخال الاسم واللقب' :
        lang === 'fr' ? 'Veuillez saisir le nom et le prénom' :
        'Please enter your first and last name'
      );
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError(
        lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' :
        lang === 'fr' ? 'Veuillez saisir une adresse e-mail valide' :
        'Please enter a valid email address'
      );
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      setError(
        lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' :
        lang === 'fr' ? 'Veuillez saisir un numéro de téléphone valide' :
        'Please enter a valid phone number'
      );
      return;
    }

    if (!schoolName.trim()) {
      setError(
        lang === 'ar' ? 'يرجى إدخال اسم المدرسة الابتدائية' :
        lang === 'fr' ? 'Veuillez saisir le nom de l\'école primaire' :
        'Please enter your primary school name'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        lang === 'ar' ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' :
        lang === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' :
        'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        lang === 'ar' ? 'كلمتا المرور غير متطابقتين' :
        lang === 'fr' ? 'Les mots de passe ne correspondent pas' :
        'Passwords do not match'
      );
      return;
    }

    // Move to Phase 2: Payment Gateway
    setStep('payment');
  };

  const handleCompletePayment = async (success: boolean) => {
    setProcessingPayment(true);
    setPaymentError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // 1. Register User in backend
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName,
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          wilaya,
          schoolName: schoolName.trim(),
          referralSource,
          password,
          primaryGrade
        })
      });

      const regJson = await regRes.json();
      if (!regRes.ok || regJson.error) {
        setProcessingPayment(false);
        setStep('form');
        setError(regJson.error || 'Registration failed');
        return;
      }

      const registeredUser: UserProfile = regJson.user;
      setCreatedUser(registeredUser);

      // 2. Call Chargily Checkout with success or failure status
      const checkoutRes = await fetch('/api/checkout/chargily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForCheckout?.id || 'pro',
          userEmail: registeredUser.email,
          userName: registeredUser.fullName,
          wilaya: registeredUser.wilaya,
          paymentStatus: success ? 'paid' : 'failed'
        })
      });

      const checkoutJson = await checkoutRes.json();

      if (!success || !checkoutRes.ok) {
        // Payment failed: Go back to form with data prefilled and payment failed message
        setProcessingPayment(false);
        setStep('form');
        setPaymentError(
          lang === 'ar'
            ? 'فشل الدفع! تم رفض معاملة البطاقة الذهبية / CIB أو إلغاؤها. يرجى المحاولة مرة أخرى.'
            : lang === 'fr'
            ? 'Échec du paiement ! Transaction refusée ou annulée. Veuillez réessayer.'
            : 'Payment failed! Transaction declined or cancelled. Please try again.'
        );
        return;
      }

      // Payment successful: Show success step then enter User Hub
      setStep('success');
      setTimeout(() => {
        onSignupSuccess(registeredUser);
      }, 1500);

    } catch (err) {
      console.error(err);
      setProcessingPayment(false);
      setStep('form');
      setPaymentError(
        lang === 'ar' ? 'تعذر الاتصال ببوابة الدفع، يرجى المحاولة لاحقاً' : 'Unable to connect to payment gateway'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative space-y-5 text-slate-800 shadow-2xl animate-fadeIn my-8">
        
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading || processingPayment}
          className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: FORM DATA */}
        {step === 'form' && (
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            
            <div className="text-center space-y-1.5 pb-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0D9488] border border-teal-200 text-[11px] font-extrabold rounded-full">
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar' && 'المرحلة 1: إدخال معلومات الأستاذ'}
                  {lang === 'fr' && 'Étape 1: Informations de l\'enseignant'}
                  {lang === 'en' && 'Phase 1: Teacher Details'}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#1E3A8A]">
                {lang === 'ar' && 'اشتراك معلم الإنجليزية - الجزائر'}
                {lang === 'fr' && 'Inscription Enseignant d\'Anglais'}
                {lang === 'en' && 'English Teacher Registration'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {lang === 'ar' && 'املأ بياناتك أدناه ثم انتقل إلى بوابة الدفع الآمنة (Chargily Pay).'}
                {lang === 'fr' && 'Remplissez vos informations puis passez au paiement sécurisé.'}
                {lang === 'en' && 'Fill in your details and proceed to secure payment.'}
              </p>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                {error}
              </div>
            )}

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'الاسم الأول'}
                  {lang === 'fr' && 'Prénom'}
                  {lang === 'en' && 'First Name'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={lang === 'ar' ? 'أحمد' : 'Ahmed'}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'اللقب'}
                  {lang === 'fr' && 'Nom de famille'}
                  {lang === 'en' && 'Last Name'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={lang === 'ar' ? 'بلعيد' : 'Belaid'}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'البريد الإلكتروني'}
                  {lang === 'fr' && 'Adresse e-mail'}
                  {lang === 'en' && 'Email Address'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@education.dz"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'رقم الهاتف'}
                  {lang === 'fr' && 'Numéro de téléphone'}
                  {lang === 'en' && 'Phone Number'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0661234567"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            </div>

            {/* Wilaya & School Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'الولاية'}
                  {lang === 'fr' && 'Wilaya'}
                  {lang === 'en' && 'Wilaya'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w.code} value={`${w.code} - ${lang === 'fr' ? w.nameFr : w.nameAr}`}>
                      {w.code} - {lang === 'fr' ? w.nameFr : w.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'اسم المدرسة الابتدائية'}
                  {lang === 'fr' && 'École primaire'}
                  {lang === 'en' && 'Primary School'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مدرسة الأمير عبد القادر' : 'École Émir Abdelkader'}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            </div>

            {/* Referral Source */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                {lang === 'ar' && 'كيف سمعت عنا؟'}
                {lang === 'fr' && 'Comment nous avez-vous connus?'}
                {lang === 'en' && 'How did you hear about us?'}
                <span className="text-red-500 ms-0.5">*</span>
              </label>
              <select
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
              >
                <option value="فيسبوك / مواقع التواصل">
                  {lang === 'ar' ? 'فيسبوك / شبكات التواصل الاجتماعي' : 'Facebook / Social Media'}
                </option>
                <option value="مجموعات التليغرام التعليمية">
                  {lang === 'ar' ? 'مجموعات التليغرام لأساتذة الإنجليزية' : 'Telegram Teacher Groups'}
                </option>
                <option value="توصية من زميل أستاذ">
                  {lang === 'ar' ? 'توصية من زميل أستاذ' : 'Colleague / Teacher Recommendation'}
                </option>
                <option value="المفتش التربوي">
                  {lang === 'ar' ? 'توجيهات المفتش التربوي' : 'Educational Inspector'}
                </option>
              </select>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'كلمة المرور'}
                  {lang === 'fr' && 'Mot de passe'}
                  {lang === 'en' && 'Password'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' && 'تأكيد كلمة المرور'}
                  {lang === 'fr' && 'Confirmer mot de passe'}
                  {lang === 'en' && 'Confirm Password'}
                  <span className="text-red-500 ms-0.5">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {lang === 'ar' && 'المتابعة إلى بوابة الدفع (Chargily Pay)'}
                  {lang === 'fr' && 'Passer au paiement (Chargily Pay)'}
                  {lang === 'en' && 'Proceed to Payment (Chargily Pay)'}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: PAYMENT GATEWAY (CHARGILY PAY) */}
        {step === 'payment' && (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1E3A8A]">
                {lang === 'ar' && 'بوابة الدفع الآمنة - Chargily Pay'}
                {lang === 'fr' && 'Passerelle de Paiement Sécurisée'}
                {lang === 'en' && 'Secure Payment Gateway'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'ar' && 'اختر طريقة المحاكاة لإتمام عملية الدفع بالبطاقة الذهبية أو CIB وتفعيل حسابك الفوري.'}
                {lang === 'fr' && 'Simulez le paiement Edahabia / CIB pour activer votre compte.'}
                {lang === 'en' && 'Simulate Edahabia / CIB payment to activate your account.'}
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-start space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'المستفيد' : 'Customer'}</span>
                <span className="text-xs font-extrabold text-slate-900">{firstName} {lastName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                <span className="text-xs font-mono text-slate-700">{email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'الخطة المختارة' : 'Plan'}</span>
                <span className="text-xs font-extrabold text-teal-700">
                  {selectedPlanForCheckout?.nameAr || 'الاشتراك السنوي الشامل'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'المبلغ الإجمالي' : 'Total'}</span>
                <span className="text-base font-black text-slate-900">
                  {selectedPlanForCheckout ? selectedPlanForCheckout.priceDZD.toLocaleString() : '2,900'} دج / DZD
                </span>
              </div>
            </div>

            {/* Payment simulation action buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={processingPayment}
                onClick={() => handleCompletePayment(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>
                  {lang === 'ar' && 'إتمام الدفع بنجاح (بطاقة الذهبية / CIB - تفعيل فوري)'}
                  {lang === 'fr' && 'Payer avec succès (Edahabia / CIB)'}
                  {lang === 'en' && 'Complete Successful Payment'}
                </span>
              </button>

              <button
                type="button"
                disabled={processingPayment}
                onClick={() => handleCompletePayment(false)}
                className="w-full py-3.5 bg-red-600/10 hover:bg-red-600/20 text-red-700 border border-red-300 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {lang === 'ar' && 'محاكاة فشل أو إلغاء الدفع (اختبار الخطأ)'}
                  {lang === 'fr' && 'Simuler un échec de paiement'}
                  {lang === 'en' && 'Simulate Payment Failure'}
                </span>
              </button>

              <button
                type="button"
                disabled={processingPayment}
                onClick={() => setStep('form')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold underline pt-1"
              >
                {lang === 'ar' && '← العودة لتعديل المعلومات الشخصية'}
                {lang === 'fr' && '← Modifier les informations'}
                {lang === 'en' && '← Back to edit details'}
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="py-10 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1E3A8A]">
              {lang === 'ar' && 'تم الدفع بنجاح وتفعيل الرخصة!'}
              {lang === 'fr' && 'Paiement réussi et licence activée!'}
              {lang === 'en' && 'Payment Successful & License Activated!'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {lang === 'ar' && 'جاري توجيهك إلى Hub الأساتذة وعرض مفتاح التفعيل الخاص بك...'}
              {lang === 'fr' && 'Redirection vers le Hub Enseignant...'}
              {lang === 'en' && 'Redirecting you to Teacher Hub...'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

