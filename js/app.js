/* ==========================================================
   KONEAT - APP ENGINE & CONFIGURATIONS LOGIC
   ========================================================== */

let currentUsername = 'eributtler';
let userPosts = JSON.parse(localStorage.getItem('koneat_posts') || '[]');
let userStories = JSON.parse(localStorage.getItem('koneat_stories') || '[]');
let userVirals = JSON.parse(localStorage.getItem('koneat_virals') || '[]');

let userConversations = JSON.parse(localStorage.getItem('koneat_conversations') || '[]');
let userMessageRequests = JSON.parse(localStorage.getItem('koneat_requests') || '[]');

function setUsername(name) {
    if (!name) return;
    name = name.toLowerCase().replace(/[^a-z0-9._]/g, '');
    currentUsername = name;
    var profileTopName = document.getElementById('headerUsername');
    if(profileTopName) {
        const isPrivate = localStorage.getItem("koneat_private_account") === "true";
        profileTopName.textContent = name + (isPrivate ? " 🔒" : "");
    }
    var msgUsername = document.getElementById('messagesCurrentUsername');
    if(msgUsername) {
        msgUsername.textContent = '@' + name;
    }
}

/* ==========================================================
   ROTEAMENTO SPA INTELIGENTE
   ========================================================== */
let legalReturnScreen = 'config';
let blocksReturnScreen = 'atividades'; 
let connectionsReturnScreen = 'perfil';

function go(n) {
    if (n === 'privacidade' || n === 'termos') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id === 'screen-perfil') {
            legalReturnScreen = 'perfil';
        } else {
            legalReturnScreen = 'config';
        }
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    var el = document.getElementById('screen-' + n);
    if (el) el.classList.add('active');
    
    var dropdownMenu = document.getElementById('dropdownMenu');
    if(dropdownMenu) dropdownMenu.classList.remove('show');
    
    document.querySelectorAll('.nav').forEach(navBar => {
        navBar.querySelectorAll('button').forEach(b => {
            const isPlus = b.getAttribute('data-go') === 'plus';
            if (isPlus) {
                b.classList.toggle('on', n === 'plus');
                const svgRect = b.querySelector('rect');
                const svgPath = b.querySelector('path');
                if (n === 'plus') {
                    if(svgRect) { svgRect.setAttribute('fill', '#fff'); svgRect.setAttribute('stroke', '#fff'); }
                    if(svgPath) { svgPath.setAttribute('stroke', '#111'); }
                } else {
                    if(svgRect) { svgRect.setAttribute('fill', 'none'); svgRect.setAttribute('stroke', '#fff'); }
                    if(svgPath) { svgPath.setAttribute('stroke', '#fff'); }
                }
            } else {
                b.classList.toggle('on', b.getAttribute('data-go') === n);
            }
        });
    });

    if (n === 'home') {
        updateHomeSubnavIndicator();
        renderHomeFeed();
        renderStoriesBar();
    } else if (n === 'perfil') {
        updateProfileTabIndicator();
        renderProfileGrid();
    } else if (n === 'video') {
        renderViralsFeed();
    } else if (n === 'config') {
        syncConfigUI();
    } else if (n === 'informacoes-conta') {
        syncAccountInfoUI();
    } else if (n === 'atividades') {
        syncActivitiesUI();
    } else if (n === 'seguidores') {
        updateConnectionIndicator(document.querySelector('#screen-seguidores .tab-conn-btn.active'));
    } else if (n === 'seguindo') {
        updateConnectionIndicator(document.querySelector('#screen-seguindo .tab-conn-btn.active'));
    } else if (n === 'bloqueios') {
        updateBlockIndicator(document.querySelector('#screen-bloqueios .tab-conn-btn.active'));
    } else if (n === 'mensagens') {
        const msgUser = document.getElementById('messagesCurrentUsername');
        if(msgUser) msgUser.textContent = '@' + (currentUsername || 'eributtler');
        renderMessagesUI();
    }
}

function goBackFromLegal() {
    go(legalReturnScreen || 'config');
}

function openFollowersScreen() {
    connectionsReturnScreen = 'perfil';
    const titleEl = document.getElementById('seguidoresUsernameTitle');
    if(titleEl) titleEl.textContent = '@' + (currentUsername || 'koneat_user');
    go('seguidores');
}

function openFollowingScreen() {
    connectionsReturnScreen = 'perfil';
    const titleEl = document.getElementById('seguindoUsernameTitle');
    if(titleEl) titleEl.textContent = '@' + (currentUsername || 'koneat_user');
    go('seguindo');
}

