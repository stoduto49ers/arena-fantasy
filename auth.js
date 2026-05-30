// =============================================
// ARENA FANTASY - Autenticação
// =============================================

const Auth = {

    // Verifica se há sessão ativa ao carregar a página
    async init() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            await Auth.onLoginSuccess(session.user);
        } else {
            Auth.showAuthScreen();
        }

        // Escuta mudanças de sessão (login/logout)
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await Auth.onLoginSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                Auth.showAuthScreen();
            }
        });
    },

    // Chamado após login bem-sucedido
    async onLoginSuccess(user) {
        // Garante que o perfil do manager existe no banco
        await Auth.ensureManagerProfile(user);
        Auth.hideAuthScreen();
        // Inicializa o app principal
        if (typeof initApp === 'function') initApp(user);
        // Inicializa o dashboard
        if (typeof Dashboard !== 'undefined') Dashboard.init(user);
        // Inicializa o draft
        if (typeof Draft !== 'undefined') Draft.init(user);

        // Reinicializa o draft ao clicar na aba
        document.querySelectorAll('.nav-item[data-tab="draft-tab"]').forEach(el => {
            el.addEventListener('click', () => {
                if (typeof Draft !== 'undefined') Draft.init(user);
            });
        });

        // Reinicializa o dashboard ao clicar na aba
        document.querySelectorAll('.nav-item[data-tab="dashboard-tab"]').forEach(el => {
            el.addEventListener('click', () => {
                if (typeof Dashboard !== 'undefined') Dashboard.init(user);
            });
        });

        // Inicializa config da liga ao clicar na aba
        document.querySelectorAll('.nav-item[data-tab="config-tab"]').forEach(el => {
            el.addEventListener('click', () => {
                if (typeof LeagueConfig !== 'undefined') LeagueConfig.init(user);
            });
        });

        // Inicializa waiver ao clicar na aba de mercado
        document.querySelectorAll('.nav-item[data-tab="market-tab"]').forEach(el => {
            el.addEventListener('click', () => {
                if (typeof Waiver !== 'undefined') Waiver.init(user);
            });
        });

        // Inicializa trocas ao clicar na aba
        document.querySelectorAll('.nav-item[data-tab="trades-tab"]').forEach(el => {
            el.addEventListener('click', () => {
                if (typeof Trades !== 'undefined') Trades.init(user);
            });
        });
    },

    // Cria o perfil do manager no banco se for a primeira vez
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

    // Cadastro com email + senha + nome do time
    async signUp(email, password, teamName) {
        Auth.setLoading(true);
        Auth.clearError();

        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { team_name: teamName }
            }
        });

        if (error) {
            Auth.showError(Auth.translateError(error.message));
        } else {
            Auth.showSuccess('Cadastro realizado! Verifique seu email para confirmar a conta.');
        }
        Auth.setLoading(false);
    },

    // Login com email + senha
    async signIn(email, password) {
        Auth.setLoading(true);
        Auth.clearError();

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            Auth.showError(Auth.translateError(error.message));
        }
        Auth.setLoading(false);
    },

    // Logout
    async signOut() {
        await window.supabaseClient.auth.signOut();
    },

    // --- UI Helpers ---
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

    // Traduz erros do Supabase para português
    translateError(msg) {
        if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
        if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
        if (msg.includes('User already registered')) return 'Este email já possui cadastro.';
        if (msg.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
        if (msg.includes('Unable to validate email')) return 'Email inválido.';
        return 'Erro inesperado. Tente novamente.';
    }
};

// --- Setup dos eventos da tela de login ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    const modeToggle = document.querySelectorAll('input[name="auth-mode"]');
    const teamNameGroup = document.getElementById('team-name-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Alterna entre login e cadastro
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

    // Submit do formulário
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

    // Botão de logout (dentro do app)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.signOut());
    }

    // Inicializa autenticação
    Auth.init();
});
