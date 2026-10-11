/* =========================================================
   돌아다니는 고양이 + 고양이·성호 놀이터
   - 고양이는 버튼·문제·보기·입력칸이 없는 빈 자리만 골라서 돌아다님
   - 손가락으로 끌어서 옮길 수 있음 (옮긴 자리에서 잠깐 쉬었다가 다시 산책)
   - 놀이터: 쓰다듬기, 간식(퀴즈 정답으로 모음), 공놀이, 레이저, 성호랑 같이 놀기
   ========================================================= */
(function(){
'use strict';
const CAT_IMG = 'cat.jpg';
const SEONGHO_IMG = 'good7.jpg';          // 놀이터에 나오는 성호 사진 (고양이 귀 성호)
const CAT_SIZE = 52;
const MEOW = ['냥', '냐앙', '야옹~', '골골골', '냥냥!', '공부 잘하고 있냥?', '쉬엄쉬엄 하라냥', '틀려도 괜찮다냥'];
const SEONGHO_LINES = ['혜선아 화이팅!', '고양이 귀엽다ㅎㅎ', '같이 놀자!', '공부도 하고 놀기도 하고', '앙 기모딱따구리!', '아 쪼은데!', '혜선아 사랑해!', '우리 고양이 최고'];
const OFF_LIMITS = 'button, input, a, textarea, select, canvas, video, img:not(.wcat-img), .opt, .qtext, .qcard, .feedback, .review, .unit, .gcard, .mode, .stats, .ach, .acell, .urow, .chips, .exgrid, .popcard, .sheet-top, .sheet-bottom, .hud, .xpbar, .inlinepdf, .detail';

const $ = s => document.querySelector(s);
const rnd = (a,b) => a + Math.random()*(b-a);
const store = {
  get(){ try { return JSON.parse(localStorage.getItem('cq-cat')||'{}'); } catch(e){ return {}; } },
  set(v){ try { localStorage.setItem('cq-cat', JSON.stringify(v)); } catch(e){} }
};
let C = Object.assign({hidden:false, love:0, treatsUsed:0, pets:0, plays:0}, store.get());
const saveC = () => store.set(C);

/* ---------------- 돌아다니는 고양이 ---------------- */
const cat = document.createElement('div');
cat.className = 'wcat';
cat.innerHTML = `<img class="wcat-img" src="${CAT_IMG}" alt="고양이" draggable="false"><span class="wcat-bubble"></span>`;
cat.setAttribute('role','img'); cat.setAttribute('aria-label','돌아다니는 고양이. 끌어서 옮길 수 있어요');
document.body.appendChild(cat);

let pos = {x: window.innerWidth - CAT_SIZE - 14, y: window.innerHeight - CAT_SIZE - 90};
let target = null, restUntil = 0, dragging = false, dragOff = {x:0,y:0}, moved = false, last = performance.now();

function place(){ cat.style.transform = `translate(${pos.x}px, ${pos.y}px)`; }
function bounds(){
  const top = (parseFloat(getComputedStyle(document.documentElement).paddingTop)||0) + 6;
  return {minX: 4, maxX: window.innerWidth - CAT_SIZE - 4, minY: top, maxY: window.innerHeight - CAT_SIZE - 8};
}
// 이 자리에 고양이를 놓으면 버튼·문제를 가리는지 검사
function isFree(x, y){
  const pts = [[x+4,y+4],[x+CAT_SIZE-4,y+4],[x+4,y+CAT_SIZE-4],[x+CAT_SIZE-4,y+CAT_SIZE-4],[x+CAT_SIZE/2,y+CAT_SIZE/2]];
  for (const [px,py] of pts){
    const els = document.elementsFromPoint(px, py).filter(e=>!cat.contains(e) && e!==cat);
    if (els.some(e=>e.closest && e.closest(OFF_LIMITS))) return false;
    if (els.some(e=>e.matches && e.matches('p, h1, h2, h3, small, b, span:not(.wcat-bubble)') && e.textContent.trim())) return false;
  }
  return true;
}
function findFreeSpot(){
  const b = bounds();
  // 아래쪽·위쪽 가장자리와 양옆을 먼저 찾아보고, 그다음 화면 전체
  const tries = [];
  for (let i=0;i<14;i++) tries.push([rnd(b.minX,b.maxX), b.maxY - rnd(0,30)]);
  for (let i=0;i<10;i++) tries.push([Math.random()<.5?b.minX:b.maxX, rnd(b.minY,b.maxY)]);
  for (let i=0;i<30;i++) tries.push([rnd(b.minX,b.maxX), rnd(b.minY,b.maxY)]);
  for (const [x,y] of tries) if (isFree(x,y)) return {x,y};
  return null;
}
function bubble(text, ms=1600){
  const bb = cat.querySelector('.wcat-bubble');
  bb.textContent = text; bb.classList.add('show');
  clearTimeout(bubble._t); bubble._t = setTimeout(()=>bb.classList.remove('show'), ms);
}

function tick(now){
  const dt = Math.min(50, now - last); last = now;
  const busy = onPlayground() || document.querySelector('.sheet.open, .pop.open');
  cat.style.visibility = busy ? 'hidden' : '';
  if (!C.hidden && !dragging && !document.hidden && !busy){
    const b = bounds();
    pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x)); pos.y = Math.max(b.minY, Math.min(b.maxY, pos.y));
    if (now > restUntil){
      if (!target){
        target = findFreeSpot();
        if (!target){ cat.classList.add('sleep'); restUntil = now + 2500; }
      }
      if (target){
        // 지나가는 길에 문제나 버튼 위를 지나면 반투명 + 터치 통과 + 빨리 지나감
        const over = !isFree(pos.x, pos.y);
        cat.classList.toggle('ghost', over);
        const dx = target.x - pos.x, dy = target.y - pos.y, d = Math.hypot(dx,dy), sp = (over ? 0.25 : 0.06) * dt;
        cat.classList.toggle('flip', dx > 0); cat.classList.add('walk'); cat.classList.remove('sleep');
        if (d <= sp){ pos.x = target.x; pos.y = target.y; target = null; cat.classList.remove('walk','ghost'); restUntil = now + rnd(2500, 7000);
          if (Math.random()<0.25) bubble(MEOW[Math.floor(Math.random()*MEOW.length)]); }
        else { pos.x += dx/d*sp; pos.y += dy/d*sp; }
        place();
      }
    } else if (!isFree(pos.x, pos.y) && !(C.pinnedUntil > Date.now())){
      // 쉬는 중인데 화면이 바뀌어서 뭔가를 가리게 되면 바로 비켜줌
      restUntil = 0; target = null;
    }
  }
  requestAnimationFrame(tick);
}

