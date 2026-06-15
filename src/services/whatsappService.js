const { env } = require('../config/env');

async function sendWhatsAppTextMessage(to, message) {
    if (!env.WHATSAPP_TOKEN || !env.PHONE_NUMBER_ID) {
        throw new Error('Missing WhatsApp credentials in environment variables.');
    }

    await fetch(`https://graph.facebook.com/v20.0/${env.PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message }
        })
    });
}

module.exports = {
    sendWhatsAppTextMessage
};
