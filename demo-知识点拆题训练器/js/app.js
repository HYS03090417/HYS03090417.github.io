(function(){
'use strict';
var KB = window.KB || {chemistry:{topics:[]},biology:{topics:[]}};
/* ===================== 存储 ===================== */
var LS_STATS='kpt_stats2', LS_COL='kpt_col2', LS_ACT='kpt_act2';
var LS_KEY='kpt_api_key', LS_BASE='kpt_api_base', LS_MODEL='kpt_model';
function lsGet(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){return false;}return true;}
function getStats(){return lsGet(LS_STATS,{});}
function getCol(){return lsGet(LS_COL,[]);}
function getAct(){return lsGet(LS_ACT,[]);}
function todayStr(){var d=new Date();function p(n){return String(n).padStart(2,'0');}return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function calcStreak(){
  var act=getAct();var set={};
  act.forEach(function(x){set[x.d]=true;});
  var d=new Date(),streak=0;
  function fmt(dd){var p=function(n){return String(n).padStart(2,'0');};return dd.getFullYear()+'-'+p(dd.getMonth()+1)+'-'+p(dd.getDate());}
  if(!set[fmt(d)]){d.setDate(d.getDate()-1);}
  while(set[fmt(d)]){streak++;d.setDate(d.getDate()-1);}
  return streak;
}
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ===================== 工具 ===================== */
function toast(msg,type){
  var el=document.createElement('div');el.className='toast '+(type||'');el.textContent=msg;
  document.body.appendChild(el);
  requestAnimationFrame(function(){el.classList.add('show');});
  setTimeout(function(){el.classList.remove('show');setTimeout(function(){el.remove();},320);},2600);
}
function allTopics(){
  var arr=[];
  Object.keys(KB).forEach(function(sub){
    KB[sub].topics.forEach(function(t){arr.push({sub:sub,topic:t});});
  });
  return arr;
}
function findTopic(sub,id){
  var s=KB[sub];if(!s)return null;
  for(var i=0;i<s.topics.length;i++){if(s.topics[i].id===id)return s.topics[i];}
  return null;
}
function getTopicState(sub,id){
  var st=getStats();if(!st[sub])st[sub]={};if(!st[sub][id])st[sub][id]={};
  return st[sub][id];
}
function topicMastered(sub,topic){
  var ts=getTopicState(sub,topic.id);var n=topic.questions.length;var m=0;
  topic.questions.forEach(function(q,i){if(ts['q'+i]&&ts['q'+i].c>0)m++;});
  return {mastered:m,total:n};
}
function totalStats(){
  var st=getStats();var attempts=0,correct=0,masteredTopics=0,totalTopics=0;
  allTopics().forEach(function(o){
    totalTopics++;
    var tm=topicMastered(o.sub,o.topic);
    if(tm.mastered===tm.total&&tm.total>0)masteredTopics++;
    var ts=st[o.sub]&&st[o.sub][o.topic.id]||{};
    Object.keys(ts).forEach(function(k){
      if(k[0]==='q'){attempts+=ts[k].a;correct+=ts[k].c;}
    });
  });
  return {attempts:attempts,correct:correct,rate:attempts?(correct/attempts*100):0,masteredTopics:masteredTopics,totalTopics:totalTopics,col:getCol().length};
}

/* ===================== 视图切换 ===================== */
var VIEWS=['viewDashboard','viewLibrary','viewDetail','viewQuiz','viewCollection'];
var NAVMAP={viewDashboard:'navDashBtn',viewLibrary:'navLibBtn',viewCollection:'navColBtn'};
function showView(id){
  VIEWS.forEach(function(v){$(v).classList.toggle('active',v===id);});
  ['navDashBtn','navLibBtn','navColBtn'].forEach(function(n){$(n).classList.toggle('active',false);});
  if(NAVMAP[id])$(NAVMAP[id]).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ===================== 看板 ===================== */
function renderDashboard(){
  var t=totalStats();
  $('dashAttempts').innerHTML=esc(t.attempts);
  $('dashRate').innerHTML=esc(t.rate.toFixed(0))+'<em>%</em>';
  $('dashMastered').innerHTML=esc(t.masteredTopics)+'<em>/'+t.totalTopics+'</em>';
  $('dashCol').innerHTML=esc(t.col);
  // 今日已练
  var act=getAct(),today=todayStr(),todayN=0;
  act.forEach(function(a){if(a.d===today)todayN+=a.n;});
  $('dashToday').innerHTML=esc(todayN);
  $('dashStreak').innerHTML=esc(calcStreak());
  // 最近练习
  var recent=act.slice(0,8).reverse();
  var box=$('dashRecent');
  if(!recent.length){box.innerHTML='<p style="color:var(--muted);font-size:14.5px">还没有练习记录。点下方按钮，从「氧化还原反应」或「细胞呼吸」开始第一组训练吧。</p>';}
  else{
    box.innerHTML='';
    recent.forEach(function(a){
      var row=document.createElement('div');row.className='topic-row';
      var s=KB[a.sub]?KB[a.sub].name:a.sub;
      row.innerHTML='<span class="tr-name">'+esc(a.name)+'</span><span class="tr-meta">'+esc(a.d)+' · '+a.n+'题 · 对'+a.c+'</span>';
      box.appendChild(row);
    });
  }
}
function quickStart(sub,id){
  var t=findTopic(sub,id);if(!t)return;
  startQuiz(sub,t,t.questions.slice());
}

/* ===================== 知识库 ===================== */
var curSubject='chemistry';
function renderLibrary(){
  $('subjectTabs').innerHTML='';
  Object.keys(KB).forEach(function(sub){
    var b=document.createElement('button');b.className='subject-tab'+(sub===curSubject?' active':'');
    b.textContent=KB[sub].icon+' '+KB[sub].name;
    b.onclick=function(){curSubject=sub;renderLibrary();};
    $('subjectTabs').appendChild(b);
  });
  var grid=$('kpGrid');grid.innerHTML='';
  KB[curSubject].topics.forEach(function(t){
    var tm=topicMastered(curSubject,t);
    var pct=tm.total?Math.round(tm.mastered/tm.total*100):0;
    var card=document.createElement('div');card.className='kp-card';
    card.innerHTML='<div class="kp-name">'+esc(t.name)+'</div>'+
      '<div class="kp-meta">难度：'+esc(t.level)+' · '+t.questions.length+'道训练题</div>'+
      '<div class="kp-progress"><i style="width:'+pct+'%"></i></div>'+
      '<div class="kp-progress-txt">掌握度 '+pct+'%'+(pct===100?' ✓ 已掌握':'')+'</div>';
    card.onclick=function(){renderDetail(curSubject,t.id);};
    grid.appendChild(card);
  });
}
function renderDetail(sub,id){
  var t=findTopic(sub,id);if(!t){return;}
  var s=KB[sub];
  $('detailSubject').textContent=s.icon+' '+s.name;
  $('detailName').textContent=t.name;
  $('detailLevel').textContent='难度：'+t.level;
  var blocks='';
  blocks+='<div class="detail-block"><h3><span class="ic">📖</span>概念讲解</h3><p>'+esc(t.concept)+'</p></div>';
  blocks+='<div class="detail-block"><h3><span class="ic">🔑</span>核心要点</h3><ul>'+t.points.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>';
  blocks+='<div class="detail-block"><h3><span class="ic">⚠️</span>易错提醒</h3><ul class="pitfall-list">'+t.pitfalls.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>';
  blocks+='<div class="detail-block"><h3><span class="ic">🎯</span>常见考法</h3><div class="focus-tags">'+t.foci.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div></div>';
  $('detailBlocks').innerHTML=blocks;
  $('detailTrainBtn').onclick=function(){startQuiz(sub,t,t.questions.slice());};
  showView('viewDetail');
}

/* ===================== 训练引擎 ===================== */
var quiz={list:[],idx:0,correct:0,answers:[],sub:null,topic:null};
function startQuiz(sub,topic,questions,fromCol){
  quiz={list:questions.map(function(q){return q;}),idx:0,correct:0,answers:[],sub:sub,topic:topic,fromCol:fromCol||null};
  $('quizTitle').textContent=(fromCol?'错题重做 · ':'训练 · ')+topic.name;
  $('quizTotal').textContent=quiz.list.length;
  showView('viewQuiz');
  renderQuestion();
}
function renderQuestion(){
  var q=quiz.list[quiz.idx];
  $('quizProgress').style.width=((quiz.idx)/quiz.list.length*100)+'%';
  $('quizCur').textContent=quiz.idx+1;
  $('qText').innerHTML=esc(q.q);
  var opts=$('qOptions');opts.innerHTML='';
  q.options.forEach(function(o,oi){
    var b=document.createElement('button');b.className='option';b.innerHTML='<b>'+String.fromCharCode(65+oi)+'.</b> '+esc(o);
    b.onclick=function(){answer(oi);};
    opts.appendChild(b);
  });
  var fb=$('qFeedback');fb.className='feedback';fb.innerHTML='';
  var nxt=$('qNextBtn');nxt.style.display='none';
}
function answer(oi){
  var q=quiz.list[quiz.idx];
  var opts=$('qOptions').children;
  for(var i=0;i<opts.length;i++){opts[i].disabled=true;}
  opts[oi].classList.add(oi===q.answer?'correct':'wrong');
  opts[q.answer].classList.add('correct');
  var isCorrect=(oi===q.answer);
  if(isCorrect)quiz.correct++;
  quiz.answers.push({q:q,chosen:oi,correct:isCorrect});
  // 记录统计
  var ts=getTopicState(quiz.sub,quiz.topic.id);
  var key='q'+quiz.idx;
  if(!ts[key])ts[key]={a:0,c:0};
  ts[key].a++;
  if(isCorrect)ts[key].c++;
  saveStats();
  var act=getAct();
  var today=todayStr();
  if(act.length&&act[0].d===today){act[0].n++;act[0].c+=isCorrect?1:0;}
  else{act.unshift({d:today,n:1,c:isCorrect?1:0});}
  if(act.length>30)act.length=30;
  lsSet(LS_ACT,act);
  var fb=$('qFeedback');
  fb.className='feedback '+(isCorrect?'correct':'wrong');
  fb.innerHTML='<span class="fb-tag">'+(isCorrect?'✅ 回答正确':'❌ 回答错误')+'</span>'+esc(q.explain);
  var nxt=$('qNextBtn');nxt.style.display='inline-flex';
  nxt.textContent=(quiz.idx===quiz.list.length-1)?'查看结果 🎯':'下一题 →';
}
function saveStats(){lsSet(LS_STATS,getStats());}
function nextQuestion(){
  quiz.idx++;
  if(quiz.idx>=quiz.list.length){renderResult();return;}
  renderQuestion();
}
function renderResult(){
  var total=quiz.list.length,correct=quiz.correct,rate=Math.round(correct/total*100);
  var wrongs=quiz.answers.filter(function(a){return !a.correct;});
  // 错题进错题集
  wrongs.forEach(function(a){
    var col=getCol();
    col.unshift({id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),sub:quiz.sub,topicId:quiz.topic.id,topicName:quiz.topic.name,q:a.q.q,options:a.q.options,answer:a.q.answer,chosen:a.chosen,explain:a.q.explain,date:todayStr(),status:'open'});
    if(col.length>60)col.length=60;
    lsSet(LS_COL,col);
  });
  updateBadges();
  var mark=rate>=80?'🏆':(rate>=60?'👍':'💪');
  $('resultScore').innerHTML=esc(rate)+'<em>%</em>';
  $('resultMark').textContent=mark;
  $('resultSub').textContent='共 '+total+' 题 · 答对 '+correct+' 题'+(wrongs.length?(' · 新增 '+wrongs.length+' 道错题到错题集'):' · 全部正确，太棒了！');
  var list=$('resultList');list.innerHTML='';
  quiz.answers.forEach(function(a,i){
    var item=document.createElement('div');item.className='result-item';
    item.innerHTML='<span class="ri-mark">'+(a.correct?'✅':'❌')+'</span><span class="ri-q">'+(i+1)+'. '+esc(a.q.q)+'</span>';
    list.appendChild(item);
  });
  $('resultRetryBtn').onclick=function(){startQuiz(quiz.sub,quiz.topic,quiz.list.slice());};
  $('resultBackBtn').onclick=function(){renderDetail(quiz.sub,quiz.topic.id);};
  $('resultDashBtn').onclick=function(){renderDashboard();showView('viewDashboard');};
  $('resultColBtn').onclick=function(){renderCollection();showView('viewCollection');};
  showView('viewQuiz');
  $('qCard').style.display='none';
  $('resultCard').style.display='block';
}
function backToTopic(){
  if(quiz.topic){renderDetail(quiz.sub,quiz.topic.id);}
  else{renderLibrary();showView('viewLibrary');}
}

/* ===================== 错题集 ===================== */
function updateBadges(){
  var n=getCol().length;
  $('colBadge').textContent=n;
  $('colBadge2').textContent=n;
}
function renderCollection(){
  updateBadges();
  var col=getCol(),list=$('colList');
  if(!col.length){list.innerHTML='<div class="empty-state">📭 还没有错题。<br><br>去知识库选一个知识点开始训练，做错的题会自动收录到这里。</div>';$('colClearBtn').style.display='none';return;}
  $('colClearBtn').style.display='inline-flex';
  list.innerHTML='';
  col.forEach(function(c){
    var s=KB[c.sub]?KB[c.sub].name:c.sub;
    var item=document.createElement('div');item.className='col-item';
    var chosenTxt=c.options[c.chosen]||'';
    item.innerHTML='<div class="ci-top"><span class="ci-tag">'+esc(s)+' · '+esc(c.topicName)+'</span><span class="ci-date">'+esc(c.date)+'</span></div>'+
      '<div class="ci-q">'+esc(c.q)+'</div>'+
      '<div class="ci-a">你的答案：<b style="color:var(--danger)">'+esc(chosenTxt)+'</b> ｜ 正确答案：<b style="color:var(--ok)">'+esc(c.options[c.answer])+'</b></div>'+
      '<div class="ci-actions">'+
        '<button class="btn outline sm" data-act="redo">🔄 重做</button>'+
        '<button class="btn sm" data-act="master">✅ 已掌握</button>'+
        '<button class="btn danger sm" data-act="del">🗑️ 删除</button>'+
      '</div>';
    var redo=item.querySelector('[data-act=redo]');
    redo.onclick=function(){
      var t=findTopic(c.sub,c.topicId);
      var q=null;
      if(t){t.questions.forEach(function(x){if(x.q===c.q)q=x;});}
      if(q){startQuiz(c.sub,t||{id:c.topicId,name:c.topicName,questions:[]},[q],true);}
      else{toast('该题未找到，请重新训练','error');}
    };
    var master=item.querySelector('[data-act=master]');
    master.onclick=function(){
      var col2=getCol().filter(function(x){return x.id!==c.id;});
      lsSet(LS_COL,col2);renderCollection();toast('标记为已掌握，已移出错题集','success');
    };
    var del=item.querySelector('[data-act=del]');
    del.onclick=function(){
      var col2=getCol().filter(function(x){return x.id!==c.id;});
      lsSet(LS_COL,col2);renderCollection();toast('已删除','');
    };
    list.appendChild(item);
  });
}
function clearAll(){
  if(!getCol().length)return;
  if(confirm('确定清空全部错题？此操作不可恢复。')){lsSet(LS_COL,[]);renderCollection();toast('已清空','');}
}

/* ===================== AI 无限生成（可选） ===================== */
function getApiCfg(){
  return {key:(localStorage.getItem(LS_KEY)||'').trim(),base:(localStorage.getItem(LS_BASE)||'https://api.deepseek.com').trim().replace(/\/+$/,''),model:(localStorage.getItem(LS_MODEL)||'deepseek-chat').trim()};
}
function callAI(messages){
  var cfg=getApiCfg();
  if(!cfg.key)return Promise.reject(new Error('nokey'));
  return fetch(cfg.base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify({model:cfg.model,messages:messages,temperature:0.7,max_tokens:2048})})
    .then(function(r){if(!r.ok)return r.json().then(function(j){throw new Error('API '+r.status+(j&&j.error&&j.error.message?(': '+j.error.message):''));});return r.json();})
    .then(function(j){var c=j&&j.choices&&j.choices[0]&&j.choices[0].message?j.choices[0].message.content:'';if(!c)throw new Error('AI 未返回内容');return c;});
}
function aiGenerate(){
  var kp=$('aiKpInput').value.trim();
  if(!kp){toast('请输入知识点','error');return;}
  var btn=$('aiGenBtn');btn.disabled=true;var old=btn.textContent;btn.textContent='AI 生成中…';
  var prompt='你是一位资深高中理科教师。请把知识点「'+kp+'」拆解为：概念、核心要点、易错点、常见考法，并生成3道选择题（含答案与解析）。按以下 JSON 输出：{"concept":"...","points":["..."],"pitfalls":["..."],"foci":["..."],"questions":[{"q":"...","options":["A.","B.","C.","D."],"answer":0,"explain":"..."}]}';
  callAI([{role:'user',content:prompt}]).then(function(content){
    var data=null;
    try{data=JSON.parse(content.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim());}catch(e){}
    if(!data||!data.questions){throw new Error('AI 返回格式异常');}
    $('aiResult').innerHTML='<div class="detail-block"><h3>🧩 '+esc(kp)+'</h3><p>'+esc(data.concept||'')+'</p></div>'+
      '<div class="detail-block"><h3>🔑 核心要点</h3><ul>'+(data.points||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
      '<div class="detail-block"><h3>⚠️ 易错提醒</h3><ul>'+(data.pitfalls||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>';
    var qh='';
    data.questions.forEach(function(qq,i){
      qh+='<div class="detail-block"><h3>📝 训练题 '+(i+1)+'</h3><p style="font-weight:600">'+esc(qq.q)+'</p><ul>'+(qq.options||[]).map(function(o){return '<li>'+esc(o)+'</li>';}).join('')+'</ul><p style="color:var(--ok);margin-top:8px"><b>答案：</b>'+esc(String.fromCharCode(65+(qq.answer||0)))+'</p><p style="margin-top:6px"><b>解析：</b>'+esc(qq.explain||'')+'</p></div>';
    });
    $('aiResult').innerHTML+=qh;
    toast('AI 生成成功','success');
  }).catch(function(err){
    $('aiResult').innerHTML='';
    if(err.message==='nokey'){toast('未配置 API Key，请先使用内置知识库','error');}
    else{toast('生成失败：'+err.message,'error');}
  }).finally(function(){btn.disabled=false;btn.textContent=old;});
}

/* ===================== 设置 ===================== */
function openSettings(){
  $('apiKeyInput').value=localStorage.getItem(LS_KEY)||'';
  $('apiBaseInput').value=localStorage.getItem(LS_BASE)||'https://api.deepseek.com';
  $('modelInput').value=localStorage.getItem(LS_MODEL)||'deepseek-chat';
  $('settingsModal').classList.add('show');
}
function saveSettings(){
  localStorage.setItem(LS_KEY,$('apiKeyInput').value.trim());
  localStorage.setItem(LS_BASE,$('apiBaseInput').value.trim());
  localStorage.setItem(LS_MODEL,$('modelInput').value.trim());
  $('settingsModal').classList.remove('show');
  toast('设置已保存','success');
}

/* ===================== 初始化 ===================== */
function init(){
  // nav
  $('navDashBtn').onclick=function(){renderDashboard();showView('viewDashboard');};
  $('navLibBtn').onclick=function(){renderLibrary();showView('viewLibrary');};
  $('navColBtn').onclick=function(){renderCollection();showView('viewCollection');};
  $('settingsBtn').onclick=openSettings;
  // dashboard quick start
  $('quickOx').onclick=function(){quickStart('chemistry','chem-oxidation');};
  $('quickRes').onclick=function(){quickStart('biology','bio-respiration');};
  $('quickRandom').onclick=function(){
    var arr=allTopics();var o=arr[Math.floor(Math.random()*arr.length)];
    startQuiz(o.sub,o.topic,o.topic.questions.slice());
  };
  // detail back
  $('detailBackBtn').onclick=function(){renderLibrary();showView('viewLibrary');};
  // quiz
  $('qNextBtn').onclick=nextQuestion;
  $('quizBackBtn').onclick=backToTopic;
  // collection
  $('colClearBtn').onclick=clearAll;
  // settings modal
  $('saveSettingsBtn').onclick=saveSettings;
  document.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){$(b.getAttribute('data-close')).classList.remove('show');};});
  document.querySelectorAll('.modal-overlay').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('show');});});
  document.querySelectorAll('.modal-close').forEach(function(x){x.onclick=function(){x.closest('.modal-overlay').classList.remove('show');};});
  // AI
  $('aiGenBtn').onclick=aiGenerate;
  // reset quiz card display for first open
  $('qCard').style.display='block';
  $('resultCard').style.display='none';
  renderDashboard();renderLibrary();renderCollection();updateBadges();
  showView('viewDashboard');
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
else{init();}
})();
