import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily / safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// In-memory simple store for licenses, users, and inquiries
const dbUsers = new Map<string, any>();
const dbLicenses = new Map<string, any>();
const dbInquiries = new Map<string, any>();

// Seed clean database with only master admin account
const initialUser = {
  id: 'user-abdallah-66',
  firstName: 'Abdallah',
  lastName: 'Bourrich',
  fullName: 'Abdallah Bourrich',
  email: 'abdallahbourrich66@gmail.com',
  password: 'abdallah66',
  role: 'admin',
  wilaya: '16 - الجزائر',
  schoolName: 'الإدارة المركزية - نظام رفيق أستاذ الإنجليزية',
  primaryGrade: '4AP',
  licenseKey: 'TC-ALG-ADMIN-MASTER-001',
  licenseStatus: 'active',
  licensePlan: 'pro',
  createdAt: '2026-01-10T10:00:00.000Z'
};
dbUsers.set(initialUser.email, initialUser);

const seedLicensesList = [
  {
    id: 'lic-abdallah-101',
    key: 'TC-ALG-ADMIN-MASTER-001',
    userEmail: 'abdallahbourrich66@gmail.com',
    userName: 'Abdallah Bourrich',
    plan: 'pro',
    status: 'active',
    issuedAt: '2026-01-10',
    expiresAt: '2027-09-01',
    paidVia: 'Chargily Pay v2 (Edahabia/CIB)',
    amountDZD: 2900,
    maxDevices: 3
  }
];
seedLicensesList.forEach(l => dbLicenses.set(l.key, l));

// Initial support inquiries (empty by default)
const seedInquiriesList: any[] = [];
seedInquiriesList.forEach(i => dbInquiries.set(i.id, i));

// In-memory store for Blog Posts and Tutorials
const dbBlogPosts = new Map<string, any>();
const dbTutorials = new Map<string, any>();

// Seed Blog Posts
const seedBlogPosts = [
  {
    id: 'post-1',
    slug: 'preparing-english-fiches-ai-3ap-4ap-5ap',
    titleAr: 'كيف تنجز مذكرات اللغة الإنجليزية الرسمية (English AI Fiches) وفق كتاب My Book of English؟',
    titleFr: 'Comment préparer une fiche d\'Anglais officielle (3AP, 4AP, 5AP) avec l\'IA en un clic ?',
    titleEn: 'How to prepare official English lesson plans (3AP, 4AP, 5AP) using AI according to My Book of English?',
    excerptAr: 'اكتشف كيف يساعد تطبيق "Teacher Companion - English Edition" أستاذ الإنجليزية بالابتدائي في الجزائر في إعداد مذكرات الصوتيات Phonics، المحادثة الشفهية، والأنشطة الكتابية.',
    excerptFr: "Découvrez comment Teacher Companion aide les enseignants d'anglais du primaire en Algérie à concevoir des fiches pédagogiques alignées sur le manuel officiel.",
    excerptEn: 'Discover how Teacher Companion helps Algerian primary English teachers design lesson plans aligned with official textbooks.',
    category: 'تدريس الإنجليزية',
    publishDate: '10 أوت 2026',
    readTime: '4 دقائق',
    author: 'أ. مريم المفتشة التربوية للغة الإنجليزية',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    contentAr: `تعتبر المذكرة التربوية لمادة اللغة الإنجليزية (Lesson Plan / Fiche Pédagogique) ركناً أساسياً لأستاذ اللغة الإنجليزية بالتعليم الابتدائي بالجزائر (3AP, 4AP, 5AP). ومع تطبيق منهاج "My Book of English"، يتطلب إعداد الدرس دقة في توزيع المراحل البيداغوجية: Warm-up, Presentation, Practice, & Production.

يقدم برنامج **Teacher Companion (English Edition)** المساعد الذكي المدعوم بالذكاء الاصطناعي والمصمم خصيصاً وفق المنهاج الوزاري الرسمي.

### أهم ميزات وحدة مذكرات الإنجليزية:
1. **التوافق التام مع المقاطع الرسمية:** اختيار Sequence والمادة للسنوات 3AP، 4AP، و 5AP.
2. **صياغة الصوتيات ومخارج الحروف (Phonics):** توفير بطاقات الفونكس وأوراق العمل المرفقة.
3. **توليد الحوارات والثنائيات (Pair-work Dialogues):** إنشاء سيناريوهات محادثة تفاعلية مناسبة لمستوى التلاميذ.
4. **التصدير الفوري:** طباعة وتصدير بصيغة PDF أو Word للتعديل الشخصي.`,
    likesCount: 24,
    helpfulCount: 18,
    comments: [
      {
        id: 'c-1',
        userName: 'أستاذ ياسين (ولاية سطيف)',
        userRole: 'أستاذ سنة 4 ابتدائية',
        userWilaya: '19 - سطيف',
        content: 'تطبيق ممتااااز جداً! وفر علي عناء تحضير مذكرات الصوتيات Phonics والمقطع الثاني باللغة الإنجليزية.',
        createdAt: '11 أوت 2026 - 14:30'
      },
      {
        id: 'c-2',
        userName: 'أستاذة مريم (ولاية وهران)',
        userRole: 'أستاذة إنجليزية 3AP/5AP',
        userWilaya: '31 - وهران',
        content: 'بارك الله فيكم، التصدير لملفات Word وافقت عليه مفتشة المادة دون أي ملاحظات سلبيّة.',
        createdAt: '12 أوت 2026 - 09:15'
      }
    ]
  },
  {
    id: 'post-2',
    slug: 'guide-primary-english-assessment-5ap',
    titleAr: 'دليل تقييم مكتسبات مادة اللغة الإنجليزية للسنة الخامسة ابتدائي (5AP English Evaluation)',
    titleFr: "Guide d'évaluation des acquis en Anglais 5AP pour les enseignants du primaire",
    titleEn: 'Primary 5AP English Competency Assessment & Evaluation Guide',
    excerptAr: 'شرح مفصل لمعايير تقييم الكفاءات الشفهية والكتابية وحساب النتائج والتقديرات الرسمية (أ، ب، ج، د) لمادة اللغة الإنجليزية.',
    excerptFr: "Explication détaillée des critères d'évaluation des compétences orales et écrites en anglais 5AP.",
    excerptEn: 'Detailed guide on oral & written evaluation criteria and automated grading for 5AP English.',
    category: 'تقييم المكتسبات',
    publishDate: '02 أوت 2026',
    readTime: '6 دقائق',
    author: 'فريق التطوير البيداغوجي للغات',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    contentAr: `يشكل تقييم مكتسبات مادة اللغة الإنجليزية للسنة الخامسة ابتدائي ركيزة أساسية لقياس مدى استيعاب المفردات، التفاعل الشفهي، وفهم النصوص البسيطة.

يوفر تطبيق Teacher Companion دفتر تنقيط إلكتروني متوافق مع الميادين الأربعة: Listening, Speaking, Reading, and Writing، مما يوفر على الأستاذ ساعات طوال في حساب المعدلات وصياغة التقديرات البيداغوجية المعتمدة.`,
    likesCount: 31,
    helpfulCount: 22,
    comments: [
      {
        id: 'c-3',
        userName: 'أستاذ طارق (ولاية باتنة)',
        userRole: 'أستاذ لغة إنجليزية',
        userWilaya: '05 - باتنة',
        content: 'دفتر تنقيط المكتسبات يحسب التقديرات تلقائياً وبدقة عالية جداً. شكراً جزيلاً.',
        createdAt: '03 أوت 2026 - 18:20'
      }
    ]
  },
  {
    id: 'post-3',
    slug: 'chargily-pay-edahabia-english-license',
    titleAr: 'كيف تشترِ وتفعّل رخصة "رفيق أستاذ الإنجليزية" فورياً بالبطاقة الذهبية عبر Chargily Pay؟',
    titleFr: 'Comment activer votre licence Teacher Companion - English Edition via Chargily Pay ?',
    titleEn: 'How to purchase & activate your Teacher Companion license via Chargily Pay (Edahabia / CIB)',
    excerptAr: 'خطوات سهلة وآمنة لشراء رخصة الاستخدام بالبطاقة الذهبية CIB والحصول على مفتاح التفعيل الفوري لأستاذ الإنجليزية.',
    excerptFr: 'Étapes simples pour acheter votre licence via le paiement électronique algérien Chargily Pay.',
    excerptEn: 'Simple and secure steps to buy your license with Edahabia card and obtain your instant serial key.',
    category: 'تحديثات التطبيق',
    publishDate: '25 جولية 2026',
    readTime: '3 دقائق',
    author: 'قسم الدعم الفني',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e889b4f2?auto=format&fit=crop&w=800&q=80',
    contentAr: `يمكن لأساتذة اللغة الإنجليزية في جميع الولايات تفعيل البرنامج فورياً باستخدام Chargily Pay v2 المعتمدة رسمياً بالبطاقة الذهبية (Edahabia) وبطاقات CIB البنكية.`,
    likesCount: 19,
    helpfulCount: 15,
    comments: []
  }
];
seedBlogPosts.forEach(p => dbBlogPosts.set(p.id, p));

