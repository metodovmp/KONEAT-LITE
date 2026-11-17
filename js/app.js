/* KONEAT - JS FINAL CORRIGIDO - SÓ COLAR POR CIMA DO app.js INTEIRO */

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
    var el = document.getElementById('headerUsername');
    if(el) {
        const isPrivate = localStorage.getItem("koneat_private_account") === "true";
        el.textContent = name + (isPrivate ? " 🔒" : "");
    }
    var msg = document.getElementById('messagesCurrentUsername');
    if(msg) msg.textContent = '@' + name;
}

let legalReturnScreen = 'config';
let blocksReturnScreen = 'atividades';
let connectionsReturnScreen = 'perfil';
let selectedType = 'post', lastScreen = 'perfil', lastSource = 'perfil';
let mediaFile = null, mediaType = 'image', lastMediaSrc = '';

function go(n) {
    if (n === 'privacidade' || n === 'termos') {
        const active = document.querySelector('.screen.active');
        legalReturnScreen = (active && active.id === 'screen-perfil') ? 'perfil' : 'config';
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    var el = document.getElementById('screen-' + n);
    if (el) el.classList.add('active');
    var dd = document.getElementById('dropdownMenu');
    if(dd) dd.classList.remove('show');
    document.querySelectorAll('.nav').forEach(nav => {
        nav.querySelectorAll('button').forEach(b => {
            const isPlus = b.getAttribute('data-go') === 'plus';
            if (isPlus) {
                const on = (n === 'plus');
                b.classList.toggle('on', on);
                const r = b.querySelector('rect'), p = b.querySelector('path');
                if(on){ if(r){r.setAttribute('fill','#fff');r.setAttribute('stroke','#fff');} if(p){p.setAttribute('stroke','#111');} }
                else { if(r){r.setAttribute('fill','none');r.setAttribute('stroke','#fff');} if(p){p.setAttribute('stroke','#fff');} }
            } else {
                b.classList.toggle('on', b.getAttribute('data-go') === n);
            }
        });
    });
    if (n === 'home') { updateHomeSubnavIndicator(); renderHomeFeed(); renderStoriesBar(); }
    else if (n === 'perfil') { updateProfileTabIndicator(); renderProfileGrid(); }
    else if (n === 'video') { renderViralsFeed(); }
    else if (n === 'config') { syncConfigUI(); }
    else if (n === 'informacoes-conta') { syncAccountInfoUI(); }
    else if (n === 'atividades') { syncActivitiesUI(); }
    else if (n === 'mensagens') { renderMessagesUI(); }
}

function goBackFromLegal(){ go(legalReturnScreen || 'config'); }
function openFollowersScreen(){ connectionsReturnScreen='perfil'; const t=document.getElementById('seguidoresUsernameTitle'); if(t) t.textContent='@'+(currentUsername||'koneat_user'); go('seguidores'); }
function openFollowingScreen(){ connectionsReturnScreen='perfil'; const t=document.getElementById('seguindoUsernameTitle'); if(t) t.textContent='@'+(currentUsername||'koneat_user'); go('seguindo'); }
function openBloqueiosFrom(s){ blocksReturnScreen=s||'atividades'; go('bloqueios'); }
function goBackFromConnections(){ go(connectionsReturnScreen||'perfil'); }
function goBackFromBlocks(){ go(blocksReturnScreen||'atividades'); }

function switchConnectionTab(evt, tabIndex, screenId){
    const screen=document.getElementById(screenId); if(!screen) return;
    screen.querySelectorAll('.tab-conn-btn').forEach(b=>{b.classList.remove('active'); b.style.color='#8e8e93';});
    screen.querySelectorAll('.tab-content').forEach(c=>{c.classList.remove('active'); c.style.display='none';});
    const btn=evt.currentTarget; btn.classList.add('active'); btn.style.color='#000';
    const targetId = screenId==='screen-seguidores' ? (tabIndex===0?'tab-seguidores-lista':tabIndex===1?'tab-remover-lista':'tab-bloquear-lista') : (tabIndex===0?'tab-seguindo-lista':tabIndex===1?'tab-remover-seguindo-lista':'tab-bloquear-seguindo-lista');
    const target=document.getElementById(targetId); if(target){target.classList.add('active'); target.style.display='block';}
    updateConnectionIndicator(btn, screen);
}
function updateConnectionIndicator(btn, screenEl){
    const screen=screenEl||document.querySelector('.screen.active'); if(!screen) return;
    const ind=screen.querySelector('.connection-indicator');
    if(btn&&ind){ ind.style.width=btn.offsetWidth+'px'; ind.style.left=btn.offsetLeft+'px'; }
}
function switchBlockTab(evt, tabId){
    const screen=document.getElementById('screen-bloqueios'); if(!screen) return;
    screen.querySelectorAll('.tab-conn-btn').forEach(b=>{b.classList.remove('active'); b.style.color='#8e8e93';});
    screen.querySelectorAll('.tab-content').forEach(c=>{c.classList.remove('active'); c.style.display='none';});
    const btn=evt.currentTarget; btn.classList.add('active'); btn.style.color='#000';
    const target=document.getElementById(tabId); if(target){target.classList.add('active'); target.style.display='block';}
    updateBlockIndicator(btn);
}
function updateBlockIndicator(btn){
    const screen=document.getElementById('screen-bloqueios'); if(!screen) return;
    const ind=screen.querySelector('.block-indicator');
    if(btn&&ind){ ind.style.width=btn.offsetWidth+'px'; ind.style.left=btn.offsetLeft+'px'; }
}
function switchMsgTab(evt, paneId){
    document.querySelectorAll('#screen-mensagens .tab-msg-btn').forEach(b=>{b.classList.remove('active'); b.style.fontWeight='600'; b.style.color='#8e8e93'; b.style.borderBottom='2px solid transparent';});
    evt.currentTarget.classList.add('active'); evt.currentTarget.style.fontWeight='700'; evt.currentTarget.style.color='#000'; evt.currentTarget.style.borderBottom='2px solid #000';
    document.querySelectorAll('#screen-mensagens .tab-pane').forEach(p=>{p.classList.remove('active'); p.style.display='none';});
    const t=document.getElementById(paneId); if(t){t.classList.add('active'); t.style.display='block';}
}
function renderMessagesUI(){
    const conv=document.getElementById('tab-conversas-lista');
    const req=document.getElementById('tab-solicitacoes-lista');
    const badge=document.getElementById('requestsBadgeCount');
    if(conv){ conv.innerHTML = userConversations.length===0 ? `<div style="padding:60px 20px;text-align:center;color:#8e8e93;">Nenhuma conversa ativa.</div>` : userConversations.map(c=>`<div style="display:flex;padding:12px 16px;gap:12px;"><div style="width:50px;height:50px;border-radius:50%;background:#ddd;overflow:hidden;"><img src="${c.avatar||''}" style="width:100%;height:100%;object-fit:cover;"></div><div><b>${c.username}</b><br><span style="color:#8e8e93;">${c.lastMessage||''}</span></div></div>`).join(''); }
    if(req){
        if(userMessageRequests.length===0){ req.innerHTML=`<div style="padding:60px 20px;text-align:center;color:#8e8e93;">Suas solicitações aparecerão aqui.</div>`; if(badge) badge.style.display='none'; }
        else { if(badge){badge.style.display='inline-block'; badge.textContent=userMessageRequests.length;} req.innerHTML=userMessageRequests.map(r=>`<div style="display:flex;padding:12px 16px;gap:12px;"><div style="width:50px;height:50px;border-radius:50%;background:#ddd;overflow:hidden;"><img src="${r.avatar||''}" style="width:100%;height:100%;object-fit:cover;"></div><div><b>${r.username}</b><br><span style="color:#8e8e93;">${r.message}</span></div></div>`).join(''); }
    }
}
function updateHomeSubnavIndicator(){ var t=document.querySelector('.subnav-tab.active'); var ind=document.getElementById('subnavIndicator'); if(t&&ind){ ind.style.width=t.getBoundingClientRect().width+'px'; ind.style.left=t.offsetLeft+'px'; } }
function updateProfileTabIndicator(){ var t=document.querySelector('.p-tabs .tab-btn.active'); var ind=document.getElementById('profileTabIndicator'); if(t&&ind){ ind.style.width=t.offsetWidth+'px'; ind.style.left=t.offsetLeft+'px'; } }

/* LOGIN FAKE - qualquer email/senha entra, sem Supabase */
function handleLogin(e){
    if(e) e.preventDefault();
    try{ localStorage.setItem('koneat_logged_in','true'); }catch(err){}
    go('perfil');
}
function initLogin(){
    const f=document.getElementById('loginForm');
    if(f) f.addEventListener('submit', handleLogin);
    const g=document.getElementById('btnGoogle');
    if(g) g.addEventListener('click', handleLogin);
    const s=document.getElementById('signupForm');
    if(s) s.addEventListener('submit', (e)=>{ e.preventDefault(); const u=document.getElementById('cadUser'); if(u&&u.value) setUsername(u.value); go('perfil'); });
    const r=document.getElementById('recoveryForm');
    if(r) r.addEventListener('submit', (e)=>{ e.preventDefault(); alert('Código enviado!'); go('login'); });
    const t1=document.getElementById('toggleLogin');
    if(t1) t1.addEventListener('click', ()=>{ const inp=document.getElementById('loginPass'); if(inp) inp.type = inp.type==='password'?'text':'password'; });
    const t2=document.getElementById('toggleCad');
    if(t2) t2.addEventListener('click', ()=>{ const inp=document.getElementById('cadPass'); if(inp) inp.type = inp.type==='password'?'text':'password'; });
}

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    const menuBtn=document.getElementById('menuBtn'), dd=document.getElementById('dropdownMenu');
    if(menuBtn&&dd){ menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); dd.classList.toggle('show'); }); document.addEventListener('click', ()=> dd.classList.remove('show')); }
    document.querySelectorAll('.subnav-tab').forEach(tab=>{ tab.addEventListener('click', ()=>{ document.querySelectorAll('.subnav-tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active'); updateHomeSubnavIndicator(); }); });
    updateHomeSubnavIndicator();
    const pTabs=document.querySelectorAll('.p-tabs .tab-btn');
    pTabs.forEach(btn=>{ btn.addEventListener('click', ()=>{ pTabs.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); updateProfileTabIndicator(); renderProfileGrid(); }); });
    updateProfileTabIndicator();
    // NAV SIMPLES: cada botão vai pra tela dele, sem inventar nada
    document.querySelectorAll('.nav button[data-go]').forEach(b=>{
        b.addEventListener('click', function(e){ e.preventDefault(); go(this.getAttribute('data-go')); });
    });
    // Abas POST / STORY / VIRAL nas 2 telas de criar
    document.querySelectorAll('#screen-create .create-tab, #screen-plus .create-tab').forEach(tab=>{
        tab.addEventListener('click', ()=>{
            const nav = tab.closest('nav');
            if(nav) nav.querySelectorAll('.create-tab').forEach(t=>t.classList.remove('active'));
            tab.classList.add('active');
            selectedType = tab.dataset.type || 'post';
            const txt1=document.getElementById('previewText'); if(txt1) txt1.textContent = selectedType==='story' ? 'Adicionar story' : selectedType==='viral' ? 'Adicionar vídeo viral' : 'Adicionar imagem ou vídeo feed';
            const txt2=document.getElementById('plusPreviewText'); if(txt2) txt2.textContent = selectedType==='story' ? 'Faça um story' : selectedType==='viral' ? 'Faça um vídeo viral' : 'Faça um post no feed';
        });
    });
    // Botões Avançar -> vão pra legenda
    ['advanceButton','advanceButtonBottom','plusAdvanceBtn'].forEach(id=>{
        const b=document.getElementById(id);
        if(b) b.addEventListener('click', ()=>{ if(lastMediaSrc) openCaptionModal(lastMediaSrc); else alert('Escolha uma imagem ou vídeo primeiro'); });
    });
    // Voltar da legenda
    const back=document.getElementById('closeModalBtn');
    if(back) back.addEventListener('click', ()=> go(lastSource==='plus' ? 'plus' : 'create'));
    // Publicar - 1 motor só
    const pub=document.getElementById('publishBtn');
    if(pub) pub.addEventListener('click', publishCurrent);
    // Fechar editar perfil
    const closeEdit=document.getElementById('closeEditProfileBtn');
    if(closeEdit) closeEdit.addEventListener('click', ()=> go('perfil'));
    // Inputs de arquivo
    const pi=document.getElementById('postInput'); if(pi) pi.addEventListener('change', (e)=> handleFileSelection(e.target.files[0]));
    const ci=document.getElementById('cameraInput'); if(ci) ci.addEventListener('change', (e)=> handleFileSelection(e.target.files[0]));
    const si=document.getElementById('storyDirectInput');
    if(si) si.addEventListener('change', (e)=>{
        const file=e.target.files[0]; if(!file) return;
        const reader=new FileReader();
        reader.onload=function(evt){
            const now=Date.now();
            userStories.unshift({id:now, src:evt.target.result, type:file.type.startsWith('video')?'video':'image', user:currentUsername, timestamp:now});
            localStorage.setItem('koneat_stories', JSON.stringify(userStories));
            renderStoriesBar(); alert('Story publicado com sucesso!');
        };
        reader.readAsDataURL(file);
    });
    renderProfileGrid(); renderHomeFeed(); renderStoriesBar(); initEditProfile(); initShareProfile();
});

