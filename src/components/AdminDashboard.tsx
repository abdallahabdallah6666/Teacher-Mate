import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Video,
  FileText,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Key,
  LogOut,
  BarChart2,
  Send,
  X,
  UserCheck,
  UserX,
  Mail,
  School,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Zap,
  Globe,
  Flag,
  Ban,
  DollarSign,
  Tag,
  Save,
  Check
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { UserProfile, SupportInquiry, LicenseRecord, BlogPost, TutorialVideo, PricingSettings, PricingPlanConfig } from '../types';
import { Language } from './Navbar';

interface AdminDashboardProps {
  user: UserProfile;
  lang: Language;
  onLogout: () => void;
}

type AdminTab = 'overview' | 'accounts' | 'sales' | 'pricing' | 'tutorials' | 'enquiries' | 'blog';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, lang, onLogout }) => {
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
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Sales state
  const [salesList, setSalesList] = useState<LicenseRecord[]>([]);
  const [searchSales, setSearchSales] = useState<string>('');
  const [isIssueLicenseOpen, setIsIssueLicenseOpen] = useState<boolean>(false);

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
    wilaya: '16 - الجزائر',
    schoolName: '',
    licensePlan: 'pro',
    licenseStatus: 'active'
  });

  const [newTutorialForm, setNewTutorialForm] = useState({
    titleAr: '',
    titleFr: '',
    descriptionAr: '',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    duration: '05:30',
    category: 'صانع المذكرات الذكي',
    keySteps: '1. اختيار المستوى التعلمي\n2. تحديد المقطع الرسمي\n3. التوليد والتصدير الفوري'
  });

  const [newBlogPostForm, setNewBlogPostForm] = useState({
    titleAr: '',
    titleFr: '',
    excerptAr: '',
    category: 'تدريس الإنجليزية',
    author: 'أ. مريم المفتشة التربوية',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    contentAr: ''
  });

  const [issueLicenseForm, setIssueLicenseForm] = useState({
    userEmail: '',
    userName: '',
    plan: 'pro',
    paidVia: 'Chargily Pay v2 (Edahabia/CIB)',
    amountDZD: 2900
  });

  // Pricing Settings State
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [loadingPricing, setLoadingPricing] = useState<boolean>(false);
  const [isSavingPricing, setIsSavingPricing] = useState<boolean>(false);

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSales();
    fetchTutorials();
    fetchInquiries();
    fetchBlogPosts();
    fetchPricingSettings();
  }, []);

  const fetchPricingSettings = async () => {
    setLoadingPricing(true);
    try {
      const res = await fetch('/api/admin/pricing');
      if (res.ok) {
        const data = await res.json();
        setPricingSettings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingSettings) return;
    setIsSavingPricing(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingSettings)
      });
      if (res.ok) {
        alert(
          lang === 'en'
            ? 'Pricing settings saved successfully!'
            : lang === 'fr'
            ? 'Paramètres de tarification enregistrés !'
            : 'تم حفظ إعدادات الأسعار والاشتراكات بنجاح!'
        );
        fetchPricingSettings();
      } else {
        alert('Failed to save pricing settings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPricing(false);
    }
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

  // Handlers for Accounts
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        setIsAddUserOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFlagUser = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/toggle-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagReason: 'Flagged by Admin' })
      });
      if (res.ok) {
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
        fetchUsers();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to block user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (email: string) => {
    const confirmMsg = lang === 'en'
      ? `Are you sure you want to permanently delete user ${email}?`
      : lang === 'fr'
      ? `Êtes-vous sûr de vouloir supprimer définitivement le compte ${email} ?`
      : `هل أنت متأكد من حذف حساب الأستاذ ${email} نهائياً؟`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsersList(prev => prev.filter(u => u.email.toLowerCase() !== email.toLowerCase()));
        fetchUsers();
        fetchStats();
      } else {
        const json = await res.json();
        alert(json.error || 'Error deleting user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenewLicense = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/renew-license`, {
        method: 'POST'
      });
      if (res.ok) {
        alert(lang === 'en' ? 'License key regenerated successfully!' : 'تم إعادة إصدار مفتاح جديد للحساب بنجاح!');
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Sales
  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueLicenseForm)
      });
      if (res.ok) {
        setIsIssueLicenseOpen(false);
        fetchSales();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Tutorials
  const handleCreateTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stepsArr = newTutorialForm.keySteps.split('\n').filter(s => s.trim().length > 0);
      const res = await fetch('/api/admin/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTutorialForm, keySteps: stepsArr })
      });
      if (res.ok) {
        setIsAddTutorialOpen(false);
        fetchTutorials();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTutorial) return;
    try {
      const res = await fetch(`/api/admin/tutorials/${editingTutorial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTutorial)
      });
      if (res.ok) {
        setEditingTutorial(null);
        fetchTutorials();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this tutorial video?' : 'هل أنت تأكد من حذف فيديو الشرح هذا؟')) return;
    try {
      const res = await fetch(`/api/admin/tutorials/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTutorials();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Inquiries
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingInquiry || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/admin/inquiries/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: replyingInquiry.id,
          adminReply: replyText.trim()
        })
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

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this support inquiry?' : 'هل تريد حذف هذا الاستفسار؟')) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInquiries();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Blog
  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/blog', {
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

  const handleUpdateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/admin/blog/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost)
      });
      if (res.ok) {
        setEditingPost(null);
        fetchBlogPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this blog article?' : 'هل أنت تأكد من حذف المقال؟')) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBlogPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
      (u.schoolName && u.schoolName.toLowerCase().includes(searchUsers.toLowerCase())) ||
      (u.wilaya && u.wilaya.toLowerCase().includes(searchUsers.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.licenseStatus === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredSales = salesList.filter(s =>
    s.userName?.toLowerCase().includes(searchSales.toLowerCase()) ||
    s.userEmail.toLowerCase().includes(searchSales.toLowerCase()) ||
    s.key.toLowerCase().includes(searchSales.toLowerCase()) ||
    s.paidVia.toLowerCase().includes(searchSales.toLowerCase())
  );

  const filteredInquiries = inquiriesList.filter(i => {
    if (filterInquiryStatus === 'sos') return i.isSOS && i.status === 'pending';
    if (filterInquiryStatus === 'pending') return i.status === 'pending';
    if (filterInquiryStatus === 'replied') return i.status === 'replied';
    return true;
  });

  const filteredTutorials = tutorialsList.filter(t =>
    t.titleAr.toLowerCase().includes(searchTutorials.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTutorials.toLowerCase())
  );

  const filteredPosts = postsList.filter(p =>
    p.titleAr.toLowerCase().includes(searchPosts.toLowerCase()) ||
    p.category.toLowerCase().includes(searchPosts.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Top Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-bold text-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  {lang === 'en' ? 'Teacher Companion Console' : lang === 'fr' ? 'Console d\'Administration' : 'لوحة التحكم المركزية - رفيق الأستاذ'}
                </h1>
                <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-extrabold uppercase rounded-full">
                  Admin Control
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
              <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}</span>
              <span className="font-extrabold text-teal-400">{stats?.totalSalesDZD ? stats.totalSalesDZD.toLocaleString() : '0'} DZD</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Teachers' : 'الأساتذة المسجلون'}</span>
              <span className="font-extrabold text-white">{stats?.totalCustomers || usersList.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Active Licenses' : 'الرخص النشطة'}</span>
              <span className="font-extrabold text-blue-400">{stats?.activeLicensesCount || 0}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'SOS Inquiries' : 'طوارئ SOS'}</span>
              <span className={`font-extrabold ${stats?.sosInquiriesCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {stats?.sosInquiriesCount || 0}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              title={lang === 'en' ? 'Refresh Dashboard' : 'تحديث البيانات'}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Logout' : lang === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}</span>
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
            <span>{lang === 'en' ? 'Overview & Analytics' : lang === 'fr' ? 'Vue Générale & Graphes' : 'نظرة عامة ورسوم بيانية'}</span>
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
            <span>{lang === 'en' ? 'Accounts & Teachers' : lang === 'fr' ? 'Comptes Enseignants' : 'إدارة حسابات الأساتذة'}</span>
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
            <span>{lang === 'en' ? 'Sales & Revenue' : lang === 'fr' ? 'Ventes Chargily' : 'المبيعات والدفع الإلكتروني'}</span>
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
            <span>{lang === 'en' ? 'Pricing Settings' : lang === 'fr' ? 'Tarification & Offres' : 'إعدادات الأسعار والاشتراكات'}</span>
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
            <span>{lang === 'en' ? 'Tutorials Settings' : lang === 'fr' ? 'Tutoriels Vidéo' : 'إعدادات دروس الفيديو'}</span>
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
            <span>{lang === 'en' ? 'Enquiries & SOS Alerts' : lang === 'fr' ? 'Demandes & SOS' : 'الاستفسارات وبلاغات SOS'}</span>
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
            <span>{lang === 'en' ? 'Blog & Content' : lang === 'fr' ? 'Articles & Blog' : 'إدارة المقالات والمحتوى'}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{lang === 'en' ? 'Total Revenue (DZD)' : 'إجمالي الإيرادات (دج)'}</span>
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
                    <span className="text-slate-400">{lang === 'en' ? 'vs last month' : 'مقارنة بالشهر الماضي'}</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{lang === 'en' ? 'Registered Teachers' : 'الأساتذة المسجلون'}</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {usersList.length} {lang === 'en' ? 'Teachers' : 'أستاذ'}
                  </div>
                  <p className="text-[11px] text-blue-400 mt-1 font-semibold">
                    {lang === 'en' ? 'Across 58 Algerian Wilayas' : 'عبر كافة ولايات الوطن'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{lang === 'en' ? 'Active Licenses' : 'الرخص النشطة أوفلاين'}</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {stats?.activeLicensesCount || salesList.filter(s => s.status === 'active').length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                    {lang === 'en' ? 'Pro & School Annual Plans' : 'تنشيط 100% بدون إنترنت'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{lang === 'en' ? 'Support Queue / SOS' : 'استفسارات الدعم وطوارئ SOS'}</span>
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
                    {lang === 'en' ? 'Priority Response Enabled' : 'استجابة فورية قبل زيارة المفتش'}
                  </p>
                </div>
              </div>

            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Graph 1: Monthly Sales Growth Curve */}
              <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span>{lang === 'en' ? 'Monthly Revenue Growth (DZD)' : 'منحنى نمو المبيعات والإيرادات الشهرية (دج)'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === 'en' ? 'Chargily Pay Edahabia & CIB annual subscriptions' : 'اشتراكات الرخص السنوية عبر البطاقة الذهبية CIB'}
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

              {/* Graph 2: Plan Breakdown Donut Chart */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-700/80 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>{lang === 'en' ? 'License Plan Distribution' : 'توزيع خطط الاشتراك والرخص'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'en' ? 'Single vs Pro vs School Plans' : 'نسبة الاشتراكات الأحادية والاحترافية والمدارس'}
                  </p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.salesByPlan || [
                          { name: 'Single (1,900 DZD)', value: 25, color: '#0D9488' },
                          { name: 'Pro Plan (2,900 DZD)', value: 65, color: '#1E3A8A' },
                          { name: 'School (8,500 DZD)', value: 10, color: '#6366F1' },
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

            {/* Graph 3: Sales by Wilaya Bar Chart */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-700/80 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <span>{lang === 'en' ? 'Teacher Distribution by Wilaya' : 'انتشار الأساتذة والاشتراكات حسب الولايات الجزائرية'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'en' ? 'Top Algerian Wilayas by registered English teachers' : 'أكثر الولايات استخداماً للبرنامج أوفلاين'}
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.salesByWilaya || [
                    { wilaya: 'الجزائر', teachersCount: 28 },
                    { wilaya: 'وهران', teachersCount: 19 },
                    { wilaya: 'قسنطينة', teachersCount: 15 },
                    { wilaya: 'سطيف', teachersCount: 14 },
                    { wilaya: 'عنابة', teachersCount: 11 },
                    { wilaya: 'تلمسان', teachersCount: 9 },
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
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    placeholder={lang === 'en' ? 'Search teacher name, email or school...' : 'بحث باسم الأستاذ، البريد أو المدرسة...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-9 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">{lang === 'en' ? 'All Roles' : 'جميع الأدوار'}</option>
                  <option value="user">{lang === 'en' ? 'Teachers Only' : 'أساتذة فقط'}</option>
                  <option value="admin">{lang === 'en' ? 'Admins Only' : 'مسؤولون فقط'}</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">{lang === 'en' ? 'All Statuses' : 'جميع الحالات'}</option>
                  <option value="active">{lang === 'en' ? 'Active License' : 'رخصة مفعلة'}</option>
                  <option value="expired">{lang === 'en' ? 'Expired License' : 'رخصة منتهية'}</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Add Teacher Account' : 'إضافة حساب أستاذ جديد'}</span>
              </button>

            </div>

            {/* Users Table */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">{lang === 'en' ? 'Teacher / Account' : 'الأستاذ والبريد'}</th>
                      <th className="p-4">{lang === 'en' ? 'Wilaya & School' : 'الولاية والمدرسة'}</th>
                      <th className="p-4">{lang === 'en' ? 'Role' : 'الدور'}</th>
                      <th className="p-4">{lang === 'en' ? 'License Key' : 'مفتاح الرخصة أوفلاين'}</th>
                      <th className="p-4">{lang === 'en' ? 'Status' : 'حالة التفعيل'}</th>
                      <th className="p-4 text-center">{lang === 'en' ? 'Actions' : 'الإجراءات والتحكم'}</th>
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
                                  <span>{lang === 'en' ? 'FLAGGED' : 'معلّم'}</span>
                                </span>
                              )}
                              {u.isBlocked && (
                                <span className="px-1.5 py-0.2 bg-red-600/30 text-red-300 border border-red-500/50 text-[9px] rounded font-extrabold flex items-center gap-0.5 animate-pulse">
                                  <Ban className="w-2.5 h-2.5" />
                                  <span>{lang === 'en' ? 'BLOCKED' : 'محظور'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                          </td>

                          <td className="p-4">
                            <div className="font-semibold text-slate-200">{u.schoolName || 'مدرسة عامة'}</div>
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
                              {u.role === 'admin' ? (lang === 'en' ? 'Super Admin' : 'مسؤول النظام') : (lang === 'en' ? 'Teacher' : 'أستاذ')}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-[11px] text-slate-300">
                            {u.licenseKey || 'N/A'}
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
                                  ? (lang === 'en' ? 'Suspended' : 'معلّق مؤقتاً')
                                  : u.licenseStatus === 'active'
                                  ? (lang === 'en' ? 'Active Pro' : 'مفعل')
                                  : (lang === 'en' ? 'Expired' : 'منتهي')}
                              </span>
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              <button
                                onClick={() => handleRenewLicense(u.email)}
                                title={lang === 'en' ? 'Generate New Key (No Sale)' : 'إصدار مفتاح جديد (بدون تسجيل مبيعات)'}
                                className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg transition-colors"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleFlagUser(u.email)}
                                title={u.isFlagged ? (lang === 'en' ? 'Unflag Account' : 'إلغاء التنبيه') : (lang === 'en' ? 'Flag Account' : 'تعليم الحساب بتنبيه')}
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
                                  title={u.isBlocked ? (lang === 'en' ? 'Unblock Account' : 'إلغاء الحظر') : (lang === 'en' ? 'Block Account (Temporary)' : 'حظر الحساب مؤقتاً')}
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
                                  onClick={() => handleDeleteUser(u.email)}
                                  title={lang === 'en' ? 'Delete Account' : 'حذف الحساب'}
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
                          {lang === 'en' ? 'No teachers found.' : 'لم يتم العثور على حسابات تطابق البحث.'}
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
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                <input
                  type="text"
                  value={searchSales}
                  onChange={(e) => setSearchSales(e.target.value)}
                  placeholder={lang === 'en' ? 'Search transaction key, email or buyer...' : 'بحث برقم العملية، المشتري أو المفتاح...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-9 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => setIsIssueLicenseOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Issue Manual License' : 'إصدار رخصة يدوية جديدة'}</span>
              </button>

            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">{lang === 'en' ? 'License Key' : 'مفتاح التفعيل'}</th>
                      <th className="p-4">{lang === 'en' ? 'Buyer / Email' : 'المشتري والبريد'}</th>
                      <th className="p-4">{lang === 'en' ? 'Plan' : 'خطة الاشتراك'}</th>
                      <th className="p-4">{lang === 'en' ? 'Amount' : 'المبلغ (دج)'}</th>
                      <th className="p-4">{lang === 'en' ? 'Payment Gateway' : 'طريقة الدفع'}</th>
                      <th className="p-4">{lang === 'en' ? 'Issued Date' : 'تاريخ الإصدار'}</th>
                      <th className="p-4">{lang === 'en' ? 'Status' : 'الحالة'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-300 font-medium">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 font-mono text-teal-400 font-bold">
                          {s.key}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-white">{s.userName || 'أستاذ مسجل'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.userEmail}</div>
                        </td>
                        <td className="p-4 font-extrabold text-slate-200 uppercase">
                          {s.plan}
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
                            {s.status === 'active' ? (lang === 'en' ? 'Active' : 'مفعلة') : (lang === 'en' ? 'Revoked' : 'ملغاة')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3.5: PRICING SETTINGS */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            {loadingPricing || !pricingSettings ? (
              <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                <span>{lang === 'en' ? 'Loading Pricing Settings...' : 'جاري تحميل إعدادات الأسعار...'}</span>
              </div>
            ) : (
              <form onSubmit={handleSavePricing} className="space-y-6">
                
                {/* Header Banner Settings */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-teal-400" />
                      <h3 className="text-base font-extrabold text-white">
                        {lang === 'en' ? 'Promotional Season Banner & Currency' : lang === 'fr' ? 'Bannière Promo & Devise' : 'شريط العروض الترويجية والعملة'}
                      </h3>
                    </div>
                    <span className="text-xs text-teal-400 font-mono font-bold">
                      {pricingSettings.currencyDZD}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'en' ? 'Promo Notice (Arabic)' : 'إعلان العرض الترويجي (عربي)'}
                      </label>
                      <input
                        type="text"
                        value={pricingSettings.promoNoticeAr || ''}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, promoNoticeAr: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'en' ? 'Promo Notice (French)' : 'إعلان العرض الترويجي (فرنسي)'}
                      </label>
                      <input
                        type="text"
                        value={pricingSettings.promoNoticeFr || ''}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, promoNoticeFr: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'en' ? 'Promo Notice (English)' : 'إعلان العرض الترويجي (إنجليزي)'}
                      </label>
                      <input
                        type="text"
                        value={pricingSettings.promoNoticeEn || ''}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, promoNoticeEn: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Single Plan */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <h4 className="text-sm font-extrabold text-teal-400">
                        {lang === 'en' ? 'Single Teacher Plan' : 'الرخصة الأحادية (Single)'}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded font-bold">
                        1 PC
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Price (DZD)' : 'السعر بالدينار (DZD)'}
                        </label>
                        <input
                          type="number"
                          value={pricingSettings.plans.single.priceDZD}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              single: { ...pricingSettings.plans.single, priceDZD: Number(e.target.value) }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-extrabold text-teal-300 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Badge Tag' : 'شارة الخطة'}
                        </label>
                        <input
                          type="text"
                          value={pricingSettings.plans.single.badgeAr || ''}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              single: { ...pricingSettings.plans.single, badgeAr: e.target.value }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Features List (One per line)' : 'المميزات المدرجة (ميزة في كل سطر)'}
                        </label>
                        <textarea
                          rows={4}
                          value={pricingSettings.plans.single.featuresAr.join('\n')}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              single: { ...pricingSettings.plans.single, featuresAr: e.target.value.split('\n') }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-slate-800/80 border-2 border-teal-500/60 rounded-2xl p-6 space-y-4 relative shadow-lg shadow-teal-500/10">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <h4 className="text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{lang === 'en' ? 'Pro Companion Plan' : 'الرخصة الاحترافية (Pro)'}</span>
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold">
                        3 PCs (Recommended)
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Price (DZD)' : 'السعر بالدينار (DZD)'}
                        </label>
                        <input
                          type="number"
                          value={pricingSettings.plans.pro.priceDZD}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              pro: { ...pricingSettings.plans.pro, priceDZD: Number(e.target.value) }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-extrabold text-amber-300 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Badge Tag' : 'شارة الخطة'}
                        </label>
                        <input
                          type="text"
                          value={pricingSettings.plans.pro.badgeAr || ''}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              pro: { ...pricingSettings.plans.pro, badgeAr: e.target.value }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Features List (One per line)' : 'المميزات المدرجة (ميزة في كل سطر)'}
                        </label>
                        <textarea
                          rows={4}
                          value={pricingSettings.plans.pro.featuresAr.join('\n')}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              pro: { ...pricingSettings.plans.pro, featuresAr: e.target.value.split('\n') }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* School Plan */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <h4 className="text-sm font-extrabold text-indigo-400">
                        {lang === 'en' ? 'School / District Plan' : 'رخصة المدرسة والمقاطعة'}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded font-bold">
                        10 PCs
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Price (DZD)' : 'السعر بالدينار (DZD)'}
                        </label>
                        <input
                          type="number"
                          value={pricingSettings.plans.school.priceDZD}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              school: { ...pricingSettings.plans.school, priceDZD: Number(e.target.value) }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-extrabold text-indigo-300 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Badge Tag' : 'شارة الخطة'}
                        </label>
                        <input
                          type="text"
                          value={pricingSettings.plans.school.badgeAr || ''}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              school: { ...pricingSettings.plans.school, badgeAr: e.target.value }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {lang === 'en' ? 'Features List (One per line)' : 'المميزات المدرجة (ميزة في كل سطر)'}
                        </label>
                        <textarea
                          rows={4}
                          value={pricingSettings.plans.school.featuresAr.join('\n')}
                          onChange={(e) => setPricingSettings({
                            ...pricingSettings,
                            plans: {
                              ...pricingSettings.plans,
                              school: { ...pricingSettings.plans.school, featuresAr: e.target.value.split('\n') }
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPricing}
                    className="px-6 py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSavingPricing
                        ? (lang === 'en' ? 'Saving Changes...' : 'جاري الحفظ...')
                        : (lang === 'en' ? 'Save Pricing Settings' : 'حفظ إعدادات وتغييرات الأسعار')}
                    </span>
                  </button>
                </div>

              </form>
            )}
          </div>
        )}

        {/* TAB 4: TUTORIALS SETTINGS */}
        {activeTab === 'tutorials' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                <input
                  type="text"
                  value={searchTutorials}
                  onChange={(e) => setSearchTutorials(e.target.value)}
                  placeholder={lang === 'en' ? 'Search video tutorials...' : 'بحث في شروحات الفيديو...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-9 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => setIsAddTutorialOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Add New Video Tutorial' : 'إضافة فيديو شرح جديد'}</span>
              </button>
            </div>

            {/* Tutorials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTutorials.map((tut) => (
                <div key={tut.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden p-4 space-y-3 flex flex-col justify-between">
                  
                  <div className="space-y-3">
                    <div className="relative h-40 rounded-xl overflow-hidden bg-slate-950">
                      <img src={tut.thumbnailUrl} alt={tut.titleAr} className="w-full h-full object-cover opacity-80" />
                      <span className="absolute bottom-2 right-2 bg-slate-900/90 text-teal-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        {tut.duration}
                      </span>
                      <span className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                        {tut.category}
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
                    <button
                      onClick={() => setEditingTutorial(tut)}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{lang === 'en' ? 'Edit' : 'تعديل'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTutorial(tut.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{lang === 'en' ? 'Delete' : 'حذف'}</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 5: ENQUIRIES & SOS ALERTS */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs font-bold">
              <span className="text-slate-400">{lang === 'en' ? 'Filter by Status:' : 'تصفية الاستفسارات:'}</span>
              
              <button
                onClick={() => setFilterInquiryStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterInquiryStatus === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'All Inquiries' : 'جميع الاستفسارات'}
              </button>

              <button
                onClick={() => setFilterInquiryStatus('sos')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filterInquiryStatus === 'sos' ? 'bg-red-600 text-white' : 'bg-slate-900 text-red-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? '🚨 SOS Priority Only' : '🚨 بلاغات الطوارئ SOS فقط'}</span>
              </button>

              <button
                onClick={() => setFilterInquiryStatus('pending')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterInquiryStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'Pending' : 'قيد الانتظار'}
              </button>

              <button
                onClick={() => setFilterInquiryStatus('replied')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterInquiryStatus === 'replied' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'Replied' : 'تم الرد عليها'}
              </button>
            </div>

            {/* Inquiries Cards */}
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
                      {inq.status === 'replied' ? (lang === 'en' ? 'Replied' : 'تم الرد') : (lang === 'en' ? 'Pending Admin Reply' : 'قيد انتظار الرد')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {inq.message}
                  </div>

                  {inq.adminReply && (
                    <div className="bg-teal-950/40 border border-teal-500/30 p-3 rounded-xl space-y-1">
                      <div className="text-[11px] font-extrabold text-teal-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? 'Admin Response:' : 'رد الإدارة المركزية:'}</span>
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
                        <span>{inq.adminReply ? (lang === 'en' ? 'Update Reply' : 'تعديل الرد') : (lang === 'en' ? 'Send Admin Reply' : 'إرسال الرد')}</span>
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

        {/* TAB 6: BLOG MANAGEMENT */}
        {activeTab === 'blog' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                <input
                  type="text"
                  value={searchPosts}
                  onChange={(e) => setSearchPosts(e.target.value)}
                  placeholder={lang === 'en' ? 'Search blog posts...' : 'بحث في المقالات البيداغوجية...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-9 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => setIsAddPostOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Create New Blog Article' : 'كتابة مقال بيداغوجي جديد'}</span>
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
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingPost(post)}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBlogPost(post.id)}
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

      </div>

      {/* MODAL: ADD NEW USER ACCOUNT */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              <span>{lang === 'en' ? 'Add Teacher / Admin Account' : 'إضافة حساب جديد (أستاذ / مسؤول)'}</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Full Name' : 'الاسم واللقب'}</label>
                <input
                  type="text"
                  required
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="أ. محمد العمري"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}</label>
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
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'School & Wilaya' : 'المدرسة والولاية'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newUserForm.schoolName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, schoolName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                    placeholder="مدرسة الابتدائية"
                  />
                  <input
                    type="text"
                    value={newUserForm.wilaya}
                    onChange={(e) => setNewUserForm({ ...newUserForm, wilaya: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                    placeholder="16 - الجزائر"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Account Role' : 'الدور والصلاحية'}</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="user">{lang === 'en' ? 'Teacher (User)' : 'أستاذ (حساب عادي)'}</option>
                  <option value="admin">{lang === 'en' ? 'Admin Console Access' : 'مسؤول النظام (Admin)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'License Plan' : 'خطة الترخيص'}</label>
                <select
                  value={newUserForm.licensePlan}
                  onChange={(e) => setNewUserForm({ ...newUserForm, licensePlan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="pro">Pro Plan (2,900 DZD - 3 PCs)</option>
                  <option value="single">Single Plan (1,900 DZD - 1 PC)</option>
                  <option value="school">School Plan (8,500 DZD - 10 PCs)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  {lang === 'en' ? 'Save & Issue License' : 'حفظ الحساب وتنشيط المفتاح'}
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
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-400" />
              <span>{lang === 'en' ? 'Reply to Teacher Inquiry' : 'الرد المباشر على استفسار الأستاذ'}</span>
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-teal-400">{replyingInquiry.userName} ({replyingInquiry.wilaya})</span>
              <p className="text-slate-300">{replyingInquiry.message}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  {lang === 'en' ? 'Official Admin Response' : 'نص الرد الرسمي للمشرف الفني'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={lang === 'en' ? 'Type admin solution or support instructions...' : 'اكتب الإجابة أو الحل التقني الوافي للأستاذ...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReply}
                className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReply ? 'جاري إرسال الرد...' : (lang === 'en' ? 'Submit Reply to Teacher' : 'إرسال الرد وإغلاق البلاغ')}</span>
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
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-400" />
              <span>{lang === 'en' ? 'Add Video Tutorial' : 'إضافة فيديو شرح جديد'}</span>
            </h3>

            <form onSubmit={handleCreateTutorial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Video Title (Arabic)' : 'عنوان الشرح (بالعربية)'}</label>
                <input
                  type="text"
                  required
                  value={newTutorialForm.titleAr}
                  onChange={(e) => setNewTutorialForm({ ...newTutorialForm, titleAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="طريقة تثبيت البرنامج وتفعيل الرخصة أوفلاين"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Category' : 'التصنيف'}</label>
                <select
                  value={newTutorialForm.category}
                  onChange={(e) => setNewTutorialForm({ ...newTutorialForm, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="تثبيت البرنامج">تثبيت البرنامج</option>
                  <option value="صانع المذكرات الذكي">صانع المذكرات الذكي</option>
                  <option value="الفونكس والتمارين">الفونكس والتمارين</option>
                  <option value="تقييم المكتسبات">تقييم المكتسبات</option>
                  <option value="التفعيل بالذهبية">التفعيل بالذهبية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'YouTube Embed Link' : 'رابط الفيديو (YouTube)'}</label>
                <input
                  type="text"
                  required
                  value={newTutorialForm.videoUrl}
                  onChange={(e) => setNewTutorialForm({ ...newTutorialForm, videoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Key Implementation Steps (One per line)' : 'الخطوات والتطبيق المباشر (خطوة في كل سطر)'}</label>
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
                  {lang === 'en' ? 'Publish Tutorial' : 'نشر الشرح للأساتذة'}
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
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>{lang === 'en' ? 'Create Pedagogical Article' : 'كتابة مقال بيداغوجي جديد'}</span>
            </h3>

            <form onSubmit={handleCreateBlogPost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Article Title' : 'عنوان المقال'}</label>
                <input
                  type="text"
                  required
                  value={newBlogPostForm.titleAr}
                  onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, titleAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="طريقة تحضير دروس الصوتيات 4AP"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Author' : 'اسم الكاتب / المفتش'}</label>
                <input
                  type="text"
                  value={newBlogPostForm.author}
                  onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, author: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Content Body' : 'محتوى المقال البيداغوجي'}</label>
                <textarea
                  rows={5}
                  required
                  value={newBlogPostForm.contentAr}
                  onChange={(e) => setNewBlogPostForm({ ...newBlogPostForm, contentAr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  placeholder="اكتب المحتوى بالتفصيل..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  {lang === 'en' ? 'Publish Post' : 'نشر المقال البيداغوجي'}
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
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" />
              <span>{lang === 'en' ? 'Issue Manual License' : 'إصدار مفتاح رخصة يدوية'}</span>
            </h3>

            <form onSubmit={handleIssueLicense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Buyer Name' : 'اسم الأستاذ المشتري'}</label>
                <input
                  type="text"
                  required
                  value={issueLicenseForm.userName}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, userName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Buyer Email' : 'البريد الإلكتروني'}</label>
                <input
                  type="email"
                  required
                  value={issueLicenseForm.userEmail}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, userEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Plan' : 'الخطة'}</label>
                <select
                  value={issueLicenseForm.plan}
                  onChange={(e) => setIssueLicenseForm({ ...issueLicenseForm, plan: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="pro">Pro Plan (2,900 DZD)</option>
                  <option value="single">Single Plan (1,900 DZD)</option>
                  <option value="school">School Plan (8,500 DZD)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{lang === 'en' ? 'Payment Method' : 'طريقة الاستلام'}</label>
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

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
                >
                  {lang === 'en' ? 'Generate & Save License' : 'توليد المفتاح وحفظ العملية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