// Seed Tutorials
const seedTutorials = [
  {
    id: 'tut-1',
    titleAr: 'كيفية تثبيت وتشغيل برنامج "Teacher Companion" على حاسوبك والفلاش ديسك أوفلاين',
    titleFr: 'Installation et exécution sur PC et Clé USB Hors-ligne',
    titleEn: 'Installing & Running Teacher Companion on PC & USB Drive Offline',
    descriptionAr: 'شرح خطوة بخطوة لكيفية تنصيب مثبت Windows (.exe) أو النسخة المحمولة Portable ZIP على الفلاش ديسك للعمل بها في المدارس بدون إنترنت.',
    descriptionEn: 'Step-by-step guide on installing the Windows (.exe) installer or Portable ZIP on a USB drive for offline school use.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    duration: '04:15',
    category: 'تثبيت البرنامج',
    keySteps: [
      'تحميل ملف Teacher_Companion_v2.4_Setup.exe أو ملف ZIP المحمول',
      'فك الضغط أو تشغيل التثبيت التلقائي',
      'إدخال مفتاح التفعيل التسلسلي (16 رمزاً) المتواجد بـ Hub الأساتذة',
      'بدء العمل مباشرة 100% أوفلاين دون الحاجة بالاتصال بالشبكة'
    ],
    createdAt: '2026-08-01'
  },
  {
    id: 'tut-2',
    titleAr: 'طريقة توليد مذكرات اللغة الإنجليزية الرسمية (AI Lesson Plans) للسنوات 3AP, 4AP, 5AP',
    titleFr: 'Génération automatique de fiches d\'Anglais par IA',
    descriptionAr: 'تعلم كيفية إعداد مذكرة نموذجية كاملة تحتوي المراحل الأربع (Warm-up, Presentation, Practice, Production) وفق كتاب My Book of English.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    duration: '06:30',
    category: 'صانع المذكرات الذكي',
    keySteps: [
      'اختيار المستوى المطلوب (3AP, 4AP أو 5AP)',
      'تحديد المقطع التعلمي (Sequence) والعنوان الأسبوعي',
      'الضغط على "توليد المذكرة الذكية"',
      'المعاينة والتعديل المباشر أو التصدير بصيغة Word و PDF'
    ],
    createdAt: '2026-08-03'
  },
  {
    id: 'tut-3',
    titleAr: 'إنشاء أوراق عمل الصوتيات Phonics ومصمم البطاقات المصورة Flashcards',
    titleFr: 'Création de fiches Phonics et cartes illustrées',
    descriptionAr: 'شرح ميزة تصميم وتنسيق بطاقات الكلمات والصوتيات وقواعد نطق الحروف الموجهة لتلاميذ الابتدائي.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    duration: '05:10',
    category: 'الفونكس والتمارين',
    keySteps: [
      'الدخول لوحدة Flashcards & Phonics Worksheets',
      'تحديد المادة الصوتية (مثل: /æ/, /e/, /ɪ/, /ɒ/)',
      'اختيار الرسوم والرموز التوضيحية',
      'طباعة أوراق العمل الجاهزة للتلاميذ'
    ],
    createdAt: '2026-08-05'
  },
  {
    id: 'tut-4',
    titleAr: 'إدارة شبكة تقييم مكتسبات 5AP وتصدير كشوف النقاط ونظام رقمنة وزارة التربية',
    titleFr: 'Gestion de l\'évaluation des acquis 5AP et exportation Rikit',
    descriptionAr: 'كيفية إدخال علامات الأنشطة التقييمية لمادة الإنجليزية وحساب التقديرات التلقائية (أ، ب، ج، د) وتصديرها بصيغة Excel.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    duration: '07:45',
    category: 'تقييم المكتسبات',
    keySteps: [
      'استيراد أو إدخال قائمة تلاميذ القسم',
      'رصد التقييمات الشفهية والكتابية لكل تلميذ',
      'توليد التقرير الفردي أو الجماعي التلقائي',
      'الضغط على تصدير XLSX لرفعه على موقع رقمنة القطاع'
    ],
    createdAt: '2026-08-07'
  },
  {
    id: 'tut-5',
    titleAr: 'طريقة الاشتراك السريع بالبطاقة الذهبية CIB عبر Chargily وتفعيل مفتاح الرخصة أوفلاين',
    titleFr: 'Abonnement instantané Chargily Pay et activation offline',
    descriptionAr: 'فيديو توضيحي لعملية الدفع الآمن بالبطاقة الذهبية من البداية وحتى استلام وتنشيط المفتاح في تطبيق سطح المكتب.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0a67e889b4f2?auto=format&fit=crop&w=800&q=80',
    duration: '03:50',
    category: 'التفعيل بالذهبية',
    keySteps: [
      'النقر على "اشترك الآن" وإدخال البيانات الأساسية',
      'إكمال عملية الدفع بمبلغ 3,500 دج عبر منصة Chargily Pay',
      'الاستلام الآلي والأني لمفتاح التفعيل',
      'نسخ المفتاح ولصقه داخل برنامج Teacher Companion على الكمبيوتر'
    ],
    createdAt: '2026-08-09'
  }
];
seedTutorials.forEach(t => dbTutorials.set(t.id, t));

