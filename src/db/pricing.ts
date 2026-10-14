import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

export interface PlanConfig {
  id: string;
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

export interface PricingSettingsData {
  currencyDZD: string;
  promoNoticeAr?: string;
  promoNoticeFr?: string;
  promoNoticeEn?: string;
  plans: {
    pro: PlanConfig;
    single?: PlanConfig;
    school?: PlanConfig;
  };
}

export const DEFAULT_PRICING_SETTINGS: PricingSettingsData = {
  currencyDZD: 'دج / DZD',
  promoNoticeAr: 'تخفيضات العودة المدرسية 2026/2027: حسم يصل إلى 30% على الاشتراكات السنوية',
  promoNoticeFr: 'Offre Rentrée Scolaire 2026/2027: Jusqu\'à 30% de réduction',
  promoNoticeEn: 'Back to School 2026/2027 Sale: Up to 30% discount',
  plans: {
    pro: {
      id: 'pro',
      nameAr: 'الرخصة السنوية الشخصية (Personal Yearly License)',
      nameFr: 'Licence Personnelle Annuelle',
      nameEn: 'Personal Yearly License',
      priceDZD: 3000,
      periodAr: 'سنة كاملة / جهاز PC واحد',
      periodFr: '1 an / 1 PC',
      periodEn: '1 Year / 1 PC',
      badgeAr: 'الأكثر طلباً ⭐',
      badgeFr: 'Plus Populaire ⭐',
      badgeEn: 'Most Popular ⭐',
      popular: true,
      featuresAr: [
        'تفعيل شامل لحساب الأستاذ على جهاز حاسوب واحد (1 PC)',
        'مولد المذكرات الذكي بالذكاء الاصطناعي Gemini 3.6 Flash',
        'أوراق عمل Phonics وصانع Flashcards الملونة',
        'تصدير واستيراد قوائم التلاميذ والتقييمات إلى Excel',
        'دعم فني مباشر وبلاغات طوارئ SOS ذات أولوية'
      ],
      featuresFr: [
        'Activation complète du compte enseignant sur 1 PC',
        'Générateur de fiches IA Gemini 3.6 Flash',
        'Atelier Phonics et créateur de Flashcards',
        'Export/Import des listes d\'élèves vers Excel',
        'Support technique prioritaire & alertes SOS'
      ],
      featuresEn: [
        'Full teacher account activation for 1 PC',
        'AI Lesson plan generator (Gemini 3.6 Flash)',
        'Phonics practice & colorful Flashcards maker',
        'Excel export/import for student evaluation lists',
        'Priority technical support & SOS emergency queue'
      ]
    }
  }
};

const BACKUP_PATH = path.join(process.cwd(), 'src/db/pricing-backup.json');

function getDbPool(): Pool | null {
  const host = (process.env.SQL_HOST || process.env.DB_HOST)?.trim();
  const user = (process.env.SQL_USER || process.env.DB_USER)?.trim();
  const database = (process.env.SQL_DB_NAME || process.env.DB_NAME)?.trim();
  const password = process.env.SQL_PASSWORD || process.env.DB_PASS;

  if (host && user && database && password) {
    return new Pool({
      host,
      user,
      password,
      database,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }
  return null;
}

export async function loadPricingSettings(): Promise<PricingSettingsData> {
  const pool = getDbPool();
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT currency_dzd, promo_notice_ar, promo_notice_fr, promo_notice_en, plans FROM pricing_settings WHERE id = 'current' LIMIT 1"
      );
      if (res.rows[0]) {
        const row = res.rows[0];
        const loadedPlans = row.plans || {};
        const merged: PricingSettingsData = {
          currencyDZD: row.currency_dzd || DEFAULT_PRICING_SETTINGS.currencyDZD,
          promoNoticeAr: row.promo_notice_ar ?? DEFAULT_PRICING_SETTINGS.promoNoticeAr,
          promoNoticeFr: row.promo_notice_fr ?? DEFAULT_PRICING_SETTINGS.promoNoticeFr,
          promoNoticeEn: row.promo_notice_en ?? DEFAULT_PRICING_SETTINGS.promoNoticeEn,
          plans: {
            pro: {
              ...DEFAULT_PRICING_SETTINGS.plans.pro,
              ...(loadedPlans.pro || {}),
              priceDZD: Math.max(50, Number(loadedPlans.pro?.priceDZD || DEFAULT_PRICING_SETTINGS.plans.pro.priceDZD))
            }
          }
        };
        // Also keep local backup fresh
        try {
          fs.writeFileSync(BACKUP_PATH, JSON.stringify(merged, null, 2), 'utf-8');
        } catch {}
        return merged;
      }
    } catch (err: any) {
      console.warn('Could not read pricing from PostgreSQL, falling back to local file/defaults:', err?.message || err);
    } finally {
      await pool.end().catch(() => undefined);
    }
  }

  // Fallback to local backup JSON file if available
  if (fs.existsSync(BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(BACKUP_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.plans) {
        return parsed as PricingSettingsData;
      }
    } catch {}
  }

  return JSON.parse(JSON.stringify(DEFAULT_PRICING_SETTINGS));
}

export async function persistPricingSettings(settings: PricingSettingsData): Promise<PricingSettingsData> {
  // Validate and clamp all prices to minimum 50 DZD (Chargily minimum limit)
  const cleanSettings: PricingSettingsData = {
    currencyDZD: settings.currencyDZD || DEFAULT_PRICING_SETTINGS.currencyDZD,
    promoNoticeAr: settings.promoNoticeAr,
    promoNoticeFr: settings.promoNoticeFr,
    promoNoticeEn: settings.promoNoticeEn,
    plans: {
      pro: {
        ...settings.plans.pro,
        priceDZD: Math.max(50, Number(settings.plans.pro.priceDZD || DEFAULT_PRICING_SETTINGS.plans.pro.priceDZD))
      }
    }
  };

  // 1. Save to local disk backup
  try {
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(cleanSettings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write local pricing backup:', err);
  }

  // 2. Persist to Cloud SQL / PostgreSQL
  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO pricing_settings (id, currency_dzd, promo_notice_ar, promo_notice_fr, promo_notice_en, plans, updated_at)
         VALUES ('current', $1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET
           currency_dzd = EXCLUDED.currency_dzd,
           promo_notice_ar = EXCLUDED.promo_notice_ar,
           promo_notice_fr = EXCLUDED.promo_notice_fr,
           promo_notice_en = EXCLUDED.promo_notice_en,
           plans = EXCLUDED.plans,
           updated_at = NOW()`,
        [
          cleanSettings.currencyDZD,
          cleanSettings.promoNoticeAr || null,
          cleanSettings.promoNoticeFr || null,
          cleanSettings.promoNoticeEn || null,
          JSON.stringify(cleanSettings.plans)
        ]
      );
      console.log('Pricing settings successfully saved to PostgreSQL database.');
    } catch (err: any) {
      console.error('Failed to persist pricing to PostgreSQL:', err?.message || err);
    } finally {
      await pool.end().catch(() => undefined);
    }
  }

  return cleanSettings;
}
