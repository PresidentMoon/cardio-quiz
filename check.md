---
description: 기존 문제의 정답·해설·출처 페이지가 강의자료와 맞는지 검수
argument-hint: [id 접두사 또는 개수, 예: h-mc 또는 30]
---
`data/questions.json`의 문제를 강의자료와 대조해 검수해 주세요. 범위: $ARGUMENTS (비어 있으면 전체)

각 문제마다 `source.page`에 해당하는 `source/<doc>.md` 쪽(그림이면 `source/pages/` 이미지)을 열어서:
- 정답과 해설이 그 쪽 내용과 일치하는지
- 근거가 다른 쪽에 있다면 올바른 쪽 번호로 고치기
- 강의자료 어디에도 근거가 없는 내용이면 목록으로 보고(바로 지우지 말고 사용자에게 확인)
고친 뒤 `node scripts/validate.mjs`를 실행하고, 바뀐 항목을 표로 보여준다.