function openBloqueiosFrom(source) {
    blocksReturnScreen = source || 'atividades';
    go('bloqueios');
}

function goBackFromConnections() {
    go(connectionsReturnScreen || 'perfil');
}

function goBackFromBlocks() {
    go(blocksReturnScreen || 'atividades');
}

/* Indicador deslizante dinâmico para abas de Seguidores / Seguindo */
function switchConnectionTab(evt, tabIndex, screenId) {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    screen.querySelectorAll('.tab-conn-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#8e8e93';
    });
    screen.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    const btn = evt.currentTarget;
    btn.classList.add('active');
    btn.style.color = '#000';

    const targetId = screenId === 'screen-seguidores' 
        ? (tabIndex === 0 ? 'tab-seguidores-lista' : tabIndex === 1 ? 'tab-remover-lista' : 'tab-bloquear-lista')
        : (tabIndex === 0 ? 'tab-seguindo-lista' : tabIndex === 1 ? 'tab-remover-seguindo-lista' : 'tab-bloquear-seguindo-lista');

    const target = document.getElementById(targetId);
    if(target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    updateConnectionIndicator(btn, screen);
}

function updateConnectionIndicator(activeBtn, screenEl) {
    const screen = screenEl || document.querySelector('.screen.active');
    if (!screen) return;
    const ind = screen.querySelector('.connection-indicator');
    if (activeBtn && ind) {
        ind.style.width = activeBtn.offsetWidth + 'px';
        ind.style.left = activeBtn.offsetLeft + 'px';
    }
}

function switchBlockTab(evt, tabId) {
    const screen = document.getElementById('screen-bloqueios');
    if(!screen) return;
    screen.querySelectorAll('.tab-conn-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#8e8e93';
    });
    screen.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    const btn = evt.currentTarget;
    btn.classList.add('active');
    btn.style.color = '#000';

    const target = document.getElementById(tabId);
    if(target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
    updateBlockIndicator(btn);
}

function updateBlockIndicator(activeBtn) {
    const screen = document.getElementById('screen-bloqueios');
    if (!screen) return;
    const ind = screen.querySelector('.block-indicator');
    if (activeBtn && ind) {
        ind.style.width = activeBtn.offsetWidth + 'px';
        ind.style.left = activeBtn.offsetLeft + 'px';
    }
}

/* Lógica das abas de Mensagens (Direct) */
function switchMsgTab(evt, paneId) {
    document.querySelectorAll('#screen-mensagens .tab-msg-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.fontWeight = '600';
        btn.style.color = '#8e8e93';
        btn.style.borderBottom = '2px solid transparent';
    });

    evt.currentTarget.classList.add('active');
    evt.currentTarget.style.fontWeight = '700';
    evt.currentTarget.style.color = '#000';
    evt.currentTarget.style.borderBottom = '2px solid #000';

    document.querySelectorAll('#screen-mensagens .tab-pane').forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none';
    });

    const target = document.getElementById(paneId);
    if(target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
}

