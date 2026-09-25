import React, { useState } from 'react';
import { X, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      const user = res.user;
      const idToken = await user.getIdToken();
      
      const syncRes = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          displayName: user.displayName || user.email || 'Teacher'
        })
      });
      const data = await syncRes.json();
      if (data.user) {
        onLoginSuccess(data.user);
      } else {
        onLoginSuccess({
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || 'Teacher',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          role: user.email?.toLowerCase().includes('admin') ? 'admin' : 'user',
          wilaya: '16 - الجزائر',
          schoolName: '',
          primaryGrade: '4AP',
          licenseStatus: 'trial',
          licensePlan: 'pro'
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(
        lang === 'ar' ? 'تعذر تسجيل الدخول بواسطة Google' :
        lang === 'fr' ? 'Impossible de se connecter avec Google' :
        'Failed to sign in with Google'
      );
    } finally {
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
              className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
              {lang === 'ar' ? 'أو عبر' : lang === 'fr' ? 'Ou avec' : 'Or with'}
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>
              {lang === 'ar' && 'تسجيل الدخول باستخدام Google'}
              {lang === 'fr' && 'Continuer avec Google'}
              {lang === 'en' && 'Continue with Google'}
            </span>
          </button>
        </form>

      </div>
    </div>
  );
};
