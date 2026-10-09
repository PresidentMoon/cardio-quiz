/* 심혈관 퀴즈 – 문제는 data/questions.json, 진행 기록은 이 기기 localStorage, PDF는 IndexedDB */
'use strict';
const $ = s => document.querySelector(s);
const DOC_NAME = { heart: '3주차 심장', vessel: '5–6주차 혈관' };
const TYPE_NAME = { mc: '객관식', ox: 'OX', short: '단답형', card: '서술형' };
const NUM = ['①','②','③','④','⑤'];

/* ---------- 응원 사진·영상 설정 (파일 이름과 문구는 자유롭게 고쳐도 돼요) ---------- */
const MEDIA = {
  best:   'best.mp4',                     // 챕터를 최고로 잘 끝냈을 때 (90% 이상)
  worst:  'worst.mp4',                    // 챕터를 많이 못 끝냈을 때 (30% 미만)
  levelup:'best.mp4',                     // 레벨업할 때
  normal: ['normal.jpg'],                 // 평범하게 끝냈을 때 (50~69%)
  good:   ['good1.jpg','good2.jpg','good3.jpg','good4.jpg','good.jpg'],                       // 잘할 때
  bad:    ['bad1.jpg','bad2.jpg','bad3.jpg','bad4.jpg','bad5.jpg','bad6.jpg','bad7.jpg','bad8.jpg','cheer.jpg'] // 막힐 때
};
const ALL_MEDIA = [MEDIA.best, MEDIA.worst, ...MEDIA.normal, ...MEDIA.good, ...MEDIA.bad];
const CHEER = {
  goodAt: [3, 6, 10, 15, 20],      // 이만큼 연속으로 맞히면 사진 (20 이후엔 5개마다)
  cheerAfterWrong: 2,              // 연달아 이만큼 틀리면 사진
  gap: 4,                          // 사진끼리 최소 이만큼 문제 간격
  good: [
    ['완전 잘하는데?', '이 흐름 그대로 가자'],
    ['역시 내 여자친구', '심장 박동보다 정답 속도가 빨라'],
    ['천재 아니야?', '퀴즈 준비 끝난 거 같은데'],
    ['멋있다 진짜', '조금만 더 하면 시험 걱정 끝'],
    ['오늘 컨디션 최고네', '맞히는 거 보는 내가 다 뿌듯해']
  ],
  cheer: [
    ['괜찮아, 원래 여기 헷갈려', '틀린 건 오답 복습에 모아둘게'],
    ['나도 이거 몰라', '해설이랑 강의자료 한 번만 보고 가자'],
    ['천천히 해도 돼', '지금 틀린 게 시험에선 맞는 거야'],
    ['토닥토닥', '하나씩 외우면 금방 늘어'],
    ['힘내라 힘!', '잠깐 쉬었다 해도 괜찮아']
  ],
  // 챕터(한 판) 끝날 때: [기준 정답률, 사진 종류, 제목, 문구들]
  result: [
    [0.9, 'best',   '최고! 챕터 클리어', ['이건 진짜 천재다','완벽 그 자체, 오늘은 푹 쉬어','퀴즈 날 그냥 이대로만 해']],
    [0.7, 'good',   '잘했어!',           ['오늘도 잘했어, 진짜 대단해','이 정도면 퀴즈 걱정 없겠다','조금만 더 하면 만점이야']],
    [0.5, 'normal', '수고했어!',         ['딱 절반 넘었다, 이제 올라갈 일만 남았어','틀린 것만 한 번 더 보면 금방 늘어']],
    [0.3, 'bad',    '수고했어!',         ['푼 만큼 다 남는 거야','틀린 건 오답 복습에서 다시 만나자','오늘 한 것만으로도 충분히 잘했어']],
    [0,   'worst',  '오늘은 여기까지!',   ['이 영상 보고 웃고 다시 하자','괜찮아, 원래 처음엔 다 이래','쉬었다가 오답 복습부터 같이 하자']]
  ]
};
const pickOne = a => a[Math.floor(Math.random()*a.length)];

