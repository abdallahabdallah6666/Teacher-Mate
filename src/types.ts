/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GradeLevel = '3AP' | '4AP' | '5AP';

export type UserRole = 'user' | 'admin';

export type Wilaya = {
  code: string;
  nameAr: string;
  nameFr: string;
};

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  wilaya: string;
  schoolName: string;
  referralSource?: string;
  primaryGrade: GradeLevel;
  licenseKey?: string;
  licenseStatus: 'trial' | 'active' | 'expired';
  licensePlan?: 'single' | 'pro' | 'school';
  expiresAt?: string;
  createdAt: string;
  isFlagged?: boolean;
  flagReason?: string;
  isBlocked?: boolean;
}

export interface DesktopFeature {
  id: string;
  titleAr: string;
  titleFr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionFr: string;
  descriptionEn: string;
  category: 'إدارة وتنظيم' | 'ذكاء اصطناعي وبيداغوجيا' | 'تقويم وتنقيط' | 'أنشطة ووسائل';
  iconName: string;
  tagAr: string;
  tagFr: string;
  tagEn: string;
  highlightsAr: string[];
  highlightsFr: string[];
  highlightsEn: string[];
  screenshotUrl?: string;
}

export interface LicensePlan {
  id: 'single' | 'pro' | 'school';
  nameAr: string;
  nameFr: string;
  priceDZD: number;
  period: string;
  popular?: boolean;
  featuresAr: string[];
  featuresFr: string[];
}

export interface PricingPlanConfig {
  id: 'single' | 'pro' | 'school';
  nameAr: string;
  nameFr: string;
  nameEn: string;
  priceDZD: number;
  periodAr: string;
  periodFr: string;
  periodEn: string;
  badgeAr?: string;
  badgeFr?: string;
  badgeEn?: string;
  popular?: boolean;
  featuresAr: string[];
  featuresFr: string[];
  featuresEn: string[];
}

export interface PricingSettings {
  currencyDZD: string;
  promoNoticeAr?: string;
  promoNoticeFr?: string;
  promoNoticeEn?: string;
  plans: {
    single: PricingPlanConfig;
    pro: PricingPlanConfig;
    school: PricingPlanConfig;
  };
}

export interface LicenseRecord {
  id: string;
  key: string;
  userEmail: string;
  userName?: string;
  plan: 'single' | 'pro' | 'school';
  status: 'active' | 'revoked' | 'expired';
  issuedAt: string;
  expiresAt: string;
  paidVia: 'Chargily Pay v2 (Edahabia/CIB)' | 'BaridiMob / CCP' | 'Manual Admin Issue' | 'Trial Demo';
  amountDZD: number;
  maxDevices: number;
}

export interface SupportInquiry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  wilaya?: string;
  subject: string;
  category: 'استفسار عن التفعيل' | 'مشكلة في البرنامج' | 'اقتراح ميزة جديدة' | 'طلب فترات تدريبية' | '🚨 بلاغ عاجل جداً (SOS Priority)';
  message: string;
  status: 'pending' | 'replied' | 'closed';
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  isSOS?: boolean;
  priority?: 'urgent' | 'normal';
}

export interface AdminStats {
  totalSalesDZD: number;
  totalCustomers: number;
  activeLicensesCount: number;
  pendingInquiriesCount: number;
  monthlyRevenueDZD: number;
  recentSales: LicenseRecord[];
}

export interface LessonCardStage {
  titleAr: string;
  stageType: 'launch' | 'construction' | 'reinvestment';
  teacherActivities: string;
  studentActivities: string;
  timingMinutes: number;
  evaluationStrategy: string;
}

export interface LessonCard {
  titleAr: string;
  grade: GradeLevel;
  subject: string;
  unit: string;
  durationMinutes: number;
  objectives: string[];
  didacticMeans: string[];
  crossCurricularCompetencies: string[];
  stages: LessonCardStage[];
}

export interface AssessmentExamExercise {
  number: number;
  title: string;
  points: number;
  instruction: string;
  questions: string[];
}

export interface IntegrationRubric {
  criteria: string;
  points: number;
}

export interface AssessmentExam {
  titleAr: string;
  grade: GradeLevel;
  subject: string;
  term: number;
  durationMinutes: number;
  exercises: AssessmentExamExercise[];
  integrationSituation: {
    context: string;
    instructions: string[];
    rubricGrid: IntegrationRubric[];
  };
  totalPoints: number;
}

export interface StudentGrade {
  id: string;
  studentName: string;
  gender?: string;
  continuousAssessment?: number;
  testMark?: number;
  testScore?: number;
  examMark?: number;
  examScore?: number;
  termAverage?: number;
  finalAverage?: number;
  observationAr?: string;
}

export interface SubjectModule {
  id: string;
  code?: string;
  nameAr: string;
  nameFr: string;
  icon?: string;
  iconName?: string;
  color?: string;
  weeklyHours?: string | number;
  descriptionAr?: string;
  domains?: string[];
  grades?: string[];
  coefficient?: number;
}

export interface BlogPostComment {
  id: string;
  userName: string;
  userRole?: string;
  userWilaya?: string;
  content: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  titleAr: string;
  titleFr: string;
  excerptAr: string;
  excerptFr: string;
  category: 'تحديثات التطبيق' | 'إرشادات بيداغوجية' | 'دليل التثبيت والبدء' | 'شروحات الفيديو' | 'الجيل الثاني' | 'تدريس الإنجليزية' | 'تقييم المكتسبات';
  publishDate: string;
  readTime: string;
  author: string;
  contentAr: string;
  imageUrl: string;
  videoUrl?: string;
  isTutorial?: boolean;
  likesCount?: number;
  helpfulCount?: number;
  comments?: BlogPostComment[];
}

export interface TutorialVideo {
  id: string;
  titleAr: string;
  titleFr: string;
  descriptionAr: string;
  videoUrl: string;
  embedUrl?: string;
  thumbnailUrl: string;
  duration: string;
  category: 'تثبيت البرنامج' | 'صانع المذكرات الذكي' | 'الفونكس والتمارين' | 'تقييم المكتسبات' | 'التفعيل بالذهبية';
  keySteps: string[];
  createdAt: string;
}
