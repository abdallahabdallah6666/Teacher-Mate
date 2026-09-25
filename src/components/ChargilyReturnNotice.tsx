import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, Mail, X } from 'lucide-react';
import { Language } from './Navbar';

type Props = { lang: Language };
type PaymentState = 'idle' | 'checking' | 'pending' | 'fulfillment_pending' | 'support_required' | 'paid' | 'failed' | 'error';

export const ChargilyReturnNotice: React.FC<Props> = ({ lang }) => {
  const [state, setState] = useState<PaymentState>('idle');
  const [attempt, setAttempt] = useState(0);
  const [orderId, setOrderId] = useState('');
  const isArabic = lang === 'ar';
  const isFrench = lang === 'fr';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = params.get('chargily_order') || '';
    setOrderId(currentOrderId);
    if (currentOrderId) {
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
        const result = await response.json();
        if (cancelled) return;
        if (result.status === 'paid' && result.emailSent === true) {
          setState('paid');
          return;
        }
        if (result.needsSupport === true) {
          setState('support_required');
          return;
        }
        if (result.status === 'paid') setState('fulfillment_pending');
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

  const title = state === 'paid'
    ? (isArabic ? 'تم الدفع وإرسال الرخصة' : isFrench ? 'Paiement confirmé et licence envoyée' : 'Payment confirmed; license emailed')
    : state === 'failed'
    ? (isArabic ? 'لم يكتمل الدفع' : isFrench ? 'Paiement non terminé' : 'Payment not completed')
    : state === 'fulfillment_pending'
    ? (isArabic ? 'تم تأكيد الدفع' : isFrench ? 'Paiement confirmé' : 'Payment confirmed')
    : state === 'support_required'
    ? (isArabic ? 'تم استلام الدفع' : isFrench ? 'Paiement reçu' : 'Payment received')
    : (isArabic ? 'جارٍ تأكيد الدفع' : isFrench ? 'Confirmation du paiement' : 'Confirming payment');

  const message = state === 'paid'
    ? (isArabic ? 'تم إنشاء مفتاحك في LicenseSeat وإرساله إلى بريدك الإلكتروني. إذا لم تجده، تحقق من مجلد الرسائل غير المرغوب فيها.' : isFrench ? 'Votre clé a été créée dans LicenseSeat et envoyée par e-mail. Vérifiez les courriers indésirables si nécessaire.' : 'Your LicenseSeat key has been created and emailed to you. Check your spam folder if it does not arrive.')
    : state === 'failed'
    ? (isArabic ? 'لم يتم تأكيد الدفع. لم تُصدر أي رخصة. يمكنك المحاولة مجدداً من صفحة الاشتراك.' : isFrench ? 'Le paiement n’a pas été confirmé. Aucune licence n’a été émise. Vous pouvez réessayer depuis la page des abonnements.' : 'Payment was not confirmed, so no license was issued. You can try again from the pricing page.')
    : state === 'fulfillment_pending'
    ? (isArabic ? 'تم تأكيد الدفع. يجري الآن إنشاء الرخصة وإرسالها إلى بريدك الإلكتروني.' : isFrench ? 'Le paiement est confirmé. La licence est en cours de création et sera envoyée par e-mail.' : 'Payment is confirmed. Your license is being created and emailed now.')
    : state === 'support_required'
    ? (isArabic ? `تم استلام دفعتك، لكننا نحتاج إلى مراجعة حالة إصدار الرخصة. لا تدفع مرة أخرى. تواصل مع الدعم وأرسل رقم الطلب: ${orderId}` : isFrench ? `Votre paiement a été reçu, mais la livraison nécessite une vérification. Ne payez pas une seconde fois. Contactez le support avec la référence : ${orderId}` : `Your payment was received, but license delivery needs a check. Please do not pay again. Contact support and provide order reference ${orderId}.`)
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
          <div className="mt-5 flex justify-center text-emerald-700"><Mail className="h-5 w-5" /></div>
        )}

        {(state === 'checking' || state === 'pending' || state === 'fulfillment_pending' || state === 'error') && (
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
