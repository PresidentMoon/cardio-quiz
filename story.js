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
  dark: {name:'흑화 성호', face:'bad4.jpg'},
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
let S = Object.assign({map:'room', x:3, y:4, dir:'down', flags:{}, snack:1, started:false}, store.get()||{});
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
function drawProf(x, y, dir){                 // 교수님: 단발, 안경, 흰 가운, 책
  px('rgba(0,0,0,.25)', x+2, y+14, 12, 2);
  px('#455A64', x+5, y+11, 2, 4); px('#455A64', x+9, y+11, 2, 4);
  px('#FFFFFF', x+3, y+4, 10, 9); px('#E0E0E0', x+7, y+4, 2, 9); px('#B0BEC5', x+3, y+12, 10, 1);
  px('#F2C6A0', x+4, y-3, 8, 8);
  px('#3E2723', x+3, y-5, 10, 4); px('#3E2723', x+3, y-2, 2, 6); px('#3E2723', x+11, y-2, 2, 6);
  px('#263238', x+4, y-1, 3, 2); px('#263238', x+9, y-1, 3, 2); px('#263238', x+7, y-1, 2, 1);
  px('#BBDEFB', x+5, y-1, 1, 1); px('#BBDEFB', x+10, y-1, 1, 1); px('#C26A5A', x+7, y+2, 2, 1);
  px('#1565C0', x+11, y+6, 4, 5); px('#FFFFFF', x+12, y+7, 2, 3);       // 책
  if (frame%50<25) px('rgba(255,235,59,.5)', x, y-8, 1, 1), px('rgba(255,235,59,.5)', x+15, y-6, 1, 1);
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
  // 캐릭터 (y 순서)
  const ents = m.npcs.map(n=>({y:n.y*T, draw:()=>drawNpc(n, n.x*T+ox, n.y*T+oy)}));
  ents.push({y:me.py, draw:()=>drawGirl(me.px+ox, me.py+oy, S.dir, me.moving ? (me.step%2)+1 : 0)});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
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
  if (solidAt(nx, ny)){ bumpWall(); return; }
  me.moving = true; me.from = {x:S.x, y:S.y}; me.to = {x:nx, y:ny}; me.t = 0;
}
let bumpCool = 0;
function bumpWall(){ if (bumpCool>0) return; bumpCool = 12; }
function warp(w){
  fadeDir = 1; busy = true;
  onFadeMid = ()=>{ S.map = w.to; S.x = w.tx; S.y = w.ty; S.dir = w.dir || S.dir; me.px = S.x*T; me.py = S.y*T; saveS(); showMapName(); busy = false; mapEnter(); };
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
  } else { me.px = S.x*T; me.py = S.y*T; if (held && !busy) tryMove(held); }
}
function onStep(){}
function front(){ const [dx,dy] = DIRS[S.dir]; return {x:S.x+dx, y:S.y+dy}; }
function interact(){
  if (busy || me.moving) return;
  const f = front(), m = MAPS[S.map];
  const n = m.npcs.find(n=>n.x===f.x && n.y===f.y);
  if (n){ n.dir = ({up:'down',down:'up',left:'right',right:'left'})[S.dir]; return talk(n.id); }
  const sg = m.signs.find(s=>s.x===f.x && s.y===f.y); if (sg) return say([[P.sys, sg.text]]);
  const ch = m.chests.find(c=>c.x===f.x && c.y===f.y); if (ch) return openChest(ch);
  const c = tileAt(S.map, f.x, f.y);
  if (c==='K') return say([[P.hs,'(강의자료다. 퀴즈가 16일 금요일이니까… 오늘도 조금만 더 보자!)']]);
  if (c==='B') return say([[P.hs,'(침대… 퀴즈 끝나고 푹 자야지.)']]);
}
function openChest(ch){
  if (S.flags['chest_'+ch.id]) return say([[P.sys,'빈 상자다.']]);
  S.flags['chest_'+ch.id] = true; S.snack += ch.n; saveS();
  say([[P.sys,`보물상자를 열었다!\n🐟 간식 ${ch.n}개를 얻었다. (배틀 중 하트 1 회복)`]]);
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
async function guardian(id, who, units, hp, myHp, topic, intro, outro){
  if (S.flags['win_'+id]){ await say([[who, '이미 인정했다냥! 다른 수호자를 찾아가라냥.'.replace('냥', id==='dark'?'':'냥')]]); return; }
  await say(intro.map(t=>[who,t]));
  const c = await choose(`${who.name}과(와) 퀴즈 배틀을 할까? (범위: ${topic})`, ['⚔️ 배틀 시작!','조금 더 공부하고 올게']);
  if (c===1){ await say([[who,'언제든 다시 오라냥.']]); return; }
  const win = await battle({who, units, hp, myHp, level:null, title: who.name});
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
  const win = await battle({who:P.prof, units:null, hp:7, myHp:5, level:'hard', title:'최종 시험: 신정은 교수님', boss:true});
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

/* ---------------- 퀴즈 배틀 ---------------- */
function battle({who, units, hp, myHp, level, title, boss}){
  return new Promise(res=>{
    busy = true;
    let pool = BANK.filter(q=>(q.type==='mc'||q.type==='ox') && (!units || units.includes(q.unit)) && (!level || q.level===level));
    if (pool.length < 10) pool = BANK.filter(q=>(q.type==='mc'||q.type==='ox') && (!units || units.includes(q.unit)));
    const qs = (typeof pick==='function' ? pick(pool) : pool).slice(0, 30);
    let ehp = hp, mhp = myHp, qi = 0, combo = 0;
    const B = $('#stbattle');
    B.innerHTML = `
      <div class="bt-flash"></div>
      <div class="bt-top">
        <div class="bt-enemy ${boss?'boss':''}">
          <div class="bt-portrait">${who.face ? `<img src="${who.face}" alt="">` : '<span>👩‍🏫</span>'}</div>
          <div class="bt-info"><b>${title}</b><div class="bt-hp"><i id="bt-ehp"></i></div><small id="bt-ehptext"></small></div>
        </div>
      </div>
      <div class="bt-me"><span>혜선</span><span id="bt-hearts"></span><button id="bt-snack" class="bt-snack">🐟 간식 <b id="bt-snackn"></b></button></div>
      <div class="bt-q"><p class="bt-qmeta" id="bt-meta"></p><p class="bt-qtext" id="bt-qtext"></p><div class="bt-opts" id="bt-opts"></div><div class="bt-exp" id="bt-exp"></div></div>`;
    B.classList.add('open'); flash('#fff');
    const upd = ()=>{
      $('#bt-ehp').style.width = (ehp/hp*100)+'%'; $('#bt-ehptext').textContent = `HP ${ehp} / ${hp}`;
      $('#bt-hearts').textContent = '❤️'.repeat(mhp) + '🤍'.repeat(Math.max(0,myHp-mhp));
      $('#bt-snackn').textContent = S.snack; $('#bt-snack').disabled = S.snack<=0 || mhp>=myHp;
    };
    $('#bt-snack').onclick = ()=>{ if (S.snack>0 && mhp<myHp){ S.snack--; mhp++; saveS(); upd(); floatText('+1 ❤️', '#FF5C8A', 'me'); } };
    function floatText(t, col, where){ const f = document.createElement('div'); f.className='bt-float '+where; f.textContent=t; f.style.color=col; B.appendChild(f); setTimeout(()=>f.remove(), 1100); }
    function flash(col){ const f = B.querySelector('.bt-flash'); f.style.background = col; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
    function ask(){
      if (ehp<=0) return end(true);
      if (mhp<=0) return end(false);
      if (qi >= qs.length){ return end(ehp<=0); }
      const q = typeof withShuffledOptions==='function' ? withShuffledOptions(qs[qi++]) : qs[qi++];
      $('#bt-meta').textContent = `${qi}번째 문제 · ${q.type==='ox'?'OX':'객관식'}${q.level==='hard'?' · 🔥고난도':''}`;
      $('#bt-qtext').textContent = q.q; $('#bt-exp').innerHTML = ''; $('#bt-exp').classList.remove('show');
      const box = $('#bt-opts'); box.innerHTML = ''; box.className = 'bt-opts' + (q.type==='ox' ? ' ox' : '');
      const labels = q.type==='mc' ? q.options.map((o,i)=>`${'①②③④'[i]} ${o}`) : ['O','X'];
      const vals = q.type==='mc' ? q.options.map((_,i)=>i) : [true,false];
      labels.forEach((l,i)=>{ const b = document.createElement('button'); b.textContent = l; b.onclick = ()=>answer(q, vals[i], b, box, vals); box.appendChild(b); });
      upd();
    }
    function answer(q, v, btn, box, vals){
      const ok = v === q.answer;
      box.querySelectorAll('button').forEach((b,i)=>{ b.disabled = true; if (vals[i]===q.answer) b.classList.add('ok'); });
      if (!ok) btn.classList.add('no');
      if (typeof bump==='function') bump(q.id, ok);
      if (typeof save!=='undefined'){ touchDay && touchDay(); save.today = (save.today||0)+1; if (ok){ save.xp += 10; eggTick && eggTick(1); } persist(); }
      if (ok){ combo++; const dmg = combo>=3 ? 2 : 1; ehp = Math.max(0, ehp-dmg); flash('#FFF59D'); B.querySelector('.bt-enemy').classList.add('hit'); setTimeout(()=>B.querySelector('.bt-enemy').classList.remove('hit'), 400);
        floatText(dmg>1 ? `${combo}콤보! -${dmg}` : '정답! -1', '#FFD54F', 'enemy'); }
      else { combo = 0; mhp--; flash('#FF8A80'); B.classList.add('shake'); setTimeout(()=>B.classList.remove('shake'), 400); floatText('-1 ❤️', '#FF5252', 'me'); }
      upd();
      const exp = $('#bt-exp');
      const ans = q.type==='mc' ? `${'①②③④'[q.answer]} ${q.options[q.answer]}` : (q.answer?'O':'X');
      exp.innerHTML = `<b class="${ok?'g':'r'}">${ok?'정답!':'오답…'}</b> 정답: ${ans}<p></p>`;
      exp.querySelector('p').textContent = q.explain || '';
      const nb = document.createElement('button'); nb.className='bt-next';
      nb.textContent = (ehp<=0) ? '🎉 승리!' : (mhp<=0) ? '결과 보기' : '다음 문제 ▶';
      nb.onclick = ask; exp.appendChild(nb);
      if (q.source && q.source.page && typeof openViewer==='function'){ const pb = document.createElement('button'); pb.className='bt-pdf'; pb.textContent=`📄 강의자료 ${q.source.page}쪽`; pb.onclick=()=>openViewer(q); exp.appendChild(pb); }
      exp.classList.add('show');
    }
    function end(win){
      B.querySelector('.bt-q').innerHTML = `<div class="bt-end"><div class="bt-big">${win ? '🏆 승리!' : '💫 패배…'}</div><p>${win ? `${who.name}을(를) 이겼다!` : '하트가 모두 떨어졌다. 해설을 보고 다시 도전하자!'}</p><button class="bt-next" id="bt-close">${win ? '계속하기' : '돌아가기'}</button></div>`;
      if (win) for (let i=0;i<24;i++){ const c = document.createElement('i'); c.className='bt-conf'; c.style.left = rnd(0,100)+'%'; c.style.background = ['#FFD54F','#FF5C8A','#64B5F6','#81C784'][i%4]; c.style.animationDelay = rnd(0,.6)+'s'; B.appendChild(c); }
      $('#bt-close').onclick = ()=>{ B.classList.remove('open'); B.innerHTML=''; busy = false; res(win); };
    }
    ask();
  });
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
  resize(); running = true; requestAnimationFrame(loop); showMapName();
  updateBadges();
  if (!S.started){ S.started = true; saveS(); setTimeout(()=>say([[P.sys,'~ 혜선이의 형성평가 대모험 ~'],[P.sys,'방 안에 성호가 있다. A 버튼으로 말을 걸어 보자.']]), 400); }
}
function updateBadges(){
  const b = $('#stbadges'); if (!b) return;
  const icons = ['💗','⚡','🥁','🩸','🫧','🌲'];
  b.textContent = TOWNS.map((t,i)=>S.flags['win_'+t.guard] ? icons[i] : '·').join(' ') + (S.flags.cleared ? ' 🎓' : '') + `   🐟${S.snack}`;
}
setInterval(()=>{ if (running) updateBadges(); }, 1000);
function closeStory(){ running = false; held = null; saveS(); show('home'); if (typeof renderHome==='function') renderHome(); }
function bind(){
  const ob = $('#openStory'); if (ob) ob.onclick = openStory;
  $('#stback').onclick = closeStory;
  $('#streset').onclick = ()=>{ if (confirm('스토리를 처음부터 다시 할까요? (퀴즈 기록은 그대로예요)')){ S = {map:'room', x:3, y:4, dir:'down', flags:{}, snack:1, started:false}; saveS(); openStory(); } };
  document.querySelectorAll('.stpad [data-d]').forEach(b=>{
    const d = b.dataset.d;
    b.addEventListener('pointerdown', e=>{ e.preventDefault(); held = d; tryMove(d); b.classList.add('on'); });
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev, ()=>{ if (held===d) held = null; b.classList.remove('on'); }));
  });
  $('#sta').addEventListener('pointerdown', e=>{ e.preventDefault(); if ($('#stdlg').classList.contains('open')) { advance && advance(); } else interact(); });
  addEventListener('keydown', e=>{
    if (!running) return;
    const k = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];
    if (k){ e.preventDefault(); held = k; tryMove(k); }
    if (e.key===' '||e.key==='Enter'||e.key==='z'){ e.preventDefault(); if ($('#stbattle').classList.contains('open')) return; if ($('#stdlg').classList.contains('open')) advance && advance(); else interact(); }
  });
  addEventListener('keyup', e=>{ const k = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key]; if (k && held===k) held = null; });
  addEventListener('resize', ()=>{ if (running) resize(); });
}
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
window.__story = {talk:id=>talk(id), state:()=>S, set:(k,v)=>{S[k]=v;}, open:openStory};
})();
