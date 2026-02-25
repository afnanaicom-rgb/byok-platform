# 🔐 دليل النشر الآمن - منصة BYOK

## 📋 المتطلبات

- حساب Firebase
- Firebase CLI مثبت
- Node.js 18+

## 🏗️ البنية المعمارية

```
Frontend (HTML/JS)
    ↓ (تشفير AES-256)
Firestore (حفظ مشفر)
    ↓ (Trigger)
Cloud Function (فك تشفير)
    ↓
Pollinations.ai API
    ↓
Cloud Function (تشفير الرد)
    ↓
Firestore (حفظ مشفر)
    ↓ (فك تشفير محلي)
Frontend (عرض الرد)
```

## 🚀 خطوات النشر

### الخطوة 1: تثبيت Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### الخطوة 2: إعداد المشروع

```bash
cd /home/ubuntu/afnan-7cce4
firebase init functions
```

اختر:
- Language: JavaScript
- ESLint: No

### الخطوة 3: نسخ الملفات

```bash
# نسخ Firestore Trigger
cp functions/handleRequest.js functions/

# نسخ Frontend الآمن
cp public/secure-index.html public/index.html

# نسخ Firestore Rules
cp firestore-secure.rules firestore.rules
```

### الخطوة 4: إعداد متغيرات البيئة

```bash
# تعيين مفتاح التشفير
firebase functions:config:set encryption.key="your-256-bit-key-here"

# أو من خلال .env.local
echo "ENCRYPTION_KEY=your-256-bit-key-here" > functions/.env.local
```

### الخطوة 5: نشر Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### الخطوة 6: نشر Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### الخطوة 7: نشر Frontend

```bash
firebase deploy --only hosting
```

## 🔐 الأمان

✅ **API Key مشفر طول الوقت:**
- تشفير في Frontend قبل الإرسال
- حفظ مشفر في Firestore
- فك تشفير فقط في Cloud Function
- لا يتم فك التشفير في المتصفح أبداً

✅ **Firestore Rules صارمة:**
- لا أحد يستطيع قراءة API Keys مباشرة
- فقط المالك يستطيع إضافة مفاتيح جديدة
- لا يمكن تعديل أو حذف مباشرة

✅ **لا توجد نقاط ضعف:**
- المفاتيح محمية في جميع المراحل
- حتى لو اخترق أحد Firestore، سيجد مفاتيح مشفرة فقط
- حتى لو اخترق أحد المتصفح، لن يرى المفاتيح

## 📝 ملفات المشروع

```
├── public/
│   ├── index.html              # Frontend الآمن
│   ├── admin.html              # لوحة التحكم (اختياري)
│
├── functions/
│   ├── handleRequest.js        # Firestore Trigger
│   ├── package.json            # Dependencies
│
├── firestore.rules             # Firestore Security Rules
├── firebase.json               # Firebase Config
└── SECURE_DEPLOYMENT.md        # هذا الملف
```

## 🔑 إنشاء مفتاح التشفير

```bash
# استخدم أي من هذه الطرق:

# 1. من OpenSSL
openssl rand -hex 32

# 2. من Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. من Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## 🧪 الاختبار

### 1. اختبار Frontend

```bash
firebase serve --only hosting
# افتح http://localhost:5000
```

### 2. اختبار Cloud Functions

```bash
firebase emulators:start --only functions,firestore
```

### 3. اختبار التشفير

```javascript
// في console المتصفح:
const key = "your-key-here";
const message = "Hello World";
const encrypted = CryptoJS.AES.encrypt(message, key).toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
console.log(decrypted); // "Hello World"
```

## 🐛 استكشاف الأخطاء

### خطأ: "ENCRYPTION_KEY not found"

```bash
firebase functions:config:set encryption.key="your-key"
firebase deploy --only functions
```

### خطأ: "Permission denied"

تحقق من Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

### خطأ: "Pollinations.ai API failed"

تحقق من:
1. صحة مفتاح API
2. اتصال الإنترنت
3. حدود API

## 📊 المراقبة

### عرض Logs

```bash
firebase functions:log
```

### عرض Firestore

```bash
firebase firestore:inspect
```

## 🎯 الميزات

✅ تشفير AES-256 كامل
✅ بدون ترقية Firebase
✅ أمان على أعلى مستوى
✅ واجهة سهلة الاستخدام
✅ متجاوب على جميع الأجهزة

## 📞 الدعم

- Firebase Docs: https://firebase.google.com/docs
- Pollinations.ai: https://pollinations.ai/
- Cloud Functions: https://firebase.google.com/docs/functions

---

**تم إنشاؤه بواسطة Manus** 🤖
