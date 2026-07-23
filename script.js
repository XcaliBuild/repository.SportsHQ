(function() { if (window.__playableTouchPatchInstalled) return; window.__playableTouchPatchInstalled = true; var origAdd = EventTarget.prototype.addEventListener; var blockedTypes = { touchstart: 1, touchmove: 1 }; EventTarget.prototype.addEventListener = function(type, listener, options) { if (blockedTypes[type]) { if (options === undefined || options === null) { options = { passive: true }; } else if (typeof options === 'boolean') { options = { capture: options, passive: true }; } else { options = Object.assign({}, options, { passive: true }); } } return origAdd.call(this, type, listener, options); }; })();
window.Intl=window.Intl||{};Intl.t=function(s){return(Intl._locale&&Intl._locale[s])||s;};

let currentPageId=null, currentProjectId=null, projects=[], appConfig={fontFamily:'Playfair Display'};
let currentActiveModule = 'comic';
let selectedPanelIndex=null, selectedBubbleId=null, dragState=null;
const uid=()=> 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const BD_TEMPLATES = [
    {id:'full', name:'Plein', rects:[{x:0,y:0,w:100,h:100}]},
    {id:'2h', name:'2-H', rects:[{x:0,y:0,w:100,h:49},{x:0,y:51,w:100,h:49}]},
    {id:'3v', name:'3-V', rects:[{x:0,y:0,w:32,h:100},{x:34,y:0,w:32,h:100},{x:68,y:0,w:32,h:100}]},
    {id:'4', name:'4', rects:[{x:0,y:0,w:49,h:49},{x:51,y:0,w:49,h:49},{x:0,y:51,w:49,h:49},{x:51,y:51,w:49,h:49}]},
    {id:'blacksad', name:'Classique', rects:[{x:0,y:0,w:100,h:38},{x:0,y:40,w:100,h:14},{x:0,y:56,w:32,h:20},{x:34,y:56,w:32,h:20},{x:68,y:56,w:32,h:20},{x:0,y:78,w:100,h:22}]}
];

function getTemplateRects(id){
    let t=BD_TEMPLATES.find(x=>x.id===id); return t?t.rects:[{x:0,y:0,w:100,h:100}];
}

function ensureBDData(item){
    if(!item) return;
    if(!item.bdBg) item.bdBg={tx:0,ty:0,scale:1,rot:0};
    if(item.bdBgImage===undefined) item.bdBgImage='';
    if(!item.bdPanels) item.bdPanels=[{id:uid(), image:'', tx:0,ty:0,scale:1,rot:0}];
    item.bdPanels.forEach(p=>{ if(!p.id) p.id=uid(); });
    if(!item.bdTemplateRects) item.bdTemplateRects=getTemplateRects('full');
    if(!item.bdBubbles) item.bdBubbles=[];
    item.bdBubbles.forEach(b=>{
        if(b.x===undefined) b.x=50; if(b.y===undefined) b.y=50;
        if(!b.w) b.w=30; if(!b.fontSize) b.fontSize=14;
        if(!b.fontFamily) b.fontFamily="'Bangers', cursive";
        if(!b.shape) b.shape='oval'; 
        if(!b.tail) b.tail='bc';     
        if(!b.bgColor) b.bgColor = '#ffffff';
    });
}

function toggleDropdown(id) {
    const el = document.getElementById(id);
    const isVis = el.style.display === 'flex';
    closeMenus(); if(!isVis) el.style.display = 'flex';
}
function closeMenus() { document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display='none'); }
document.addEventListener('click',e=>{ if(!e.target.closest('.gen-wrap')) closeMenus(); });

function refreshPageDropdown(){
    const dd=document.getElementById('pageDropdown'); if(!dd) return;
    dd.innerHTML=''; const proj=getCurrentProject(); if(!proj) return;
    proj.data.book.items.forEach(it=>{
        const b=document.createElement('button');
        b.className='dropdown-item'+(it.id===currentPageId?' active':'');
        b.innerHTML= esc(it.title);
        b.onclick=()=>{ selectPage(it.id); closeMenus(); };
        dd.appendChild(b);
    });
    const label=document.getElementById('pageSelectLabel');
    const cur=proj.data.book.items.find(i=>i.id===currentPageId);
    if(label&&cur) label.textContent = cur.title;
}

function selectPage(id){ currentPageId=id; selectedPanelIndex=0; selectedBubbleId=null; loadPageData(); }

