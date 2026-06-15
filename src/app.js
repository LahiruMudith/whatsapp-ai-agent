const express = require('express');
const bodyParser = require('body-parser');
const { verifyWebhook, receiveWebhook } = require('./controllers/webhookController');
const { renderPayBridge } = require('./controllers/paymentController');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.status(200).send('WhatsApp Webhook Server is running!');
});

app.get('/webhook', verifyWebhook);
app.post('/webhook', receiveWebhook);
app.get('/pay', renderPayBridge);

module.exports = app;
