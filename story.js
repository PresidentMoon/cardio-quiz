/* =========================================================
   스토리모드: 혜선이의 형성평가 대모험 (쯔꾸르 스타일)
   ========================================================= */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const T = 16;                     // 타일 크기(px, 원본 해상도)
const VW = 15, VH = 13;           // 화면에 보이는 타일 수
const rnd = (a,b)=>a+Math.random()*(b-a);
const store = { get(){ try{ return JSON.parse(localStorage.getItem('cq-story')||'null'); }catch(e){ return null; } }, set(v){ try{ localStorage.setItem('cq-story', JSON.stringify(v)); }catch(e){} } };

/* ---------------- 인물 ---------------- */
const P = {
  hs:   {name:'혜선', face:null},
  sh:   {name:'성호', face:'good3.jpg'},
  sh2:  {name:'성호', face:'good7.jpg'},
  dark: {name:'흑화 성호', face:'good22.jpg'},
  blue: {name:'파랑이', face:'cat.jpg'},
  fold: {name:'접냥이', face:'cat2.jpg'},
  flower:{name:'꽃냥이', face:'cat3.jpg'},
  bunny:{name:'토끼냥', face:'cat4.jpg'},
  prof: {name:'신정은 교수님', face:null},
  sys:  {name:'', face:null}
};

/* ---------------- 지도 ----------------
 . 풀  , 풀2  f 꽃  T 나무  ~ 물  = 길  b 다리  # 돌담  W 벽  R 지붕  D 문(이동)
 F 마루  B 침대  K 책상  S 표지판  C 상자  G 관문(닫힘)  t 탑 바닥  X 탑 벽  ^ 계단(이동)  L 램프  P 화분  */
const MAPS = {
  room: { name:'혜선이 방', w:10, h:8, bg:'#3B2A1E', rows:[
    'WWWWWWWWWW',
    'WBBFFPFKKW',
    'WFFFFFFFFW',
    'WFFFFFFFFW',
    'WFFFFFFFFW',
    'WPFFFFFFLW',
    'WFFFFFFFFW',
    'WWWWDWWWWW'],
    warps:[{x:4,y:7,to:'village',tx:3,ty:15,dir:'down'}],
    npcs:[{id:'sh_room',x:6,y:3,spr:'seongho',dir:'down'}],
    signs:[{x:7,y:1,text:'책상 위에 기초간호과학I 강의자료가 펼쳐져 있다.\n"3주차 심장, 5-6주차 혈관…"'}],
    chests:[]
  },
  tower: { name:'형성평가의 탑', w:15, h:14, bg:'#1C1830', rows:[
    'XXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXX',
    'XtttttttttttttX',
    'XtLtttttttttLtX',
    'XtttttttttttttX',
    'XtttttttttttttX',
    'XtttttttttttttX',
    'XtLtttttttttLtX',
    'XtttttttttttttX',
    'XtttttttttttttX',
    'XtttttttttttttX',
    'XtttttttttttttX',
    'XtttttttttttttX',
    'XXXXXXX^XXXXXXX'],
    warps:[{x:7,y:13,to:'forest',tx:24,ty:9,dir:'left'}],
    npcs:[{id:'prof',x:7,y:3,spr:'prof',dir:'down'}],
    signs:[], chests:[]
  }
};

/* ---------------- 마을 7곳 자동 생성 ---------------- */
const TOWNS = [
  {id:'t0', name:'💗 심장 마을',     guard:'blue',   units:['h1','h2'], topic:'심장의 위치·구조·판막, 혈류·관상순환', deco:'heart',
   th:{grass:'#72BF5E',grass2:'#5AA54A',path:'#E8C3A0',path2:'#D9A882',tree:'#2E7D32',tree2:'#43A047',water:'#F06292',water2:'#F8BBD0',roof:['#E57373','#EF9A9A']}},
  {id:'t1', name:'⚡ 근육 마을',     guard:'fold',   units:['h3','h4'], topic:'심장근육·전기생리, 심전도·부정맥', deco:'bolt',
   th:{grass:'#9CCC65',grass2:'#7CB342',path:'#BCAAA4',path2:'#A1887F',tree:'#558B2F',tree2:'#7CB342',water:'#4FC3F7',water2:'#B3E5FC',roof:['#FFB300','#FFCA28']}},
  {id:'t2', name:'🥁 펌프 마을',     guard:'flower', units:['h5','h6'], topic:'심음·심장주기, 심장박출량과 조절', deco:'drum',
   th:{grass:'#AED581',grass2:'#8BC34A',path:'#D7CCC8',path2:'#BCAAA4',tree:'#33691E',tree2:'#689F38',water:'#64B5F6',water2:'#BBDEFB',roof:['#8E24AA','#BA68C8']}},
  {id:'t3', name:'🩸 혈관 마을',     guard:'bunny',  units:['v1','v2'], topic:'혈관벽·혈관 종류, 순환경로·혈압·저항', deco:'drop',
   th:{grass:'#81C784',grass2:'#66BB6A',path:'#E0B8B8',path2:'#C99A9A',tree:'#2E7D32',tree2:'#4CAF50',water:'#C62828',water2:'#EF5350',roof:['#C62828','#1565C0']}},
  {id:'t4', name:'🫧 모세혈관 늪',   guard:'dark',   units:['v3','v4'], topic:'혈압 조절(신경·RAAS), 모세혈관과 체액 이동', deco:'bubble',
   th:{grass:'#6A9C78',grass2:'#557F62',path:'#B7A9C9',path2:'#9C8DB5',tree:'#2F4F3A',tree2:'#46705A',water:'#7E57C2',water2:'#B39DDB',roof:['#5E35B1','#7E57C2']}},
  {id:'t5', name:'🌲 동맥정맥 숲',   guard:'union',  units:['v5','v6'], topic:'온몸동맥·맥박지점, 온몸정맥', deco:'leaf',
   th:{grass:'#4F9A47',grass2:'#3D7F37',path:'#C8A86B',path2:'#B08F55',tree:'#1E5B2A',tree2:'#2C7A3A',water:'#3E8ED0',water2:'#6FB3E8',roof:['#6D4C41','#8D6E63']}}
];
const TOWN_ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTT',
  'T..d....RRRR....d....T',
  'T.......WWWW.......d.T',
  'T..RRR..WDWW.....~~~.T',
  'T..WWW...=.......~~~.T',
  'T..WDW...=...S...~~~.T',
  'T...=....=...........T',
  '=====================G',
  'T......d...=.........T',
  'T..d.......=....C....T',
  'T..........=......d..T',
  'T....d.....=.........T',
  'T..........=....d....T',
  'TTTTTTTTTTTTTTTTTTTTTT'];
const SIGN_TEXT = {
  t0:'【💗 심장 마을】\n심장의 방과 판막, 혈액이 흐르는 길을 지키는 마을.\n수호자 파랑이를 이기면 동쪽 관문이 열린다.',
  t1:'【⚡ 근육 마을】\n심장근육세포와 박동조율기가 사는 마을.\nSA node → AV node → 방실다발 → 푸르키네섬유!',
  t2:'【🥁 펌프 마을】\n쿵-쾅(S1-S2) 소리가 끊이지 않는 마을.\nEDV − ESV = SV, HR × SV = CO',
  t3:'【🩸 혈관 마을】\n붉은 강(동맥)과 푸른 강(정맥)이 흐르는 마을.\n속막·중간막·바깥막을 기억하자.',
  t4:'【🫧 모세혈관 늪】\n정수압과 교질삼투압이 밀고 당기는 늪.\n동맥끝 +13, 정맥끝 −7, 평균 6mmHg!',
  t5:'【🌲 동맥정맥 숲】\n시험에 나온다는 동맥 표와 정맥 표의 숲.\n팔머리-왼온목-왼빗장밑, 복강동맥 = 간·위·지라!'
};
TOWNS.forEach((t,i)=>{
  const prev = i===0 ? {to:'room', tx:4, ty:6, dir:'up'} : {to:TOWNS[i-1].id, tx:20, ty:7, dir:'left'};
  const next = i===TOWNS.length-1 ? {to:'tower', tx:7, ty:12, dir:'up'} : {to:TOWNS[i+1].id, tx:1, ty:7, dir:'right'};
  MAPS[t.id] = { name:t.name, w:22, h:14, bg:t.th.tree, rows:TOWN_ROWS, theme:t.th, deco:t.deco, gateFlag:'win_'+t.guard,
    warps:[{x:0,y:7,...prev},{x:21,y:7,...next,need:'win_'+t.guard}],
    npcs:[{id:t.guard, x:11, y:10, spr: t.guard==='union' ? 'cats4' : t.guard==='dark' ? 'seongho' : 'cat', color:t.guard, dark:t.guard==='dark', dir:'up'}]
      .concat(i===0 ? [{id:'sh_village', x:4, y:8, spr:'seongho', dir:'right'}] : []),
    signs:[{x:13,y:5,text:SIGN_TEXT[t.id]}],
    chests:[{x:16,y:9,id:'c_'+t.id,item:'snack',n: i>=3 ? 2 : 1}]
  };
});
MAPS.room.warps[0] = {x:4,y:7,to:'t0',tx:1,ty:7,dir:'right'};
MAPS.tower.warps[0] = {x:7,y:13,to:'t5',tx:20,ty:7,dir:'left'};

const SOLID = new Set(['T','~','#','W','R','B','K','X','P','L','G','S','C','D']);

/* ---------------- 상태 ---------------- */
let S = Object.assign({map:'room', x:3, y:4, dir:'down', flags:{}, snack:1, hint:2, started:false}, store.get()||{});
if (S.hint==null) S.hint = 2;
if (!['room','tower','t0','t1','t2','t3','t4','t5'].includes(S.map)){ S.map = 't0'; S.x = 1; S.y = 7; }
const saveS = () => store.set(S);
let cv, ctx, running = false, last = 0, frame = 0;
let me = {px:0, py:0, moving:false, from:null, to:null, t:0, step:0};
let busy = false;           // 대화·배틀 중
let held = null;            // 눌린 방향
let particles = [];
let fade = 0, fadeDir = 0, onFadeMid = null;
const DIRS = {up:[0,-1], down:[0,1], left:[-1,0], right:[1,0]};