function loadProjects(){
    try{
        projects=JSON.parse(localStorage.getItem('writer_projects_v2')||'[]');
        currentProjectId=localStorage.getItem('writer_current_project_id');
        if(projects.length===0){
            const p={id:uid(),title:'Mon Comic',data:{book:{title:'Mon Comic',items:[{id:'cover',type:'cover',title:'Couverture',showTitle:true,image:'',bdPanels:[],bdBubbles:[]},{id:'ch1',type:'chapter',title:'Page 1',bdTemplate:'blacksad',bdTemplateRects:getTemplateRects('blacksad'),bdBgImage:'',bdBg:{tx:0,ty:0,scale:1,rot:0},bdPanels:[{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0}],bdBubbles:[]}]}},config:{},mode:'comic',updatedAt:Date.now()};
            projects=[p]; currentProjectId=p.id; saveProjects();
        }
        if(!projects.find(p=>p.id===currentProjectId)) currentProjectId=projects[0].id;
    }catch(e){}
}

function saveProjects(){
    try {
        localStorage.setItem('writer_projects_v2',JSON.stringify(projects));
        localStorage.setItem('writer_current_project_id',currentProjectId);
    } catch(e) {
        if (e.name === 'QuotaExceededError') {
            alert("⚠️ Stockage plein ! Supprimez d'anciens projets.");
        }
    }
}

function getCurrentProject(){ return projects.find(p=>p.id===currentProjectId); }

function loadProjectIntoUI(){
    const proj=getCurrentProject(); if(!proj) return;
    document.getElementById('globalTitle').value=proj.data.book.title||proj.title;
    refreshPageDropdown(); currentPageId = null; selectedPanelIndex=0; loadPageData();
}

function activateModule(mode) { 
    currentActiveModule = mode; 
    
    document.querySelectorAll('.sidebar .menu-item').forEach(e => e.classList.remove('active'));
    const tab = document.getElementById('tab-' + mode);
    if (tab) tab.classList.add('active');

    let color = '#ef4444'; 
    let subText = 'MODULE';

    switch (mode) {
        case 'pocket': color = '#22d3ee'; subText = 'POCKET BOOK'; break;
        case 'comic': color = '#ef4444'; subText = 'BD PRO'; break;
        case 'magazine': color = '#facc15'; subText = 'MAGAZINE'; break; 
        case 'recipe': color = '#f97316'; subText = 'RECETTE'; break; 
        case 'children': color = '#bae6fd'; subText = 'ENFANTS'; break; 
        case 'news': color = '#fef3c7'; subText = 'LE JOURNAL'; break; 
        case 'post': color = '#ffffff'; subText = 'POST'; break; 
        case 'presenta': color = '#a855f7'; subText = 'PRÉSENTA'; break; 
        case 'teaching': color = '#ec4899'; subText = 'TEACHING'; break; 
    }

    document.documentElement.style.setProperty('--accent', color);
    
    const logoSub = document.querySelector('.logo-sub');
    if (logoSub) logoSub.textContent = subText;
    
    loadPageData();
}

function loadPageData(){
    const proj=getCurrentProject(); if(!proj || !proj.data.book.items.length) return;
    if(!currentPageId) currentPageId = proj.data.book.items[0].id;
    const item=proj.data.book.items.find(i=>i.id===currentPageId); if(!item) return;

    // 1. On cache tout par défaut
    document.getElementById('bdFullEditor').style.display = 'none';
    const pocketEditor = document.getElementById('pocketFullEditor');
    const magEditor = document.getElementById('magFullEditor');
    if(pocketEditor) pocketEditor.style.display = 'none';
    if(magEditor) magEditor.style.display = 'none';

    // 2. Gestion de la page de couverture vs page normale
    if(item.type==='cover'){
        document.getElementById('globalTitleGroup').style.display='flex';
        document.getElementById('itemTitleGroup').style.display='none';
    } else {
        document.getElementById('globalTitleGroup').style.display='none';
        document.getElementById('itemTitleGroup').style.display='flex';
        document.getElementById('itemTitle').value=item.title||'';
        
        // 3. On affiche le bon éditeur selon le module actif
        if (currentActiveModule === 'comic') {
            document.getElementById('bdFullEditor').style.display='flex';
            ensureBDData(item);
            if(selectedPanelIndex===null) selectedPanelIndex=0;
            renderBDTemplatesList(); renderBDCanvas();
        } 
        else if (currentActiveModule === 'pocket') {
            if(pocketEditor) pocketEditor.style.display='flex';
            // Placeholder for loading saved text data later
        } 
        else if (currentActiveModule === 'magazine') {
            if(magEditor) magEditor.style.display='flex';
            // Placeholder for loading saved text/image data later
        }
    }
    refreshPageDropdown();
}

