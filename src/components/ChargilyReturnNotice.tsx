import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, LoaderCircle, X } from 'lucide-react';
import { Language } from './Navbar';

type Props = { lang: Language };
type PaymentState = 'idle' | 'checking' | 'pending' | 'paid' | 'failed' | 'error';

export const ChargilyReturnNotice: React.FC<Props> = ({ lang }) => {
  const [state, setState] = useState<PaymentState>('idle');
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [orderId, setOrderId] = useState('');
  const isArabic = lang === 'ar';
  const isFrench = lang === 'fr';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = params.get('chargily_order') || '';
    setOrderId(currentOrderId);
    if (params.get('payment_failed') === '1') {
      setState('failed');
    } else if (currentOrderId) {
      setState('checking');
    }
  }, []);

  useEffect(() => {
    if (!orderId || state === 'failed' || state === 'paid' || state === 'idle') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/checkout/chargily/status/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const result = await response.json();
        if (cancelled) return;
        if (result.status === 'paid' && result.licenseKey) {
          setLicenseKey(result.licenseKey);
          setState('paid');
          return;
        }
        if (result.status === 'failed') {
          setState('failed');
          return;
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

    setState('checking');
    void checkStatus();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, attempt]);

  if (state === 'idle') return null;

  const dismiss = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('chargily_order');
    params.delete('payment_failed');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    setState('idle');
  };

  const copyKey = async () => {
    if (!licenseKey) return;
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const title = state === 'paid'
    ? (isArabic ? 'تم تأكيد الدفع' : isFrench ? 'Paiement confirmé' : 'Payment confirmed')
    : state === 'failed'
    ? (isArabic ? 'لم يكتمل الدفع' : isFrench ? 'Paiement non terminé' : 'Payment not completed')
    : (isArabic ? 'جارٍ تأكيد الدفع' : isFrench ? 'Confirmation du paiement' : 'Confirming payment');

  const message = state === 'paid'
    ? (isArabic ? 'وصل تأكيد Chargily الآمن. احتفظ بمفتاح التفعيل أدناه، ثم سجّل الدخول باستخدام البريد وكلمة المرور اللذين أنشأتهما.' : isFrench ? 'Chargily a confirmé le paiement. Conservez votre clé ci-dessous, puis connectez-vous avec l’adresse e-mail et le mot de passe créés.' : 'Chargily confirmed your payment. Save the activation key below, then sign in with the email and password you created.')
    : state === 'failed'
    ? (isArabic ? 'لم يتم تأكيد الدفع. لم تُصدر أي رخصة. يمكنك المحاولة مجدداً من صفحة الاشتراك.' : isFrench ? 'Le paiement n’a pas été confirmé. Aucune licence n’a été émise. Vous pouvez réessayer depuis la page des abonnements.' : 'Payment was not confirmed, so no license was issued. You can try again from the pricing page.')
    : (isArabic ? 'ننتظر إشعار الدفع الموقّع من Chargily. لا تغلق الصفحة؛ لا يتم إصدار الرخصة قبل وصول التأكيد.' : isFrench ? 'Nous attendons la notification signée de Chargily. Gardez cette page ouverte ; la licence ne sera émise qu’après confirmation.' : 'Waiting for Chargily’s signed payment notification. Keep this page open; a license is issued only after confirmation.');

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="chargily-return-title">
        <button onClick={dismiss} aria-label={isArabic ? 'إغلاق' : isFrench ? 'Fermer' : 'Close'} className="absolute end-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 flex justify-center">
          {state === 'paid' ? <CheckCircle2 className="h-12 w-12 text-emerald-600" /> : state === 'failed' ? <X className="h-12 w-12 text-rose-600" /> : <LoaderCircle className="h-12 w-12 animate-spin text-teal-600" />}
        </div>
        <h2 id="chargily-return-title" className="text-center text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-3 text-center text-sm leading-6 text-slate-600">{message}</p>

        {state === 'paid' && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <code className="break-all font-mono text-sm font-bold tracking-wide text-slate-900">{licenseKey}</code>
            <button onClick={copyKey} className="shrink-0 rounded-md p-2 text-teal-700 hover:bg-white" aria-label={copied ? 'Copied' : 'Copy license key'}>
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}

        {(state === 'checking' || state === 'pending' || state === 'error') && (
          <button onClick={() => setAttempt(value => value + 1)} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
            {isArabic ? 'التحقق من الحالة مجدداً' : isFrench ? 'Vérifier à nouveau' : 'Check status again'}
          </button>
        )}
        <button onClick={dismiss} className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          {state === 'paid' ? (isArabic ? 'تم' : isFrench ? 'Terminé' : 'Done') : (isArabic ? 'إغلاق' : isFrench ? 'Fermer' : 'Close')}
        </button>
      </section>
    </div>
  );
};

export default ChargilyReturnNotice;
