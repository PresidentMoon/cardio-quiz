/* =========================================================
   돌아다니는 고양이 4마리(번갈아 산책) + 고양이·성호 놀이터
   ========================================================= */
(function(){
'use strict';
const CATS = [
  {id:'blue',  name:'파랑이', img:'cat.jpg',  speed:1.0, like:'laser', say:['냥','파란 눈 반짝','공부 잘하고 있냥?']},
  {id:'fold',  name:'접냥이', img:'cat2.jpg', speed:0.8, like:'nap',   say:['…냥?','졸려냥','이불 속이 최고다냥']},
  {id:'flower',name:'꽃냥이', img:'cat3.jpg', speed:1.15,like:'ball',  say:['꽃 받아라냥!','헤헤 냥','혜선이 주려고 따왔다냥']},
  {id:'bunny', name:'토끼냥', img:'cat4.jpg', speed:0.95,like:'wand',  say:['윙크~','나는 토끼다냥','깡총깡총냥']}
];
const SEONGHO_IMG = 'good7.jpg';
const SEONGHO_LINES = ['혜선아 화이팅!','고양이들 너무 귀엽다ㅎㅎ','같이 놀자!','공부하다 쉬는 것도 중요해','앙 기모딱따구리!','아 쪼은데!','혜선아 사랑해! 진심으로 화이팅!!','우리 고양이들 최고'];
const OFF_LIMITS = 'button, input, a, textarea, select, canvas, video, img:not(.wcat-img), .opt, .qtext, .qcard, .feedback, .review, .unit, .gcard, .mode, .stats, .ach, .acell, .urow, .chips, .exgrid, .popcard, .sheet-top, .sheet-bottom, .hud, .xpbar, .inlinepdf, .detail';

const $ = s => document.querySelector(s);
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const store = { get(){ try { return JSON.parse(localStorage.getItem('cq-cat')||'{}'); } catch(e){ return {}; } }, set(v){ try { localStorage.setItem('cq-cat', JSON.stringify(v)); } catch(e){} } };
let C = Object.assign({hidden:false, love:0, treatsUsed:0, bonus:0, lastDay:'', cats:{}, butterflies:0}, store.get());
C.cats = C.cats || {};
CATS.forEach(c=>{ C.cats[c.id] = Object.assign({love:0}, C.cats[c.id]||{}); });
const saveC = () => store.set(C);

function hearts(x, y, n=3, emoji='💗'){
  for (let i=0;i<n;i++){
    const h = document.createElement('span'); h.className='fheart'; h.textContent = emoji;
    h.style.left = (x + rnd(-16,16)) + 'px'; h.style.top = (y + rnd(-6,6)) + 'px'; h.style.animationDelay = (i*80)+'ms';
    document.body.appendChild(h); setTimeout(()=>h.remove(), 1500);
  }
}

/* ================= 돌아다니는 고양이 ================= */
const SZ = 52;
const wc = document.createElement('div');
wc.className = 'wcat';
wc.innerHTML = `<img class="wcat-img" alt="고양이" draggable="false"><span class="wcat-bubble"></span>`;
document.body.appendChild(wc);
let walker = pick(CATS);
function setWalker(c){ walker = c; wc.querySelector('img').src = c.img; wc.setAttribute('aria-label', `${c.name}. 끌어서 옮길 수 있어요`); }
setWalker(walker);
let pos = {x: innerWidth - SZ - 14, y: innerHeight - SZ - 90}, target = null, restUntil = 0, dragging = false, dragOff = {x:0,y:0}, moved = false, last = performance.now(), swapAt = performance.now() + 90000;
const placeW = () => { wc.style.transform = `translate(${pos.x}px, ${pos.y}px)`; };
function bounds(){ const top = (parseFloat(getComputedStyle(document.documentElement).paddingTop)||0) + 6; return {minX:4, maxX: innerWidth-SZ-4, minY: top, maxY: innerHeight-SZ-8}; }
function isFree(x, y){
  const pts = [[x+4,y+4],[x+SZ-4,y+4],[x+4,y+SZ-4],[x+SZ-4,y+SZ-4],[x+SZ/2,y+SZ/2]];
  for (const [px,py] of pts){
    const els = document.elementsFromPoint(px, py).filter(e=>!wc.contains(e));
    if (els.some(e=>e.closest && e.closest(OFF_LIMITS))) return false;
    if (els.some(e=>e.matches && e.matches('p, h1, h2, h3, small, b, span:not(.wcat-bubble)') && e.textContent.trim())) return false;
  }
  return true;
}
function freeSpot(){
  const b = bounds(), tries = [];
  for (let i=0;i<14;i++) tries.push([rnd(b.minX,b.maxX), b.maxY - rnd(0,30)]);
  for (let i=0;i<10;i++) tries.push([Math.random()<.5?b.minX:b.maxX, rnd(b.minY,b.maxY)]);
  for (let i=0;i<30;i++) tries.push([rnd(b.minX,b.maxX), rnd(b.minY,b.maxY)]);
  for (const [x,y] of tries) if (isFree(x,y)) return {x,y};
  return null;
}
function bubble(text, ms=1600){ const bb = wc.querySelector('.wcat-bubble'); bb.textContent = text; bb.classList.add('show'); clearTimeout(bubble._t); bubble._t = setTimeout(()=>bb.classList.remove('show'), ms); }
const busyScreen = () => document.querySelector('#playground.active, #story.active, .sheet.open, .pop.open');
function wtick(now){
  const dt = Math.min(50, now - last); last = now;
  const busy = busyScreen();
  wc.style.visibility = busy ? 'hidden' : '';
  if (!C.hidden && !dragging && !document.hidden && !busy){
    const b = bounds();
    pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x)); pos.y = Math.max(b.minY, Math.min(b.maxY, pos.y));
    if (now > swapAt && !target){ swapAt = now + 90000; wc.classList.add('poof'); setTimeout(()=>{ setWalker(pick(CATS.filter(c=>c!==walker))); wc.classList.remove('poof'); bubble(`${walker.name} 등장냥!`); }, 300); }
    if (now > restUntil){
      if (!target){ target = freeSpot(); if (!target){ wc.classList.add('sleep'); restUntil = now + 2500; } }
      if (target){
        const over = !isFree(pos.x, pos.y);
        wc.classList.toggle('ghost', over);
        const dx = target.x-pos.x, dy = target.y-pos.y, d = Math.hypot(dx,dy), sp = (over?0.25:0.06*walker.speed)*dt;
        wc.classList.toggle('flip', dx>0); wc.classList.add('walk'); wc.classList.remove('sleep');
        if (d <= sp){ pos.x = target.x; pos.y = target.y; target = null; wc.classList.remove('walk','ghost'); restUntil = now + rnd(2500,7000); if (Math.random()<.25) bubble(pick(walker.say)); }
        else { pos.x += dx/d*sp; pos.y += dy/d*sp; }
        placeW();
      }
    } else if (!isFree(pos.x,pos.y) && !(C.pinnedUntil > Date.now())){ restUntil = 0; target = null; }
  }
  requestAnimationFrame(wtick);
}
wc.addEventListener('pointerdown', e=>{ dragging = true; moved = false; wc.setPointerCapture(e.pointerId); dragOff = {x:e.clientX-pos.x, y:e.clientY-pos.y}; wc.classList.add('grab'); wc.classList.remove('walk','sleep','ghost'); });
wc.addEventListener('pointermove', e=>{ if (!dragging) return; const nx = e.clientX-dragOff.x, ny = e.clientY-dragOff.y; if (Math.hypot(nx-pos.x, ny-pos.y) > 3) moved = true; const b = bounds(); pos.x = Math.max(b.minX, Math.min(b.maxX, nx)); pos.y = Math.max(b.minY, Math.min(b.maxY, ny)); placeW(); });
function wEnd(){ if (!dragging) return; dragging = false; wc.classList.remove('grab'); target = null;
  if (moved){ restUntil = performance.now() + 20000; C.pinnedUntil = Date.now() + 20000; bubble('여기 있을게냥'); }
  else { bubble(pick(walker.say)); hearts(pos.x + SZ/2, pos.y, 2); C.love++; C.cats[walker.id].love++; saveC(); } }