function renderBDTemplatesList(){
    const container=document.getElementById('bdTemplatesList'); if(!container) return;
    container.innerHTML=''; const curItem=getCurrentProject()?.data.book.items.find(i=>i.id===currentPageId);
    const curTmpl=curItem?.bdTemplate||'full';

    BD_TEMPLATES.forEach(t=>{
        let div=document.createElement('div'); div.className='template-thumb'+(curTmpl===t.id?' active':''); div.title=t.name;
        t.rects.forEach(r=>{
            let p=document.createElement('div');
            p.style.cssText=`position:absolute;left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;background:rgba(255,255,255,0.9);border:1px solid #111;box-sizing:border-box`;
            div.appendChild(p);
        });
        div.onclick=()=>setBDTemplate(t.id); container.appendChild(div);
    });
}

function setBDTemplate(id){
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); if(!item) return; ensureBDData(item);
    let rects=getTemplateRects(id); let newPanels=[];
    for(let i=0;i<rects.length;i++){
        if(i<item.bdPanels.length) newPanels.push(item.bdPanels[i]);
        else newPanels.push({id:uid(), image:'', tx:0,ty:0,scale:1,rot:0});
    }
    item.bdPanels=newPanels; item.bdTemplate=id; item.bdTemplateRects=rects;
    selectedPanelIndex=0; renderBDTemplatesList(); renderBDCanvas(); autoSave();
}