let BANK = [];
let save = loadSave();
let run = null;           // 현재 게임 상태
let current = null;       // 현재 문제

/* ---------- 저장 ---------- */
function loadSave(){
  try { return Object.assign({xp:0, streak:0, lastDay:'', today:0, todayDay:'', stats:{}}, JSON.parse(localStorage.getItem('cq-save')||'{}')); }
  catch(e){ return {xp:0, streak:0, lastDay:'', today:0, todayDay:'', stats:{}}; }
}
function persist(){ try { localStorage.setItem('cq-save', JSON.stringify(save)); } catch(e){} }
const dayStr = d => d.toISOString().slice(0,10);
function touchDay(){
  const t = dayStr(new Date());
  if (save.todayDay !== t){ save.today = 0; save.todayDay = t; }
  if (save.lastDay !== t){
    const y = dayStr(new Date(Date.now()-864e5));
    save.streak = (save.lastDay === y) ? save.streak + 1 : 1;
    save.lastDay = t;
  }
}
const level = xp => Math.floor(Math.sqrt(xp/60)) + 1;
const xpFor = l => 60*(l-1)*(l-1);

/* ---------- 홈 ---------- */
function renderHome(){
  const l = level(save.xp), a = xpFor(l), b = xpFor(l+1);
  $('#lvl').textContent = l;
  $('#streak').textContent = save.lastDay === dayStr(new Date()) || save.lastDay === dayStr(new Date(Date.now()-864e5)) ? save.streak : 0;
  $('#today').textContent = save.todayDay === dayStr(new Date()) ? save.today : 0;
  $('#xpfill').style.width = ((save.xp-a)/(b-a)*100) + '%';
  $('#xptext').textContent = `XP ${save.xp} · 다음 레벨까지 ${b-save.xp}`;
  $('#albumbtn').textContent = `${(save.album||[]).filter(m=>ALL_MEDIA.includes(m)).length} / ${ALL_MEDIA.length}`;
  $('#wrongcount').textContent = `틀린 문제 ${wrongIds().length}개`;
  const c = t => BANK.filter(q=>q.type===t).length;
  $('#bankinfo').textContent = BANK.length ? `문제은행 ${BANK.length}문제 (객관식 ${c('mc')} · OX ${c('ox')} · 단답 ${c('short')} · 서술 ${c('card')})` : '';
  pdfStatus();
}
function wrongIds(){ return Object.entries(save.stats).filter(([id,s])=>s.wrong>0 && s.lastWrong && BANK.some(q=>q.id===id)).map(([id])=>id); }

/* ---------- 문제 고르기: 안 본 문제·틀린 문제 우선 ---------- */
function weight(q){
  const s = save.stats[q.id];
  if (!s) return 3;
  if (s.lastWrong) return 4;
  return 1 / (1 + s.right);
}
function pick(pool, n){
  const arr = pool.map(q=>({q, k: Math.random() ** (1/weight(q))})).sort((a,b)=>b.k-a.k).map(x=>x.q);
  return n ? arr.slice(0,n) : arr;
}
function startMode(mode){
  let pool = BANK.filter(q=>q.type!=='card'), n = 10, lives = null, timer = null;
  if (mode==='heart' || mode==='vessel') pool = pool.filter(q=>q.topic===mode);
  if (mode==='time'){ pool = pool.filter(q=>q.type==='mc'||q.type==='ox'); n = 0; timer = 60; }
  if (mode==='survive'){ n = 0; lives = 3; }
  if (mode==='wrong'){ const w = new Set(wrongIds()); pool = BANK.filter(q=>w.has(q.id)); n = 0; if(!pool.length){ alert('아직 틀린 문제가 없어요. 문제를 먼저 풀어보세요.'); return; } }
  if (mode==='cards'){ pool = BANK.filter(q=>q.type==='card'); n = 0; }
  const queue = mode==='wrong' || mode==='cards' ? pick(pool).slice(0,20) : pick(pool, n||undefined);
  run = {mode, queue, i:0, score:0, answered:0, combo:0, best:0, xp:0, lives, timer, wrong:[], ended:false};
  show('play');
  if (timer){ run.tick = setInterval(()=>{ if ($('#pop').classList.contains('open') || $('#viewer').classList.contains('open')) return; run.timer--; hud(); if (run.timer<=0) endRun(); }, 1000); }
  nextQ();
}

