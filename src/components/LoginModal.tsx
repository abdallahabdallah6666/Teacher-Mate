import React, { useState } from 'react';
import { X, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { Language } from './Navbar';

interface LoginModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  lang,
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError(
        lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' :
        lang === 'fr' ? 'Veuillez saisir une adresse e-mail valide' :
        'Please enter a valid email address'
      );
      return;
    }

    if (!password) {
      setError(
        lang === 'ar' ? 'يرجى إدخال كلمة المرور' :
        lang === 'fr' ? 'Veuillez entrer votre mot de passe' :
        'Please enter your password'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        })
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || (
          lang === 'ar' ? 'تعذر تسجيل الدخول. يرجى التأكد من البريد الإلكتروني وكلمة المرور' :
          lang === 'fr' ? 'Échec de connexion. Vérifiez vos identifiants' :
          'Login failed. Please check your credentials'
        ));
        setLoading(false);
        return;
      }

      const loggedInUser: UserProfile = json.user;
      onLoginSuccess(loggedInUser);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(
        lang === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم' :
        lang === 'fr' ? 'Erreur de connexion au serveur' :
        'Server connection error'
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 relative space-y-5 text-slate-800 shadow-2xl animate-fadeIn my-8">
        
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-[#1E3A8A]">
            {lang === 'ar' && 'تسجيل الدخول'}
            {lang === 'fr' && 'Se connecter'}
            {lang === 'en' && 'Log In'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {lang === 'ar' && 'أدخل بريدك الإلكتروني وكلمة المرور للوصول المباشر إلى Hub الأساتذة ورخصتك الرسمية.'}
            {lang === 'fr' && 'Connectez-vous pour accéder à votre espace enseignant et vos licences.'}
            {lang === 'en' && 'Enter your credentials to access your teacher hub and license key.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] mb-1">
              {lang === 'ar' && 'البريد الإلكتروني'}
              {lang === 'fr' && 'Adresse e-mail'}
              {lang === 'en' && 'Email Address'}
              <span className="text-red-500 ms-0.5">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 rtl:left-3.5 rtl:right-auto pointer-events-none" />
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
              {lang === 'ar' && 'كلمة المرور'}
              {lang === 'fr' && 'Mot de passe'}
              {lang === 'en' && 'Password'}
              <span className="text-red-500 ms-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 rtl:left-3.5 rtl:right-auto pointer-events-none" />
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>
                  {lang === 'ar' && 'جاري تسجيل الدخول...' }
                  {lang === 'fr' && 'Connexion en cours...' }
                  {lang === 'en' && 'Logging in...' }
                </span>
              ) : (
                <>
                  <span>
                    {lang === 'ar' && 'تسجيل الدخول والوصول المباشر'}
                    {lang === 'fr' && 'Se connecter et accéder'}
                    {lang === 'en' && 'Log In & Access'}
                  </span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