/* ---------------- 그리기: 타일 ---------------- */
function hash(x,y){ let h = x*374761393 + y*668265263; h = (h^(h>>13))*1274126177; return ((h^(h>>16))>>>0)/4294967295; }
function tileAt(m,x,y){ const r = MAPS[m].rows[y]; return r ? (r[x] || 'T') : 'T'; }
function drawTile(c, x, y, sx, sy, m){
  const h = hash(x,y), g = ctx;
  const grass = (base, dark) => { g.fillStyle = base; g.fillRect(sx,sy,T,T); g.fillStyle = dark;
    if (h>.3){ g.fillRect(sx+3+((h*7)|0),sy+5,1,2); g.fillRect(sx+4+((h*7)|0),sy+4,1,3); } if (h>.6){ g.fillRect(sx+10,sy+11,1,2); g.fillRect(sx+11,sy+10,1,3); } };
  const night = m==='tower';
  const th = MAPS[m].theme || {grass:'#72BF5E',grass2:'#5AA54A',path:'#D9B97C',path2:'#C9A665',tree:'#2E7D32',tree2:'#43A047',water:'#3E8ED0',water2:'#6FB3E8',roof:['#C0504D','#D9615C']};
  switch(c){
    case '.': case ',': grass(th.grass, th.grass2); break;
    case 'd': { grass(th.grass, th.grass2); const b = Math.sin(frame/14 + x*2)*1; const dc = MAPS[m].deco;
      if (dc==='heart'){ g.fillStyle='#FF5C8A'; g.fillRect(sx+4,sy+5+b,3,3); g.fillRect(sx+9,sy+5+b,3,3); g.fillRect(sx+4,sy+7+b,8,3); g.fillRect(sx+6,sy+10+b,4,2); g.fillRect(sx+7,sy+12+b,2,1); }
      else if (dc==='bolt'){ g.fillStyle='#FFD600'; g.fillRect(sx+8,sy+2,3,5); g.fillRect(sx+6,sy+6,5,2); g.fillRect(sx+6,sy+8,3,5); if (frame%40<6){ g.fillStyle='#FFFDE7'; g.fillRect(sx+5,sy+1,7,13);} }
      else if (dc==='drum'){ const p = (frame%60<8)?1:0; g.fillStyle='#C62828'; g.fillRect(sx+3-p,sy+6-p,10+2*p,7+p); g.fillStyle='#FFCDD2'; g.fillRect(sx+3-p,sy+5-p,10+2*p,2); g.fillStyle='#8D6E63'; g.fillRect(sx+2,sy+2,1,5); g.fillRect(sx+13,sy+3,1,4); }
      else if (dc==='drop'){ g.fillStyle = (x+y)%2 ? '#E53935' : '#1E88E5'; g.fillRect(sx+7,sy+3+b,2,2); g.fillRect(sx+6,sy+5+b,4,3); g.fillRect(sx+5,sy+8+b,6,3); g.fillRect(sx+6,sy+11+b,4,1); g.fillStyle='#fff'; g.fillRect(sx+6,sy+8+b,1,1); }
      else if (dc==='bubble'){ g.fillStyle='rgba(179,157,219,.9)'; const r=(frame/10+x)%8; g.fillRect(sx+4,sy+10-r,3,3); g.fillRect(sx+10,sy+12-((r+4)%8),2,2); g.fillStyle='#fff'; g.fillRect(sx+4,sy+10-r,1,1); }
      else { g.fillStyle='#2E7D32'; g.fillRect(sx+5,sy+6+b,6,4); g.fillRect(sx+7,sy+4+b,2,8); g.fillStyle='#81C784'; g.fillRect(sx+6,sy+7+b,2,1); }
      break; }
    case 'f': { grass(th.grass, th.grass2); const cols=['#FF7FA8','#FFE066','#FFFFFF','#B48CFF']; const col = cols[(h*4)|0];
      const sw = Math.sin(frame/20 + x)*0.6; g.fillStyle='#2E7D32'; g.fillRect(sx+7,sy+8,1,5);
      g.fillStyle=col; g.fillRect(sx+6+sw,sy+5,3,3); g.fillRect(sx+5+sw,sy+6,5,1); g.fillStyle='#FFB300'; g.fillRect(sx+7+sw,sy+6,1,1); break; }
    case '=': g.fillStyle=th.path; g.fillRect(sx,sy,T,T); g.fillStyle=th.path2; if(h>.4) g.fillRect(sx+((h*12)|0),sy+((h*97%12)|0),2,1); if(h>.7) g.fillRect(sx+3,sy+12,1,1); break;
    case 'b': g.fillStyle='#3E8ED0'; g.fillRect(sx,sy,T,T); g.fillStyle='#9C6B3F'; g.fillRect(sx,sy+2,T,12); g.fillStyle='#7A5230'; for(let i=0;i<T;i+=4) g.fillRect(sx+i,sy+2,1,12); g.fillStyle='#5C3A1E'; g.fillRect(sx,sy+2,T,1); g.fillRect(sx,sy+13,T,1); break;
    case '~': { g.fillStyle=th.water; g.fillRect(sx,sy,T,T); g.fillStyle=th.water2; const o = ((frame/8 + x*3 + y*5)|0)%T; g.fillRect(sx+(o%12),sy+4,4,1); g.fillRect(sx+((o+7)%12),sy+11,3,1); break; }
    case 'T': { grass(th.grass, th.grass2); g.fillStyle='#6D4C2F'; g.fillRect(sx+6,sy+10,4,6);
      g.fillStyle= th.tree; g.fillRect(sx+2,sy+3,12,8); g.fillRect(sx+4,sy+1,8,11);
      g.fillStyle= th.tree2; g.fillRect(sx+4,sy+3,5,4); g.fillRect(sx+3,sy+5,2,2); break; }
    case 'W': g.fillStyle = m==='room' ? '#E9D8C4' : '#F2E6D0'; g.fillRect(sx,sy,T,T); g.fillStyle = m==='room' ? '#C9B49A' : '#D8C7A8'; g.fillRect(sx,sy+T-2,T,2); if (m!=='room'){ g.fillStyle='#8DB6E0'; if (h>.5){ g.fillRect(sx+4,sy+4,8,6); g.fillStyle='#fff'; g.fillRect(sx+7,sy+4,1,6); g.fillRect(sx+4,sy+7,8,1);} } break;
    case 'R': g.fillStyle = (x+y)%3===0 ? th.roof[0] : th.roof[1]; g.fillRect(sx,sy,T,T); g.fillStyle='#9E3B38'; for(let i=0;i<T;i+=4) g.fillRect(sx,sy+i,T,1); break;
    case 'D': g.fillStyle='#8B5A2B'; g.fillRect(sx,sy,T,T); g.fillStyle='#6B4220'; g.fillRect(sx+2,sy+1,12,15); g.fillStyle='#FFD54F'; g.fillRect(sx+11,sy+8,2,2); break;
    case 'F': g.fillStyle='#C8935A'; g.fillRect(sx,sy,T,T); g.fillStyle='#B07E48'; g.fillRect(sx,sy+7,T,1); g.fillRect(sx,sy+15,T,1); g.fillRect(sx+((y%2)?4:12),sy,1,7); g.fillRect(sx+((y%2)?12:4),sy+8,1,7); break;
    case 'B': g.fillStyle='#C8935A'; g.fillRect(sx,sy,T,T); g.fillStyle='#F8BBD0'; g.fillRect(sx+1,sy+2,14,13); g.fillStyle='#fff'; if (tileAt(m,x-1,y)!=='B') g.fillRect(sx+2,sy+3,6,4); g.fillStyle='#F48FB1'; g.fillRect(sx+1,sy+9,14,1); break;
    case 'K': g.fillStyle='#C8935A'; g.fillRect(sx,sy,T,T); g.fillStyle='#8D6E63'; g.fillRect(sx,sy+4,T,9); g.fillStyle='#5D4037'; g.fillRect(sx+1,sy+13,2,3); g.fillRect(sx+13,sy+13,2,3);
      if (tileAt(m,x+1,y)==='K'){ g.fillStyle='#fff'; g.fillRect(sx+5,sy+5,9,6); g.fillStyle='#90CAF9'; g.fillRect(sx+6,sy+6,3,1); g.fillRect(sx+6,sy+8,6,1); } else { g.fillStyle='#FFE082'; g.fillRect(sx+3,sy+2,4,3); } break;
    case 'P': g.fillStyle = m==='room' ? '#C8935A' : th.grass; g.fillRect(sx,sy,T,T); g.fillStyle='#E57373'; g.fillRect(sx+4,sy+10,8,6); g.fillStyle='#43A047'; g.fillRect(sx+5,sy+3,6,7); g.fillRect(sx+3,sy+5,10,3); break;
    case 'L': { g.fillStyle = night ? '#3A3358' : '#C8935A'; g.fillRect(sx,sy,T,T); g.fillStyle='#5D4037'; g.fillRect(sx+7,sy+6,2,10); const fl = 0.6+Math.sin(frame/6+x)*0.2;
      g.fillStyle=`rgba(255,213,79,${fl})`; g.fillRect(sx+5,sy+1,6,6); g.fillStyle='#FFF8E1'; g.fillRect(sx+7,sy+3,2,2); break; }
    case 'S': grass(th.grass, th.grass2); g.fillStyle='#6D4C2F'; g.fillRect(sx+7,sy+9,2,7); g.fillStyle='#A1887F'; g.fillRect(sx+2,sy+3,12,7); g.fillStyle='#5D4037'; g.fillRect(sx+4,sy+5,8,1); g.fillRect(sx+4,sy+7,6,1); break;
    case 'C': { grass(th.grass, th.grass2); const ch = MAPS[m].chests.find(c=>c.x===x&&c.y===y); const open = ch && S.flags['chest_'+ch.id];
      g.fillStyle='#8D5524'; g.fillRect(sx+2,sy+6,12,9); g.fillStyle= open ? '#3E2723' : '#A0652E'; g.fillRect(sx+2,sy+3,12,4); g.fillStyle='#FFD54F'; g.fillRect(sx+7,sy+7,2,3); if (!open && frame%60<30){ g.fillStyle='#FFFDE7'; g.fillRect(sx+12,sy+2,1,1);} break; }
    case 'G': { const opened = !!S.flags[MAPS[m].gateFlag]; g.fillStyle=th.grass; g.fillRect(sx,sy,T,T);
      if (!opened){ g.fillStyle='#757575'; g.fillRect(sx+1,sy,14,T); g.fillStyle='#9E9E9E'; for(let i=0;i<T;i+=5) g.fillRect(sx+1,sy+i,14,2); g.fillStyle='#E53935'; g.fillRect(sx+6,sy+6,4,4); }
      else { g.fillStyle=th.path; g.fillRect(sx,sy,T,T); g.fillStyle='#FFD54F'; if (frame%30<15) g.fillRect(sx+7,sy+7,2,2); } break; }
    case 't': g.fillStyle = (x+y)%2 ? '#3A3358' : '#423B63'; g.fillRect(sx,sy,T,T); g.fillStyle='#2C2645'; g.fillRect(sx,sy,T,1); g.fillRect(sx,sy,1,T);
      if (y>=2 && x===7 && y<=12){ g.fillStyle='#8E2440'; g.fillRect(sx+2,sy,12,T); g.fillStyle='#B33A5A'; g.fillRect(sx+3,sy,1,T); g.fillRect(sx+12,sy,1,T); } break;
    case 'X': g.fillStyle='#241F3B'; g.fillRect(sx,sy,T,T); g.fillStyle='#2F2850'; g.fillRect(sx+((y%2)?0:8),sy+2,8,5); g.fillRect(sx+((y%2)?8:0),sy+9,8,5); if (y===1 && h>.6){ g.fillStyle='#7E57C2'; g.fillRect(sx+6,sy+4,4,6); g.fillStyle='#B39DDB'; g.fillRect(sx+7,sy+5,1,3);} break;
    case '^': g.fillStyle='#423B63'; g.fillRect(sx,sy,T,T); g.fillStyle='#5C5390'; for(let i=0;i<4;i++) g.fillRect(sx+1,sy+i*4,14,2); break;
    default: g.fillStyle='#000'; g.fillRect(sx,sy,T,T);
  }
}