/* 손가락으로 끌기 */
cat.addEventListener('pointerdown', e=>{
  dragging = true; moved = false; cat.setPointerCapture(e.pointerId);
  dragOff = {x: e.clientX - pos.x, y: e.clientY - pos.y};
  cat.classList.add('grab'); cat.classList.remove('walk','sleep');
});
cat.addEventListener('pointermove', e=>{
  if (!dragging) return;
  const nx = e.clientX - dragOff.x, ny = e.clientY - dragOff.y;
  if (Math.hypot(nx-pos.x, ny-pos.y) > 3) moved = true;
  const b = bounds();
  pos.x = Math.max(b.minX, Math.min(b.maxX, nx)); pos.y = Math.max(b.minY, Math.min(b.maxY, ny));
  place();
});
function endDrag(){
  if (!dragging) return;
  dragging = false; cat.classList.remove('grab'); target = null;
  if (moved){ restUntil = performance.now() + 20000; C.pinnedUntil = Date.now() + 20000; bubble('여기 있을게냥'); }
  else { bubble(MEOW[Math.floor(Math.random()*MEOW.length)]); hearts(pos.x + CAT_SIZE/2, pos.y, 2); C.love++; saveC(); }
}
cat.addEventListener('pointerup', endDrag);
cat.addEventListener('pointercancel', endDrag);
cat.addEventListener('dblclick', ()=>openPlayground());

function hearts(x, y, n=3, emoji='💗'){
  for (let i=0;i<n;i++){
    const h = document.createElement('span'); h.className='fheart'; h.textContent = emoji;
    h.style.left = (x + rnd(-14,14)) + 'px'; h.style.top = (y + rnd(-6,6)) + 'px';
    h.style.animationDelay = (i*90)+'ms';
    document.body.appendChild(h); setTimeout(()=>h.remove(), 1500);
  }
}
window.addEventListener('resize', ()=>{ target = null; restUntil = 0; });
window.addEventListener('scroll', ()=>{ if (!isFree(pos.x,pos.y) && Date.now() > (C.pinnedUntil||0)){ target=null; restUntil=0; } }, {passive:true});
function applyHidden(){ cat.style.display = C.hidden ? 'none' : ''; const t = $('#catToggle'); if (t) t.textContent = C.hidden ? '고양이 다시 부르기' : '고양이 잠깐 숨기기'; }
place(); applyHidden(); requestAnimationFrame(tick);

