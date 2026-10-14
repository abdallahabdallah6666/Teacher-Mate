import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, Mail, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Language } from './Navbar';
import { UserProfile } from '../types';

type Props = {
  lang: Language;
  onPaymentSuccess?: (user: UserProfile) => void;
};
type PaymentState = 'idle' | 'checking' | 'pending' | 'fulfillment_pending' | 'support_required' | 'paid' | 'failed' | 'error';

export const ChargilyReturnNotice: React.FC<Props> = ({ lang, onPaymentSuccess }) => {
  const [state, setState] = useState<PaymentState>('idle');
  const [attempt, setAttempt] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const isArabic = lang === 'ar';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = params.get('chargily_order') || '';
    const hasFailedParam = params.get('payment_failed') === '1' || params.get('failed') === '1';
    setOrderId(currentOrderId);
    if (hasFailedParam) {
      setState('failed');
    } else if (currentOrderId) {
      setState('checking');
    }
  }, []);

  useEffect(() => {
    if (!orderId || state === 'failed' || state === 'paid' || state === 'support_required' || state === 'idle') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/checkout/chargily/status/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const ct = response.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) {
          if (!cancelled) setState('checking');
          return;
        }
        const result = await response.json();
        if (cancelled) return;

        if (result.status === 'failed' || result.status === 'canceled' || result.status === 'expired') {
          setState('failed');
          return; // STOP LOOPING
        }

        if (result.status === 'paid') {
          if (result.licenseKey) setLicenseKey(result.licenseKey);
          if (result.user) setUserData(result.user);
          setState('paid');
          return; // STOP LOOPING
        }
        if (result.needsSupport === true) {
          setState('support_required');
          return; // STOP LOOPING
        }
        setState(response.ok ? 'pending' : 'checking');
      } catch {
        if (!cancelled) setState('error');
      }

      checks += 1;
      if (!cancelled && checks < 30) {
        timer = setTimeout(checkStatus, 2000);
      }
    };

    if (state !== 'failed') {
      void checkStatus();
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, attempt, state]);

  if (state === 'idle') return null;

  const dismiss = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('chargily_order');
    params.delete('payment_failed');
    params.delete('failed');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);

    if (state === 'paid' && userData && onPaymentSuccess) {
      onPaymentSuccess(userData);
    }
    setState('idle');
  };

  const handleContinueToClient = () => {
    dismiss();
  };

  const copyLicense = () => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const title = state === 'paid'
    ? (isArabic ? 'تم تأكيد الدفع وتفعيل رخصتك بنجاح' : 'Payment confirmed & license activated')
    : state === 'failed'
    ? (isArabic ? 'لم يكتمل الدفع' : 'Payment not completed')
    : state === 'fulfillment_pending'
    ? (isArabic ? 'تم تأكيد الدفع' : 'Payment confirmed')
    : state === 'support_required'
    ? (isArabic ? 'تم استلام الدفع' : 'Payment received')
    : (isArabic ? 'جارٍ تأكيد الدفع عبر Chargily Pay' : 'Confirming Chargily payment');

  const message = state === 'paid'
    ? (isArabic ? 'شكراً لاشتراكك! تم استلام الدفع عبر البطاقة الذهبية / CIB وتفعيل رخصتك في نظام Teacher Companion.' : 'Thank you for subscribing! Payment has been confirmed via Edahabia/CIB and your license is now active.')
    : state === 'failed'
    ? (isArabic ? 'لم يتم تأكيد الدفع. لم تُصدر أي رخصة. يمكنك المحاولة مجدداً من صفحة الاشتراك.' : 'Payment was not confirmed, so no license was issued. You can try again from the pricing page.')
    : state === 'fulfillment_pending'
    ? (isArabic ? 'تم تأكيد الدفع. يجري الآن إنشاء الرخصة وتفعيل حسابك.' : 'Payment is confirmed. Your license is being created.')
    : state === 'support_required'
    ? (isArabic ? `تم استلام دفعتك، لكننا نحتاج إلى مراجعة حالة إصدار الرخصة. لا تدفع مرة أخرى. تواصل مع الدعم وأرسل رقم الطلب: ${orderId}` : `Your payment was received, but license delivery needs a check. Please do not pay again. Contact support and provide order reference ${orderId}.`)
    : (isArabic ? 'ننتظر إشعار الدفع من Chargily Pay. يرجى الانتظار لحظات...' : 'Waiting for confirmation from Chargily Pay. Please wait a moment...');

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="chargily-return-title">
        <button onClick={dismiss} aria-label={isArabic ? 'إغلاق' : 'Close'} className="absolute end-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 flex justify-center">
          {state === 'paid' ? <CheckCircle2 className="h-12 w-12 text-emerald-600" /> : state === 'failed' ? <X className="h-12 w-12 text-rose-600" /> : <LoaderCircle className="h-12 w-12 animate-spin text-teal-600" />}
        </div>
        <h2 id="chargily-return-title" className="text-center text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-3 text-center text-sm leading-6 text-slate-600">{message}</p>

        {state === 'paid' && licenseKey && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              {isArabic ? 'مفتاح الرخصة الخاص بك' : 'Your License Key'}
            </span>
            <div className="mt-2 flex items-center justify-center gap-2">
              <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-base font-bold text-slate-900 shadow-sm border border-emerald-200">
                {licenseKey}
              </code>
              <button
                type="button"
                onClick={copyLicense}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                {copied
                  ? (isArabic ? 'تم النسخ!' : 'Copied!')
                  : (isArabic ? 'نسخ' : 'Copy')}
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-700">
              {isArabic
                ? 'احتفظ بهذا المفتاح، ويمكنك إدخاله في البرنامج في أي وقت'
                : 'Keep this key safe to activate in the app whenever needed'}
            </p>
          </div>
        )}

        {(state === 'checking' || state === 'pending' || state === 'fulfillment_pending' || state === 'error') && (
          <button onClick={() => setAttempt(value => value + 1)} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
            {isArabic ? 'التحقق من الحالة مجدداً' : 'Check status again'}
          </button>
        )}
        <button onClick={handleContinueToClient} className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold bg-[#0D9488] text-white hover:bg-teal-700 shadow transition-all">
          {state === 'paid' ? (isArabic ? 'الدخول إلى حسابي وفضاء المعلم الآن' : 'Enter My Teacher Account Now') : (isArabic ? 'إغلاق النافذة' : 'Close')}
        </button>
      </section>
    </div>
  );
};

export default ChargilyReturnNotice;
