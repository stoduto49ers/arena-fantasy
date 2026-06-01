// =============================================
// ARENA FANTASY - Autenticação
// =============================================

const Auth = {

    async init() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            await Auth.onLoginSuccess(session.user);
        } else {
            Auth.showAuthScreen();
        }

        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await Auth.onLoginSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                Auth.showAuthScreen();
            }
        });
    },

    async onLoginSuccess(user) {
        await Auth.ensureManagerProfile(user);
        Auth.hideAuthScreen();
        // LeagueSystem controla toda a navegação a partir daqui
        if (typeof LeagueSystem !== 'undefined') {
            await LeagueSystem.init(user);
        } else {
            window._currentUser = user;
            if (typeof initApp === 'function') initApp(user);
        }
    },

    async ensureManagerProfile(user) {
        const { data, error } = await window.supabaseClient
            .from('managers')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!data) {
            const teamName = user.user_metadata?.team_name || `Time de ${user.email.split('@')[0]}`;
            await window.supabaseClient.from('managers').insert({
                id: user.id,
                email: user.email,
                team_name: teamName,
                avatar_letter: teamName.charAt(0).toUpperCase(),
                created_at: new Date().toISOString()
            });
        }
    },

    async signUp(email, password, teamName) {
        Auth.setLoading(true);
        Auth.clearError();

        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { team_name: teamName } }
        });

        if (error) {
            Auth.showError(Auth.translateError(error.message));
        } else {
            Auth.showSuccess('Cadastro realizado! Verifique seu email para confirmar a conta.');
        }
        Auth.setLoading(false);
    },

    async signIn(email, password) {
        Auth.setLoading(true);
        Auth.clearError();

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

        if (error) Auth.showError(Auth.translateError(error.message));
        Auth.setLoading(false);
    },

    async signOut() {
        await window.supabaseClient.auth.signOut();
    },

    showAuthScreen() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container-wrapper').style.display = 'none';
    },

    hideAuthScreen() {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container-wrapper').style.display = 'grid';
    },

    setLoading(isLoading) {
        const btn = document.getElementById('auth-submit-btn');
        btn.disabled = isLoading;
        btn.innerHTML = isLoading
            ? '<i class="fa-solid fa-spinner fa-spin"></i> Aguarde...'
            : document.getElementById('auth-mode-login').checked
                ? '<i class="fa-solid fa-right-to-bracket"></i> Entrar'
                : '<i class="fa-solid fa-user-plus"></i> Criar Conta';
    },

    showError(msg) {
        const el = document.getElementById('auth-error-msg');
        el.textContent = msg;
        el.style.display = 'block';
    },

    clearError() {
        const el = document.getElementById('auth-error-msg');
        el.textContent = '';
        el.style.display = 'none';
    },

    showSuccess(msg) {
        const el = document.getElementById('auth-success-msg');
        el.textContent = msg;
        el.style.display = 'block';
    },

    translateError(msg) {
        if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
        if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
        if (msg.includes('User already registered')) return 'Este email já possui cadastro.';
        if (msg.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
        if (msg.includes('Unable to validate email')) return 'Email inválido.';
        return 'Erro inesperado. Tente novamente.';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Form de login/cadastro
    const form = document.getElementById('auth-form');
    const modeToggle = document.querySelectorAll('input[name="auth-mode"]');
    const teamNameGroup = document.getElementById('team-name-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const logoutBtn = document.getElementById('logout-btn');

    modeToggle.forEach(radio => {
        radio.addEventListener('change', () => {
            const isLogin = document.getElementById('auth-mode-login').checked;
            teamNameGroup.style.display = isLogin ? 'none' : 'block';
            submitBtn.innerHTML = isLogin
                ? '<i class="fa-solid fa-right-to-bracket"></i> Entrar'
                : '<i class="fa-solid fa-user-plus"></i> Criar Conta';
            Auth.clearError();
            document.getElementById('auth-success-msg').style.display = 'none';
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const isLogin = document.getElementById('auth-mode-login').checked;

        if (isLogin) {
            await Auth.signIn(email, password);
        } else {
            const teamName = document.getElementById('auth-team-name').value.trim();
            if (!teamName) return Auth.showError('Digite o nome do seu time.');
            await Auth.signUp(email, password, teamName);
        }
    });

    if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.signOut());

    Auth.init();
});