/* CRIAR - 2 telas separadas, 1 motor só */
function openCreateFromPlus(type){
    lastScreen='home'; lastSource='plus'; selectedType=type||'post';
    document.querySelectorAll('#screen-plus .create-tab').forEach(t=> t.classList.toggle('active', t.dataset.type===selectedType));
    go('plus');
}
function openCreateFromPerfil(type){
    lastScreen='perfil'; lastSource='perfil'; selectedType=type||'post';
    document.querySelectorAll('#screen-create .create-tab').forEach(t=> t.classList.toggle('active', t.dataset.type===selectedType));
    go('create');
}
function openCreate(type, source){
    if(source==='plus') openCreateFromPlus(type); else openCreateFromPerfil(type);
}
function closeCreate(){ go(lastScreen || 'perfil'); }

function handleFileSelection(file){
    if(!file) return;
    mediaFile=file; mediaType=file.type.startsWith('video')?'video':'image';
    const reader=new FileReader();
    reader.onload=function(e){
        lastMediaSrc=e.target.result;
        const empty=document.getElementById('emptyState'); if(empty) empty.style.display='none';
        const img=document.getElementById('imagePreview'); const vid=document.getElementById('videoPreview');
        const img2=document.getElementById('plusImagePreview'); const vid2=document.getElementById('plusVideoPreview');
        if(mediaType==='image'){
            if(img){img.src=e.target.result; img.style.display='block';} if(vid) vid.style.display='none';
            if(img2){img2.src=e.target.result; img2.style.display='block';} if(vid2) vid2.style.display='none';
        } else {
            if(vid){vid.src=e.target.result; vid.style.display='block';} if(img) img.style.display='none';
            if(vid2){vid2.src=e.target.result; vid2.style.display='block';} if(img2) img2.style.display='none';
        }
        setTimeout(()=> openCaptionModal(e.target.result), 300);
    };
    reader.readAsDataURL(file);
}
function triggerStoryInput(){ const i=document.getElementById('storyDirectInput'); if(i) i.click(); }
function openCaptionModal(src){
    lastMediaSrc=src;
    const thumb=document.getElementById('modalThumb'); if(thumb) thumb.src=src;
    const title=document.getElementById('modalCaptionTitle'); if(title) title.textContent = selectedType==='story' ? 'Novo story' : selectedType==='viral' ? 'Novo vídeo viral' : 'Nova publicação';
    go('caption');
}
function publishCurrent(){
    if(!lastMediaSrc){ alert('Escolha uma mídia primeiro'); return; }
    const cap=document.getElementById('captionInput');
    const caption= cap ? cap.value : '';
    const now=Date.now();
    const item={id:now, src:lastMediaSrc, type:mediaType, user:currentUsername, caption:caption, timestamp:now};
    if(selectedType==='story'){
        userStories.unshift(item); localStorage.setItem('koneat_stories', JSON.stringify(userStories));
        if(cap) cap.value=''; renderStoriesBar(); go('home'); alert('Story publicado!');
    } else if(selectedType==='viral'){
        userVirals.unshift(item); localStorage.setItem('koneat_virals', JSON.stringify(userVirals));
        if(cap) cap.value=''; renderViralsFeed(); renderProfileGrid(); go('video'); alert('Vídeo publicado!');
    } else {
        userPosts.unshift(item); localStorage.setItem('koneat_posts', JSON.stringify(userPosts));
        if(cap) cap.value=''; renderHomeFeed(); renderProfileGrid(); go('perfil'); alert('Post publicado!');
    }
    lastMediaSrc=''; mediaFile=null;
    const img=document.getElementById('imagePreview'); if(img){img.src=''; img.style.display='none';}
    const vid=document.getElementById('videoPreview'); if(vid){vid.src=''; vid.style.display='none';}
    const img2=document.getElementById('plusImagePreview'); if(img2){img2.src=''; img2.style.display='none';}
    const vid2=document.getElementById('plusVideoPreview'); if(vid2){vid2.src=''; vid2.style.display='none';}
}