/* ---------- 화면 ---------- */
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active', s.id===id)); window.scrollTo(0,0); }
function hud(){
  const total = run.queue.length;
  $('#progfill').style.width = run.timer!=null ? (run.timer/60*100)+'%' : (run.i/total*100)+'%';
  $('#hudright').textContent = run.timer!=null ? `${run.timer}초` : run.lives!=null ? '♥'.repeat(run.lives)+'♡'.repeat(3-run.lives) : `${Math.min(run.i+1,total)}/${total}`;
}
function nextQ(){
  if (run.ended) return;
  if (run.i >= run.queue.length){
    if (run.timer!=null || run.lives!=null){ run.queue.push(...pick(run.queue.slice())); } else return endRun();
  }
  current = run.queue[run.i];
  hud();
  $('#feedback').classList.remove('show');
  const card = $('#qcard');
  card.className = 'qcard ' + current.topic;
  $('#qmeta').textContent = `${DOC_NAME[current.topic]} · ${TYPE_NAME[current.type]}`;
  $('#qtext').textContent = current.q;
  const body = $('#qbody'); body.innerHTML = '';
  if (current.type==='mc'){
    const box = el('div','opts');
    current.options.forEach((o,i)=>{ const b = el('button','opt', `${NUM[i]} ${o}`); b.onclick=()=>answerMC(i,box); box.appendChild(b); });
    body.appendChild(box); body.appendChild(idk());
  } else if (current.type==='ox'){
    const box = el('div','opts ox');
    [['O',true],['X',false]].forEach(([t,v])=>{ const b = el('button','opt',t); b.onclick=()=>answerOX(v,box); box.appendChild(b); });
    body.appendChild(box); body.appendChild(idk());
  } else if (current.type==='short'){
    const wrap = el('div','short');
    const inp = el('input'); inp.type='text'; inp.placeholder='답 입력'; inp.setAttribute('aria-label','답 입력');
    const row = el('div','row'); const sub = el('button','btn','제출');
    sub.onclick = ()=>answerShort(inp.value);
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') answerShort(inp.value); });
    row.appendChild(sub); wrap.appendChild(inp); wrap.appendChild(row); body.appendChild(wrap); body.appendChild(idk());
    setTimeout(()=>inp.focus(), 50);
  } else if (current.type==='card'){
    const reveal = el('button','btn ghost','모범답안 보기');
    reveal.style.width='100%';
    reveal.onclick = ()=>{
      body.innerHTML='';
      body.appendChild(el('div','cardans', current.answer_text));
      const row = el('div','row'); row.style.marginTop='10px';
      const no = el('button','btn ghost','잘 몰랐어'), yes = el('button','btn','알고 있었어');
      no.onclick=()=>finish(false,''); yes.onclick=()=>finish(true,'');
      row.appendChild(no); row.appendChild(yes); body.appendChild(row);
    };
    body.appendChild(reveal);
  }
}
function el(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
function idk(){ const b = el('button','idk','모르겠어요'); b.onclick=()=>{
  document.querySelectorAll('#qbody button, #qbody input').forEach(x=>x.disabled=true);
  if (current.type==='mc') document.querySelectorAll('#qbody .opt')[current.answer].classList.add('correct');
  if (current.type==='ox') document.querySelectorAll('#qbody .opt')[current.answer?0:1].classList.add('correct');
  finish(false, '괜찮아요, 이번에 외우면 돼요.', true);
}; return b; }

function answerMC(i, box){
  box.querySelectorAll('.opt').forEach((b,j)=>{ b.disabled=true; if(j===current.answer) b.classList.add('correct'); });
  if (i!==current.answer) box.children[i].classList.add('wrong');
  finish(i===current.answer, `정답 ${NUM[current.answer]}`);
}
function answerOX(v, box){
  box.querySelectorAll('.opt').forEach((b,j)=>{ b.disabled=true; if((j===0)===current.answer) b.classList.add('correct'); });
  if (v!==current.answer) box.children[v?0:1].classList.add('wrong');
  finish(v===current.answer, `정답 ${current.answer?'O':'X'}`);
}
const norm = s => (s||'').toLowerCase().replace(/[\s\-·,()~]/g,'').replace(/×/g,'x');
function answerShort(v){
  const n = norm(v); if(!n) return;
  document.querySelectorAll('#qbody button, #qbody input').forEach(x=>x.disabled=true);
  const ok = current.accept.some(a=>{ const m=norm(a); return m===n || (m.length>3 && n.includes(m)); });
  finish(ok, '');
}

function finish(ok, head, gaveUp){
  const s = save.stats[current.id] || (save.stats[current.id] = {right:0, wrong:0, lastWrong:false});
  if (ok){ s.right++; s.lastWrong=false; } else { s.wrong++; s.lastWrong=true; }
  touchDay(); save.today++;
  run.answered++;
  run.wrongStreak = ok ? 0 : (run.wrongStreak||0) + 1;
  if (ok){
    run.score++; run.combo++; run.best=Math.max(run.best,run.combo);
    const gain = 10 + Math.min(run.combo-1, 5)*2; run.xp += gain;
    const before = level(save.xp); save.xp += gain;
    if (level(save.xp) > before) run.levelUp = level(save.xp);
    if (run.combo>=2){ const c=$('#combo'); c.textContent=`${run.combo}연속 정답 · +${gain}XP`; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
    else $('#combo').textContent = `+${gain}XP`;
    buzz(30);
  } else {
    run.combo=0; $('#combo').textContent='';
    run.wrong.push(current);
    if (run.lives!=null) run.lives--;
  }
  persist();
  const v = $('#verdict');
  v.className = 'verdict ' + (ok?'ok':'no');
  v.textContent = gaveUp ? '같이 확인해 보자' : ok ? pickOne(['정답!','맞았어!','좋아!','완벽해!']) : pickOne(['아깝다! 거의 다 왔어','괜찮아, 이번에 외우면 돼','헷갈릴 만했어']);
  let exp = [head, current.explain, current.type==='short' ? `모범답안: ${current.answer_text}` : ''].filter(Boolean).join('\n');
  if (current.type==='card') exp = ok ? '좋아요. 시험 전에 한 번 더 써 보세요.' : '모범답안의 키워드를 소리 내어 읽어 보세요.';
  if (gaveUp && current.type==='short') exp = `모범답안: ${current.answer_text}`;
  if (gaveUp && head) exp = [head, current.type==='mc'?`정답 ${NUM[current.answer]}`:current.type==='ox'?`정답 ${current.answer?'O':'X'}`:'', current.explain||''].filter(Boolean).join('\n');
  $('#explain').textContent = exp;
  const dw = $('#detailwrap'); dw.innerHTML = '';
  const dn = detailNode(current);
  if (dn){ const t = el('button','linkbtn','자세한 해설 펼치기'); t.style.padding='0 0 10px'; dn.style.display='none';
    t.onclick=()=>{ const o = dn.style.display==='none'; dn.style.display = o?'block':'none'; t.textContent = o?'자세한 해설 접기':'자세한 해설 펼치기'; };
    if (!ok){ dn.style.display='block'; t.textContent='자세한 해설 접기'; }   // 틀렸을 땐 바로 펼쳐서 보여주기
    dw.appendChild(t); dw.appendChild(dn); }
  const p = current.source && current.source.page;
  $('#showPdf').textContent = p ? `강의자료 ${p}쪽 보기` : '강의자료 보기';
  $('#showPdf').style.display = p ? '' : 'none';
  $('#feedback').classList.add('show');
  hud();
  if (run.lives===0){ $('#next').textContent='결과 보기'; } else $('#next').textContent='다음';
  maybePhoto(ok, gaveUp);
  setTimeout(()=>$('#feedback').scrollIntoView({behavior:'smooth', block:'nearest'}), 60);
  if (!ok && gaveUp && p) openViewer(current);   // 모르겠으면 자료부터 바로 보여주기
}
function pickMedia(list){
  const pool = list.length > 1 ? list.filter(m=>m!==run.lastMedia) : list;
  const m = pickOne(pool); run.lastMedia = m; return m;
}
function maybePhoto(ok, gaveUp){
  if (run.levelUp){ const lv = run.levelUp; run.levelUp = null; run.lastPhoto = run.answered;
    setTimeout(()=>showMedia(MEDIA.levelup, `레벨 ${lv} 달성!`, '레벨업 보상 영상 도착 · 추억 앨범에도 저장됐어', '계속 달리기'), 650); return; }
  const since = run.answered - (run.lastPhoto ?? -99);
  if (since < CHEER.gap) return;
  let kind = null;
  if (ok && (CHEER.goodAt.includes(run.combo) || (run.combo > 20 && run.combo % 5 === 0))) kind = 'good';
  if (!ok && !gaveUp && run.wrongStreak >= CHEER.cheerAfterWrong) kind = 'cheer';
  if (!kind) return;
  run.lastPhoto = run.answered;
  if (kind === 'cheer') run.wrongStreak = 0;
  const [msg, sub] = pickOne(CHEER[kind]);
  const src = pickMedia(kind==='good' ? MEDIA.good : MEDIA.bad);
  setTimeout(()=>showMedia(src, msg, kind==='good' ? `${run.combo}연속 정답 · ${sub}` : sub, kind==='good' ? '계속 달리기' : '다시 해볼게'), 650);
}
/* 사진이든 영상이든 같은 자리에 넣기. 영상은 소리 켜고 재생을 시도하고, 막히면 무음 재생 + 소리 버튼 */
function putMedia(box, src){
  box.querySelectorAll('video').forEach(v=>v.pause());
  box.innerHTML = '';
  if (/\.(mp4|webm|mov)$/i.test(src)){
    const v = document.createElement('video');
    v.src = src; v.playsInline = true; v.setAttribute('playsinline',''); v.loop = true; v.preload = 'auto';
    box.appendChild(v);
    const snd = el('button','soundbtn','🔇 소리 켜기'); snd.style.display='none';
    snd.onclick = e=>{ e.stopPropagation(); v.muted = false; v.play(); snd.style.display='none'; };
    box.appendChild(snd);
    v.muted = false;
    v.play().catch(()=>{ v.muted = true; v.play().catch(()=>{}); snd.style.display=''; });
  } else {
    const i = document.createElement('img'); i.src = src; i.alt = ''; box.appendChild(i);
  }
  collect(src);
}
function stopMedia(box){ box.querySelectorAll('video').forEach(v=>v.pause()); }
function collect(src){ save.album = save.album || []; if (!save.album.includes(src)){ save.album.push(src); persist(); } }
function showMedia(src, msg, sub, btn){
  putMedia($('#popmedia'), src);
  $('#popmsg').textContent = msg; $('#popsub').textContent = sub;
  $('#popclose').textContent = btn || '계속하기';
  $('#pop').classList.add('open');
  buzz([30,60,30]);
}
function closePop(){ stopMedia($('#popmedia')); $('#pop').classList.remove('open'); }
const DETAIL_LABEL = [['concept','핵심 개념'],['why','왜 이게 정답일까'],['wrong','헷갈리는 포인트'],['page_note','강의자료 이 쪽에서 볼 것'],['tip','외우는 팁']];
function detailNode(q){
  const d = q.detail; if (!d) return null;
  const box = el('div','detail');
  DETAIL_LABEL.forEach(([k,label])=>{ if(!d[k]) return; const sec=el('div','dsec'); sec.appendChild(el('b',null,label)); sec.appendChild(el('p',null,d[k])); box.appendChild(sec); });
  return box;
}
function buzz(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }

function endRun(){
  if (!run || run.ended) return;
  run.ended = true; clearInterval(run.tick);
  show('result');
  const ratio = run.answered ? run.score / run.answered : 0;
  // 너무 적게 풀고 끝내면(5문제 미만) 평범 사진
  const tier = run.answered < 5 ? CHEER.result[2] : CHEER.result.find(t=>ratio >= t[0]);
  const [, kind, title, caps] = tier;
  $('#rtitle').textContent = title;
  const src = kind==='best' ? MEDIA.best : kind==='worst' ? MEDIA.worst : pickMedia(MEDIA[kind]);
  putMedia($('#rmedia'), src);
  $('#rcap').textContent = !run.answered ? '다음엔 같이 풀어보자' : pickOne(caps);
  $('#rscore').textContent = run.score;
  $('#rtotal').textContent = ` / ${run.answered}`;
  $('#rxp').textContent = `+${run.xp} XP · 최고 ${run.best}연속 정답`;
  const w = $('#rwrong'); w.innerHTML='';
  if (run.wrong.length){
    w.appendChild(el('p','muted small','다시 보면 좋은 문제'));
    run.wrong.forEach(q=>{
      const d = el('div','wrongitem', q.q);
      const ans = q.type==='mc' ? `${NUM[q.answer]} ${q.options[q.answer]}` : q.type==='ox' ? (q.answer?'O':'X') : q.answer_text;
      d.appendChild(el('b',null, ans));
      if (q.source && q.source.page){ const b=el('button','linkbtn',`강의자료 ${q.source.page}쪽`); b.style.padding='4px 0 0'; b.onclick=()=>openViewer(q); d.appendChild(b); }
      w.appendChild(d);
    });
  }
}

/* ---------- PDF 저장 (IndexedDB) ---------- */
function idb(){ return new Promise((res,rej)=>{ const r=indexedDB.open('cq-pdf',1); r.onupgradeneeded=()=>r.result.createObjectStore('pdf'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function idbGet(k){ try{ const db=await idb(); return await new Promise(res=>{ const r=db.transaction('pdf').objectStore('pdf').get(k); r.onsuccess=()=>res(r.result||null); r.onerror=()=>res(null); }); }catch(e){ return null; } }
async function idbSet(k,v){ const db=await idb(); return new Promise((res,rej)=>{ const t=db.transaction('pdf','readwrite'); t.objectStore('pdf').put(v,k); t.oncomplete=res; t.onerror=()=>rej(t.error); }); }
async function idbClear(){ const db=await idb(); return new Promise(res=>{ const t=db.transaction('pdf','readwrite'); t.objectStore('pdf').clear(); t.oncomplete=res; }); }
const pdfCache = {};
async function getPdf(doc){
  if (pdfCache[doc]) return pdfCache[doc];
  const rec = await idbGet(doc);
  if (!rec) return null;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfCache[doc] = await pdfjsLib.getDocument({data: new Uint8Array(rec.data)}).promise;
  return pdfCache[doc];
}
async function pdfStatus(){
  const h = await idbGet('heart'), v = await idbGet('vessel');
  $('#st-heart').textContent = h ? `저장됨 · ${h.name}` : '없음';
  $('#st-vessel').textContent = v ? `저장됨 · ${v.name}` : '없음';
  $('#pdfstatus').textContent = (h&&v) ? '강의자료 2개 모두 불러와져 있어요.' : (h||v) ? '강의자료 1개만 불러와져 있어요.' : '강의자료를 불러오면 틀린 문제의 해당 페이지를 바로 볼 수 있어요.';
}

/* ---------- PDF 뷰어 ---------- */
let view = {doc:null, page:1, zoom:1, pdf:null};
async function openViewer(q){
  view = {doc:q.source.doc, page:q.source.page, zoom: window.innerHeight > window.innerWidth ? 2 : 1, pdf:null};
  $('#viewer').classList.add('open');
  $('#vtitle').textContent = DOC_NAME[view.doc];
  const exp = [q.type==='mc'?`정답 ${NUM[q.answer]} ${q.options[q.answer]}`:q.type==='ox'?`정답 ${q.answer?'O':'X'}`:'', q.explain||'', q.answer_text||''].filter(Boolean).join('\n');
  $('#vexptext').textContent = exp; $('#vexplain').open = true;
  const vd = $('#vdetail'); vd.innerHTML=''; const dn = detailNode(q); if (dn) vd.appendChild(dn);
  view.src = q.source.page; view.hl = (q.highlight||[]).map(h=>h.replace(/\s+/g,'')).filter(h=>h.length>=2);
  $('#pdfcanvas').style.display='none';
  $('#vmsg').textContent = '불러오는 중…';
  if (typeof pdfjsLib === 'undefined'){ $('#vmsg').textContent = 'PDF 뷰어를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 새로고침해 주세요.'; return; }
  view.pdf = await getPdf(view.doc).catch(()=>null);
  if (!view.pdf){
    $('#vmsg').innerHTML = '';
    $('#vmsg').appendChild(document.createTextNode(`아직 ${DOC_NAME[view.doc]} PDF를 불러오지 않았어요. `));
    const b = el('button','linkbtn','지금 불러오기'); b.onclick=()=>{ $('#viewer').classList.remove('open'); $('#pdfsetup').classList.add('open'); };
    $('#vmsg').appendChild(b);
    $('#vpage').textContent = `${view.page}쪽`;
    return;
  }
  renderPage();
}
async function renderPage(){
  const pdf = view.pdf; if(!pdf) return;
  view.page = Math.max(1, Math.min(pdf.numPages, view.page));
  $('#vpage').textContent = `${view.page} / ${pdf.numPages}쪽`;
  const page = await pdf.getPage(view.page);
  const wrapW = $('#canvaswrap').clientWidth - 20;
  const base = page.getViewport({scale:1});
  const scale = (wrapW / base.width) * view.zoom;
  const dpr = Math.min(window.devicePixelRatio||1, 3);
  const vp = page.getViewport({scale: scale*dpr});
  const c = $('#pdfcanvas'), ctx = c.getContext('2d');
  c.width = vp.width; c.height = vp.height;
  c.style.width = (vp.width/dpr)+'px'; c.style.height = (vp.height/dpr)+'px';
  c.style.display='block'; $('#vmsg').textContent='';
  await page.render({canvasContext:ctx, viewport:vp}).promise;
  const wrap = $('#canvaswrap');
  let spot = null;
  if (view.page === view.src && view.hl && view.hl.length) spot = await drawHighlights(page, vp, ctx);
  if (spot){ wrap.scrollTo({left: spot.x/dpr - wrap.clientWidth/2 + 10, top: spot.y/dpr - wrap.clientHeight/3}); }
  else wrap.scrollTo({left:0, top:0});
  $('#vpage').textContent = `${view.page} / ${pdf.numPages}쪽` + (view.page===view.src ? ' ★' : '');
}
/* 문제와 관련된 문구를 PDF 위에 형광펜처럼 칠하기 */
async function drawHighlights(page, vp, ctx){
  const tc = await page.getTextContent();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255, 214, 10, 0.55)';
  // 한글 PDF는 글자가 잘게 쪼개져 있어서, 쪽 전체 문자열에서 위치를 찾은 뒤 해당 조각들을 칠함
  const items = tc.items.filter(it=>it.str && it.str.trim());
  let full = '', map = [];
  items.forEach((it,i)=>{ for (const ch of it.str.replace(/\s+/g,'')){ full += ch; map.push(i); } });
  const hit = new Set(); let first = null;
  view.hl.forEach(h=>{ let from = 0, at; while ((at = full.indexOf(h, from)) !== -1){ for (let k=at; k<at+h.length; k++) hit.add(map[k]); from = at + h.length; } });
  hit.forEach(i=>{
    const it = items[i], t = it.transform, hgt = Math.hypot(t[2], t[3]) || it.height || 10;
    const r = vp.convertToViewportRectangle([t[4], t[5]-hgt*0.2, t[4]+it.width, t[5]+hgt*0.95]);
    const x = Math.min(r[0],r[2]), y = Math.min(r[1],r[3]);
    ctx.fillRect(x, y, Math.abs(r[2]-r[0]), Math.abs(r[3]-r[1]));
    if (!first || y < first.y) first = {x, y};
  });
  ctx.restore();
  return first;
}

/* ---------- 이벤트 ---------- */
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>startMode(b.dataset.mode));
$('#quit').onclick = ()=>{ if(run && run.answered) endRun(); else { if(run) clearInterval(run.tick); show('home'); renderHome(); } };
$('#next').onclick = ()=>{ if (run.lives===0) return endRun(); run.i++; $('#combo').textContent = run.combo>=2 ? `${run.combo}연속 정답 중` : ''; nextQ(); };
$('#showPdf').onclick = ()=>openViewer(current);
$('#rhome').onclick = ()=>{ stopMedia($('#rmedia')); show('home'); renderHome(); };
$('#ragain').onclick = ()=>{ stopMedia($('#rmedia')); startMode(run.mode); };
$('#vclose').onclick = ()=>$('#viewer').classList.remove('open');
$('#vprev').onclick = ()=>{ view.page--; renderPage(); };
$('#vnext').onclick = ()=>{ view.page++; renderPage(); };
$('#zin').onclick = ()=>{ view.zoom=Math.min(3,view.zoom+0.5); renderPage(); };
$('#zout').onclick = ()=>{ view.zoom=Math.max(1,view.zoom-0.5); renderPage(); };
$('#popclose').onclick = closePop;
$('#pop').onclick = e=>{ if(e.target.id==='pop') closePop(); };
$('#openAlbum').onclick = ()=>{
  const g = $('#albumgrid'); g.innerHTML = '';
  const have = new Set(save.album||[]);
  ALL_MEDIA.forEach(src=>{
    const cell = el('button','acell');
    if (have.has(src)){
      if (/\.mp4$/i.test(src)){ const v=document.createElement('video'); v.src=src+'#t=0.5'; v.muted=true; v.playsInline=true; v.preload='metadata'; cell.appendChild(v); cell.appendChild(el('span','play','▶')); }
      else { const i=document.createElement('img'); i.src=src; i.loading='lazy'; i.alt=''; cell.appendChild(i); }
      cell.onclick = ()=>showMedia(src, '추억 앨범', '', '닫기');
    } else { cell.classList.add('locked'); cell.appendChild(el('span',null,'?')); cell.setAttribute('aria-label','아직 못 모은 사진'); }
    g.appendChild(cell);
  });
  $('#albumcount').textContent = `${ALL_MEDIA.filter(m=>have.has(m)).length} / ${ALL_MEDIA.length} 모음`;
  $('#album').classList.add('open');
};
$('#aclose').onclick = ()=>$('#album').classList.remove('open');
$('#openPdfSetup').onclick = ()=>$('#pdfsetup').classList.add('open');
$('#sclose').onclick = ()=>$('#pdfsetup').classList.remove('open');
$('#clearPdf').onclick = async ()=>{ await idbClear(); for(const k in pdfCache) delete pdfCache[k]; pdfStatus(); };
document.querySelectorAll('#pdfsetup input[type=file]').forEach(inp=>inp.onchange=async ()=>{
  const f = inp.files[0]; if(!f) return;
  const doc = inp.dataset.doc;
  $('#st-'+doc).textContent = '저장 중…';
  try { await idbSet(doc, {name:f.name, data: await f.arrayBuffer()}); delete pdfCache[doc]; }
  catch(e){ $('#st-'+doc).textContent = '저장하지 못했어요. 브라우저 저장공간을 확인해 주세요.'; return; }
  pdfStatus();
});
let resizeT; window.addEventListener('resize', ()=>{ clearTimeout(resizeT); resizeT=setTimeout(()=>{ if($('#viewer').classList.contains('open')) renderPage(); },200); });

/* ---------- 시작 ---------- */
fetch('questions.json', {cache:'no-cache'})
  .then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(d=>{ BANK = d.questions; renderHome(); })
  .catch(()=>{ $('#bankinfo').textContent = '문제를 불러오지 못했어요. 사이트 주소(https://…github.io/…)로 접속했는지 확인해 주세요.'; renderHome(); });
