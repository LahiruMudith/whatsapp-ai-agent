function renderPayBridge(req, res) {
    const { order_id, amount, item, phone } = req.query;
    const merchantId = '1232161';

    const html = `
        <!DOCTYPE html>
        <html>
            <head><title>Redirecting to Payment...</title></head>
            <body onload="document.getElementById('payhere-form').submit();" style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h2>Redirecting to secure payment portal...</h2>
                <p>Please wait.</p>
                <form id="payhere-form" method="POST" action="https://sandbox.payhere.lk/pay/checkout" style="display: none;">
                    <input type="hidden" name="merchant_id" value="${merchantId}">
                    <input type="hidden" name="return_url" value="https://sandbox.payhere.lk/">
                    <input type="hidden" name="cancel_url" value="https://sandbox.payhere.lk/">
                    <input type="hidden" name="notify_url" value="https://sandbox.payhere.lk/">
                    <input type="hidden" name="order_id" value="${order_id}">
                    <input type="hidden" name="items" value="${item}">
                    <input type="hidden" name="currency" value="LKR">
                    <input type="hidden" name="amount" value="${amount}">
                    <input type="hidden" name="first_name" value="WhatsApp">
                    <input type="hidden" name="last_name" value="Customer">
                    <input type="hidden" name="email" value="test@test.com">
                    <input type="hidden" name="phone" value="${phone}">
                    <input type="hidden" name="address" value="No Address">
                    <input type="hidden" name="city" value="Colombo">
                    <input type="hidden" name="country" value="Sri Lanka">
                </form>
            </body>
        </html>
    `;

    res.send(html);
}

module.exports = {
    renderPayBridge
};
