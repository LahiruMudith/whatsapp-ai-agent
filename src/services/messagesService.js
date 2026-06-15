const { supabase } = require('../config/clients');
const { hasSupabaseConfigured } = require('../config/env');

async function saveMessage(phoneNumber, messageText, senderType) {
    if (!hasSupabaseConfigured()) {
        return;
    }

    const { error } = await supabase.from('messages').insert([
        {
            phone_number: phoneNumber,
            message_text: messageText,
            sender_type: senderType
        }
    ]);

    if (error) {
        console.error(`Supabase insert error (${senderType}):`, error);
        return;
    }

    console.log(`${senderType} message saved to Supabase.`);
}

module.exports = {
    saveMessage
};
