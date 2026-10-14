import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, School, Lock, ArrowRight, ShieldCheck, CheckCircle, UserPlus, CreditCard, AlertTriangle, RefreshCw, ExternalLink, Key, Copy, CheckCircle2 } from 'lucide-react';
import { ALGERIAN_WILAYAS } from '../data/syllabus';
import { UserProfile, GradeLevel, LicensePlan } from '../types';
import { Language } from './Navbar';

interface SignupModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  selectedPlanForCheckout?: LicensePlan | null;
  onSignupSuccess: (user: UserProfile) => void;
  currentUser?: UserProfile | null;
}

type SignupStep = 'form' | 'payment' | 'checkout_ready' | 'paid_success' | 'payment_failed';

export const SignupModal: React.FC<SignupModalProps> = ({
  lang,
  isOpen,
  onClose,
  selectedPlanForCheckout,
  onSignupSuccess,
  currentUser,
}) => {
  const [step, setStep] = useState<SignupStep>(currentUser ? 'payment' : 'form');
  const [fullName, setFullName] = useState<string>(() => currentUser?.fullName || '');
  const [email, setEmail] = useState<string>(() => currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(() => currentUser?.phoneNumber || '');
  const [wilaya, setWilaya] = useState<string>(() => currentUser?.wilaya || '16 - الجزائر');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [primaryGrade, setPrimaryGrade] = useState<GradeLevel>(() => (currentUser?.primaryGrade as GradeLevel) || '4AP');
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const validatePromo = async () => {
    setPromoError(null);
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedPromo(data.promo);
      } else {
        setPromoError('Invalid code');
      }
    } catch (e) {
      setPromoError('Error validating code');
    }
  };


  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string>(() => crypto.randomUUID());
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [activatedLicenseKey, setActivatedLicenseKey] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setStep('payment');
        setFullName(currentUser.fullName || '');
        setEmail(currentUser.email || '');
        setPhoneNumber(currentUser.phoneNumber || '');
        setWilaya(currentUser.wilaya || '16 - الجزائر');
      } else {
        setStep('form');
      }
      setError(null);
      setPaymentError(null);
      setCheckoutUrl('');
      setActivatedLicenseKey('');
      setCheckoutOrderId(crypto.randomUUID());
    }
  }, [isOpen, currentUser]);

  // Polling for payment status when in checkout_ready step
  useEffect(() => {
    if (step !== 'checkout_ready' || !checkoutOrderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/chargily/status/${encodeURIComponent(checkoutOrderId)}`, { cache: 'no-store' });
        if (res.ok) {
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            const data = await res.json();
            if (cancelled) return;

            // Smooth successful payment: enter user directly into client side
            if (data.status === 'paid') {
              const key = data.licenseKey || 'TC-ALG-PRO-8899-X2K1';
              setActivatedLicenseKey(key);

              const activeUser: UserProfile = (data.user && data.user.email) ? data.user : (currentUser ? {
                ...currentUser,
                licenseKey: key,
                licenseStatus: 'active',
                licensePlan: selectedPlanForCheckout?.id || 'pro'
              } : {
                id: `user-${Date.now()}`,
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                phoneNumber,
                wilaya,
                primaryGrade,
                licenseKey: key,
                licenseStatus: 'active',
                licensePlan: selectedPlanForCheckout?.id || 'pro',
                role: 'user',
                createdAt: new Date().toISOString()
              });

              // Forward smoothly into client-side Teacher Hub without delay
              onSignupSuccess(activeUser);
              onClose();
              return;
            }

            // Payment failed or canceled: STOP LOOPING IMMEDIATELY and show error
            if (data.status === 'failed' || data.status === 'canceled' || data.status === 'expired') {
              setPaymentError(
                lang === 'ar'
                  ? 'فشلت عملية الدفع أو رصيد البطاقة غير كافٍ. لم يتم خصم أي مبلغ.'
                  : 'Payment failed or insufficient balance. No charge was made.'
              );
              setStep('payment_failed');
              return; // Stop polling loop
            }
          }
        }
      } catch (err) {
        console.warn('Status poll error:', err);
      }

      attempts += 1;
      if (!cancelled && attempts < 90) {
        timer = setTimeout(pollStatus, 2500);
      }
    };

    timer = setTimeout(pollStatus, 2500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [step, checkoutOrderId, currentUser, email, fullName, onClose, onSignupSuccess, phoneNumber, primaryGrade, selectedPlanForCheckout, wilaya, lang]);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentError(null);

    // Validation
    if (!fullName.trim()) {
      setError(
        lang === 'ar' ? 'يرجى إدخال الاسم واللقب' :
        'Please enter your full name'
      );
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError(
        lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' :
        'Please enter a valid email address'
      );
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      setError(
        lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' :
        'Please enter a valid phone number'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        lang === 'ar' ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' :
        'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        lang === 'ar' ? 'كلمتا المرور غير متطابقتين' :
        'Passwords do not match'
      );
      return;
    }

    // Move to Phase 2: Payment Gateway
    setStep('payment');
  };

  const handleCreateCheckout = async () => {
    setProcessingPayment(true);
    setPaymentError(null);

    try {
      let buyerEmail = email.trim().toLowerCase();
      let buyerName = fullName.trim();
      let buyerWilaya = wilaya;

      if (!currentUser) {
        // Register user first
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: buyerName,
            email: buyerEmail,
            phoneNumber: phoneNumber.trim(),
            wilaya: buyerWilaya,
            password,
            primaryGrade
          })
        });

        const regCt = regRes.headers.get('content-type');
        const regJson = regCt && regCt.includes('application/json') ? await regRes.json() : {};
        if (!regRes.ok || regJson.error) {
          setProcessingPayment(false);
          setStep('form');
          setError(regJson.error || 'Registration failed');
          return;
        }

        if (regJson.user) {
          buyerEmail = regJson.user.email;
          buyerName = regJson.user.fullName;
          buyerWilaya = regJson.user.wilaya;
        }
      } else {
        buyerEmail = currentUser.email;
        buyerName = currentUser.fullName;
        buyerWilaya = currentUser.wilaya;
      }

      const checkoutRes = await fetch('/api/checkout/chargily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForCheckout?.id || 'pro',
          userEmail: buyerEmail,
          userName: buyerName,
          wilaya: buyerWilaya,
          orderId: checkoutOrderId,
          promoCode: promoCode
        })
      });

      const checkoutCt = checkoutRes.headers.get('content-type');
      const checkoutJson = checkoutCt && checkoutCt.includes('application/json') ? await checkoutRes.json() : {};
      if (!checkoutRes.ok || !checkoutJson.checkoutUrl) {
        setPaymentError(checkoutJson.error || (
          lang === 'ar'
            ? 'تعذر بدء الدفع. يرجى المحاولة لاحقاً.'
            : 'Could not start payment. Please try again later.'
        ));
        setProcessingPayment(false);
        return;
      }

      const targetUrl = checkoutJson.checkoutUrl.replace(/^http:\/\//i, 'https://');
      setCheckoutUrl(targetUrl);
      setProcessingPayment(false);
      setStep('checkout_ready');

      // Attempt to open Chargily in a new tab so user avoids iframe X-Frame-Options blocking
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Auto-open tab prevented:', e);
      }

    } catch (err) {
      console.error(err);
      setProcessingPayment(false);
      setPaymentError(
        lang === 'ar' ? 'تعذر الاتصال ببوابة الدفع، يرجى المحاولة لاحقاً' : 'Unable to connect to payment gateway'
      );
    }
  };

  const copyLicense = () => {
    if (!activatedLicenseKey) return;
    navigator.clipboard.writeText(activatedLicenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleFinishActivation = () => {
    const activeUser: UserProfile = currentUser ? {
      ...currentUser,
      licenseKey: activatedLicenseKey,
      licenseStatus: 'active',
      licensePlan: selectedPlanForCheckout?.id || 'pro'
    } : {
      id: `user-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber,
      wilaya,
      primaryGrade,
      licenseKey: activatedLicenseKey,
      licenseStatus: 'active',
      licensePlan: selectedPlanForCheckout?.id || 'pro',
      role: 'user',
      createdAt: new Date().toISOString()
    };

    onSignupSuccess(activeUser);
    onClose();
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
                  {lang === 'ar' ? 'المرحلة 1: إدخال معلومات الأستاذ' : 'Phase 1: Teacher Details'}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#1E3A8A]">
                {lang === 'ar' ? 'اشتراك معلم الإنجليزية - الجزائر' : 'English Teacher Registration'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {lang === 'ar' ? 'املأ بياناتك أدناه ثم انتقل إلى بوابة الدفع الآمنة (Chargily Pay).' : 'Fill in your details and proceed to secure payment.'}
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

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                {lang === 'ar' ? 'الاسم واللقب' : 'Full Name'}
                <span className="text-red-500 ms-0.5">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:left-3 rtl:right-auto pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'ar' ? 'أحمد بلعيد' : 'Ahmed Belaid'}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                />
              </div>
            </div>

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
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
                  {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
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

            {/* Wilaya */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                {lang === 'ar' ? 'الولاية' : 'Wilaya'}
                <span className="text-red-500 ms-0.5">*</span>
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
              >
                {ALGERIAN_WILAYAS.map((w) => (
                  <option key={w.code} value={`${w.code} - ${lang === 'ar' ? w.nameAr : w.nameFr}`}>
                    {w.code} - {lang === 'ar' ? w.nameAr : w.nameFr}
                  </option>
                ))}
              </select>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
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
                  {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
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

            {/* Promo Code */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
                {lang === 'ar' ? 'هل لديك رمز ترويجي؟' : 'Have a Promo Code?'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل الرمز هنا' : 'Enter code here'}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                />
                <button
                  type="button"
                  onClick={validatePromo}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1E3A8A] border border-slate-300 rounded-lg text-xs font-extrabold transition-colors"
                >
                  {lang === 'ar' ? 'تطبيق' : 'Apply'}
                </button>
              </div>
              {promoError && <p className="text-red-500 text-[10px] mt-1 font-bold">{promoError}</p>}
              {appliedPromo && <p className="text-emerald-600 text-[10px] mt-1 font-bold">Code applied! {appliedPromo.discountPercent}% OFF</p>}
            </div>

            {/* Proceed to Payment Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {lang === 'ar' ? 'المتابعة إلى بوابة الدفع (Chargily Pay)' : 'Proceed to Payment (Chargily Pay)'}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: CHARGILY PAY CHECKOUT */}
        {step === 'payment' && (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1E3A8A]">
                {lang === 'ar' ? 'بوابة الدفع الآمنة - Chargily Pay' : 'Secure Payment Gateway'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'سيتم تحويلك إلى صفحة Chargily الآمنة للدفع بالبطاقة الذهبية أو CIB. لن يتم تفعيل الرخصة إلا بعد تأكيد الدفع.'
                  : 'You will be redirected to Chargily’s secure payment page. Your license activates only after payment is confirmed.'}
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-start space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'المستفيد' : 'Customer'}</span>
                <span className="text-xs font-extrabold text-slate-900">{fullName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                <span className="text-xs font-mono text-slate-700">{email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'الخطة المختارة' : 'Plan'}</span>
                <span className="text-xs font-extrabold text-teal-700">
                  {lang === 'ar' ? (selectedPlanForCheckout?.nameAr || 'الرخصة السنوية الشخصية (Personal Yearly License)') : (selectedPlanForCheckout?.nameEn || 'Personal Yearly License')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'المبلغ الإجمالي' : 'Total'}</span>
                <span className="text-base font-black text-slate-900">
                  {appliedPromo 
                    ? Math.round((selectedPlanForCheckout && selectedPlanForCheckout.priceDZD >= 50 ? selectedPlanForCheckout.priceDZD : 2900) * (1 - appliedPromo.discountPercent / 100)).toLocaleString()
                    : (selectedPlanForCheckout && selectedPlanForCheckout.priceDZD >= 50 ? selectedPlanForCheckout.priceDZD : 2900).toLocaleString()
                  } دج / DZD
                  {appliedPromo && <span className="text-[10px] text-emerald-600 block">(-{appliedPromo.discountPercent}%)</span>}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Start the real hosted checkout */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={processingPayment}
                onClick={handleCreateCheckout}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>
                  {lang === 'ar' ? 'المتابعة إلى الدفع الآمن' : 'Continue to secure payment'}
                </span>
              </button>

              <button
                type="button"
                disabled={processingPayment}
                onClick={() => setStep('form')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold underline pt-1"
              >
                {lang === 'ar' ? '← العودة لتعديل المعلومات الشخصية' : '← Back to edit details'}
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: CHARGILY CHECKOUT READY & ACTIVE POLLING */}
        {step === 'checkout_ready' && (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CreditCard className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#1E3A8A]">
                {lang === 'ar' ? 'تم تجهيز رابط الدفع الآمن بنجاح' : 'Secure Payment Link Ready'}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'قم بالدفع بالبطاقة الذهبية أو بطاقة CIB عبر منصة Chargily. سيتم التحقق من الدفع وتفعيل رخصتك تلقائياً دون الحاجة لتحديث الصفحة.'
                  : 'Complete payment via Edahabia or CIB on Chargily. Your license activates automatically upon confirmation.'}
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-4 text-center">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {lang === 'ar' ? 'فتح بوابة الدفع Chargily Pay (البطاقة الذهبية / CIB)' : 'Open Chargily Pay (Edahabia / CIB)'}
                </span>
                <ExternalLink className="w-4 h-4 rtl:rotate-180" />
              </a>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>
                  {lang === 'ar' ? 'في انتظار إتمام الدفع... جاري الفحص التلقائي' : 'Waiting for payment... auto-checking'}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold underline"
              >
                {lang === 'ar' ? '← العودة لمعلومات الطلب' : '← Back to summary'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAID SUCCESS CONFIRMATION & INSTANT LICENSE DISPLAY */}
        {step === 'paid_success' && (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-[#1E3A8A]">
                {lang === 'ar' ? 'تهانينا! تم تفعيل رخصتك بنجاح' : 'Congratulations! License Successfully Activated'}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'تم استلام الدفع وتوليد مفتاح التفعيل الرسمي لبرنامج رفيق المعلم. يمكنك نسخه الآن لتنشيط التطبيق.'
                  : 'Payment received and official license key generated. Copy it below to activate the app.'}
              </p>
            </div>

            {/* License Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-md border border-slate-800 text-start">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1 text-teal-400">
                  <Key className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'مفتاح التفعيل التسلسلي' : 'Serial Activation Key'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-teal-900/60 text-teal-300 font-mono rounded">
                  {lang === 'ar' ? 'صالح لمدة سنة' : 'Valid 1 Year'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800 p-3.5 rounded-xl border border-slate-700 font-mono text-base font-extrabold text-teal-300">
                <span>{activatedLicenseKey}</span>
                <button
                  type="button"
                  onClick={copyLicense}
                  className="px-3 py-1.5 bg-[#0D9488] hover:bg-teal-700 text-white text-xs rounded-lg font-sans font-extrabold transition-all flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishActivation}
              className="w-full py-4 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
            >
              {lang === 'ar' ? 'الدخول إلى فضاء المعلم واستخدام البرنامج' : 'Access Teacher Hub Now'}
            </button>
          </div>
        )}

        {/* STEP 5: PAYMENT FAILED / INSUFFICIENT BALANCE UI */}
        {step === 'payment_failed' && (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-500 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-rose-800">
                {lang === 'ar' ? 'لم تكتمل عملية الدفع' : 'Payment Failed'}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {paymentError || (
                  lang === 'ar'
                    ? 'رصيد البطاقة الذهبية / CIB غير كافٍ أو تم إلغاء المعاملة من البنك. لم يتم اقتطاع أي مبلغ من حسابك.'
                    : 'Insufficient funds or transaction cancelled. No charges were made to your card.'
                )}
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 text-start space-y-1.5 font-medium">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{lang === 'ar' ? 'أسباب شائعة لعدم اكتمال الدفع:' : 'Common reasons for payment failure:'}</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ps-2">
                <li>{lang === 'ar' ? 'رصيد الحساب البريدي أو البنكي أقل من قيمة الاشتراك.' : 'Insufficient card or postal balance.'}</li>
                <li>{lang === 'ar' ? 'خدمة الدفع عبر الإنترنت غير مفعلة على بطاقتك.' : 'Online payment not activated on your card.'}</li>
                <li>{lang === 'ar' ? 'رمز التأكيد OTP المدخل غير مطابق أو انتهت صلاحيته.' : 'Incorrect or expired SMS verification OTP.'}</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  setCheckoutOrderId(crypto.randomUUID());
                  setStep('payment');
                }}
                className="flex-1 py-3.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إعادة المحاولة مجدداً' : 'Retry Payment'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-all"
              >
                {lang === 'ar' ? 'إلغاء وإغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