/* ---------------- 놀이터 ---------------- */
const field = () => $('#pgfield');
let PG = null;
function onPlayground(){ return $('#playground') && $('#playground').classList.contains('active'); }
function treatsLeft(){
  const correct = Object.values((typeof save!=='undefined' && save.stats) || {}).reduce((a,s)=>a+s.right,0);
  return Math.max(0, Math.floor(correct/10) - C.treatsUsed);
}
function openPlayground(){
  show('playground');
  const f = field();
  f.innerHTML = `
    <div class="pg-actor pg-cat" id="pgcat"><img src="${CAT_IMG}" alt="고양이" draggable="false"><span class="pg-say"></span></div>
    <div class="pg-actor pg-sh" id="pgsh"><img src="${SEONGHO_IMG}" alt="성호" draggable="false"><span class="pg-say"></span></div>`;
  const W = f.clientWidth, H = f.clientHeight;
  PG = {
    cat: {el: $('#pgcat'), x: W*0.25, y: H*0.55, vx:0, vy:0, size:64, goal:null},
    sh:  {el: $('#pgsh'),  x: W*0.65, y: H*0.45, vx:0, vy:0, size:74, goal:null},
    ball: null, laser: null, treat: null, mode: 'free', last: performance.now(), drag: null, hugCool: 0
  };
  [PG.cat, PG.sh].forEach(a=>bindDrag(a));
  updateStats();
  say(PG.sh, '같이 놀자!');
  if (!PG.loop) PG.loop = true;
  requestAnimationFrame(pgTick);
}
function updateStats(){
  $('#pglove').textContent = Math.floor(C.love);
  $('#pgtreat').textContent = treatsLeft();
  const lv = C.love < 20 ? '서먹서먹' : C.love < 60 ? '친해지는 중' : C.love < 150 ? '단짝' : '영혼의 단짝';
  $('#pglevel').textContent = lv;
  $('#pgbar').style.width = Math.min(100, (C.love % 50) * 2) + '%';
}
function say(a, text, ms=1800){
  const s = a.el.querySelector('.pg-say'); s.textContent = text; s.classList.add('show');
  clearTimeout(a._t); a._t = setTimeout(()=>s.classList.remove('show'), ms);
}
function bindDrag(a){
  a.el.addEventListener('pointerdown', e=>{
    a.el.setPointerCapture(e.pointerId);
    PG.drag = {a, ox: e.clientX - a.x, oy: e.clientY - a.y, moved:false, t: performance.now()};
    a.el.classList.add('grab');
  });
  a.el.addEventListener('pointermove', e=>{
    const d = PG.drag; if (!d || d.a!==a) return;
    const nx = e.clientX - d.ox, ny = e.clientY - d.oy;
    if (Math.hypot(nx-a.x, ny-a.y) > 3) d.moved = true;
    a.x = nx; a.y = ny; a.vx = 0; a.vy = 0;
  });
  const up = ()=>{
    const d = PG.drag; if (!d || d.a!==a) return;
    PG.drag = null; a.el.classList.remove('grab');
    if (!d.moved){
      // 탭 = 쓰다듬기 / 말 걸기
      const r = field().getBoundingClientRect();
      if (a===PG.cat){ C.love++; C.pets++; say(a, MEOW[Math.floor(Math.random()*MEOW.length)]); hearts(r.left + a.x, r.top + a.y - 30, 3); a.el.classList.add('purr'); setTimeout(()=>a.el.classList.remove('purr'), 600); }
      else { say(a, SEONGHO_LINES[Math.floor(Math.random()*SEONGHO_LINES.length)]); hearts(r.left + a.x, r.top + a.y - 36, 2, '✨'); C.love++; }
      saveC(); updateStats();
    }
  };
  a.el.addEventListener('pointerup', up); a.el.addEventListener('pointercancel', up);
}
// 빈 곳을 터치하면 레이저 점 → 고양이가 쫓아감
function fieldTap(e){
  if (e.target.closest('.pg-actor') || e.target.closest('.pg-ball')) return;
  const r = field().getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (PG.mode === 'laser'){
    PG.laser = {x, y}; drawLaser();
  } else {
    PG.cat.goal = {x, y}; say(PG.cat, '거기냥?', 900);
  }
}
function drawLaser(){
  let d = $('#pglaser');
  if (!d){ d = document.createElement('div'); d.id='pglaser'; d.className='pg-laser'; field().appendChild(d); }
  d.style.display = PG.laser ? 'block' : 'none';
  if (PG.laser) d.style.transform = `translate(${PG.laser.x-7}px, ${PG.laser.y-7}px)`;
}
function throwBall(){
  const f = field(), W = f.clientWidth;
  let b = $('#pgball'); if (!b){ b = document.createElement('div'); b.id='pgball'; b.className='pg-ball'; b.textContent='🧶'; f.appendChild(b); }
  PG.ball = {x: PG.sh.x, y: PG.sh.y - 20, vx: rnd(-7, 7) || 4, vy: rnd(-11, -7), el: b};
  if (Math.abs(PG.ball.vx) < 2) PG.ball.vx = PG.ball.x > W/2 ? -5 : 5;
  say(PG.sh, '받아라~!'); say(PG.cat, '냥!!', 900);
  C.plays++; saveC();
}
function giveTreat(){
  if (treatsLeft() <= 0){ say(PG.sh, '간식은 퀴즈 10문제 맞힐 때마다 하나씩 생겨!', 2600); return; }
  C.treatsUsed++; saveC();
  const f = field();
  let t = $('#pgtreatitem'); if (!t){ t = document.createElement('div'); t.id='pgtreatitem'; t.className='pg-treat'; t.textContent='🐟'; f.appendChild(t); }
  PG.treat = {x: rnd(40, f.clientWidth-40), y: rnd(80, f.clientHeight-60), el: t};
  t.style.display='block'; t.style.transform = `translate(${PG.treat.x-14}px, ${PG.treat.y-14}px)`;
  say(PG.sh, '간식 줄게!'); updateStats();
}
function pgTick(now){
  if (!onPlayground()){ PG && (PG.loop = false); return; }
  const f = field(), W = f.clientWidth, H = f.clientHeight;
  const dt = Math.min(40, now - PG.last) / 16; PG.last = now;
  const cat = PG.cat, sh = PG.sh;
  // 고양이 목표: 간식 > 레이저 > 공 > 터치한 곳 > 성호 근처 어슬렁
  let goal = cat.goal;
  if (PG.treat) goal = PG.treat;
  else if (PG.laser && PG.mode==='laser') goal = PG.laser;
  else if (PG.ball) goal = PG.ball;
  if (PG.drag && PG.drag.a===cat) goal = null;
  if (goal){
    const dx = goal.x - cat.x, dy = goal.y - cat.y, d = Math.hypot(dx,dy);
    const sp = (PG.laser && PG.mode==='laser') ? 5.5 : PG.ball ? 4.2 : 3;
    if (d > 6){ cat.x += dx/d*sp*dt; cat.y += dy/d*sp*dt; cat.el.classList.toggle('flip', dx>0); cat.el.classList.add('walk'); }
    else {
      cat.el.classList.remove('walk');
      if (goal === PG.treat){ PG.treat.el.style.display='none'; PG.treat = null; C.love += 5; saveC(); updateStats(); say(cat, '냠냠 맛있다냥!'); const r=f.getBoundingClientRect(); hearts(r.left+cat.x, r.top+cat.y-30, 5); say(sh, '맛있지?ㅎㅎ'); }
      else if (goal === cat.goal) cat.goal = null;
      else if (PG.laser && goal === PG.laser){ C.love += 0.2; }
    }
  } else if (!(PG.drag && PG.drag.a===cat)){
    // 할 일 없으면 성호 옆으로 슬금슬금
    const dx = sh.x + 50 - cat.x, dy = sh.y + 20 - cat.y, d = Math.hypot(dx,dy);
    if (d > 70){ cat.x += dx/d*1.2*dt; cat.y += dy/d*1.2*dt; cat.el.classList.toggle('flip', dx>0); cat.el.classList.add('walk'); } else cat.el.classList.remove('walk');
  }
  // 성호: 공이 있으면 공 쫓기, 아니면 고양이 근처로
  if (!(PG.drag && PG.drag.a===sh)){
    const g = PG.ball || {x: cat.x - 70, y: cat.y - 10};
    const dx = g.x - sh.x, dy = g.y - sh.y, d = Math.hypot(dx,dy);
    const sp = PG.ball ? 2.6 : 1.1;
    if (d > (PG.ball ? 10 : 60)){ sh.x += dx/d*sp*dt; sh.y += dy/d*sp*dt; sh.el.classList.toggle('flip', dx>0); sh.el.classList.add('walk'); } else sh.el.classList.remove('walk');
  }
  // 공 물리
  if (PG.ball){
    const b = PG.ball;
    b.vy += 0.35*dt; b.x += b.vx*dt; b.y += b.vy*dt;
    if (b.x < 14){ b.x = 14; b.vx *= -0.8; } if (b.x > W-14){ b.x = W-14; b.vx *= -0.8; }
    if (b.y > H-18){ b.y = H-18; b.vy *= -0.62; b.vx *= 0.92; }
    b.el.style.display='block'; b.el.style.transform = `translate(${b.x-14}px, ${b.y-14}px) rotate(${b.x*4}deg)`;
    const catGot = Math.hypot(b.x-cat.x, b.y-cat.y) < 34, shGot = Math.hypot(b.x-sh.x, b.y-sh.y) < 38 && Math.abs(b.vy) < 3;
    if (catGot || shGot){
      b.el.style.display='none'; PG.ball = null;
      const r = f.getBoundingClientRect();
      if (catGot){ say(cat, '잡았다냥!'); say(sh, '와 고양이 잘한다!'); C.love += 2; hearts(r.left+cat.x, r.top+cat.y-30, 3, '⭐'); }
      else { say(sh, '내가 먼저 잡았지롱'); say(cat, '치사하다냥…'); C.love += 1; }
      saveC(); updateStats();
    }
  }
  // 둘이 가까우면 가끔 하트
  PG.hugCool -= dt;
  if (Math.hypot(cat.x-sh.x, cat.y-sh.y) < 60 && PG.hugCool <= 0){
    PG.hugCool = 240;
    const r = f.getBoundingClientRect(); hearts(r.left+(cat.x+sh.x)/2, r.top+(cat.y+sh.y)/2-40, 4);
    say(sh, Math.random()<.5 ? '고양이야 우리 혜선이 공부 잘 도와줘' : '얘 너무 귀엽다'); C.love += 1; saveC(); updateStats();
  }
  // 화면 안에 가두기 + 그리기
  [cat, sh].forEach(a=>{
    a.x = Math.max(a.size/2, Math.min(W - a.size/2, a.x));
    a.y = Math.max(a.size/2 + 24, Math.min(H - a.size/2, a.y));
    a.el.style.transform = `translate(${a.x - a.size/2}px, ${a.y - a.size/2}px)`;
  });
  requestAnimationFrame(pgTick);
}

