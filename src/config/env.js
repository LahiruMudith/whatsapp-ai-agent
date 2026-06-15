require('dotenv').config();

const env = {
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
    APP_BASE_URL: process.env.APP_BASE_URL || 'https://your-project-name.vercel.app',
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development'
};

function hasSupabaseConfigured() {
    return env.SUPABASE_URL && env.SUPABASE_URL !== 'https://placeholder-url.supabase.co';
}

module.exports = {
    env,
    hasSupabaseConfigured
};
