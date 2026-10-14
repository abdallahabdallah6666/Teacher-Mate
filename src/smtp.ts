import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface SmtpConfig {
  service: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'src/db/smtp-settings.json');

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'abdallahbourrich66@gmail.com',
  pass: '',
  fromName: 'رفيق المعلم الجزائري - Teacher Mate DZ',
  fromEmail: 'abdallahbourrich66@gmail.com'
};

export function loadSmtpSettings(): SmtpConfig {
  let config: SmtpConfig = { ...DEFAULT_SMTP_CONFIG };

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      config = { ...config, ...data };
    } catch (e) {
      console.warn('[SMTP] Could not parse smtp-settings.json:', e);
    }
  }

  // Environment variables take precedence if present
  if (process.env.SMTP_USER) config.user = process.env.SMTP_USER;
  if (process.env.SMTP_PASS) config.pass = process.env.SMTP_PASS;
  if (process.env.GMAIL_USER) config.user = process.env.GMAIL_USER;
  if (process.env.GMAIL_APP_PASS) config.pass = process.env.GMAIL_APP_PASS;
  if (process.env.SMTP_HOST) config.host = process.env.SMTP_HOST;
  if (process.env.SMTP_PORT) config.port = Number(process.env.SMTP_PORT);
  if (process.env.SMTP_FROM_NAME) config.fromName = process.env.SMTP_FROM_NAME;
  if (process.env.SMTP_FROM_EMAIL) config.fromEmail = process.env.SMTP_FROM_EMAIL;

  return config;
}

export function saveSmtpSettings(newSettings: Partial<SmtpConfig>): SmtpConfig {
  const current = loadSmtpSettings();
  const updated: SmtpConfig = {
    ...current,
    ...newSettings,
    port: Number(newSettings.port) || 587,
    secure: Boolean(newSettings.secure)
  };

  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[SMTP] Settings updated successfully.');
  } catch (err) {
    console.error('[SMTP] Failed to save settings to disk:', err);
  }

  return updated;
}

