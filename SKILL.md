---
name: gbt7714-reference-proofreader
description: Proofread and normalize Chinese or English reference lists against GB/T 7714-2025, including author-name formatting, bibliographic symbols, DOI/URL/date cleanup, duplicate detection within and across chapters, authenticity-risk notes, change summaries, and Word DOCX output with chapter reference sections.
---

# GB/T 7714 Reference Proofreader

Use this skill to校对参考文献 lists for papers, theses, reports, and Word deliverables. It is optimized for GB/T 7714-2025 style work where the user provides pasted references, chapter-based lists, or existing DOCX-bound reference sections.

## Required Clarifications

Before final output, confirm any unresolved choices that affect the result:

- Whether the list should replace an existing chapter, append as a new chapter, or become a standalone document.
- Whether duplicate handling should delete only within-chapter duplicates or also remove cross-chapter duplicates.
- Whether network lookup is allowed for authenticity checks. If network is not available or not requested, flag suspicious records instead of claiming verification.
- Whether English author capitalization should follow GB/T source-language convention, preserve the user's original uppercase style, or use another journal/thesis requirement.

If the user has already answered these in the thread, apply those answers without asking again.

## Core Rules

Read `references/gbt7714-rules.md` when applying detailed rules or explaining why an edit is needed.

Default GB/T 7714-2025 author handling:

- Write personal authors as surname first, given names after.
- Western given names may be abbreviated to initials; initials are uppercase and do not use abbreviation dots.
- Capitalization in Western references should follow source-language conventions. Do not force all authors to lowercase or uppercase unless the user or target institution requires it.
- For more than three authors, list the first three authors followed by `等` for Chinese references or `et al.` for Western references, unless the user asks for full author lists.

## Workflow

1. Parse the user's references into chapters or sections.
2. Preserve the user's chapter boundaries. When appending a new list, name it `第X章参考文献`.
3. Normalize each record:
   - Fix obvious spacing around `[J]`, `[M]`, `[D]`, `[C]`, `[OL]`, `//`, DOI, URL, volume, issue, and pages.
   - Use `year, volume(issue): pages` for journal articles.
   - Use `place: institution/publisher, year` for theses and books when information exists.
   - Use access dates as `[YYYY-MM-DD]`.
   - Write DOI as `DOI: 10...`; remove unrelated IDs such as `Corpus ID` unless the user asks to keep them.
4. Detect duplicates:
   - Within a chapter: remove duplicates, keep the better or earlier complete record, then renumber that chapter.
   - Across chapters: do not delete by default; list them in the change summary.
   - Treat title + first author + year as strong duplicate evidence. Also compare DOI/URL when available.
5. Check authenticity risks:
   - Flag impossible-looking volume/year/pages, misspelled journal names, malformed DOI, mismatched URL/DOI, missing conference pages/article number, and suspicious title or journal variants.
   - If the user asks to verify existence or latest facts, browse or use authoritative databases where available. Cite sources in the final answer when browsing is used.
6. Create a concise change summary:
   - List deleted within-chapter duplicates.
   - List cross-chapter duplicates kept.
   - List major corrected errors and unresolved records needing manual verification.
7. When producing DOCX, use `scripts/make_reference_docx.py` or the document skill. The standard output style is:
   - No title page.
   - No running header.
   - No footer.
   - Chapter headings only, e.g. `第一章参考文献`.
   - Hanging-indented reference paragraphs.

## DOCX Helper

Use `scripts/make_reference_docx.py` for deterministic Word output after the references have been校对:

```bash
python scripts/make_reference_docx.py input_sections.json output.docx
```

Input JSON shape:

```json
{
  "sections": [
    {
      "heading": "第一章参考文献",
      "items": ["[1] ...", "[2] ..."]
    }
  ]
}
```

The script intentionally does not perform scholarly verification. It only creates the DOCX from already校对后的 records.

## Final Response Pattern

When returning results, include:

- A link to the DOCX if one was created.
- The number of references per chapter and the total count.
- A short list of major changes.
- Within-chapter duplicates deleted.
- Cross-chapter duplicates retained.
- Remaining `需核验` items.
- Whether visual render QA was completed; if LibreOffice is unavailable, say so plainly.
