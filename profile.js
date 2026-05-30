// =============================================
// ARENA FANTASY - Perfil do Manager
// =============================================

const Profile = {

    state: { currentUser: null, manager: null, selectedColor: '#00f2fe' },

    async init(user) {
        Profile.state.currentUser = user;
        const { data } = await window.supabaseClient
            .from('managers').select('*').eq('id', user.id).single();
        Profile.state.manager = data;
        Profile.state.selectedColor = data?.avatar_color || '#00f2fe';
        Profile.renderModal();
    },

    renderModal() {
        document.getElementById('profile-modal')?.remove();
        const m = Profile.state.manager;
        const letter = (m?.team_name || '?').charAt(0).toUpperCase();
        const color = Profile.state.selectedColor;

        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-user-pen" style="color:var(--neon-blue);"></i> Meu Perfil</h3>
                    <button class="modal-close-btn" onclick="Profile.close()"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <!-- Avatar -->
                <div style="display:flex; justify-content:center; margin:20px 0;">
                    <div class="profile-avatar-preview" id="avatar-preview" style="background:${color};">
                        ${letter}
                    </div>
                </div>

                <!-- Tabs internas -->
                <div class="profile-tabs">
                    <button class="profile-tab-btn active" onclick="Profile.showTab('info')">Meu Time</button>
                    <button class="profile-tab-btn" onclick="Profile.showTab('password')">Senha</button>
                </div>

                <!-- Tab: Info do Time -->
                <div id="profile-tab-info" class="cfg-form" style="margin-top:16px;">
                    <div class="cfg-field">
                        <label>Nome do Time</label>
                        <div class="auth-input-wrap">
                            <i class="fa-solid fa-shield-halved"></i>
                            <input type="text" id="profile-team-name"
                                value="${m?.team_name || ''}" maxlength="30"
                                oninput="Profile.previewAvatar(this.value)">
                        </div>
                    </div>
                    <div class="cfg-field">
                        <label>Cor do Avatar</label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
                            ${['#00f2fe','#00ff87','#b92bff','#ff9f43','#ff4757','#ffd700','#ff6b9d','#a855f7'].map(c =>
                                `<div class="avatar-color-swatch ${color === c ? 'selected' : ''}"
                                    style="background:${c};" onclick="Profile.selectColor('${c}')"
                                    data-color="${c}"></div>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="cfg-field">
                        <label>Email</label>
                        <div class="auth-input-wrap" style="opacity:0.5;">
                            <i class="fa-solid fa-envelope"></i>
                            <input type="text" value="${m?.email || Profile.state.currentUser?.email || '—'}" disabled>
                        </div>
                    </div>
                    <div class="cfg-field">
                        <label>Saldo de D$</label>
                        <div class="auth-input-wrap" style="opacity:0.5;">
                            <i class="fa-solid fa-coins" style="color:var(--neon-green);"></i>
                            <input type="text" value="D$${m?.budget ?? 1000}" disabled>
                        </div>
                    </div>
                    <div id="profile-msg" class="auth-msg" style="display:none;"></div>
                    <button class="action-btn primary" style="width:100%;justify-content:center;" onclick="Profile.save()">
                        <i class="fa-solid fa-floppy-disk"></i> Salvar Alterações
                    </button>
                </div>

                <!-- Tab: Senha -->
                <div id="profile-tab-password" class="cfg-form" style="display:none; margin-top:16px;">
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">
                        Um link de redefinição será enviado para o seu email.
                    </p>
                    <div id="profile-pwd-msg" class="auth-msg" style="display:none;"></div>
                    <button class="action-btn primary" style="width:100%;justify-content:center;" onclick="Profile.sendPasswordReset()">
                        <i class="fa-solid fa-key"></i> Enviar Link de Redefinição
                    </button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) Profile.close(); });
    },

    showTab(tab) {
        document.getElementById('profile-tab-info').style.display = tab === 'info' ? 'flex' : 'none';
        document.getElementById('profile-tab-password').style.display = tab === 'password' ? 'flex' : 'none';
        document.querySelectorAll('.profile-tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', (i === 0 && tab === 'info') || (i === 1 && tab === 'password'));
        });
    },

    previewAvatar(name) {
        const el = document.getElementById('avatar-preview');
        if (el) el.textContent = (name || '?').charAt(0).toUpperCase();
    },

    selectColor(color) {
        Profile.state.selectedColor = color;
        document.querySelectorAll('.avatar-color-swatch').forEach(s => {
            s.classList.toggle('selected', s.dataset.color === color);
        });
        const el = document.getElementById('avatar-preview');
        if (el) el.style.background = color;
    },

    async save() {
        const teamName = document.getElementById('profile-team-name')?.value?.trim();
        const color = Profile.state.selectedColor;
        const msgEl = document.getElementById('profile-msg');
        if (!teamName) { Profile.showMsg(msgEl, 'Digite o nome do time.', 'error'); return; }

        const { error } = await window.supabaseClient.from('managers').update({
            team_name: teamName,
            avatar_letter: teamName.charAt(0).toUpperCase(),
            avatar_color: color,
        }).eq('id', Profile.state.currentUser.id);

        if (error) { Profile.showMsg(msgEl, 'Erro ao salvar.', 'error'); return; }

        // Atualiza variáveis globais do app
        currentManagerName = teamName;
        currentManagerAvatar = teamName.charAt(0).toUpperCase();
        const el = document.getElementById('team-name-display');
        if (el) el.textContent = teamName;

        Profile.showMsg(msgEl, 'Perfil salvo!', 'success');
        setTimeout(() => Profile.close(), 1200);
    },

    async sendPasswordReset() {
        const email = Profile.state.manager?.email || Profile.state.currentUser?.email;
        const msgEl = document.getElementById('profile-pwd-msg');
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://arena-fantasy.vercel.app'
        });
        if (error) {
            Profile.showMsg(msgEl, 'Erro ao enviar. Tente novamente.', 'error');
        } else {
            Profile.showMsg(msgEl, `Link enviado para ${email}!`, 'success');
        }
    },

    showMsg(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = `auth-msg auth-msg-${type}`;
        el.style.display = 'block';
    },

    close() { document.getElementById('profile-modal')?.remove(); },
    open(user) { Profile.init(user); }
};
