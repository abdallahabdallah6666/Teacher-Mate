import React, { useState } from 'react';
import { X, Key, CheckCircle2, CreditCard, Copy, Check } from 'lucide-react';
import { LicensePlan } from '../types';
import { Language } from './Navbar';

interface LicenseActivationModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  selectedPlanForCheckout?: LicensePlan | null;
  onLicenseActivated: (key: string) => void;
}

export const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({
  lang,
  isOpen,
  onClose,
  selectedPlanForCheckout,
  onLicenseActivated,
}) => {
  const [licenseInput, setLicenseInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput) return;

    setLoading(true);
    try {
      const res = await fetch('/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseInput })
      });

      const json = await res.json();
      if (json.valid) {
        onLicenseActivated(json.licenseKey);
        alert(
          lang === 'ar' ? 'تم تفعيل البرنامج بنجاح! شكراً لاستخدامك Teacher Companion' :
          lang === 'fr' ? 'Activation réussie! Merci d\'utiliser Teacher Companion' :
          'Software activated successfully! Thank you for using Teacher Companion'
        );
        onClose();
      } else {
        alert(
          json.message || (
            lang === 'ar' ? 'مفتاح التفعيل غير صحيح' :
            lang === 'fr' ? 'Clé d\'activation invalide' :
            'Invalid activation key'
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert(
        lang === 'ar' ? 'تعذر التحقق من مفتاح الرخصة' :
        lang === 'fr' ? 'Impossible de vérifier la clé' :
        'Unable to verify activation key'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateChargilyCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/chargily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForCheckout?.id || 'pro',
          userEmail: 'teacher.dz@education.dz'
        })
      });

      const json = await res.json();
      if (json.success && json.licenseKey) {
        setPurchasedKey(json.licenseKey);
        onLicenseActivated(json.licenseKey);
      } else {
        alert(
          lang === 'ar' ? 'تعذر إنشاء طلب الدفع' :
          lang === 'fr' ? 'Impossible d\'initier le paiement' :
          'Failed to initialize checkout'
        );
      }
    } catch (err) {
      console.error(err);
      alert(
        lang === 'ar' ? 'خطأ أثناء معالجة عملية الشراء' :
        lang === 'fr' ? 'Erreur lors du traitement de l\'achat' :
        'Error processing purchase'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!purchasedKey) return;
    navigator.clipboard.writeText(purchasedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 sm:p-8 relative space-y-6 text-slate-800 shadow-xl animate-fadeIn">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#1E3A8A]">
            {selectedPlanForCheckout
              ? (lang === 'ar' ? 'الشراء والدفع الإلكتروني' : lang === 'fr' ? 'Abonnement et Paiement' : 'Checkout & Subscription')
              : (lang === 'ar' ? 'تفعيل رخصة برنامج Teacher Companion' : lang === 'fr' ? 'Activation de licence Teacher Companion' : 'Activate Teacher Companion License')
            }
          </h3>
          <p className="text-xs text-slate-500">
            {selectedPlanForCheckout
              ? (lang === 'ar' ? `الخطة المختارة: ${selectedPlanForCheckout.nameAr}` : lang === 'fr' ? `Formule: ${selectedPlanForCheckout.nameFr}` : `Plan: Full Annual Subscription`)
              : (lang === 'ar' ? 'أدخل مفتاح التفعيل التسلسلي' : lang === 'fr' ? 'Entrez votre clé d\'activation à 16 caractères' : 'Enter your 16-character serial key')
            }
          </p>
        </div>

        {/* If user clicked "Buy" on a plan, show checkout panel */}
        {selectedPlanForCheckout && !purchasedKey ? (
          <div className="bg-[#F8FAFC] p-5 rounded-lg border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-slate-600">
                {lang === 'ar' ? 'القيمة الإجمالية:' : lang === 'fr' ? 'Montant Total:' : 'Total Amount:'}
              </span>
              <span className="text-xl font-extrabold text-[#0D9488]">2,900 دج / DZD</span>
            </div>

            <div className="space-y-2 text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                <span>
                  {lang === 'ar' ? 'قبول فوري بالبطاقة الذهبية بريد الجزائر' : lang === 'fr' ? 'Paiement Carte Edahabia' : 'Edahabia Card Payment'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                <span>
                  {lang === 'ar' ? 'قبول جميع البطاقات البنكية CIB' : lang === 'fr' ? 'Paiement Carte CIB' : 'CIB Bank Card Payment'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                <span>
                  {lang === 'ar' ? 'توليد تلقائي لمفتاح التفعيل فور نجاح عملية الدفع' : lang === 'fr' ? 'Clé d\'activation générée instantanément' : 'Instant activation key generation'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSimulateChargilyCheckout}
              disabled={loading}
              className="w-full py-3 rounded-md bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {loading
                  ? (lang === 'ar' ? 'جاري الاتصال بوابات الدفع...' : lang === 'fr' ? 'Connexion en cours...' : 'Connecting to checkout...')
                  : (lang === 'ar' ? 'إتمام الدفع بالبطاقة الذهبية / CIB' : lang === 'fr' ? 'Payer avec Edahabia / CIB' : 'Pay with Edahabia / CIB')
                }
              </span>
            </button>
          </div>
        ) : null}

        {/* Successful Purchase Key Display */}
        {purchasedKey && (
          <div className="bg-[#F8FAFC] p-5 rounded-lg border border-teal-300 space-y-4 text-center animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto border border-teal-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1E3A8A]">
                {lang === 'ar' ? 'تم الدفع بنجاح! إليك مفتاح التفعيل الفوري:' : lang === 'fr' ? 'Paiement réussi! Voici votre clé:' : 'Payment successful! Here is your activation key:'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'ar' ? 'تم تنشيط رخصة البرنامج' : lang === 'fr' ? 'Votre licence a été activée' : 'Your software license has been activated'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-md border border-slate-200 flex items-center justify-between font-mono text-base font-extrabold text-[#1E3A8A] shadow-sm">
              <span>{purchasedKey}</span>
              <button
                onClick={handleCopyKey}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              >
                {copiedKey ? <Check className="w-4 h-4 text-[#0D9488]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-md shadow-sm"
            >
              {lang === 'ar' ? 'تم، العودة للبرنامج' : lang === 'fr' ? 'Terminé, retour au logiciel' : 'Done, return to application'}
            </button>
          </div>
        )}

        {/* Enter key form if no plan checkout active */}
        {!selectedPlanForCheckout && !purchasedKey && (
          <form onSubmit={handleVerifyKey} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                {lang === 'ar' ? 'مفتاح التفعيل (Serial Key)' : lang === 'fr' ? 'Clé d\'activation (Serial Key)' : 'Serial Activation Key'}
              </label>
              <input
                type="text"
                required
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="TC-ALG-PRO-XXXX-XXXX"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3.5 py-3 text-sm text-center font-mono font-bold text-[#1E3A8A] tracking-wider focus:outline-none focus:border-[#0D9488]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs rounded-md shadow-sm transition-colors"
            >
              {loading
                ? (lang === 'ar' ? 'جاري التحقق...' : lang === 'fr' ? 'Vérification...' : 'Verifying...')
                : (lang === 'ar' ? 'تنشيط الرخصة الآن' : lang === 'fr' ? 'Activer la licence' : 'Activate License Now')
              }
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
