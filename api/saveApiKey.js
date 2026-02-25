import crypto from 'crypto';

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

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { action, apiKey, userId } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        // ===== SAVE API KEY =====
        if (action === 'save') {
            if (!apiKey || !userId) {
                return res.status(400).json({ error: 'API key and user ID are required' });
            }

            const encryptedKey = encryptApiKey(apiKey);
            
            // Here you would save to your database
            // For now, we'll return the encrypted key
            return res.status(200).json({
                success: true,
                message: 'API key saved securely',
                encryptedKey: encryptedKey
            });
        }

        // ===== DECRYPT API KEY (for backend use only) =====
        if (action === 'decrypt') {
            if (!apiKey) {
                return res.status(400).json({ error: 'Encrypted API key is required' });
            }

            const decryptedKey = decryptApiKey(apiKey);
            return res.status(200).json({
                success: true,
                apiKey: decryptedKey
            });
        }

        // ===== SEND MESSAGE TO POLLINATIONS.AI =====
        if (action === 'sendMessage') {
            const { message, model, encryptedApiKey, messages } = req.body;

            if (!message || !model || !encryptedApiKey) {
                return res.status(400).json({ error: 'Message, model, and encrypted API key are required' });
            }

            try {
                // Decrypt the API key
                const apiKey = decryptApiKey(encryptedApiKey);

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

                return res.status(200).json({
                    success: true,
                    response: aiResponse
                });
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).json({ error: error.message || 'Failed to send message' });
            }
        }

        // ===== GET AVAILABLE MODELS =====
        if (action === 'getModels') {
            const { encryptedApiKey } = req.body;

            if (!encryptedApiKey) {
                return res.status(400).json({ error: 'Encrypted API key is required' });
            }

            try {
                const apiKey = decryptApiKey(encryptedApiKey);

                const response = await fetch('https://api.pollinations.ai/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch models');
                }

                const models = await response.json();

                return res.status(200).json({
                    success: true,
                    models: models
                });
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).json({ error: error.message || 'Failed to fetch models' });
            }
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