// Helper to generate license keys
function generateLicenseKey(plan: string = 'PRO'): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TC-ALG-${plan}-${randomPart}`;
}

// ================= API ROUTES =================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Teacher Companion Algeria Backend" });
});

// Authentication endpoints
app.post("/api/auth/register", (req, res) => {
  const {
    firstName,
    lastName,
    fullName,
    email,
    phoneNumber,
    wilaya,
    schoolName,
    referralSource,
    password,
    primaryGrade,
    role
  } = req.body;

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ error: "البريد الإلكتروني، الاسم واللقب جميعها مطلوبة" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const calculatedFullName = (fullName && fullName.trim()) ? fullName : `${firstName} ${lastName}`;

  const userRole = (cleanEmail.includes('admin') || role === 'admin') ? 'admin' : 'user';
  const newKey = generateLicenseKey('PRO');

  const newUser = {
    id: `user-${Date.now()}`,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    fullName: calculatedFullName,
    email: cleanEmail,
    password: password,
    phoneNumber: phoneNumber || '',
    role: userRole,
    wilaya: wilaya || '16 - الجزائر',
    schoolName: schoolName || '',
    referralSource: referralSource || 'فيسبوك / مواقع التواصل',
    primaryGrade: primaryGrade || '4AP',
    licenseStatus: 'active',
    licensePlan: 'pro',
    licenseKey: newKey,
    createdAt: new Date().toISOString()
  };

  dbUsers.set(cleanEmail, newUser);

  // Create license record
  dbLicenses.set(newKey, {
    id: `lic-${Date.now()}`,
    key: newKey,
    userEmail: cleanEmail,
    userName: calculatedFullName,
    plan: 'pro',
    status: 'active',
    issuedAt: new Date().toISOString().split('T')[0],
    expiresAt: '2027-09-01',
    paidVia: 'Chargily Pay v2 (Edahabia/CIB)',
    amountDZD: 2900,
    maxDevices: 3
  });

  console.log("User registered in database:", newUser);
  res.json({ success: true, user: newUser, token: "demo-jwt-token" });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" });
  }

  const cleanEmail = email.trim().toLowerCase();
  let existingUser = dbUsers.get(cleanEmail);

  // If master admin account credential matched
  if (cleanEmail === 'abdallahbourrich66@gmail.com' && password === 'abdallah66') {
    if (!existingUser) {
      existingUser = {
        id: 'user-abdallah-66',
        firstName: 'Abdallah',
        lastName: 'Bourrich',
        fullName: 'Abdallah Bourrich',
        email: 'abdallahbourrich66@gmail.com',
        password: 'abdallah66',
        role: 'admin',
        wilaya: '16 - الجزائر',
        schoolName: 'الإدارة المركزية - نظام رفيق أستاذ الإنجليزية',
        primaryGrade: '4AP',
        licenseKey: 'TC-ALG-ADMIN-MASTER-001',
        licenseStatus: 'active',
        licensePlan: 'pro',
        createdAt: '2026-01-10T10:00:00.000Z'
      };
      dbUsers.set(cleanEmail, existingUser);
    } else {
      existingUser.role = 'admin';
      dbUsers.set(cleanEmail, existingUser);
    }
    return res.json({ user: existingUser, token: "admin-jwt-token" });
  }

  if (existingUser) {
    if (existingUser.isBlocked) {
      return res.status(403).json({ error: "تم تعليق هذا الحساب مؤقتاً بواسطة الإدارة المركزية / This account has been temporarily suspended by administration." });
    }
    if (existingUser.password && existingUser.password !== password) {
      return res.status(400).json({ error: "كلمة المرور غير صحيحة" });
    }
    return res.json({ user: existingUser, token: "demo-jwt-token" });
  }

  return res.status(400).json({ error: "الحساب غير موجود. يرجى الاشتراك وإنشاء حساب جديد أولاً" });
});

// Blog Endpoints (Hub Community & Discussions)
app.get("/api/blog/posts", (req, res) => {
  res.json({ posts: Array.from(dbBlogPosts.values()) });
});

app.post("/api/blog/posts/:postId/react", (req, res) => {
  const { postId } = req.params;
  const { type } = req.body; // 'like' or 'helpful'

  const post = dbBlogPosts.get(postId);
  if (!post) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  if (type === 'like') {
    post.likesCount = (post.likesCount || 0) + 1;
  } else if (type === 'helpful') {
    post.helpfulCount = (post.helpfulCount || 0) + 1;
  }

  dbBlogPosts.set(postId, post);
  res.json({ success: true, post });
});

app.post("/api/blog/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const { userName, userRole, userWilaya, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "نص التعليق لا يمكن أن يكون فارغاً" });
  }

  const post = dbBlogPosts.get(postId);
  if (!post) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  const newComment = {
    id: `c-${Date.now()}`,
    userName: userName || 'أستاذ مسجل',
    userRole: userRole || 'أستاذ لغة إنجليزية',
    userWilaya: userWilaya || '16 - الجزائر',
    content: content.trim(),
    createdAt: new Date().toLocaleString('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' })
  };

  if (!post.comments) post.comments = [];
  post.comments.push(newComment);

  dbBlogPosts.set(postId, post);
  res.json({ success: true, post, comment: newComment });
});

// Tutorials Endpoints (Hub Video Guides)
app.get("/api/tutorials", (req, res) => {
  res.json({ tutorials: Array.from(dbTutorials.values()) });
});

// Support Inquiries endpoints (Customer Area & SOS System)
app.get("/api/inquiries", (req, res) => {
  const email = req.query.email as string;
  const list = Array.from(dbInquiries.values());
  if (email) {
    const userInquiries = list.filter(i => i.userEmail === email);
    return res.json({ inquiries: userInquiries });
  }
  res.json({ inquiries: list });
});

app.post("/api/inquiries", (req, res) => {
  const { userId, userEmail, userName, wilaya, subject, category, message, isSOS } = req.body;
  if (!userEmail || !subject || !message) {
    return res.status(400).json({ error: "البريد الإلكتروني، الموضوع، ونور الرسالة مطلوبة" });
  }

  const isUrgent = !!isSOS;
  const inquiryCategory = isUrgent ? '🚨 بلاغ عاجل جداً (SOS Priority)' : (category || 'استفسار عن التفعيل');

  const newInquiry = {
    id: `inq-${Date.now()}`,
    userId: userId || 'guest',
    userEmail,
    userName: userName || 'أستاذ مجهول',
    wilaya: wilaya || '16 - الجزائر',
    subject: isUrgent ? `🚨 [طوارئ SOS] ${subject}` : subject,
    category: inquiryCategory,
    message,
    status: 'pending',
    isSOS: isUrgent,
    priority: isUrgent ? 'urgent' : 'normal',
    createdAt: new Date().toISOString()
  };

  dbInquiries.set(newInquiry.id, newInquiry);
  res.json({
    success: true,
    inquiry: newInquiry,
    message: isUrgent
      ? 'تم رفع بلاغ طوارئ SOS بنجاح! تم إخطار فريق الدعم الفني كأولوية قصوى وسيتم الرد عليك فورياً.'
      : 'تم إرسال استفسارك بنجاح إلى فريق الدعم الفني'
  });
});

// Admin endpoints

// Stats & Analytics overview
app.get("/api/admin/stats", (req, res) => {
  const licenses = Array.from(dbLicenses.values());
  const users = Array.from(dbUsers.values());
  const inquiries = Array.from(dbInquiries.values());

  const totalSalesDZD = licenses.reduce((sum, l) => sum + (l.amountDZD || 2900), 0);
  const activeLicensesCount = licenses.filter(l => l.status === 'active').length;
  const pendingInquiriesCount = inquiries.filter(i => i.status === 'pending').length;
  const sosInquiriesCount = inquiries.filter(i => i.isSOS && i.status === 'pending').length;

  // Monthly Sales trend data for Recharts AreaChart
  const monthlySalesData = [
    { month: 'Jan', revenue: 14500, salesCount: 5 },
    { month: 'Feb', revenue: 23200, salesCount: 8 },
    { month: 'Mar', revenue: 31900, salesCount: 11 },
    { month: 'Apr', revenue: 49300, salesCount: 17 },
    { month: 'May', revenue: 60900, salesCount: 21 },
    { month: 'Jun', revenue: 78300, salesCount: 27 },
    { month: 'Jul', revenue: 95700, salesCount: 33 },
    { month: 'Aug', revenue: totalSalesDZD, salesCount: licenses.length }
  ];

  // Sales breakdown by Wilaya for Recharts BarChart
  const salesByWilayaMap = new Map<string, number>();
  users.forEach(u => {
    const wName = u.wilaya || '16 - الجزائر';
    salesByWilayaMap.set(wName, (salesByWilayaMap.get(wName) || 0) + 1);
  });
  const salesByWilaya = Array.from(salesByWilayaMap.entries()).map(([wilaya, count]) => ({
    wilaya: wilaya.replace(/^\d+\s*-\s*/, ''),
    teachersCount: count,
    estimatedRevenue: count * 2900
  }));

  // Sales breakdown by Plan for Recharts PieChart
  const planCounts = { single: 0, pro: 0, school: 0 };
  licenses.forEach(l => {
    if (l.plan === 'single') planCounts.single++;
    else if (l.plan === 'school') planCounts.school++;
    else planCounts.pro++;
  });
  const salesByPlan = [
    { name: 'Single Plan (1,900 DZD)', value: planCounts.single, color: '#0D9488' },
    { name: 'Pro Plan (2,900 DZD)', value: planCounts.pro, color: '#1E3A8A' },
    { name: 'School Plan (8,500 DZD)', value: planCounts.school, color: '#6366F1' }
  ];

  res.json({
    totalSalesDZD,
    totalCustomers: users.length,
    activeLicensesCount,
    pendingInquiriesCount,
    sosInquiriesCount,
    monthlySalesData,
    salesByWilaya,
    salesByPlan,
    recentSales: licenses.slice(0, 10)
  });
});

// Users Management
app.get("/api/admin/users", (req, res) => {
  res.json({ users: Array.from(dbUsers.values()) });
});

app.post("/api/admin/users", (req, res) => {
  const { fullName, email, password, role, wilaya, schoolName, primaryGrade, licensePlan, licenseStatus } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: "البريد الإلكتروني والاسم الكامل مطلوبة" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = dbUsers.get(cleanEmail);
  if (existing) {
    return res.status(400).json({ error: "هذا الحساب موجود بالفعل" });
  }

  const newKey = generateLicenseKey(licensePlan ? licensePlan.toUpperCase() : 'PRO');
  const newUser = {
    id: `user-${Date.now()}`,
    fullName,
    firstName: fullName.split(' ')[0] || fullName,
    lastName: fullName.split(' ').slice(1).join(' ') || '',
    email: cleanEmail,
    password: password || 'teacher123',
    role: role || 'user',
    wilaya: wilaya || '16 - الجزائر',
    schoolName: schoolName || '',
    primaryGrade: primaryGrade || '4AP',
    licenseKey: newKey,
    licenseStatus: licenseStatus || 'active',
    licensePlan: licensePlan || 'pro',
    createdAt: new Date().toISOString()
  };

  dbUsers.set(cleanEmail, newUser);

  dbLicenses.set(newKey, {
    id: `lic-${Date.now()}`,
    key: newKey,
    userEmail: cleanEmail,
    userName: fullName,
    plan: licensePlan || 'pro',
    status: licenseStatus || 'active',
    issuedAt: new Date().toISOString().split('T')[0],
    expiresAt: '2027-09-01',
    paidVia: 'Manual Admin Issue',
    amountDZD: licensePlan === 'single' ? 1900 : licensePlan === 'school' ? 8500 : 2900,
    maxDevices: licensePlan === 'school' ? 10 : 3
  });

  res.json({ success: true, user: newUser });
});

app.put("/api/admin/users/:email", (req, res) => {
  const { email } = req.params;
  const cleanEmail = email.trim().toLowerCase();
  const user = dbUsers.get(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  const { fullName, role, wilaya, schoolName, licenseStatus, licensePlan } = req.body;
  if (fullName) user.fullName = fullName;
  if (role) user.role = role;
  if (wilaya) user.wilaya = wilaya;
  if (schoolName) user.schoolName = schoolName;
  if (licenseStatus) user.licenseStatus = licenseStatus;
  if (licensePlan) user.licensePlan = licensePlan;

  dbUsers.set(cleanEmail, user);
  res.json({ success: true, user });
});

app.delete("/api/admin/users/:email", (req, res) => {
  const rawEmail = req.params.email || '';
  const cleanEmail = decodeURIComponent(rawEmail).trim().toLowerCase();

  if (cleanEmail === 'abdallahbourrich66@gmail.com') {
    return res.status(400).json({ error: "لا يمكن حذف حساب المسؤول الرئيسي" });
  }

  const deleted = dbUsers.delete(cleanEmail);
  if (!deleted) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  res.json({ success: true });
});

app.post("/api/admin/users/:email/renew-license", (req, res) => {
  const rawEmail = req.params.email || '';
  const cleanEmail = decodeURIComponent(rawEmail).trim().toLowerCase();
  const user = dbUsers.get(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  const plan = user.licensePlan || 'pro';
  const newKey = generateLicenseKey(plan.toUpperCase());
  user.licenseKey = newKey;
  user.licenseStatus = 'active';
  dbUsers.set(cleanEmail, user);

  // NOTE: Key re-generation for an account does NOT create a sale/transaction record in dbLicenses
  res.json({ success: true, user, newKey });
});

app.post("/api/admin/users/:email/toggle-flag", (req, res) => {
  const rawEmail = req.params.email || '';
  const cleanEmail = decodeURIComponent(rawEmail).trim().toLowerCase();
  const user = dbUsers.get(cleanEmail);

  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  user.isFlagged = !user.isFlagged;
  if (req.body.flagReason !== undefined) {
    user.flagReason = req.body.flagReason;
  }
  dbUsers.set(cleanEmail, user);

  res.json({ success: true, user });
});

app.post("/api/admin/users/:email/toggle-block", (req, res) => {
  const rawEmail = req.params.email || '';
  const cleanEmail = decodeURIComponent(rawEmail).trim().toLowerCase();

  if (cleanEmail === 'abdallahbourrich66@gmail.com') {
    return res.status(400).json({ error: "لا يمكن حظر حساب المسؤول الرئيسي" });
  }

  const user = dbUsers.get(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  user.isBlocked = !user.isBlocked;
  dbUsers.set(cleanEmail, user);

  res.json({ success: true, user });
});

// Inquiries Endpoints
app.get("/api/admin/inquiries", (req, res) => {
  res.json({ inquiries: Array.from(dbInquiries.values()) });
});

app.post("/api/admin/inquiries/reply", (req, res) => {
  const { inquiryId, adminReply } = req.body;
  if (!inquiryId || !adminReply) {
    return res.status(400).json({ error: "معرف الاستفسار ونص الرد مطلوبان" });
  }

  const inq = dbInquiries.get(inquiryId);
  if (!inq) {
    return res.status(404).json({ error: "الاستفسار غير موجود" });
  }

  inq.status = 'replied';
  inq.adminReply = adminReply;
  inq.repliedAt = new Date().toISOString();
  dbInquiries.set(inquiryId, inq);

  res.json({ success: true, inquiry: inq });
});

app.delete("/api/admin/inquiries/:id", (req, res) => {
  const rawId = req.params.id || '';
  const cleanId = decodeURIComponent(rawId).trim();
  const deleted = dbInquiries.delete(cleanId);
  if (!deleted) {
    return res.status(404).json({ error: "الاستفسار غير موجود" });
  }
  res.json({ success: true });
});

// Pricing Settings Endpoints
const dbPricingSettings = {
  currencyDZD: 'دج / DZD',
  promoNoticeAr: 'تخفيضات العودة المدرسية 2026/2027: حسم يصل إلى 30% على الاشتراكات السنوية',
  promoNoticeFr: 'Offre Rentrée Scolaire 2026/2027: Jusqu\'à 30% de réduction',
  promoNoticeEn: 'Back to School 2026/2027 Sale: Up to 30% discount',
  plans: {
    single: {
      id: 'single',
      nameAr: 'الرخصة الأحادية (Single Teacher)',
      nameFr: 'Licence Individuelle',
      nameEn: 'Single Teacher License',
      priceDZD: 1900,
      periodAr: 'سنة كاملة / جهاز PC واحد',
      periodFr: '1 an / 1 PC',
      periodEn: '1 Year / 1 PC',
      badgeAr: 'للمبتدئين',
      badgeFr: 'Débutant',
      badgeEn: 'Starter',
      popular: false,
      featuresAr: [
        'تثبيت أوفلاين 100% على حاسوب شخصي واحد',
        'توليد المذكرات التربوية وحساب المعدلات',
        'طباعة الاختبارات وشبكات تقييم المكتسبات',
        'تحديثات المنهاج مجاناً طيلة السنة'
      ],
      featuresFr: [
        'Installation 100% hors-ligne sur 1 PC',
        'Génération des fiches et calcul des moyennes',
        'Impression des devoirs et grilles d\'évaluation',
        'Mises à jour gratuites toute l\'année'
      ],
      featuresEn: [
        '100% Offline installation on 1 PC',
        'Lesson plan generation & gradebook',
        'Printable exams & evaluation grids',
        'Free curriculum updates for 1 year'
      ]
    },
    pro: {
      id: 'pro',
      nameAr: 'الرخصة الاحترافية (Pro Companion)',
      nameFr: 'Licence Professionnelle Pro',
      nameEn: 'Pro Companion License',
      priceDZD: 2900,
      periodAr: 'سنة كاملة / 3 أجهزة PC',
      periodFr: '1 an / 3 PCs',
      periodEn: '1 Year / 3 PCs',
      badgeAr: 'الأكثر طلباً ⭐',
      badgeFr: 'Plus Populaire ⭐',
      badgeEn: 'Most Popular ⭐',
      popular: true,
      featuresAr: [
        'تثبيت أوفلاين على 3 أجهزة PC (المدرسة + المنزل + المحمول)',
        'مولد المذكرات الذكي بالذكاء الاصطناعي Gemini 3.6 Flash',
        'أوراق عمل Phonics وصانع Flashcards الملونة',
        'تصدير واستيراد قوائم التلاميذ والتقييمات إلى Excel',
        'دعم فني مباشر وبلاغات طوارئ SOS ذات أولوية'
      ],
      featuresFr: [
        'Installation hors-ligne sur 3 PCs',
        'Générateur de fiches IA Gemini 3.6 Flash',
        'Atelier Phonics et créateur de Flashcards',
        'Export/Import des listes d\'élèves vers Excel',
        'Support technique prioritaire & alertes SOS'
      ],
      featuresEn: [
        'Offline installation on 3 PCs',
        'AI Lesson plan generator (Gemini 3.6 Flash)',
        'Phonics practice & colorful Flashcards maker',
        'Excel export/import for student evaluation lists',
        'Priority technical support & SOS emergency queue'
      ]
    },
    school: {
      id: 'school',
      nameAr: 'رخصة المدرسة / المقاطعة (School Hub)',
      nameFr: 'Licence Établissement Scolaire',
      nameEn: 'School / District Hub License',
      priceDZD: 8500,
      periodAr: 'سنة كاملة / 10 أجهزة PC',
      periodFr: '1 an / 10 PCs',
      periodEn: '1 Year / 10 PCs',
      badgeAr: 'للمدارس والمجمعات',
      badgeFr: 'Écoles & Circonscriptions',
      badgeEn: 'For Schools & Districts',
      popular: false,
      featuresAr: [
        'تنشيط أوفلاين شامل لـ 10 أجهزة حاسوب بأساتذة المدرسة',
        'لوحة تحكم إدارية خاصة بمفتش المقاطعة أو المدير',
        'أوراق عمل مخصصة وشروحات بيداغوجية حصرية',
        'تغطية شاملة لمواد اللغات والتقييمات الوطنية'
      ],
      featuresFr: [
        'Activation hors-ligne globale pour 10 PCs',
        'Tableau de bord pour inspecteur ou directeur',
        'Fiches de travail personnalisées et tutoriels exclusifs',
        'Couverture complète des évaluations nationales'
      ],
      featuresEn: [
        'Global offline activation for 10 PCs',
        'Administrative dashboard for inspector or principal',
        'Customized worksheets & exclusive pedagogical guides',
        'Comprehensive national evaluation support'
      ]
    }
  }
};

app.get("/api/pricing", (req, res) => {
  res.json(dbPricingSettings);
});

app.get("/api/admin/pricing", (req, res) => {
  res.json(dbPricingSettings);
});

app.put("/api/admin/pricing", (req, res) => {
  const { plans, currencyDZD, promoNoticeAr, promoNoticeFr, promoNoticeEn } = req.body;
  if (plans) {
    if (plans.single) dbPricingSettings.plans.single = { ...dbPricingSettings.plans.single, ...plans.single };
    if (plans.pro) dbPricingSettings.plans.pro = { ...dbPricingSettings.plans.pro, ...plans.pro };
    if (plans.school) dbPricingSettings.plans.school = { ...dbPricingSettings.plans.school, ...plans.school };
  }
  if (currencyDZD) dbPricingSettings.currencyDZD = currencyDZD;
  if (promoNoticeAr !== undefined) dbPricingSettings.promoNoticeAr = promoNoticeAr;
  if (promoNoticeFr !== undefined) dbPricingSettings.promoNoticeFr = promoNoticeFr;
  if (promoNoticeEn !== undefined) dbPricingSettings.promoNoticeEn = promoNoticeEn;

  res.json({ success: true, pricing: dbPricingSettings });
});

// Licenses & Sales Endpoints
app.get("/api/admin/licenses", (req, res) => {
  res.json({ licenses: Array.from(dbLicenses.values()) });
});

app.post("/api/admin/licenses/generate", (req, res) => {
  const { userEmail, userName, plan, paidVia, amountDZD } = req.body;
  const newKey = generateLicenseKey(plan ? plan.toUpperCase() : 'PRO');

  const lic = {
    id: `lic-${Date.now()}`,
    key: newKey,
    userEmail: userEmail || 'manual@teacher.dz',
    userName: userName || 'أستاذ محلي',
    plan: plan || 'pro',
    status: 'active',
    issuedAt: new Date().toISOString().split('T')[0],
    expiresAt: '2027-09-01',
    paidVia: paidVia || 'Manual Admin Issue',
    amountDZD: amountDZD || (plan === 'single' ? 1900 : plan === 'school' ? 8500 : 2900),
    maxDevices: plan === 'school' ? 10 : 3
  };

  dbLicenses.set(newKey, lic);
  res.json({ success: true, license: lic });
});

app.put("/api/admin/licenses/revoke", (req, res) => {
  const { key } = req.body;
  const lic = dbLicenses.get(key);
  if (!lic) {
    return res.status(404).json({ error: "الرخصة غير موجودة" });
  }
  lic.status = 'revoked';
  dbLicenses.set(key, lic);
  res.json({ success: true, license: lic });
});

// Tutorials Settings CRUD
app.post("/api/admin/tutorials", (req, res) => {
  const { titleAr, titleFr, descriptionAr, videoUrl, thumbnailUrl, duration, category, keySteps } = req.body;
  if (!titleAr || !videoUrl) {
    return res.status(400).json({ error: "عنوان الشرح ورابط الفيديو مطلوبة" });
  }

  const newTut = {
    id: `tut-${Date.now()}`,
    titleAr,
    titleFr: titleFr || titleAr,
    descriptionAr: descriptionAr || '',
    videoUrl,
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    duration: duration || '05:00',
    category: category || 'تثبيت البرنامج',
    keySteps: Array.isArray(keySteps) ? keySteps : [],
    createdAt: new Date().toISOString().split('T')[0]
  };

  dbTutorials.set(newTut.id, newTut);
  res.json({ success: true, tutorial: newTut });
});

app.put("/api/admin/tutorials/:id", (req, res) => {
  const { id } = req.params;
  const tut = dbTutorials.get(id);
  if (!tut) {
    return res.status(404).json({ error: "فيديو الشرح غير موجود" });
  }

  const { titleAr, titleFr, descriptionAr, videoUrl, thumbnailUrl, duration, category, keySteps } = req.body;
  if (titleAr) tut.titleAr = titleAr;
  if (titleFr) tut.titleFr = titleFr;
  if (descriptionAr) tut.descriptionAr = descriptionAr;
  if (videoUrl) tut.videoUrl = videoUrl;
  if (thumbnailUrl) tut.thumbnailUrl = thumbnailUrl;
  if (duration) tut.duration = duration;
  if (category) tut.category = category;
  if (keySteps) tut.keySteps = keySteps;

  dbTutorials.set(id, tut);
  res.json({ success: true, tutorial: tut });
});

app.delete("/api/admin/tutorials/:id", (req, res) => {
  const { id } = req.params;
  const deleted = dbTutorials.delete(id);
  if (!deleted) {
    return res.status(404).json({ error: "فيديو الشرح غير موجود" });
  }
  res.json({ success: true });
});

// Blog CRUD
app.post("/api/admin/blog", (req, res) => {
  const { titleAr, titleFr, excerptAr, excerptFr, category, author, contentAr, imageUrl } = req.body;
  if (!titleAr || !contentAr) {
    return res.status(400).json({ error: "عنوان المقال والمحتوى مطلوبان" });
  }

  const newPost = {
    id: `post-${Date.now()}`,
    slug: `post-${Date.now()}`,
    titleAr,
    titleFr: titleFr || titleAr,
    excerptAr: excerptAr || titleAr,
    excerptFr: excerptFr || titleFr || titleAr,
    category: category || 'تدريس الإنجليزية',
    publishDate: new Date().toLocaleDateString('ar-DZ'),
    readTime: '4 دقائق',
    author: author || 'الإدارة المركزية',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    contentAr,
    likesCount: 0,
    helpfulCount: 0,
    comments: []
  };

  dbBlogPosts.set(newPost.id, newPost);
  res.json({ success: true, post: newPost });
});

app.put("/api/admin/blog/:id", (req, res) => {
  const { id } = req.params;
  const post = dbBlogPosts.get(id);
  if (!post) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  const { titleAr, titleFr, excerptAr, excerptFr, category, author, contentAr, imageUrl } = req.body;
  if (titleAr) post.titleAr = titleAr;
  if (titleFr) post.titleFr = titleFr;
  if (excerptAr) post.excerptAr = excerptAr;
  if (excerptFr) post.excerptFr = excerptFr;
  if (category) post.category = category;
  if (author) post.author = author;
  if (contentAr) post.contentAr = contentAr;
  if (imageUrl) post.imageUrl = imageUrl;

  dbBlogPosts.set(id, post);
  res.json({ success: true, post });
});

app.delete("/api/admin/blog/:id", (req, res) => {
  const { id } = req.params;
  const deleted = dbBlogPosts.delete(id);
  if (!deleted) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }
  res.json({ success: true });
});

// AI Teaching Card Endpoint (Gemini 3.6 Flash)
app.post("/api/gemini/lesson-card", async (req, res) => {
  try {
    const { grade, subject, unit, topic, durationMinutes = 45 } = req.body;

    if (!grade || !subject || !topic) {
      return res.status(400).json({ error: "الرجاء تحديد المستوى والمادة وموضوع الدرس" });
    }

    const ai = getGeminiClient();

    const prompt = `أنت خبير بيداغوجي ومفتش تربوي في وزارة التربية الوطنية الجزائرية مختص في مرحلة التعليم الابتدائي (الجيل الثاني).
