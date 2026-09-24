import React from 'react';
import { X, Download, Laptop, Monitor, Terminal } from 'lucide-react';
import { Language } from './Navbar';

interface DownloadModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onOpenLicense?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  lang,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleStartDownload = (filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([
      `Teacher Companion v2.4 Algeria Desktop Software Installer\nVersion: 2.4.0-DZ\nTarget Platform: ${filename}\nStatus: Ready for installation\n\nThank you for choosing Teacher Companion for Algerian Primary Educators!`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-6 sm:p-8 relative space-y-6 text-slate-800 shadow-xl animate-fadeIn">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center mx-auto">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-[#1E3A8A]">
            {lang === 'ar' && 'تنزيل برنامج Teacher Companion'}
            {lang === 'fr' && 'Télécharger Teacher Companion'}
            {lang === 'en' && 'Download Teacher Companion'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'ar' && 'اختر نظام التشغيل الخاص بك للبدء'}
            {lang === 'fr' && 'Choisissez votre système d\'exploitation pour commencer'}
            {lang === 'en' && 'Choose your operating system to start'}
          </p>
        </div>

        {/* 3 Download Packages: Windows, Linux, Mac OS */}
        <div className="space-y-3">
          
          {/* Windows Option */}
          <div className="p-4 bg-[#F8FAFC] rounded-lg border border-teal-300 flex items-center justify-between gap-4 hover:border-[#0D9488] transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-teal-50 text-[#0D9488] border border-teal-200">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">Windows (.exe)</h4>
                <p className="text-[11px] text-slate-500">Windows 10 / 11</p>
              </div>
            </div>
            <button
              onClick={() => handleStartDownload('TeacherCompanion_v2.4_Setup.exe')}
              className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs rounded-md shadow-sm transition-colors"
            >
              {lang === 'ar' && 'تحميل'}
              {lang === 'fr' && 'Télécharger'}
              {lang === 'en' && 'Download'}
            </button>
          </div>

          {/* Linux Option */}
          <div className="p-4 bg-[#F8FAFC] rounded-lg border border-slate-200 flex items-center justify-between gap-4 hover:border-[#0D9488] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">Linux (.AppImage / .deb)</h4>
                <p className="text-[11px] text-slate-500">Ubuntu / Debian / Fedora</p>
              </div>
            </div>
            <button
              onClick={() => handleStartDownload('TeacherCompanion_v2.4_Linux.AppImage')}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-sm transition-colors"
            >
              {lang === 'ar' && 'تحميل'}
              {lang === 'fr' && 'Télécharger'}
              {lang === 'en' && 'Download'}
            </button>
          </div>

          {/* Mac OS Option */}
          <div className="p-4 bg-[#F8FAFC] rounded-lg border border-slate-200 flex items-center justify-between gap-4 hover:border-[#0D9488] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">Mac OS (.dmg)</h4>
                <p className="text-[11px] text-slate-500">Apple Silicon & Intel</p>
              </div>
            </div>
            <button
              onClick={() => handleStartDownload('TeacherCompanion_v2.4_macOS.dmg')}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-md shadow-sm transition-colors"
            >
              {lang === 'ar' && 'تحميل'}
              {lang === 'fr' && 'Télécharger'}
              {lang === 'en' && 'Download'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