/* ---------------- 그리기: 캐릭터 (도트) ---------------- */
function px(c, x, y, w=1, h=1){ ctx.fillStyle = c; ctx.fillRect(x|0, y|0, w, h); }
function drawGirl(x, y, dir, step){       // 혜선: 고양이상 — 쫑긋한 고양이 귀, 올라간 눈꼬리, ω 입, 살랑 꼬리
  const lg = step ? (step===1 ? 1 : -1) : 0;
  const tw = Math.sin(frame/10) > 0 ? 1 : 0;      // 꼬리 살랑
  px('rgba(0,0,0,.22)', x+3, y+14, 10, 2);
  // 꼬리 (뒤쪽)
  if (dir!=='down'){ const tx = dir==='left' ? x+12 : dir==='right' ? x+1 : x+7; px('#1A1A24', tx, y+7, 2, 4); px('#1A1A24', tx+(dir==='left'?1:-1)*tw, y+4, 2, 3); }
  else { px('#1A1A24', x+12, y+8, 2, 2); px('#1A1A24', x+13, y+6-tw, 2, 3); }
  px('#2B2B3A', x+5+(lg>0?1:0), y+11, 2, 4); px('#2B2B3A', x+9-(lg<0?1:0), y+11, 2, 4);
  px('#3949AB', x+4, y+9, 8, 3);
  px('#FAFAFA', x+4, y+5, 8, 5); px('#E0E0E0', x+4, y+9, 8, 1);
  px('#FFD9C2', x+3, y+6+(lg?1:0), 1, 3); px('#FFD9C2', x+12, y+6-(lg?1:0), 1, 3);
  px('#1A1A24', x+3, y-6, 10, 11);               // 긴 흑발
  // 고양이 귀
  px('#1A1A24', x+3, y-9, 3, 3); px('#1A1A24', x+4, y-10, 1, 1); px('#1A1A24', x+10, y-9, 3, 3); px('#1A1A24', x+11, y-10, 1, 1);
  if (dir!=='up'){ px('#F8BBD0', x+4, y-8, 1, 2); px('#F8BBD0', x+11, y-8, 1, 2); }
  if (dir!=='up'){
    px('#FFE0CC', x+4, y-4, 8, 8); px('#1A1A24', x+4, y-5, 8, 3);      // 얼굴 + 앞머리
    if (dir==='down'){
      // 고양이 눈: 눈꼬리가 위로
      px('#1A1A24', x+5, y-1, 2, 2); px('#1A1A24', x+4, y-2, 1, 1); px('#1A1A24', x+9, y-1, 2, 2); px('#1A1A24', x+11, y-2, 1, 1);
      px('#FFFFFF', x+6, y-1, 1, 1); px('#FFFFFF', x+10, y-1, 1, 1);
      px('#FF8A80', x+4, y+1, 2, 1); px('#FF8A80', x+10, y+1, 2, 1);   // 볼터치
      px('#8D6E63', x+1, y+1, 3, 1); px('#8D6E63', x+1, y+3, 3, 1); px('#8D6E63', x+12, y+1, 3, 1); px('#8D6E63', x+12, y+3, 3, 1);   // 고양이 수염
      px('#C2185B', x+7, y+2, 1, 1); px('#C2185B', x+8, y+2, 1, 1); px('#C2185B', x+6, y+1, 1, 1); px('#C2185B', x+9, y+1, 1, 1); // ω
    }
    if (dir==='left'){ px('#1A1A24', x+5, y-1, 2, 2); px('#1A1A24', x+4, y-2, 1, 1); px('#1A1A24', x+9, y-4, 4, 9); px('#C2185B', x+5, y+2, 1, 1); px('#FF8A80', x+5, y+1, 1, 1); }
    if (dir==='right'){ px('#1A1A24', x+9, y-1, 2, 2); px('#1A1A24', x+11, y-2, 1, 1); px('#1A1A24', x+3, y-4, 4, 9); px('#C2185B', x+10, y+2, 1, 1); px('#FF8A80', x+10, y+1, 1, 1); }
  } else { px('#26263A', x+5, y-5, 6, 1); }
  px('#B39DDB', x+11, y-5, 2, 2);                // 핀
}
function drawSeongho(x, y, dir, step, dark){   // 성호: 강아지상 — 축 처진 귀, 동글 순한 눈, 강아지 코, 살랑 꼬리
  const lg = step ? (step===1 ? 1 : -1) : 0;
  const wag = Math.sin(frame/4) > 0 ? 1 : -1;    // 꼬리 붕붕
  const hair = dark ? '#120012' : '#1C1C1C', ear = dark ? '#3E2723' : '#8D6E63', ear2 = dark ? '#2B1B17' : '#6D4C41';
  px('rgba(0,0,0,.22)', x+3, y+14, 10, 2);
  if (dir!=='down'){ const tx = dir==='left' ? x+12 : dir==='right' ? x+1 : x+7; px(ear, tx+wag, y+5, 2, 3); px(ear2, tx+wag*2, y+4, 2, 2); }
  else { px(ear, x+12+wag, y+6, 2, 2); }
  px('#37474F', x+5+(lg>0?1:0), y+11, 2, 4); px('#37474F', x+9-(lg<0?1:0), y+11, 2, 4);
  px(dark?'#4A148C':'#9E9E9E', x+4, y+5, 8, 7); px(dark?'#6A1B9A':'#BDBDBD', x+5, y+6, 6, 1);
  px('#F2C6A0', x+3, y+6, 1, 3); px('#F2C6A0', x+12, y+6, 1, 3);
  px('#F2C6A0', x+4, y-3, 8, 8);
  px(hair, x+3, y-5, 10, 4); px(hair, x+3, y-2, 1, 2); px(hair, x+12, y-2, 1, 2);    // 바가지 머리
  // 축 처진 강아지 귀 (양옆으로 늘어짐)
  if (dir!=='up' || true){ px(ear, x+1, y-4, 3, 7); px(ear2, x+1, y+1, 3, 2); px(ear, x+12, y-4, 3, 7); px(ear2, x+12, y+1, 3, 2); }
  if (dir==='left'){ px(ear, x+10, y-4, 3, 7); }
  if (dir==='down'){
    // 동글하고 처진 순한 눈 + 반짝
    px(dark?'#E53935':'#1C1C1C', x+5, y-1, 2, 3); px(dark?'#E53935':'#1C1C1C', x+9, y-1, 2, 3);
    px('#FFFFFF', x+5, y-1, 1, 1); px('#FFFFFF', x+9, y-1, 1, 1);
    px('#1C1C1C', x+4, y-2, 1, 1); px('#1C1C1C', x+11, y-2, 1, 1);    // 눈썹 처짐
    px('#3E2723', x+7, y+2, 2, 1);                                     // 강아지 코
    px('#C26A5A', x+7, y+3, 2, 1); if (!dark && frame%90<45) px('#FF8A80', x+8, y+4, 1, 1);   // 혀 빼꼼
  }
  if (dir==='left'){ px('#1C1C1C', x+5, y-1, 2, 3); px('#3E2723', x+4, y+2, 1, 1); }
  if (dir==='right'){ px('#1C1C1C', x+9, y-1, 2, 3); px('#3E2723', x+11, y+2, 1, 1); }
  if (dir==='up') px(hair, x+4, y-3, 8, 5);
  if (dark && frame%40<20){ px('rgba(156,39,176,.45)', x+1, y-7, 14, 22); }
}
const CAT_COL = { blue:['#ECEFF1','#90A4AE','#64B5F6'], fold:['#ECEFF1','#9E9E9E','#212121'], flower:['#F3E0C7','#D7B48E','#4E342E'], bunny:['#FFF8F0','#E8C9A8','#5D7F3B'] };
function drawCat(x, y, color, step, dir){
  const [a,b,e] = CAT_COL[color]; const bob = step ? 1 : 0;
  px('rgba(0,0,0,.22)', x+3, y+14, 10, 2);
  px(a, x+3, y+6+bob, 10, 7); px(b, x+3, y+6+bob, 10, 2);
  px(a, x+3, y-1+bob, 10, 8);
  if (color==='fold'){ px(b, x+3, y-1+bob, 3, 2); px(b, x+10, y-1+bob, 3, 2); }
  else if (color==='bunny'){ px('#FFFFFF', x+4, y-7+bob, 3, 7); px('#FFFFFF', x+9, y-7+bob, 3, 7); px('#F8BBD0', x+5, y-6+bob, 1, 4); px('#F8BBD0', x+10, y-6+bob, 1, 4); px('#FFFFFF', x+2, y-2+bob, 12, 3); }
  else { px(b, x+3, y-3+bob, 3, 3); px(b, x+10, y-3+bob, 3, 3); px('#F8BBD0', x+4, y-2+bob, 1, 1); px('#F8BBD0', x+11, y-2+bob, 1, 1); }
  if (dir!=='up'){ px(e, x+5, y+2+bob, 2, 2); px(e, x+9, y+2+bob, 2, 2); px('#fff', x+5, y+2+bob, 1, 1); px('#fff', x+9, y+2+bob, 1, 1); px('#F48FB1', x+7, y+4+bob, 2, 1); }
  px(b, x+12, y+3+bob + (frame%30<15?0:1), 3, 2);   // 꼬리
  if (color==='flower'){ px('#FFFFFF', x+11, y+5+bob, 3, 3); px('#FFE066', x+12, y+6+bob, 1, 1); px('#2E7D32', x+12, y+8+bob, 1, 3); }
}
function drawProf(x, y, dir){                 // 교수님: 단발 흑발, 검은 상의, 책
  px('rgba(0,0,0,.25)', x+2, y+14, 12, 2);
  px('#37474F', x+5, y+11, 2, 4); px('#37474F', x+9, y+11, 2, 4);
  px('#151515', x+3, y+4, 10, 9); px('#2A2A2A', x+4, y+5, 8, 1); px('#F2C6A0', x+6, y+4, 4, 1);
  px('#F2C6A0', x+2, y+6, 1, 3); px('#F2C6A0', x+13, y+6, 1, 3);
  px('#F2C6A0', x+4, y-3, 8, 8);
  px('#141414', x+3, y-6, 10, 4); px('#141414', x+2, y-3, 2, 8); px('#141414', x+12, y-3, 2, 8); px('#141414', x+3, y+3, 2, 2); px('#141414', x+11, y+3, 2, 2);
  if (dir==='down'){ px('#2B2B2B', x+5, y, 2, 1); px('#2B2B2B', x+9, y, 2, 1); px('#C26A5A', x+6, y+3, 4, 1); px('#C26A5A', x+5, y+2, 1, 1); px('#C26A5A', x+10, y+2, 1, 1); }
  px('#1565C0', x+11, y+6, 4, 5); px('#FFFFFF', x+12, y+7, 2, 3);
  if (frame%50<25){ px('rgba(255,235,59,.6)', x, y-8, 1, 1); px('rgba(255,235,59,.6)', x+15, y-6, 1, 1); }
}
function drawNpc(n, sx, sy){
  const step = (n.idle = (n.idle||0)+1) % 80 < 40 ? 0 : 1;
  if (n.spr==='cat') drawCat(sx, sy, n.color, step, n.dir);
  else if (n.spr==='cats4'){ drawCat(sx-6, sy+2, 'blue', step, 'down'); drawCat(sx+6, sy+2, 'fold', 1-step, 'down'); drawCat(sx-6, sy-8, 'flower', 1-step, 'down'); drawCat(sx+6, sy-8, 'bunny', step, 'down'); }
  else if (n.spr==='seongho') drawSeongho(sx, sy, n.dir, 0, n.dark);
  else if (n.spr==='prof') drawProf(sx, sy, n.dir);
  // 이긴 수호자는 배지 표시, 아직이면 느낌표
  const done = S.flags['win_'+n.id];
  if (['blue','fold','flower','bunny','dark','union','prof'].includes(n.id)){
    if (!done){ const b = Math.sin(frame/8)*1.5; px('#FFEB3B', sx+7, sy-14+b, 2, 5); px('#FFEB3B', sx+7, sy-8+b, 2, 2); }
    else { px('#FF5C8A', sx+6, sy-12, 4, 3); px('#FF5C8A', sx+7, sy-9, 2, 1); }
  }
}

/* ---------------- 화면 그리기 ---------------- */
function render(){
  const m = MAPS[S.map];
  const camX = Math.max(0, Math.min(m.w*T - VW*T, me.px - (VW*T)/2 + T/2));
  const camY = Math.max(0, Math.min(m.h*T - VH*T, me.py - (VH*T)/2 + T/2));
  const ox = m.w*T < VW*T ? ((VW*T - m.w*T)/2)|0 : -camX|0, oy = m.h*T < VH*T ? ((VH*T - m.h*T)/2)|0 : -camY|0;
  ctx.fillStyle = m.bg; ctx.fillRect(0,0,VW*T,VH*T);
  const x0 = Math.max(0, Math.floor(-ox/T)), y0 = Math.max(0, Math.floor(-oy/T));
  for (let y=y0; y<Math.min(m.h, y0+VH+2); y++) for (let x=x0; x<Math.min(m.w, x0+VW+2); x++) drawTile(tileAt(S.map,x,y), x, y, x*T+ox, y*T+oy, S.map);
  drawPlates(ox, oy); drawMemory(ox, oy);
  // 캐릭터 (y 순서)
  const ents = m.npcs.map(n=>({y:n.y*T, draw:()=>drawNpc(n, n.x*T+ox, n.y*T+oy)}));
  const vg = villagerFor(S.map); if (vg) ents.push({y: vg.pos.y*T, draw:()=>drawVillager(vg, vg.pos.x*T+ox, vg.pos.y*T+oy)});
  ents.push({y:me.py, draw:()=>drawGirl(me.px+ox, me.py+oy, S.dir, me.moving ? (me.step%2)+1 : 0)});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  drawEmotes(ox, oy);
  // 나무 윗부분 다시(캐릭터 가림 효과)
  // 탑: 어둠 + 빛
  if (S.map==='tower'){ ctx.fillStyle='rgba(20,10,40,.25)'; ctx.fillRect(0,0,VW*T,VH*T); }
  if (S.map==='t5'){ ctx.fillStyle='rgba(10,40,20,.14)'; ctx.fillRect(0,0,VW*T,VH*T); }
  if (S.map==='t4'){ ctx.fillStyle='rgba(60,20,90,.12)'; ctx.fillRect(0,0,VW*T,VH*T); }
  // 입자
  particles = particles.filter(p=>p.life>0);
  particles.forEach(p=>{ p.life--; p.x+=p.vx; p.y+=p.vy; px(p.c, p.x+ox, p.y+oy, p.s, p.s); });
  if (S.map==='t5' && frame%12===0) particles.push({x: rnd(0,m.w*T), y: rnd(0,m.h*T), vx: rnd(-.2,.2), vy: -.15, life: 90, c:'rgba(200,255,140,.8)', s:1});
  if (S.map==='t0' && frame%26===0) particles.push({x: rnd(0,m.w*T), y: rnd(0,40), vx: .3, vy: .25, life: 140, c:'rgba(255,140,170,.9)', s:2});
  if (S.map==='t1' && frame%10===0) particles.push({x: rnd(0,m.w*T), y: rnd(0,m.h*T), vx: rnd(-.6,.6), vy: rnd(-.6,.6), life: 14, c:'rgba(255,235,59,.95)', s:1});
  if (S.map==='t2' && frame%60===0) for (let i=0;i<8;i++) particles.push({x: 11*T, y: 4*T, vx: Math.cos(i)*1.2, vy: Math.sin(i)*1.2, life: 26, c:'rgba(255,82,82,.7)', s:1});
  if (S.map==='t3' && frame%18===0) particles.push({x: rnd(0,m.w*T), y: 7*T+8, vx: 1.2, vy: 0, life: 120, c: Math.random()<.5 ? 'rgba(229,57,53,.9)' : 'rgba(30,136,229,.9)', s:2});
  if (S.map==='t4' && frame%9===0) particles.push({x: rnd(17*T, 20*T), y: 6*T, vx: rnd(-.1,.1), vy: -.35, life: 60, c:'rgba(209,196,233,.9)', s:2});
  if (S.map==='tower' && frame%8===0) particles.push({x: rnd(0,m.w*T), y: m.h*T, vx: 0, vy: -.4, life: 120, c:'rgba(179,157,219,.7)', s:1});
  // 페이드
  if (fadeDir){ fade += fadeDir*0.08; if (fade>=1 && fadeDir>0){ fade=1; fadeDir=-1; onFadeMid && onFadeMid(); onFadeMid=null; } if (fade<=0 && fadeDir<0){ fade=0; fadeDir=0; } }
  if (fade>0){ ctx.fillStyle=`rgba(0,0,0,${fade})`; ctx.fillRect(0,0,VW*T,VH*T); }
  floats = floats.filter(f=>f.life-- > 0);
  floats.forEach((f,i)=>{ ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillText(f.text, VW*T/2+1, 31+i*12-(80-f.life)*.2); ctx.fillStyle=f.color; ctx.fillText(f.text, VW*T/2, 30+i*12-(80-f.life)*.2); });
  if (shake > 0){ shake--; cv.style.transform = `translateX(${(shake%2?2:-2)}px)`; } else cv.style.transform = '';
}

