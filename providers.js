(function(root){
  'use strict';
  const fixed={deepseek:'https://api.deepseek.com/v1',claude:'https://api.anthropic.com/v1',openai:'https://api.openai.com/v1',gemini:'https://generativelanguage.googleapis.com/v1beta',openrouter:'https://openrouter.ai/api/v1'};
  function profile(id,value={}) {
    if (!Object.hasOwn(root.TH.providers,id)) throw new Error('providerMissing');
    const model=String(value.model||'').trim();
    if (model.length>160 || /[\s?#]/.test(model)) throw new Error('modelInvalid');
    const base=fixed[id]||root.TH.endpoint(value.base||(id==='ollama'?'http://localhost:11434':'https://example.com/v1'),true);
    return {model,base,key:typeof value.key==='string'?value.key.trim().slice(0,4096):''};
  }
  function originPattern(id,p) { const u=new URL(profile(id,p).base);return u.protocol+'//'+u.hostname+'/*'; }
  function modelCatalog(id,p) {
    const headers={};
    let url=p.base+'/models';
    if(id==='ollama') url=p.base+'/api/tags';
    if(id==='deepseek') url='https://api.deepseek.com/models';
    if(id==='openrouter') url+='/user';
    if(id==='claude') {
      headers['x-api-key']=p.key;
      headers['anthropic-version']='2026-10-21';
    } else if(id==='gemini') {
      headers['x-goog-api-key']=p.key;
      url+='?pageSize=1000';
    } else if(p.key) headers.Authorization='Bearer '+p.key;
    return {url,headers};
  }
  function pickModel(id,catalog) {
    const entries=['gemini','ollama'].includes(id)?catalog?.models:catalog?.data;
    if(!Array.isArray(entries)) return '';
    const candidates=[];
    for(const entry of entries) {
      if(!entry) continue;
      const name=id==='gemini'?entry.name?.replace?.(/^models\//,''):id==='ollama'?entry.model||entry.name:entry.id;
      if(typeof name!=='string'||!name||name.length>160||/[\s?#]/.test(name)) continue;
      if(/(?:embed|rerank|moderation|realtime|transcri|tts|(?:^|[-/])audio|gpt-image|imagen|whisper|(?:^|[-/])vision-only)/i.test(name)) continue;
      if(id==='gemini'&&(!entry.supportedGenerationMethods?.includes('generateContent')||/[-/](?:image|live|computer-use)(?:-|$)/i.test(name))) continue;
      if(id==='openai'&&(!/^(?:gpt-|o[1-9])/.test(name)||/instruct|search-preview|deep-research/.test(name))) continue;
      if(id==='openrouter'&&(!entry.architecture?.input_modalities?.includes('text')||!entry.architecture?.output_modalities?.includes('text')||name==='openrouter/auto')) continue;
      if(id==='openrouter'&&Array.isArray(entry.endpoints)&&!entry.endpoints.includes('/api/v1/chat/completions')) continue;
      if(id==='ollama'&&/(?:^|[-:])cloud(?:$|[-:])/i.test(name)) continue;
      candidates.push({name,pricing:entry.pricing});
    }
    if(id==='openrouter') {
      const price=entry=>{
        const {prompt,completion,request=0}=entry.pricing||{};
        if(prompt==null||completion==null) return Infinity;
        const estimate=1000*(Number(prompt)+Number(completion))+Number(request);
        return Number.isFinite(estimate)&&estimate>=0?estimate:Infinity;
      };
      candidates.sort((a,b)=>price(a)-price(b));
    } else {
      const light=/(?:mini|nano|haiku|flash|small)/i;
      candidates.sort((a,b)=>Number(light.test(b.name))-Number(light.test(a.name)));
    }
    return candidates[0]?.name||'';
  }
  function request(id,value,system,input) {
    const p=profile(id,value);
    if (!p.model) throw new Error('modelMissing');
    if (id!=='ollama' && !p.key) throw new Error('keyMissing');
    const headers={'Content-Type':'application/json'};
    let url,body;
    if (id==='claude') {
      url=p.base+'/messages'; headers['x-api-key']=p.key; headers['anthropic-version']='2026-10-21';
      headers['anthropic-dangerous-direct-browser-access']='true';
      body={model:p.model,max_tokens:4096,system,messages:[{role:'user',content:input}]};
    } else if (id==='gemini') {
      headers['x-goog-api-key']=p.key; url=p.base+'/models/'+encodeURIComponent(p.model.replace(/^models\//,''))+':generateContent';
      body={systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{maxOutputTokens:4096}};
    } else if (id==='ollama') {
      url=p.base+'/api/chat'; if(p.key) headers.Authorization='Bearer '+p.key;
      body={model:p.model,stream:false,messages:[{role:'system',content:system},{role:'user',content:input}],options:{num_predict:4096}};
    } else if (id==='openai') {
      url=p.base+'/responses'; headers.Authorization='Bearer '+p.key;
      body={model:p.model,instructions:system,input,max_output_tokens:4096,store:false};
    } else {
      url=p.base+'/chat/completions'; headers.Authorization='Bearer '+p.key;
      body={model:p.model,messages:[{role:'system',content:system},{role:'user',content:input}],max_tokens:4096};
      if(id==='openrouter') body.provider={allow_fallbacks:false};
    }
    return {url,options:{method:'POST',headers,body:JSON.stringify(body)}};
  }
  function extract(id,data) {
    let text;
    if (id==='claude') { if(data.stop_reason==='max_tokens') throw new Error('responseIncomplete'); text=data.content?.filter(x=>x.type==='text').map(x=>x.text).join(''); }
    else if (id==='gemini') { if(data.candidates?.[0]?.finishReason && data.candidates[0].finishReason!=='STOP') throw new Error('responseIncomplete'); text=data.candidates?.[0]?.content?.parts?.filter(x=>!x.thought).map(x=>x.text||'').join(''); }
    else if (id==='ollama') { if(data.done_reason==='length') throw new Error('responseIncomplete'); text=data.message?.content; }
    else if (id==='openai') { if(data.status && data.status!=='completed') throw new Error('responseIncomplete'); text=data.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join(''); }
    else { if(data.choices?.[0]?.finish_reason && data.choices[0].finish_reason!=='stop') throw new Error('responseIncomplete'); text=data.choices?.[0]?.message?.content; }
    if(typeof text!=='string' || !text.trim() || text.length>80000) throw new Error('responseInvalid');
    return text.trim();
  }
  root.THProviders={profile,request,extract,originPattern,modelCatalog,pickModel,fixed};
  if(typeof module!=='undefined') module.exports=root.THProviders;
})(globalThis);
