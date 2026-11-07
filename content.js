(async function(){
  'use strict';
  if(globalThis.__texthelper10)return;globalThis.__texthelper10=true;
  const api=chrome;
  async function message(value){let r;try{r=await api.runtime.sendMessage(value);}catch{throw new Error('disconnected');}if(!r?.ok)throw Object.assign(new Error(r?.error||'disconnected'),{retryAfter:r?.retryAfter});return r.data;}
  let settings;try{settings=await message({type:'th:get-settings'});}catch{return;}
  const host=document.createElement('texthelper-panel');host.style.display='none';host.style.width='max-content';document.documentElement.append(host);
  let anchor=null,temporary=null,range=null,field=null,currentText='',requestEpoch=0,open=false,lastDown={x:0,y:0},lastCursor={x:0,y:0},selectionTimer,hideTimer,requesting=false;
  const tr=(k,values)=>TH.t(settings.locale,k,values);
  const panel=new THPanel(host,settings,{onAction:act,onClose:hide,onPin:async value=>{try{settings=await message({type:'th:panel-preference',pin:value});panel.update(settings);reposition();}catch(e){panel.notify(tr(e.message));}},onDrag:(point,normalized)=>{
    temporary=point;
    if(settings.rememberDrag) message({type:'th:panel-preference',placement:TH.draggedPlacement(settings.placement,point,normalized,anchor,panel.measure())}).catch(e=>panel.notify(tr(e.message)));
  },onResize:reposition,onTarget:async target=>{try{settings=await message({type:'th:panel-preference',target});await run('translate');}catch(e){panel.notify(tr(e.message));}}});
  function allowed(){return settings.enabled && settings.hiddenUntil<=Date.now() && !settings.blockedDomains.includes(location.hostname);}
  function inside(event){return event.composedPath().includes(host);}
  function hide(){if(panel.drag)return;open=false;requestEpoch++;requesting=false;host.style.display='none';}
  function reposition(){
    if(!open||!anchor||panel.drag)return;
    host.style.maxWidth=Math.max(24,Math.min(settings.width,window.innerWidth-16))+'px';
    const size=panel.measure(),v={w:window.innerWidth,h:window.innerHeight};
    const p=temporary?panel.bounded(temporary.x,temporary.y):TH.position(settings.placement,anchor,size,v);panel.move(p.x,p.y);
  }
  function show(){
    if(!allowed())return;
    clearTimeout(hideTimer);
    requestEpoch++;requesting=false;temporary=null;panel.update(settings);open=true;host.style.display='block';
    reposition();
  }
  function editableElement(){const a=document.activeElement;return a && ((a.tagName==='TEXTAREA')||(a.tagName==='INPUT'&&['text','search','email','url','tel'].includes(a.type)))?a:null;}
  function capture(cursor,keyboard=false){
    if(!allowed()||panel.drag)return;
    const input=editableElement();
    if(input){
      const start=input.selectionStart,end=input.selectionEnd;if(start==null||end==null||end-start<2)return;
      const text=input.value.slice(start,end);if(!text.trim())return;
      field={el:input,start,end,original:text};range=null;currentText=text;
      const r=input.getBoundingClientRect();anchor={left:r.left,right:r.right,top:r.top,bottom:r.bottom,cursorX:cursor.x,cursorY:cursor.y};
      if(!keyboard)anchor={left:cursor.x,right:cursor.x,top:cursor.y,bottom:cursor.y,cursorX:cursor.x,cursorY:cursor.y};
    }else{
      const selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return;
      const saved=selection.getRangeAt(0).cloneRange();
      if(host.contains(saved.commonAncestorContainer)||saved.commonAncestorContainer===host)return;
      const text=selection.toString();if(text.trim().length<2)return;
      // Ignore password fields and selections inside our own isolated panel.
      if(saved.commonAncestorContainer.parentElement?.closest('texthelper-panel,input[type=password]'))return;
      range=saved;field=null;currentText=text;
      const rects=[...saved.getClientRects()].filter(r=>r.width&&r.height);
      const forward=selection.focusNode!==saved.startContainer||selection.focusOffset!==saved.startOffset;
      const bounds=saved.getBoundingClientRect(),r=(forward?rects.at(-1):rects[0])||bounds;
      const focusX=keyboard?(r.left+r.right)/2:TH.clamp(cursor.x,r.left,r.right);
      anchor={left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom,focusX,forward,
        cursorX:keyboard?focusX:cursor.x,cursorY:keyboard?(forward?r.bottom:r.top):cursor.y};
    }
    if(currentText.trim().length>=2)show();
  }
  document.addEventListener('pointerdown',e=>{if(inside(e))return;clearTimeout(selectionTimer);lastDown={x:e.clientX,y:e.clientY};if(open&&!settings.pin)hide();},true);
  document.addEventListener('pointerup',e=>{
    if(inside(e)||e.button!==0)return;lastCursor={x:e.clientX,y:e.clientY};
    if(Math.hypot(e.clientX-lastDown.x,e.clientY-lastDown.y)<3&&e.detail<2)return;
    scheduleCapture(lastCursor);
  },true);
  function scheduleCapture(cursor){
    clearTimeout(selectionTimer);
    selectionTimer=setTimeout(()=>capture(cursor),40);
  }
  document.addEventListener('dblclick',e=>{if(!inside(e))scheduleCapture({x:e.clientX,y:e.clientY});},true);
  document.addEventListener('keyup',e=>{if(inside(e))return;if(e.key==='Escape'){hide();return;}if((e.shiftKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'))capture(lastCursor,true);},true);
  document.addEventListener('scroll',e=>{
    if(!open||inside(e)||panel.drag)return;
    if(settings.pin){
      if(!temporary&&!['fixed','viewport'].includes(settings.placement.mode))temporary=panel.xy();
      return;
    }
    clearTimeout(hideTimer);
    hideTimer=setTimeout(hide,100);
  },true);
  window.addEventListener('resize',reposition);
  api.runtime.onMessage.addListener(m=>{
    if(m.type!=='th:settings-changed')return;
    const next=TH.normalize(m.settings,settings.locale);
    if(JSON.stringify(next.placement)!==JSON.stringify(settings.placement))temporary=null;
    settings=next;
    if(!open)return;
    requestEpoch++;requesting=false;
    panel.update(settings);
    if(!allowed())hide();else reposition();
  });
  // Prevent focus changes while toolbar buttons are clicked, preserving editable selections.
  host.addEventListener('mousedown',e=>{if(e.composedPath().some(x=>x.tagName==='BUTTON') && !e.composedPath().includes(panel.grip))e.preventDefault();});
  async function copy(text){
    try{await navigator.clipboard.writeText(text);}catch{
      const a=document.createElement('textarea');a.value=text;a.style.cssText='position:fixed;left:-10000px;top:0';document.documentElement.append(a);try{a.select();if(!document.execCommand('copy'))throw new Error('copyFailed');}finally{a.remove();}
    }
    panel.notify(tr('copied'));
  }
  async function replace(text,savedField,savedRange,original){
    try{
      if(savedField){
        const f=savedField;if(!f.el.isConnected||f.el.readOnly||f.el.disabled||f.el.value.slice(f.start,f.end)!==f.original)throw new Error();
        f.el.focus();f.el.setSelectionRange(f.start,f.end);f.el.setRangeText(text,f.start,f.end,'select');f.el.dispatchEvent(new Event('input',{bubbles:true}));hide();return;
      }
      if(savedRange?.commonAncestorContainer?.isConnected && savedRange.toString()===original){
        const node=savedRange.commonAncestorContainer,el=node.nodeType===1?node:node.parentElement;
        if(el?.isContentEditable){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);if(document.execCommand('insertText',false,text)){hide();return;}}
      }
    }catch{/* An edited field must never be overwritten with a stale result. */}
    await copy(text);panel.notify(tr('copiedInstead'));
  }
  function reserveForm(epoch){
    const source=settings.translation.source==='auto'?(/[а-яё]/i.test(currentText)?'ru':'en'):settings.translation.source;
    const target=settings.translation.target==='auto'?(/[а-яё]/i.test(currentText)?'en':'ru'):settings.translation.target;
    return {source,target,onTranslate:(source,target)=>{if(epoch===requestEpoch&&open&&!requesting)return run('translate',{source,target});}};
  }
  async function run(task,reserve){
    const epoch=++requestEpoch,text=currentText,savedField=field,savedRange=range?.cloneRange();requesting=true;
    if(task==='translate'&&settings.translation.provider==='mymemory'&&!reserve){requesting=false;panel.showResult({text:tr('memoryChoose'),title:'MyMemory',reserve:reserveForm(epoch)});return;}
    panel.showResult({text:tr('loading'),title:tr(task),loading:true,translation:task==='translate'});reposition();
    try{
      const result=await message({type:'th:text',task,text,...(reserve?{reserve}:{})});if(epoch!==requestEpoch||!open)return;
      requesting=false;
      panel.showResult({text:result.text,title:result.provider==='mymemory'?'MyMemory':TH.providers[result.provider]||(result.provider==='google'?'Google Translate':'LanguageTool'),translation:task==='translate'&&!reserve,onCopy:()=>copy(result.text).catch(e=>panel.notify(tr(e.message))),onReplace:()=>replace(result.text,savedField,savedRange,text).catch(e=>panel.notify(tr(e.message)))});
      if(settings.autoCopy)await copy(result.text);
    }catch(e){
      if(epoch!==requestEpoch||!open)return;requesting=false;
      const target=settings.translation.target==='auto'?(/[а-яё]/i.test(text)?'en':'ru'):settings.translation.target;
      panel.showResult({text:tr(e.message,{seconds:e.retryAfter||60}),title:tr('error'),error:true,translation:task==='translate'&&!reserve,reserve:task==='translate'&&(reserve||settings.translation.provider==='google'||settings.translation.provider==='mymemory')?reserveForm(epoch):null,onFallback:task==='translate'&&settings.translation.provider==='google'?()=>window.open('https://translate.google.com/?'+new URLSearchParams({sl:settings.translation.source,tl:target,text,op:'translate'}),'_blank','noopener,noreferrer'):null});
    }
  }
  async function act(id){
    try{
      if(['translate','correct'].includes(id)){if(!requesting)await run(id);return;}
      if(id==='copy'){await copy(currentText);return;}
      if(id==='block'||id==='pause'){await message({type:'th:panel-preference',block:id==='block',pause:id==='pause'});hide();return;}
      const templates={search:'https://www.google.com/search?q={text}',wikipedia:`https://${settings.locale==='zh-CN'?'zh':settings.locale}.wikipedia.org/w/index.php?search={text}`,youtube:'https://www.youtube.com/results?search_query={text}',custom:settings.customSearch.url};
      if(templates[id])window.open(TH.searchURL(templates[id],currentText),'_blank','noopener,noreferrer');
    }catch(e){panel.notify(tr(e.message));}
  }
})();