/* ---------------- 이동 ---------------- */
function solidAt(x, y){
  const m = MAPS[S.map]; if (x<0||y<0||x>=m.w||y>=m.h) return true;
  const c = tileAt(S.map,x,y);
  if (c==='G') return !S.flags[MAPS[S.map].gateFlag];
  if (SOLID.has(c)) return true;
  return m.npcs.some(n=>n.x===x && n.y===y);
}
function tryMove(dir){
  if (me.moving || busy || fadeDir) return;
  S.dir = dir; const [dx,dy] = DIRS[dir]; const nx = S.x+dx, ny = S.y+dy;
  const w = MAPS[S.map].warps.find(w=>w.x===nx && w.y===ny);
  if (w){ if (w.need && !S.flags[w.need]){ blockedWarp(w); return; } warp(w); return; }
  const vg = villagerFor(S.map); if (vg && vg.pos.x===nx && vg.pos.y===ny) return;
  if (solidAt(nx, ny)){ bumpWall(); return; }
  me.moving = true; me.from = {x:S.x, y:S.y}; me.to = {x:nx, y:ny}; me.t = 0;
}
let bumpCool = 0;
function bumpWall(){ if (bumpCool>0) return; bumpCool = 12; SFX.bump(); }
function warp(w){
  fadeDir = 1; busy = true;
  onFadeMid = ()=>{ S.map = w.to; S.x = w.tx; S.y = w.ty; S.dir = w.dir || S.dir; me.px = S.x*T; me.py = S.y*T; puzzleProg = 0; saveS(); showMapName(); playBgm(S.map); busy = false; mapEnter(); };
}
function blockedWarp(w){
  const t = TOWNS.find(t=>'win_'+t.guard===w.need);
  say([[P.sys, `관문이 굳게 닫혀 있다.\n이 마을의 수호자 ${P[t.guard] ? P[t.guard].name : '냥냥 연합'}을(를) 이겨야 열린다.\n(마을 가운데 길 아래쪽에 있다)`]]);
}
const countFlags = a => a.filter(f=>S.flags[f]).length;
function showMapName(){ const n = $('#stmapname'); n.textContent = MAPS[S.map].name; n.classList.remove('show'); void n.offsetWidth; n.classList.add('show'); }
function update(){
  frame++; if (bumpCool>0) bumpCool--;
  if (me.moving){
    me.t += 1/8; if (me.t>=1){ me.moving=false; S.x = me.to.x; S.y = me.to.y; me.step++; saveS(); onStep(); }
    const t = Math.min(1, me.t);
    me.px = (me.from.x + (me.to.x-me.from.x)*t)*T; me.py = (me.from.y + (me.to.y-me.from.y)*t)*T;
  } else { me.px = S.x*T; me.py = S.y*T;
    const v = inputVec(); let d = null;
    if (Math.max(Math.abs(v.x), Math.abs(v.y)) > 0.4) d = Math.abs(v.x) > Math.abs(v.y) ? (v.x>0?'right':'left') : (v.y>0?'down':'up');
    if (d && !busy) tryMove(d); }
  moveVillager();
}
function onStep(){ onStepPuzzle(); }
function front(){ const [dx,dy] = DIRS[S.dir]; return {x:S.x+dx, y:S.y+dy}; }
function interact(){
  if (busy || me.moving) return;
  const f = front(), m = MAPS[S.map];
  const n = m.npcs.find(n=>n.x===f.x && n.y===f.y);
  if (n){ n.dir = ({up:'down',down:'up',left:'right',right:'left'})[S.dir]; return talk(n.id); }
  const vg = villagerFor(S.map); if (vg && vg.pos.x===f.x && vg.pos.y===f.y){ vg.k = ((vg.k||0)+1) % vg.tips.length; return say([[{name:vg.name, face:null}, vg.tips[vg.k]]]); }
  const mm = MEMORIES[S.map]; if (mm && mm.x===f.x && mm.y===f.y && !S.flags['mem_'+S.map]) return pickMemory(mm);
  const pl = platesFor(S.map).find(p=>p.x===f.x && p.y===f.y); if (pl) return say([[P.sys, `발판에 「${pl.label}」라고 적혀 있다.\n(${PUZZLES[S.map].title}대로 밟아야 한다)`]]);
  const sg = m.signs.find(s=>s.x===f.x && s.y===f.y); if (sg) return say([[P.sys, sg.text + (PUZZLES[S.map] && !S.flags['puz_'+S.map] ? `\n\n🧩 퍼즐: 마을의 발판 4개를 「${PUZZLES[S.map].title}」대로 밟아라!` : '')]]);
  const ch = m.chests.find(c=>c.x===f.x && c.y===f.y); if (ch) return openChest(ch);
  const c = tileAt(S.map, f.x, f.y);
  if (c==='K') return say([[P.hs,'(강의자료다. 퀴즈가 16일 금요일이니까… 오늘도 조금만 더 보자!)']]);
  if (c==='B') return say([[P.hs,'(침대… 퀴즈 끝나고 푹 자야지.)']]);
}
function openChest(ch){
  if (S.flags['chest_'+ch.id]) return say([[P.sys,'빈 상자다.']]);
  S.flags['chest_'+ch.id] = true; S.snack += ch.n; S.hint = (S.hint||0) + 1; saveS(); SFX.open();
  say([[P.sys,`보물상자를 열었다!\n🐟 간식 ${ch.n}개 (배틀 중 HP 8 회복)\n💡 냥펀치 힌트 1개 (오답 하나 지우기)`]]);
}

/* ---------------- 대화창 ---------------- */
function say(lines){
  return new Promise(res=>{
    busy = true; const box = $('#stdlg'), face = $('#stface'), nm = $('#stname'), tx = $('#sttext');
    let i = 0, typing = null, full = '';
    const show = ()=>{
      if (i >= lines.length){ box.classList.remove('open'); busy = false; box.onclick = null; res(); return; }
      const [who, text] = lines[i];
      nm.textContent = who.name; nm.style.display = who.name ? '' : 'none';
      if (who.face){ face.style.display=''; face.style.backgroundImage = `url(${who.face})`; face.textContent=''; }
      else if (who===P.prof){ face.style.display=''; face.style.backgroundImage='none'; face.textContent='👩‍🏫'; }
      else if (who===P.hs){ face.style.display=''; face.style.backgroundImage='none'; face.textContent='🙋‍♀️'; }
      else { face.style.display='none'; }
      full = text; let k = 0; tx.textContent = '';
      clearInterval(typing); typing = setInterval(()=>{ k++; tx.textContent = full.slice(0,k); if (k>=full.length){ clearInterval(typing); typing=null; } }, 22);
      box.classList.add('open');
    };
    box.onclick = ()=>{ if (typing){ clearInterval(typing); typing=null; tx.textContent = full; return; } i++; show(); };
    advance = box.onclick;
    show();
  });
}
let advance = null;
function choose(question, opts){
  return new Promise(res=>{
    busy = true; const box = $('#stchoice'); box.innerHTML = `<p>${question}</p>`;
    opts.forEach((o,i)=>{ const b = document.createElement('button'); b.textContent = o; b.onclick = ()=>{ box.classList.remove('open'); busy=false; res(i); }; box.appendChild(b); });
    box.classList.add('open');
  });
}

