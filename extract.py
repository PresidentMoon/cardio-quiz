"""pdfs/ 폴더의 강의자료를 페이지별 텍스트(source/*.md)와 페이지 이미지(source/pages/)로 뽑습니다.
Claude Code가 문제를 만들 때 이 파일만 근거로 삼습니다. (source/는 .gitignore로 공개되지 않음)

사용: pip install pymupdf  →  python scripts/extract.py
"""
import pathlib, sys
try:
    import pymupdf as fitz
except ImportError:
    sys.exit("pymupdf가 필요해요: pip install pymupdf")

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = {"heart": "heart.pdf", "vessel": "vessel.pdf"}
out = ROOT / "source"; (out / "pages").mkdir(parents=True, exist_ok=True)

for doc, fname in DOCS.items():
    pdf = ROOT / "pdfs" / fname
    if not pdf.exists():
        print(f"[건너뜀] pdfs/{fname} 없음"); continue
    d = fitz.open(pdf)
    lines = [f"# {doc} ({fname}) — 총 {len(d)}쪽\n"]
    for i, page in enumerate(d, start=1):
        text = page.get_text().strip()
        lines.append(f"\n## p.{i}\n{text if text else '(텍스트 없음 — 그림 페이지. source/pages/' + doc + f'-{i:02d}.png 를 직접 볼 것)'}\n")
        if len(text) < 80:  # 그림 위주 페이지는 이미지로 저장해서 Claude Code가 볼 수 있게
            page.get_pixmap(dpi=110).save(out / "pages" / f"{doc}-{i:02d}.png")
    (out / f"{doc}.md").write_text("".join(lines), encoding="utf-8")
    print(f"[완료] source/{doc}.md ({len(d)}쪽)")