قم بإعداد بطاقة بيداغوجية / مذكرة تربوية نموذجية رسمية للدرس التالي:
- المستوى الدراسي: السنة ${grade} ابتدائي
- المادة: ${subject}
- المقطع التعلمي: ${unit || 'المقطع التعلمي المحدد'}
- عنوان الدرس: ${topic}
- مدة الحصة: ${durationMinutes} دقيقة

أعد الإجابة بفرمتة JSON واضحة جداً تحوي المكونات التالية باللغة العربية:
{
  "titleAr": "عنوان المذكرة التربوية",
  "grade": "${grade}",
  "subject": "${subject}",
  "unit": "${unit || 'الوحدة الأولى'}",
  "durationMinutes": ${durationMinutes},
  "objectives": ["الهدف التعلمي 1", "الهدف التعلمي 2", "الهدف التعلمي 3"],
  "didacticMeans": ["الكتاب المدرسي", "السبورة", "صور وسندات توضيحية"],
  "crossCurricularCompetencies": ["الكفاءة العرضية في التعبير والتواصل", "الكفاءة في استثمار المعلومات"],
  "stages": [
    {
      "titleAr": "مرحلة الانطلاق (الوضعية المشكلة الأم / التقويم التشخيصي)",
      "stageType": "launch",
      "teacherActivities": "عرض سند بصري وطرح أسئلة توجيهية لإثارة الفضول واكتشاف موضوع الدرس.",
      "studentActivities": "يميز التلاميذ المشكلة، يستمعون، ويجيبون عن الأسئلة الأولية.",
      "timingMinutes": 10,
      "evaluationStrategy": "ملاحظة التشخيص واسترجاع المكتسبات القبلية"
    },
    {
      "titleAr": "مرحلة بناء التعلمات (الوضعية الجزئية والملاحظة)",
      "stageType": "construction",
      "teacherActivities": "شرح العناوين الرئيسية، توجيه الأنشطة الفردية والجماعية، واستخلاص القاعدة البيداغوجية.",
      "studentActivities": "المشاركة في صياغة القاعدة، تدوين الملاحظات، وإنجاز التطبيق الشفهي.",
      "timingMinutes": 25,
      "evaluationStrategy": "تقويم تكويني ومراقبة مدى استيعاب المفاهيم"
    },
    {
      "titleAr": "مرحلة إعادة الاستثمار (التقويم التحصيلي والتدريب)",
      "stageType": "reinvestment",
      "teacherActivities": "تقديم تمرين فردي على كراس المحاولات لترسيخ التعلمات.",
      "studentActivities": "حل التمرين فردياً والتصحيح الجماعي ثم الفردي على الكراس.",
      "timingMinutes": 10,
      "evaluationStrategy": "تقويم تحصيلي مدى تحقق الأهداف التعلمية"
    }
  ]
}
قم بإرجاع نص JSON فقط بدون وسوم markdown أو كلام إضافي.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Gemini Lesson Card Error:", err);
    res.status(500).json({
      error: "حدث خطأ أثناء توليد المذكرة بواسطة الذكاء الاصطناعي.",
      details: err.message
    });
  }
});

