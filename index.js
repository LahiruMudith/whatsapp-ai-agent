require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
app.use(bodyParser.json());

// Set your own secret token here
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PORT = process.env.PORT || 3000;

const userSessions = {};

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Default Endpoint
app.get('/', (req, res) => {
    res.status(200).send('WhatsApp Webhook Server is running!');
});

// Verification Endpoint (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(404);
    }
});

// Message Handling Endpoint (POST)
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
            const changes = entry.changes[0];
            const value = changes.value;
            
            if (value.messages && value.messages[0]) {
                const from = value.messages[0].from; 
                const msgBody = value.messages[0].text.body;

                console.log(`User says: "${msgBody}"`);

                try {
                    // 1. Initialize session for new users
                    if (!userSessions[from]) {
                        userSessions[from] = { state: 'idle', orderData: null };
                    }
                    const session = userSessions[from];

                    let finalReply = "";

                    // 2. State Machine Logic
                    if (msgBody.toLowerCase() === "order") {
                        // Switch state to ordering
                        session.state = 'ordering';
                        finalReply = "Great! What would you like to order from our catalog?";
                        
                    } else if (session.state === 'ordering') {
                        // The user is currently in the ordering flow
                        session.orderData = msgBody; // Save what they typed as their order
                        session.state = 'confirming'; // Move to next state
                        finalReply = `You want to order: "${msgBody}". Reply "yes" to confirm or "no" to cancel.`;

                    } else if (session.state === 'confirming') {
                        if (msgBody.toLowerCase() === 'yes') {
                            const orderId = "ORD" + Math.floor(100000 + Math.random() * 900000); // Generate a random order ID
                            const orderAmount = 2500; // Hardcoded example price (e.g., 2500 LKR)
                            const itemName = session.orderData; // What they typed in the previous step
                            
                            // Generate the PayHere sandbox checkout link
                            const checkoutUrl = generatePayHereLink(orderId, orderAmount, itemName, from);
                            
                            finalReply = `🎉 Order confirmed! (Order ID: ${orderId})\n\nTotal: LKR ${orderAmount}.00\nItem: ${itemName}\n\nClick this secure PayHere Sandbox link to complete your payment: ${checkoutUrl}`;
                            
                            session.state = 'idle'; // Reset state after generating link
                            session.orderData = null;
                        } else {
                            finalReply = "Order cancelled. Let me know if you want to try again!";
                            session.state = 'idle'; 
                            session.orderData = null;
                        }

                    } else {
                        // 3. Fallback to Gemini if state is 'idle'
                        const systemPrompt = `You are a helpful assistant. Keep it short. User says: ${msgBody}`;
                        const geminiResponse = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
                            }
                        );
                        const data = await geminiResponse.json();
                        finalReply = data.candidates[0].content.parts[0].text;
                    }

                    console.log(`Bot replies: "${finalReply}"`);

                    // 4. Send the final response (from either the state machine or Gemini) back via WhatsApp
                    await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messaging_product: "whatsapp",
                            to: from,
                            type: "text",
                            text: { body: finalReply }
                        })
                    });

                } catch (error) {
                    console.error('Error processing request:', error);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

//open ai response
// app.get('/webhook', (req, res) => {
//     const mode = req.query['hub.mode'];
//     const token = req.query['hub.verify_token'];
//     const challenge = req.query['hub.challenge'];

//     if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
//         res.status(200).send(challenge);
//     } else {
//         res.sendStatus(403);
//     }
// });

// app.post('/webhook', async (req, res) => {
//     const body = req.body;

//     if (body.object === 'whatsapp_business_account') {
//         for (const entry of body.entry) {
//             const changes = entry.changes[0];
//             const value = changes.value;
            
//             if (value.messages && value.messages[0]) {
//                 const from = value.messages[0].from; 
//                 const msgBody = value.messages[0].text.body;

//                 console.log(`User says: "${msgBody}"`);

//                 try {
//                     // 1. Send the user's message to OpenAI
//                     const completion = await openai.chat.completions.create({
//                         model: "gpt-5.5",
//                         messages: [
//                             { 
//                                 role: "system", 
//                                 content: "You are a helpful assistant. Keep your responses short, concise, and clear so they look good on a WhatsApp chat screen." 
//                             },
//                             { role: "user", content: msgBody }
//                         ],
//                     });

//                     const aiResponse = completion.choices[0].message.content;
//                     console.log(`AI replies: "${aiResponse}"`);

//                     // 2. Send the AI response back via WhatsApp (using type: "text" instead of "template")
//                     await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
//                         method: 'POST',
//                         headers: {
//                             'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
//                             'Content-Type': 'application/json'
//                         },
//                         body: JSON.stringify({
//                             messaging_product: "whatsapp",
//                             to: from,
//                             type: "text", // Changed from template to custom text
//                             text: {
//                                 body: aiResponse
//                             }
//                         })
//                     });

//                     console.log('Response sent to user!');
//                 } catch (error) {
//                     console.error('Error processing AI or WhatsApp request:', error);
                    
//                     // Fallback: Notify the user on WhatsApp if something breaks
//                     try {
//                         await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
//                             method: 'POST',
//                             headers: {
//                                 'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
//                                 'Content-Type': 'application/json'
//                             },
//                             body: JSON.stringify({
//                                 messaging_product: "whatsapp",
//                                 to: from,
//                                 type: "text",
//                                 text: {
//                                     body: "🤖 Undergoing quick maintenance! Please try messaging me again in a moment."
//                                 }
//                             })
//                         });
//                     } catch (whatsappError) {
//                         console.error('Failed to send fallback message:', whatsappError);
//                     }
//                 }
//             }
//         }
//         res.status(200).send('EVENT_RECEIVED');
//     } else {
//         res.sendStatus(404);
//     }
// });

    // PayHere Sandbox Helper Function

// function generatePayHereLink(orderId, amount, itemName, customerPhone) {
//     // Replace this with your current active ngrok URL!
//     const yourNgrokUrl = "https://2dec-112-134-149-84.ngrok-free.app";
//
//     // Create a link to your Node.js server bridge
//     const payLink = `${yourNgrokUrl}/pay?order_id=${orderId}&amount=${amount}&item=${encodeURIComponent(itemName)}&phone=${encodeURIComponent(customerPhone)}`;
//
//     return payLink;
// }
//
// // The Web Checkout Bridge
// app.get('/pay', (req, res) => {
//     // Extract the data passed from the WhatsApp link
//     const { order_id, amount, item, phone } = req.query;
//
//     // Your PayHere Merchant ID
//     const merchantId = "1232161";
//
//     // An HTML page that automatically submits a POST request to PayHere
//     const html = `
//         <!DOCTYPE html>
//         <html>
//             <head>
//                 <title>Redirecting to Payment...</title>
//             </head>
//             <body onload="document.getElementById('payhere-form').submit();" style="font-family: sans-serif; text-align: center; padding-top: 50px;">
//                 <h2>Redirecting to secure payment portal...</h2>
//                 <p>Please wait.</p>
//
//                 <form id="payhere-form" method="POST" action="https://sandbox.payhere.lk/pay/checkout" style="display: none;">
//                     <input type="hidden" name="merchant_id" value="${merchantId}">
//                     <!-- Required Return URLs -->
//                     <input type="hidden" name="return_url" value="https://sandbox.payhere.lk/">
//                     <input type="hidden" name="cancel_url" value="https://sandbox.payhere.lk/">
//                     <input type="hidden" name="notify_url" value="https://sandbox.payhere.lk/">
//
//                     <!-- Order Details -->
//                     <input type="hidden" name="order_id" value="${order_id}">
//                     <input type="hidden" name="items" value="${item}">
//                     <input type="hidden" name="currency" value="LKR">
//                     <input type="hidden" name="amount" value="${amount}">
//
//                     <!-- Customer Details (PayHere requires these, so we fill defaults for the sandbox) -->
//                     <input type="hidden" name="first_name" value="WhatsApp">
//                     <input type="hidden" name="last_name" value="Customer">
//                     <input type="hidden" name="email" value="test@test.com">
//                     <input type="hidden" name="phone" value="${phone}">
//                     <input type="hidden" name="address" value="No Address">
//                     <input type="hidden" name="city" value="Colombo">
//                     <input type="hidden" name="country" value="Sri Lanka">
//                 </form>
//             </body>
//         </html>
//     `;
//
//     // Send this HTML to the user's browser
//     res.send(html);
// });

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
}

module.exports = app;
