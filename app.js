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
  good:   ['good1.jpg','good2.jpg','good3.jpg','good4.jpg','good5.jpg','good6.jpg','good7.jpg','good8.jpg','good9.jpg','good10.jpg','good11.jpg','good12.jpg','good13.jpg','good14.jpg','good15.jpg','good16.jpg','good17.jpg','good18.jpg','good19.jpg','good20.jpg','good21.jpg','good22.jpg','good23.jpg','good24.jpg','good25.jpg','good.jpg'],                       // 잘할 때
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
    ['오늘 컨디션 최고네', '맞히는 거 보는 내가 다 뿌듯해'],
    ['앙 기모딱따구리!', '이 기세 그대로 가자'],
    ['아 쪼은데!', '계속 이렇게만 맞혀'],
    ['혜선아 사랑해! 진심으로 화이팅!!', '오늘도 너무 잘하고 있어']
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
    [0.9, 'best',   '최고! 챕터 클리어', ['이건 진짜 천재다','완벽 그 자체, 오늘은 푹 쉬어','퀴즈 날 그냥 이대로만 해','혜선아 사랑해! 진심으로 화이팅!!']],
    [0.7, 'good',   '잘했어!',           ['오늘도 잘했어, 진짜 대단해','이 정도면 퀴즈 걱정 없겠다','조금만 더 하면 만점이야','앙 기모딱따구리!','아 쪼은데!','혜선아 사랑해! 진심으로 화이팅!!']],
    [0.5, 'normal', '수고했어!',         ['딱 절반 넘었다, 이제 올라갈 일만 남았어','틀린 것만 한 번 더 보면 금방 늘어']],
    [0.3, 'bad',    '수고했어!',         ['푼 만큼 다 남는 거야','틀린 건 오답 복습에서 다시 만나자','오늘 한 것만으로도 충분히 잘했어']],
    [0,   'worst',  '오늘은 여기까지!',   ['이 영상 보고 웃고 다시 하자','괜찮아, 원래 처음엔 다 이래','쉬었다가 오답 복습부터 같이 하자']]
  ]
};
const pickOne = a => a[Math.floor(Math.random()*a.length)];

let BANK = [];
let UNITS = [];
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
  const fresh = BANK.filter(q=>!save.stats[q.id]).length;
  $('#bankinfo').textContent = BANK.length ? `문제은행 ${BANK.length}문제 (객관식 ${c('mc')} · OX ${c('ox')} · 단답 ${c('short')} · 서술 ${c('card')}) · 아직 안 본 문제 ${fresh}개` : '';
  renderUnits();
  renderGame();
  $('#wrongtotal').textContent = `${wrongIds().length}개`;
  const ex = (save.exams||[])[0];
  $('#examlast').textContent = ex ? `최근 ${ex.score}/${ex.n} (${Math.round(ex.score/ex.n*100)}%)` : '아직 응시 기록 없음';
  pdfStatus();
}
function unitName(id){ const u = UNITS.find(u=>u.id===id); return u ? u.name : ''; }
function renderUnits(){
  const box = $('#units'); if (!box) return; box.innerHTML = '';
  ['heart','vessel'].forEach(t=>{
    box.appendChild(el('p','unitgroup', t==='heart' ? '3주차 심장' : '5–6주차 혈관'));
    UNITS.filter(u=>u.topic===t).forEach(u=>{
      const qs = BANK.filter(q=>q.unit===u.id && q.type!=='card');
      const got = qs.filter(q=>(save.stats[q.id]||{}).right>0).length;
      const b = el('button','unit '+t);
      const name = el('span','uname', u.name); name.appendChild(el('small',null,`${u.pages[0]}~${u.pages[1]}쪽 · ${qs.length}문제 · 맞혀본 문제 ${got}`));
      const bar = el('span','ubar'); const fill = el('i'); fill.style.width = (qs.length ? got/qs.length*100 : 0)+'%'; bar.appendChild(fill);
      b.appendChild(name); b.appendChild(bar);
      b.onclick = ()=>startMode('unit:'+u.id);
      box.appendChild(b);
    });
  });
}
function wrongIds(){ return Object.entries(save.stats).filter(([id,s])=>s.wrong>0 && s.lastWrong && BANK.some(q=>q.id===id)).map(([id])=>id); }

/* ---------- 문제 고르기: 안 본 문제·틀린 문제 우선 ---------- */
/* 같은 문제 반복 줄이기:
   - 최근에 본 문제(최근 RECENT문제 안)는 웬만하면 다시 안 냄
   - 안 푼 문제를 가장 먼저, 틀린 문제는 조금 뒤에 다시(복습), 맞힌 문제는 맞힌 횟수만큼 점점 늦게 다시 냄 */
