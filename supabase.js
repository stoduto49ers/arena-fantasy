const SUPABASE_URL = 'https://jrfbpxaszojqdxpqdtsx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IHZJXFpqH6r1DaGS5xLY6Q_crkmc3yW';

// O CDN expõe como window.supabase — criamos nosso cliente com nome único
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
