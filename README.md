# 심혈관 퀴즈 🫀

기초간호과학I 심장·혈관 강의자료로 만든 모바일 퀴즈 사이트입니다.
로그인 없이, 어떤 기기에서든 주소만 열면 바로 풀 수 있어요.

- 빠른 10문제 / 심장만 / 혈관만 / 60초 타임어택 / 생존 모드 / 오답 복습 / 서술형 카드
- 레벨·XP·연속 정답·연속 학습일 (기록은 각자 기기 브라우저에 저장)
- 모르는 문제는 **강의자료의 해당 페이지를 바로 열어서** 관련 문구를 노란 형광펜으로 칠하고 그 위치로 이동, 자세한 해설(핵심 개념·정답 이유·헷갈리는 포인트·볼 곳·외우는 팁)과 함께 보여줌
- 홈 화면에 추가하면 앱처럼 실행
- 응원 사진: 연속 정답(3·6·10·15·20개)이면 `assets/good.jpg`, 연달아 2번 틀리면 `assets/cheer.jpg`가 응원 문구와 함께 뜸
  (사진끼리 최소 4문제 간격, 타임어택은 사진 뜨는 동안 시간 멈춤). 문구·횟수는 `app.js` 맨 위 `CHEER`에서 수정

---

## 1. 사이트 올리기 (GitHub Pages)

1. GitHub에서 새 저장소 만들기 (예: `cardio-quiz`, **Public**)
2. 이 폴더의 파일을 전부 올리기 (`pdfs/`, `source/` 폴더는 올리지 않음 — .gitignore에 이미 막혀 있음)
3. 저장소 **Settings → Pages** → Source를 `Deploy from a branch`, 브랜치 `main` / 폴더 `/ (root)`로 저장
4. 1~2분 뒤 `https://<아이디>.github.io/cardio-quiz/` 에서 열림 → 이 주소를 공유

> 저장소와 사이트가 공개라서 **주소를 아는 사람은 누구나 사진을 볼 수 있어요.** 주소는 둘만 알고 있기를 추천해요.

## 2. 강의자료 보기 기능

강의자료 PDF는 교수님 저작물이라 **저장소에 올리지 않습니다.**
대신 사이트 홈 아래 **"강의자료 PDF 불러오기"**에서 각자 기기에 한 번만 불러오면,
그 브라우저 안에만 저장되고 문제마다 해당 쪽으로 바로 이동해서 보여줍니다.
(런어스 원본 파일 기준 쪽 번호. 휴대폰을 가로로 돌리면 슬라이드가 크게 보여요.)

## 3. Claude Code로 문제 계속 늘리기

모든 문제는 두 PDF에서만 나오도록 `CLAUDE.md`에 규칙이 적혀 있고,
Claude Code가 이 규칙을 읽고 문제를 만들어 `data/questions.json`에 추가합니다.
push하면 사이트에 자동 반영돼요.

### 처음 한 번
```bash
git clone https://github.com/<아이디>/cardio-quiz.git
cd cardio-quiz
# 강의자료를 이 이름으로 복사 (이 폴더는 깃에 올라가지 않음)
#   pdfs/heart.pdf   ← 3주차_심장 PDF
#   pdfs/vessel.pdf  ← 5-6주차_혈관 PDF
pip install pymupdf
python scripts/extract.py      # source/ 에 쪽별 텍스트와 그림 페이지 이미지 생성
```
Claude Code 설치: https://docs.claude.com/en/docs/claude-code/overview

### 문제 만들기
```bash
claude
```
Claude Code 안에서:
```
/check                    # 처음 한 번: 기존 문제의 정답·출처 쪽 번호 검수
/generate 30 vessel mix   # 혈관에서 30문제, 유형 섞어서
/generate 20 heart ox     # 심장 OX 20문제
/explain 40               # 해설이 짧은 문제 40개에 자세한 해설 + PDF 형광펜 채우기 (전부 될 때까지 반복)
```
끝나면 "커밋하고 push해줘"라고 하면 됩니다.

### 직접 검사
```bash
node scripts/validate.mjs
```

---

## 파일 구조
```
index.html, style.css, app.js   사이트
data/questions.json             문제은행 (사이트가 읽는 유일한 데이터)
CLAUDE.md                       Claude Code 규칙 (출처는 두 PDF뿐)
.claude/commands/generate.md    /generate 명령
.claude/commands/check.md       /check 명령
scripts/extract.py              PDF → source/*.md, source/pages/*.png
scripts/validate.mjs            문제 형식·출처 쪽 검사
pdfs/, source/                  강의자료 (로컬 전용, 깃 제외)
```
