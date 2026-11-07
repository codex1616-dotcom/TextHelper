(function(root){
  'use strict';
  class Panel {
    constructor(host,settings,handlers={},preview=false){
      this.host=host;this.settings=settings;this.handlers=handlers;this.preview=preview;
      this.shadow=host.attachShadow({mode:'open'});
      this.base=document.createElement('style');this.base.textContent=root.TH_PANEL_CSS;
      this.theme=document.createElement('style');this.box=document.createElement('div');this.box.className='panel';
      this.shadow.append(this.base,this.theme,this.box);this.render();
      this.observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>handlers.onResize?.()):null;this.observer?.observe(this.box);
      this.shadow.addEventListener('keydown',e=>{if(e.key==='Escape'){if(this.drag){this.move(this.drag.x,this.drag.y);this.drag=null;e.stopPropagation();}else handlers.onClose?.();}});
    }
    label(key){return TH.t(this.settings.locale,key);}
    button(id,label,handler,parent=this.toolbar){
      const b=document.createElement('button');b.type='button';b.className='tool';b.title=label;b.setAttribute('aria-label',label);b.append(TH.icon(id));b.addEventListener('click',handler);parent.append(b);return b;
    }
    render(){
      this.theme.textContent=TH.themeCSS(this.settings);this.box.replaceChildren();
      this.toolbar=document.createElement('div');this.toolbar.className='toolbar';this.toolbar.setAttribute('role','toolbar');this.toolbar.setAttribute('aria-label',this.label('panel'));
      this.box.append(this.toolbar);
      this.grip=this.button('grip',this.label('dragHandle'),()=>{});this.grip.classList.add('grip');this.installDrag();
      const tools=document.createElement('div');tools.className='tools';this.toolbar.append(tools);
      for(const id of this.settings.tools.filter(x=>this.settings.visible.includes(x))){
        const label=id==='custom'?this.settings.customSearch.label:this.label(id);
        const b=this.button(id,label,()=>this.handlers.onAction?.(id),tools);
        if(this.settings.labels){const span=document.createElement('span');span.textContent=label;b.append(span);}
      }
      const utilities=document.createElement('div');utilities.className='utilities';this.toolbar.append(utilities);
      this.pin=this.button('pin',this.label('pin'),()=>this.handlers.onPin?.(!this.settings.pin),utilities);this.pin.setAttribute('aria-pressed',String(this.settings.pin));
      const more=this.button('more',this.label('more'),()=>{this.menu.hidden=!this.menu.hidden;this.handlers.onResize?.();},utilities);more.setAttribute('aria-haspopup','true');
      this.button('close',this.label('close'),()=>this.handlers.onClose?.(),utilities);
      this.menu=document.createElement('div');this.menu.className='menu';this.menu.hidden=true;this.box.append(this.menu);
      for(const [key,action]of [['hideSite','block'],['pause','pause']]){const b=document.createElement('button');b.type='button';b.className='text-button';b.textContent=this.label(key);b.onclick=()=>this.handlers.onAction?.(action);this.menu.append(b);}
      this.result=document.createElement('section');this.result.className='result';this.result.hidden=true;this.result.setAttribute('aria-live','polite');this.box.append(this.result);
      this.toast=document.createElement('div');this.toast.className='toast';this.toast.hidden=true;this.toast.setAttribute('role','status');this.box.append(this.toast);
    }
    update(s){this.settings=s;this.render();}
    showResult({text,title,loading=false,error=false,translation=false,onCopy,onReplace,onFallback,reserve}){
      this.result.replaceChildren();this.result.hidden=false;this.result.classList.toggle('error',error);
      const head=document.createElement('div');head.className='result-head';head.textContent=title||'';this.result.append(head);
      if(translation){const select=document.createElement('select');select.setAttribute('aria-label',this.label('targetLanguage'));for(const [code,name]of Object.entries(TH.textLanguages)){const o=document.createElement('option');o.value=code;o.textContent=code==='auto'?this.label('autoTarget'):name;select.append(o);}select.value=this.settings.translation.target;select.onchange=()=>this.handlers.onTarget?.(select.value);head.append(select);}
      const body=document.createElement('div');body.className='result-text';body.textContent=text;this.result.append(body);
      const actions=document.createElement('div');actions.className='result-actions';this.result.append(actions);
      for(const [key,handler]of [['copy',onCopy],['replace',onReplace],['openGoogle',onFallback]]) if(handler&&!loading){const b=document.createElement('button');b.type='button';b.className='text-button';b.textContent=this.label(key);b.onclick=handler;actions.append(b);}
      if(reserve&&!loading){
        const note=document.createElement('p');note.className='reserve-note';note.textContent=this.label('memoryPrivacy');this.result.append(note);
        const pair=document.createElement('div');pair.className='result-actions';this.result.append(pair);
        const chooser=(key,value)=>{const label=document.createElement('label');label.textContent=this.label(key);const select=document.createElement('select');select.setAttribute('aria-label',this.label(key));for(const [code,name]of Object.entries(TH.textLanguages)){if(code==='auto')continue;const option=document.createElement('option');option.value=code;option.textContent=name;select.append(option);}select.value=value;label.append(select);pair.append(label);return select;};
        const source=chooser('sourceLanguage',reserve.source),target=chooser('targetLanguage',reserve.target);
        const b=document.createElement('button');b.type='button';b.className='text-button';b.textContent=this.label('memoryTranslate');b.onclick=()=>reserve.onTranslate(source.value,target.value);this.result.append(b);
        const terms=document.createElement('a');terms.href='https://mymemory.translated.net/terms-and-conditions';terms.target='_blank';terms.rel='noopener noreferrer';terms.textContent='MyMemory · '+this.label('memoryTerms');terms.style.cssText='display:block;color:inherit;font-size:11px;margin-top:7px';this.result.append(terms);
      }
      this.handlers.onResize?.();
    }
    notify(text){clearTimeout(this.toastTimer);this.toast.textContent=text;this.toast.hidden=false;this.toastTimer=setTimeout(()=>{this.toast.hidden=true;this.handlers.onResize?.();},1800);}
    move(x,y){this.host.style.left=x+'px';this.host.style.top=y+'px';}
    measure(){const r=this.host.getBoundingClientRect();return {w:r.width,h:r.height};}
    bounds(){return this.preview?{w:this.host.parentElement.clientWidth,h:this.host.parentElement.clientHeight}:{w:window.innerWidth,h:window.innerHeight};}
    xy(){return {x:parseFloat(this.host.style.left)||8,y:parseFloat(this.host.style.top)||8};}
    bounded(x,y){const size=this.measure(),v=this.bounds();return {x:TH.clamp(x,8,Math.max(8,v.w-size.w-8)),y:TH.clamp(y,8,Math.max(8,v.h-size.h-8))};}
    commit(){const point=this.xy();this.handlers.onDrag?.(point,TH.normalizedPoint(point.x,point.y,this.measure(),this.bounds()));}
    installDrag(){
      this.grip.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;e.preventDefault();this.grip.focus();const p=this.xy();this.drag={...p,clientX:e.clientX,clientY:e.clientY,id:e.pointerId,moved:false};this.grip.setPointerCapture(e.pointerId);
      });
      this.grip.addEventListener('pointermove',e=>{
        const d=this.drag;if(!d||d.id!==e.pointerId)return;
        const dx=e.clientX-d.clientX,dy=e.clientY-d.clientY;if(!d.moved&&Math.hypot(dx,dy)<3)return;d.moved=true;
        const p=this.bounded(d.x+dx,d.y+dy);this.move(p.x,p.y);
      });
      const end=e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;this.drag=null;if(this.grip.hasPointerCapture(e.pointerId))this.grip.releasePointerCapture(e.pointerId);if(d.moved)this.commit();};
      this.grip.addEventListener('pointerup',end);
      this.grip.addEventListener('pointercancel',()=>{if(this.drag){this.move(this.drag.x,this.drag.y);this.drag=null;}});
      this.grip.addEventListener('lostpointercapture',()=>{if(this.drag){this.move(this.drag.x,this.drag.y);this.drag=null;}});
      this.grip.addEventListener('keydown',e=>{
        const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},dir=dirs[e.key];if(!dir)return;e.preventDefault();const p=this.xy(),n=e.shiftKey?1:8,q=this.bounded(p.x+dir[0]*n,p.y+dir[1]*n);this.move(q.x,q.y);this.commit();
      });
    }
    destroy(){clearTimeout(this.toastTimer);this.observer?.disconnect();this.host.remove();}
  }
  root.THPanel=Panel;
})(globalThis);
