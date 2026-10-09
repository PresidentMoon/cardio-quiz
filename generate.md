---
description: 강의자료에서만 새 퀴즈 문제를 만들어 data/questions.json에 추가
argument-hint: [개수] [heart|vessel|all] [mc|ox|short|card|mix]
---
새 문제를 만들어 주세요. 요청: $ARGUMENTS
(비어 있으면 기본값: 20문제, all, mix)

순서:
1. `source/heart.md`, `source/vessel.md`가 없으면 `python scripts/extract.py`를 먼저 실행하라고 안내하고 멈춘다.
2. `data/questions.json`을 읽고 주제·페이지별로 이미 있는 문제를 파악해서, 아직 문제가 적은 페이지를 우선한다.
3. CLAUDE.md의 규칙대로, 강의자료 원문에 근거가 있는 내용만으로 문제를 만든다.
   각 문제를 만들 때 근거 페이지를 다시 열어 정답·해설이 그 페이지 내용과 일치하는지 확인한다.
4. 그림 페이지(`source/pages/*.png`)에서 낸 문제는 이미지를 실제로 보고 확인한다.
5. 각 문제에 `detail`과 `highlight`도 `.claude/commands/explain.md`의 기준대로 채운다.
6. 문제를 `data/questions.json`의 questions 배열 끝에 추가하고 `node scripts/validate.mjs`를 실행해 통과시킨다.
7. 추가한 문제를 주제·유형·페이지별로 표로 요약한다.
