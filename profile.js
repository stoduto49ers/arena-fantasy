// =============================================
// ARENA FANTASY - Perfil do Manager
// Editar nome do time, cor/letra do avatar
// =============================================

const Profile = {

    state: {
        currentUser: null,
        manager: null,
    },

    async init(user) {
        Profile.state.currentUser = user;
        await Profile.loadManager();
        Profile.renderModal();
    },

    async loadManager() {
        const { data } = await window.supabaseClient
            .from('managers')
            .select('*')
            .eq('id', Profile.state.currentUser.id)
            .single();
        Profile.state.manager = data;
    },

    renderModal() {
        const existing = document.getElementById('profile-modal');
        if (existing) existing.remove();

        const m = Profile.state.manager;
        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-user-pen" style="color:var(--neon-blue);"></i> Meu Perfil</h3>
                    <button class="modal-close-btn" onclick="Profile.close()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Avatar preview -->
                <div style="display:flex; justify-content:center; margin:20px 0;">
                    <div class="profile-avatar-preview" id="avatar-preview">
                        ${(m?.team_name || '?').charAt(0).toUpperCase()}
                    </div>
                </div>

                <div class="cfg-form">
                    <div class="cfg-field">
                        <label>Nome do Time</label>
                        <div class="auth-input-wrap">
                            <i class="fa-solid fa-shield-halved"></i>
                            <input type="text" id="profile-team-name"
                                value="${m?.team_name || ''}"
                                placeholder="Nome do seu time"
                                maxlength="30"
                                oninput="Profile.previewAvatar(this.value)">
                        </div>
                    </div>

                    <div class="cfg-field">
                        <label>Cor do Avatar</label>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;" id="avatar-color-picker">
                            ${['#00f2fe','#00ff87','#b92bff','#ff9f43','#ff4757','#ffd700','#60efff','#ff6b9d'].map(color =>
                                `<div class="avatar-color-swatch ${m?.avatar_color === color ? 'selected' : ''}"
                                    style="background:${color};"
                                    onclick="Profile.selectColor('${color}')"
                                    data-color="${color}">
                                </div>`
                            ).join('')}
                        </div>
                    </div>

                    <div id="profile-msg" style="display:none;" class="auth-msg"></div>

                    <button class="action-btn primary" style="width:100%; justify-content:center;" onclick="Profile.save()">
                        <i class="fa-solid fa-floppy-disk"></i> Salvar Perfil
                    </button>
                </div>

                <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-muted);">
                        <span>Email</span>
                        <span style="color:var(--text-secondary);">${m?.email || Profile.state.currentUser?.email || '—'}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-muted); margin-top:8px;">
                        <span>Saldo de D$</span>
                        <span style="color:var(--neon-green); font-weight:700;">D$${m?.budget ?? 1000}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        // Fechar clicando fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) Profile.close();
        });

        // Seleciona cor atual
        if (m?.avatar_color) Profile.selectColor(m.avatar_color, false);
    },

    previewAvatar(name) {
        const el = document.getElementById('avatar-preview');
        if (el) el.textContent = (name || '?').charAt(0).toUpperCase();
    },

    selectColor(color, updatePreview = true) {
        Profile.state.selectedColor = color;
        document.querySelectorAll('.avatar-color-swatch').forEach(s => {
            s.classList.toggle('selected', s.dataset.color === color);
        });
        if (updatePreview) {
            const el = document.getElementById('avatar-preview');
            if (el) el.style.background = color;
        }
    },

    async save() {
        const teamName = document.getElementById('profile-team-name')?.value?.trim();
        const color = Profile.state.selectedColor || '#00f2fe';
        const msgEl = document.getElementById('profile-msg');

        if (!teamName) {
            msgEl.textContent = 'Digite o nome do time.';
            msgEl.className = 'auth-msg auth-msg-error';
            msgEl.style.display = 'block';
            return;
        }

        const { error } = await window.supabaseClient
            .from('managers')
            .update({
                team_name: teamName,
                avatar_letter: teamName.charAt(0).toUpperCase(),
                avatar_color: color,
            })
            .eq('id', Profile.state.currentUser.id);

        if (error) {
            msgEl.textContent = 'Erro ao salvar. Tente novamente.';
            msgEl.className = 'auth-msg auth-msg-error';
            msgEl.style.display = 'block';
            return;
        }

        // Atualiza o nome exibido no app
        const teamNameDisplay = document.getElementById('team-name-display');
        if (teamNameDisplay) teamNameDisplay.textContent = teamName;
        const budgetBadge = document.getElementById('header-budget-badge');

        msgEl.textContent = 'Perfil salvo com sucesso!';
        msgEl.className = 'auth-msg auth-msg-success';
        msgEl.style.display = 'block';

        setTimeout(() => Profile.close(), 1200);
    },

    close() {
        document.getElementById('profile-modal')?.remove();
    },

    open(user) {
        Profile.init(user);
    }
};
