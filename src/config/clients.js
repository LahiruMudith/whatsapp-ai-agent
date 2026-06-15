const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

module.exports = {
    openai,
    supabase
};