/* ---------------- 스토리 대사 ---------------- */
async function talk(id){
  const F = S.flags;
  switch(id){
    case 'sh_room':
      if (!F.intro){
        await say([[P.sh,'혜선아 일어났어? 오늘 무슨 날인지 알지?'],[P.hs,'…형성평가 D-day 다가오는 날?'],
          [P.sh,'맞아! 그래서 내가 준비했지. 이 세계에는 심장 마을이랑 혈관 숲이 있어.'],
          [P.sh,'마을과 숲을 지키는 수호자들한테 퀴즈로 이기면 배지를 받을 수 있어.'],
          [P.sh,'배지를 다 모으면 마지막 「형성평가의 탑」에 갈 수 있는데…'],
          [P.sh,'거기엔 신정은 교수님이 기다리고 계셔. 교수님께 인정받으면 클리어!'],
          [P.hs,'으… 떨린다.'],[P.sh2,'걱정 마! 고양이들이 도와줄 거야. 틀려도 해설 보면서 배우면 돼.'],
          [P.sh,'아, 그리고 배틀에서 하트가 줄면 🐟 간식으로 회복할 수 있어. 하나 줄게!'],
          [P.sys,'(방향키로 움직이고, A 버튼으로 말을 걸거나 조사할 수 있다.)']]);
        F.intro = true; saveS();
      } else await say([[P.sh,'아래쪽 문으로 나가면 심장 마을이야. 화이팅!']]);
      break;
    case 'blue':
      await guardian('blue', P.blue, ['h1','h2'], 4, 3, '심장의 위치·구조·판막, 혈류·관상순환',
        ['냥! 나는 심장 마을 첫 번째 수호자 파랑이다냥.','심장의 구조랑 혈류 순서를 정확히 알고 있냥?'], ['…졌다냥. 판막이랑 혈류는 완벽하다냥!','심장 배지 하나 가져가라냥 💗']); break;
    case 'fold':
      await guardian('fold', P.fold, ['h3','h4'], 4, 3, '심장근육·전기생리, 심전도·부정맥',
        ['…졸려냥. 근육 마을 수호자 접냥이다냥.','사이원반, 정점지속기, SA node, AV node… 전도계통은 자신 있냥?'], ['…눈이 번쩍 떠졌다냥. 대단하다냥.','배지 줄게냥… 이제 다시 잘게냥 💤']); break;
    case 'flower':
      await guardian('flower', P.flower, ['h5','h6'], 4, 3, '심음·심장주기, 심장박출량과 조절',
        ['꽃 받아라냥! …아니 문제 받아라냥!','심장주기랑 SV, CO 계산은 할 줄 알냥?'], ['헤헤 졌다냥. 이 꽃은 혜선이 거다냥 🌼','심장 배지도 함께 주겠다냥!']); break;
    case 'sh_village':
      await say([[P.sh,'여기서부터 마을이 6개 이어져 있어. 심장 마을 → 근육 마을 → 펌프 마을 → 혈관 마을 → 모세혈관 늪 → 동맥정맥 숲!'],
        [P.sh,'마을마다 수호자가 길 아래쪽에 서 있어. 이기면 동쪽 관문이 열려.'],[P.sh2,'모세혈관 늪에는… 조금 이상한 내가 있을지도 몰라 ㅋㅋ']]);
      break;
    case 'bunny':
      await guardian('bunny', P.bunny, ['v1','v2'], 4, 3, '혈관벽·혈관 종류, 순환경로·혈압·저항',
        ['깡총! 혈관 숲 첫 수호자 토끼냥이다냥.','속막·중간막·바깥막, 맥압이랑 MAP… 다 외웠냥?'], ['윙크~ 인정이다냥 😉','혈관 배지를 주겠다냥!']); break;
    case 'dark':
      await guardian('dark', P.dark, ['v3','v4'], 4, 3, '혈압 조절(신경·RAAS), 모세혈관과 체액 이동',
        ['크크크… 나는 모세혈관 늪의 어둠에 물든 흑화 성호다.','혈압 조절이랑 순여과압을 모르면 지나갈 수 없다!'], ['으윽… 혜선이의 공부력에 정화된다…!',[P.sh,'어…? 나 여기서 뭐 하고 있었지? 아무튼 혜선아 너무 멋있다!']]); break;
    case 'union':
      await guardian('union', {name:'냥냥 연합', face:'cat3.jpg'}, ['v5','v6'], 4, 3, '온몸동맥·맥박지점, 온몸정맥',
        ['우리는 고양이 4마리가 합체한 냥냥 연합이다냥!!','동맥 표랑 정맥 표… 시험에 나온다고 필기된 거 알지냥?'], ['냥냥 연합… 해산이다냥…!','마지막 배지다냥. 탑에서 교수님이 기다리신다냥!']); break;
    case 'prof':
      await bossTalk(); break;
  }
}
async function mapEnter(){
  const F = S.flags, t = TOWNS.find(t=>t.id===S.map);
  if (t && !F['enter_'+t.id]){ F['enter_'+t.id] = true; saveS(); await say([[P.sys, `${t.name}에 도착했다.`],[P.hs, `여기는 ${t.topic}… 수호자를 찾아보자!`]]); }
  if (S.map==='tower' && !F.enterTower){ F.enterTower = true; saveS(); await say([[P.sys,'🏰 형성평가의 탑. 공기가 팽팽하다.'],[P.hs,'저 위에… 교수님이 계셔.']]); }
}
const TAUNT = {
  blue:['파랑이가 꼬리를 살랑거린다.','생선 냄새가 난다…','파랑이의 파란 눈이 반짝인다.'],
  fold:['접냥이가 하품을 한다.','지지직… 전기가 흐른다.','접냥이가 반쯤 졸고 있다.'],
  flower:['꽃냥이가 꽃다발을 흔든다.','쿵-쾅, 심장 소리가 들린다.','꽃향기가 난다.'],
  bunny:['토끼냥이 윙크한다 😉','혈구들이 줄지어 지나간다.','토끼냥이 깡총 뛴다.'],
  dark:['흑화 성호가 음침하게 웃는다.','어둠의 오라가 짙어진다…','"혜선아… 이것도 맞힐 수 있어?"'],
  union:['고양이 넷이 동시에 쳐다본다.','냥냥 연합의 기세가 대단하다!','"냥!!!!"']
};
async function guardian(id, who, units, hp, myHp, topic, intro, outro){
  if (S.flags['win_'+id]){ await say([[who, '이미 인정했다냥! 다른 수호자를 찾아가라냥.'.replace('냥', id==='dark'?'':'냥')]]); return; }
  emote(id, '!'); SFX.blip();
  const town = TOWNS.find(t=>t.guard===id);
  if (town && PUZZLES[town.id] && !S.flags['puz_'+town.id]){
    await say([[who, ('잠깐! 배틀하려면 먼저 마을의 발판 퍼즐을 풀어 와라냥.').replace(/냥/g, id==='dark'?'':'냥')],[P.sys, `🧩 「${PUZZLES[town.id].title}」대로 발판 4개를 밟자.\n발판 앞에서 A를 누르면 적힌 글자를 볼 수 있다.`]]);
    return;
  }
  await say(intro.map(t=>[who,t]));
  const c = await choose(`${who.name}과(와) 퀴즈 배틀을 할까? (범위: ${topic})`, ['⚔️ 배틀 시작!','조금 더 공부하고 올게']);
  if (c===1){ await say([[who,'언제든 다시 오라냥.']]); return; }
  const win = await battle({who: Object.assign({}, who, {key:id, taunt: TAUNT[id]}), units, hp, myHp, level:null, title: who.name});
  if (win){
    S.flags['win_'+id] = true; saveS();
    await say(outro.map(t=>Array.isArray(t) ? t : [who,t]));
    const ti = TOWNS.findIndex(t=>t.guard===id);
    await say([[P.sys, ti < TOWNS.length-1 ? `🏅 배지를 얻었다! 동쪽 관문이 열렸다 → ${TOWNS[ti+1].name}` : '🏅 마지막 배지! 동쪽 끝 형성평가의 탑으로 가는 길이 열렸다.']]);
  } else {
    await say([[who,'아쉽다냥… 해설 보고 다시 오면 분명 이길 거다냥!'.replace(/냥/g, id==='dark'?'':'냥')]]);
  }
}
async function bossTalk(){
  const F = S.flags;
  if (F.cleared){ await say([[P.prof,'벌써 준비가 다 됐네요. 퀴즈 날 그 실력 그대로 보여주세요.']]); return; }
  await say([[P.prof,'어서 오세요. 여기까지 온 걸 보니 꽤 열심히 했나 봐요.'],
    [P.prof,'이번 퀴즈는 형성평가예요. 2주 동안 진행한 심장, 혈관 파트가 범위고요.'],
    [P.prof,'시험기간이 다가오는데, 적어도 심혈관계는 준비되었으면 하는 바람이에요.'],
    [P.prof,'그럼 마지막으로 확인해 볼게요. 이번엔 조금 어려울 거예요.']]);
  const c = await choose('신정은 교수님의 최종 시험에 도전할까? (고난도 · 심장+혈관 전 범위)', ['📝 도전한다!','조금 더 준비하고 올게요']);
  if (c===1){ await say([[P.prof,'좋아요. 충분히 준비하고 오세요.']]); return; }
  const win = await battle({who: Object.assign({}, P.prof, {key:'prof'}), units:null, hp:9, myHp:5, level:'hard', title:'최종 시험: 신정은 교수님', boss:true});
  if (win){
    F.cleared = true; saveS();
    await say([[P.prof,'…훌륭해요. 함정 문제까지 다 피했네요.'],[P.prof,'적어도 심혈관계는 완벽하게 준비됐어요. 퀴즈 날 이대로만 해요.'],
      [P.sys,'🎓 형성평가의 탑을 클리어했다!'],[P.sh,'혜선아!!! 해냈다!!!'],[P.sh2,'처음부터 끝까지 진짜 멋있었어.'],[P.sh,'혜선아 사랑해! 진심으로 화이팅!!']]);
    if (typeof showMedia==='function') showMedia(MEDIA.best, '스토리모드 클리어!', '혜선아 사랑해! 진심으로 화이팅!!', '고마워!', 'legend');
    if (typeof save!=='undefined'){ save.xp += 300; save.game = save.game || {}; persist(); }
    if (typeof toast==='function') setTimeout(()=>toast('🏆 스토리모드 클리어! +300XP'), 800);
  } else {
    await say([[P.prof,'아쉽네요. 하지만 틀린 문제에서 배우는 게 더 많아요.'],[P.prof,'해설을 꼭 다시 보고 오세요. 기다릴게요.']]);
  }
}

