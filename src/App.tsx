import React, { useState, useEffect } from 'react';
import { Navbar, Language } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeatureGrid } from './components/FeatureGrid';
import { PricingChargily } from './components/PricingChargily';
import { DownloadModal } from './components/DownloadModal';
import { LoginModal } from './components/LoginModal';
import { SignupModal } from './components/SignupModal';
import { TeacherHub } from './components/TeacherHub';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { UserProfile, LicensePlan } from './types';

export default function App() {
  const [activeLang, setActiveLang] = useState<Language>('en');
  const [user, setUser] = useState<UserProfile | null>(null);

  const [currentView, setCurrentView] = useState<'landing' | 'hub'>('landing');
  const [hubInitialTab, setHubInitialTab] = useState<'blog' | 'tutorials' | 'inquiries' | 'license'>('license');

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);

  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<LicensePlan | null>(null);

  const isAr = activeLang === 'ar';

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = activeLang;
  }, [activeLang, isAr]);

  const handleNavigateToSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleOpenLogin = () => {
    if (user) {
      setHubInitialTab('license');
      setCurrentView('hub');
    } else {
      setIsLoginOpen(true);
    }
  };

  const handleSelectPlanForCheckout = (plan: LicensePlan) => {
    setSelectedPlanForCheckout(plan);
    setIsSignupOpen(true);
  };

  const handleLoginSuccess = (u: UserProfile) => {
    setUser(u);
    setIsLoginOpen(false);
    setHubInitialTab('license');
    setCurrentView('hub');
  };

  const handleSignupSuccess = (u: UserProfile) => {
    setUser(u);
    setIsSignupOpen(false);
    setHubInitialTab('license'); // Forward directly to User Hub and License tab to show license key
    setCurrentView('hub');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-teal-500 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        activeLang={activeLang}
        onChangeLang={setActiveLang}
        onNavigateToSection={handleNavigateToSection}
        currentUser={user}
        onOpenLogin={handleOpenLogin}
        onOpenHub={() => {
          setHubInitialTab('license');
          setCurrentView(currentView === 'hub' ? 'landing' : 'hub');
        }}
      />

      {/* Main View Router */}
      {currentView === 'hub' && user ? (
        user.role === 'admin' ? (
          <AdminDashboard
            user={user}
            lang={activeLang}
            onLogout={handleLogout}
          />
        ) : (
          <TeacherHub
            lang={activeLang}
            currentUser={user}
            initialTab={hubInitialTab}
            onLogout={handleLogout}
          />
        )
      ) : (
        <main className="bg-[#F8FAFC]">
          
          {/* Section 1: Hero */}
          <Hero
            lang={activeLang}
            onOpenDownload={() => setIsDownloadOpen(true)}
            onOpenPricing={() => handleNavigateToSection('pricing')}
            onOpenLogin={handleOpenLogin}
          />

          {/* Section 2: Primary English Desktop Features */}
          <FeatureGrid
            lang={activeLang}
          />

          {/* Section 3: Annual Subscription */}
          <PricingChargily
            lang={activeLang}
            onSelectPlanForCheckout={handleSelectPlanForCheckout}
          />

        </main>
      )}

      {/* Footer */}
      <Footer
        lang={activeLang}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* Modals */}
      <DownloadModal
        lang={activeLang}
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />

      <LoginModal
        lang={activeLang}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <SignupModal
        lang={activeLang}
        isOpen={isSignupOpen}
        onClose={() => {
          setIsSignupOpen(false);
          setSelectedPlanForCheckout(null);
        }}
        selectedPlanForCheckout={selectedPlanForCheckout}
        onSignupSuccess={handleSignupSuccess}
      />

    </div>
  );
}
