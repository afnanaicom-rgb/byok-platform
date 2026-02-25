# منصة BYOK - Vercel Deployment Guide

## 📋 المتطلبات

- حساب Vercel (مجاني)
- حساب Firebase
- مفتاح API من Pollinations.ai

## 🚀 خطوات النشر

### 1. نسخ المشروع إلى Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# نشر المشروع
vercel deploy
```

### 2. إعداد متغيرات البيئة

في لوحة تحكم Vercel:

1. اذهب إلى Project Settings
2. اختر Environment Variables
3. أضف المتغيرات التالية:

```
ENCRYPTION_KEY=your-256-bit-key-here
```

**ملاحظة:** المفتاح يجب أن يكون 32 حرف على الأقل

### 3. نشر Firebase Hosting (اختياري)

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# نشر
firebase deploy --only hosting
```

## 📁 هيكل المشروع

```
├── api/
│   └── saveApiKey.js          # Vercel Function
├── public/
│   └── index.html             # Frontend
├── vercel.json                # Vercel Config
└── README_VERCEL.md           # هذا الملف
```

## 🔐 الأمان

- API Keys مشفرة بـ AES-256
- التشفير يتم على الخادم فقط
- لا يتم تخزين المفاتيح بصيغة نصية

## 🌐 الروابط

- **Frontend:** `https://your-project.vercel.app/`
- **API:** `https://your-project.vercel.app/api/saveApiKey`

## 📝 الاستخدام

1. افتح الـ Frontend
2. سجل دخول عبر GitHub
3. أضف مفتاح API من Pollinations.ai
4. اختر النموذج
5. ابدأ المحادثة

## 🐛 استكشاف الأخطاء

### خطأ: "API request failed"
- تحقق من صحة مفتاح API
- تأكد من أن الإنترنت يعمل

### خطأ: "Failed to decrypt API key"
- تأكد من أن ENCRYPTION_KEY صحيح
- تأكد من أن المفتاح 32 حرف على الأقل

## 📞 الدعم

للمزيد من المساعدة، تواصل مع فريق Vercel أو Firebase.
