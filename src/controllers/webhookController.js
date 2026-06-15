const { env } = require('../config/env');
const { getSession, resetSession } = require('../state/userSessions');
const { saveMessage } = require('../services/messagesService');
const { generateGeminiReply } = require('../services/geminiService');
const { sendWhatsAppTextMessage } = require('../services/whatsappService');
const { generateOrderId, generatePayHereLink } = require('../services/payhereService');

function verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && token === env.VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(404);
}

async function receiveWebhook(req, res) {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
        return res.sendStatus(404);
    }

    for (const entry of body.entry || []) {
        const value = entry?.changes?.[0]?.value;
        const message = value?.messages?.[0];
        const from = message?.from;
        const msgBody = message?.text?.body;

        if (!from || !msgBody) {
            continue;
        }

        console.log(`User says: "${msgBody}"`);

        try {
            await saveMessage(from, msgBody, 'user');

            const session = getSession(from);
            const lowered = msgBody.toLowerCase();
            let finalReply = '';

            if (lowered === 'order') {
                session.state = 'ordering';
                finalReply = 'Great! What would you like to order from our catalog?';
            } else if (session.state === 'ordering') {
                session.orderData = msgBody;
                session.state = 'confirming';
                finalReply = `You want to order: "${msgBody}". Reply "yes" to confirm or "no" to cancel.`;
            } else if (session.state === 'confirming') {
                if (lowered === 'yes') {
                    const orderId = generateOrderId();
                    const orderAmount = 2500;
                    const itemName = session.orderData;
                    const checkoutUrl = generatePayHereLink(orderId, orderAmount, itemName, from);

                    finalReply = `🎉 Order confirmed! (Order ID: ${orderId})\n\nTotal: LKR ${orderAmount}.00\nItem: ${itemName}\n\nClick this secure PayHere Sandbox link to complete your payment: ${checkoutUrl}`;
                    resetSession(from);
                } else {
                    finalReply = 'Order cancelled. Let me know if you want to try again!';
                    resetSession(from);
                }
            } else {
                finalReply = await generateGeminiReply(msgBody);
            }

            console.log(`Bot replies: "${finalReply}"`);

            await sendWhatsAppTextMessage(from, finalReply);
            await saveMessage(from, finalReply, 'bot');
        } catch (error) {
            console.error('Error processing request:', error);
        }
    }

    return res.status(200).send('EVENT_RECEIVED');
}

module.exports = {
    verifyWebhook,
    receiveWebhook
};
