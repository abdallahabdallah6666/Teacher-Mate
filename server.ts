import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  createPaymentStore,
  definitiveCheckoutFailure,
  definitiveLicenseFailure,
  emailIdempotencyKey,
  resendRetryIsSafe,
  isStaleAttempt,
  metadataMatches,
  needsManualReconciliation,
  PAYMENT_LEASE_MS,
  PaymentOrder,
  PaymentStore,
  providerStatus,
  safeCustomerEmail,
  safeCustomerName,
  safeError
} from "./paymentStore";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({
  verify: (req, _res, buffer) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
  }
}));

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
let paymentStore: PaymentStore;

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
  const hex = randomBytes(4).toString('hex').toUpperCase();
  const randomPart = `${hex.slice(0, 4)}-${hex.slice(4)}`;
  return `TC-ALG-${plan}-${randomPart}`;
}

// ================= API ROUTES =================

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await paymentStore.ping();
    res.json({ status: "ok", service: "Teacher Companion Algeria Backend", paymentStorage: 'ready' });
  } catch {
    res.status(503).json({ status: "unavailable", service: "Teacher Companion Algeria Backend", paymentStorage: 'unavailable' });
  }
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
    licenseStatus: 'trial',
    licensePlan: 'pro',
    createdAt: new Date().toISOString()
  };

  dbUsers.set(cleanEmail, newUser);

  console.log("User registered:", cleanEmail);
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] as string);
}

function getLicenseSeatPlanKey(planId: string): string | undefined {
  const planKeys: Record<string, string | undefined> = {
    single: process.env.LICENSESEAT_PLAN_KEY_SINGLE,
    pro: process.env.LICENSESEAT_PLAN_KEY_PRO,
    school: process.env.LICENSESEAT_PLAN_KEY_SCHOOL
  };
  return planKeys[planId]?.trim();
}

async function createLicenseSeatLicense(order: PaymentOrder, checkoutId: string) {
  const secret = process.env.LICENSESEAT_SECRET_KEY?.trim();
  const productSlug = process.env.LICENSESEAT_PRODUCT_SLUG?.trim();
  const planKey = getLicenseSeatPlanKey(order.planId);
  if (!secret || !productSlug || !planKey) {
    throw new Error('LicenseSeat server secret, product slug, and plan key must be configured.');
  }

  const response = await fetch(`https://licenseseat.com/api/v1/products/${encodeURIComponent(productSlug)}/licenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      plan_key: planKey,
      metadata: {
        order_id: order.orderId,
        payment_provider: 'Chargily Pay V2',
        chargily_checkout_id: checkoutId,
        buyer_email: order.userEmail,
        buyer_name: order.userName
      }
    })
  });
  const result = await response.json().catch(() => ({}));
  if (response.status !== 201) {
    console.error('LicenseSeat license creation failed:', response.status, result?.error?.code || 'provider_error');
    const failure = new Error('LicenseSeat could not create the purchased license.') as Error & { status?: number };
    failure.status = response.status;
    throw failure;
  }
  const license = result.license || result;
  if (typeof license.key !== 'string' || !license.key.trim()) {
    console.error('LicenseSeat create response did not include a key.');
    throw new Error('LicenseSeat returned an incomplete license response.');
  }
  return {
    key: license.key.trim(),
    id: typeof license.id === 'string' ? license.id : undefined,
    expiresAt: typeof license.expires_at === 'string' ? license.expires_at : undefined,
    seatLimit: Number.isInteger(license.seat_limit) ? license.seat_limit : undefined
  };
}

async function sendLicenseEmail(order: PaymentOrder, licenseKey: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.LICENSE_EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error('Resend API key and verified LICENSE_EMAIL_FROM must be configured.');

  const safeName = escapeHtml(order.userName || order.userEmail);
  const safeKey = escapeHtml(licenseKey);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': emailIdempotencyKey(order.orderId)
    },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      from,
      to: [order.userEmail],
      subject: 'Your Teacher Mate license key',
      text: `Hello ${order.userName || 'Teacher'},\n\nThank you for your purchase. Your license key is:\n\n${licenseKey}\n\nKeep this key safe and enter it in Teacher Mate to activate your license.\n\nTeacher Mate Support`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1e293b"><h2>Your Teacher Mate license</h2><p>Hello ${safeName},</p><p>Thank you for your purchase. Your license key is:</p><p style="font-family:monospace;font-size:20px;font-weight:bold;letter-spacing:1px;background:#f1f5f9;padding:16px;border-radius:8px">${safeKey}</p><p>Keep this key safe and enter it in Teacher Mate to activate your license.</p><p>Teacher Mate Support</p></div>`
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.id !== 'string') {
    console.error('Resend delivery failed:', response.status, result?.name || result?.message || 'provider_error');
    const failure = new Error('Resend could not send the license email.') as Error & { status?: number };
    failure.status = response.status;
    throw failure;
  }
  return result.id as string;
}