function renderMessagesUI() {
    const convContainer = document.getElementById('tab-conversas-lista');
    const reqContainer = document.getElementById('tab-solicitacoes-lista');
    const reqBadge = document.getElementById('requestsBadgeCount');

    if (convContainer) {
        if (userConversations.length === 0) {
            convContainer.innerHTML = `<div style="padding:60px 20px; text-align:center; color:#8e8e93; font-size:14px;">Nenhuma conversa ativa no momento.</div>`;
        } else {
            convContainer.innerHTML = userConversations.map(c => `
                <div style="display:flex; align-items:center; padding:12px 16px; gap:12px; cursor:pointer;">
                    <div style="width:50px; height:50px; border-radius:50%; background:#ddd; overflow:hidden;"><img src="${c.avatar || ''}" style="width:100%; height:100%; object-fit:cover;"></div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <span style="font-weight:700; font-size:14px; color:#000;">${c.username}</span>
                        <span style="font-size:13px; color:#8e8e93;">${c.lastMessage || 'Toque para conversar'}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    if (reqContainer) {
        if (userMessageRequests.length === 0) {
            reqContainer.innerHTML = `<div style="padding:60px 20px; text-align:center; color:#8e8e93; font-size:14px;">Suas solicitações de mensagem aparecerão aqui.</div>`;
            if (reqBadge) reqBadge.style.display = 'none';
        } else {
            if (reqBadge) {
                reqBadge.style.display = 'inline-block';
                reqBadge.textContent = userMessageRequests.length;
            }
            reqContainer.innerHTML = userMessageRequests.map(r => `
                <div style="display:flex; align-items:center; padding:12px 16px; gap:12px;">
                    <div style="width:50px; height:50px; border-radius:50%; background:#ddd; overflow:hidden;"><img src="${r.avatar || ''}" style="width:100%; height:100%; object-fit:cover;"></div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <span style="font-weight:700; font-size:14px; color:#000;">${r.username}</span>
                        <span style="font-size:13px; color:#8e8e93;">${r.message}</span>
                    </div>
                </div>
            `).join('');
        }
    }
}

function updateHomeSubnavIndicator() {
    var t = document.querySelector('.subnav-tab.active');
    var ind = document.getElementById('subnavIndicator');
    if (t && ind) {
        ind.style.width = t.getBoundingClientRect().width + 'px';
        ind.style.left = t.offsetLeft + 'px';
    }
}

function updateProfileTabIndicator() {
    var t = document.querySelector('.p-tabs .tab-btn.active');
    var ind = document.getElementById('profileTabIndicator');
    if (t && ind) {
        ind.style.width = t.offsetWidth + 'px';
        ind.style.left = t.offsetLeft + 'px';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if(menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }

    document.querySelectorAll('.subnav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.subnav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateHomeSubnavIndicator();
        });
    });
    updateHomeSubnavIndicator();

    const profileTabs = document.querySelectorAll('.p-tabs .tab-btn');
    profileTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            profileTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateProfileTabIndicator();
            renderProfileGrid();
        });
    });
    updateProfileTabIndicator();

    setTimeout(() => {
        updateConnectionIndicator(document.querySelector('#screen-seguidores .tab-conn-btn.active'), document.getElementById('screen-seguidores'));
        updateConnectionIndicator(document.querySelector('#screen-seguindo .tab-conn-btn.active'), document.getElementById('screen-seguindo'));
        updateBlockIndicator(document.querySelector('#screen-bloqueios .tab-conn-btn.active'));
    }, 100);

    document.querySelectorAll('.nav button[data-go]').forEach(b => {
        b.addEventListener('click', function(e) {
            e.preventDefault();
            var d = this.getAttribute('data-go');
            if (d === 'plus') {
                go('plus');
            } else {
                go(d);
            }
        });
    });

    renderProfileGrid();
    renderHomeFeed();
    renderStoriesBar();
    initEditProfile();
    initShareProfile();
});

let selectedType = 'post', lastScreen = 'perfil', lastSource = 'perfil';
let mediaFile = null, mediaType = 'image';

function openCreate(type, source) {
    lastScreen = 'perfil';
    lastSource = source || 'perfil';
    document.querySelectorAll('#screen-create .create-tab').forEach(t => {
        if(t.dataset.type === type) t.click();
    });
    go('create');
}

function closeCreate() {
    go(lastScreen || 'home');
}

const postInput = document.getElementById('postInput');
const cameraInput = document.getElementById('cameraInput');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const emptyState = document.getElementById('emptyState');

function handleFileSelection(file) {
    if (!file) return;
    mediaFile = file;
    mediaType = file.type.startsWith('video') ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = function(e) {
        if(emptyState) emptyState.style.display = 'none';
        if(mediaType === 'image') {
            if(imagePreview) { imagePreview.src = e.target.result; imagePreview.style.display = 'block'; }
            if(videoPreview) videoPreview.style.display = 'none';
        } else {
            if(videoPreview) { videoPreview.src = e.target.result; videoPreview.style.display = 'block'; }
            if(imagePreview) imagePreview.style.display = 'none';
        }
        setTimeout(() => {
            openCaptionModal(e.target.result);
        }, 300);
    };
    reader.readAsDataURL(file);
}

if(postInput) postInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));
if(cameraInput) cameraInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));

const storyDirectInput = document.getElementById('storyDirectInput');
function triggerStoryInput() {
    if(storyDirectInput) storyDirectInput.click();
}

if(storyDirectInput) {
    storyDirectInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            const now = Date.now();
            const newStory = {
                id: now,
                src: evt.target.result,
                type: file.type.startsWith('video') ? 'video' : 'image',
                user: currentUsername,
                timestamp: now
            };
            userStories.unshift(newStory);
            localStorage.setItem('koneat_stories', JSON.stringify(userStories));
            renderStoriesBar();
            alert('Story publicado com sucesso!');
        };
        reader.readAsDataURL(file);
    });
}

function openCaptionModal(src) {
    const modalThumb = document.getElementById('modalThumb');
    if(modalThumb) modalThumb.src = src;
    go('caption');
}

function renderProfileGrid() {
    const grid = document.getElementById('perfilGrid');
    const empty = document.getElementById('perfilEmpty');
    const emptyMsgText = document.getElementById('emptyMsgText');
    const emptyBtnAction = document.getElementById('emptyBtnAction');
    const countPosts = document.getElementById('countPosts');
    
    if(!grid) return;
    
    const activeTabBtn = document.querySelector('.p-tabs .tab-btn.active');
    const tabName = activeTabBtn ? activeTabBtn.dataset.gridTab : 'todos';

    let itemsToRender = [];
    if(tabName === 'todos') {
        itemsToRender = [...userPosts, ...userVirals];
    } else if(tabName === 'reposts') {
        itemsToRender = userVirals;
    } else {
        itemsToRender = [];
    }

    if(countPosts) countPosts.textContent = itemsToRender.length;

    if(itemsToRender.length === 0) {
        grid.innerHTML = '';
        grid.classList.remove('active');
        if(empty) empty.style.display = 'flex';

        if(tabName === 'todos') {
            if(emptyMsgText) emptyMsgText.textContent = userPosts.length === 0 ? 'Crie seu primeiro post' : 'Nenhuma publicação';
            if(emptyBtnAction) {
                emptyBtnAction.style.display = 'inline-block';
                emptyBtnAction.textContent = 'Crie seu primeiro post';
                emptyBtnAction.onclick = () => openCreate('post', 'perfil');
            }
        } else if(tabName === 'reposts') {
            if(emptyMsgText) emptyMsgText.textContent = 'Ainda não tem reposts';
            if(emptyBtnAction) emptyBtnAction.style.display = 'none';
        } else if(tabName === 'marcacoes') {
            if(emptyMsgText) emptyMsgText.textContent = 'Ainda não tem Marcações';
            if(emptyBtnAction) emptyBtnAction.style.display = 'none';
        }
        return;
    }

    if(empty) empty.style.display = 'none';
    grid.classList.add('active');
    grid.innerHTML = '';

    itemsToRender.forEach(item => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.innerHTML = `
            ${item.type === 'video' ? `<video src="${item.src}"></video><div class="badge-video"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>` : `<img src="${item.src}">`}
            <button class="btn-del" onclick="deleteItem(${item.id})">🗑️</button>
        `;
        grid.appendChild(div);
    });
}

function deleteItem(id) {
    if(confirm('Deseja realmente deletar esta publicação?')) {
        userPosts = userPosts.filter(p => p.id !== id);
        userVirals = userVirals.filter(v => v.id !== id);
        localStorage.setItem('koneat_posts', JSON.stringify(userPosts));
        localStorage.setItem('koneat_virals', JSON.stringify(userVirals));
        renderProfileGrid();
        renderHomeFeed();
    }
}

function renderHomeFeed() {
    const feed = document.getElementById('postsDynamicFeed');
    if(!feed) return;

    if(userPosts.length === 0) {
        feed.innerHTML = `<div class="empty-home-feed" id="homeEmpty">Nenhuma publicação no momento.<br>Crie um post para começar!</div>`;
        return;
    }

    feed.innerHTML = '';
    userPosts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-header">
                <div class="post-author-info">
                    <div class="author-avatar">${post.user.charAt(0).toUpperCase()}</div>
                    <span style="font-weight:700;font-size:14px">${post.user}</span>
                </div>
            </div>
            <div class="post-media-wrapper">
                ${post.type === 'video' ? `<video src="${post.src}" controls playsinline></video>` : `<img src="${post.src}">`}
            </div>
            <div class="post-actions-bar">
                <div class="post-actions-left">
                    <button class="post-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
                    <button class="post-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></button>
                </div>
            </div>
            <div class="post-caption-area">
                <span class="post-caption-author">${post.user}</span>${post.caption || ''}
            </div>
        `;
        feed.appendChild(card);
    });
}

function renderStoriesBar() {
    const bar = document.getElementById('storiesBar');
    if(!bar) return;

    const now = Date.now();
    const activeStories = userStories.filter(s => (now - s.timestamp) < (24 * 3600 * 1000));

    let html = `
        <div class="story-item" onclick="triggerStoryInput()">
            <div class="story-avatar-wrap">
                <div class="story-avatar" id="storyAvatar" style="border: 1.5px solid #000;"><svg viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <div class="story-add-badge" onclick="event.stopPropagation(); triggerStoryInput();">+</div>
            </div>
            <span class="story-username">seu story</span>
        </div>
    `;

    activeStories.forEach(story => {
        html += `
            <div class="story-item" onclick="viewStory(${story.id})">
                <div class="story-avatar-wrap">
                    <div class="story-avatar" style="border: 2px solid #e1306c;"><img src="${story.src}"></div>
                </div>
                <span class="story-username">${story.user}</span>
            </div>
        `;
    });

    bar.innerHTML = html;
}

function renderViralsFeed() {
    const container = document.getElementById('reelsContainer');
    if(!container) return;

    if(userVirals.length === 0) {
        container.innerHTML = `<div class="empty-video" id="videoEmpty"><span>Vídeos virais aparecerão aqui</span></div>`;
        return;
    }

    container.innerHTML = '';
    userVirals.forEach(viral => {
        const card = document.createElement('div');
        card.className = 'reel-card';
        card.innerHTML = `
            <video src="${viral.src}" class="reel-video" autoplay loop playsinline></video>
            <div class="video-footer">
                <div class="creator-row"><span class="creator-name">@${viral.user}</span></div>
                <div style="font-size:13px;color:#fff">${viral.caption || ''}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function syncConfigUI() {
    const isPrivate = localStorage.getItem('koneat_private_account') === 'true';
    const notifEnabled = localStorage.getItem('koneat_notifications') !== 'false';
    const savedLang = localStorage.getItem('koneat_language') || 'Português (Brasil)';

    const togglePrivate = document.getElementById('togglePrivate');
    const subtitlePrivate = document.getElementById('subtitlePrivate');
    const toggleNotif = document.getElementById('toggleNotif');
    const subtitleIdioma = document.getElementById('subtitleIdioma');

    if (togglePrivate) togglePrivate.checked = isPrivate;
    if (subtitlePrivate) subtitlePrivate.textContent = isPrivate ? 'Privada' : 'Pública';
    if (toggleNotif) toggleNotif.checked = notifEnabled;
    if (subtitleIdioma) subtitleIdioma.textContent = savedLang;
}

function syncAccountInfoUI() {
    const profileData = JSON.parse(localStorage.getItem('koneat_profile') || '{}');
    const isPrivate = localStorage.getItem('koneat_private_account') === 'true';

    document.getElementById('infoUsername').textContent = '@' + (profileData.username || currentUsername);
    document.getElementById('infoName').textContent = profileData.name || 'Usuário Koneat';
    document.getElementById('infoPrivacy').textContent = isPrivate ? 'Privada' : 'Pública';
    document.getElementById('infoBirth').textContent = profileData.birth || 'Não informada';
    document.getElementById('infoGender').textContent = profileData.gender || 'Não informado';
}

function syncActivitiesUI() {
    const totalPosts = userPosts.length;
    const totalReposts = userVirals.length;
    document.getElementById('statPostsCount').textContent = totalPosts;
    document.getElementById('statReposts').textContent = totalReposts;
    document.getElementById('statInteractions').textContent = totalPosts + totalReposts;

    const history = JSON.parse(localStorage.getItem('koneat_history') || 'null') || [
        { text: 'Configurações de perfil atualizadas', date: 'Hoje' },
        { text: 'Conta criada no Koneat', date: 'Recentemente' }
    ];
    const listEl = document.getElementById('historyList');
    if (listEl) {
        listEl.innerHTML = history.length === 0
            ? '<div class="history-item"><span class="history-date">Nenhuma atividade registrada.</span></div>'
            : history.map(h => `<div class="history-item"><span class="history-text">${h.text}</span><span class="history-date">${h.date}</span></div>`).join('');
    }
}

function initEditProfile() {
  const editName = document.getElementById("editName");
  const editUsername = document.getElementById("editUsername");
  const editBio = document.getElementById("editBio");
  const saveBtn = document.getElementById("saveProfileBtn");
  if (!editName || !saveBtn) return;

  editName.value = localStorage.getItem("koneat_name") || "";
  editUsername.value = (localStorage.getItem("koneat_username") || "").replace("@","").toLowerCase();
  editBio.value = localStorage.getItem("koneat_bio") || "";

  saveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.setItem("koneat_name", editName.value.trim());
    localStorage.setItem("koneat_username", editUsername.value.trim().replace("@","").toLowerCase());
    localStorage.setItem("koneat_bio", editBio.value.trim());

    if (editUsername.value) setUsername(editUsername.value);
    alert('Perfil atualizado com sucesso!');
    go('perfil');
  });
}

function initShareProfile() {
  const btn = document.getElementById("btnShareProfile");
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const username = (localStorage.getItem("koneat_username") || currentUsername || "erivelto777silva").replace("@","").trim();
    const shareData = {
      title: "Confira meu perfil no Koneat!",
      text: "Confira meu perfil no Koneat!",
      url: window.location.origin + window.location.pathname + "?u=" + username
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
      alert("Link do perfil copiado!");
    } catch (e) {
      prompt("Copie o link do seu perfil:", shareData.url);
    }
  });
}