function renderProfileGrid(){
    const grid=document.getElementById('perfilGrid'); if(!grid) return;
    const empty=document.getElementById('perfilEmpty');
    const emptyMsg=document.getElementById('emptyMsgText');
    const emptyBtn=document.getElementById('emptyBtnAction');
    const count=document.getElementById('countPosts');
    const activeTab=document.querySelector('.p-tabs .tab-btn.active');
    const tabName= activeTab ? activeTab.dataset.gridTab : 'todos';
    let items = tabName==='todos' ? [...userPosts, ...userVirals] : tabName==='reposts' ? userVirals : [];
    if(count) count.textContent=items.length;
    if(items.length===0){
        grid.innerHTML=''; grid.classList.remove('active');
        if(empty) empty.style.display='flex';
        if(tabName==='todos'){ if(emptyMsg) emptyMsg.textContent='Crie seu primeiro post'; if(emptyBtn){ emptyBtn.style.display='inline-block'; emptyBtn.textContent='Crie seu primeiro post'; emptyBtn.onclick=()=> openCreateFromPerfil('post'); } }
        else if(tabName==='reposts'){ if(emptyMsg) emptyMsg.textContent='Ainda não tem reposts'; if(emptyBtn) emptyBtn.style.display='none'; }
        else { if(emptyMsg) emptyMsg.textContent='Ainda não tem Marcações'; if(emptyBtn) emptyBtn.style.display='none'; }
        return;
    }
    if(empty) empty.style.display='none';
    grid.classList.add('active'); grid.innerHTML='';
    items.forEach(item=>{
        const div=document.createElement('div'); div.className='grid-item';
        div.innerHTML=`${item.type==='video' ? `<video src="${item.src}"></video><div class="badge-video">▶</div>` : `<img src="${item.src}">`}<button class="btn-del" onclick="deleteItem(${item.id})">🗑️</button>`;
        grid.appendChild(div);
    });
}
function deleteItem(id){
    if(confirm('Deseja realmente deletar esta publicação?')){
        userPosts=userPosts.filter(p=>p.id!==id); userVirals=userVirals.filter(v=>v.id!==id);
        localStorage.setItem('koneat_posts', JSON.stringify(userPosts)); localStorage.setItem('koneat_virals', JSON.stringify(userVirals));
        renderProfileGrid(); renderHomeFeed();
    }
}
function renderHomeFeed(){
    const feed=document.getElementById('postsDynamicFeed'); if(!feed) return;
    if(userPosts.length===0){ feed.innerHTML=`<div class="empty-home-feed">Nenhuma publicação no momento.<br>Crie um post para começar!</div>`; return; }
    feed.innerHTML='';
    userPosts.forEach(post=>{
        const card=document.createElement('div'); card.className='post-card';
        card.innerHTML=`<div class="post-header"><div class="post-author-info"><div class="author-avatar">${post.user.charAt(0).toUpperCase()}</div><span style="font-weight:700;font-size:14px">${post.user}</span></div></div><div class="post-media-wrapper">${post.type==='video' ? `<video src="${post.src}" controls playsinline></video>` : `<img src="${post.src}">`}</div><div class="post-caption-area"><span class="post-caption-author">${post.user}</span> ${post.caption||''}</div>`;
        feed.appendChild(card);
    });
}
function renderStoriesBar(){
    const bar=document.getElementById('storiesBar'); if(!bar) return;
    const now=Date.now();
    const active=userStories.filter(s=> (now - s.timestamp) < (24*3600*1000));
    let html=`<div class="story-item" onclick="triggerStoryInput()"><div class="story-avatar-wrap"><div class="story-avatar" style="border:1.5px solid #000;">👤</div><div class="story-add-badge" onclick="event.stopPropagation(); triggerStoryInput();">+</div></div><span class="story-username">seu story</span></div>`;
    active.forEach(story=>{ html+=`<div class="story-item" onclick="viewStory(${story.id})"><div class="story-avatar-wrap"><div class="story-avatar" style="border:2px solid #e1306c;"><img src="${story.src}"></div></div><span class="story-username">${story.user}</span></div>`; });
    bar.innerHTML=html;
}
function viewStory(id){ const s=userStories.find(x=>x.id===id); if(s) alert('Story de @'+s.user); }
function renderViralsFeed(){
    const c=document.getElementById('reelsContainer'); if(!c) return;
    if(userVirals.length===0){ c.innerHTML=`<div class="empty-video"><span>Vídeos virais aparecerão aqui</span></div>`; return; }
    c.innerHTML='';
    userVirals.forEach(v=>{
        const card=document.createElement('div'); card.className='reel-card';
        card.innerHTML=`<video src="${v.src}" class="reel-video" autoplay loop playsinline></video><div class="video-footer"><div class="creator-row"><span class="creator-name">@${v.user}</span></div><div style="font-size:13px;color:#fff">${v.caption||''}</div></div>`;
        c.appendChild(card);
    });
}
function syncConfigUI(){
    const isPrivate=localStorage.getItem('koneat_private_account')==='true';
    const notif=localStorage.getItem('koneat_notifications')!=='false';
    const lang=localStorage.getItem('koneat_language')||'Português (Brasil)';
    const tp=document.getElementById('togglePrivate'); if(tp) tp.checked=isPrivate;
    const sp=document.getElementById('subtitlePrivate'); if(sp) sp.textContent=isPrivate?'Privada':'Pública';
    const tn=document.getElementById('toggleNotif'); if(tn) tn.checked=notif;
    const sl=document.getElementById('subtitleIdioma'); if(sl) sl.textContent=lang;
}
function syncAccountInfoUI(){
    const p=JSON.parse(localStorage.getItem('koneat_profile')||'{}');
    const isPrivate=localStorage.getItem('koneat_private_account')==='true';
    const set=(id,val)=>{ const e=document.getElementById(id); if(e) e.textContent=val; };
    set('infoUsername','@'+(p.username||currentUsername)); set('infoName',p.name||'Usuário Koneat'); set('infoPrivacy',isPrivate?'Privada':'Pública'); set('infoBirth',p.birth||'Não informada'); set('infoGender',p.gender||'Não informado');
}
function syncActivitiesUI(){
    const set=(id,val)=>{ const e=document.getElementById(id); if(e) e.textContent=val; };
    set('statPostsCount', userPosts.length); set('statReposts', userVirals.length); set('statInteractions', userPosts.length+userVirals.length);
    const h=JSON.parse(localStorage.getItem('koneat_history')||'null')||[{text:'Configurações de perfil atualizadas',date:'Hoje'},{text:'Conta criada no Koneat',date:'Recentemente'}];
    const list=document.getElementById('historyList');
    if(list) list.innerHTML = h.length===0 ? '<div class="history-item"><span class="history-date">Nenhuma atividade registrada.</span></div>' : h.map(x=>`<div class="history-item"><span class="history-text">${x.text}</span><span class="history-date">${x.date}</span></div>`).join('');
}
function initEditProfile(){
  const editName=document.getElementById("editName"); const editUsername=document.getElementById("editUsername"); const editBio=document.getElementById("editBio"); const saveBtn=document.getElementById("saveProfileBtn");
  if(!editName||!saveBtn) return;
  editName.value=localStorage.getItem("koneat_name")||""; editUsername.value=(localStorage.getItem("koneat_username")||"").replace("@","").toLowerCase(); editBio.value=localStorage.getItem("koneat_bio")||"";
  saveBtn.addEventListener("click", (e)=>{ e.preventDefault(); localStorage.setItem("koneat_name", editName.value.trim()); localStorage.setItem("koneat_username", editUsername.value.trim().replace("@","").toLowerCase()); localStorage.setItem("koneat_bio", editBio.value.trim()); if(editUsername.value) setUsername(editUsername.value); alert('Perfil atualizado com sucesso!'); go('perfil'); });
}
function initShareProfile(){
  const btn=document.getElementById("btnShareProfile"); if(!btn) return;
  btn.addEventListener("click", async (e)=>{
    e.preventDefault();
    const username=(localStorage.getItem("koneat_username")||currentUsername||"erivelto777silva").replace("@","").trim();
    const url=window.location.origin+window.location.pathname+"?u="+username;
    if(navigator.share){ try{ await navigator.share({title:"Confira meu perfil no Koneat!", text:"Confira meu perfil no Koneat!", url}); }catch(e){} return; }
    try{ await navigator.clipboard.writeText("Confira meu perfil no Koneat! "+url); alert("Link do perfil copiado!"); }catch(e){ prompt("Copie o link do seu perfil:", url); }
  });
}