/* ================= 사운드 (칩튠 BGM + 효과음) ================= */
const AU = {ctx:null, bgm:null, step:0};
function ac(){ if (!AU.ctx){ try { AU.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } return AU.ctx; }
function tone(f, d=0.08, type='square', vol=0.04, when=0){
  if (S.mute) return; const a = ac(); if (!a || !f) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  blip: ()=>tone(1046, 0.025, 'square', 0.015),
  ok:   ()=>{ tone(784,.08); tone(1046,.08,'square',.04,.08); tone(1318,.14,'square',.04,.16); },
  ng:   ()=>{ tone(196,.16,'sawtooth',.04); tone(147,.22,'sawtooth',.04,.14); },
  hit:  ()=>{ tone(880,.05,'square',.05); tone(440,.08,'square',.05,.05); },
  open: ()=>{ [523,659,784,1046].forEach((f,i)=>tone(f,.1,'square',.035,i*.07)); },
  puzzle: ()=>{ tone(659,.07); tone(988,.12,'square',.04,.07); },
  win:  ()=>{ [523,659,784,1046,784,1046].forEach((f,i)=>tone(f,.14,'square',.04,i*.12)); },
  bump: ()=>tone(90,.05,'square',.03)
};
// 마을별 짧은 멜로디 (음계 숫자: 0=C4 … ), 반복 재생
const NOTE = n => n==null ? 0 : 261.63 * Math.pow(2, n/12);
const BGM = {
  room:  [0,4,7,12, 7,4,0,null, 2,5,9,14, 9,5,2,null],
  t0:    [7,9,11,12, 11,9,7,4, 5,7,9,7, 4,2,0,null],
  t1:    [0,0,7,7, 5,5,3,null, 0,3,5,7, 10,7,5,null],
  t2:    [0,null,0,7, null,7,5,null, 3,null,3,10, null,10,7,null],
  t3:    [9,7,5,4, 5,7,9,null, 12,11,9,7, 9,null,5,null],
  t4:    [0,3,6,3, 0,3,6,9, 8,6,3,0, 6,null,3,null],
  t5:    [4,7,11,7, 9,12,16,12, 11,7,4,7, 9,null,7,null],
  tower: [0,3,7,10, 12,10,7,3, 2,5,8,12, 11,8,5,null],
  battle:[12,12,15,12, 17,15,12,10, 12,12,15,17, 19,17,15,12],
  boss:  [0,0,12,0, 10,0,8,0, 7,0,8,10, 12,15,12,10]
};
const BASS = { battle:[0,0,7,7], boss:[0,0,-2,-4] };
function playBgm(key){
  if (AU.key === key) return; AU.key = key; clearInterval(AU.bgm); AU.step = 0;
  const mel = BGM[key] || BGM.room, fast = key==='battle'||key==='boss';
  AU.bgm = setInterval(()=>{
    if (S.mute || !running) return;
    const n = mel[AU.step % mel.length]; if (n!=null) tone(NOTE(n+12), fast ? .1 : .16, 'square', fast ? .022 : .016);
    if (AU.step % 4 === 0){ const b = (BASS[key]||[0,5,7,5])[(AU.step/4|0)%4]; tone(NOTE(b-12), fast ? .2 : .35, 'triangle', .035); }
    AU.step++;
  }, fast ? 140 : 210);
}
function stopBgm(){ clearInterval(AU.bgm); AU.key = null; }

/* ================= 발판 퍼즐 · 기억 조각 · 주민 ================= */
const PLATE_POS = [[2,10],[7,12],[14,12],[19,11]];
const PUZZLES = {
  t0: {title:'혈액이 흐르는 순서', seq:['오른심방','삼첨판막','오른심실','허파동맥판막']},
  t1: {title:'전기 신호가 전달되는 순서', seq:['굴심방결절','방실결절','방실다발','푸르키네섬유']},
  t2: {title:'심장주기 순서', seq:['심실충만기','등용적성수축기','심실박출기','등용적성이완기']},
  t3: {title:'동맥에서 정맥까지 혈액이 지나는 순서', seq:['동맥','세동맥','모세혈관','세정맥']},
  t4: {title:'RAAS 기관 순서', seq:['간(안지오텐시노겐)','콩팥(레닌)','폐(ACE)','부신(알도스테론)']},
  t5: {title:'다리로 내려가는 동맥 순서', seq:['바깥엉덩동맥','넙다리동맥','오금동맥','앞정강동맥']}
};
// 발판 위치는 마을마다 섞어서 배치 (순서를 알아야 풀 수 있게)
const PLATE_ORDER = { t0:[2,0,3,1], t1:[3,1,0,2], t2:[1,3,2,0], t3:[0,2,1,3], t4:[2,3,0,1], t5:[1,0,3,2] };
const MEMORIES = {
  t0: {x:19, y:2, img:'good12.jpg', title:'기억 조각 ① 처음 같이 찍은 사진', lines:['이날 기억나? 혜선이가 엄청 새침하게 카메라 봤던 날.','나는 그때부터 혜선이 고양이 같다고 생각했어 ㅎㅎ']},
  t1: {x:20, y:12, img:'good13.jpg', title:'기억 조각 ② 맑은 날', lines:['하늘 엄청 파랬던 날.','혜선이 브이 한 거 아직도 내 배경화면이야.']},
  t2: {x:1, y:2, img:'good5.jpg', title:'기억 조각 ③ sweet 고양이 필터', lines:['고양이 필터 둘 다 너무 잘 어울렸지.','그때 혜선이가 웃는 거 보고 나도 계속 웃었어.']},
  t3: {x:20, y:2, img:'good6.jpg', title:'기억 조각 ④ 인생네컷', lines:['인생네컷 찍을 때마다 포즈 고민하는 혜선이 귀여워.','다음엔 고양이 귀 머리띠 하고 찍자!']},
  t4: {x:1, y:12, img:'good2.jpg', title:'기억 조각 ⑤ 눈 왕 커진 날', lines:['이 필터 진짜 웃겼다 ㅋㅋㅋ','혜선이랑 있으면 뭘 해도 재밌어.']},
  t5: {x:20, y:12, img:'good25.jpg', title:'기억 조각 ⑥ 우리', lines:['혜선아, 공부하느라 힘들지?','시험 끝나면 우리 맛있는 거 먹으러 가자. 육회 쿠폰도 있잖아 ㅎㅎ']}
};
const VILLAGER = {
  t0: {name:'적혈구', kind:'rbc', tips:['나는 산소를 나르는 적혈구! 허파정맥으로 돌아오면 산소가 가득해.','오른쪽은 폐로, 왼쪽은 온몸으로! 판막 이름은 뒤에 있는 혈관 이름이야.','관상동맥은 심장이 쉴 때(이완기) 피가 제일 잘 들어가.']},
  t1: {name:'전기 요정', kind:'spark', tips:['SA node 60~100, AV node 40~60, 푸르키네 20~40! 아래로 갈수록 느려져.','방실결절은 틈새이음이 가장 적어서 100ms 늦어져. 0.05m/s!','정점지속기는 Ca2+ 통로가 느리게 닫혀서 길어지는 거야.']},
  t2: {name:'심음 북치기', kind:'rbc2', tips:['S1은 방실판막, S2는 반달판막! S3는 S2 뒤, S4는 S1 앞.','EDV 120 − ESV 50 = SV 70, 72 × 70 = 약 5L/분!','후부하가 오르면 SV는 줄고 ESV는 늘어나.']},
  t3: {name:'혈관 경비원 백혈구', kind:'wbc', tips:['속막=단층편평상피, 중간막=민무늬근, 바깥막=성긴결합조직!','MAP = 확장기 + 1/3(수축기−확장기). 120/80이면 약 93!','혈류는 반지름의 네제곱! 2배면 16배야.']},
  t4: {name:'알부민 할머니', kind:'albumin', tips:['내가 물을 붙잡아서 교질삼투압을 만들지. 22mmHg!','동맥끝 35−22=+13 밖으로, 정맥끝 15−22=−7 안으로.','압력수용기는 대동맥활과 목동맥팽대, 화학수용기는 토리!']},
  t5: {name:'숲지기 다람쥐', kind:'squirrel', tips:['대동맥활 가지는 팔머리 → 왼온목 → 왼빗장밑!','복강동맥은 내림배대동맥의 두 번째 가지, 간·위·지라!','간문맥은 간으로 들어가고, 간정맥은 아래대정맥으로 나가.']}
};
function townOf(m){ return TOWNS.find(t=>t.id===m); }
function platesFor(m){
  if (!PUZZLES[m]) return [];
  return PLATE_ORDER[m].map((k,i)=>({x:PLATE_POS[i][0], y:PLATE_POS[i][1], label:PUZZLES[m].seq[k], order:k}));
}
let puzzleProg = 0;
function onStepPuzzle(){
  const m = S.map; if (!PUZZLES[m] || S.flags['puz_'+m]) return;
  const p = platesFor(m).find(p=>p.x===S.x && p.y===S.y); if (!p) return;
  if (p.order === puzzleProg){
    puzzleProg++; SFX.puzzle(); floatOver(`${'①②③④'[p.order]} ${p.label}`, '#FFE066');
    if (puzzleProg === 4){ S.flags['puz_'+m] = true; saveS(); SFX.open(); emote('me','♥');
      say([[P.sys, `✨ 퍼즐 성공! 「${PUZZLES[m].title}」\n${PUZZLES[m].seq.join(' → ')}`],[P.hs,'좋아, 이제 수호자한테 가자!']]); }
  } else {
    puzzleProg = 0; SFX.ng(); shake = 10; floatOver(`✖ ${p.label} — 처음부터!`, '#FF8A80');
  }
}
function drawPlates(ox, oy){
  const m = S.map, done = S.flags['puz_'+m];
  platesFor(m).forEach(p=>{
    const sx = p.x*T+ox, sy = p.y*T+oy, lit = done || p.order < puzzleProg;
    px(lit ? '#FFD54F' : '#9FA8DA', sx+1, sy+2, 14, 12); px(lit ? '#FFF59D' : '#C5CAE9', sx+2, sy+3, 12, 10);
    px(lit ? '#F57F17' : '#3949AB', sx+6, sy+5, 4, 6);
    if (!lit && frame%50<25) px('#FFFFFF', sx+3, sy+4, 1, 1);
  });
}
function drawMemory(ox, oy){
  const mm = MEMORIES[S.map]; if (!mm || S.flags['mem_'+S.map]) return;
  const sx = mm.x*T+ox, sy = mm.y*T+oy, t = frame/6;
  px('rgba(255,255,255,.95)', sx+7, sy+3+Math.sin(t)*2, 2, 2);
  px('rgba(255,182,193,.9)', sx+4+Math.cos(t)*3, sy+8, 2, 2); px('rgba(179,229,252,.9)', sx+10-Math.cos(t)*3, sy+9, 2, 2);
  if (frame%30<15) px('#FFF59D', sx+7, sy+8, 2, 2);
}
// 돌아다니는 주민
function villagerFor(m){ const v = VILLAGER[m]; if (!v) return null; if (!v.pos) v.pos = {x:15, y:5, t:0}; return v; }
function moveVillager(){
  const v = villagerFor(S.map); if (!v || busy) return;
  if (++v.pos.t % 70) return;
  const d = Object.values(DIRS)[Math.floor(Math.random()*4)], nx = v.pos.x+d[0], ny = v.pos.y+d[1];
  if (!solidAt(nx,ny) && !(nx===S.x && ny===S.y) && !platesFor(S.map).some(p=>p.x===nx&&p.y===ny) && tileAt(S.map,nx,ny)!=='G' && nx>0 && nx<21) { v.pos.x = nx; v.pos.y = ny; }
}
function drawVillager(v, sx, sy){
  const b = (frame/12|0)%2;
  px('rgba(0,0,0,.2)', sx+3, sy+13, 10, 2);
  const col = {rbc:['#E53935','#B71C1C'], rbc2:['#EC407A','#AD1457'], spark:['#FFEB3B','#F9A825'], wbc:['#F5F5F5','#BDBDBD'], albumin:['#FFE0B2','#FFB74D'], squirrel:['#A1887F','#6D4C41']}[v.kind];
  px(col[0], sx+2, sy+2-b, 12, 11); px(col[1], sx+5, sy+5-b, 6, 5); px(col[0], sx+6, sy+6-b, 4, 3);
  px('#1C1C1C', sx+5, sy+4-b, 1, 2); px('#1C1C1C', sx+10, sy+4-b, 1, 2);
  if (v.kind==='wbc'){ px('#E53935', sx+7, sy-1-b, 2, 3); px('#E53935', sx+6, sy-b, 4, 1); }
  if (v.kind==='spark' && frame%20<10) px('#FFFFFF', sx+1, sy+1, 2, 2);
  if (v.kind==='squirrel'){ px('#8D6E63', sx+12, sy-2-b, 4, 8); px('#BCAAA4', sx+13, sy-1-b, 2, 5); }
  if (v.kind==='albumin'){ px('#9E9E9E', sx+4, sy+1-b, 8, 2); }
}
// 말풍선 이모트
let emotes = [];
function emote(who, ch){ emotes.push({who, ch, until: frame + 70}); }
function drawEmotes(ox, oy){
  emotes = emotes.filter(e=>e.until > frame);
  emotes.forEach(e=>{
    let x, y; if (e.who==='me'){ x = me.px+ox; y = me.py+oy; } else { const n = MAPS[S.map].npcs.find(n=>n.id===e.who); if (!n) return; x = n.x*T+ox; y = n.y*T+oy; }
    const by = y - 22 - Math.max(0, (e.until-frame-60))*.8;
    px('#FFFFFF', x+3, by, 10, 9); px('#FFFFFF', x+6, by+9, 3, 2); px('#16233A', x+3, by, 10, 1); px('#16233A', x+3, by+8, 10, 1);
    ctx.fillStyle = e.ch==='♥' ? '#E91E63' : e.ch==='!' ? '#E53935' : '#16233A'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign='center'; ctx.fillText(e.ch, x+8, by+7);
  });
}
// 화면 위 글자 (퍼즐 알림)
let floats = [];
function floatOver(text, color){ floats.push({text, color, life: 80}); }
let shake = 0;
async function pickMemory(mm){
  SFX.open(); emote('me','♥');
  await say([[P.sys,'반짝이는 무언가가 있다… ✨'],[P.sys, mm.title]]);
  S.flags['mem_'+S.map] = true; saveS();
  if (typeof showMedia==='function') showMedia(mm.img, mm.title, '추억 앨범에 저장됐어요', '간직하기', 'rare');
  await new Promise(r=>{ const chk = setInterval(()=>{ if (!document.querySelector('#pop.open')){ clearInterval(chk); r(); } }, 200); });
  await say(mm.lines.map(t=>[P.sh2, t]));
  const n = Object.keys(MEMORIES).filter(k=>S.flags['mem_'+k]).length;
  if (n === 6){
    await say([[P.sys,'💞 기억 조각 6개를 모두 모았다!'],[P.sh,'혜선아, 여기까지 다 찾아줘서 고마워.'],[P.sh,'같이 찍은 사진 하나하나가 다 소중해.'],[P.sh2,'시험 끝나면 또 같이 사진 많이 찍자. 사랑해!']]);
    if (typeof toast==='function') toast('💞 히든: 기억 조각 6개 완성!');
  } else {
    await say([[P.sys, `기억 조각 ${n} / 6`]]);
  }
}

/* ================= 언더테일 스타일 배틀 ================= */
// 조이스틱 입력 (배틀·이동 공용)
const JOY = {x:0, y:0, active:false};
const KEYS = {};
function inputVec(){
  let x = JOY.x, y = JOY.y;
  if (KEYS.ArrowLeft) x -= 1; if (KEYS.ArrowRight) x += 1; if (KEYS.ArrowUp) y -= 1; if (KEYS.ArrowDown) y += 1;
  const m = Math.hypot(x,y); if (m > 1){ x /= m; y /= m; }
  return {x, y};
}
const BW = 240, BH = 180;               // 배틀 캔버스
const BOX = {x:50, y:40, w:140, h:110}; // 탄막 상자
// 적별 탄 모양
function drawBullet(g, b){
  const x = b.x|0, y = b.y|0;
  switch(b.look){
    case 'fish': g.fillStyle='#64B5F6'; g.fillRect(x-4,y-2,6,4); g.fillRect(x+2,y-3,2,6); g.fillStyle='#fff'; g.fillRect(x-3,y-1,1,1); break;
    case 'paw': g.fillStyle='#F8BBD0'; g.fillRect(x-2,y-1,5,4); g.fillRect(x-3,y-4,2,2); g.fillRect(x,y-5,2,2); g.fillRect(x+2,y-4,2,2); break;
    case 'bolt': g.fillStyle='#FFEB3B'; g.fillRect(x-1,y-5,3,4); g.fillRect(x-3,y-1,5,2); g.fillRect(x-2,y+1,3,4); break;
    case 'note': g.fillStyle='#CE93D8'; g.fillRect(x-1,y-5,2,8); g.fillRect(x-4,y+1,4,3); g.fillRect(x+1,y-5,3,2); break;
    case 'rbc': g.fillStyle='#E53935'; g.fillRect(x-4,y-3,8,6); g.fillStyle='#B71C1C'; g.fillRect(x-2,y-1,4,2); break;
    case 'bubble': g.strokeStyle='#D1C4E9'; g.lineWidth=1; g.beginPath(); g.arc(x,y,b.r||4,0,7); g.stroke(); g.fillStyle='#fff'; g.fillRect(x-2,y-2,1,1); break;
    case 'dark': g.fillStyle='#AB47BC'; g.fillRect(x-3,y-3,6,6); g.fillStyle='#4A148C'; g.fillRect(x-1,y-1,2,2); break;
    case 'leaf': g.fillStyle='#66BB6A'; g.fillRect(x-3,y-1,6,3); g.fillRect(x-1,y-3,3,7); break;
    case 'pen': g.save(); g.translate(x,y); g.rotate(b.rot||0); g.fillStyle='#E53935'; g.fillRect(-7,-1,11,3); g.fillStyle='#FFCDD2'; g.fillRect(4,-1,3,3); g.fillStyle='#212121'; g.fillRect(7,0,2,1); g.restore(); break;
    case 'F': g.fillStyle='#FF1744'; g.fillRect(x-4,y-5,2,10); g.fillRect(x-4,y-5,8,2); g.fillRect(x-4,y-1,6,2); break;
    case 'paper': g.fillStyle='#FAFAFA'; g.fillRect(x-5,y-6,10,12); g.fillStyle='#90A4AE'; g.fillRect(x-3,y-3,6,1); g.fillRect(x-3,y,6,1); g.fillRect(x-3,y+3,4,1); break;
    case 'omr': g.fillStyle='#212121'; g.beginPath(); g.ellipse(x,y,3,4,0,0,7); g.fill(); break;
    case 'bar': g.fillStyle = b.col || '#FAFAFA'; g.fillRect(b.x, b.y, b.w, b.h); break;
    default: g.fillStyle='#fff'; g.fillRect(x-2,y-2,4,4);
  }
}
// 패턴: (전투상태, 진행시간) → 탄 생성. 난이도 d (1=쉬움 … 4=교수님 최종)
const PAT = {
  rain(B, t, d, look){ if (t % Math.max(4, 16-d*3) === 0) B.bul.push({x: BOX.x+Math.random()*BOX.w, y: BOX.y-6, vx: 0, vy: 0.9+d*0.35, r:3, look}); },
  sides(B, t, d, look){ if (t % Math.max(8, 26-d*4) === 0){ const L = Math.random()<.5; B.bul.push({x: L?BOX.x-6:BOX.x+BOX.w+6, y: BOX.y+8+Math.random()*(BOX.h-16), vx: (L?1:-1)*(1+d*0.4), vy: 0, r:3, look}); } },
  aimed(B, t, d, look){ if (t % Math.max(10, 34-d*6) === 0){ const a = Math.random()*Math.PI*2, sx = B.px + Math.cos(a)*90, sy = B.py + Math.sin(a)*90; const ang = Math.atan2(B.py-sy, B.px-sx), sp = 1.1+d*0.45; B.bul.push({x:sx, y:sy, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, r:3, look, rot:ang}); } },
  ring(B, t, d, look){ if (t % Math.max(30, 70-d*10) === 0){ const cx = BOX.x+BOX.w/2 + (Math.random()-.5)*60, cy = BOX.y-10, n = 8+d*3, off = Math.random(); for (let i=0;i<n;i++){ const a = Math.PI*(i/n)+Math.PI*0.0 + off*0.3; B.bul.push({x:cx, y:cy, vx:Math.cos(a)*(0.8+d*.25), vy:Math.abs(Math.sin(a))*(0.8+d*.25)+.3, r:3, look}); } } },
  spiral(B, t, d, look){ if (t % Math.max(3, 7-d) === 0){ const a = t*0.18*(B.spinDir||1), cx = BOX.x+BOX.w/2, cy = BOX.y+BOX.h/2; for (let k=0;k<(d>=4?3:2);k++){ const aa = a + k*Math.PI*2/(d>=4?3:2); B.bul.push({x:cx+Math.cos(aa)*6, y:cy+Math.sin(aa)*6, vx:Math.cos(aa)*(0.9+d*.2), vy:Math.sin(aa)*(0.9+d*.2), r:3, look, rot:aa, grace:20}); } } },
  walls(B, t, d){ if (t % Math.max(40, 90-d*12) === 0){ const gap = Math.max(26, 46-d*4), gx = BOX.x + 8 + Math.random()*(BOX.w-gap-16), sp = 0.8+d*0.25;
      B.bul.push({type:'bar', x:BOX.x, y:BOX.y-6, w:gx-BOX.x, h:6, vx:0, vy:sp, look:'bar', col:'#B0BEC5'}); B.bul.push({type:'bar', x:gx+gap, y:BOX.y-6, w:BOX.x+BOX.w-(gx+gap), h:6, vx:0, vy:sp, look:'bar', col:'#B0BEC5'}); } },
  laser(B, t, d){ if (t % Math.max(45, 100-d*14) === 0){ const vert = Math.random()<.5, pos = vert ? BOX.x+10+Math.random()*(BOX.w-20) : BOX.y+10+Math.random()*(BOX.h-20), w = 10+d*2;
      B.lasers.push({vert, pos, w, warn: 40-d*4, life: 22}); } },
  bounce(B, t, d, look){ if (t % Math.max(30, 60-d*8) === 0){ B.bul.push({x: BOX.x+Math.random()*BOX.w, y: BOX.y+4, vx:(Math.random()-.5)*3, vy: 1.2+d*.3, r:4, look, bounce: 3}); } },
  homing(B, t, d, look){ if (t % Math.max(40, 80-d*10) === 0){ B.bul.push({x: BOX.x+BOX.w/2, y: BOX.y-8, vx:0, vy:1, r:4, look, home: 90, sp: 0.9+d*0.25}); } }
};
// 적별 탄막 구성
function patternsFor(who, phase){
  const id = who.key;
  if (id==='blue')   return [['rain',1,'fish'],['sides',1,'paw']];
  if (id==='fold')   return [['sides',2,'bolt'],['laser',1]];
  if (id==='flower') return [['ring',2,'note'],['bounce',1,'paw']];
  if (id==='bunny')  return [['walls',2],['rain',2,'rbc']];
  if (id==='dark')   return [['spiral',2,'dark'],['aimed',2,'dark']];
  if (id==='union')  return [['ring',2,'leaf'],['aimed',2,'paw'],['rain',2,'fish']];
  if (id==='prof'){
    if (phase===1) return [['aimed',2,'pen'],['rain',3,'F']];
    if (phase===2) return [['spiral',3,'omr'],['walls',3],['homing',3,'paper']];
    return [['laser',4],['spiral',4,'pen'],['aimed',4,'F'],['ring',3,'omr'],['homing',4,'paper']];
  }
  return [['rain',1]];
}
const PROF_LINES = {
  1: ['그럼 시작해 볼까요?','빨간펜은 아프지 않아요. 피하기만 하면요.'],
  2: ['여기까지 온 학생은 많지 않아요.','심혈관계… 정말 준비됐나요?'],
  3: ['마지막이에요. 집중하세요!','적어도 심혈관계는… 완벽해야죠!']
};
function battle({who, units, hp, myHp, level, title, boss}){
  return new Promise(res=>{
    busy = true; stopBgm(); playBgm(boss ? 'boss' : 'battle');
    let pool = BANK.filter(q=>(q.type==='mc'||q.type==='ox') && (!units || units.includes(q.unit)) && (!level || q.level===level));
    if (pool.length < 10) pool = BANK.filter(q=>(q.type==='mc'||q.type==='ox') && (!units || units.includes(q.unit)));
    const qs = (typeof pick==='function' ? pick(pool) : pool).slice(0, 40);
    const MAXHP = boss ? 24 : 20;
    const B = {who, ehp: hp, maxE: hp, hp: MAXHP, qi: 0, combo: 0, phase: 1, bul: [], lasers: [], px: 0, py: 0, inv: 0, running: false, t: 0, dur: 0, d: 1};
    const root = $('#stbattle');
    root.innerHTML = `
      <div class="bt-flash"></div>
      <div class="ut-top">
        <div class="ut-enemy ${boss?'boss':''}" id="ut-enemy">${who.face ? `<img src="${who.face}" alt="">` : PROF_SVG}</div>
        <div class="ut-name"><b>${title}</b><div class="bt-hp"><i id="ut-ehp"></i></div></div>
      </div>
      <div class="ut-say" id="ut-say"></div>
      <div class="ut-arena"><canvas id="ut-cv" width="${BW}" height="${BH}"></canvas><div class="ut-timer"><i id="ut-tbar"></i></div></div>
      <div class="ut-stat"><span>혜선</span><span>HP</span><div class="ut-hpbar"><i id="ut-hp"></i></div><span id="ut-hptext"></span><button class="bt-snack" id="ut-snack">🐟 <b id="ut-snackn"></b></button><button class="bt-snack" id="ut-hint">💡 <b id="ut-hintn"></b></button></div>
      <div class="ut-panel" id="ut-panel"></div>
      <div class="ut-joy" id="ut-joy"><div class="ut-knob"></div></div>`;
    root.classList.add('open');
    const cvB = $('#ut-cv'), g = cvB.getContext('2d'); g.imageSmoothingEnabled = false;
    bindJoystick($('#ut-joy'));
    const sayE = t => { const e = $('#ut-say'); e.textContent = '* ' + t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); };
    const upd = ()=>{
      $('#ut-ehp').style.width = Math.max(0, B.ehp/B.maxE*100)+'%';
      $('#ut-hp').style.width = Math.max(0, B.hp/MAXHP*100)+'%'; $('#ut-hptext').textContent = `${Math.max(0,B.hp|0)} / ${MAXHP}`;
      $('#ut-snackn').textContent = S.snack; $('#ut-snack').disabled = S.snack<=0 || B.hp>=MAXHP;
      $('#ut-hintn').textContent = S.hint||0;
    };
    $('#ut-snack').onclick = ()=>{ if (S.snack>0 && B.hp<MAXHP){ S.snack--; B.hp = Math.min(MAXHP, B.hp+8); saveS(); SFX.ok(); sayE('간식을 먹었다. HP가 8 회복됐다!'); upd(); } };
    let curQ = null;
    $('#ut-hint').onclick = ()=>{
      if (!curQ || !(S.hint>0) || curQ.type!=='mc' || curQ._hinted) return;
      S.hint--; saveS(); curQ._hinted = true; SFX.blip();
      const btns = [...$('#ut-panel').querySelectorAll('.ut-opt')].filter((b,i)=>i!==curQ.answer && !b.disabled);
      const k = btns[Math.floor(Math.random()*btns.length)]; if (k){ k.disabled = true; k.classList.add('gone'); }
      sayE('냥펀치! 오답 하나가 날아갔다.'); upd();
    };
    // ---- 질문 턴 ----
    function askTurn(){
      if (B.ehp <= 0) return finish(true);
      if (B.qi >= qs.length) return finish(B.ehp <= 0);
      const raw = qs[B.qi++]; const q = typeof withShuffledOptions==='function' ? withShuffledOptions(raw) : raw; curQ = q;
      if (boss) sayE(pick1(PROF_LINES[B.phase])); else sayE(pick1(who.taunt || ['…']));
      const panel = $('#ut-panel'); panel.innerHTML = '';
      const qm = document.createElement('p'); qm.className='ut-qmeta'; qm.textContent = `${B.qi}번째 · ${q.type==='ox'?'OX':'객관식'}${q.level==='hard'?' · 🔥고난도':''} · 맞히면 패스, 틀리면 탄막!`; panel.appendChild(qm);
      const qt = document.createElement('p'); qt.className='ut-q'; qt.textContent = q.q; panel.appendChild(qt);
      const box = document.createElement('div'); box.className = 'ut-opts' + (q.type==='ox'?' ox':''); panel.appendChild(box);
      const labels = q.type==='mc' ? q.options.map((o,i)=>`${'①②③④'[i]} ${o}`) : ['O','X'];
      const vals = q.type==='mc' ? q.options.map((_,i)=>i) : [true,false];
      labels.forEach((l,i)=>{ const b = document.createElement('button'); b.className='ut-opt'; b.textContent = '♥ ' + l; b.onclick = ()=>answer(q, vals[i], b, box, vals); box.appendChild(b); });
      cvB.classList.add('dim'); upd();
    }
    function answer(q, v, btn, box, vals){
      const ok = v === q.answer;
      box.querySelectorAll('button').forEach((b,i)=>{ b.disabled = true; if (vals[i]===q.answer) b.classList.add('ok'); });
      if (!ok) btn.classList.add('no');
      if (typeof bump==='function') bump(q.id, ok);
      if (typeof save!=='undefined'){ if (typeof touchDay==='function') touchDay(); save.today = (save.today||0)+1; if (ok){ save.xp += 10; if (typeof eggTick==='function') eggTick(1); } persist(); }
      const panel = $('#ut-panel');
      const ans = q.type==='mc' ? `${'①②③④'[q.answer]} ${q.options[q.answer]}` : (q.answer?'O':'X');
      const ex = document.createElement('div'); ex.className = 'ut-exp';
      ex.innerHTML = `<b class="${ok?'g':'r'}">${ok?'정답! 이번 턴은 패스!':'오답… 탄막이 온다! 피해!'}</b> 정답: ${ans}<p></p>`;
      ex.querySelector('p').textContent = q.explain || q.answer_text || '';
      if (q.source && q.source.page && typeof openViewer==='function'){ const pb = document.createElement('button'); pb.className='bt-pdf'; pb.textContent=`📄 강의자료 ${q.source.page}쪽`; pb.onclick=()=>openViewer(q); ex.appendChild(pb); }
      const nb = document.createElement('button'); nb.className='bt-next'; ex.appendChild(nb);
      panel.appendChild(ex);
      if (ok){
        SFX.ok(); B.combo++; const dmg = B.combo>=3 ? 2 : 1; B.ehp = Math.max(0, B.ehp - dmg);
        flash('#FFF59D'); $('#ut-enemy').classList.add('hit'); setTimeout(()=>$('#ut-enemy') && $('#ut-enemy').classList.remove('hit'), 450);
        floatT(dmg>1 ? `${B.combo}콤보! -${dmg}` : '-1', '#FFD54F');
        upd();
        // 교수님은 체력 구간이 바뀌면 강제 패턴
        const newPhase = boss ? (B.ehp > B.maxE*2/3 ? 1 : B.ehp > B.maxE/3 ? 2 : 3) : 1;
        if (boss && newPhase > B.phase && B.ehp > 0){ B.phase = newPhase; nb.textContent = `⚠️ 페이즈 ${newPhase}: 강제 탄막!`; nb.onclick = ()=>{ sayE(pick1(PROF_LINES[newPhase])); dodge(boss ? 7 : 5, true); }; }
        else { nb.textContent = B.ehp<=0 ? '🎉 승리!' : '다음 질문 ▶'; nb.onclick = askTurn; }
      } else {
        SFX.ng(); B.combo = 0; flash('#FF8A80');
        nb.textContent = '❤️ 회피 시작!'; nb.onclick = ()=>dodge(boss ? 6 + B.phase : 5, false);
      }
      panel.scrollTop = panel.scrollHeight;
    }
    // ---- 회피 턴 ----
    function dodge(sec, forced){
      $('#ut-panel').innerHTML = `<p class="ut-dodge">${forced ? '⚠️ 교수님의 강제 패턴!' : '❤️ 조이스틱으로 하트를 움직여 피하세요!'}</p>`;
      cvB.classList.remove('dim'); B.bul = []; B.lasers = []; B.t = 0; B.dur = sec*60; B.px = BOX.x+BOX.w/2; B.py = BOX.y+BOX.h/2; B.inv = 0; B.spinDir = Math.random()<.5?1:-1;
      B.pats = patternsFor(who, B.phase); B.running = true; requestAnimationFrame(tick);
    }
    function hitPlayer(dmg){
      if (B.inv > 0) return; B.hp -= dmg; B.inv = 45; SFX.hit(); flash('#FF5252'); root.classList.add('shake'); setTimeout(()=>root.classList.remove('shake'), 250);
      if (navigator.vibrate) try{ navigator.vibrate(40); }catch(e){}
      upd();
    }
    function tick(){
      if (!B.running) return;
      B.t++;
      const v = inputVec(), sp = 1.55; B.px = Math.max(BOX.x+4, Math.min(BOX.x+BOX.w-4, B.px + v.x*sp)); B.py = Math.max(BOX.y+4, Math.min(BOX.y+BOX.h-4, B.py + v.y*sp));
      if (B.inv > 0) B.inv--;
      if (B.t < B.dur - 50) B.pats.forEach(([name, d, look])=>PAT[name](B, B.t, d, look));
      // 탄 이동 · 충돌
      for (const b of B.bul){
        if (b.home && b.home-- > 0){ const a = Math.atan2(B.py-b.y, B.px-b.x); b.vx += Math.cos(a)*0.06; b.vy += Math.sin(a)*0.06; const m = Math.hypot(b.vx,b.vy); if (m > b.sp){ b.vx = b.vx/m*b.sp; b.vy = b.vy/m*b.sp; } }
        b.x += b.vx; b.y += b.vy;
        if (b.bounce && (b.x < BOX.x+3 || b.x > BOX.x+BOX.w-3)){ b.vx *= -1; b.bounce--; }
        if (b.bounce && b.y > BOX.y+BOX.h-3){ b.vy = -Math.abs(b.vy); b.bounce--; }
        if (b.grace) b.grace--;
        const dmg = boss ? 2 + B.phase : 3;
        if (b.look==='bar'){ if (B.px+3 > b.x && B.px-3 < b.x+b.w && B.py+3 > b.y && B.py-3 < b.y+b.h) hitPlayer(dmg); }
        else if (!b.grace && Math.hypot(b.x-B.px, b.y-B.py) < (b.r||3)+2.5) { hitPlayer(dmg); b.dead = true; }
      }
      B.bul = B.bul.filter(b=>!b.dead && b.x > BOX.x-30 && b.x < BOX.x+BOX.w+30 && b.y > BOX.y-40 && b.y < BOX.y+BOX.h+20);
      for (const L of B.lasers){
        if (L.warn > 0) L.warn--; else { L.life--; const inBeam = L.vert ? Math.abs(B.px-L.pos) < L.w/2+2 : Math.abs(B.py-L.pos) < L.w/2+2; if (inBeam) hitPlayer(boss?5:3); }
      }
      B.lasers = B.lasers.filter(L=>L.life > 0);
      drawArena();
      $('#ut-tbar').style.width = Math.max(0, 100 - B.t/B.dur*100) + '%';
      if (B.hp <= 0){ B.running = false; return finish(false); }
      if (B.t >= B.dur){ B.running = false; cvB.classList.add('dim'); const panel = $('#ut-panel'); panel.innerHTML = `<p class="ut-dodge">버텼다! HP ${B.hp|0} / ${MAXHP}</p>`; const nb = document.createElement('button'); nb.className='bt-next'; nb.textContent = B.ehp<=0 ? '🎉 승리!' : '다음 질문 ▶'; nb.onclick = askTurn; panel.appendChild(nb); SFX.blip(); return; }
      requestAnimationFrame(tick);
    }
    function drawArena(){
      g.fillStyle = '#000'; g.fillRect(0,0,BW,BH);
      // 레이저 경고/빔
      for (const L of B.lasers){
        if (L.warn > 0){ g.fillStyle = (L.warn%8<4) ? 'rgba(255,255,255,.35)' : 'rgba(255,82,82,.35)'; if (L.vert) g.fillRect(L.pos-L.w/2, BOX.y, L.w, BOX.h); else g.fillRect(BOX.x, L.pos-L.w/2, BOX.w, L.w); }
        else { g.fillStyle = '#FFFFFF'; if (L.vert) g.fillRect(L.pos-L.w/2, BOX.y, L.w, BOX.h); else g.fillRect(BOX.x, L.pos-L.w/2, BOX.w, L.w); g.fillStyle='rgba(255,82,82,.6)'; if (L.vert) g.fillRect(L.pos-L.w/2-2, BOX.y, L.w+4, BOX.h); else g.fillRect(BOX.x, L.pos-L.w/2-2, BOX.w, L.w+4); }
      }
      g.save(); g.beginPath(); g.rect(BOX.x, BOX.y, BOX.w, BOX.h); g.clip();
      for (const b of B.bul) drawBullet(g, b);
      g.restore();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.strokeRect(BOX.x-1.5, BOX.y-1.5, BOX.w+3, BOX.h+3);
      // 하트(영혼)
      if (!(B.inv > 0 && (B.inv>>2)%2)){ const x = B.px|0, y = B.py|0; g.fillStyle = '#FF1744';
        g.fillRect(x-4,y-3,3,2); g.fillRect(x+1,y-3,3,2); g.fillRect(x-4,y-1,8,2); g.fillRect(x-3,y+1,6,1); g.fillRect(x-2,y+2,4,1); g.fillRect(x-1,y+3,2,1); }
    }
    function flash(c){ const f = root.querySelector('.bt-flash'); f.style.background = c; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
    function floatT(t, c){ const f = document.createElement('div'); f.className = 'bt-float enemy'; f.textContent = t; f.style.color = c; root.appendChild(f); setTimeout(()=>f.remove(), 1100); }
    function finish(win){
      B.running = false; stopBgm(); win ? SFX.win() : SFX.ng();
      $('#ut-panel').innerHTML = `<div class="bt-end"><div class="bt-big">${win ? '🏆 승리!' : '💔 쓰러졌다…'}</div><p>${win ? `${who.name}을(를) 이겼다!` : '하지만 혜선이는 포기하지 않는다. 해설을 다시 보고 결의를 다지자!'}</p><button class="bt-next" id="bt-close">${win ? '계속하기' : '다시 일어나기'}</button></div>`;
      if (win) for (let i=0;i<24;i++){ const c = document.createElement('i'); c.className='bt-conf'; c.style.left = rnd(0,100)+'%'; c.style.background = ['#FFD54F','#FF5C8A','#64B5F6','#81C784'][i%4]; c.style.animationDelay = rnd(0,.6)+'s'; root.appendChild(c); }
      $('#bt-close').onclick = ()=>{ root.classList.remove('open'); root.innerHTML=''; busy = false; playBgm(S.map); res(win); };
    }
    upd(); askTurn();
  });
}
const pick1 = a => a[Math.floor(Math.random()*a.length)];
const PROF_SVG = `<svg viewBox="0 0 32 32" class="ut-prof" aria-label="신정은 교수님"><rect width="32" height="32" fill="#2B1B54"/><rect x="7" y="5" width="18" height="17" fill="#141414"/><rect x="6" y="10" width="4" height="13" fill="#141414"/><rect x="22" y="10" width="4" height="13" fill="#141414"/><rect x="10" y="9" width="12" height="12" fill="#F2C6A0"/><rect x="9" y="7" width="14" height="4" fill="#141414"/><rect x="12" y="13" width="2" height="1" fill="#2B2B2B"/><rect x="18" y="13" width="2" height="1" fill="#2B2B2B"/><rect x="14" y="17" width="4" height="1" fill="#C26A5A"/><rect x="13" y="16" width="1" height="1" fill="#C26A5A"/><rect x="18" y="16" width="1" height="1" fill="#C26A5A"/><rect x="7" y="23" width="18" height="9" fill="#151515"/><rect x="13" y="23" width="6" height="2" fill="#F2C6A0"/><rect x="24" y="24" width="6" height="7" fill="#1565C0"/><rect x="25" y="25" width="4" height="5" fill="#FAFAFA"/></svg>`;

/* 조이스틱 (화면 위 원형 스틱) */
function bindJoystick(el){
  if (!el || el._bound) return; el._bound = true;
  const knob = el.querySelector('.ut-knob'); let id = null;
  const setFrom = (e)=>{ const r = el.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2, R = r.width/2 - 14;
    let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx,dy); if (m > R){ dx = dx/m*R; dy = dy/m*R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`; JOY.x = dx/R; JOY.y = dy/R; JOY.active = true; };
  el.addEventListener('pointerdown', e=>{ e.preventDefault(); id = e.pointerId; el.setPointerCapture(id); setFrom(e); ac(); });
  el.addEventListener('pointermove', e=>{ if (e.pointerId===id) setFrom(e); });
  const end = e=>{ if (e.pointerId!==id) return; id = null; JOY.x = 0; JOY.y = 0; JOY.active = false; knob.style.transform = ''; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}

/* ---------------- 루프 / 입력 ---------------- */
function loop(t){
  if (!running) return;
  if (t - last >= 1000/60 - 2){ last = t; update(); render(); }
  requestAnimationFrame(loop);
}
function resize(){
  const wrap = $('#stwrap'); const w = wrap.clientWidth;
  const scale = w / (VW*T);
  cv.style.width = (VW*T*scale)+'px'; cv.style.height = (VH*T*scale)+'px';
}
function openStory(){
  show('story');
  if (!cv){ cv = $('#stcanvas'); cv.width = VW*T; cv.height = VH*T; ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false; }
  me.px = S.x*T; me.py = S.y*T; me.moving = false; busy = false;
  resize(); running = true; requestAnimationFrame(loop); showMapName(); showTitle();
  updateBadges();
}
function showTitle(){
  const t = $('#sttitle'); busy = true; t.classList.add('open');
  $('#sttcont').textContent = S.started ? '▶ 이어하기' : '▶ 시작하기';
  $('#sttsound').textContent = S.mute ? '🔇 소리 꺼짐' : '🔊 소리 켜짐';
  $('#sttcont').onclick = ()=>{ ac(); t.classList.remove('open'); busy = false; playBgm(S.map); SFX.open();
    if (!S.started){ S.started = true; saveS(); setTimeout(()=>say([[P.sys,'~ 혜선이의 형성평가 대모험 ~'],[P.sys,'방 안에 성호가 있다. 조이스틱으로 다가가서 A 버튼으로 말을 걸어 보자.']]), 300); } };
  $('#sttnew').onclick = ()=>{ if (confirm('처음부터 새로 시작할까요? (퀴즈 기록은 그대로예요)')){ S = {map:'room', x:3, y:4, dir:'down', flags:{}, snack:1, hint:2, started:false, mute:S.mute}; saveS(); me.px=S.x*T; me.py=S.y*T; $('#sttcont').textContent='▶ 시작하기'; } };
  $('#sttsound').onclick = ()=>{ S.mute = !S.mute; saveS(); $('#sttsound').textContent = S.mute ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'; if (S.mute) stopBgm(); };
}
function updateBadges(){
  const b = $('#stbadges'); if (!b) return;
  const icons = ['💗','⚡','🥁','🩸','🫧','🌲'];
  b.textContent = TOWNS.map((t,i)=>S.flags['win_'+t.guard] ? icons[i] : '·').join(' ') + (S.flags.cleared ? ' 🎓' : '') + `   🐟${S.snack}`;
}
setInterval(()=>{ if (running) updateBadges(); }, 1000);
function closeStory(){ running = false; held = null; stopBgm(); saveS(); show('home'); if (typeof renderHome==='function') renderHome(); }
function bind(){
  const ob = $('#openStory'); if (ob) ob.onclick = openStory;
  $('#stback').onclick = closeStory;
  $('#streset').onclick = ()=>showTitle();
  bindJoystick($('#st-joy'));
  $('#sta').addEventListener('pointerdown', e=>{ e.preventDefault(); if ($('#stdlg').classList.contains('open')) { advance && advance(); } else interact(); });
  addEventListener('keydown', e=>{
    if (!running) return;
    if (e.key.startsWith('Arrow')){ e.preventDefault(); KEYS[e.key] = true; }
    if (e.key===' '||e.key==='Enter'||e.key==='z'){ e.preventDefault(); if ($('#stbattle').classList.contains('open')) return; if ($('#stdlg').classList.contains('open')) advance && advance(); else interact(); }
  });
  addEventListener('keyup', e=>{ if (e.key.startsWith('Arrow')) KEYS[e.key] = false; });
  addEventListener('resize', ()=>{ if (running) resize(); });
}
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
window.__story = {talk:id=>talk(id), state:()=>S, set:(k,v)=>{S[k]=v;}, open:openStory};
})();