// Persist the checkout intent before contacting Chargily, so a process restart cannot lose its reference.
app.post("/api/checkout/chargily", async (req, res) => {
  let order: PaymentOrder | undefined;
  try {
    const chargilyKey = process.env.CHARGILY_SECRET_KEY?.trim();
    if (!chargilyKey || !/^(test|live)_sk_/.test(chargilyKey)) {
      return res.status(503).json({ error: "Chargily Pay is not configured with a valid V2 API secret key." });
    }
    const { planId, userEmail, userName, orderId: requestedOrderId } = req.body || {};
    const plan = dbPricingSettings.plans[planId as keyof typeof dbPricingSettings.plans];
    const cleanEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
    if (!plan || !safeCustomerEmail(cleanEmail)) return res.status(400).json({ error: "A valid plan and customer email are required." });
    if (!process.env.LICENSESEAT_SECRET_KEY?.trim() || !process.env.LICENSESEAT_PRODUCT_SLUG?.trim()
      || !getLicenseSeatPlanKey(planId) || !process.env.RESEND_API_KEY?.trim() || !process.env.LICENSE_EMAIL_FROM?.trim()) {
      return res.status(503).json({ error: "License fulfillment and email delivery are not fully configured." });
    }

    const appUrl = process.env.APP_URL?.trim() || `${req.protocol}://${req.get('host')}`;
    const orderId = typeof requestedOrderId === 'string' && /^[0-9a-f-]{36}$/i.test(requestedOrderId)
      ? requestedOrderId
      : randomUUID();
    const existing = await paymentStore.getOrder(orderId);
    if (existing) {
      if (existing.planId !== planId || existing.userEmail !== cleanEmail || existing.userName !== safeCustomerName(userName)) {
        return res.status(409).json({ error: 'This checkout reference belongs to different order details. Start a new checkout request.' });
      }
      if (existing.checkoutStatus === 'active' && existing.checkoutUrl) {
        return res.json({ success: true, checkoutUrl: existing.checkoutUrl, orderId });
      }
      if (existing.checkoutStatus === 'creating' && isStaleAttempt(existing.checkoutCreateStartedAt)) {
        await paymentStore.updateOrder(orderId, { status: 'pending', checkoutStatus: 'unknown' });
        return res.status(409).json({ error: 'The earlier checkout request may have succeeded. Do not start another payment; contact support with this order reference.', orderId, needsSupport: true });
      }
      if (existing.checkoutStatus === 'unknown') {
        return res.status(409).json({ error: 'Checkout status is being reconciled. Do not start another payment; contact support with this order reference.', orderId, needsSupport: true });
      }
      if (existing.checkoutStatus === 'creating') {
        return res.status(409).json({ error: 'Your checkout request is still being processed. Please wait a moment and retry with the same order reference.', orderId, pending: true });
      }
      return res.status(409).json({ error: 'This checkout could not be created. Start a fresh checkout request.', orderId, retryable: true });
    }
    order = {
      orderId,
      planId,
      userEmail: cleanEmail,
      userName: safeCustomerName(userName),
      amount: plan.priceDZD,
      status: 'creating',
      checkoutStatus: 'creating',
      fulfillmentStatus: 'pending',
      checkoutCreateStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    try {
      await paymentStore.createOrder(order);
    } catch (error) {
      const racedOrder = await paymentStore.getOrder(orderId);
      if (racedOrder) return res.status(409).json({ error: 'Checkout request already exists. Retry using the same order reference.', orderId, pending: true });
      throw error;
    }

    const baseUrl = chargilyKey.startsWith('test_sk_') ? 'https://pay.chargily.net/test/api/v2' : 'https://pay.chargily.net/api/v2';
    const returnUrl = new URL('/', appUrl);
    returnUrl.searchParams.set('chargily_order', orderId);
    const failureUrl = new URL('/', appUrl);
    failureUrl.searchParams.set('chargily_order', orderId);
    failureUrl.searchParams.set('payment_failed', '1');
    let chargilyRes: Response;
    try {
      chargilyRes = await fetch(`${baseUrl}/checkouts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${chargilyKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          amount: plan.priceDZD,
          currency: 'dzd',
          success_url: returnUrl.toString(),
          failure_url: failureUrl.toString(),
          webhook_endpoint: new URL('/api/webhooks/chargily', appUrl).toString(),
          locale: 'ar',
          description: `Teacher Mate ${planId} subscription`,
          metadata: { orderId, userEmail: cleanEmail, userName: order.userName, planId, amountDZD: plan.priceDZD }
        })
      });
    } catch (error) {
      await paymentStore.updateOrder(orderId, { status: 'pending', checkoutStatus: 'unknown' });
      console.error('Chargily checkout outcome is unknown for order:', orderId.slice(0, 8), safeError(error));
      return res.status(502).json({ error: "Checkout status is being reconciled. Please do not start another payment; contact support with your order reference.", orderId });
    }

    const data = await chargilyRes.json().catch(() => ({}));
    if (!chargilyRes.ok || !data.id || !data.checkout_url) {
      if (definitiveCheckoutFailure(chargilyRes.status)) {
        await paymentStore.updateOrder(orderId, { status: 'failed', checkoutStatus: 'failed' });
      } else {
        await paymentStore.updateOrder(orderId, { status: 'pending', checkoutStatus: 'unknown' });
      }
      console.error('Chargily checkout creation failed:', chargilyRes.status);
      return res.status(502).json({ error: chargilyRes.status < 500 ? "Chargily could not create the checkout." : "Checkout status is being reconciled; please contact support before trying again.", orderId });
    }

    await paymentStore.updateOrder(orderId, { status: 'pending', checkoutStatus: 'active', checkoutId: data.id, checkoutUrl: data.checkout_url });
    return res.json({ success: true, checkoutUrl: data.checkout_url, orderId });
  } catch (error) {
    console.error('Chargily checkout initialization failed:', safeError(error));
    return res.status(503).json({ error: "Payment storage or checkout is temporarily unavailable. Please try again shortly." });
  }
});

app.get("/api/checkout/chargily/status/:orderId", async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!/^[0-9a-f-]{36}$/i.test(req.params.orderId)) return res.status(404).json({ status: 'unknown' });
  try {
    const order = await paymentStore.getOrder(req.params.orderId);
    if (!order) return res.status(404).json({ status: 'unknown' });
    return res.json({
      status: order.status === 'creating' ? 'pending' : order.status,
      emailSent: order.fulfillmentStatus === 'email_sent',
      needsSupport: needsManualReconciliation(order)
    });
  } catch {
    return res.status(503).json({ status: 'unavailable' });
  }
});

app.post("/api/webhooks/chargily", async (req, res) => {
  const secret = process.env.CHARGILY_SECRET_KEY?.trim();
  const signature = req.get('signature');
  const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;
  if (!secret || !signature || !rawBody) return res.status(400).json({ error: 'Missing Chargily webhook signature or server configuration.' });

  const expected = createHmac('sha256', secret).update(rawBody).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, 'hex'); } catch { return res.status(403).json({ error: 'Invalid webhook signature.' }); }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return res.status(403).json({ error: 'Invalid webhook signature.' });

  const event = req.body;
  if (!event || typeof event.id !== 'string' || event.id.length > 128 || event.id.includes('/') || typeof event.type !== 'string') {
    return res.status(400).json({ error: 'Invalid webhook event.' });
  }
  let eventClaim: 'acquired' | 'completed' | 'busy';
  try {
    eventClaim = await paymentStore.claimEvent(event.id, event.type, PAYMENT_LEASE_MS);
  } catch {
    return res.status(503).json({ error: 'Payment storage is temporarily unavailable.' });
  }
  if (eventClaim === 'completed') return res.status(200).json({ received: true, duplicate: true });
  if (eventClaim === 'busy') return res.status(503).json({ error: 'This event is currently being processed; retry shortly.' });

  let claimedOrderId: string | undefined;
  try {
    if (event.type === 'checkout.paid') {
      const checkout = event.data || {};
      const metadata = checkout.metadata || {};
      const orderId = metadata.orderId;
      const planId = metadata.planId;
      const plan = dbPricingSettings.plans[planId as keyof typeof dbPricingSettings.plans];
      if (typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId)) {
        return res.status(400).json({ error: 'Paid checkout does not include a valid order reference.' });
      }
      let order = await paymentStore.getOrder(orderId);
      if (!order) return res.status(400).json({ error: 'Paid checkout does not match a stored order.' });
      if (typeof checkout.id !== 'string' || !plan || checkout.status !== 'paid' || checkout.currency !== 'dzd'
        || Number(checkout.amount) !== order.amount || typeof metadata.userEmail !== 'string'
        || !metadataMatches(order, checkout, metadata)) {
        return res.status(400).json({ error: 'Paid checkout data does not match the expected order.' });
      }

      const claim = await paymentStore.claimOrder(orderId, PAYMENT_LEASE_MS);
      if (claim === 'busy') return res.status(503).json({ error: 'This order is being processed; retry shortly.' });
      claimedOrderId = orderId;
      order = {
        ...order,
        checkoutId: String(checkout.id),
        status: 'paid',
        checkoutStatus: 'active'
      };
      await paymentStore.updateOrder(orderId, { checkoutId: String(checkout.id), status: 'paid', checkoutStatus: 'active' });

      if (order.fulfillmentStatus === 'license_creation_started' && isStaleAttempt(order.licenseCreateStartedAt)) {
        await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'license_creation_unknown' });
        await paymentStore.completeEvent(event.id);
        return res.status(200).json({ received: true, needsReconciliation: true });
      }
      if (order.fulfillmentStatus === 'license_creation_started') {
        await paymentStore.releaseEvent(event.id);
        return res.status(503).json({ error: 'License creation is still being reconciled; retry shortly.' });
      }
      if (needsManualReconciliation(order)) {
        await paymentStore.completeEvent(event.id);
        return res.status(200).json({ received: true, needsReconciliation: true });
      }

      try {
        if (order.fulfillmentStatus === 'pending') {
          await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'license_creation_started', licenseCreateStartedAt: new Date().toISOString() });
          try {
            const created = await createLicenseSeatLicense(order, String(checkout.id));
            await paymentStore.updateOrder(orderId, {
              licenseKey: created.key,
              licenseSeatLicenseId: created.id,
              fulfillmentStatus: 'license_created'
            });
            order = { ...order, licenseKey: created.key, licenseSeatLicenseId: created.id, fulfillmentStatus: 'license_created' };
          } catch (error) {
            const status = providerStatus(error);
            if (status !== undefined && definitiveLicenseFailure(status)) {
              await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'pending' });
              await paymentStore.releaseEvent(event.id);
              return res.status(503).json({ error: 'LicenseSeat rejected fulfillment; provider delivery may be retried after configuration is corrected.' });
            }
            await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'license_creation_unknown' });
            await paymentStore.completeEvent(event.id);
            return res.status(200).json({ received: true, needsReconciliation: true });
          }
        }

        order = await paymentStore.getOrder(orderId) || order;
        if (order.fulfillmentStatus === 'email_sending' && !resendRetryIsSafe(order.emailSendStartedAt)) {
          await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'email_delivery_unknown' });
          await paymentStore.completeEvent(event.id);
          return res.status(200).json({ received: true, needsReconciliation: true });
        }
        if (order.fulfillmentStatus === 'license_created' || order.fulfillmentStatus === 'email_sending') {
          if (!order.licenseKey) throw new Error('Stored LicenseSeat key is missing.');
          if (order.fulfillmentStatus === 'license_created') {
            await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'email_sending', emailSendStartedAt: new Date().toISOString() });
          }
          try {
            const emailId = await sendLicenseEmail(order, order.licenseKey);
            await paymentStore.updateOrder(orderId, { resendEmailId: emailId, fulfillmentStatus: 'email_sent' });
          } catch (error) {
            const status = providerStatus(error);
            if (status !== undefined && status >= 400 && status < 500) {
              await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'license_created' });
            } else if (!resendRetryIsSafe(order.emailSendStartedAt || new Date().toISOString())) {
              await paymentStore.updateOrder(orderId, { fulfillmentStatus: 'email_delivery_unknown' });
              await paymentStore.completeEvent(event.id);
              return res.status(200).json({ received: true, needsReconciliation: true });
            }
            await paymentStore.releaseEvent(event.id);
            return res.status(503).json({ error: 'Payment is recorded; email delivery will be retried safely.' });
          }
        }
      } catch (error) {
        console.error('Paid order fulfillment persistence failed:', orderId.slice(0, 8), safeError(error));
        await paymentStore.releaseEvent(event.id).catch(() => undefined);
        return res.status(503).json({ error: 'Payment is recorded; fulfillment will resume when storage is available.' });
      }
    } else if (event.type === 'checkout.failed' || event.type === 'checkout.canceled') {
      const checkout = event.data || {};
      const metadataOrderId = checkout.metadata?.orderId;
      const order = (typeof metadataOrderId === 'string' ? await paymentStore.getOrder(metadataOrderId) : undefined)
        || (typeof checkout.id === 'string' ? await paymentStore.getOrderByCheckoutId(checkout.id) : undefined);
      if (order && order.status !== 'paid') {
        await paymentStore.updateOrder(order.orderId, { status: 'failed', checkoutStatus: 'failed' });
      }
    }
    await paymentStore.completeEvent(event.id);
    return res.status(200).json({ received: true });
  } catch (error) {
    if (claimedOrderId) await paymentStore.releaseOrder(claimedOrderId).catch(() => undefined);
    await paymentStore.releaseEvent(event.id).catch(() => undefined);
    console.error('Chargily webhook processing failed:', safeError(error));
    return res.status(503).json({ error: 'Webhook processing is temporarily unavailable; retry shortly.' });
  } finally {
    if (claimedOrderId) await paymentStore.releaseOrder(claimedOrderId).catch(() => undefined);
  }
});

// Verify License Key endpoint
app.post("/api/license/verify", async (req, res) => {
  const { licenseKey, userEmail } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ valid: false, message: "الرجاء أدخل مفتاح التفعيل" });
  }

  const secret = process.env.LICENSESEAT_SECRET_KEY?.trim();
  const productSlug = process.env.LICENSESEAT_PRODUCT_SLUG?.trim();
  if (!secret || !productSlug) {
    return res.status(503).json({ valid: false, message: "License verification is not configured." });
  }

  const cleanKey = licenseKey.trim().toUpperCase();
  try {
    const validationResponse = await fetch(`https://licenseseat.com/api/v1/products/${encodeURIComponent(productSlug)}/licenses/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ license_key: cleanKey })
    });
    const validation = await validationResponse.json().catch(() => ({}));
    if (!validationResponse.ok || validation.valid !== true) {
      return res.status(400).json({ valid: false, message: "مفتاح التفعيل غير صحيح أو منتهي الصلاحية" });
    }

    const license = validation.license || {};
    // Save to user profile if provided
    const cleanEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
    if (cleanEmail && dbUsers.has(cleanEmail)) {
      const u = dbUsers.get(cleanEmail);
      u.licenseKey = cleanKey;
      u.licenseStatus = 'active';
      u.licensePlan = license.plan_key || u.licensePlan;
      dbUsers.set(cleanEmail, u);
    }
    return res.json({
      valid: true,
      licenseKey: cleanKey,
      status: 'active',
      planName: license.plan_key || 'Teacher Mate',
      expiryDate: license.expires_at || null
    });
  } catch (err: any) {
    console.error('LicenseSeat verification request failed:', err?.message || err);
    return res.status(502).json({ valid: false, message: "تعذر التحقق من مفتاح الرخصة حالياً" });
  }
});

// Vite & Static file serving setup
async function startServer() {
  paymentStore = await createPaymentStore();
  await paymentStore.ping();
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

startServer().catch(error => {
  console.error('Server startup failed; PostgreSQL is required for payment safety:', safeError(error));
  process.exitCode = 1;
});
