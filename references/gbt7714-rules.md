# GB/T 7714-2025 Reference Proofreading Notes

Use these notes as the working口径 for reference proofreading. They are not a replacement for the full standard, but they capture the rules that repeatedly matter in user workflows.

## Names

- Personal authors are written surname first, given names after.
- Western given names may be abbreviated to initials.
- Initials are uppercase and do not use periods: `ZHANG S`, not `ZHANG S.`.
- If abbreviating a hyphenated given name, keep the hyphen between initials when the source supports it, e.g. `J-L`.
- More than three authors: write the first three plus `et al.` for Western references or `等` for Chinese references.
- Western capitalization follows source-language conventions. Do not automatically convert author names to all uppercase unless the user or thesis template requires it.

## Common Document Types

Journal article:

```text
作者. 题名[J]. 刊名, 年, 卷(期): 页码或文章编号.
```

Online journal article:

```text
作者. 题名[J/OL]. 刊名, 年, 卷(期): 页码或文章编号[引用日期]. URL. DOI: DOI号.
```

Book:

```text
作者. 书名[M]. 版本项. 出版地: 出版者, 出版年.
```

Thesis or dissertation:

```text
作者. 题名[D]. 学位授予地: 学位授予单位, 年.
```

Conference paper:

```text
作者. 题名[C]//会议名, 年: 页码.
```

If the conference record lacks pages, article number, DOI, or stable URL, flag it as `需补页码/论文编号/DOI`.

## Punctuation and Spacing

- Use a period after author and title blocks.
- Use `,` between year, volume, and other publication data in mixed Chinese/English reference lists unless the user requires full-width Chinese punctuation.
- Use `:` before pages or article number.
- Remove extra spaces before `[J]`, `[M]`, `[D]`, `[C]`.
- Use `[YYYY-MM-DD]` for access dates.
- Use `DOI: 10...`, with one space after the colon.

## Duplicate Policy

- Within one chapter, delete duplicate records and renumber.
- Across chapters, keep duplicates unless the user explicitly asks to delete them; list them in the change summary.
- Prefer the more complete record when deleting duplicates.
- Strong duplicate signals: same DOI; same title and year; same first author + similar title + same pages.

## Authenticity Risk Flags

Flag, do not silently fix, when the issue cannot be verified from the provided data:

- Journal title misspellings, e.g. `Jourmal`.
- Impossible-looking volume numbers or page ranges.
- DOI points to a different journal/title than the reference.
- URL domain contradicts the journal or DOI.
- Missing conference page range or paper number.
- Chinese title or journal terms that appear typo-like but require checking the source PDF.
