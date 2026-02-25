const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fetch = require('node-fetch');

admin.initializeApp();

const db = admin.firestore();

/**
 * Firestore Trigger: عند إضافة طلب جديد
 * - فك تشفير الطلب
 * - جلب مفتاح API المشفر
 * - فك تشفير مفتاح API
 * - إرسال الطلب إلى Pollinations.ai
 * - تشفير الرد
 * - حفظ الرد المشفر
 */
exports.handleEncryptedRequest = functions.firestore
  .document('users/{userId}/requests/{requestId}')
  .onCreate(async (snap, context) => {
    const { userId, requestId } = context.params;
    const requestData = snap.data();

    console.log(`📨 طلب جديد من المستخدم: ${userId}`);

    try {
      // 1. جلب مفتاح التشفير من متغيرات البيئة
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('مفتاح التشفير غير موجود');
      }

      // 2. فك تشفير الطلب
      const decryptedMessage = decryptAES(
        requestData.encryptedMessage,
        encryptionKey
      );

      if (!decryptedMessage) {
        throw new Error('فشل فك تشفير الرسالة');
      }

      console.log(`✅ تم فك تشفير الرسالة`);

      // 3. جلب مفتاح API المشفر
      const apiKeysSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('apiKeys')
        .limit(1)
        .get();

      if (apiKeysSnapshot.empty) {
        throw new Error('لم يتم العثور على مفتاح API');
      }

      const apiKeyDoc = apiKeysSnapshot.docs[0];
      const apiKeyData = apiKeyDoc.data();

      // 4. فك تشفير مفتاح API
      const decryptedApiKey = decryptAES(
        apiKeyData.encryptedKey,
        encryptionKey
      );

      if (!decryptedApiKey) {
        throw new Error('فشل فك تشفير مفتاح API');
      }

      console.log(`🔑 تم فك تشفير مفتاح API`);

      // 5. إرسال الطلب إلى Pollinations.ai
      const response = await fetch('https://api.pollinations.ai/openai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decryptedApiKey}`
        },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            {
              role: 'user',
              content: decryptedMessage
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`خطأ من Pollinations.ai: ${response.status}`);
      }

      const responseData = await response.json();
      const aiResponse = responseData.choices?.[0]?.message?.content || 'لا رد';

      console.log(`🤖 تم الحصول على الرد من Pollinations.ai`);

      // 6. تشفير الرد
      const encryptedResponse = encryptAES(aiResponse, encryptionKey);

      // 7. حفظ الرد المشفر
      await db
        .collection('users')
        .doc(userId)
        .collection('responses')
        .doc(requestId)
        .set({
          encryptedResponse: encryptedResponse,
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

      console.log(`✅ تم حفظ الرد المشفر`);

      // 8. تحديث حالة الطلب
      await db
        .collection('users')
        .doc(userId)
        .collection('requests')
        .doc(requestId)
        .update({
          status: 'completed'
        });

    } catch (error) {
      console.error(`❌ خطأ: ${error.message}`);

      try {
        // حفظ رسالة الخطأ المشفرة
        const encryptionKey = process.env.ENCRYPTION_KEY;
        const encryptedError = encryptAES(
          `خطأ: ${error.message}`,
          encryptionKey
        );

        await db
          .collection('users')
          .doc(userId)
          .collection('responses')
          .doc(requestId)
          .set({
            encryptedResponse: encryptedError,
            status: 'error',
            error: error.message,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

        await db
          .collection('users')
          .doc(userId)
          .collection('requests')
          .doc(requestId)
          .update({
            status: 'error',
            error: error.message
          });
      } catch (saveError) {
        console.error('فشل حفظ رسالة الخطأ:', saveError);
      }
    }
  });

/**
 * دالة تشفير AES-256
 */
function encryptAES(plaintext, key) {
  try {
    // تحويل المفتاح إلى Buffer
    const keyBuffer = Buffer.from(key, 'utf-8');
    const keyHash = crypto.createHash('sha256').update(keyBuffer).digest();

    // إنشاء IV عشوائي
    const iv = crypto.randomBytes(16);

    // إنشاء cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);

    // تشفير النص
    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // دمج IV مع النص المشفر
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('خطأ في التشفير:', error);
    return null;
  }
}

/**
 * دالة فك تشفير AES-256
 */
function decryptAES(ciphertext, key) {
  try {
    // تحويل المفتاح إلى Buffer
    const keyBuffer = Buffer.from(key, 'utf-8');
    const keyHash = crypto.createHash('sha256').update(keyBuffer).digest();

    // فصل IV عن النص المشفر
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // إنشاء decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);

    // فك التشفير
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  } catch (error) {
    console.error('خطأ في فك التشفير:', error);
    return null;
  }
}
