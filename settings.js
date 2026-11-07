(async function(){
  'use strict';
  const api=chrome,$=id=>document.getElementById(id);
  let s,profiles={},tab='panel',draft=null,preview,review=null,busy=false,dragTool=null,designDescription='',generateControl;
  let previewAppearance='',anchorPoint={x:.55,y:.57},anchorDrag=null,previewAnchor;
  const t=(k,v)=>TH.t(s?.locale||api.i18n.getUILanguage(),k,v);
  async function send(m){const r=await api.runtime.sendMessage(m);if(!r?.ok)throw new Error(r?.error||'disconnected');return r.data;}
  function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  const fail=e=>status(t(e.message),true);
  // Serialize writes. Each message changes just the fields edited by this control.
  let saves=Promise.resolve();
  function save(patch,rerender=false){
    s=TH.normalize({...s,...patch,translation:{...s.translation,...patch.translation},placement:{...s.placement,...patch.placement}},s.locale);updatePreview();
    saves=saves.then(()=>send({type:'th:update-settings',patch})).then(()=>{status(t('saved'));if(rerender)render();}).catch(fail);return saves;
  }
  function el(tag,text,className){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(className)n.className=className;return n;}
  function button(text,fn,className=''){const b=el('button',text,className);b.type='button';b.onclick=()=>Promise.resolve(fn()).catch(fail);return b;}
  function heading(parent,key,description){parent.append(el('h2',t(key)));if(description)parent.append(el('p',t(description),'hint'));}
  function field(parent,key,input){const l=el('label',null,'field');input.setAttribute('aria-label',t(key));l.append(el('span',t(key)),input);parent.append(l);return input;}
  function check(parent,key,value,fn){const l=el('label',null,'check'),i=document.createElement('input');i.type='checkbox';i.checked=value;i.onchange=()=>fn(i.checked);l.append(i,el('span',t(key)));parent.append(l);return i;}
  function input(value,type='text'){const i=document.createElement('input');i.type=type;i.value=value;return i;}
  function select(options,value,fn){const n=document.createElement('select');for(const [id,label]of Object.entries(options)){const o=el('option',label);o.value=id;n.append(o);}n.value=value;n.onchange=()=>fn(n.value);return n;}
  function range(parent,key,value,min,max,fn,step=1){const i=input(value,'range');i.min=min;i.max=max;i.step=step;i.value=value;const label=el('label',null,'field'),caption=el('span',t(key)+' · '+value);i.oninput=()=>{caption.textContent=t(key)+' · '+i.value;fn(Number(i.value));};label.append(caption,i);parent.append(label);return i;}
  function options(extra={}){return {...extra,...TH.providers};}
  function viewSettings(){return draft?{...s,...draft,tokens:{...draft.tokens}}:s;}
  function updatePreview(){
    if(!preview||preview.drag)return;
    const next=viewSettings();
    const {locale,tools,visible,customSearch,labels,pin,preset,tokens,css,compact,font,motion}=next;
    const appearance=JSON.stringify([locale,tools,visible,customSearch.label,labels,pin,preset,tokens,css,compact,font,motion]);
    if(appearance!==previewAppearance){preview.update(next);previewAppearance=appearance;}
    const v=preview.bounds(),x=TH.clamp(anchorPoint.x*v.w,18,v.w-30),y=TH.clamp(anchorPoint.y*v.h,30,v.h-35);
    preview.host.style.width='max-content';preview.host.style.maxWidth=Math.max(24,Math.min(s.width,v.w-16))+'px';
    const a=previewAnchor={left:Math.max(8,x-110),right:x,top:y-23,bottom:y-3,cursorX:x,cursorY:y,focusX:x,forward:true};
    $('preview-cursor').style.left=x+'px';$('preview-cursor').style.top=y+'px';
    $('preview-guide-x').style.left=x+'px';$('preview-guide-y').style.top=y+'px';
    $('preview-selection').style.left=a.left+'px';$('preview-selection').style.top=a.top+'px';$('preview-selection').style.width=(a.right-a.left)+'px';
    const size=preview.measure(),p=TH.position(s.placement,a,size,v);preview.move(p.x,p.y);
    const point=TH.normalizedPoint(p.x,p.y,size,v);
    $('preview-coordinates').textContent=s.placement.mode==='relative'
      ?'ΔX '+s.placement.offset.x+' px · ΔY '+s.placement.offset.y+' px'
      :'X '+Math.round(point.x*100)+'% · Y '+Math.round(point.y*100)+'%';
  }
  try{s=await send({type:'th:get-settings'});profiles=await send({type:'th:profiles'});}catch(e){fail(e);return;}
  preview=new THPanel($('preview-panel'),s,{onAction:id=>{preview.notify(t('demoAction',{tool:id==='custom'?s.customSearch.label:t(id)}));},onClose:()=>preview.notify(t('preview')),onPin:v=>save({pin:v}),onResize:updatePreview,onDrag:(point,normalized)=>save({placement:TH.draggedPlacement(s.placement,point,normalized,previewAnchor,preview.measure())},true)},true);
  function editPlacement(value){document.body.classList.toggle('placement-edit',value);$('edit-placement').hidden=value;$('close-placement').hidden=!value;$('preview-coordinates').hidden=!value;requestAnimationFrame(updatePreview);}
  $('edit-placement').onclick=()=>editPlacement(true);$('close-placement').onclick=()=>editPlacement(false);
  const stage=$('preview-stage'),cursor=$('preview-cursor');
  function moveAnchor(e){const r=stage.getBoundingClientRect();anchorPoint={x:TH.clamp((e.clientX-r.left-stage.clientLeft)/stage.clientWidth,0,1),y:TH.clamp((e.clientY-r.top-stage.clientTop)/stage.clientHeight,0,1)};updatePreview();}
  stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.composedPath().includes($('preview-panel'))||e.composedPath().includes(cursor))return;moveAnchor(e);});
  cursor.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();cursor.focus();anchorDrag={point:{...anchorPoint},id:e.pointerId};cursor.setPointerCapture(e.pointerId);});
  cursor.addEventListener('pointermove',e=>{if(anchorDrag?.id===e.pointerId)moveAnchor(e);});
  cursor.addEventListener('pointerup',e=>{if(anchorDrag?.id!==e.pointerId)return;anchorDrag=null;cursor.releasePointerCapture(e.pointerId);});
  const cancelAnchor=()=>{if(!anchorDrag)return;anchorPoint=anchorDrag.point;anchorDrag=null;updatePreview();};
  cursor.addEventListener('pointercancel',cancelAnchor);cursor.addEventListener('lostpointercapture',cancelAnchor);
  cursor.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelAnchor();return;}const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!dir)return;e.preventDefault();const n=e.shiftKey?1:8;anchorPoint={x:TH.clamp(anchorPoint.x+dir[0]*n/stage.clientWidth,0,1),y:TH.clamp(anchorPoint.y+dir[1]*n/stage.clientHeight,0,1)};updatePreview();});
  if(typeof ResizeObserver==='function')new ResizeObserver(updatePreview).observe(stage);
  window.addEventListener('resize',updatePreview);
  const interfaceLanguage=select(TH.languages,s.locale,locale=>{
    draft=null;
    return save({locale},true);
  });
  $('interface-language').append(interfaceLanguage);
  $('enabled').onchange=()=>save({enabled:$('enabled').checked});
  function render(){
    document.documentElement.lang=s.locale;$('tagline').textContent=t('tagline');$('enabled').checked=s.enabled;$('enabled-label').textContent=t(s.enabled?'enabled':'disabled');$('enabled').setAttribute('aria-label',t('enableLabel'));
    interfaceLanguage.setAttribute('aria-label',t('languageLabel'));
    interfaceLanguage.title=t('languageHelp');
    $('review').querySelector('.dialog-close').setAttribute('aria-label',t('close'));
    $('preview-label').textContent=t('preview');$('preview-hint').textContent=t('placementWorkspaceHelp');
    $('edit-placement').textContent=t('editPlacement');$('close-placement').textContent=t('backSettings');
    cursor.setAttribute('aria-label',t('previewCursor'));cursor.title=t('previewCursor');$('preview-cursor-label').textContent=t('previewCursor');$('preview-selection').textContent=t('previewSelection');
    const nav=$('tabs');nav.replaceChildren();nav.setAttribute('role','tablist');
    for(const id of ['panel','style','ai','more']){const b=button(t(id),()=>{tab=id;draft=null;render();});b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab===id));nav.append(b);}
    const c=$('content');c.replaceChildren();({panel:renderPanel,style:renderStyle,ai:renderAI,more:renderMore})[tab](c);updatePreview();
  }
  function renderPanel(c){
    heading(c,'panelTitle','toolsHint');
    const list=el('div');c.append(list);
    for(const id of s.tools){
      const row=el('div',null,'tool-row');row.draggable=true;row.dataset.tool=id;
      const grip=el('span','⠿','drag-order');grip.setAttribute('aria-hidden','true');row.append(grip);
      const v=input('','checkbox');v.checked=s.visible.includes(id);v.setAttribute('aria-label',t('toolVisible',{tool:id==='custom'?s.customSearch.label:t(id)}));
      v.onchange=()=>{const visible=v.checked?[...s.visible,id]:s.visible.filter(x=>x!==id);if(!visible.length){v.checked=true;status(t('needOneTool'),true);return;}save({visible});};
      row.append(v,el('span',id==='custom'?s.customSearch.label:t(id),'name'));
      for(const [delta,arrow,key]of [[-1,'↑','moveUp'],[1,'↓','moveDown']]){const b=button(arrow,()=>reorder(id,s.tools.indexOf(id)+delta));b.setAttribute('aria-label',t(key)+' · '+t(id));b.disabled=s.tools.indexOf(id)+delta<0||s.tools.indexOf(id)+delta>=s.tools.length;row.append(b);}
      row.ondragstart=e=>{dragTool=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);row.classList.add('dragging');};row.ondragend=()=>row.classList.remove('dragging');row.ondragover=e=>e.preventDefault();row.ondrop=e=>{e.preventDefault();if(dragTool)reorder(dragTool,s.tools.indexOf(id));dragTool=null;};list.append(row);
    }
    check(c,'labels',s.labels,v=>save({labels:v}));check(c,'compact',s.compact,v=>save({compact:v}));
    const d=el('details');d.append(el('summary',t('custom')));const name=field(d,'customName',input(s.customSearch.label)),url=field(d,'customURL',input(s.customSearch.url));d.append(button(t('save'),()=>{TH.searchURL(url.value,'test');return save({customSearch:{label:name.value,url:url.value}},true);}));c.append(d);
    const section=el('div',null,'section');c.append(section);heading(section,'position');
    const placementMode=field(section,'position',select(Object.fromEntries(['auto','above','below','cursor','relative','fixed','viewport'].map(id=>[id,t('position'+id[0].toUpperCase()+id.slice(1))])),s.placement.mode,v=>save({placement:{mode:v}},true)));placementMode.id='placement-mode';
    section.append(button(t('editPlacement'),()=>editPlacement(true)));
    if(s.placement.mode==='fixed')field(section,'corner',select({'top-left':t('topLeft'),'top-right':t('topRight'),'bottom-left':t('bottomLeft'),'bottom-right':t('bottomRight')},s.placement.corner,v=>save({placement:{corner:v}})));
    range(section,'gap',s.placement.gap,0,24,v=>save({placement:{gap:v}}));
    check(section,'dragRemember',s.rememberDrag,v=>save({rememberDrag:v}));section.append(el('p',t('dragRememberHelp'),'hint'),button(t('resetPosition'),()=>save({placement:{mode:'auto',gap:10,point:{x:.7,y:.25},offset:{x:0,y:12}}},true),'secondary'));
    check(c,'pin',s.pin,v=>save({pin:v}));check(c,'autoCopy',s.autoCopy,v=>save({autoCopy:v}));
  }
  function reorder(id,index){if(index<0||index>=s.tools.length)return;const tools=s.tools.filter(x=>x!==id);tools.splice(index,0,id);save({tools},true);}
  function renderStyle(c){
    heading(c,'themeTitle');const choices=el('div',null,'presets');
    for(const id of Object.keys(TH.presets)){const b=button(t('theme'+id[0].toUpperCase()+id.slice(1)),()=>{draft=null;return save({preset:id,themeName:id,tokens:{...TH.presets[id]},css:''},true);},id);b.setAttribute('aria-pressed',String(s.preset===id));choices.append(b);}c.append(choices);
    const accents=el('div',null,'row');for(const hex of ['#bda9ff','#9ce1cb','#9dcaff','#ffc4a8']){const b=button('●',()=>{const tokens={...s.tokens,accent:hex,activeFg:'#171521'};TH.validateTheme({version:1,name:s.themeName,tokens});return save({tokens});});b.style.color=hex;b.setAttribute('aria-label',t('accent')+' '+hex);accents.append(b);}c.append(accents);
    check(c,'motion',s.motion,v=>save({motion:v}));range(c,'width',s.width,240,520,v=>save({width:v}));field(c,'font',select({system:t('system'),mono:t('mono'),serif:t('serif')},s.font,v=>save({font:v})));
    const manual=el('details');manual.append(el('summary',t('designer')));c.append(manual);
    const initial=draft||{tokens:{...s.tokens},themeName:s.themeName};
    let tokens={...initial.tokens};const name=field(manual,'themeName',input(initial.themeName));name.maxLength=28;
    const change=(key,value)=>{tokens[key]=value;draft={tokens:{...tokens},themeName:name.value||s.themeName,kind:'manual'};updatePreview();};
    const colors=el('div',null,'grid');manual.append(colors);
    for(const [key,label]of [['bg','background'],['fg','foreground'],['accent','accent'],['activeFg','activeForeground']]){const i=field(colors,label,input(tokens[key],'color'));i.oninput=()=>change(key,i.value);}
    for(const [key,label,min,max,step]of [['round','radius',0,28,1],['size','size',24,42,1],['gap','spacing',0,10,1],['padding','padding',3,10,1],['stroke','stroke',1,3,.1]])range(manual,label,tokens[key],min,max,v=>change(key,v),step);
    field(manual,'shadow',select(Object.fromEntries(['none','soft','glow','hard'].map(x=>[x,t('shadow'+x[0].toUpperCase()+x.slice(1))])),tokens.shadow,v=>change('shadow',v)));
    const border=field(manual,'border',input(tokens.border));border.onchange=()=>{if(!/^(none|[1-3]px solid #[\da-f]{6})$/i.test(border.value)){fail(new Error('themeInvalid'));return;}change('border',border.value);};
    const actions=el('div',null,'actions');actions.append(button(t('apply'),()=>{const theme=TH.validateTheme({version:1,name:name.value,tokens:{...tokens,border:border.value}});draft=null;return save({tokens:theme.tokens,themeName:theme.name},true);},'primary'),button(t('cancel'),()=>{draft=null;render();}));manual.append(actions);
    const ai=el('details');ai.append(el('summary',t('generate')));c.append(ai);
    const description=document.createElement('textarea');description.maxLength=500;description.value=designDescription;description.oninput=()=>{designDescription=description.value;};field(ai,'description',description);
    ai.append(el('p',TH.providers[s.designProvider],'key-status'));
    const generate=button(t('generate'),async()=>{
      if(busy)return;busy=true;generate.disabled=true;
      try{await saves;review=await send({type:'th:review-design',description:description.value});showReview(generate);}catch(e){fail(e);busy=false;generate.disabled=false;}
    },'primary');generate.disabled=busy;generateControl=generate;ai.append(generate);
    if(draft?.kind==='ai'){ai.open=true;ai.append(el('p',t('themeResult',{name:draft.themeName}),'note'));const a=el('div',null,'actions');a.append(button(t('apply'),()=>{const value=TH.validateTheme({version:1,name:draft.themeName,tokens:draft.tokens});draft=null;return save({tokens:value.tokens,themeName:value.name,preset:'matte',css:''},true);},'primary'),button(t('cancel'),()=>{draft=null;render();}));ai.append(a);}
    const prompt=el('details');prompt.append(el('summary',t('systemPrompt')),el('pre',TH_THEME_PROMPT),button(t('copy'),async()=>{await navigator.clipboard.writeText(TH_THEME_PROMPT);status(t('copied'));}));ai.append(prompt);
    const css=el('details');css.append(el('summary','CSS'));const editor=document.createElement('textarea');editor.value=s.css;editor.spellcheck=false;editor.setAttribute('aria-label','CSS');css.append(el('p',t('cssHint'),'hint'),editor,button(t('apply'),()=>save({css:TH.validateCSS(editor.value)}),'primary'));c.append(css);
  }
  function showReview(generateButton){
    const d=$('review-content');d.replaceChildren();d.append(el('h2',t('reviewTitle')),el('p',t('recipient',{provider:review.recipient}),'note'),el('p',t('model')+': '+review.model),el('p',t('designPrivacy')),el('p',t('aiCost')));
    if(review.provider==='openrouter')d.append(el('p',t('routerPrivacy')));if(review.provider==='ollama')d.append(el('p',t('localPrivacy')));d.append(el('p',t('previewOnly'),'hint'));
    const actions=el('div',null,'actions');
    actions.append(button(t('cancel'),()=>{$('review').close();}),button(t('sendRequest'),async()=>{
      const token=review.token;review=null;$('review').close();status(t('loading'));
      try{const theme=await send({type:'th:generate-design',token});draft={tokens:theme.tokens,themeName:theme.name,kind:'ai'};busy=false;status(t('themeResult',{name:theme.name}));render();}catch(e){fail(e);}finally{busy=false;generateButton.disabled=false;if(generateControl)generateControl.disabled=false;}
    },'primary'));d.append(actions);$('review').showModal();
  }
  $('review').addEventListener('close',()=>{if(review){send({type:'th:cancel-review',token:review.token}).catch(()=>{});review=null;busy=false;if(generateControl)generateControl.disabled=false;}});
  function renderAI(c){
    heading(c,'assignments');field(c,'translate',select(options({google:'Google Translate',mymemory:'MyMemory'}),s.translation.provider,v=>save({translation:{provider:v}})));field(c,'correct',select(options({lt:'LanguageTool'}),s.correction,v=>save({correction:v})));field(c,'designTask',select(TH.providers,s.designProvider,v=>save({designProvider:v})));
    c.append(el('p',t('memoryPrivacy'),'hint'));
    c.append(el('p',t('aiCost'),'hint'));heading(c,'profiles','profileHelp');
    for(const [id,label]of Object.entries(TH.providers)){
      const d=el('details');d.append(el('summary',label));c.append(d);const p=profiles[id]||{};
      const model=field(d,'optionalModel',input(p.model||''));model.placeholder=t('automaticModel');
      const key=field(d,'apiKey',input('','password'));key.autocomplete='new-password';key.placeholder=p.hasKey?t('keyStored'):t('apiPlaceholder');
      const clear=check(d,'clearKey',false,()=>{});let base;
      if(['ollama','custom'].includes(id))base=field(d,'baseUrl',input(p.base||''));
      if(id==='ollama')d.append(el('p',t('localPrivacy'),'hint'));if(id==='openrouter')d.append(el('p',t('routerPrivacy'),'hint'));
      const b=button(t('permissionButton'),async()=>{
        const value=THProviders.profile(id,{model:model.value,key:key.value,base:base?.value||p.base});
        const allowed=await api.permissions.request({origins:[THProviders.originPattern(id,value)]});if(!allowed)throw new Error('permissionMissing');
        profiles[id]=await send({type:'th:save-profile',provider:id,model:value.model,base:value.base,key:key.value,clearKey:clear.checked});key.value='';clear.checked=false;key.placeholder=profiles[id].hasKey?t('keyStored'):t('apiPlaceholder');status(t('saved'));
      },'primary');d.append(b);
    }
    c.append(el('p',t('dataNotice'),'notice'));
  }
  function renderMore(c){
    heading(c,'targetLanguage','langIndependent');
    const langOptions=Object.fromEntries(Object.entries(TH.textLanguages).filter(([code])=>code!=='auto'));
    field(c,'sourceLanguage',select({auto:t('autoSource'),...langOptions},s.translation.source,v=>save({translation:{source:v}})));
    field(c,'targetLanguage',select({auto:t('autoTarget'),...langOptions},s.translation.target,v=>save({translation:{target:v}})));
    const blocked=el('div',null,'section');heading(blocked,'blocked');c.append(blocked);
    for(const host of s.blockedDomains){const row=el('div',null,'row');row.append(el('span',host,'grow'),button(t('unblock'),()=>save({blockedDomains:s.blockedDomains.filter(x=>x!==host)},true)));blocked.append(row);}
    if(s.hiddenUntil>Date.now())blocked.append(button(t('resume'),()=>save({hiddenUntil:0},true)));
    c.append(el('h3',t('help')),button(t('returnLearning'),()=>send({type:'th:open-help'})),el('p',t('restrictedPages'),'hint'),el('p',t('dataNotice'),'notice'));
    c.append(el('small','TextHelper 10.0.14'));
    const privacy=el('a','Data & privacy · English');privacy.href=api.runtime.getURL('privacy.html');privacy.target='_blank';privacy.rel='noopener noreferrer';c.append(privacy);
  }
  render();
})();