wc.addEventListener('pointerup', wEnd); wc.addEventListener('pointercancel', wEnd);
wc.addEventListener('dblclick', ()=>openPlayground());
addEventListener('resize', ()=>{ target = null; restUntil = 0; });
addEventListener('scroll', ()=>{ if (!isFree(pos.x,pos.y) && !(C.pinnedUntil > Date.now())){ target = null; restUntil = 0; } }, {passive:true});
function applyHidden(){ wc.style.display = C.hidden ? 'none' : ''; const t = $('#catToggle'); if (t) t.textContent = C.hidden ? '고양이 다시 부르기' : '고양이 잠깐 숨기기'; }
placeW(); applyHidden(); requestAnimationFrame(wtick);

/* ================= 놀이터 ================= */
let PG = null;
const field = () => $('#pgfield');
const onPG = () => $('#playground') && $('#playground').classList.contains('active');
function correctTotal(){ return Object.values((typeof save!=='undefined' && save.stats) || {}).reduce((a,s)=>a+s.right,0); }
function treatsLeft(){ return Math.max(0, Math.floor(correctTotal()/10) + C.bonus - C.treatsUsed); }
function heartLv(l){ return l<10?1: l<30?2: l<70?3: l<140?4: 5; }
function mk(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html!=null) e.innerHTML = html; return e; }
function actorEl(img, name, cls){
  const a = mk('div', 'pg-actor '+cls);
  a.innerHTML = `<span class="pg-shadow"></span><div class="pg-body"><img src="${img}" alt="${name}" draggable="false"></div><span class="pg-name">${name}</span><span class="pg-say"></span><span class="pg-zz">💤</span>`;
  return a;
}
function openPlayground(){
  show('playground');
  const f = field(); f.innerHTML = '';
  const h = new Date().getHours(), night = h>=19 || h<6, dusk = (h>=17 && h<19);
  f.className = 'pgfield ' + (night ? 'night' : dusk ? 'dusk' : 'day');
  f.appendChild(mk('div','pg-sun'));
  for (let i=0;i<3;i++){ const c = mk('div','pg-cloud'); c.style.top = (6+i*9)+'%'; c.style.animationDuration = (38+i*14)+'s'; c.style.animationDelay = (-i*13)+'s'; f.appendChild(c); }
  if (night) for (let i=0;i<26;i++){ const s = mk('span','pg-star'); s.style.left = rnd(2,98)+'%'; s.style.top = rnd(2,38)+'%'; s.style.animationDelay = rnd(0,3)+'s'; f.appendChild(s); }
  f.appendChild(mk('div','pg-hill a')); f.appendChild(mk('div','pg-hill b')); f.appendChild(mk('div','pg-ground'));
  for (let i=0;i<12;i++){ const fl = mk('span','pg-flower', pick(['🌼','🌸','🌷','🍀','🌱'])); fl.style.left = rnd(3,95)+'%'; fl.style.top = rnd(62,96)+'%'; f.appendChild(fl); }
  const W = f.clientWidth, H = f.clientHeight;
  const tower = mk('div','pg-tower','<div class="t-top"></div><div class="t-pole"></div><div class="t-mid"></div><div class="t-pole b"></div><div class="t-base"></div>');
  const cushion = mk('div','pg-cushion'); const bowl = mk('div','pg-bowl','<span class="food"></span>');
  f.appendChild(tower); f.appendChild(cushion); f.appendChild(bowl);
  const groundTop = H*0.5;
  PG = {
    W, H, groundTop,
    tower: {x: W-56, y: H*0.36}, cushion: {x: 64, y: H-44}, bowl: {x: W*0.5, y: H-34},
    cats: CATS.map((c,i)=>({...c, el: actorEl(c.img, c.name, 'pg-cat'), x: W*(0.18+i*0.18), y: groundTop + 40 + (i%2)*50, size: 58, goal:null, idleAt: 0, nap:false, hop:0, face:1})),
    sh: {el: actorEl(SEONGHO_IMG, '성호', 'pg-sh'), x: W*0.5, y: groundTop + 20, size: 70, hop:0, face:1},
    ball:null, laser:null, wand:null, treat:false, butterfly:null, mode:'free', last: performance.now(), drag:null, hugCool:0, napUntil:0, nextFly: performance.now()+8000
  };
  tower.style.transform = `translate(${PG.tower.x-34}px, ${PG.tower.y-24}px)`;
  cushion.style.transform = `translate(${PG.cushion.x-46}px, ${PG.cushion.y-18}px)`;
  bowl.style.transform = `translate(${PG.bowl.x-26}px, ${PG.bowl.y-12}px)`;
  [...PG.cats, PG.sh].forEach(a=>{ f.appendChild(a.el); bindActor(a); });
  document.querySelectorAll('.pgtool[data-mode]').forEach(b=>b.classList.remove('on'));
  const today = new Date().toDateString();
  if (C.lastDay !== today){ C.lastDay = today; C.bonus++; saveC(); setTimeout(()=>say(PG.sh, '오늘 첫 방문 선물! 간식 하나 줄게', 2600), 600); }
  else setTimeout(()=>say(PG.sh, pick(SEONGHO_LINES)), 500);
  renderCards(); updateStats();
  requestAnimationFrame(pgTick);
}
function renderCards(){
  const box = $('#pgcards'); box.innerHTML = '';
  CATS.forEach(c=>{
    const lv = heartLv(C.cats[c.id].love);
    const b = mk('button','pgcard', `<img src="${c.img}" alt=""><span><b>${c.name}</b><small>${'♥'.repeat(lv)}${'♡'.repeat(5-lv)}</small></span>`);
    b.onclick = ()=>{ const cat = PG.cats.find(x=>x.id===c.id); cat.nap = false; cat.goal = {x: PG.sh.x + rnd(-50,50), y: PG.sh.y + 30}; say(cat, '불렀냥?', 1000); say(PG.sh, `${c.name}야 이리 와~`); };
    box.appendChild(b);
  });
}
function updateStats(){
  $('#pglove').textContent = Math.floor(C.love);
  $('#pgtreat').textContent = treatsLeft();
  const L = C.love; $('#pglevel').textContent = L<30?'서먹서먹': L<100?'친해지는 중': L<250?'단짝': '영혼의 단짝';
}
function say(a, text, ms=1800){ const s = a.el.querySelector('.pg-say'); s.textContent = text; s.classList.add('show'); clearTimeout(a._t); a._t = setTimeout(()=>s.classList.remove('show'), ms); }
const fieldRect = () => field().getBoundingClientRect();
function addLove(cat, n){ C.love += n; if (cat && cat.id) C.cats[cat.id].love += n; saveC(); checkCoupons(); }
function bindActor(a){
  a.el.addEventListener('pointerdown', e=>{ e.stopPropagation(); a.el.setPointerCapture(e.pointerId); PG.drag = {a, ox:e.clientX - a.x, oy:e.clientY - a.y, moved:false}; a.el.classList.add('grab'); a.nap = false; });
  a.el.addEventListener('pointermove', e=>{ const d = PG.drag; if (!d || d.a!==a) return; const nx = e.clientX-d.ox, ny = e.clientY-d.oy; if (Math.hypot(nx-a.x, ny-a.y) > 4) d.moved = true; a.x = nx; a.y = ny; });
  const up = ()=>{
    const d = PG.drag; if (!d || d.a!==a) return; PG.drag = null; a.el.classList.remove('grab');
    const r = fieldRect();
    if (!d.moved){
      if (a===PG.sh){ say(a, pick(SEONGHO_LINES)); hearts(r.left+a.x, r.top+a.y-40, 2, '✨'); addLove(null, 1); a.hop = 10; }
      else { addLove(a, 1); say(a, pick(a.say)); hearts(r.left+a.x, r.top+a.y-34, 3); a.el.classList.add('purr'); setTimeout(()=>a.el.classList.remove('purr'), 700); a.hop = 10; }
    } else if (a!==PG.sh && Math.hypot(a.x-PG.sh.x, a.y-PG.sh.y) < 60){
      say(PG.sh, `${a.name} 꼭 안아주기!`); say(a, '골골골…'); hearts(r.left+PG.sh.x, r.top+PG.sh.y-50, 6); addLove(a, 3);
      a.x = PG.sh.x + 34; a.y = PG.sh.y + 18;
    }
    updateStats(); renderCards();
  };
  a.el.addEventListener('pointerup', up); a.el.addEventListener('pointercancel', up);
}
function fieldDown(e){
  if (!PG || e.target.closest('.pg-actor')) return;
  const r = fieldRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (PG.butterfly && Math.hypot(x-PG.butterfly.x, y-PG.butterfly.y) < 34){ catchButterfly(true); return; }
  if (PG.mode==='laser') PG.laser = {x,y};
  else if (PG.mode==='wand') PG.wand = {x,y};
  else { const c = nearestCat(x,y); c.nap = false; c.goal = {x, y: Math.max(y, PG.groundTop+20)}; say(c, '거기냥?', 900); }
  PG.pressing = true;
}
function fieldMove(e){
  if (!PG || !PG.pressing || PG.drag) return;
  const r = fieldRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (PG.mode==='laser') PG.laser = {x,y};
  if (PG.mode==='wand') PG.wand = {x,y};
}
function fieldUp(){ if (!PG) return; PG.pressing = false; if (PG.mode==='wand') PG.wand = null; }
function nearestCat(x,y){ return PG.cats.slice().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]; }
function throwBall(){
  if (PG.ball) PG.ball.el.remove();
  const b = mk('div','pg-ball','🧶'); field().appendChild(b);
  PG.ball = {x: PG.sh.x, y: PG.sh.y - 30, vx: (Math.random()<.5?-1:1)*rnd(4,8), vy: rnd(-12,-8), el: b};
  PG.sh.hop = 10; say(PG.sh, '받아라~!'); PG.cats.forEach(c=>{ c.nap = false; });
}
function giveTreat(){
  if (treatsLeft() <= 0){ say(PG.sh, '간식은 퀴즈 10문제 맞힐 때마다 하나씩 생겨! 내일 오면 하나 더 줄게', 3000); return; }
  C.treatsUsed++; saveC(); PG.treat = true; field().querySelector('.pg-bowl').classList.add('full');
  say(PG.sh, '맛있는 간식 왔다~'); PG.cats.forEach(c=>{ c.nap = false; say(c, '!!', 700); }); updateStats();
}
function napTime(){
  PG.mode = 'free'; PG.laser = null; PG.wand = null; document.querySelectorAll('.pgtool[data-mode]').forEach(b=>b.classList.remove('on'));
  PG.napUntil = performance.now() + 9000;
  PG.cats.forEach((c,i)=>{ c.nap = true; c.goal = {x: PG.cushion.x - 24 + (i%2)*48, y: PG.cushion.y - 22 + Math.floor(i/2)*30}; });
  say(PG.sh, '다들 낮잠 자자~ 쉿');
}
function setMode(m){
  PG.mode = PG.mode===m ? 'free' : m; PG.laser = null; PG.wand = null;
  document.querySelectorAll('.pgtool[data-mode]').forEach(b=>b.classList.toggle('on', b.dataset.mode===PG.mode));
  say(PG.sh, PG.mode==='laser' ? '화면을 문질러봐! 레이저 간다' : PG.mode==='wand' ? '깃털 낚싯대! 꾹 누르고 움직여봐' : '자유 시간~');
}
function spawnButterfly(){
  const b = mk('div','pg-fly','🦋'); field().appendChild(b);
  PG.butterfly = {x: -20, y: rnd(PG.groundTop-60, PG.groundTop+60), t:0, el:b, dir:1};
  PG.cats.slice().sort(()=>Math.random()-.5).slice(0,2).forEach(c=>{ c.nap=false; c.chaseFly = true; say(c, '나비다냥!!', 1000); });
}
function catchButterfly(byTap, cat){
  const b = PG.butterfly; if (!b) return; const r = fieldRect();
  hearts(r.left+b.x, r.top+b.y, 5, byTap ? '🌟' : '🦋');
  if (byTap){ C.butterflies++; C.bonus++; say(PG.sh, '나비 잡았다! 간식 하나 보너스!', 2200); }
  else { say(cat, '잡았다냥! (놓아줬다냥)', 1600); addLove(cat, 2); }
  b.el.remove(); PG.butterfly = null; PG.cats.forEach(c=>c.chaseFly=false); saveC(); updateStats();
}
function moveTo(a, gx, gy, sp, dt){
  const dx = gx - a.x, dy = gy - a.y, d = Math.hypot(dx,dy);
  if (d > 4){ a.x += dx/d*Math.min(sp*dt, d); a.y += dy/d*Math.min(sp*dt, d); if (Math.abs(dx) > 2) a.face = dx>0 ? -1 : 1; a.el.classList.add('walk'); return false; }
  a.el.classList.remove('walk'); return true;
}
function pgTick(now){
  if (!onPG() || !PG) return;
  const f = field(), W = PG.W = f.clientWidth, H = PG.H = f.clientHeight;
  const dt = Math.min(40, now - PG.last) / 16; PG.last = now;
  const sh = PG.sh;
  if (now > PG.nextFly && !PG.butterfly){ spawnButterfly(); PG.nextFly = now + rnd(20000, 40000); }
  if (PG.butterfly){ const b = PG.butterfly; b.t += dt; b.x += 1.6*dt*b.dir; b.y += Math.sin(b.t/9)*1.8; b.el.style.transform = `translate(${b.x-14}px, ${b.y-14}px)`;
    if (b.x > W + 30){ b.el.remove(); PG.butterfly = null; PG.cats.forEach(c=>c.chaseFly=false); } }
  if (PG.ball){
    const b = PG.ball; b.vy += 0.42*dt; b.x += b.vx*dt; b.y += b.vy*dt;
    if (b.x < 14){ b.x = 14; b.vx *= -0.8; } if (b.x > W-14){ b.x = W-14; b.vx *= -0.8; }
    if (b.y > H-20){ b.y = H-20; b.vy *= -0.6; b.vx *= 0.93; if (Math.abs(b.vy) < 1) b.vy = 0; }
    b.el.style.transform = `translate(${b.x-15}px, ${b.y-15}px) rotate(${b.x*5}deg)`;
  }
  PG.cats.forEach((c,i)=>{
    if (PG.drag && PG.drag.a===c){ c.el.classList.remove('walk'); return; }
    if (c.hop > 0) c.hop -= dt;
    const sp = 2.6 * c.speed;
    const napping = c.nap && now < PG.napUntil;
    if (c.nap && now >= PG.napUntil){ c.nap = false; c.goal = null; say(c, '잘 잤다냥~', 1000); }
    if (PG.treat){ if (moveTo(c, PG.bowl.x + (i-1.5)*22, PG.bowl.y - 18, sp*1.4, dt)){ PG.treat = false; f.querySelector('.pg-bowl').classList.remove('full'); addLove(c,5); say(c, '냠냠 내가 1등이다냥!'); const r=fieldRect(); hearts(r.left+c.x, r.top+c.y-30, 5); say(sh, `${c.name}가 먼저 먹었네ㅎㅎ`); updateStats(); renderCards(); } }
    else if (PG.laser && PG.mode==='laser'){ moveTo(c, PG.laser.x + (i-1.5)*16, PG.laser.y + (i%2)*10, sp*(c.like==='laser'?2.4:1.9), dt); if (Math.hypot(c.x-PG.laser.x, c.y-PG.laser.y) < 26){ if (c.hop<=0) c.hop = 10; addLove(c, 0.05); } }
    else if (PG.wand && PG.mode==='wand'){ const ok = moveTo(c, PG.wand.x + (i-1.5)*22, PG.wand.y + 30, sp*(c.like==='wand'?1.9:1.4), dt); if (ok && c.hop <= 0){ c.hop = 14; addLove(c, 0.3); if (Math.random()<.1) say(c, '냥냥펀치!', 800); } }
    else if (PG.ball){ if (moveTo(c, PG.ball.x, PG.ball.y + 6, sp*(c.like==='ball'?1.9:1.4), dt) || Math.hypot(c.x-PG.ball.x, c.y-PG.ball.y) < 30){
        PG.ball.el.remove(); PG.ball = null; say(c, '잡았다냥!'); say(sh, `와 ${c.name} 잘한다!`); addLove(c, 2); const r=fieldRect(); hearts(r.left+c.x, r.top+c.y-30, 3, '⭐'); c.hop = 12; updateStats(); renderCards(); } }
    else if (c.chaseFly && PG.butterfly){ if (moveTo(c, PG.butterfly.x, PG.butterfly.y + 20, sp*1.5, dt) && Math.random()<0.02) catchButterfly(false, c); else if (c.hop<=0) c.hop = 6; }
    else if (napping){ if (c.goal) moveTo(c, c.goal.x, c.goal.y, sp, dt); }
    else if (c.goal){ if (moveTo(c, c.goal.x, c.goal.y, sp, dt)){ c.goal = null; c.idleAt = now + rnd(2000, 5000); } }
    else if (now > c.idleAt){
      const r = Math.random();
      if (r < 0.18 && c.like==='nap') c.goal = {x: PG.cushion.x + rnd(-20,20), y: PG.cushion.y - 10};
      else if (r < 0.32) c.goal = {x: PG.tower.x, y: PG.tower.y + 8};
      else if (r < 0.55) c.goal = {x: sh.x + rnd(-60,60), y: sh.y + rnd(10,40)};
      else c.goal = {x: rnd(30, W-30), y: rnd(PG.groundTop+20, H-30)};
      if (Math.random() < 0.3) say(c, pick(c.say), 1300);
    }
    c.el.classList.toggle('sleeping', !!napping && !c.el.classList.contains('walk'));
  });
  for (let i=0;i<PG.cats.length;i++) for (let j=i+1;j<PG.cats.length;j++){
    const a = PG.cats[i], b = PG.cats[j], dx = b.x-a.x, dy = b.y-a.y, d = Math.hypot(dx,dy) || 1;
    if (d < 44 && !(a.nap && b.nap) && !(PG.drag && (PG.drag.a===a||PG.drag.a===b))){ const p = (44-d)/2; a.x -= dx/d*p*0.5; a.y -= dy/d*p*0.5; b.x += dx/d*p*0.5; b.y += dy/d*p*0.5; }
  }
  if (!(PG.drag && PG.drag.a===sh)){
    if (sh.hop > 0) sh.hop -= dt;
    const cx = PG.cats.reduce((a,c)=>a+c.x,0)/PG.cats.length, cy = PG.cats.reduce((a,c)=>a+c.y,0)/PG.cats.length;
    const g = PG.ball ? {x: PG.ball.x, y: PG.ball.y} : {x: cx - 60, y: Math.max(PG.groundTop+10, cy - 20)};
    if (Math.hypot(g.x-sh.x, g.y-sh.y) > (PG.ball ? 12 : 70)) moveTo(sh, g.x, g.y, PG.ball ? 2.4 : 1.1, dt); else sh.el.classList.remove('walk');
    if (PG.ball && Math.hypot(PG.ball.x-sh.x, PG.ball.y-sh.y) < 36 && Math.abs(PG.ball.vy) < 3){ PG.ball.el.remove(); PG.ball = null; say(sh, '내가 먼저 잡았지롱'); say(pick(PG.cats), '치사하다냥…'); sh.hop = 10; }
  }
  PG.hugCool -= dt;
  const close = PG.cats.find(c=>Math.hypot(c.x-sh.x, c.y-sh.y) < 58);
  if (close && PG.hugCool <= 0){ PG.hugCool = 260; const r = fieldRect(); hearts(r.left+(close.x+sh.x)/2, r.top+(close.y+sh.y)/2-40, 3); say(sh, pick([`${close.name} 귀여워`, '고양이들아 혜선이 공부 잘 도와줘', '다 같이 화이팅!'])); addLove(close, 1); renderCards(); updateStats(); }
  let lz = f.querySelector('.pg-laser'); if (!lz){ lz = mk('div','pg-laser'); f.appendChild(lz); }
  lz.style.display = PG.laser && PG.mode==='laser' ? 'block' : 'none'; if (PG.laser) lz.style.transform = `translate(${PG.laser.x-7}px, ${PG.laser.y-7}px)`;
  let wd = f.querySelector('.pg-wand'); if (!wd){ wd = mk('div','pg-wand','🪶'); f.appendChild(wd); }
  wd.style.display = PG.wand && PG.mode==='wand' ? 'block' : 'none';
  if (PG.wand){ const t = Math.sin(now/120)*6; wd.style.transform = `translate(${PG.wand.x-14}px, ${PG.wand.y-14+t}px) rotate(${t*3}deg)`; }
  [...PG.cats, sh].forEach(a=>{
    a.x = Math.max(a.size/2, Math.min(W-a.size/2, a.x));
    a.y = Math.max(PG.groundTop - 90, Math.min(H - a.size/2 + 6, a.y));
    const hop = a.hop > 0 ? -Math.sin((a.hop/14)*Math.PI)*14 : 0;
    a.el.style.transform = `translate(${a.x - a.size/2}px, ${a.y - a.size/2}px)`;
    a.el.querySelector('.pg-body').style.transform = `translateY(${hop}px) scaleX(${a.face||1})`;
    a.el.style.zIndex = String(10 + Math.round(a.y));
  });
  requestAnimationFrame(pgTick);
}
/* ---------- 친밀도 보상 쿠폰 ---------- */
const COUPONS = [
  {id:'kiss',   name:'뽀뽀쿠폰', emoji:'💋', need:30,  desc:'성호에게 뽀뽀 한 번 청구 가능'},
  {id:'nakji',  name:'낙지쿠폰', emoji:'🐙', need:80,  desc:'성호가 낙지 요리 쏘기'},
  {id:'sushi',  name:'스시쿠폰', emoji:'🍣', need:150, desc:'성호가 스시 쏘기'},
  {id:'yukhoe', name:'육회쿠폰', emoji:'🥩', need:250, desc:'성호가 육회 쏘기'}
];
C.coupons = C.coupons || [];   // [{id, got, used}]
function checkCoupons(){
  COUPONS.forEach(cp=>{
    if (C.love >= cp.need && !C.coupons.some(x=>x.id===cp.id && x.first)){
      C.coupons.push({id:cp.id, got:new Date().toLocaleDateString('ko-KR'), used:null, first:true});
      saveC(); setTimeout(()=>showCoupon(cp, true), 400);
    }
  });
  // 육회쿠폰 이후에는 친밀도 100마다 뽀뽀쿠폰 하나씩 더
  const extra = C.love >= 250 ? Math.floor((C.love - 250) / 100) : 0;
  const have = C.coupons.filter(x=>x.id==='kiss' && !x.first).length;
  if (extra > have){ C.coupons.push({id:'kiss', got:new Date().toLocaleDateString('ko-KR'), used:null}); saveC(); setTimeout(()=>showCoupon(COUPONS[0], true), 400); }
  const b = $('#pgcouponcount'); if (b) b.textContent = C.coupons.filter(x=>!x.used).length;
}
function couponModal(){
  let m = $('#couponmodal');
  if (!m){ m = mk('div','cpmodal'); m.id='couponmodal'; m.innerHTML='<div class="cpbox"><div id="cpbody"></div><button class="btn" id="cpclose">닫기</button></div>'; document.body.appendChild(m);
    m.querySelector('#cpclose').onclick = ()=>m.classList.remove('open'); m.onclick = e=>{ if (e.target===m) m.classList.remove('open'); }; }
  return m;
}
function ticketHTML(cp, c){
  return `<div class="ticket ${c && c.used ? 'used' : ''}"><span class="tk-emoji">${cp.emoji}</span><b>${cp.name}</b><small>${cp.desc}</small>
    <span class="tk-from">발행: 성호 · 받는 사람: 혜선</span>${c ? `<span class="tk-date">${c.used ? '사용 완료 ' + c.used : '발급 ' + c.got}</span>` : ''}${c && c.used ? '<span class="tk-stamp">사용완료</span>' : ''}</div>`;
}
function showCoupon(cp, fresh){
  const m = couponModal();
  const c = C.coupons.filter(x=>x.id===cp.id).slice(-1)[0];
  $('#cpbody').innerHTML = (fresh ? `<p class="cptitle">🎉 친밀도 ${cp.need} 달성 보상!</p>` : '') + ticketHTML(cp, c) +
    (fresh ? '<p class="muted small" style="text-align:center">쿠폰함에 저장됐어요. 쓰고 싶을 때 성호한테 보여주세요!</p>' : '');
  m.classList.add('open');
  if (PG) { hearts(innerWidth/2, innerHeight/2, 8, cp.emoji); say(PG.sh, `${cp.name} 발급 완료! 진짜 줄게`, 2600); }
}
function openWallet(){
  const m = couponModal();
  const next = COUPONS.find(cp=>C.love < cp.need);
  let html = `<p class="cptitle">🎟️ 쿠폰함</p><p class="muted small" style="text-align:center">친밀도 ${Math.floor(C.love)}${next ? ` · 다음 쿠폰 ${next.name}까지 ${Math.ceil(next.need - C.love)}` : ' · 이제 친밀도 100마다 뽀뽀쿠폰!'}</p>`;
  if (!C.coupons.length) html += '<p style="text-align:center">아직 쿠폰이 없어요. 고양이들이랑 놀아서 친밀도를 올려보세요!</p>';
  html += '<div class="cplist">' + C.coupons.map((c,i)=>{ const cp = COUPONS.find(x=>x.id===c.id);
    return ticketHTML(cp, c) + (c.used ? '' : `<button class="btn cpuse" data-i="${i}">이 쿠폰 사용하기</button>`); }).join('') + '</div>';
  html += '<div class="cplocked">' + COUPONS.filter(cp=>C.love < cp.need).map(cp=>`<span>🔒 ${cp.emoji} ${cp.name} (친밀도 ${cp.need})</span>`).join('') + '</div>';
  $('#cpbody').innerHTML = html;
  $('#cpbody').querySelectorAll('.cpuse').forEach(b=>b.onclick = ()=>{
    const c = C.coupons[+b.dataset.i]; const cp = COUPONS.find(x=>x.id===c.id);
    if (!confirm(`${cp.name}을 지금 사용할까요? 성호한테 이 화면을 보여주세요!`)) return;
    c.used = new Date().toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'}); saveC(); checkCoupons(); openWallet();
  });
  m.classList.add('open');
}
function bind(){
  const home = $('#openPlayground'); if (home) home.onclick = openPlayground;
  $('#pgback').onclick = ()=>{ show('home'); if (typeof renderHome==='function') renderHome(); };
  const f = $('#pgfield');
  f.addEventListener('pointerdown', fieldDown); f.addEventListener('pointermove', fieldMove);
  f.addEventListener('pointerup', fieldUp); f.addEventListener('pointerleave', fieldUp); f.addEventListener('pointercancel', fieldUp);
  $('#pgballbtn').onclick = throwBall;
  $('#pgtreatbtn').onclick = giveTreat;
  $('#pgnapbtn').onclick = napTime;
  const w = $('#pgwallet'); if (w) w.onclick = openWallet;
  checkCoupons();
  document.querySelectorAll('.pgtool[data-mode]').forEach(b=>b.onclick = ()=>setMode(b.dataset.mode));
  const t = $('#catToggle'); if (t) t.onclick = ()=>{ C.hidden = !C.hidden; saveC(); applyHidden(); };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
window.CAT_LIST = CATS;
})();
