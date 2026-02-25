# 🚀 دليل النشر على Vercel

## ✅ المتطلبات

- حساب Vercel (مجاني) - https://vercel.com
- Git مثبت على الجهاز
- Node.js مثبت على الجهاز

## 📋 خطوات النشر

### الخطوة 1: إنشاء حساب Vercel

1. اذهب إلى https://vercel.com
2. اضغط على "Sign Up"
3. سجل دخول عبر GitHub (الأسهل)

### الخطوة 2: نشر المشروع

#### الطريقة الأولى: من GitHub (الأسهل)

```bash
# 1. ادفع المشروع إلى GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. في لوحة تحكم Vercel:
# - اضغط "New Project"
# - اختر المستودع من GitHub
# - اضغط "Import"
# - سيتم النشر تلقائياً
```

#### الطريقة الثانية: من سطر الأوامر

```bash
# 1. تثبيت Vercel CLI
npm i -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
cd /home/ubuntu/afnan-7cce4
vercel deploy --prod
```

### الخطوة 3: إعداد متغيرات البيئة

في لوحة تحكم Vercel:

1. اذهب إلى Project Settings
2. اختر "Environment Variables"
3. أضف المتغيرات التالية:

```
ENCRYPTION_KEY=your-256-bit-encryption-key-here
FIREBASE_API_KEY=AIzaSyB3kmW2u1a_kh0L2nIODG7LzmoCE396_UQ
FIREBASE_PROJECT_ID=afnan-7cce4
```

**ملاحظة:** المفتاح يجب أن يكون 32 حرف على الأقل

### الخطوة 4: التحقق من النشر

بعد النشر، ستحصل على رابط مثل:
```
https://your-project-name.vercel.app
```

## 🔗 الروابط بعد النشر

- **Frontend:** `https://your-project-name.vercel.app/`
- **Admin Panel:** `https://your-project-name.vercel.app/admin.html`
- **API Endpoint:** `https://your-project-name.vercel.app/api/saveApiKey`

## 🔐 الأمان

✅ API Keys مشفرة بـ AES-256
✅ التشفير يتم على الخادم فقط
✅ بدون ترقية Firebase
✅ مجاني تماماً

## 📝 هيكل المشروع

```
├── api/
│   └── saveApiKey.js          # Vercel Function
├── public/
│   ├── index.html             # Frontend
│   └── admin.html             # Admin Panel
├── vercel.json                # Vercel Config
└── DEPLOYMENT.md              # هذا الملف
```

## 🐛 استكشاف الأخطاء

### خطأ: "Build failed"
- تأكد من أن جميع الملفات موجودة
- تحقق من صحة JSON في vercel.json

### خطأ: "API request failed"
- تحقق من متغيرات البيئة
- تأكد من أن ENCRYPTION_KEY صحيح

### خطأ: "Firebase initialization failed"
- تحقق من بيانات Firebase
- تأكد من أن المشروع مفعل

## 📞 الدعم

للمزيد من المساعدة:
- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Pollinations.ai: https://pollinations.ai/

## ✨ الميزات

✅ تسجيل دخول GitHub
✅ إدارة API Keys الآمنة
✅ دردشة فورية مع Pollinations.ai
✅ اختيار النماذج المتاحة
✅ لوحة تحكم Admin
✅ تصميم احترافي
✅ متجاوب على جميع الأجهزة

---

**تم إنشاؤه بواسطة Manus** 🤖