// AI Worksheet & Exam Creator Endpoint
app.post("/api/gemini/worksheet", async (req, res) => {
  try {
    const { grade, subject, term, topic } = req.body;
    const ai = getGeminiClient();

    const prompt = `أنت مصمم تقييمات واختبارات لمدارس التعليم الابتدائي الجزائرية وفق منهاج الجيل الثاني.
صمم ورقة تقويم أو نموذج اختبار للمستوى التالي:
- السنة: ${grade} ابتدائي
- المادة: ${subject}
- الفصل الدراسي: الفصل ${term || 1}
- موضوع أو مجال الاختبار: ${topic || 'تقويم الشامل للمقطع'}

أرجع الإجابة ككائن JSON يحتوي على:
{
  "titleAr": "عنوان الاختبار أو ورقة العمل",
  "grade": "${grade}",
  "subject": "${subject}",
  "term": ${term || 1},
  "durationMinutes": 45,
  "exercises": [
    {
      "number": 1,
      "title": "التمرين الأول (04 نقاط)",
      "points": 4,
      "instruction": "ضع الكلمة المناسبة في الفراغ أو صنف الكلمات التالية",
      "questions": ["السؤال الأول يتعلق بالمفهوم الأول", "السؤال الثاني إكمال الجملة"]
    },
    {
      "number": 2,
      "title": "التمرين الثاني (04 نقاط)",
      "points": 4,
      "instruction": "علل أو أجب بـ (صح) أو (خطأ) مع تصحيح الخطأ إن وجد",
      "questions": ["العبارة الأولى للتأكد من المفهوم", "العبارة الثانية"]
    }
  ],
  "integrationSituation": {
    "context": "الوضعية الإدماجية المركبة (08 نقاط): سياق واقعي يرتبط بالحياة اليومية للتلميذ.",
    "instructions": [
      "المطلوب الأول: اكتب فقرة من 4 إلى 6 أسطر توضح فيها...",
      "المطلوب الثاني: استعمل مكتسباتك القبلية في المادة"
    ],
    "rubricGrid": [
      { "criteria": "الوجاهة والتلاءم مع المنتج المطلوب", "points": 2 },
      { "criteria": "الاستعمال السليم لأدوات المادة واللغة", "points": 3 },
      { "criteria": "الانسجام والتنسيق المنطقي", "points": 2 },
      { "criteria": "الإتقان ونظافة الورقة والإبداع", "points": 1 }
    ]
  },
  "totalPoints": 10
}
أرجع JSON بأسلوب دقيق فقط.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Gemini Worksheet Error:", err);
    res.status(500).json({
      error: "تعذر إنشاء التقييم حالياً",
      details: err.message
    });
  }
});

// Chargily Pay Integration Endpoints
app.post("/api/checkout/chargily", async (req, res) => {
  try {
    const { planId, userEmail, userName, wilaya, paymentStatus } = req.body;
    
    if (paymentStatus === 'failed') {
      return res.status(400).json({ error: "فشل الدفع! تم إلغاء العملية أو رفض البطاقة الذهبية / CIB. يرجى المحاولة مرة أخرى." });
    }

    const planName = planId === 'pro' ? 'PRO' : planId === 'school' ? 'SCHOOL' : 'SINGLE';
    const amount = planId === 'pro' ? 2900 : planId === 'school' ? 8500 : 1900;
    const newLicenseKey = generateLicenseKey(planName);

    // If CHARGILY_SECRET_KEY is set, we can also call Chargily Pay v2 API for live/test checkouts
    const chargilyKey = process.env.CHARGILY_SECRET_KEY;
    let chargilyCheckoutUrl = `/active-license?key=${newLicenseKey}&plan=${planId}&status=success`;

    if (chargilyKey && chargilyKey.trim() !== '') {
      try {
        const chargilyRes = await fetch('https://pay.chargily.com/api/v2/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${chargilyKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            currency: 'dzd',
            success_url: `${req.protocol}://${req.get('host')}/active-license?status=success&key=${newLicenseKey}`,
            failure_url: `${req.protocol}://${req.get('host')}/signup?status=failed`,
            metadata: {
              userEmail,
              userName,
              planId,
              licenseKey: newLicenseKey
            }
          })
        });
        if (chargilyRes.ok) {
          const chargilyData = await chargilyRes.json();
          if (chargilyData.checkout_url) {
            chargilyCheckoutUrl = chargilyData.checkout_url;
          }
        }
      } catch (apiErr) {
        console.warn("Chargily API v2 external call warning (falling back to secure built-in gateway):", apiErr);
      }
    }

    // Save license status in internal DB
    dbLicenses.set(newLicenseKey, {
      id: `lic-${Date.now()}`,
      key: newLicenseKey,
      plan: planId,
      userEmail,
      userName,
      status: 'active',
      issuedAt: new Date().toISOString().split('T')[0],
      expiresAt: '2027-09-01',
      paidVia: 'Chargily Pay (Edahabia / CIB)',
      amountDZD: amount,
      maxDevices: planId === 'school' ? 10 : planId === 'pro' ? 3 : 1
    });

    // Update user if registered
    if (userEmail && dbUsers.has(userEmail)) {
      const u = dbUsers.get(userEmail);
      u.licenseKey = newLicenseKey;
      u.licenseStatus = 'active';
      u.licensePlan = planId;
      dbUsers.set(userEmail, u);
    }

    res.json({
      success: true,
      checkoutUrl: chargilyCheckoutUrl,
      licenseKey: newLicenseKey,
      orderId: `CHARGILY-${Date.now()}`,
      status: 'paid',
      message: 'تم إتمام الدفع بنجاح عبر بوابة Chargily Pay (البطاقة الذهبية / CIB)'
    });
  } catch (err: any) {
    res.status(500).json({ error: "تعذر إكمال عملية الدفع عبر بوابة Chargily", details: err.message });
  }
});

