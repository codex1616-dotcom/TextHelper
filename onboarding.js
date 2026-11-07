(async function(){
  'use strict';
  const api=chrome,main=document.getElementById('guide');let s,step=0,saves=Promise.resolve(),demoPanel;
  async function send(m){const r=await api.runtime.sendMessage(m);if(!r?.ok)throw new Error(r?.error||'disconnected');return r.data;}
  const t=(key,values)=>TH.t(s?.locale||api.i18n.getUILanguage(),key,values);
  function error(e){document.getElementById('status').textContent=t(e.message);}
  function node(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
  function button(key,fn,primary=false){const b=node('button',t(key),primary?'primary':'secondary');b.type='button';b.onclick=()=>Promise.resolve(fn()).catch(error);return b;}
  try{s=await send({type:'th:get-settings'});}catch(e){error(e);return;}
  function practice(){
    const cards=node('div',null,'learn-cards'),items=[];
    for(const [index,[id,title,body]] of [['select','selectTitle','selectBody'],['translate','translate','guideActionHint'],['correct','correct','guideCorrectHint'],['copy','copy','guideCopyHint'],['move','moveTitle','moveBody']].entries()){
      const card=node('article',null,'learn-card'),image=node('img');
      image.src='guide-'+id+'.svg';image.alt='';image.width=180;image.height=78;
      card.append(image,node('h2',(index+1)+'. '+t(title)),node('p',t(body)));
      items.push(card);cards.append(card);
    }
    const demo=node('section',null,'guide-practice'),controls=node('div',null,'guide-controls');
    const stage=node('div',null,'guide-stage'),sample=node('textarea'),host=node('texthelper-preview');
    const feedback=node('p',null,'guide-feedback');feedback.setAttribute('role','status');
    const select=button('guideSelect',()=>{sample.focus();sample.select();showPanel();});
    const reset=button('guideReset',resetPractice);
    sample.readOnly=true;sample.value=t('guideSample');sample.setAttribute('aria-label',t('guideSelect'));
    const copied=node('output',null,'guide-copied');
    copied.hidden=true;
    host.hidden=true;stage.append(sample,host);controls.append(select,reset);
    demo.append(node('h2',t('guidePractice')),node('p',t('guideOffline'),'hint'),controls,stage,feedback,copied);
    main.append(cards,demo);
    const actionSteps=['translate','correct','copy'];
    const hints=['guideSelectHint','guideActionHint','guideCorrectHint','guideCopyHint','guideMoveHint','guideSuccess'];
    let progress=0;
    const place=()=>{if(!host.hidden&&!demoPanel.drag){const p=demoPanel.xy(),q=demoPanel.bounded(p.x,p.y);demoPanel.move(q.x,q.y);}};
    function advance(value){
      progress=value;
      items.forEach((card,i)=>{
        card.classList.toggle('complete',i<value);
        if(i===value)card.setAttribute('aria-current','step');else card.removeAttribute('aria-current');
      });
      feedback.textContent=t(hints[value]);
      toolButtons.forEach((tool,i)=>{tool.disabled=value!==i+1;});
    }
    const settings=TH.defaults(s.locale);
    demoPanel=new THPanel(host,{...settings,visible:actionSteps,labels:true,tokens:{...settings.tokens,size:40,padding:8,gap:7}},{
      onAction:id=>{
        if(id!==actionSteps[progress-1])return;
        if(id==='copy'){
          copied.textContent=t('guideCopied',{text:t('guideCorrected')});
          copied.hidden=false;
        }else{
          demoPanel.showResult({title:t(id),text:t(id==='translate'?'guideResult':'guideCorrected')});
        }
        const toolHadFocus=demoPanel.shadow.activeElement===toolButtons[progress-1];
        advance(progress+1);
        if(toolHadFocus)(toolButtons[progress-1]||demoPanel.grip).focus();
      },
      onDrag:()=>{if(progress===4)advance(5);},
      onResize:place
    },true);
    demoPanel.toolbar.querySelector('.utilities').remove();
    const toolButtons=[...demoPanel.toolbar.querySelectorAll('.tools button')];
    function showPanel(){
      if(progress!==0||sample.selectionEnd<=sample.selectionStart)return;
      host.hidden=false;
      demoPanel.move(16,sample.offsetTop+sample.offsetHeight+12);
      place();advance(1);
    }
    function resetPractice(){
      host.hidden=true;demoPanel.result.hidden=true;copied.hidden=true;
      sample.setSelectionRange(0,0);
      advance(0);
    }
    sample.addEventListener('select',showPanel);
    sample.addEventListener('pointerup',showPanel);
    sample.addEventListener('keyup',showPanel);
    advance(0);
  }
  function render(){
    demoPanel?.destroy();demoPanel=null;
    document.documentElement.lang=s.locale;document.getElementById('tagline').textContent=t('tagline');main.replaceChildren();
    const steps=node('div',null,'steps');for(const [i,key]of ['stepLanguage','stepLearn','stepReady'].entries())steps.append(node('span',(i+1)+' · '+t(key),step===i?'active':''));main.append(steps);
    if(step===0){
      main.append(node('h1',t('languageTitle')),node('p',t('languageIntro'),'lead'));
      const grid=node('div',null,'language-grid');main.append(grid);
      for(const [code,label]of Object.entries(TH.languages)){
        const b=button('languageLabel',()=>{s.locale=code;saves=saves.then(()=>send({type:'th:update-settings',patch:{locale:code}}));saves.catch(error);render();});b.textContent=label;b.lang=code;b.setAttribute('aria-pressed',String(s.locale===code));grid.append(b);
      }
      main.append(node('p',t('browserSuggested',{language:TH.languages[TH.resolveLanguage(api.i18n.getUILanguage())]}),'hint'));
    }else if(step===1){
      main.append(node('h1',t('learnTitle')),node('p',t('learnIntro'),'lead'));
      practice();
      main.append(node('p',t('onboardingPopupHint'),'note'),node('p',t('dataNotice'),'notice'));
    }else{
      main.append(node('h1',t('readyTitle')),node('p',t('readyIntro'),'lead'),node('p',t('onboardingPopupHint'),'note'),node('p',t('restrictedPages'),'hint'),node('p',t('learnCanRepeat'),'hint'));
    }
    const actions=node('div',null,'actions');if(step>0)actions.append(button('back',()=>{step--;render();}));
    if(step<2)actions.append(button('continue',async()=>{await saves;step++;render();},true));
    else actions.append(button('done',async()=>{await saves;await send({type:'th:update-settings',patch:{onboarded:true}});window.close();},true));
    main.append(actions);
  }
  render();
})();
