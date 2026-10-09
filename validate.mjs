// 문제은행 검사: node scripts/validate.mjs
// 형식, 중복, 정답 인덱스, 출처 페이지(문서 쪽수 범위 안인지)를 확인합니다.
import fs from 'node:fs';
const PAGES = { heart: 43, vessel: 65 };
const TYPES = ['mc', 'ox', 'short', 'card'];
const { questions } = JSON.parse(fs.readFileSync(new URL('../data/questions.json', import.meta.url)));
const errs = [], warns = [], ids = new Set(), texts = new Map();
// source/*.md 가 있으면(로컬에서 extract.py 실행 후) 형광펜 문구가 실제 그 쪽에 있는지도 검사
const pageText = {};
for (const doc of Object.keys(PAGES)) {
  const f = new URL(`../source/${doc}.md`, import.meta.url);
  if (!fs.existsSync(f)) continue;
  const parts = fs.readFileSync(f, 'utf8').split(/\n## p\.(\d+)\n/);
  pageText[doc] = {};
  for (let i = 1; i < parts.length; i += 2) pageText[doc][+parts[i]] = parts[i + 1].replace(/\s+/g, '');
}
const DETAIL_KEYS = ['concept', 'why', 'wrong', 'page_note', 'tip'];
const norm = s => s.replace(/\s+/g, '').toLowerCase();
for (const q of questions) {
  const where = q.id || JSON.stringify(q).slice(0, 60);
  if (!q.id) errs.push(`${where}: id 없음`);
  if (ids.has(q.id)) errs.push(`${where}: id 중복`); ids.add(q.id);
  if (!['heart', 'vessel'].includes(q.topic)) errs.push(`${where}: topic은 heart/vessel`);
  if (!TYPES.includes(q.type)) errs.push(`${where}: type은 ${TYPES.join('/')}`);
  if (!q.q || q.q.length < 5) errs.push(`${where}: 문제 문장 없음`);
  const t = norm(q.q || ''); if (texts.has(t)) errs.push(`${where}: ${texts.get(t)}와 문제 문장 중복`); texts.set(t, q.id);
  const s = q.source || {};
  if (s.doc !== q.topic) errs.push(`${where}: source.doc은 topic과 같아야 함`);
  if (!Number.isInteger(s.page) || s.page < 1 || s.page > (PAGES[s.doc] || 0)) errs.push(`${where}: source.page가 1~${PAGES[s.doc]} 범위 밖`);
  if (q.type === 'mc') {
    if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(`${where}: 보기는 4개`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errs.push(`${where}: answer는 0~3`);
    if (new Set(q.options || []).size !== (q.options || []).length) errs.push(`${where}: 보기 중복`);
    if (!q.explain) errs.push(`${where}: explain 없음`);
  }
  if (q.type === 'ox') { if (typeof q.answer !== 'boolean') errs.push(`${where}: OX answer는 true/false`); if (!q.explain) errs.push(`${where}: explain 없음`); }
  if (q.type === 'short') { if (!Array.isArray(q.accept) || !q.accept.length) errs.push(`${where}: accept 배열 필요`); if (!q.answer_text) errs.push(`${where}: answer_text 없음`); }
  if (q.type === 'card' && !q.answer_text) errs.push(`${where}: answer_text 없음`);
  if (q.detail !== undefined) {
    if (typeof q.detail !== 'object') errs.push(`${where}: detail은 객체`);
    else for (const k of Object.keys(q.detail)) if (!DETAIL_KEYS.includes(k)) errs.push(`${where}: detail에 모르는 키 ${k}`);
  }
  if (q.highlight !== undefined) {
    if (!Array.isArray(q.highlight)) errs.push(`${where}: highlight는 배열`);
    else if (pageText[s.doc] && pageText[s.doc][s.page] !== undefined)
      for (const h of q.highlight) if (!pageText[s.doc][s.page].includes(h.replace(/\s+/g, ''))) errs.push(`${where}: 형광펜 문구 "${h}"가 ${s.doc} ${s.page}쪽에 없음`);
  }
  if (!q.detail) warns.push(q.id);
}
const count = t => questions.filter(q => q.type === t).length;
console.log(`총 ${questions.length}문제 (객관식 ${count('mc')}, OX ${count('ox')}, 단답 ${count('short')}, 서술 ${count('card')})`);
console.log(`자세한 해설 있음 ${questions.length - warns.length} / ${questions.length}` + (Object.keys(pageText).length ? '' : ' (source/ 없음: 형광펜 문구 위치 검사는 건너뜀)'));
if (errs.length) { console.error(`오류 ${errs.length}개:\n- ` + errs.join('\n- ')); process.exit(1); }
console.log('검사 통과');
