/* TextHelper 10 — shared, dependency-free data contracts. */
(function (root) {
  'use strict';
  const languages = { ru: 'Русский', en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', pt: 'Português', 'zh-CN': '简体中文' };
  const textLanguages = { auto: 'Auto', ru: 'Русский', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', it: 'Italiano', pt: 'Português', uk: 'Українська', pl: 'Polski', tr: 'Türkçe', zh: '中文', ja: '日本語', ko: '한국어', ar: 'العربية' };
  const providers = { deepseek: 'DeepSeek', claude: 'Claude', openai: 'OpenAI', gemini: 'Gemini', openrouter: 'OpenRouter', ollama: 'Ollama', custom: 'Other API' };
  const baseTokens = { bg:'#20212c', fg:'#f1efff', accent:'#bda9ff', activeFg:'#211734', round:14, size:32, gap:3, padding:5, stroke:1.8, shadow:'soft', border:'1px solid #494454' };
  const presets = {
    matte: { ...baseTokens },
    glass: { ...baseTokens, bg:'#243447', fg:'#eff7ff', accent:'#9cdbf5', activeFg:'#102433', round:22, size:34, padding:7, border:'1px solid #6c8399' },
    neon: { ...baseTokens, bg:'#130d26', fg:'#f6edff', accent:'#e6a3ff', activeFg:'#240b36', round:5, gap:5, stroke:2.2, shadow:'glow', border:'2px solid #ad6bd6' },
    retro: { ...baseTokens, bg:'#f4e5c7', fg:'#332d28', accent:'#793521', activeFg:'#ffffff', round:2, size:30, gap:6, stroke:2.4, shadow:'hard', border:'2px solid #332d28' }
  };
  function resolveLanguage(preferences) {
    for (const raw of Array.isArray(preferences) ? preferences : [preferences]) {
      if (typeof raw !== 'string') continue;
      const tag = raw.trim().replaceAll('_','-').toLowerCase();
      if (/^zh(?:$|-)/.test(tag)) {
        if (/(?:^|-)hant(?:-|$)|^zh-(?:tw|hk|mo)(?:-|$)/.test(tag)) continue;
        return 'zh-CN';
      }
      const base = tag.split('-')[0];
      if (Object.hasOwn(languages,base)) return base;
    }
    return 'en';
  }
  function t(locale,key,values={}) {
    const value = root.TH_CATALOGS?.[resolveLanguage(locale)]?.[key] ?? root.TH_CATALOGS?.en?.[key];
    if (typeof value !== 'string') return key;
    return value.replace(/\{([a-zA-Z]+)\}/g, (token,name) => Object.hasOwn(values,name) ? String(values[name]) : token);
  }
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
  const num = (v,d,min,max) => typeof v === 'number' && Number.isFinite(v) ? clamp(v,min,max) : d;
  const bool = (v,d) => typeof v === 'boolean' ? v : d;
  const one = (v,values,d) => values.includes(v) ? v : d;
  const color = v => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v);
  function contrast(a,b) {
    const luminance = c => { const s = [1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return .2126*s[0]+.7152*s[1]+.0722*s[2]; };
    const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  function validateTheme(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== 'name,tokens,version' || value.version !== 1 || typeof value.name !== 'string' || !value.name.trim() || value.name.length>28) throw new Error('themeInvalid');
    const v=value.tokens;
    if (!v || Object.keys(v).sort().join() !== Object.keys(baseTokens).sort().join()) throw new Error('themeInvalid');
    for (const key of ['bg','fg','accent','activeFg']) if (!color(v[key])) throw new Error('themeInvalid');
    for (const [key,min,max] of [['round',0,28],['size',24,42],['gap',0,10],['padding',3,10]]) if (!Number.isInteger(v[key]) || v[key]<min || v[key]>max) throw new Error('themeInvalid');
    if (!Number.isFinite(v.stroke) || v.stroke<1 || v.stroke>3 || Math.abs(v.stroke*10-Math.round(v.stroke*10))>.00001 || !['none','soft','glow','hard'].includes(v.shadow) || !/^(?:none|[1-3]px solid #[\da-f]{6})$/i.test(v.border)) throw new Error('themeInvalid');
    if (contrast(v.bg,v.fg)<4.5 || contrast(v.accent,v.activeFg)<4.5) throw new Error('themeContrast');
    return {version:1,name:value.name.trim(),tokens:{...v}};
  }
  function validateCSS(css) {
    if (typeof css!=='string' || css.length>12000) throw new Error('cssInvalid');
    const source=css.replace(/\/\*[\s\S]*?\*\//g,'').trim();
    if (!source) return '';
    if (/@|url\s*\(|expression|javascript|\\|<|>|!important|:host|:root/i.test(source)) throw new Error('cssInvalid');
    const selectors=new Set(['.panel','.tool','.tool:hover','.tool:focus-visible','.tool svg','.result','.toolbar']);
    const props=new Set(['background','background-color','color','border','border-color','border-width','border-style','border-radius','box-shadow','font-family','font-size','font-weight','letter-spacing','padding','gap','opacity','text-shadow','outline','outline-offset']);
    let consumed='';
    for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      consumed+=match[0];
      if (!match[1].split(',').every(s=>selectors.has(s.trim()))) throw new Error('cssInvalid');
      for (const declaration of match[2].split(';').filter(x=>x.trim())) {
        const colon=declaration.indexOf(':');
        if (colon<0 || !props.has(declaration.slice(0,colon).trim().toLowerCase()) || !/^[\w\s#.,()%+\-"']+$/.test(declaration.slice(colon+1))) throw new Error('cssInvalid');
      }
    }
    if (consumed.replace(/\s/g,'')!==source.replace(/\s/g,'')) throw new Error('cssInvalid');
    return source;
  }
  function endpoint(raw,local=false) {
    let u; try { u=new URL(raw); } catch { throw new Error('urlInvalid'); }
    const loopback=['localhost','127.0.0.1'].includes(u.hostname);
    if (u.username || u.password || u.search || u.hash || (u.protocol!=='https:' && !(local && loopback && u.protocol==='http:'))) throw new Error('urlInvalid');
    return u.href.replace(/\/$/,'');
  }
  function searchURL(template,text) {
    if (typeof template!=='string' || !template.includes('{text}') || template.length>2000) throw new Error('urlInvalid');
    const u=new URL(template.replaceAll('{text}',encodeURIComponent(text)));
    if (u.protocol!=='https:' || u.username || u.password) throw new Error('urlInvalid');
    return u.href;
  }
  function defaults(locale='en') { return {
    version:10, locale:resolveLanguage(locale), enabled:true, tools:['search','translate','correct','copy','wikipedia','youtube','custom'], visible:['search','translate','correct','copy'],
    labels:false, compact:false, motion:true, pin:false, autoCopy:false, rememberDrag:false, width:320, font:'system', preset:'matte', themeName:'Matte', tokens:{...baseTokens}, css:'',
    placement:{mode:'auto',corner:'bottom-right',gap:10,point:{x:.7,y:.25},offset:{x:0,y:12}},
    translation:{provider:'google',source:'auto',target:'auto'}, correction:'lt', designProvider:'deepseek',
    customSearch:{label:'Search',url:'https://www.google.com/search?q={text}'}, blockedDomains:[], hiddenUntil:0, onboarded:false
  }; }
  function normalize(raw={},locale='en') {
    const d=defaults(locale),v=raw && typeof raw==='object'?raw:{};
    for (const k of ['enabled','labels','compact','motion','pin','autoCopy','rememberDrag','onboarded']) d[k]=bool(v[k],d[k]);
    d.locale=resolveLanguage(v.locale||locale); d.preset=one(v.preset,Object.keys(presets),'matte');
    try { const theme=validateTheme({version:1,name:v.themeName||d.themeName,tokens:v.tokens||presets[d.preset]}); d.tokens=theme.tokens; d.themeName=theme.name; } catch { d.tokens={...presets[d.preset]}; }
    try { d.css=validateCSS(v.css||''); } catch { d.css=''; }
    d.width=num(v.width,320,240,520); d.font=one(v.font,['system','mono','serif'],'system');
    if (Array.isArray(v.tools)) d.tools=[...new Set([...v.tools.filter(x=>d.tools.includes(x)),...d.tools])];
    if (Array.isArray(v.visible)) d.visible=[...new Set(v.visible.filter(x=>d.tools.includes(x)))];
    if (!d.visible.length) d.visible=['search'];
    const p=v.placement||{}; d.placement={mode:one(p.mode,['auto','above','below','cursor','fixed','viewport','relative'],'auto'),corner:one(p.corner,['top-left','top-right','bottom-left','bottom-right'],'bottom-right'),gap:num(p.gap,10,0,24),point:{x:num(p.point?.x,.7,0,1),y:num(p.point?.y,.25,0,1)},offset:{x:num(p.offset?.x,0,-4096,4096),y:num(p.offset?.y,12,-4096,4096)}};
    const tr=v.translation||{}; d.translation={provider:one(tr.provider,['google','mymemory',...Object.keys(providers)],'google'),source:one(tr.source,Object.keys(textLanguages),'auto'),target:one(tr.target,Object.keys(textLanguages),'auto')};
    d.correction=one(v.correction,['lt',...Object.keys(providers)],'lt'); d.designProvider=one(v.designProvider,Object.keys(providers),'deepseek');
    try { searchURL(v.customSearch?.url,'test'); d.customSearch={label:String(v.customSearch.label||'Search').slice(0,24),url:v.customSearch.url}; } catch { /* safe default */ }
    d.blockedDomains=Array.isArray(v.blockedDomains)?[...new Set(v.blockedDomains.filter(x=>typeof x==='string' && /^[\w.:[\]-]+$/.test(x)).slice(0,500))]:[];
    d.hiddenUntil=num(v.hiddenUntil,0,0,Date.now()+86400000); return d;
  }
  function migrate(old,locale) {
    if (old.th_settings) return normalize(old.th_settings,locale);
    return normalize({locale,translation:{provider:old.th_transl_mode==='deepseek'?'deepseek':'google',source:old.th_transl_source,target:old.th_transl_target},correction:old.th_mode==='ds'?'deepseek':old.th_mode==='claude'?'claude':'lt',blockedDomains:old.th_blocked_domains,hiddenUntil:old.th_hidden_until},locale);
  }
  function position(p,anchor,size,viewport) {
    const margin=Math.min(8,viewport.w/2,viewport.h/2), maxX=Math.max(margin,viewport.w-size.w-margin),maxY=Math.max(margin,viewport.h-size.h-margin);
    let x,y;
    if (p.mode==='viewport') { x=margin+p.point.x*(maxX-margin); y=margin+p.point.y*(maxY-margin); }
    else if (p.mode==='fixed') { x=p.corner.endsWith('left')?margin:maxX; y=p.corner.startsWith('top')?margin:maxY; }
    else if (p.mode==='relative') {
      x=anchor.cursorX-size.w/2+p.offset.x;
      y=anchor.cursorY+p.offset.y;
    }
    else {
      const a=p.mode==='cursor'?{left:anchor.cursorX,right:anchor.cursorX,top:anchor.cursorY,bottom:anchor.cursorY}:anchor;
      x=(a.focusX??(a.left+a.right)/2)-size.w/2;
      const above=a.top-size.h-p.gap,below=a.bottom+p.gap;
      const fitsAbove=above>=margin,fitsBelow=below<=maxY;
      if (p.mode==='below'||(p.mode==='auto'&&a.forward)) y=fitsBelow?below:fitsAbove?above:(viewport.h-a.bottom>=a.top?below:above);
      else y=fitsAbove?above:fitsBelow?below:(a.top>=viewport.h-a.bottom?above:below);
    }
    return {x:clamp(x,margin,maxX),y:clamp(y,margin,maxY)};
  }
  function draggedPlacement(placement,point,normalized,anchor,size) {
    if (placement.mode==='fixed'||placement.mode==='viewport') return {mode:'viewport',point:normalized};
    return {mode:'relative',offset:{x:Math.round(point.x+size.w/2-anchor.cursorX),y:Math.round(point.y-anchor.cursorY)}};
  }
  function normalizedPoint(x,y,size,viewport) { return {x:clamp((x-8)/Math.max(1,viewport.w-size.w-16),0,1),y:clamp((y-8)/Math.max(1,viewport.h-size.h-16),0,1)}; }
  function themeCSS(s) {
    const v=s.tokens,shadows={none:'none',soft:'0 12px 36px #0006',glow:`0 0 20px ${v.accent}66`,hard:`4px 4px 0 ${v.fg}`};
    return `.panel{--bg:${v.bg};--fg:${v.fg};--accent:${v.accent};--active:${v.activeFg};--size:${s.compact?Math.max(24,v.size-6):v.size}px;--stroke:${v.stroke};--round:${v.round}px;--gap:${v.gap}px;--pad:${v.padding}px;background:${s.preset==='glass'?v.bg+'e8':v.bg};color:${v.fg};border:${v.border};border-radius:${v.round}px;box-shadow:${shadows[v.shadow]};font-family:${s.font==='mono'?'ui-monospace,monospace':s.font==='serif'?'Georgia,serif':'system-ui,sans-serif'};${s.preset==='glass'?'backdrop-filter:blur(18px);':''}} .tool{border-radius:${Math.max(1,v.round-5)}px;${s.preset==='retro'?'border:1px solid currentColor;':''}}${s.motion?'':'.panel *{transition:none!important;animation:none!important}'}\n${validateCSS(s.css)}`;
  }
  const iconShapes={"search":[["circle",{"cx":"10.5","cy":"10.5","r":"6.5"}],["path",{"d":"m16 16 5 5"}]],"translate":[["path",{"d":"M2 5h12M7 2v3m-3 3 7 7M12 5c-1 5-5 9-9 11m11 5 4-10 4 10m-7-3h6"}]],"correct":[["path",{"d":"m4 16 12-12 4 4L8 20l-5 1zM13 7l4 4"}]],"copy":[["rect",{"x":"8","y":"8","width":"13","height":"13","rx":"2"}],["path",{"d":"M16 8V3H3v13h5"}]],"wikipedia":[["path",{"d":"m2 5 5 15 5-12 5 12 5-15M1 5h5m12 0h5"}]],"youtube":[["rect",{"x":"2","y":"5","width":"20","height":"14","rx":"4"}],["path",{"d":"m10 9 6 3-6 3z"}]],"custom":[["path",{"d":"M12 3v18M3 12h18"}]],"grip":[["path",{"d":"M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01"}]],"pin":[["path",{"d":"m8 3 8 0-1 6 4 4H5l4-4zM12 13v8"}]],"more":[["circle",{"cx":"5","cy":"12","r":"1"}],["circle",{"cx":"12","cy":"12","r":"1"}],["circle",{"cx":"19","cy":"12","r":"1"}]],"close":[["path",{"d":"m6 6 12 12M6 18 18 6"}]]};
  function icon(id,doc=root.document) {
    const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');
    const attrs={'aria-hidden':'true',width:'18',height:'18',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'var(--stroke,1.8)','stroke-linecap':'round','stroke-linejoin':'round'};
    for(const [key,value]of Object.entries(attrs))svg.setAttribute(key,value);
    const shapes=Object.hasOwn(iconShapes,id)?iconShapes[id]:iconShapes.custom;
    for(const [tag,attributes]of shapes){const shape=doc.createElementNS(ns,tag);for(const [key,value]of Object.entries(attributes))shape.setAttribute(key,value);svg.append(shape);}
    return svg;
  }
  const api={languages,textLanguages,providers,presets,baseTokens,resolveLanguage,t,clamp,contrast,validateTheme,validateCSS,endpoint,searchURL,defaults,normalize,migrate,position,draggedPlacement,normalizedPoint,themeCSS,icon};
  root.TH=api;
  if (typeof module!=='undefined') module.exports=api;
})(globalThis);