/* 버튼 연결 */
function bind(){
  const home = $('#openPlayground'); if (home) home.onclick = openPlayground;
  $('#pgback').onclick = ()=>{ PG && (PG.laser = null); show('home'); if (typeof renderHome==='function') renderHome(); };
  $('#pgfield').addEventListener('pointerdown', fieldTap);
  $('#pgfield').addEventListener('pointermove', e=>{ if (PG && PG.mode==='laser' && e.buttons && !e.target.closest('.pg-actor')){ const r=field().getBoundingClientRect(); PG.laser={x:e.clientX-r.left, y:e.clientY-r.top}; drawLaser(); } });
  $('#pgballbtn').onclick = throwBall;
  $('#pgtreatbtn').onclick = giveTreat;
  $('#pglaserbtn').onclick = ()=>{ PG.mode = PG.mode==='laser' ? 'free' : 'laser'; if (PG.mode!=='laser'){ PG.laser=null; drawLaser(); }
    $('#pglaserbtn').classList.toggle('on', PG.mode==='laser'); $('#pglaserbtn').textContent = PG.mode==='laser' ? '🔴 레이저 끄기' : '🔴 레이저'; say(PG.sh, PG.mode==='laser' ? '화면을 문질러봐!' : '레이저 끝~'); };
  $('#pgcallbtn').onclick = ()=>{ PG.cat.goal = {x: PG.sh.x + 40, y: PG.sh.y + 10}; say(PG.sh, '고양이야 이리 와~'); say(PG.cat, '냐앙?', 900); };
  const t = $('#catToggle'); if (t) t.onclick = ()=>{ C.hidden = !C.hidden; saveC(); applyHidden(); };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
