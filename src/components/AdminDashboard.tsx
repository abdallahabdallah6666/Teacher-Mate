import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Search,
  Plus,
  Key,
  RefreshCw,
  LogOut,
  BarChart2,
  Video,
  HelpCircle,
  FileText,
  CheckCircle,
  Tag,
  X,
  Send,
  Trash2,
  Edit,
  Ban,
  Flag,
  Save,
  Sparkles,
  MapPin,
  Zap,
  Check,
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Percent,
  Hash,
  CheckCircle2,
  AlertCircle,
  Mail
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { UserProfile, SupportInquiry, LicenseRecord, BlogPost, TutorialVideo, PricingSettings } from '../types';
import { ALGERIAN_WILAYAS } from '../data/syllabus';
import { Language } from './Navbar';

interface AdminDashboardProps {
  user: UserProfile;
  lang?: Language;
  onLogout: () => void;
  onExitToSite?: () => void;
}

type AdminTab = 'overview' | 'accounts' | 'sales' | 'pricing' | 'promos' | 'tutorials' | 'enquiries' | 'blog' | 'smtp';

const DEFAULT_PRICING: PricingSettings = {
  currencyDZD: 'DZD (Algerian Dinar)',
  promoNoticeEn: 'New School Year Special — Direct Edahabia / CIB Activation',
  promoNoticeAr: 'عرض الموسم الدراسي الجديد — تفعيل فوري بالذهبية و CIB',
  plans: {
    pro: {
      id: 'pro',
      nameAr: 'الرخصة السنوية الشخصية (Personal Yearly License)',
      nameFr: '',
      nameEn: 'Personal Yearly License',
      priceDZD: 3000,
      periodAr: 'سنة كاملة / جهاز PC واحد',
      periodFr: '',
      periodEn: '1 Year / 1 PC',
      badgeAr: 'الأكثر طلباً ⭐',
      badgeEn: 'Most Popular ⭐',
      popular: true,
      featuresAr: [
        'تفعيل شامل لحساب الأستاذ على جهاز حاسوب واحد (1 PC)',
        'مولد المذكرات الذكي بالذكاء الاصطناعي',
        'أوراق عمل Phonics وصانع Flashcards الملونة',
        'تصدير واستيراد قوائم التلاميذ والتقييمات إلى Excel',
        'دعم فني مباشر وبلاغات طوارئ SOS ذات أولوية'
      ],
      featuresFr: [],
      featuresEn: [
        'Full teacher account activation for 1 PC',
        'AI Lesson Plan Generator (Gemini Flash)',
        'Phonics worksheets & colorful flashcards maker',
        'Export/Import student evaluation marks to Excel',
        'Priority technical support & urgent SOS ticket queue'
      ]
    }
  }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onExitToSite }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Accounts state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [searchUsers, setSearchUsers] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);

  // Sales state
  const [salesList, setSalesList] = useState<LicenseRecord[]>([]);
  const [searchSales, setSearchSales] = useState<string>('');
  const [isIssueLicenseOpen, setIsIssueLicenseOpen] = useState<boolean>(false);

  // Pricing state
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [loadingPricing, setLoadingPricing] = useState<boolean>(false);
  const [isSavingPricing, setIsSavingPricing] = useState<boolean>(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  
  const [promosList, setPromosList] = useState<Array<{
    code: string;
    discountPercent: number;
    isActive: number | boolean;
    uses: number;
    maxUses: number | null;
    expirationDate: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>>([]);
  const [isAddPromoOpen, setIsAddPromoOpen] = useState<boolean>(false);
  const [newPromoForm, setNewPromoForm] = useState<{
    code: string;
    discountPercent: number;
    maxUses: string | number;
    expirationDate: string;
    isActive: boolean;
  }>({ code: '', discountPercent: 15, maxUses: 100, expirationDate: '', isActive: true });
  
  const [editingPromo, setEditingPromo] = useState<{
    code: string;
    discountPercent: number;
    isActive: number | boolean;
    uses: number;
    maxUses: number | null;
    expirationDate: string | null;
  } | null>(null);
  const [editPromoForm, setEditPromoForm] = useState<{
    code: string;
    discountPercent: number;
    maxUses: string | number;
    expirationDate: string;
    isActive: boolean;
  }>({ code: '', discountPercent: 15, maxUses: '', expirationDate: '', isActive: true });

  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState<boolean>(false);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [isDeletingPromo, setIsDeletingPromo] = useState<boolean>(false);
  const [searchPromoQuery, setSearchPromoQuery] = useState<string>('');
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);

  // Refs for auto-persistence
  const latestPricingRef = useRef<PricingSettings | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tutorials state
  const [tutorialsList, setTutorialsList] = useState<TutorialVideo[]>([]);
  const [searchTutorials, setSearchTutorials] = useState<string>('');
  const [isAddTutorialOpen, setIsAddTutorialOpen] = useState<boolean>(false);
  const [editingTutorial, setEditingTutorial] = useState<TutorialVideo | null>(null);

  // Enquiries state
  const [inquiriesList, setInquiriesList] = useState<SupportInquiry[]>([]);
  const [filterInquiryStatus, setFilterInquiryStatus] = useState<string>('all');
  const [replyingInquiry, setReplyingInquiry] = useState<SupportInquiry | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // Blog state
  const [postsList, setPostsList] = useState<BlogPost[]>([]);
  const [searchPosts, setSearchPosts] = useState<string>('');
  const [isAddPostOpen, setIsAddPostOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // New item modal form states
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: 'teacher123',
    role: 'user',
    phone: '',
    wilaya: '16 - الجزائر / Alger',
    schoolName: '',
    licensePlan: 'personal-lifetime',
    licenseStatus: 'active',
    sendEmail: true
  });
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    preparedEmail?: string;
    recipient?: string;
  } | null>(null);

  // User management modals & action states
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    wilaya: '16 - الجزائر / Alger',
    schoolName: '',
    licenseStatus: 'active' as 'active' | 'trial' | 'expired',
    licensePlan: 'personal-lifetime'
  });
  const [isSavingEditUser, setIsSavingEditUser] = useState<boolean>(false);
  const [sendingEmailUser, setSendingEmailUser] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedPreparedEmail, setCopiedPreparedEmail] = useState<boolean>(false);

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'abdallahbourrich66@gmail.com',
    pass: '',
    hasPassword: false,
    fromName: 'رفيق المعلم الجزائري - Teacher Mate DZ',
    fromEmail: 'abdallahbourrich66@gmail.com'
  });
  const [loadingSmtp, setLoadingSmtp] = useState<boolean>(false);
  const [savingSmtp, setSavingSmtp] = useState<boolean>(false);
  const [testingSmtp, setTestingSmtp] = useState<boolean>(false);
  const [testEmailTarget, setTestEmailTarget] = useState<string>('');
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newTutorialForm, setNewTutorialForm] = useState({
    titleAr: '',
    descriptionAr: '',
    videoUrl: 'https://www.youtube.com/embed/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    duration: '05:00',
    keySteps: ''
  });
  const [tutorialToDelete, setTutorialToDelete] = useState<TutorialVideo | null>(null);
  const [isDeletingTutorial, setIsDeletingTutorial] = useState<boolean>(false);
  const [inlineDeletingId, setInlineDeletingId] = useState<string | null>(null);
  const [tutorialFeedback, setTutorialFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newBlogPostForm, setNewBlogPostForm] = useState({
    titleAr: '',
    excerptAr: '',
    category: 'Pedagogical Guidelines',
    author: 'Pedagogical Inspector M. Amari',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    contentAr: ''
  });

  const [issueLicenseForm, setIssueLicenseForm] = useState({
    userEmail: '',
    userName: '',
    phone: '',
    wilaya: '16 - الجزائر / Alger',
    schoolName: '',
    plan: 'personal-lifetime',
    paidVia: 'Chargily Pay v2 (Edahabia/CIB)',
    sendEmail: true
  });
  const [isIssuingLicense, setIsIssuingLicense] = useState<boolean>(false);

  // Keep latest pricing ref updated
  useEffect(() => {
    if (pricingSettings) {
      latestPricingRef.current = pricingSettings;
    }
  }, [pricingSettings]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSales();
    fetchTutorials();
    fetchInquiries();
    fetchBlogPosts();
    fetchPricingSettings();
    fetchPromos();
  }, []);

  // Guarantee persistence when user leaves, quits, or unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestPricingRef.current) {
        try {
          const blob = new Blob([JSON.stringify(latestPricingRef.current)], { type: 'application/json' });
          navigator.sendBeacon('/api/admin/pricing', blob);
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (latestPricingRef.current) {
        fetch('/api/admin/pricing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestPricingRef.current),
          keepalive: true
        }).catch(() => undefined);
      }
    };
  }, []);

  const fetchPricingSettings = async () => {
    setLoadingPricing(true);
    try {
      const res = await fetch('/api/admin/pricing');
      if (res.ok) {
        const data = await res.json();
        setPricingSettings(data);
        latestPricingRef.current = data;
      }
    } catch (e) {
      console.error('Failed to load pricing:', e);
    } finally {
      setLoadingPricing(false);
    }
  };

  // Immediate persistence function to DB & backup
  const persistPricingToDb = async (settingsToSave: PricingSettings): Promise<boolean> => {
    setIsSavingPricing(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.pricing) {
          setPricingSettings(data.pricing);
          latestPricingRef.current = data.pricing;
        }
        setPricingSuccessMsg('✓ Saved & permanently persisted to database');
        setTimeout(() => setPricingSuccessMsg(null), 3500);
        return true;
      }
    } catch (err) {
      console.error('Failed to persist pricing:', err);
    } finally {
      setIsSavingPricing(false);
    }
    return false;
  };

  // Debounced auto-save on input keystroke
  const handlePricingChange = (updated: PricingSettings) => {
    setPricingSettings(updated);
    latestPricingRef.current = updated;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistPricingToDb(updated);
    }, 500);
  };

  const handleManualSavePricing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const target = latestPricingRef.current || pricingSettings;
    if (target) {
      await persistPricingToDb(target);
    }
  };

  const handleExitAdmin = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (latestPricingRef.current) {
      await persistPricingToDb(latestPricingRef.current);
    }
    if (onExitToSite) {
      onExitToSite();
    }
  };

  const handleAdminLogout = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (latestPricingRef.current) {
      await persistPricingToDb(latestPricingRef.current);
    }
    onLogout();
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/admin/licenses');
      if (res.ok) {
        const data = await res.json();
        setSalesList(data.licenses || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTutorials = async () => {
    try {
      const res = await fetch('/api/tutorials');
      if (res.ok) {
        const data = await res.json();
        setTutorialsList(data.tutorials || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/admin/inquiries');
      if (res.ok) {
        const data = await res.json();
        setInquiriesList(data.inquiries || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const res = await fetch('/api/blog/posts');
      if (res.ok) {
        const data = await res.json();
        setPostsList(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Accounts Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      const ct = res.headers.get('content-type');
      const json = ct && ct.includes('application/json') ? await res.json() : {};

      if (res.ok && json.success) {
        setIsAddUserOpen(false);

        // Instantly prepend new user to the local list so the table updates immediately
        if (json.user) {
          setUsersList(prev => [json.user, ...prev.filter(u => u.email.toLowerCase() !== json.user.email.toLowerCase())]);
        }
        // Reset filters so the new account is visible immediately
        setSearchUsers('');
        setFilterRole('all');
        setFilterStatus('all');

        setNewUserForm({
          fullName: '',
          email: '',
          password: 'teacher123',
          role: 'user',
          phone: '',
          wilaya: '16 - الجزائر / Alger',
          schoolName: '',
          licensePlan: 'personal-lifetime',
          licenseStatus: 'active',
          sendEmail: true
        });

        const emailInfo = json.emailSent
          ? ` | ✉️ تم إرسال مفتاح الترخيص وبيانات التفعيل إلى بريد المعلم (${json.emailRecipient}) مباشرة عبر Nodemailer`
          : json.notConfigured
          ? ` | ⚠️ لم يتم حفظ كلمة مرور بريد الإرسال (Gmail App Password) في إعدادات SMTP بعد. تم تجهيز نص الرسالة للنسخ الفوري بالزر أدناه.`
          : json.emailError
          ? ` | ⚠️ تنبيه البريد: ${json.emailError}`
          : '';

        setUserFeedback({
          type: 'success',
          text: `تم إنشاء حساب المعلم "${json.user?.fullName || 'الأستاذ'}" بنجاح! مفتاح الترخيص: ${json.user?.licenseKey || ''}${emailInfo}`,
          preparedEmail: json.preparedEmail,
          recipient: json.emailRecipient
        });

        fetchUsers();
        fetchSales();
        fetchStats();
      } else {
        setCreateUserError(json.error || 'فشل إنشاء حساب المستخدم. يرجى التأكد من البيانات المدخلة.');
      }
    } catch (err: any) {
      console.error(err);
      setCreateUserError(err?.message || 'حدث خطأ في الاتصال بالشبكة أثناء إنشاء الحساب');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleFlagUser = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/toggle-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagReason: 'Flagged for administrative review' })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, isFlagged: !u.isFlagged } : u));
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlockUser = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/toggle-block`, {
        method: 'POST'
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, isBlocked: !u.isBlocked } : u));
        fetchUsers();
      } else {
        const json = await res.json().catch(() => ({}));
        setUserFeedback({
          type: 'error',
          text: json.error || 'Failed to modify account block status'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    const targetEmail = userToDelete.email;
    const targetName = userToDelete.fullName;

    try {
      let res = await fetch(`/api/admin/users/${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        // Fallback to POST /delete in case DELETE method is blocked by iframe proxy
        res = await fetch(`/api/admin/users/${encodeURIComponent(targetEmail)}/delete`, {
          method: 'POST'
        });
      }

      if (res.ok) {
        // Instantly update user list state
        setUsersList(prev => prev.filter(u => u.email.toLowerCase() !== targetEmail.toLowerCase()));
        setUserFeedback({
          type: 'success',
          text: `تم حذف حساب المعلم "${targetName}" (${targetEmail}) بنجاح وإلغاء ترخيصه فوراً عبر LicenseSeat API.`
        });
        setUserToDelete(null);
        fetchUsers();
        fetchSales();
        fetchStats();
      } else {
        const json = await res.json().catch(() => ({}));
        setUserFeedback({
          type: 'error',
          text: json.error || 'Failed to delete user account.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setUserFeedback({
        type: 'error',
        text: err?.message || 'Network error occurred while deleting user'
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSendLicenseEmail = async (email: string) => {
    setSendingEmailUser(email);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/send-license-email`, {
        method: 'POST'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUserFeedback({
          type: 'success',
          text: `تم إرسال مفتاح الترخيص بنجاح إلى بريد المعلم (${email}) عبر Nodemailer!`
        });
        fetchUsers();
      } else {
        setUserFeedback({
          type: 'error',
          text: data.error || 'تعذر إرسال البريد عبر Nodemailer',
          preparedEmail: data.preparedEmail,
          recipient: email
        });
      }
    } catch (err: any) {
      console.error(err);
      setUserFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ في الاتصال أثناء إرسال البريد'
      });
    } finally {
      setSendingEmailUser(null);
    }
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditUserForm({
      fullName: u.fullName || '',
      email: u.email,
      role: u.role || 'user',
      wilaya: u.wilaya || '16 - الجزائر / Alger',
      schoolName: u.schoolName || '',
      licenseStatus: u.licenseStatus || 'active',
      licensePlan: u.licensePlan || 'personal-lifetime'
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingEditUser(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(editingUser.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm)
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setUsersList(prev => prev.map(u => u.email.toLowerCase() === editingUser.email.toLowerCase() ? json.user : u));
        setUserFeedback({
          type: 'success',
          text: `Account for "${json.user?.fullName}" updated successfully.`
        });
        setEditingUser(null);
        fetchUsers();
      } else {
        setUserFeedback({
          type: 'error',
          text: json.error || 'Failed to update user account.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setUserFeedback({
        type: 'error',
        text: err?.message || 'Network error occurred while saving user edits'
      });
    } finally {
      setIsSavingEditUser(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRenewLicense = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/renew-license`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        setUserFeedback({
          type: 'success',
          text: `License key renewed successfully for ${email}. New key: ${json.newKey || ''}`
        });
        fetchUsers();
      } else {
        const json = await res.json().catch(() => ({}));
        setUserFeedback({
          type: 'error',
          text: json.error || 'Failed to renew license key.'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sales Handlers
  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuingLicense(true);
    try {
      const res = await fetch('/api/admin/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueLicenseForm)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsIssueLicenseOpen(false);
        const emailMsg = data.emailSent
          ? ` وتم إرسال المفتاح إلى بريد (${data.license.userEmail}) مباشرة عبر Nodemailer`
          : data.notConfigured
          ? ' (يمكنك نسخ نص التفعيل بالزر أدناه أو إدخال App Password في تبويب إعدادات SMTP)'
          : data.emailError
          ? ` (تنبيه البريد: ${data.emailError})`
          : '';

        setUserFeedback({
          type: 'success',
          text: `تم إصدار الرخصة بنجاح للمعلم "${data.license.userName}"! المفتاح: ${data.license.key}${emailMsg}`,
          preparedEmail: data.preparedEmail,
          recipient: data.license.userEmail
        });

        setIssueLicenseForm({
          userEmail: '',
          userName: '',
          phone: '',
          wilaya: '16 - الجزائر / Alger',
          schoolName: '',
          plan: 'personal-lifetime',
          paidVia: 'Chargily Pay v2 (Edahabia/CIB)',
          sendEmail: true
        });

        fetchSales();
        fetchUsers();
        fetchStats();
      } else {
        setUserFeedback({
          type: 'error',
          text: data.error || 'فشل إصدار الرخصة اليدوية'
        });
      }
    } catch (err: any) {
      console.error(err);
      setUserFeedback({
        type: 'error',
        text: err?.message || 'خطأ في الاتصال أثناء إصدار الرخصة'
      });
    } finally {
      setIsIssuingLicense(false);
    }
  };

  const handleRevokeLicense = async (key: string) => {
    try {
      const res = await fetch('/api/admin/licenses/revoke', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUserFeedback({
          type: 'success',
          text: `تم إلغاء ترخيص المفتاح "${key}" فوراً عبر LicenseSeat API.`
        });
        fetchSales();
        fetchUsers();
        fetchStats();
      } else {
        setUserFeedback({
          type: 'error',
          text: data.error || 'فشل إلغاء الرخصة عبر LicenseSeat'
        });
      }
    } catch (err: any) {
      console.error(err);
      setUserFeedback({
        type: 'error',
        text: err?.message || 'حدث خطأ في الاتصال أثناء إلغاء الرخصة'
      });
    }
  };

  // SMTP Management Handlers
  const fetchSmtpSettings = async () => {
    setLoadingSmtp(true);
    try {
      const res = await fetch('/api/admin/smtp-settings');
      if (res.ok) {
        const data = await res.json();
        setSmtpSettings(prev => ({
          ...prev,
          ...data,
          pass: '' // do not display actual password for security
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSmtp(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpFeedback({
          type: 'success',
          text: '✅ تم حفظ إعدادات خادم البريد (Nodemailer SMTP) بنجاح! جاهز لإرسال الرخص لبريد أي معلم.'
        });
        fetchSmtpSettings();
      } else {
        setSmtpFeedback({
          type: 'error',
          text: data.error || 'فشل حفظ إعدادات البريد'
        });
      }
    } catch (err: any) {
      setSmtpFeedback({
        type: 'error',
        text: err?.message || 'خطأ في الاتصال أثناء حفظ الإعدادات'
      });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await fetch('/api/admin/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailTarget || smtpSettings.user })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpFeedback({
          type: 'success',
          text: `✅ تم إرسال الرسالة التجريبية بنجاح إلى (${data.recipient}) عبر Nodemailer!`
        });
      } else {
        setSmtpFeedback({
          type: 'error',
          text: data.error || 'فشل فحص اتصال SMTP'
        });
      }
    } catch (err: any) {
      setSmtpFeedback({
        type: 'error',
        text: err?.message || 'خطأ في الاتصال أثناء فحص البريد'
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleCopyPreparedEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPreparedEmail(true);
    setTimeout(() => setCopiedPreparedEmail(false), 3000);
  };

  // Tutorials Handlers
  const handleCreateTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTutorialForm,
          keySteps: newTutorialForm.keySteps.split('\n').filter(Boolean)
        })
      });
      if (res.ok) {
        setIsAddTutorialOpen(false);
        setNewTutorialForm({
          titleAr: '',
          descriptionAr: '',
          videoUrl: 'https://www.youtube.com/embed/',
          thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
          duration: '05:00',
          keySteps: ''
        });
        setTutorialFeedback({
          type: 'success',
          text: 'New video tutorial published successfully.'
        });
        fetchTutorials();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteTutorial = async (id: string, title?: string) => {
    setIsDeletingTutorial(true);
    // 1. Immediately remove from local UI state (optimistic)
    setTutorialsList(prev => prev.filter(t => t.id !== id));
    setInlineDeletingId(null);
    setTutorialToDelete(null);

    try {
      // 2. Fire delete requests with fallbacks (DELETE and POST)
      const p1 = fetch(`/api/admin/tutorials/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const p2 = fetch('/api/admin/tutorials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await Promise.allSettled([p1, p2]);

      setTutorialFeedback({
        type: 'success',
        text: `Tutorial video ${title ? `"${title}"` : ''} deleted successfully.`
      });

      // 3. Re-sync from server after brief pause
      setTimeout(() => {
        fetchTutorials();
      }, 300);
    } catch (err: any) {
      console.error('Delete tutorial error:', err);
      setTutorialFeedback({
        type: 'error',
        text: err?.message || 'Failed to delete tutorial video.'
      });
    } finally {
      setIsDeletingTutorial(false);
    }
  };

  const handleDeleteTutorial = (tutorial: TutorialVideo) => {
    setTutorialToDelete(tutorial);
  };

  const confirmDeleteTutorial = async () => {
    if (!tutorialToDelete) return;
    await executeDeleteTutorial(tutorialToDelete.id, tutorialToDelete.titleAr);
  };

  const handleEmptyAllTutorials = async () => {
    if (!window.confirm('Are you sure you want to delete ALL tutorial videos from the system?')) return;
    try {
      setTutorialsList([]);
      setInlineDeletingId(null);
      setTutorialToDelete(null);
      await Promise.allSettled([
        fetch('/api/admin/tutorials/empty', { method: 'POST' }),
        fetch('/api/admin/tutorials', { method: 'DELETE' })
      ]);
      setTutorialFeedback({
        type: 'success',
        text: 'All tutorial videos have been emptied successfully.'
      });
      setTimeout(() => {
        fetchTutorials();
      }, 300);
    } catch (err: any) {
      console.error('Empty tutorials error:', err);
    }
  };

  // Inquiries Handlers
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingInquiry) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(replyingInquiry.id)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        setReplyingInquiry(null);
        setReplyText('');
        fetchInquiries();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const fetchPromos = async () => {
    try {
      const res = await fetch('/api/admin/promos');
      if (res.ok) {
        const data = await res.json();
        setPromosList(data.promos || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newPromoForm.code.trim().toUpperCase();
    if (!cleanCode) {
      setPromoFeedback({ type: 'error', text: 'Please enter a valid promo code.' });
      return;
    }
    setPromoLoading(true);
    setPromoFeedback(null);
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          discountPercent: Number(newPromoForm.discountPercent),
          maxUses: newPromoForm.maxUses !== '' && newPromoForm.maxUses !== null ? Number(newPromoForm.maxUses) : null,
          expirationDate: newPromoForm.expirationDate ? newPromoForm.expirationDate : null,
          isActive: newPromoForm.isActive ? 1 : 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddPromoOpen(false);
        setNewPromoForm({ code: '', discountPercent: 15, maxUses: 100, expirationDate: '', isActive: true });
        setPromoFeedback({ type: 'success', text: `Promo code "${cleanCode}" created successfully!` });
        await fetchPromos();
      } else {
        setPromoFeedback({ type: 'error', text: data?.error || 'Failed to create promo code.' });
      }
    } catch (err: any) {
      console.error(err);
      setPromoFeedback({ type: 'error', text: err?.message || 'Error occurred while creating promo code.' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleOpenEditPromo = (promo: any) => {
    setEditingPromo(promo);
    setEditPromoForm({
      code: promo.code,
      discountPercent: promo.discountPercent,
      maxUses: promo.maxUses !== null && promo.maxUses !== undefined ? promo.maxUses : '',
      expirationDate: promo.expirationDate ? String(promo.expirationDate).split('T')[0] : '',
      isActive: Boolean(promo.isActive)
    });
    setPromoFeedback(null);
  };

  const handleUpdatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    const cleanCode = editPromoForm.code.trim().toUpperCase();
    if (!cleanCode) {
      setPromoFeedback({ type: 'error', text: 'Please enter a valid promo code.' });
      return;
    }
    setPromoLoading(true);
    setPromoFeedback(null);
    try {
      const res = await fetch(`/api/admin/promos/${encodeURIComponent(editingPromo.code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newCode: cleanCode,
          discountPercent: Number(editPromoForm.discountPercent),
          maxUses: editPromoForm.maxUses !== '' && editPromoForm.maxUses !== null ? Number(editPromoForm.maxUses) : null,
          expirationDate: editPromoForm.expirationDate ? editPromoForm.expirationDate : null,
          isActive: editPromoForm.isActive ? 1 : 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingPromo(null);
        setPromoFeedback({ type: 'success', text: `Promo code "${cleanCode}" updated successfully!` });
        await fetchPromos();
      } else {
        setPromoFeedback({ type: 'error', text: data?.error || 'Failed to update promo code.' });
      }
    } catch (err: any) {
      console.error(err);
      setPromoFeedback({ type: 'error', text: err?.message || 'Error occurred while updating promo code.' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleDeletePromo = (code: string) => {
    setPromoFeedback(null);
    setPromoToDelete(code);
  };

  const confirmDeletePromo = async (code: string) => {
    if (!code) return;
    setIsDeletingPromo(true);
    setPromoFeedback(null);
    try {
      let res = await fetch(`/api/admin/promos/${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        // Fallback to POST delete endpoint in case iframe/proxy blocks DELETE method
        res = await fetch(`/api/admin/promos/${encodeURIComponent(code)}/delete`, {
          method: 'POST'
        });
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setPromosList((prev) => prev.filter((p) => p.code.toUpperCase() !== code.toUpperCase()));
        setPromoFeedback({ type: 'success', text: `Promo code "${code}" deleted successfully!` });
        setPromoToDelete(null);
        await fetchPromos();
      } else {
        setPromoFeedback({ type: 'error', text: data?.error || 'Failed to delete promo code.' });
      }
    } catch (err: any) {
      console.error(err);
      setPromoFeedback({ type: 'error', text: err?.message || 'Error occurred while deleting promo code.' });
    } finally {
      setIsDeletingPromo(false);
    }
  };

  const handleTogglePromoStatus = async (promo: any) => {
    try {
      const newStatus = promo.isActive ? 0 : 1;
      const res = await fetch(`/api/admin/promos/${encodeURIComponent(promo.code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (res.ok) {
        setPromoFeedback({
          type: 'success',
          text: `Promo code "${promo.code}" is now ${newStatus ? 'Active' : 'Inactive'}.`
        });
        await fetchPromos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPromoCode = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
      setCopiedPromoCode(code);
      setTimeout(() => setCopiedPromoCode(null), 2000);
    } catch {}
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Delete this support inquiry?')) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchInquiries();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Blog Handlers
  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlogPostForm)
      });
      if (res.ok) {
        setIsAddPostOpen(false);
        fetchBlogPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await fetch(`/api/admin/blog/posts/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchBlogPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
      (u.schoolName && u.schoolName.toLowerCase().includes(searchUsers.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.licenseStatus === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredSales = salesList.filter(s =>
    s.key.toLowerCase().includes(searchSales.toLowerCase()) ||
    s.userEmail.toLowerCase().includes(searchSales.toLowerCase()) ||
    (s.userName && s.userName.toLowerCase().includes(searchSales.toLowerCase()))
  );

  const filteredInquiries = inquiriesList.filter(inq => {
    if (filterInquiryStatus === 'sos') return inq.isSOS;
    if (filterInquiryStatus === 'pending') return inq.status === 'pending';
    if (filterInquiryStatus === 'replied') return inq.status === 'replied';
    return true;
  });

  const filteredTutorials = tutorialsList.filter(t => {
    const q = searchTutorials.toLowerCase().trim();
    if (!q) return true;
    const titleAr = (t.titleAr || '').toLowerCase();
    const titleFr = (t.titleFr || '').toLowerCase();
    const desc = (t.descriptionAr || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    return titleAr.includes(q) || titleFr.includes(q) || desc.includes(q) || cat.includes(q);
  });

  const filteredPosts = postsList.filter(p =>
    p.titleAr.toLowerCase().includes(searchPosts.toLowerCase()) ||
    p.category.toLowerCase().includes(searchPosts.toLowerCase())
  );

  const currentPricing = pricingSettings || DEFAULT_PRICING;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Top Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Admin Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-bold text-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Teacher Companion Admin Console
                </h1>
                <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-extrabold uppercase rounded-full">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {user.fullName} ({user.email})
              </p>
            </div>
          </div>

          {/* KPI Ticker in Header */}
          <div className="hidden lg:flex items-center gap-6 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Revenue</span>
              <span className="font-extrabold text-teal-400">
                {stats?.totalSalesDZD ? stats.totalSalesDZD.toLocaleString() : '458,500'} DZD
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">Registered Teachers</span>
              <span className="font-extrabold text-white">{stats?.totalCustomers || usersList.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">Active Licenses</span>
              <span className="font-extrabold text-blue-400">
                {stats?.activeLicensesCount || salesList.filter(s => s.status === 'active').length}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">SOS Queue</span>
              <span className={`font-extrabold ${stats?.sosInquiriesCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {stats?.sosInquiriesCount || 0}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {onExitToSite && (
              <button
                onClick={handleExitAdmin}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                title="Save and Return to Website"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit to Website</span>
              </button>
            )}

            <button
              onClick={fetchStats}
              title="Refresh Dashboard Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts & Teachers</span>
            <span className="px-1.5 py-0.2 bg-slate-950 text-teal-300 text-[10px] rounded-full">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Licenses & Sales</span>
            <span className="px-1.5 py-0.2 bg-slate-950 text-teal-300 text-[10px] rounded-full">
              {salesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Pricing & Plans (Database Sync)</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'promos'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promo Codes</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorials')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tutorials'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Tutorials</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap relative ${
              activeTab === 'enquiries'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support & SOS Inbox</span>
            {stats?.sosInquiriesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-extrabold rounded-full animate-bounce">
                {stats.sosInquiriesCount} SOS
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'blog'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Articles & Blog</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('smtp');
              fetchSmtpSettings();
            }}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'smtp'
                ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email & SMTP (Nodemailer)</span>
            {smtpSettings.hasPassword && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="SMTP Configured"></span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Total Revenue (DZD)</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {stats?.totalSalesDZD ? stats.totalSalesDZD.toLocaleString() : '458,500'} DZD
                  </div>
                  <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1 font-semibold">
                    <span>+24.5%</span>
                    <span className="text-slate-400">vs last month</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Registered Teachers</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {usersList.length} Teachers
                  </div>
                  <p className="text-[11px] text-blue-400 mt-1 font-semibold">
                    Across 58 Algerian Wilayas
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Active Offline Licenses</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {stats?.activeLicensesCount || salesList.filter(s => s.status === 'active').length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                    100% Offline PC Activations
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Support & SOS Queue</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <span>{stats?.pendingInquiriesCount || inquiriesList.filter(i => i.status === 'pending').length}</span>
                    {stats?.sosInquiriesCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full font-bold animate-pulse">
                        {stats.sosInquiriesCount} SOS
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-400 mt-1 font-semibold">
                    Priority Direct Resolution
                  </p>
                </div>
              </div>

            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Monthly Sales Growth Curve */}
              <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span>Monthly Revenue Trajectory (DZD)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chargily Pay Edahabia & CIB annual subscriptions
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg font-bold">
                    2026 Growth Trend
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.monthlySalesData || [
                      { month: 'Jan', revenue: 14500 },
                      { month: 'Feb', revenue: 23200 },
                      { month: 'Mar', revenue: 31900 },
                      { month: 'Apr', revenue: 49300 },
                      { month: 'May', revenue: 60900 },
                      { month: 'Jun', revenue: 78300 },
                      { month: 'Jul', revenue: 95700 },
                      { month: 'Aug', revenue: 120000 },
                    ]}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="DZD Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plan Distribution Donut Chart */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-700/80 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Plan Share Distribution</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Personal Yearly License represents ~75% of sales
                  </p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.salesByPlan || [
                          { name: 'Personal Yearly License', value: 75, color: '#0D9488' },
                          { name: 'Single PC Plan', value: 15, color: '#3B82F6' },
                          { name: 'School Hub Plan', value: 10, color: '#6366F1' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(stats?.salesByPlan || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#0D9488'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Sales by Wilaya Bar Chart */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-700/80 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Teacher Distribution across Algerian Wilayas</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Top registered regions using Teacher Companion offline
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.salesByWilaya || [
                    { wilaya: 'Algiers', teachersCount: 28 },
                    { wilaya: 'Oran', teachersCount: 19 },
                    { wilaya: 'Constantine', teachersCount: 15 },
                    { wilaya: 'Setif', teachersCount: 14 },
                    { wilaya: 'Annaba', teachersCount: 11 },
                    { wilaya: 'Tlemcen', teachersCount: 9 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="wilaya" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }} />
                    <Bar dataKey="teachersCount" fill="#0D9488" radius={[6, 6, 0, 0]} name="Teachers Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ACCOUNTS & TEACHERS */}
        {activeTab === 'accounts' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                  <input
                    type="text"
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    placeholder="Search by teacher name, email or school..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Teachers Only</option>
                  <option value="admin">Admins Only</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active License</option>
                  <option value="expired">Expired License</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setCreateUserError(null);
                  setIsAddUserOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Teacher Account</span>
              </button>

            </div>

            {/* User Feedback Notification Banner */}
            {userFeedback && (
              <div className={`mb-4 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fadeIn ${
                userFeedback.type === 'success' ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  {userFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-semibold">{userFeedback.text}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {userFeedback.preparedEmail && (
                    <button
                      type="button"
                      onClick={() => handleCopyPreparedEmail(userFeedback.preparedEmail!)}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copiedPreparedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPreparedEmail ? 'تم النسخ بنجاح!' : 'نسخ نص رسالة التفعيل'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setUserFeedback(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Teacher / Account</th>
                      <th className="p-4">Wilaya & School</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Offline License Key</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-300 font-medium">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.email} className="hover:bg-slate-700/30 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-white flex items-center gap-2 flex-wrap">
                              <span>{u.fullName}</span>
                              {u.role === 'admin' && (
                                <span className="px-1.5 py-0.2 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] rounded font-mono">
                                  ADMIN
                                </span>
                              )}
                              {u.isFlagged && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] rounded font-bold flex items-center gap-0.5">
                                  <Flag className="w-2.5 h-2.5" />
                                  <span>FLAGGED</span>
                                </span>
                              )}
                              {u.isBlocked && (
                                <span className="px-1.5 py-0.2 bg-red-600/30 text-red-300 border border-red-500/50 text-[9px] rounded font-extrabold flex items-center gap-0.5 animate-pulse">
                                  <Ban className="w-2.5 h-2.5" />
                                  <span>BLOCKED</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                          </td>

                          <td className="p-4">
                            <div className="font-semibold text-slate-200">{u.schoolName || 'Primary School'}</div>
                            <div className="text-[11px] text-teal-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{u.wilaya}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                              u.role === 'admin'
                                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {u.role === 'admin' ? 'Super Admin' : 'Teacher'}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-[11px] text-slate-300">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono bg-slate-950/80 px-2 py-1 rounded border border-slate-700/60 text-teal-300 select-all">
                                {u.licenseKey || 'N/A'}
                              </span>
                              {u.licenseKey && (
                                <button
                                  onClick={() => handleCopyKey(u.licenseKey!)}
                                  title="Copy License Key"
                                  className="p-1 hover:bg-slate-700 text-slate-400 hover:text-teal-300 rounded transition-colors"
                                >
                                  {copiedKey === u.licenseKey ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            {u.lastEmailSentAt && (
                              <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>تم الإرسال عبر Nodemailer</span>
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 w-fit ${
                              u.isBlocked
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : u.licenseStatus === 'active'
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                              <span>
                                {u.isBlocked
                                  ? 'Suspended'
                                  : u.licenseStatus === 'active'
                                  ? 'Active License'
                                  : 'Expired'}
                              </span>
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSendLicenseEmail(u.email)}
                                disabled={sendingEmailUser === u.email}
                                title="إرسال مفتاح الترخيص مباشرة إلى بريد المعلم عبر Nodemailer"
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {sendingEmailUser === u.email ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => handleOpenEditUser(u)}
                                title="Edit Teacher Account"
                                className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 rounded-lg transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRenewLicense(u.email)}
                                title="Issue New License Key"
                                className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg transition-colors"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleFlagUser(u.email)}
                                title={u.isFlagged ? 'Remove Flag' : 'Flag Account'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  u.isFlagged
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                    : 'bg-slate-700/50 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border-slate-600'
                                }`}
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>

                              {u.email !== 'abdallahbourrich66@gmail.com' && (
                                <button
                                  onClick={() => handleToggleBlockUser(u.email)}
                                  title={u.isBlocked ? 'Unblock Account' : 'Block Account'}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    u.isBlocked
                                      ? 'bg-red-600 text-white border-red-500'
                                      : 'bg-slate-700/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border-slate-600'
                                  }`}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {u.email !== 'abdallahbourrich66@gmail.com' && (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  title="Delete Account"
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No teacher accounts match your search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SALES & REVENUE */}
        {activeTab === 'sales' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                <input
                  type="text"
                  value={searchSales}
                  onChange={(e) => setSearchSales(e.target.value)}
                  placeholder="Search license key, email or customer..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => setIsIssueLicenseOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Manual License</span>
              </button>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">License Key</th>
                      <th className="p-4">Buyer / Customer</th>
                      <th className="p-4">Plan Name</th>
                      <th className="p-4">Amount (DZD)</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Date Issued</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-300 font-medium">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 font-mono text-teal-400 font-bold">
                          {s.key}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-white">{s.userName || 'Customer'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.userEmail}</div>
                        </td>
                        <td className="p-4 font-extrabold text-slate-200">
                          {s.plan === 'pro' ? 'Personal Yearly License' : s.plan.toUpperCase()}
                        </td>
                        <td className="p-4 font-extrabold text-teal-300">
                          {s.amountDZD?.toLocaleString()} DZD
                        </td>
                        <td className="p-4 text-slate-300 text-[11px]">
                          {s.paidVia}
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {s.issuedAt}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                            s.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {s.status === 'active' ? 'Active' : 'Revoked'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {s.status === 'active' ? (
                            <button
                              onClick={() => handleRevokeLicense(s.key)}
                              title="إلغاء الترخيص عبر LicenseSeat API"
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Revoked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3.5: PRICING SETTINGS (IMMEDIATE DB PERSISTENCE) */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            {loadingPricing || !pricingSettings ? (
              <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                <span>Loading Pricing Configuration from Database...</span>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Status & Instant Persistence Header Banner */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-teal-400" />
                      <h3 className="text-base font-extrabold text-white">
                        Pricing & Subscription Configuration
                      </h3>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Connected to PostgreSQL Database</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Price changes auto-save immediately to the database on edit, on blur, and upon exiting the admin dashboard.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {isSavingPricing && (
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to database...</span>
                      </span>
                    )}

                    {pricingSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fadeIn">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{pricingSuccessMsg}</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleManualSavePricing()}
                      disabled={isSavingPricing}
                      className="px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingPricing ? 'Saving...' : 'Save & Persist Now'}</span>
                    </button>
                  </div>
                </div>

                {/* Promotional Notice Banner */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <h4 className="text-sm font-extrabold text-white">
                      Promotional Season Headline & Currency
                    </h4>
                    <span className="text-xs text-teal-400 font-mono font-bold">
                      {currentPricing.currencyDZD}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Promo Notice (English)
                      </label>
                      <input
                        type="text"
                        value={currentPricing.promoNoticeEn || ''}
                        onChange={(e) => handlePricingChange({
                          ...currentPricing,
                          promoNoticeEn: e.target.value
                        })}
                        onBlur={() => handleManualSavePricing()}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Promo Notice (Arabic)
                      </label>
                      <input
                        type="text"
                        value={currentPricing.promoNoticeAr || ''}
                        onChange={(e) => handlePricingChange({
                          ...currentPricing,
                          promoNoticeAr: e.target.value
                        })}
                        onBlur={() => handleManualSavePricing()}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* PRIMARY PLAN: Personal Yearly License Highlight Card */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-teal-500 rounded-2xl p-6 space-y-6 relative shadow-xl shadow-teal-500/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold uppercase rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Primary Active Store Plan</span>
                        </span>
                        <span className="text-[11px] text-teal-300 font-mono font-bold bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
                          3 PC Devices Offline
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
                        <span>Personal Yearly License</span>
                        <span className="text-xs text-slate-400 font-normal">(Primary Store License Plan)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        This is the active plan displayed on the landing page and billed through the Chargily Pay Edahabia/CIB gateway.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleManualSavePricing()}
                      disabled={isSavingPricing}
                      className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPricing ? 'Saving...' : 'Save Price Now'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Price Input Column */}
                    <div className="bg-slate-950/70 border border-teal-500/30 rounded-xl p-4 space-y-2">
                      <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                        License Price (DZD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={50}
                          step={50}
                          value={currentPricing.plans.pro.priceDZD}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handlePricingChange({
                              ...currentPricing,
                              plans: {
                                ...currentPricing.plans,
                                pro: { ...currentPricing.plans.pro, priceDZD: val }
                              }
                            });
                          }}
                          onBlur={() => handleManualSavePricing()}
                          className="w-full bg-slate-900 border border-teal-500/60 rounded-xl px-4 py-3 text-xl font-black text-amber-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                        />
                        <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400">
                          DZD
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Auto-saves immediately to DB on input & blur</span>
                      </p>
                    </div>

                    {/* Plan Badge & Duration */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Display Badge Tag
                        </label>
                        <input
                          type="text"
                          value={currentPricing.plans.pro.badgeEn || currentPricing.plans.pro.badgeAr || ''}
                          onChange={(e) => handlePricingChange({
                            ...currentPricing,
                            plans: {
                              ...currentPricing.plans,
                              pro: {
                                ...currentPricing.plans.pro,
                                badgeEn: e.target.value,
                                badgeAr: e.target.value
                              }
                            }
                          })}
                          onBlur={() => handleManualSavePricing()}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Duration & PC Devices
                        </label>
                        <input
                          type="text"
                          value={currentPricing.plans.pro.periodEn || '1 Year / 1 PC'}
                          onChange={(e) => handlePricingChange({
                            ...currentPricing,
                            plans: {
                              ...currentPricing.plans,
                              pro: {
                                ...currentPricing.plans.pro,
                                periodEn: e.target.value
                              }
                            }
                          })}
                          onBlur={() => handleManualSavePricing()}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Features Included */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Features Included (One line per feature)
                      </label>
                      <textarea
                        rows={4}
                        value={(currentPricing.plans.pro.featuresEn || currentPricing.plans.pro.featuresAr).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          handlePricingChange({
                            ...currentPricing,
                            plans: {
                              ...currentPricing.plans,
                              pro: {
                                ...currentPricing.plans.pro,
                                featuresEn: lines,
                                featuresAr: lines
                              }
                            }
                          });
                        }}
                        onBlur={() => handleManualSavePricing()}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Save Action Bar */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-medium">
                    All price changes persist to PostgreSQL and backup storage immediately. Exiting or reloading will keep your latest changes intact.
                  </span>

                  <button
                    type="button"
                    onClick={() => handleManualSavePricing()}
                    disabled={isSavingPricing}
                    className="px-6 py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPricing ? 'Saving to Database...' : 'Save All Pricing Settings'}</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3.7: PROMO CODES */}
        {activeTab === 'promos' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[11px] font-bold">Total Promo Codes</div>
                  <div className="text-xl font-black text-white">{promosList.length}</div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[11px] font-bold">Active Codes</div>
                  <div className="text-xl font-black text-white">
                    {promosList.filter(p => Boolean(p.isActive)).length}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[11px] font-bold">Total Redemptions</div>
                  <div className="text-xl font-black text-white">
                    {promosList.reduce((acc, p) => acc + (p.uses || 0), 0)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[11px] font-bold">Max Discount</div>
                  <div className="text-xl font-black text-white">
                    {promosList.length ? Math.max(...promosList.map(p => p.discountPercent || 0)) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Banner */}
            {promoFeedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn ${
                  promoFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                    : 'bg-red-950/60 border-red-700/80 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {promoFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{promoFeedback.text}</span>
                </div>
                <button
                  onClick={() => setPromoFeedback(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                <input
                  type="text"
                  value={searchPromoQuery}
                  onChange={(e) => setSearchPromoQuery(e.target.value)}
                  placeholder="Search promo codes..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchPromos()}
                  className="p-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                  title="Refresh promo codes"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setNewPromoForm({ code: '', discountPercent: 15, maxUses: 100, expirationDate: '', isActive: true });
                    setIsAddPromoOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Promo</span>
                </button>
              </div>
            </div>

            {/* Promo Codes Table */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-700 text-slate-400 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-4">Promo Code</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Usage (Uses / Max)</th>
                      <th className="p-4">Expiration Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-300">
                    {promosList
                      .filter((p) => p.code.toLowerCase().includes(searchPromoQuery.toLowerCase()))
                      .map((p) => {
                        const isExpired = p.expirationDate ? new Date(p.expirationDate) < new Date() : false;
                        const usageRatio = p.maxUses ? Math.min(100, Math.round((p.uses / p.maxUses) * 100)) : null;

                        return (
                          <tr key={p.code} className="hover:bg-slate-750/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2.5 py-1 rounded-lg tracking-wider text-xs flex items-center gap-1.5">
                                  <Tag className="w-3 h-3 text-teal-400" />
                                  {p.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPromoCode(p.code)}
                                  title="Copy promo code"
                                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700/50 transition-colors"
                                >
                                  {copiedPromoCode === p.code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 font-black text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-lg text-xs">
                                <Percent className="w-3 h-3 text-amber-400" />
                                {p.discountPercent}% OFF
                              </span>
                            </td>

                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleTogglePromoStatus(p)}
                                title="Click to toggle active state"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                  p.isActive
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                    : 'bg-slate-700/40 text-slate-400 border-slate-600/40 hover:bg-slate-700/60'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    p.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                  }`}
                                />
                                {p.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>

                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-200">
                                  {p.uses} / {p.maxUses ? p.maxUses : '∞ Unlimited'}
                                </div>
                                {usageRatio !== null && (
                                  <div className="w-24 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-700/60">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        usageRatio >= 100
                                          ? 'bg-red-500'
                                          : usageRatio >= 75
                                          ? 'bg-amber-500'
                                          : 'bg-teal-500'
                                      }`}
                                      style={{ width: `${usageRatio}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              {p.expirationDate ? (
                                isExpired ? (
                                  <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-950/40 border border-red-800/40 px-2.5 py-1 rounded-lg text-[11px]">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    Expired ({String(p.expirationDate).split('T')[0]})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                    {String(p.expirationDate).split('T')[0]}
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">No Expiration (Never)</span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPromo(p)}
                                  className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                  title="Edit promo code"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePromo(p.code)}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                  title="Delete promo code"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {promosList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="font-bold">No promo codes found</p>
                          <p className="text-slate-500 text-[11px] mt-1">
                            Click &quot;Create New Promo&quot; above to add your first discount code.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: CREATE NEW PROMO CODE */}
        {isAddPromoOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-200 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-white">Create New Promo Code</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPromoOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
                {/* Field 1: Promo Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-teal-400" />
                      Promo Code (رمز الخصم)
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TEACHER2026"
                    value={newPromoForm.code}
                    onChange={(e) =>
                      setNewPromoForm({ ...newPromoForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-wider uppercase text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Letters and numbers only. Case is automatically uppercase.</p>
                </div>

                {/* Field 2: Discount Percentage */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-400" />
                      Discount Percentage (نسبة الخصم)
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase">1 - 100%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="e.g. 15"
                      value={newPromoForm.discountPercent}
                      onChange={(e) =>
                        setNewPromoForm({ ...newPromoForm, discountPercent: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-8 text-white font-bold text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
                  </div>
                  {/* Preset discount shortcuts */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">Quick set:</span>
                    {[10, 15, 20, 25, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setNewPromoForm({ ...newPromoForm, discountPercent: pct })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          newPromoForm.discountPercent === pct
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 3: Max Uses Limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-400" />
                      Usage Limit / Max Uses (الحد الأقصى للاستخدامات)
                    </span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited"
                    value={newPromoForm.maxUses}
                    onChange={(e) =>
                      setNewPromoForm({
                        ...newPromoForm,
                        maxUses: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Leave empty if code can be used unlimited times.</p>
                </div>

                {/* Field 4: Expiration Date (Date Picker) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      Expiration Date (تاريخ انتهاء الصلاحية)
                    </span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newPromoForm.expirationDate}
                      onChange={(e) =>
                        setNewPromoForm({ ...newPromoForm, expirationDate: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs [color-scheme:dark] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Leave blank for no expiration date.</span>
                    {newPromoForm.expirationDate && (
                      <button
                        type="button"
                        onClick={() => setNewPromoForm({ ...newPromoForm, expirationDate: '' })}
                        className="text-teal-400 hover:underline font-semibold"
                      >
                        Clear date
                      </button>
                    )}
                  </div>
                </div>

                {/* Field 5: Status Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPromoForm.isActive}
                      onChange={(e) =>
                        setNewPromoForm({ ...newPromoForm, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs font-bold text-slate-300">
                      Enable immediately (Active Status)
                    </span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddPromoOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={promoLoading}
                    className="px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {promoLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Promo Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT EXISTING PROMO CODE */}
        {editingPromo && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-200 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Edit Promo Code</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Modifying {editingPromo.code}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Usage Stat Pill */}
              <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Redemptions:</span>
                <span className="font-extrabold text-teal-400">
                  {editingPromo.uses} time{editingPromo.uses === 1 ? '' : 's'}
                </span>
              </div>

              <form onSubmit={handleUpdatePromo} className="space-y-4 text-xs">
                {/* Field 1: Promo Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      Promo Code (رمز الخصم)
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPromoForm.code}
                    onChange={(e) =>
                      setEditPromoForm({ ...editPromoForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-wider uppercase text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">You can rename this promo code if desired.</p>
                </div>

                {/* Field 2: Discount Percentage */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-400" />
                      Discount Percentage (نسبة الخصم)
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase">1 - 100%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={editPromoForm.discountPercent}
                      onChange={(e) =>
                        setEditPromoForm({ ...editPromoForm, discountPercent: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-8 text-white font-bold text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
                  </div>
                  {/* Preset discount shortcuts */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">Quick set:</span>
                    {[10, 15, 20, 25, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setEditPromoForm({ ...editPromoForm, discountPercent: pct })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          editPromoForm.discountPercent === pct
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 3: Max Uses Limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-400" />
                      Usage Limit / Max Uses (الحد الأقصى للاستخدامات)
                    </span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited"
                    value={editPromoForm.maxUses}
                    onChange={(e) =>
                      setEditPromoForm({
                        ...editPromoForm,
                        maxUses: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Leave empty for unlimited redemptions.</p>
                </div>

                {/* Field 4: Expiration Date (Date Picker) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      Expiration Date (تاريخ انتهاء الصلاحية)
                    </span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={editPromoForm.expirationDate}
                      onChange={(e) =>
                        setEditPromoForm({ ...editPromoForm, expirationDate: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs [color-scheme:dark] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Leave blank for no expiration date.</span>
                    {editPromoForm.expirationDate && (
                      <button
                        type="button"
                        onClick={() => setEditPromoForm({ ...editPromoForm, expirationDate: '' })}
                        className="text-teal-400 hover:underline font-semibold"
                      >
                        Clear date
                      </button>
                    )}
                  </div>
                </div>

                {/* Field 5: Status Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPromoForm.isActive}
                      onChange={(e) =>
                        setEditPromoForm({ ...editPromoForm, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs font-bold text-slate-300">
                      Active Status (الرمز مفعّل ويعمل حالياً)
                    </span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPromo(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={promoLoading}
                    className="px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {promoLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: CONFIRM DELETE PROMO CODE */}
        {promoToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 text-slate-200 shadow-2xl animate-scaleUp">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delete Promo Code</h3>
                <p className="text-slate-400 text-xs mt-1.5">
                  Are you sure you want to permanently delete promo code:
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 font-mono font-extrabold text-sm text-teal-300 bg-teal-950/60 border border-teal-800/60 px-3 py-1.5 rounded-xl">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  {promoToDelete}
                </div>
                <p className="text-[11px] text-red-400/80 mt-2">
                  This action cannot be undone. Users will no longer be able to apply or redeem this discount code at checkout.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingPromo}
                  onClick={() => setPromoToDelete(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingPromo}
                  onClick={() => confirmDeletePromo(promoToDelete)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeletingPromo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Promo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutorials' && (
          <div className="space-y-4 animate-fadeIn">
            
            {tutorialFeedback && (
              <div className="p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-xs flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="font-semibold">{tutorialFeedback.text}</span>
                </div>
                <button
                  onClick={() => setTutorialFeedback(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                <input
                  type="text"
                  value={searchTutorials}
                  onChange={(e) => setSearchTutorials(e.target.value)}
                  placeholder="Search video tutorials..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {tutorialsList.length > 0 && (
                  <button
                    onClick={handleEmptyAllTutorials}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Empty All Videos</span>
                  </button>
                )}
                <button
                  onClick={() => setIsAddTutorialOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Video Tutorial</span>
                </button>
              </div>
            </div>

            {filteredTutorials.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Video className="w-6 h-6 text-teal-400" />
                </div>
                <h4 className="text-sm font-extrabold text-white">No Tutorial Videos Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The video library is currently empty. Click "Add New Video Tutorial" to add a new tutorial.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTutorials.map((tut) => (
                  <div key={tut.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-40 rounded-xl overflow-hidden bg-slate-950">
                        <img src={tut.thumbnailUrl} alt={tut.titleAr} className="w-full h-full object-cover opacity-80" />
                        <span className="absolute bottom-2 right-2 bg-slate-900/90 text-teal-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          {tut.duration}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-xs line-clamp-2 leading-relaxed">
                        {tut.titleAr}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {tut.descriptionAr}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                      {inlineDeletingId === tut.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-rose-300 font-bold">Delete permanently?</span>
                          <button
                            onClick={() => executeDeleteTutorial(tut.id, tut.titleAr)}
                            disabled={isDeletingTutorial}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => setInlineDeletingId(null)}
                            className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setInlineDeletingId(tut.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 5: ENQUIRIES & SOS INBOX */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs font-bold">
              <span className="text-slate-400">Filter Inquiries:</span>
              
              <button
                onClick={() => setFilterInquiryStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterInquiryStatus === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All Inquiries
              </button>

              <button
                onClick={() => setFilterInquiryStatus('sos')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filterInquiryStatus === 'sos' ? 'bg-red-600 text-white' : 'bg-slate-900 text-red-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>🚨 SOS Priority Only</span>
              </button>

              <button
                onClick={() => setFilterInquiryStatus('pending')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterInquiryStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>

              <button
                onClick={() => setFilterInquiryStatus('replied')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterInquiryStatus === 'replied' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Replied
              </button>
            </div>

            <div className="space-y-3">
              {filteredInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`bg-slate-800/80 border rounded-2xl p-5 space-y-3 transition-all ${
                    inq.isSOS && inq.status === 'pending'
                      ? 'border-red-500/80 shadow-lg shadow-red-500/10'
                      : 'border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      {inq.isSOS && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>SOS PRIORITY</span>
                        </span>
                      )}
                      <h4 className="font-extrabold text-white text-sm">
                        {inq.subject}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                      inq.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {inq.status === 'replied' ? 'Replied' : 'Pending Admin Reply'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {inq.message}
                  </div>

                  {inq.adminReply && (
                    <div className="bg-teal-950/40 border border-teal-500/30 p-3 rounded-xl space-y-1">
                      <div className="text-[11px] font-extrabold text-teal-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Technical Response:</span>
                      </div>
                      <p className="text-xs text-slate-200">{inq.adminReply}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                    <div>
                      <span>{inq.userName} ({inq.userEmail}) • {inq.wilaya}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReplyingInquiry(inq);
                          setReplyText(inq.adminReply || '');
                        }}
                        className="px-3 py-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>{inq.adminReply ? 'Update Reply' : 'Send Admin Reply'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 6: BLOG & CONTENT */}
        {activeTab === 'blog' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                <input
                  type="text"
                  value={searchPosts}
                  onChange={(e) => setSearchPosts(e.target.value)}
                  placeholder="Search blog articles..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => setIsAddPostOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Blog Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <img src={post.imageUrl} alt={post.titleAr} className="w-full h-36 object-cover rounded-xl bg-slate-950" />
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-extrabold rounded">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{post.publishDate}</span>
                    </div>

                    <h4 className="font-extrabold text-white text-xs line-clamp-2 leading-relaxed">
                      {post.titleAr}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {post.excerptAr}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px]">
                    <span className="text-slate-400 font-medium">{post.author}</span>
                    
                    <button
                      onClick={() => handleDeleteBlogPost(post.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 7: EMAIL & SMTP SETTINGS (NODEMAILER) */}
        {activeTab === 'smtp' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header Banner */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    إعدادات خادم البريد (Nodemailer Direct SMTP)
                  </h3>
                  {smtpSettings.hasPassword ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>اتصال SMTP مفعل وجاهز</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>في انتظار كلمة المرور (App Password)</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  هذا النظام يستخدم <strong>Nodemailer</strong> لإرسال مفاتيح التراخيص مباشرة إلى البريد الإلكتروني الذي تدخله في النموذج لكل معلم، دون وسيط خارجي وبدون الحاجة لشراء أو توثيق أي نطاق مخصص (Domain).
                </p>
              </div>

              <button
                type="button"
                onClick={fetchSmtpSettings}
                disabled={loadingSmtp}
                className="px-3.5 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-end md:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSmtp ? 'animate-spin' : ''}`} />
                <span>تحديث الحالة</span>
              </button>
            </div>

            {/* Notification Banner */}
            {smtpFeedback && (
              <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-sm animate-fadeIn ${
                smtpFeedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2.5 font-bold">
                  {smtpFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{smtpFeedback.text}</span>
                </div>
                <button
                  onClick={() => setSmtpFeedback(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Card */}
              <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-5">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                  <Save className="w-4 h-4 text-teal-400" />
                  <span>تكوين بيانات الاتصال بخادم البريد (SMTP Credentials)</span>
                </h4>

                <form onSubmit={handleSaveSmtp} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">نوع الخدمة (Service)</label>
                      <select
                        value={smtpSettings.service}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, service: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="gmail">Gmail (موصى به - مجاني وفوري)</option>
                        <option value="custom">Custom SMTP Server (Brevo / Mailjet / الخادم الخاص)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">بريد الإرسال (Gmail / SMTP User)</label>
                      <input
                        type="email"
                        required
                        value={smtpSettings.user}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value, fromEmail: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">اسم المرسل (Sender Display Name)</label>
                    <input
                      type="text"
                      required
                      value={smtpSettings.fromName}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                      placeholder="رفيق المعلم الجزائري - Teacher Mate DZ"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      كلمة مرور التطبيق (App Password)
                      {smtpSettings.hasPassword && (
                        <span className="text-[10px] text-emerald-400 mr-2 font-normal">
                          (كلمة المرور الحالية محفوظة ومفعلة ✓)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={smtpSettings.pass}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                      placeholder={smtpSettings.hasPassword ? "أدخل كلمة مرور جديدة للتحديث فقط..." : "أدخل الـ 16 حرفاً الخاصة بـ App Password..."}
                    />
                    <div className="mt-2 p-3 bg-teal-950/40 border border-teal-500/20 rounded-xl text-slate-300 leading-relaxed text-[11px] space-y-1">
                      <div className="font-bold text-teal-400">💡 كيف تحصل على كلمة مرور التطبيق (Gmail App Password) في 30 ثانية:</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                        <li>افتح إعدادات حساب Google الخاص بك (myaccount.google.com).</li>
                        <li>انتقل إلى قسم <strong>الأمان (Security)</strong> وتأكد من تفعيل <strong>التحقق بخطوتين (2-Step Verification)</strong>.</li>
                        <li>ابحث عن <strong>كلمات مرور التطبيقات (App passwords)</strong>.</li>
                        <li>اكتب اسم التطبيق (مثال: Teacher Mate) واضغط <strong>إنشاء (Generate)</strong>.</li>
                        <li>انسخ الرمز المكون من 16 حرفاً والصقه في الخانة أعلاه واضغط حفظ.</li>
                      </ol>
                    </div>
                  </div>

                  {smtpSettings.service === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpSettings.host}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">SMTP Port</label>
                        <input
                          type="number"
                          value={smtpSettings.port}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, port: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                          placeholder="587"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingSmtp}
                      className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {savingSmtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري حفظ الإعدادات...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>حفظ إعدادات خادم البريد (Save SMTP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Test Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                    <Send className="w-4 h-4 text-teal-400" />
                    <span>فحص الاتصال الفوري (Live SMTP Test)</span>
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    أدخل أي بريد إلكتروني واضغط زر الفحص للتأكد من أن رسائل التفعيل تصل فوراً بدون أي حظر أو قيود.
                  </p>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 text-xs">
                      البريد المراد استقبال رسالة الفحص عليه:
                    </label>
                    <input
                      type="email"
                      value={testEmailTarget}
                      onChange={(e) => setTestEmailTarget(e.target.value)}
                      placeholder={smtpSettings.user || "target@domain.com"}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {testingSmtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري فحص الاتصال وإرسال البريد...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال رسالة تجريبية الآن</span>
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-slate-400 text-center">
                    تستخدم هذه الأداة Nodemailer لإجراء فحص حي لمنفذ 587 وإرسال رسالة نموذجية.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* MODAL: ADD NEW USER ACCOUNT */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              <span>Add Teacher or Admin Account</span>
            </h3>

            {createUserError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-medium">{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="Teacher Name"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="teacher@education.dz"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Password (Account Login Access)</label>
                <input
                  type="text"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                  placeholder="Set account password (e.g. teacher2026)"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Provide this password to the teacher so they can log in to their account.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Primary School Name</label>
                <input
                  type="text"
                  value={newUserForm.schoolName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, schoolName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Ibn Khaldoun Primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. 0555123456"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Wilaya (69 Algerian Provinces)
                </label>
                <select
                  value={newUserForm.wilaya}
                  onChange={(e) => setNewUserForm({ ...newUserForm, wilaya: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w.code} value={`${w.code} - ${w.nameAr} / ${w.nameFr}`}>
                      {w.code} - {w.nameAr} ({w.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Account Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="user">Teacher (Standard Account)</option>
                  <option value="admin">Administrator (Admin Console)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">License Plan</label>
                <select
                  value={newUserForm.licensePlan}
                  onChange={(e) => setNewUserForm({ ...newUserForm, licensePlan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="personal-lifetime">Personal Lifetime License (1 PC)</option>
                  <option value="pro">Personal Yearly License (1 PC)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl">
                <input
                  type="checkbox"
                  id="modalSendEmail"
                  checked={newUserForm.sendEmail}
                  onChange={(e) => setNewUserForm({ ...newUserForm, sendEmail: e.target.checked })}
                  className="w-4 h-4 text-teal-500 rounded border-slate-600 bg-slate-900 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="modalSendEmail" className="text-slate-300 font-semibold cursor-pointer select-none flex items-center gap-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>إرسال مفتاح الترخيص وبيانات الدخول مباشرة إلى بريد المعلم عبر Nodemailer</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isCreatingUser ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account & Generating Key...</span>
                    </>
                  ) : (
                    <span>Create Account & Generate Key</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION (REPLACES BROKEN WINDOW.CONFIRM) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Delete Teacher Account</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete teacher account for <span className="font-bold text-white">"{userToDelete.fullName}"</span> ({userToDelete.email})? Their license key and records will also be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER ACCOUNT */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-teal-400" />
              <span>Edit Teacher Account</span>
            </h3>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={editUserForm.email}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Primary School Name</label>
                <input
                  type="text"
                  value={editUserForm.schoolName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, schoolName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Ibn Khaldoun Primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Wilaya</label>
                <select
                  value={editUserForm.wilaya}
                  onChange={(e) => setEditUserForm({ ...editUserForm, wilaya: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w.code} value={`${w.code} - ${w.nameAr} / ${w.nameFr}`}>
                      {w.code} - {w.nameAr} ({w.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Account Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="user">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">License Status</label>
                  <select
                    value={editUserForm.licenseStatus}
                    onChange={(e) => setEditUserForm({ ...editUserForm, licenseStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditUser}
                  className="px-5 py-2.5 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {isSavingEditUser ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO SUPPORT INQUIRY */}
      {replyingInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setReplyingInquiry(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-400" />
              <span>Reply to Teacher Support Inquiry</span>
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-teal-400">{replyingInquiry.userName} ({replyingInquiry.wilaya})</span>
              <p className="text-slate-300">{replyingInquiry.message}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Official Technical Response
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write clear instructions or solution for the teacher..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReply}
                className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReply ? 'Sending Response...' : 'Send Response to Teacher'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VIDEO TUTORIAL */}
      {isAddTutorialOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setIsAddTutorialOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-400" />
              <span>Add New Video Tutorial</span>
            </h3>

            <form onSubmit={handleCreateTutorial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={newTutorialForm.titleAr}
                  onChange={(e) => setNewTutorialForm({ ...newTutorialForm, titleAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="How to use the Lesson Plan Generator"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">YouTube Embed URL</label>
                <input
                  type="text"
                  required
                  value={newTutorialForm.videoUrl}
                  onChange={(e) => setNewTutorialForm({ ...newTutorialForm, videoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Key Steps (One step per line)</label>
                <textarea
                  rows={3}
                  value={newTutorialForm.keySteps}
                  onChange={(e) => setNewTutorialForm({ ...newTutorialForm, keySteps: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  Publish Video Tutorial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BLOG POST */}
      {isAddPostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setIsAddPostOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>Create Pedagogical Article</span>
            </h3>

            <form onSubmit={handleCreateBlogPost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={newBlogPostForm.titleAr}
                  onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, titleAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="Primary English Pedagogical Guide 2026"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Author Name</label>
                <input
                  type="text"
                  value={newBlogPostForm.author}
                  onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, author: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Content Body</label>
                <textarea
                  rows={5}
                  required
                  value={newBlogPostForm.contentAr}
                  onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, contentAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="Write article details..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE MANUAL LICENSE */}
      {isIssueLicenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setIsIssueLicenseOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" />
              <span>Issue Manual Offline License</span>
            </h3>

            <form onSubmit={handleIssueLicense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Customer / Teacher Name</label>
                <input
                  type="text"
                  required
                  value={issueLicenseForm.userName}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, userName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="Teacher Name"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  value={issueLicenseForm.userEmail}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, userEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="teacher@domain.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={issueLicenseForm.phone}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. 0555123456"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Wilaya</label>
                <select
                  value={issueLicenseForm.wilaya}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, wilaya: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w.code} value={`${w.code} - ${w.nameAr} / ${w.nameFr}`}>
                      {w.code} - {w.nameAr} ({w.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Primary School Name</label>
                <input
                  type="text"
                  value={issueLicenseForm.schoolName}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, schoolName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Ibn Khaldoun Primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">License Plan</label>
                <select
                  value={issueLicenseForm.plan}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, plan: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="personal-lifetime">Personal Lifetime License (1 PC)</option>
                  <option value="pro">Personal Yearly License (1 PC)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={issueLicenseForm.paidVia}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, paidVia: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Chargily Pay v2 (Edahabia/CIB)">Chargily Pay v2 (Edahabia/CIB)</option>
                  <option value="BaridiMob / CCP">BaridiMob / CCP</option>
                  <option value="Manual Admin Issue">Manual Admin Issue</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl">
                <input
                  type="checkbox"
                  id="modalIssueSendEmail"
                  checked={issueLicenseForm.sendEmail}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, sendEmail: e.target.checked })}
                  className="w-4 h-4 text-teal-500 rounded border-slate-600 bg-slate-900 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="modalIssueSendEmail" className="text-slate-300 font-semibold cursor-pointer select-none flex items-center gap-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>إرسال مفتاح الترخيص وبيانات التفعيل فوراً إلى بريد العميل عبر Nodemailer</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isIssuingLicense}
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isIssuingLicense ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إصدار الرخصة وإرسال البريد...</span>
                    </>
                  ) : (
                    <span>Generate & Activate License</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE TUTORIAL */}
      {tutorialToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">Delete Tutorial Video</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{tutorialToDelete.titleAr}"</span>? This video will be removed permanently.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingTutorial}
                onClick={() => setTutorialToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingTutorial}
                onClick={confirmDeleteTutorial}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                {isDeletingTutorial ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Video</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