export function createSmtpTransporter(config: SmtpConfig) {
  if (config.service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user.trim(),
        pass: config.pass.trim().replace(/\s+/g, '') // remove spaces from Gmail app passwords
      }
    });
  }

  return nodemailer.createTransport({
    host: config.host.trim(),
    port: config.port || 587,
    secure: config.secure || config.port === 465,
    auth: {
      user: config.user.trim(),
      pass: config.pass.trim()
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

function escapeHtml(val: string): string {
  return String(val).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c] as string);
}

export interface LicenseEmailParams {
  email: string;
  fullName: string;
  licenseKey: string;
  planName?: string;
  password?: string;
  schoolName?: string;
  wilaya?: string;
  expiresAt?: string;
}

export function buildLicenseEmailContent(params: LicenseEmailParams, fromName: string) {
  const safeName = escapeHtml(params.fullName || 'أستاذنا الفاضل');
  const safeEmail = escapeHtml(params.email);
  const safeKey = escapeHtml(params.licenseKey);
  const safePlan = escapeHtml(params.planName || 'Personal Lifetime License');
  const safeSchool = params.schoolName ? escapeHtml(params.schoolName) : '';
  const safeWilaya = params.wilaya ? escapeHtml(params.wilaya) : '';
  const safePass = params.password ? escapeHtml(params.password) : '';

  const subject = `🎓 مفتاح تفعيل رفيق المعلم الجزائري: ${params.licenseKey}`;

  const text = `مرحباً أستاذ(ة) ${params.fullName}،\n\n` +
    `يسعدنا إعلامك بأنه تم إنشاء حسابك في "رفيق المعلم الجزائري" بنجاح.\n\n` +
    `مفتاح الترخيص الخاص بك (License Key):\n${params.licenseKey}\n\n` +
    `بيانات الحساب:\n` +
    `- البريد الإلكتروني: ${params.email}\n` +
    (params.password ? `- كلمة المرور: ${params.password}\n` : '') +
    `- الخطة: ${params.planName || 'Personal Lifetime License'}\n` +
    (params.schoolName ? `- المؤسسة التعليمية: ${params.schoolName}\n` : '') +
    (params.wilaya ? `- الولاية: ${params.wilaya}\n` : '') +
    `\nطريقة التفعيل السريعة:\n` +
    `1. افتح تطبيق أو موقع "رفيق المعلم الجزائري".\n` +
    `2. انتقل إلى خانة "تفعيل الترخيص" (Activate License).\n` +
    `3. الصق مفتاح الترخيص واضغط على "تحقق وتفعيل".\n\n` +
    `لأي مساعدة تواصل معنا عبر البريد: abdallahbourrich66@gmail.com\n\n` +
    `مع أطيب التحيات البيداغوجية،\nرفيق المعلم الجزائري`;

  const html = `
  <div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 26px 22px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">🎓 رفيق المعلم الجزائري (Teacher Mate DZ)</h1>
      <p style="margin: 6px 0 0; font-size: 13px; color: #ccfbf1; font-weight: 500;">مفتاح الرخصة الرسمية وبيانات التفعيل البيداغوجي المباشر</p>
    </div>
    
    <div style="padding: 26px 22px; color: #1e293b; line-height: 1.6;">
      <p style="font-size: 16px; margin-top: 0; color: #0f172a;">
        مرحباً بك أستاذ(ة) <strong>${safeName}</strong>،
      </p>
      <p style="color: #475569; font-size: 13px;">
        يسعدنا إعلامك بأنه تم إنشاء وتفعيل حسابك الرسمي في <strong>رفيق المعلم الجزائري</strong>. إليك مفتاح التفعيل الرسمي الخاص بك:
      </p>
      
      <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
        <div style="font-size: 12px; color: #0f766e; margin-bottom: 8px; font-weight: 800; text-transform: uppercase;">
          مفتاح الترخيص الخاص بك (License Key):
        </div>
        <div style="font-family: monospace; font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #0d9488; direction: ltr; user-select: all; background: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #99f6e4; display: inline-block;">
          ${safeKey}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
          الخطة: <strong>${safePlan}</strong> ${params.expiresAt ? `(الصلاحية حتى: ${escapeHtml(params.expiresAt)})` : ''}
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: #334155;">
        <div style="margin-bottom: 6px;"><strong>البريد الإلكتروني المعتمد:</strong> <span style="direction: ltr; display: inline-block; font-weight: 700; color: #0f172a;">${safeEmail}</span></div>
        ${safePass ? `<div style="margin-bottom: 6px;"><strong>كلمة المرور المؤقتة:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:13px;color:#0f172a;font-weight:700;">${safePass}</code></div>` : ''}
        ${safeSchool ? `<div style="margin-bottom: 6px;"><strong>المؤسسة التربوية:</strong> <span>${safeSchool}</span></div>` : ''}
        ${safeWilaya ? `<div><strong>الولاية:</strong> <span>${safeWilaya}</span></div>` : ''}
      </div>

      <div style="background: #ecfdf5; border-right: 4px solid #0d9488; padding: 14px 18px; border-radius: 6px; margin-bottom: 22px;">
        <h4 style="margin: 0 0 6px; color: #0f766e; font-size: 13px; font-weight: 800;">طريقة التفعيل السريعة (في 3 خطوات):</h4>
        <ol style="margin: 0; padding-right: 20px; font-size: 12px; color: #115e59; line-height: 1.7;">
          <li>افتح تطبيق أو موقع <strong>رفيق المعلم الجزائري</strong>.</li>
          <li>انتقل إلى قسم <strong>تفعيل الترخيص (Activate License)</strong>.</li>
          <li>الصق مفتاح الترخيص الخاص بك واضغط على <strong>تحقق وتفعيل</strong> لبدء استخدام كافة المذكرات والمساعد البيداغوجي فوراً.</li>
        </ol>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 22px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        لأي مساعدة بيداغوجية أو استفسار، يسعدنا تواصلك معنا مباشرة عبر: <br/>
        <a href="mailto:abdallahbourrich66@gmail.com" style="color: #0d9488; font-weight: 700; text-decoration: none;">abdallahbourrich66@gmail.com</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
        مع خالص التحيات البيداغوجية،<br/>
        <strong>${escapeHtml(fromName)}</strong>
      </p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} Teacher Mate DZ. جميع الحقوق محفوظة.
    </div>
  </div>`;

  return { subject, text, html };
}

export async function sendLicenseEmailViaNodemailer(params: LicenseEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  notConfigured?: boolean;
  emailText: string;
  emailHtml: string;
  recipient: string;
}> {
  const config = loadSmtpSettings();
  const { subject, text, html } = buildLicenseEmailContent(params, config.fromName);

  if (!config.pass || !config.pass.trim()) {
    console.warn(`[SMTP] SMTP Password is not yet set. Email to ${params.email} cannot be sent automatically. Manual copy prepared.`);
    return {
      success: false,
      notConfigured: true,
      error: 'لم يتم حفظ كلمة مرور بريد الإرسال (Gmail App Password) في إعدادات SMTP بعد. تم تجهيز نص الرسالة للنسخ اليدوي.',
      emailText: text,
      emailHtml: html,
      recipient: params.email
    };
  }

  try {
    const transporter = createSmtpTransporter(config);
    const fromAddress = `"${config.fromName}" <${config.fromEmail || config.user}>`;

    console.log(`[SMTP] Sending license email directly to ${params.email} from ${fromAddress}...`);
    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.email,
      replyTo: config.fromEmail || config.user,
      subject,
      text,
      html
    });

    console.log(`[SMTP] Email successfully delivered to ${params.email}! Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      emailText: text,
      emailHtml: html,
      recipient: params.email
    };
  } catch (err: any) {
    console.error(`[SMTP] Delivery error to ${params.email}:`, err?.message || err);
    return {
      success: false,
      error: err?.message || 'SMTP delivery failed',
      emailText: text,
      emailHtml: html,
      recipient: params.email
    };
  }
}