function getTailSVG(tailType, bgColor) {
    if(tailType === 'none') return '';
    let path = ''; let extraStyles = '';
    const strokeW = 2.5;
    if(tailType === 'bc') {
        path = `M 2 0 Q 12 10 12 24 Q 16 10 22 0`;
        extraStyles = `bottom:-23px; left:50%; transform:translateX(-50%); width:24px; height:24px;`;
    } else if(tailType === 'bl') {
        path = `M 0 0 Q 0 15 15 24 Q 8 10 12 0`;
        extraStyles = `bottom:-23px; left:20%; width:24px; height:24px;`;
    } else if(tailType === 'br') {
        path = `M 24 0 Q 24 15 9 24 Q 16 10 12 0`;
        extraStyles = `bottom:-23px; right:20%; width:24px; height:24px;`;
    } else if(tailType === 'thought') {
        return `<svg width="20" height="28" viewBox="0 0 20 28" style="position:absolute; bottom:-26px; left:20%; z-index:-1; overflow:visible;">
            <circle cx="10" cy="5" r="5" fill="${bgColor}" stroke="#111" stroke-width="${strokeW}"/>
            <circle cx="6" cy="16" r="3.5" fill="${bgColor}" stroke="#111" stroke-width="${strokeW}"/>
            <circle cx="2" cy="24" r="2" fill="${bgColor}" stroke="#111" stroke-width="${strokeW}"/>
        </svg>`;
    } else if(tailType === 'zap') {
        path = `M 6 0 L 14 12 L 6 12 L 12 24`;
        extraStyles = `bottom:-23px; left:25%; width:20px; height:24px;`;
    }
    return `<svg viewBox="0 0 24 24" style="position:absolute; z-index:-1; overflow:visible; ${extraStyles}">
        <path d="${path}" fill="${bgColor}" stroke="#111" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function createBubbleElement(b) {
    let div = document.createElement('div');
    div.className = 'bd-bubble shape-' + b.shape + (selectedBubbleId === b.id ? ' selected' : '');
    div.dataset.bubbleId = b.id;
    
    div.style.left = b.x + '%';
    div.style.top = b.y + '%';
    div.style.width = b.w + '%';
    div.style.fontFamily = b.fontFamily;
    div.style.fontSize = b.fontSize + 'px';
    div.style.background = b.bgColor;
    div.style.transform = 'translate(-50%, -50%)';

    div.innerHTML = `<span>${esc(b.text)}</span>` + getTailSVG(b.tail, b.bgColor);

    div.addEventListener('mousedown', (e) => onBubbleMouseDown(e, b.id));
    div.addEventListener('click', (e) => { e.stopPropagation(); selectBubble(b.id); });
    div.addEventListener('dblclick', (e) => { e.stopPropagation(); selectBubble(b.id); document.getElementById('bdBubbleText').focus(); });

    return div;
}

function renderBDCanvas(){
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); if(!item || item.type!=='chapter') return;
    ensureBDData(item);
    const bgLayer=document.getElementById('bdBgLayer'); const gridContainer=document.getElementById('bdGridContainer'); const pageLayer=document.getElementById('bdBubblesPageLayer');
    if(!bgLayer||!gridContainer) return;
    bgLayer.innerHTML=''; gridContainer.innerHTML=''; if(pageLayer) pageLayer.innerHTML='';

    if(item.bdBgImage){
        let img=document.createElement('img');
        img.src=item.bdBgImage; img.style.cssText=`position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transform:translate(${item.bdBg.tx||0}px, ${item.bdBg.ty||0}px) scale(${item.bdBg.scale||1});transform-origin:center center;pointer-events:none;`;
        bgLayer.appendChild(img);
    }

    item.bdTemplateRects.forEach((rect, idx)=>{
        let panelData=item.bdPanels[idx]; if(!panelData) return;
        let panelDiv=document.createElement('div');
        panelDiv.className='bd-panel'+(selectedPanelIndex===idx?' selected':'');
        panelDiv.style.cssText=`left:${rect.x}%; top:${rect.y}%; width:${rect.w}%; height:${rect.h}%;`;
        panelDiv.dataset.index=idx;

        if(panelData.image){
            let img=document.createElement('img'); img.src=panelData.image;
            img.style.transform=`translate(${panelData.tx||0}px, ${panelData.ty||0}px) scale(${panelData.scale||1}) rotate(${panelData.rot||0}deg)`;
            panelDiv.appendChild(img);
        } else {
            panelDiv.innerHTML=`<div class="bd-panel-placeholder"><span>URL Image =></span></div>`;
        }

        let bubblesInPanel=item.bdBubbles.filter(b=>b.panelIndex===idx);
        bubblesInPanel.forEach(b=>{ panelDiv.appendChild(createBubbleElement(b)); });

        panelDiv.addEventListener('mousedown', (e)=>onPanelMouseDown(e, idx));
        panelDiv.addEventListener('wheel', (e)=>onPanelWheel(e, idx), {passive:false});
        panelDiv.addEventListener('click', (e)=>{ if(e.target.closest('.bd-bubble')) return; selectPanel(idx); });
        
        gridContainer.appendChild(panelDiv);
    });

    if(pageLayer){
        pageLayer.style.pointerEvents='none';
        let pageBubbles=item.bdBubbles.filter(b=>b.panelIndex===null || b.panelIndex===undefined);
        pageBubbles.forEach(b=>{ let el=createBubbleElement(b); el.style.pointerEvents='auto'; pageLayer.appendChild(el); });
    }
}

function selectPanel(idx){
    selectedPanelIndex=idx; selectedBubbleId=null; renderBDCanvas();
    document.getElementById('bdPanelTools').style.display='flex';
    document.getElementById('bdBubbleEdit').style.display='none';
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); const p=item.bdPanels[idx];
    if(p){
        document.getElementById('bdSelectedPanelLabel').textContent='Case '+(idx+1);
        document.getElementById('bdPanelImageUrl').value=p.image||'';
        document.getElementById('bdPanelScale').value=p.scale||1; document.getElementById('bdPanelScaleVal').textContent=Math.round((p.scale||1)*100)+'%';
    }
}

function onPanelUrlChange(val){
    if(selectedPanelIndex===null) return; const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    item.bdPanels[selectedPanelIndex].image=val; renderBDCanvas(); autoSave();
}
function onPanelScale(val){
    if(selectedPanelIndex===null) return; const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    item.bdPanels[selectedPanelIndex].scale=parseFloat(val); document.getElementById('bdPanelScaleVal').textContent=Math.round(parseFloat(val)*100)+'%'; renderBDCanvas(); autoSave();
}
function clearPanelImage(){
    if(selectedPanelIndex===null) return; const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    item.bdPanels[selectedPanelIndex].image=''; renderBDCanvas(); autoSave();
}

function onBDBgUrlChange(val){ const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); ensureBDData(item); item.bdBgImage=val; renderBDCanvas(); autoSave(); }
function onBDBgScale(val){ const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); ensureBDData(item); item.bdBg.scale=parseFloat(val); document.getElementById('bdBgScaleVal').textContent=Math.round(parseFloat(val)*100)+'%'; renderBDCanvas(); autoSave(); }

function onPanelMouseDown(e, idx){
    if(e.target.closest('.bd-bubble')) return;
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); ensureBDData(item);
    const panel=item.bdPanels[idx]; if(!panel.image) return;
    dragState={type:'panelImage', idx, startX:e.clientX, startY:e.clientY, origTx:panel.tx||0, origTy:panel.ty||0};
    e.preventDefault();
}
function onPanelWheel(e, idx){
    e.preventDefault(); const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); ensureBDData(item);
    const panel=item.bdPanels[idx]; if(!panel.image) return;
    if(e.shiftKey){
        panel.rot=(panel.rot||0)+(e.deltaY>0?-3:3);
    } else {
        panel.scale=Math.min(15,Math.max(0.1,(panel.scale||1)+(e.deltaY>0?-0.07:0.07)));
        if(selectedPanelIndex===idx){ document.getElementById('bdPanelScale').value=panel.scale; document.getElementById('bdPanelScaleVal').textContent=Math.round(panel.scale*100)+'%'; }
    }
    renderBDCanvas(); autoSave();
}

function addBDBubble(shape, tail){
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); ensureBDData(item);
    let newBubble={ id:uid(), panelIndex:selectedPanelIndex, shape:shape, tail:tail, text:'TEXTE', x:50, y:30, w:30, fontFamily:"'Bangers', cursive", fontSize:14, bgColor:'#ffffff' };
    item.bdBubbles.push(newBubble); selectedBubbleId=newBubble.id;
    renderBDCanvas(); selectBubble(newBubble.id); autoSave();
}

function onBubbleMouseDown(e, bubbleId){
    e.stopPropagation(); const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    let bubble=item.bdBubbles.find(b=>b.id===bubbleId); if(!bubble) return;
    let panelEl=e.target.closest('.bd-panel'); let parentRect=panelEl?panelEl.getBoundingClientRect():document.getElementById('bdCanvasEnhancedWrap').getBoundingClientRect();
    dragState={type:'bubble', bubbleId, startX:e.clientX, startY:e.clientY, origX:bubble.x, origY:bubble.y, parentRect};
    selectBubble(bubbleId); e.preventDefault();
}

function selectBubble(id){
    selectedBubbleId=id; const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    let bubble=item.bdBubbles.find(b=>b.id===id); if(!bubble) return;
    document.getElementById('bdBubbleEdit').style.display='flex';
    document.getElementById('bdBubbleText').value=bubble.text;
    document.getElementById('bdBubbleFont').value=bubble.fontFamily;
    document.getElementById('bdBubbleSize').value=bubble.fontSize; document.getElementById('bdBubbleSizeVal').textContent=bubble.fontSize+'px';
    document.getElementById('bdBubbleWidth').value=bubble.w || 30; document.getElementById('bdBubbleWidthVal').textContent=(bubble.w || 30)+'%';
    document.getElementById('bdBubbleBg').value=bubble.bgColor || '#ffffff';
    renderBDCanvas();
}

function onBubbleTextChange(val){
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    let bubble=item.bdBubbles.find(b=>b.id===selectedBubbleId);
    if(bubble){
        bubble.text=val;
        let el=document.querySelector(`[data-bubble-id="${bubble.id}"] span`); 
        if(el) el.textContent=val; 
        autoSave();
    }
}
function onBubbleFontChange(val){ const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); let bubble=item.bdBubbles.find(b=>b.id===selectedBubbleId); if(bubble){ bubble.fontFamily=val; renderBDCanvas(); autoSave(); } }
function onBubbleSize(val){ const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); let bubble=item.bdBubbles.find(b=>b.id===selectedBubbleId); if(bubble){ bubble.fontSize=parseInt(val); document.getElementById('bdBubbleSizeVal').textContent=val+'px'; renderBDCanvas(); autoSave(); } }
function onBubbleWidth(val){ const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); let bubble=item.bdBubbles.find(b=>b.id===selectedBubbleId); if(bubble){ bubble.w=parseInt(val); document.getElementById('bdBubbleWidthVal').textContent=val+'%'; renderBDCanvas(); autoSave(); } }
function onBubbleBg(val){ const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); let bubble=item.bdBubbles.find(b=>b.id===selectedBubbleId); if(bubble){ bubble.bgColor=val; document.getElementById('bdBubbleBg').value=val; renderBDCanvas(); autoSave(); } }

function deleteSelectedBubble(){
    if(!selectedBubbleId) return; const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    item.bdBubbles=item.bdBubbles.filter(b=>b.id!==selectedBubbleId);
    selectedBubbleId=null; document.getElementById('bdBubbleEdit').style.display='none'; renderBDCanvas(); autoSave();
}
function duplicateBubble(){
    if(!selectedBubbleId) return; const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    let orig=item.bdBubbles.find(b=>b.id===selectedBubbleId); if(!orig) return;
    let copy={...orig, id:uid(), x:Math.min(90,orig.x+5), y:Math.min(90,orig.y+5)};
    item.bdBubbles.push(copy); selectedBubbleId=copy.id; renderBDCanvas(); selectBubble(copy.id); autoSave();
}

document.addEventListener('mousemove', (e)=>{
    if(!dragState) return;
    const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId); if(!item) return;
    if(dragState.type==='panelImage'){
        let dx=e.clientX-dragState.startX, dy=e.clientY-dragState.startY;
        let panel=item.bdPanels[dragState.idx]; panel.tx=dragState.origTx+dx; panel.ty=dragState.origTy+dy;
        let img=document.querySelector(`.bd-panel[data-index="${dragState.idx}"] img`);
        if(img) img.style.transform=`translate(${panel.tx}px,${panel.ty}px) scale(${panel.scale}) rotate(${panel.rot}deg)`;
    } else if(dragState.type==='bubble'){
        let dx=e.clientX-dragState.startX, dy=e.clientY-dragState.startY;
        let newLeft=dragState.origX+(dx/dragState.parentRect.width)*100;
        let newTop=dragState.origY+(dy/dragState.parentRect.height)*100;
        let bubble=item.bdBubbles.find(b=>b.id===dragState.bubbleId);
        if(bubble){
            bubble.x=Math.max(5,Math.min(95,newLeft)); bubble.y=Math.max(5,Math.min(95,newTop));
            let el=document.querySelector(`[data-bubble-id="${bubble.id}"]`);
            if(el){ el.style.left=bubble.x+'%'; el.style.top=bubble.y+'%'; }
        }
    }
});
document.addEventListener('mouseup', ()=>{
    if(dragState){
        if(dragState.type==='bubble' || dragState.type==='panelImage'){ renderBDCanvas(); autoSave(); }
        dragState=null;
    }
});

function prevPage(){
    const items=getCurrentProject().data.book.items; const idx=items.findIndex(i=>i.id===currentPageId);
    if(idx>0){ selectPage(items[idx-1].id); }
}
function nextPage(){
    const items=getCurrentProject().data.book.items; const idx=items.findIndex(i=>i.id===currentPageId);
    if(idx<items.length-1){ selectPage(items[idx+1].id); }
}

function _doSaveCore() {
    const proj=getCurrentProject(); if(!proj) return;
    const item=proj.data.book.items.find(i=>i.id===currentPageId); if(!item) return;
    if(item.type==='cover'){
        const nt=document.getElementById('globalTitle').value.trim()||'Mon Comic';
        proj.title=nt; proj.data.book.title=nt; item.showTitle=true;
    }
    if(document.getElementById('itemTitle')) item.title=document.getElementById('itemTitle').value.trim()||'Page';
    
    proj.updatedAt=Date.now(); saveProjects();
    const ind=document.getElementById('syncIndicator'); if(ind) ind.innerHTML='<i class="fas fa-check-circle"></i> sync';
    document.getElementById('savedToast').classList.add('show'); setTimeout(()=>document.getElementById('savedToast').classList.remove('show'),1500);
}

function autoSave(){
    const ind=document.getElementById('syncIndicator'); if(ind) ind.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> sync';
    clearTimeout(window._t); window._t=setTimeout(_doSaveCore, 1500);
}
function manualSave(){ clearTimeout(window._t); _doSaveCore(); }

function addPage(){
    const proj=getCurrentProject(); const nid='ch_'+Date.now();
    const newItem={id:nid,type:'chapter',title:`Page ${proj.data.book.items.length}`,bdTemplate:'blacksad',bdTemplateRects:getTemplateRects('blacksad'),bdBgImage:'',bdBg:{tx:0,ty:0,scale:1,rot:0},bdPanels:[{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0},{id:uid(),image:'',tx:0,ty:0,scale:1,rot:0}],bdBubbles:[]};
    proj.data.book.items.push(newItem);
    currentPageId=nid; selectedPanelIndex=0; saveProjects(); loadProjectIntoUI(); autoSave();
}
function deletePage(){
    const it=getCurrentProject().data.book.items.find(i=>i.id===currentPageId);
    if(it.type==='cover') return alert('Page cover non supprimable');
    if(!confirm('Supprimer cette page ?')) return;
    getCurrentProject().data.book.items=getCurrentProject().data.book.items.filter(i=>i.id!==currentPageId);
    currentPageId=getCurrentProject().data.book.items[0].id;
    saveProjects(); loadProjectIntoUI();
}

function buildBDHTML(item){
    ensureBDData(item);
    let rects=item.bdTemplateRects||[{x:0,y:0,w:100,h:100}];
    let html=`<div style="position:relative;width:100%;max-width:800px;margin:0 auto;aspect-ratio:1/1.414;background:#fff;border:3.5px solid #111;overflow:hidden;box-sizing:border-box">`;
    if(item.bdBgImage) html+=`<img src="${item.bdBgImage}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:translate(${item.bdBg.tx||0}px,${item.bdBg.ty||0}px) scale(${item.bdBg.scale||1});" />`;
    
    function genBubble(b, z){
        let sType = b.shape||'oval';
        let bShape = '';
        if(sType==='oval') bShape='border-radius:50%/50%;';
        else if(sType==='round') bShape='border-radius:50%; aspect-ratio:1/1;';
        else if(sType==='rect') bShape='border-radius:8px;';
        else if(sType==='capsule') bShape='border-radius:999px;';
        else if(sType==='cloud') bShape='border-radius:42% 58% 55% 45% / 48% 42% 58% 52%;';
        
        let shadow = (sType==='burst') ? 'border:none; box-shadow:none;' : 'border:2.5px solid #111; box-shadow: 4px 4px 0px rgba(17,17,17,1);';
        if(sType==='burst') bShape='clip-path: polygon(50% 0%, 66% 10%, 86% 2%, 76% 26%, 100% 22%, 84% 42%, 100% 62%, 82% 72%, 96% 96%, 68% 84%, 50% 100%, 32% 84%, 4% 96%, 18% 72%, 0% 62%, 16% 42%, 0% 22%, 24% 26%, 14% 2%, 34% 10%); padding:1.5em;';
        
        let tailStr = getTailSVG(b.tail, b.bgColor);
        return `<div style="position:absolute; left:${b.x}%; top:${b.y}%; width:${b.w}%; transform:translate(-50%,-50%); background:${b.bgColor}; font-family:${b.fontFamily}; font-size:${b.fontSize}px; font-weight:700; color:#111; white-space:pre-wrap; overflow-wrap:break-word; text-align:center; box-sizing:border-box; display:flex; align-items:center; justify-content:center; z-index:${z}; line-height:1.15; padding:0.8em 1.2em; ${bShape} ${shadow}"><span>${esc(b.text)}</span>${tailStr}</div>`;
    }

    rects.forEach((r,i)=>{
        let p=item.bdPanels[i]; if(!p) return;
        html+=`<div style="position:absolute;left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;border:2.5px solid #111;overflow:hidden;background:#fff;box-sizing:border-box">`;
        if(p.image) html+=`<img src="${p.image}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transform:translate(${p.tx||0}px,${p.ty||0}px) scale(${p.scale||1}) rotate(${p.rot||0}deg);" />`;
        item.bdBubbles.filter(b=>b.panelIndex===i).forEach(b=>{ html+=genBubble(b, 10); });
        html+=`</div>`;
    });
    item.bdBubbles.filter(b=>b.panelIndex===null || b.panelIndex===undefined).forEach(b=>{ html+=genBubble(b, 15); });
    
    html+=`</div>`; return html;
}

function openPreview(){
    autoSave(); const proj=getCurrentProject(); const item=proj.data.book.items.find(i=>i.id===currentPageId);
    if(item.type!=='chapter') return alert("Aperçu disponible pour les pages BD uniquement.");
    document.getElementById('prvContent').innerHTML=buildBDHTML(item);
    document.getElementById('previewModal').classList.add('active');
}
function closePreview(){ document.getElementById('previewModal').classList.remove('active'); }

window.onload=()=>{
    try { loadProjects(); bootstrapApp(); } catch(e) {}
};
