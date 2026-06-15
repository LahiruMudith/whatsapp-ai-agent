const app = require('./app');
const { env, hasSupabaseConfigured } = require('./config/env');

console.log('--- Database Config ---');
console.log('Supabase URL:', env.SUPABASE_URL);
console.log('Supabase Anon Key:', hasSupabaseConfigured() ? 'Loaded (hidden for security)' : 'Not Found');
console.log('-----------------------');

if (env.NODE_ENV !== 'production') {
    app.listen(env.PORT, () => {
        console.log(`Server is listening on port ${env.PORT}`);
    });
}

module.exports = app;
