const { env } = require('../config/env');

function generateOrderId() {
    return `ORD${Math.floor(100000 + Math.random() * 900000)}`;
}

function generatePayHereLink(orderId, amount, itemName, customerPhone) {
    return `${env.APP_BASE_URL}/pay?order_id=${orderId}&amount=${amount}&item=${encodeURIComponent(itemName)}&phone=${encodeURIComponent(customerPhone)}`;
}

module.exports = {
    generateOrderId,
    generatePayHereLink
};
