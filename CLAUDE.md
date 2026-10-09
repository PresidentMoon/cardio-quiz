# 심혈관 퀴즈 (기초간호과학I)

GitHub Pages로 배포되는 정적 퀴즈 사이트. 서버 없음. 문제는 `data/questions.json` 하나에 들어 있고,
사이트(`index.html`, `app.js`, `style.css`)는 이 파일을 읽어서 게임처럼 보여준다.

## 가장 중요한 규칙: 출처는 강의자료 두 개뿐
- 문제·정답·해설의 모든 내용은 `source/heart.md`(3주차 심장, 43쪽)와 `source/vessel.md`(5–6주차 혈관, 65쪽)에
  **실제로 적혀 있는 내용**에서만 만든다. 일반 의학 지식, 다른 교재, 인터넷 지식으로 보충하지 않는다.
- 그림 위주 페이지는 `source/pages/<doc>-<쪽>.png`를 직접 열어서 확인한다.
- 강의자료에 근거를 찾을 수 없는 문제는 만들지 않는다. 애매하면 버린다.
- 모든 문제에 근거 페이지 `source: {"doc": "heart"|"vessel", "page": <PDF 쪽 번호>}`를 반드시 단다.
  쪽 번호는 PDF 파일의 실제 쪽(1부터)이고, 사이트에서 이 쪽을 바로 열어 보여주므로 정확해야 한다.
- 용어는 강의자료 표기를 따른다(예: 굴심방결절, 방실결절, 꼭지근, 힘줄끈, 숨뇌). 괄호 속 다른 이름도 함께 써도 된다.
- `source/`와 `pdfs/`는 교수님 저작물이라 .gitignore 되어 있다. 절대 커밋하거나 문제 해설에 긴 원문을 그대로 붙여넣지 않는다.

## 문제 형식 (data/questions.json → questions 배열)
```json
{"id":"h-gen-0001","topic":"heart","type":"mc","q":"문제","options":["보기1","보기2","보기3","보기4"],"answer":2,"explain":"왜 정답인지 + 오답 포인트","source":{"doc":"heart","page":19},"origin":"claude"}
{"id":"v-gen-0001","topic":"vessel","type":"ox","q":"진술문","answer":false,"explain":"...","source":{"doc":"vessel","page":26},"origin":"claude"}
{"id":"h-gen-0002","topic":"heart","type":"short","q":"문제","accept":["정답","동의어","영문"],"answer_text":"모범답안","source":{"doc":"heart","page":13},"origin":"claude"}
{"id":"v-gen-0002","topic":"vessel","type":"card","q":"서술형 문제","answer_text":"모범답안(줄바꿈 \\n 가능)","source":{"doc":"vessel","page":38},"origin":"claude"}
```
- topic과 source.doc은 같아야 한다. mc 보기는 정확히 4개, answer는 0~3.
- id는 기존과 겹치지 않게 `h-gen-` / `v-gen-` + 4자리 번호로 이어서 붙인다.
- short의 accept에는 강의자료에 나온 한글명, 다른 한글명, 영문명을 모두 넣는다(띄어쓰기는 채점 시 무시됨).

## 자세한 해설과 형광펜 (선택 필드, 모든 유형 공통)
```json
"detail": {"concept":"핵심 개념","why":"정답 이유","wrong":"헷갈리는 포인트","page_note":"그 쪽 어디를 볼지","tip":"외우는 팁"},
"highlight": ["source/<doc>.md 해당 쪽 원문에서 그대로 복사한 문구", "..."]
```
- 사이트에서 틀리면 detail이 자동으로 펼쳐지고, 강의자료 보기를 누르면 그 쪽이 열리면서 highlight 문구가 노란색으로 칠해지고 그 위치로 스크롤된다.
- highlight는 원문과 글자가 하나라도 다르면 칠해지지 않는다. validate.mjs가 source/가 있을 때 이를 검사한다.
- 새 문제를 만들 때(/generate)도 detail과 highlight를 함께 채운다. 쓰는 법은 `.claude/commands/explain.md` 참고.

## 좋은 문제 기준
- 교수님 공지: "기본적인 내용을 묻는 질문 위주", 객관식·주관식 다양하게.
- 수치(박동수, 압력, 용적), 짝 개념(S1/S2, 압력수용기/화학수용기, 교감/부교감), 순서(혈류, 전도계통, RAAS),
  위치(판막, 결절, 동맥 가지), 계산(SV, CO, MAP, 순여과압)을 골고루.
- 오답 보기는 강의자료 안의 헷갈리는 다른 개념으로 만든다(아무 말 보기 금지).
- 기존 문제와 문장·내용이 겹치지 않게 `data/questions.json`을 먼저 읽고 빈 영역을 찾는다.

## 작업 후 반드시
1. `node scripts/validate.mjs` 통과
2. 바뀐 문제 수를 알려주고 커밋 메시지 제안(push는 사용자가 원할 때만)
