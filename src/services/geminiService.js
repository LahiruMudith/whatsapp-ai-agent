const { env } = require('../config/env');

async function generateGeminiReply(msgBody) {
    if (!env.GEMINI_API_KEY) {
        return 'I can help with orders. Type "order" to begin.';
    }

    const systemPrompt = `You are a helpful assistant. Keep it short. User says: ${msgBody}`;

    const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        }
    );

    if (!geminiResponse.ok) {
        return 'I could not process that just now. Please try again.';
    }

    const data = await geminiResponse.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not understand that. Please try again.';
}

module.exports = {
    generateGeminiReply
};