const RECENT = 120;
function bump(id, ok){
  save.seq = (save.seq||0) + 1;
  const s = save.stats[id] || (save.stats[id] = {right:0, wrong:0, lastWrong:false});
  if (ok){ s.right++; s.lastWrong=false; } else { s.wrong++; s.lastWrong=true; }
  s.at = save.seq;
}
function since(q){ const s = save.stats[q.id]; return s && s.at ? (save.seq||0) - s.at : Infinity; }
function pick(pool, n){
  const sh = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const st = q => save.stats[q.id];
  const unseen = sh(pool.filter(q=>!st(q)));
  const wrongDue = sh(pool.filter(q=>st(q) && st(q).lastWrong && since(q) >= 8));
  const rightDue = pool.filter(q=>st(q) && !st(q).lastWrong && since(q) >= Math.min(RECENT, 40 * 2 ** (st(q).right-1)))
                       .sort((a,b)=>since(b)-since(a));
  const rest = pool.filter(q=>!unseen.includes(q) && !wrongDue.includes(q) && !rightDue.includes(q)).sort((a,b)=>since(b)-since(a));
  if (!n){ return [...wrongDue, ...unseen, ...rightDue, ...rest]; }
  // 우선순위: 틀린 문제 복습(3) > 안 본 문제(2) > 오래전에 맞힌 문제(1) > 나머지(0)
  const pr = new Map();
  rest.forEach(q=>pr.set(q,0)); rightDue.forEach(q=>pr.set(q,1)); unseen.forEach(q=>pr.set(q,2)); wrongDue.forEach(q=>pr.set(q,3));
  // 비슷한 유형끼리 묶기: 안 본 문제가 많은 단원을 골라 그 단원에서 연달아 출제
  const unitsIn = [...new Set(pool.map(q=>q.unit))];
  const score = u => pool.filter(q=>q.unit===u).reduce((a,q)=>a + (pr.get(q)>=2 ? 2 : pr.get(q)), 0) + Math.random()*3;
  const order = unitsIn.map(u=>[u, score(u)]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const per = unitsIn.length===1 ? n : Math.ceil(n/2);
  const out = []; let wrongTaken = 0;
  for (const u of order){
    if (out.length>=n) break;
    const inU = pool.filter(q=>q.unit===u).sort((a,b)=> (pr.get(b)-pr.get(a)) || (since(b)-since(a)) || (Math.random()-0.5));
    let k = 0;
    for (const q of inU){
      if (out.length>=n || k>=per) break;
      if (pr.get(q)===3){ if (wrongTaken >= Math.ceil(n*0.4)) continue; wrongTaken++; }
      out.push(q); k++;
    }
  }
  // 같은 단원 안에서는 쪽 순서대로 → 비슷한 내용이 이어서 나옴
  const uo = new Map(order.map((u,i)=>[u,i]));
  return out.sort((a,b)=> (uo.get(a.unit)-uo.get(b.unit)) || ((a.source||{}).page - (b.source||{}).page));
}
/* 객관식 보기 순서 섞기 (해설이 보기 번호를 직접 말하는 문제는 그대로 둠) */
function withShuffledOptions(q){
  if (q.type!=='mc') return q;
  const txt = JSON.stringify([q.explain||'', q.detail||{}]);
  if (/[1-4]번|①|②|③|④/.test(txt)) return q;
  const order = q.options.map((_,i)=>i);
  for (let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  return Object.assign({}, q, {options: order.map(i=>q.options[i]), answer: order.indexOf(q.answer)});
}
function startMode(mode){
  let pool = BANK.filter(q=>q.type!=='card'), n = 10, lives = null, timer = null;
  if (mode==='heart' || mode==='vessel') pool = pool.filter(q=>q.topic===mode);
  if (mode.startsWith('unit:')){ const u = mode.slice(5); pool = pool.filter(q=>q.unit===u); }
  if (mode.startsWith('wrongunit:')){ const u = mode.slice(10); pool = BANK.filter(q=>q.unit===u && (save.stats[q.id]||{}).lastWrong); n = 0; if(!pool.length){ alert('이 단원에 틀려 있는 문제가 없어요.'); return; } }
  if (mode==='time'){ pool = pool.filter(q=>q.type==='mc'||q.type==='ox'); n = 0; timer = 60; }
  if (mode==='survive'){ n = 0; lives = 3; }
  if (mode==='wrong'){ const w = new Set(wrongIds()); pool = BANK.filter(q=>w.has(q.id)); n = 0; if(!pool.length){ alert('아직 틀린 문제가 없어요. 문제를 먼저 풀어보세요.'); return; } }
  if (mode==='cards'){ pool = BANK.filter(q=>q.type==='card'); n = 0; }
  const queue = mode==='wrong' || mode==='cards' || mode.startsWith('wrongunit:') ? pick(pool).slice(0,20).sort((a,b)=>(a.unit>b.unit)-(a.unit<b.unit) || a.source.page-b.source.page) : pick(pool, n||undefined);
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
  current = withShuffledOptions(run.queue[run.i]);
  hud();
  $('#feedback').classList.remove('show');
  const card = $('#qcard');
  card.className = 'qcard ' + current.topic;
  $('#qmeta').textContent = `${DOC_NAME[current.topic]} · ${unitName(current.unit) ? unitName(current.unit)+' · ' : ''}${TYPE_NAME[current.type]}`;
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
  bump(current.id, ok);
  touchDay(); save.today++;
  run.answered++;
  run.wrongStreak = ok ? 0 : (run.wrongStreak||0) + 1;
  if (ok){
    run.score++; run.combo++; run.best=Math.max(run.best,run.combo);
    const gain = 10 + Math.min(run.combo-1, 5)*2; run.xp += gain;
    const before = level(save.xp); save.xp += gain;
    if (level(save.xp) > before){ run.levelUp = level(save.xp); run.levelFrom = before; }
    eggTick(1);
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
  inlinePdf(current, $('#inlinepdf'), !ok);
  hud();
  if (run.lives===0){ $('#next').textContent='결과 보기'; } else $('#next').textContent='다음';
  maybePhoto(ok, gaveUp);
  checkAch({best: run.best});
  setTimeout(()=>$('#feedback').scrollIntoView({behavior:'smooth', block:'nearest'}), 60);
  if (!ok && gaveUp && p) openViewer(current);   // 모르겠으면 자료부터 바로 보여주기
}
function pickMedia(list){
  const pool = list.length > 1 ? list.filter(m=>m!==run.lastMedia) : list;
  const m = pickOne(pool); run.lastMedia = m; return m;
}
function maybePhoto(ok, gaveUp){
  if (run.levelUp){ const lv = run.levelUp, from = run.levelFrom; run.levelUp = null; run.lastPhoto = run.answered;
    setTimeout(()=>{ if (!evoCheck(from)) showMedia(MEDIA.levelup, `레벨 ${lv} 달성!`, '레벨업 보상 영상 도착 · 추억 앨범에도 저장됐어', '계속 달리기', 'legend'); }, 650); return; }
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
const POPQ = [];
function showMedia(src, msg, sub, btn, rarity){
  if ($('#pop').classList.contains('open')){ POPQ.push([src,msg,sub,btn,rarity]); return; }
  putMedia($('#popmedia'), src);
  $('#popmsg').textContent = msg; $('#popsub').textContent = sub;
  $('#popclose').textContent = btn || '계속하기';
  const bd = $('#popbadge'); bd.className = 'badge ' + (rarity||''); bd.textContent = rarity ? RARITY_NAME[rarity] : '';
  $('#pop').classList.add('open');
  buzz([30,60,30]);
}
function closePop(){ stopMedia($('#popmedia')); $('#pop').classList.remove('open'); if (POPQ.length) setTimeout(()=>showMedia(...POPQ.shift()), 250); }
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
  checkAch({best: run.best, perfect: run.queue.length===10 && run.answered===10 && run.score===10, mode: run.mode, score: run.score});
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
/* 깃허브 저장소에 올린 PDF 파일 이름 (저장소 맨 위에 이 이름으로 올리기) */
const PDF_FILES = { heart: 'heart.pdf', vessel: 'vessel.pdf' };
async function getPdf(doc){
  if (pdfCache[doc]) return pdfCache[doc];
  let rec = await idbGet(doc);
  if (!rec){
    // 기기에 저장된 게 없으면 사이트에 올라간 PDF를 자동으로 받아서 기기에 저장
    try {
      const r = await fetch(PDF_FILES[doc]);
      if (!r.ok) return null;
      rec = {name: PDF_FILES[doc], data: await r.arrayBuffer()};
      idbSet(doc, rec).catch(()=>{});
    } catch(e){ return null; }
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfCache[doc] = await pdfjsLib.getDocument({data: new Uint8Array(rec.data)}).promise;
  return pdfCache[doc];
}
async function pdfStatus(){
  const h = await idbGet('heart'), v = await idbGet('vessel');
  $('#st-heart').textContent = h ? `저장됨 · ${h.name}` : '없음';
  $('#st-vessel').textContent = v ? `저장됨 · ${v.name}` : '없음';
  $('#pdfstatus').textContent = (h&&v) ? '강의자료 2개 모두 준비돼 있어요.' : '강의자료는 문제를 풀 때 자동으로 불러와요.';
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
async function drawHighlights(page, vp, ctx, hl){
  hl = hl || view.hl || [];
  const tc = await page.getTextContent();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255, 214, 10, 0.55)';
  // 한글 PDF는 글자가 잘게 쪼개져 있어서, 쪽 전체 문자열에서 위치를 찾은 뒤 해당 조각들을 칠함
  const items = tc.items.filter(it=>it.str && it.str.trim());
  let full = '', map = [];
  items.forEach((it,i)=>{ for (const ch of it.str.replace(/\s+/g,'')){ full += ch; map.push(i); } });
  const hit = new Set(); let first = null;
  hl.forEach(h=>{ let from = 0, at; while ((at = full.indexOf(h, from)) !== -1){ for (let k=at; k<at+h.length; k++) hit.add(map[k]); from = at + h.length; } });
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
document.querySelectorAll('.mode[data-mode]').forEach(b=>b.onclick=()=>startMode(b.dataset.mode));
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

/* ---------- 실전 테스트 ---------- */
const exOpt = {range:'all', n:20, time:0};
let EX = null;
function shuffle(a){ a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function buildExam(){
  const pool = BANK.filter(q=>q.type!=='card' && (exOpt.range==='all' || q.topic===exOpt.range));
  const units = [...new Set(pool.map(q=>q.unit))];
  const n = Math.min(exOpt.n, pool.length);
  // 단원 크기에 비례해서 고르게 배분
  const alloc = units.map(u=>({u, k: Math.floor(n * pool.filter(q=>q.unit===u).length / pool.length)}));
  let left = n - alloc.reduce((a,b)=>a+b.k,0);
  shuffle(alloc).forEach(a=>{ if (left>0){ a.k++; left--; } });
  let picked = [];
  alloc.forEach(({u,k})=>{ picked.push(...shuffle(pool.filter(q=>q.unit===u)).slice(0,k)); });
  picked = shuffle(picked);
  // 객관식 보기 순서도 섞기 (정답 위치 외우기 방지)
  return picked.map(q=>{
    if (q.type!=='mc') return {q, opts:null, ans:q.answer, pick:null};
    const order = shuffle(q.options.map((_,i)=>i));
    return {q, opts: order.map(i=>q.options[i]), ans: order.indexOf(q.answer), pick:null};
  });
}
function openExamSetup(){
  show('examsetup');
  const h = $('#eshistory'); h.innerHTML = '';
  const list = save.exams || [];
  if (list.length){
    const box = el('div','history'); box.appendChild(el('h3','sec','지난 기록'));
    list.slice(0,8).forEach(e=>{ const r = el('div','urow'); r.appendChild(el('span',null,`${e.date} · ${e.range==='all'?'전체':e.range==='heart'?'심장':'혈관'}`)); r.appendChild(el('b',null,`${e.score}/${e.n} (${Math.round(e.score/e.n*100)}%)`)); box.appendChild(r); });
    h.appendChild(box);
  }
}
function startExam(){
  const items = buildExam();
  if (!items.length){ alert('문제를 불러오지 못했어요.'); return; }
  if (EX) clearInterval(EX.tick);
  EX = {items, i:0, left: exOpt.time ? items.length*60 : null, done:false};
  show('exam');
  if (EX.left){ EX.tick = setInterval(()=>{ if ($('#viewer').classList.contains('open')) return; EX.left--; exHud(); if (EX.left<=0){ clearInterval(EX.tick); alert('시간이 다 됐어요. 지금까지 푼 것으로 채점할게요.'); gradeExam(); } }, 1000); }
  renderExamQ();
}
const answered = x => x.pick!==null && x.pick!=='';
function exHud(){
  const a = EX.items.filter(answered).length;
  $('#exprog').style.width = (a/EX.items.length*100)+'%';
  const t = EX.left!=null ? ` · ${Math.floor(EX.left/60)}:${String(EX.left%60).padStart(2,'0')}` : '';
  $('#exinfo').textContent = `${a}/${EX.items.length}${t}`;
  const g = $('#exgrid'); g.innerHTML='';
  EX.items.forEach((x,k)=>{ const b = el('button', (answered(x)?'done ':'') + (k===EX.i?'cur':''), String(k+1)); b.onclick=()=>{ EX.i=k; renderExamQ(); }; g.appendChild(b); });
}
function renderExamQ(){
  const x = EX.items[EX.i], q = x.q;
  $('#excard').className = 'qcard ' + q.topic;
  $('#exmeta').textContent = `${EX.i+1}번 · ${unitName(q.unit)} · ${TYPE_NAME[q.type]}`;
  $('#extext').textContent = q.q;
  const body = $('#exbody'); body.innerHTML='';
  if (q.type==='mc' || q.type==='ox'){
    const labels = q.type==='mc' ? x.opts.map((o,k)=>`${NUM[k]} ${o}`) : ['O','X'];
    const vals = q.type==='mc' ? x.opts.map((_,k)=>k) : [true,false];
    const box = el('div', q.type==='ox' ? 'opts ox' : 'opts');
    labels.forEach((t,k)=>{ const b = el('button','opt'+(x.pick===vals[k]?' picked':''), t); b.onclick=()=>{ x.pick = vals[k]; renderExamQ(); }; box.appendChild(b); });
    body.appendChild(box);
  } else {
    const inp = el('input'); inp.type='text'; inp.placeholder='답 입력'; inp.value = x.pick || ''; inp.setAttribute('aria-label','답 입력');
    inp.oninput = ()=>{ x.pick = inp.value; exHud(); };
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && EX.i<EX.items.length-1){ EX.i++; renderExamQ(); } });
    const w = el('div','short'); w.appendChild(inp); body.appendChild(w);
  }
  $('#exprev').disabled = EX.i===0;
  $('#exnext').disabled = EX.i===EX.items.length-1;
  $('#exnext').textContent = EX.i===EX.items.length-1 ? '마지막 문제' : '다음';
  exHud();
}
function isRight(x){
  if (!answered(x)) return false;
  if (x.q.type==='short'){ const n = norm(x.pick); return x.q.accept.some(a=>{ const m=norm(a); return m===n || (m.length>3 && n.includes(m)); }); }
  return x.pick === x.ans;
}
function gradeExam(){
  if (!EX || EX.done) return;
  EX.done = true; clearInterval(EX.tick);
  let score = 0; touchDay();
  EX.items.forEach(x=>{
    x.ok = isRight(x); if (x.ok) score++;
    const s = save.stats[x.q.id] || (save.stats[x.q.id] = {right:0, wrong:0, lastWrong:false});
    bump(x.q.id, x.ok);
    save.today++;
  });
  const gain = score*10; const lvBefore = level(save.xp); save.xp += gain;
  eggTick(score);
  save.exams = [{date: new Date().toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'}), n: EX.items.length, score, range: exOpt.range}, ...(save.exams||[])].slice(0,20);
  persist();
  show('examresult');
  const n = EX.items.length, ratio = score/n;
  $('#erscore').textContent = score; $('#ertotal').textContent = ` / ${n}`;
  $('#ersub').textContent = `정답률 ${Math.round(ratio*100)}% · +${gain} XP`;
  const [, kind, title, caps] = CHEER.result.find(t=>ratio >= t[0]);
  $('#ertitle').textContent = title;
  putMedia($('#ermedia'), kind==='best' ? MEDIA.best : kind==='worst' ? MEDIA.worst : pickOne(MEDIA[kind]));
  $('#ercap').textContent = pickOne(caps);
  const ub = $('#erunits'); ub.innerHTML='';
  [...new Set(EX.items.map(x=>x.q.unit))].sort().forEach(u=>{
    const xs = EX.items.filter(x=>x.q.unit===u), ok = xs.filter(x=>x.ok).length;
    const r = el('div','urow'); r.appendChild(el('span',null,unitName(u)));
    const bar = el('span','ubar'); const f = el('i'); f.style.width=(ok/xs.length*100)+'%'; bar.appendChild(f); r.appendChild(bar);
    r.appendChild(el('b',null,`${ok}/${xs.length}`)); ub.appendChild(r);
  });
  EX.wrongOnly = false; $('#erfilter').textContent = '틀린 것만 보기';
  evoCheck(lvBefore); checkAch({});
  renderReview();
}
function ansText(x, v){
  if (v===null || v==='') return '(안 풀었음)';
  if (x.q.type==='mc') return `${NUM[v]} ${x.opts[v]}`;
  if (x.q.type==='ox') return v ? 'O' : 'X';
  return v;
}
function renderReview(){
  const box = $('#erlist'); box.innerHTML='';
  EX.items.forEach((x,k)=>{
    if (EX.wrongOnly && x.ok) return;
    const d = el('div','review'+(x.ok?'':' no'));
    d.appendChild(el('p','rq',`${k+1}. ${x.q.q}`));
    const mine = el('p','ra'); mine.appendChild(el('b',null,'내 답: ')); mine.appendChild(document.createTextNode(ansText(x, x.pick))); d.appendChild(mine);
    if (!x.ok){ const c = el('p','ra'); c.appendChild(el('b',null,'정답: ')); c.appendChild(document.createTextNode(x.q.type==='short' ? x.q.answer_text : ansText(x, x.ans))); d.appendChild(c); }
    if (x.q.explain) d.appendChild(el('p','rexp', x.q.explain));
    const dn = detailNode(x.q);
    if (dn){ const t = el('button','linkbtn','자세한 해설'); t.style.padding='6px 12px 0 0'; dn.style.display='none'; t.onclick=()=>{ dn.style.display = dn.style.display==='none'?'block':'none'; }; d.appendChild(t); d.appendChild(dn); }
    if (x.q.source && x.q.source.page){ const b = el('button','linkbtn',`강의자료 ${x.q.source.page}쪽`); b.style.padding='6px 0 0'; b.onclick=()=>openViewer(x.q); d.appendChild(b); }
    box.appendChild(d);
  });
  if (!box.children.length) box.appendChild(el('p','muted','다 맞혔어요. 다시 볼 문제가 없어요!'));
}
document.querySelectorAll('.chips').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  g.querySelectorAll('button').forEach(x=>x.classList.toggle('on', x===b));
  const k = g.dataset.key; exOpt[k] = k==='range' ? b.dataset.v : +b.dataset.v;
}));
$('#openExam').onclick = openExamSetup;
$('#esback').onclick = ()=>{ show('home'); renderHome(); };
$('#esstart').onclick = startExam;
$('#exprev').onclick = ()=>{ if (EX.i>0){ EX.i--; renderExamQ(); } };
$('#exnext').onclick = ()=>{ if (EX.i<EX.items.length-1){ EX.i++; renderExamQ(); } };
$('#exsubmit').onclick = ()=>{
  const empty = EX.items.filter(x=>!answered(x)).length;
  if (empty && !confirm(`아직 안 푼 문제가 ${empty}개 있어요. 그래도 제출할까요?`)) return;
  gradeExam();
};
$('#exquit').onclick = ()=>{ if (confirm('실전 테스트를 그만둘까요? 기록은 남지 않아요.')){ clearInterval(EX.tick); EX=null; show('home'); renderHome(); } };
$('#erfilter').onclick = ()=>{ EX.wrongOnly = !EX.wrongOnly; $('#erfilter').textContent = EX.wrongOnly ? '전체 보기' : '틀린 것만 보기'; renderReview(); };
$('#erhome').onclick = ()=>{ stopMedia($('#ermedia')); show('home'); renderHome(); };
$('#eragain').onclick = ()=>{ stopMedia($('#ermedia')); openExamSetup(); };

/* =========================================================
   게임 요소: 알 깨기 · 성호 진화 · 업적
   ========================================================= */
const EGG_N = 25;   // 정답 25개마다 알 하나 부화
const EVOLVE = [    // 레벨에 따라 성호가 진화 (사진·이름은 자유롭게 바꿔도 돼요)
  {lv:1,  name:'성호 알',      img:null},
  {lv:2,  name:'아기 성호',     img:'bad1.jpg'},
  {lv:3,  name:'째려보는 성호', img:'bad4.jpg'},
  {lv:5,  name:'고양이 성호',   img:'good7.jpg'},
  {lv:7,  name:'금발 성호',     img:'good8.jpg'},
  {lv:9,  name:'훈남 성호',     img:'good3.jpg'},
  {lv:12, name:'전설의 성호',   img:'good10.jpg'}
];
const RARITY = { legend:[MEDIA.best, MEDIA.worst], rare: MEDIA.good, common: [...MEDIA.normal, ...MEDIA.bad] };
const RARITY_NAME = { legend:'전설', rare:'레어', common:'일반' };
function rarityOf(src){ return RARITY.legend.includes(src) ? 'legend' : RARITY.rare.includes(src) ? 'rare' : 'common'; }
function G(){ return save.game || (save.game = {egg:0, hatched:0, ach:{}, evo:0, dup:0}); }
function stageFor(lv){ let k=0; EVOLVE.forEach((e,i)=>{ if (lv>=e.lv) k=i; }); return k; }

const EGG_SVG = crack => `<svg viewBox="0 0 100 120" class="eggsvg" aria-hidden="true">
  <ellipse cx="50" cy="66" rx="38" ry="48" fill="#FFF6E6" stroke="#E2C58F" stroke-width="3"/>
  <circle cx="34" cy="52" r="6" fill="#F4D9A8"/><circle cx="62" cy="80" r="8" fill="#F4D9A8"/><circle cx="66" cy="44" r="4" fill="#F4D9A8"/>
  ${crack>=1?'<path d="M30 40 l8 8 l-6 6 l9 7" fill="none" stroke="#8A6A3A" stroke-width="2.5"/>':''}
  ${crack>=2?'<path d="M70 58 l-7 6 l6 7 l-8 6" fill="none" stroke="#8A6A3A" stroke-width="2.5"/>':''}
  ${crack>=3?'<path d="M44 96 l6 -8 l6 7 l6 -9" fill="none" stroke="#8A6A3A" stroke-width="2.5"/>':''}
  ${crack>=4?'<path d="M14 66 l14 -4 l10 6 l12 -6 l12 6 l12 -5 l12 3" fill="none" stroke="#8A6A3A" stroke-width="3"/>':''}
</svg>`;

/* 정답 하나마다 알이 조금씩 깨짐 */
function eggTick(nCorrect){
  const g = G(); g.egg += nCorrect;
  while (g.egg >= EGG_N){ g.egg -= EGG_N; queueHatch(); }
  persist();
}
function queueHatch(){
  const g = G(); g.hatched++;
  const r = Math.random();
  const tier = r < 0.08 ? 'legend' : r < 0.45 ? 'rare' : 'common';
  const have = new Set(save.album||[]);
  const fresh = RARITY[tier].filter(m=>!have.has(m));
  const src = (fresh.length && Math.random() < 0.75) ? pickOne(fresh) : pickOne(RARITY[tier]);
  const dup = have.has(src);
  if (dup){ save.xp += 30; g.dup = (g.dup||0)+1; }
  if (tier==='legend') g.legend = true;
  showMedia(src, `알이 깨졌다! ${RARITY_NAME[tier]} 성호 등장`, dup ? '이미 있는 카드라 +30XP로 바꿔줬어' : '추억 앨범에 새 카드가 들어갔어', '좋아!', tier);
  persist();
}
function evoCheck(beforeLv){
  const now = level(save.xp), a = stageFor(beforeLv), b = stageFor(now);
  if (b > a){
    G().evo = b;
    const e = EVOLVE[b];
    if (e.img) showMedia(e.img, `성호가 진화했다!`, `${EVOLVE[a].name} → ${e.name} (Lv ${now})`, '멋지다!', 'rare');
    return true;
  }
  return false;
}

/* ---------- 업적 ---------- */
const ACH = [
  ['first','🌱','첫 걸음','첫 문제 풀기'],
  ['s50','📗','50문제 돌파','문제 50개 풀기'],
  ['s150','📘','150문제 돌파','문제 150개 풀기'],
  ['s300','📙','300문제 돌파','문제 300개 풀기'],
  ['all','🏆','문제은행 정복','모든 문제를 한 번 이상 보기'],
  ['c5','🔥','5연속 정답','한 판에서 5개 연속 정답'],
  ['c10','💥','10연속 정답','한 판에서 10개 연속 정답'],
  ['c20','⚡','20연속 정답','한 판에서 20개 연속 정답'],
  ['perfect','💯','퍼펙트','10문제 판을 전부 맞히기'],
  ['ex1','📝','첫 실전','실전 테스트 처음 응시'],
  ['ex80','🎯','실전 80점','실전 테스트 80% 이상'],
  ['ex100','👑','실전 만점','실전 테스트 100%'],
  ['ex5','🧠','실전 5회','실전 테스트 5번 응시'],
  ['units','🗺️','전 단원 탐험','12개 단원 모두 한 문제 이상 풀기'],
  ['master','🎓','단원 마스터','한 단원의 문제를 전부 한 번 이상 맞히기'],
  ['fix10','🩹','오답 10개 정복','틀렸던 문제 10개를 다시 맞히기'],
  ['fix50','🩺','오답 50개 정복','틀렸던 문제 50개를 다시 맞히기'],
  ['d3','📅','3일 연속','3일 연속 공부'],
  ['d7','🗓️','7일 연속','7일 연속 공부'],
  ['night','🌙','올빼미','밤 12시~새벽 4시에 공부'],
  ['morning','🌅','아침형 인간','새벽 5시~8시에 공부'],
  ['egg1','🥚','첫 부화','알을 처음 깨기'],
  ['egg5','🐣','알 부화 장인','알 5개 깨기'],
  ['legend','🌟','전설 획득','알에서 전설 카드 뽑기'],
  ['alb10','🖼️','수집가','추억 앨범 10장 모으기'],
  ['alball','💖','완벽한 앨범','추억 앨범 전부 모으기'],
  ['lv5','⭐','레벨 5','레벨 5 달성'],
  ['lv10','🌠','레벨 10','레벨 10 달성'],
  ['evo','🦋','진화','성호를 한 번 진화시키기'],
  ['evomax','🐉','최종 진화','전설의 성호까지 진화'],
  ['time15','⏱️','번개 손','60초 타임어택에서 15개 이상 맞히기'],
  ['heart15','❤️','하트 지킴이','하트 챌린지에서 15개 이상 맞히기']
];
function checkAch(ctx={}){
  const g = G(), got = [];
  const seen = BANK.filter(q=>q.type!=='card' && save.stats[q.id]);
  const total = Object.values(save.stats).reduce((a,s)=>a+s.right+s.wrong,0);
  const fixed = Object.values(save.stats).filter(s=>s.wrong>0 && !s.lastWrong).length;
  const units = new Set(BANK.filter(q=>save.stats[q.id]).map(q=>q.unit));
  const master = UNITS.some(u=>{ const qs=BANK.filter(q=>q.unit===u.id && q.type!=='card'); return qs.length && qs.every(q=>(save.stats[q.id]||{}).right>0); });
  const album = (save.album||[]).filter(m=>ALL_MEDIA.includes(m)).length;
  const h = new Date().getHours();
  const ex = save.exams||[];
  const cond = {
    first: total>=1, s50: total>=50, s150: total>=150, s300: total>=300,
    all: seen.length >= BANK.filter(q=>q.type!=='card').length,
    c5: ctx.best>=5, c10: ctx.best>=10, c20: ctx.best>=20,
    perfect: ctx.perfect,
    ex1: ex.length>=1, ex80: ex.some(e=>e.score/e.n>=0.8), ex100: ex.some(e=>e.score===e.n), ex5: ex.length>=5,
    units: UNITS.length && units.size>=UNITS.length, master,
    fix10: fixed>=10, fix50: fixed>=50,
    d3: save.streak>=3, d7: save.streak>=7,
    night: total>0 && h<4, morning: total>0 && h>=5 && h<8,
    egg1: g.hatched>=1, egg5: g.hatched>=5, legend: !!g.legend,
    alb10: album>=10, alball: album>=ALL_MEDIA.length,
    lv5: level(save.xp)>=5, lv10: level(save.xp)>=10,
    evo: stageFor(level(save.xp))>=1, evomax: stageFor(level(save.xp))>=EVOLVE.length-1,
    time15: ctx.mode==='time' && ctx.score>=15, heart15: ctx.mode==='survive' && ctx.score>=15
  };
  ACH.forEach(([id,icon,name])=>{ if (cond[id] && !g.ach[id]){ g.ach[id] = new Date().toLocaleDateString('ko-KR'); save.xp += 20; got.push([icon,name]); } });
  if (got.length){ persist(); got.forEach(([icon,name],i)=>setTimeout(()=>toast(`${icon} 업적 달성: ${name}  +20XP`), 400 + i*1800)); }
}
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  buzz([20,40,20]);
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2600);
}
function renderGame(){
  const g = G(), lv = level(save.xp), st = stageFor(lv), e = EVOLVE[st], nx = EVOLVE[st+1];
  const pet = $('#petimg');
  pet.innerHTML = e.img ? `<img src="${e.img}" alt="">` : EGG_SVG(0);
  $('#petname').textContent = e.name;
  $('#petnext').textContent = nx ? `다음 진화: Lv ${nx.lv} ${'?'.repeat(3)}` : '최종 진화 완료!';
  const crack = Math.floor(g.egg / EGG_N * 5);
  $('#eggimg').innerHTML = EGG_SVG(crack);
  $('#eggtext').textContent = `알이 깨지기까지 정답 ${EGG_N - g.egg}개`;
  $('#eggbar').style.width = (g.egg/EGG_N*100)+'%';
  $('#eggcount').textContent = `지금까지 ${g.hatched}개 부화`;
  $('#achcount').textContent = `${Object.keys(g.ach).length}/${ACH.length}`;
}
function openAch(){
  const g = G(), box = $('#achgrid'); box.innerHTML='';
  ACH.forEach(([id,icon,name,desc])=>{
    const on = !!g.ach[id];
    const d = el('div','ach'+(on?' on':''));
    d.appendChild(el('span','aicon', on?icon:'🔒'));
    const t = el('span','atext'); t.appendChild(el('b',null,name)); t.appendChild(el('small',null, on ? `${desc} · ${g.ach[id]}` : desc)); d.appendChild(t);
    box.appendChild(d);
  });
  $('#achsum').textContent = `${Object.keys(g.ach).length} / ${ACH.length} 달성`;
  $('#achsheet').classList.add('open');
}

/* ---------- 틀린 문제 총정리 ---------- */
function openReview(){
  show('reviewscreen');
  const wrongQs = BANK.filter(q=>(save.stats[q.id]||{}).lastWrong);
  const fixed = BANK.filter(q=>{ const s=save.stats[q.id]; return s && s.wrong>0 && !s.lastWrong; }).length;
  $('#rvsum').textContent = wrongQs.length ? `지금 틀려 있는 문제 ${wrongQs.length}개 · 다시 맞혀서 고친 문제 ${fixed}개` : `틀려 있는 문제가 없어요! 고친 문제 ${fixed}개`;
  // 약점 단원
  const wb = $('#rvweak'); wb.innerHTML='';
  const byUnit = UNITS.map(u=>({u, n: wrongQs.filter(q=>q.unit===u.id).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n);
  const max = byUnit.length ? byUnit[0].n : 1;
  byUnit.forEach(({u,n})=>{
    const r = el('div','urow'); r.appendChild(el('span',null,u.name));
    const bar = el('span','ubar'); const f = el('i'); f.style.width=(n/max*100)+'%'; f.style.background='var(--art)'; bar.appendChild(f); r.appendChild(bar);
    r.appendChild(el('b',null,`${n}개`));
    const go = el('button','linkbtn','풀기'); go.style.padding='0 0 0 8px'; go.onclick=()=>startMode('wrongunit:'+u.id); r.appendChild(go);
    wb.appendChild(r);
  });
  // 자주 틀린 TOP 5
  const top = BANK.filter(q=>(save.stats[q.id]||{}).wrong>=2).sort((a,b)=>save.stats[b.id].wrong-save.stats[a.id].wrong).slice(0,5);
  const tb = $('#rvtop'); tb.innerHTML='';
  $('#rvtophead').style.display = top.length ? '' : 'none';
  top.forEach(q=>tb.appendChild(reviewItem(q, `${save.stats[q.id].wrong}번 틀림`)));
  // 단원별 목록
  const lb = $('#rvlist'); lb.innerHTML='';
  byUnit.forEach(({u})=>{
    lb.appendChild(el('h3','sec', u.name));
    wrongQs.filter(q=>q.unit===u.id).sort((a,b)=>a.source.page-b.source.page).forEach(q=>lb.appendChild(reviewItem(q)));
  });
  if (!wrongQs.length) lb.appendChild(el('p','muted','틀린 문제가 생기면 여기에 단원별로 모여요.'));
  $('#rvall').style.display = wrongQs.length ? '' : 'none';
}
function reviewItem(q, tag){
  const d = el('div','review no');
  d.appendChild(el('p','rq', (tag?`[${tag}] `:'') + q.q));
  const ans = q.type==='mc' ? q.options[q.answer] : q.type==='ox' ? (q.answer?'O':'X') : q.answer_text;
  const c = el('p','ra'); c.appendChild(el('b',null,'정답: ')); c.appendChild(document.createTextNode(ans)); d.appendChild(c);
  if (q.explain) d.appendChild(el('p','rexp', q.explain));
  const dn = detailNode(q);
  if (dn){ const t = el('button','linkbtn','자세한 해설'); t.style.padding='6px 12px 0 0'; dn.style.display='none'; t.onclick=()=>{ dn.style.display = dn.style.display==='none'?'block':'none'; }; d.appendChild(t); d.appendChild(dn); }
  if (q.source && q.source.page){ const b = el('button','linkbtn',`강의자료 ${q.source.page}쪽`); b.style.padding='6px 0 0'; b.onclick=()=>openViewer(q); d.appendChild(b); }
  return d;
}

$('#openAch').onclick = openAch;
$('#achclose').onclick = ()=>$('#achsheet').classList.remove('open');
$('#openReview').onclick = openReview;
$('#rvback').onclick = ()=>{ show('home'); renderHome(); };
$('#rvall').onclick = ()=>startMode('wrong');

/* ---------- 문제 아래에 강의자료 쪽을 바로 보여주기 ---------- */
async function inlinePdf(q, box, open){
  box.innerHTML = '';
  const p = q.source && q.source.page; if (!p) return;
  const head = el('button','inlinehead', `📄 강의자료 ${p}쪽 ${open ? '접기' : '펼치기'}`);
  const body = el('div','inlinebody'); body.style.display = open ? 'block' : 'none';
  head.onclick = ()=>{ const o = body.style.display==='none'; body.style.display = o?'block':'none'; head.textContent = `📄 강의자료 ${p}쪽 ${o?'접기':'펼치기'}`; if (o && !body.dataset.done) draw(); };
  box.appendChild(head); box.appendChild(body);
  async function draw(){
    body.dataset.done = '1';
    if (typeof pdfjsLib === 'undefined'){ body.appendChild(el('p','muted small','PDF 뷰어를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')); return; }
    const pdf = await getPdf(q.source.doc).catch(()=>null);
    if (!pdf){
      const m = el('p','muted small', `${DOC_NAME[q.source.doc]} PDF를 한 번만 불러오면 여기 바로 보여요. `);
      const b = el('button','linkbtn','지금 불러오기'); b.style.padding='0'; b.onclick=()=>$('#pdfsetup').classList.add('open');
      m.appendChild(b); body.appendChild(m); return;
    }
    const page = await pdf.getPage(Math.min(p, pdf.numPages));
    const w = Math.max(box.clientWidth, 280);
    const base = page.getViewport({scale:1});
    const dpr = Math.min(window.devicePixelRatio||1, 3);
    const vp = page.getViewport({scale: (w/base.width)*dpr});
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    c.style.width = '100%'; c.style.borderRadius = '8px'; c.style.display = 'block';
    body.appendChild(c);
    await page.render({canvasContext:c.getContext('2d'), viewport:vp}).promise;
    const hl = (q.highlight||[]).map(h=>h.replace(/\s+/g,'')).filter(h=>h.length>=2);
    if (hl.length) await drawHighlights(page, vp, c.getContext('2d'), hl);
    const zoom = el('button','linkbtn','크게 보기'); zoom.style.padding='6px 0 0'; zoom.onclick=()=>openViewer(q); body.appendChild(zoom);
  }
  if (open) draw();
}
// PDF를 새로 불러오면 열려 있는 미리보기도 다시 그리기
document.querySelectorAll('#pdfsetup input[type=file]').forEach(inp=>inp.addEventListener('change', ()=>setTimeout(()=>{ if ($('#feedback').classList.contains('show') && current) inlinePdf(current, $('#inlinepdf'), true); }, 800)));

/* ---------- 시작 ---------- */
fetch('questions.json', {cache:'no-cache'})
  .then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(d=>{ BANK = d.questions; UNITS = d.units || []; renderHome(); })
  .catch(()=>{ $('#bankinfo').textContent = '문제를 불러오지 못했어요. 사이트 주소(https://…github.io/…)로 접속했는지 확인해 주세요.'; renderHome(); });
