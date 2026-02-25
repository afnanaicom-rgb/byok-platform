const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

// ===== ENCRYPTION CONFIGURATION =====
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-key-must-be-32-chars';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is exactly 32 bytes
const getEncryptionKey = () => {
    const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
    return Buffer.from(key);
};

// ===== ENCRYPTION FUNCTIONS =====
const encryptApiKey = (apiKey) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
        
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Return IV + encrypted data
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt API key');
    }
};

const decryptApiKey = (encryptedData) => {
    try {
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt API key');
    }
};

// ===== SAVE API KEY =====
exports.saveApiKey = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { apiKey } = data;

    if (!apiKey || typeof apiKey !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'API key must be a non-empty string');
    }

    try {
        // Encrypt the API key
        const encryptedKey = encryptApiKey(apiKey);

        // Save to Firestore with restricted access
        await db.collection('users').doc(userId).collection('apiKeys').doc('primary').set({
            encryptedKey: encryptedKey,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Metadata (not sensitive)
            keyPreview: apiKey.slice(-4), // Last 4 chars for preview
            status: 'active'
        });

        return {
            success: true,
            message: 'API key saved securely'
        };
    } catch (error) {
        console.error('Error saving API key:', error);
        throw new functions.https.HttpsError('internal', 'Failed to save API key');
    }
});

// ===== GET API KEY (for user's own use) =====
exports.getApiKey = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
        const doc = await db.collection('users').doc(userId).collection('apiKeys').doc('primary').get();

        if (!doc.exists) {
            throw new functions.https.HttpsError('not-found', 'API key not found');
        }

        const data = doc.data();
        const decryptedKey = decryptApiKey(data.encryptedKey);

        return {
            apiKey: decryptedKey,
            status: data.status
        };
    } catch (error) {
        console.error('Error retrieving API key:', error);
        throw new functions.https.HttpsError('internal', 'Failed to retrieve API key');
    }
});

// ===== SEND MESSAGE (uses stored API key) =====
exports.sendMessage = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { message, model, messages } = data;

    if (!message || !model) {
        throw new functions.https.HttpsError('invalid-argument', 'Message and model are required');
    }

    try {
        // Get user's API key
        const apiKeyDoc = await db.collection('users').doc(userId).collection('apiKeys').doc('primary').get();

        if (!apiKeyDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'API key not configured');
        }

        const encryptedKey = apiKeyDoc.data().encryptedKey;
        const apiKey = decryptApiKey(encryptedKey);

        // Call Pollinations.ai API
        const response = await fetch('https://api.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages || [{ role: 'user', content: message }],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const result = await response.json();
        const aiResponse = result.choices[0].message.content;

        // Save message to Firestore
        await db.collection('users').doc(userId).collection('messages').add({
            role: 'user',
            content: message,
            model: model,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('users').doc(userId).collection('messages').add({
            role: 'assistant',
            content: aiResponse,
            model: model,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            response: aiResponse
        };
    } catch (error) {
        console.error('Error sending message:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to send message');
    }
});

// ===== ADMIN: GET ALL USER API KEYS =====
exports.adminGetAllApiKeys = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        // Check if user is admin (you can set custom claims)
        const customClaims = context.auth.token;
        if (!customClaims.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can access this');
        }

        // Get all users
        const usersSnapshot = await db.collection('users').get();
        const allApiKeys = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const apiKeyDoc = await db.collection('users').doc(userId).collection('apiKeys').doc('primary').get();

            if (apiKeyDoc.exists) {
                const data = apiKeyDoc.data();
                const decryptedKey = decryptApiKey(data.encryptedKey);

                allApiKeys.push({
                    userId: userId,
                    userName: userDoc.data().displayName || 'Unknown',
                    email: userDoc.data().email || 'Unknown',
                    apiKey: decryptedKey,
                    keyPreview: data.keyPreview,
                    status: data.status,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate()
                });
            }
        }

        return {
            success: true,
            count: allApiKeys.length,
            apiKeys: allApiKeys
        };
    } catch (error) {
        console.error('Error retrieving API keys:', error);
        throw new functions.https.HttpsError('internal', 'Failed to retrieve API keys');
    }
});

// ===== ADMIN: DELETE USER API KEY =====
exports.adminDeleteApiKey = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        // Check if user is admin
        const customClaims = context.auth.token;
        if (!customClaims.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can access this');
        }

        const { userId } = data;

        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }

        // Delete API key
        await db.collection('users').doc(userId).collection('apiKeys').doc('primary').delete();

        return {
            success: true,
            message: 'API key deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting API key:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete API key');
    }
});

// ===== GET AVAILABLE MODELS =====
exports.getAvailableModels = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
        // Get user's API key
        const apiKeyDoc = await db.collection('users').doc(userId).collection('apiKeys').doc('primary').get();

        if (!apiKeyDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'API key not configured');
        }

        const encryptedKey = apiKeyDoc.data().encryptedKey;
        const apiKey = decryptApiKey(encryptedKey);

        // Call Pollinations.ai to get models
        const response = await fetch('https://api.pollinations.ai/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }

        const models = await response.json();

        return {
            success: true,
            models: models
        };
    } catch (error) {
        console.error('Error fetching models:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch models');
    }
});