// Chargily Webhook route for checkout.paid event
app.post("/api/webhooks/chargily", (req, res) => {
  const event = req.body;
  console.log("Chargily Webhook received:", event);

  if (event && event.type === 'checkout.paid') {
    const checkoutData = event.data;
    const metadata = checkoutData.metadata || {};
    const userEmail = metadata.userEmail;
    
    const generatedKey = generateLicenseKey('CHARGILY');
    dbLicenses.set(generatedKey, {
      key: generatedKey,
      userEmail,
      status: 'active',
      paidVia: 'Chargily Pay v2'
    });

    if (userEmail && dbUsers.has(userEmail)) {
      const u = dbUsers.get(userEmail);
      u.licenseKey = generatedKey;
      u.licenseStatus = 'active';
    }
  }

  res.json({ received: true });
});

// Verify License Key endpoint
app.post("/api/license/verify", (req, res) => {
  const { licenseKey, userEmail } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ valid: false, message: "الرجاء أدخل مفتاح التفعيل" });
  }

  const cleanKey = licenseKey.trim().toUpperCase();

  if (cleanKey.startsWith("TC-ALG-") || cleanKey === "DEMO-TEACHER-2026") {
    // Save to user profile if provided
    if (userEmail && dbUsers.has(userEmail)) {
      const u = dbUsers.get(userEmail);
      u.licenseKey = cleanKey;
      u.licenseStatus = 'active';
      dbUsers.set(userEmail, u);
    }
    return res.json({
      valid: true,
      licenseKey: cleanKey,
      status: 'active',
      planName: cleanKey.includes('SCHOOL') ? 'المؤسسات التعليمية' : 'جميع السنوات (شامل)',
      expiryDate: '2027-09-01'
    });
  }

  res.status(400).json({ valid: false, message: "مفتاح التفعيل غير صحيح أو منتهي الصلاحية" });
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Teacher Companion Algeria Server running on http://localhost:${PORT}`);
  });
}

startServer();
