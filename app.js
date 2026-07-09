const inputRefs = document.querySelector("#inputRefs");
const outputRefs = document.querySelector("#outputRefs");
const changeList = document.querySelector("#changeList");
const chapterTitle = document.querySelector("#chapterTitle");
const caseMode = document.querySelector("#caseMode");
const removeDuplicates = document.querySelector("#removeDuplicates");

let latestSections = [];
let latestChanges = [];

const sample = `[1] 余圣甫,禹润缜,何天英,等. 电弧增材制造技术及其应用的研究进展[J]. 中国材料进展，2021,40(3)：198-209.
[2] WILLIAMS S W, MARTINA F, ADDISION A C, et al. Wire + arc additive manufacturing[J]. Materials Science and Technology,2016,32(7):641-647.
[3] WU B, PAN Z, DING D,et al. A review of the wire arc additive manufacturing of metals: properties, defects and quality improvement[J]. Jourmal of Manufacturing Processes, 2018,35:127-139.
[4] WILLIAMS S W, MARTINA F, ADDISON A C, et al. Wire plus arc additive manufacturing[J]. Materials Science and Technology, 2016, 32(7): 641-647.`;

document.querySelector("#sampleBtn").addEventListener("click", () => {
  inputRefs.value = sample;
});

document.querySelector("#clearBtn").addEventListener("click", () => {
  inputRefs.value = "";
  outputRefs.value = "";
  latestSections = [];
  latestChanges = [];
  renderChanges(["等待校对。"]);
});

document.querySelector("#proofreadBtn").addEventListener("click", () => {
  const result = proofread(inputRefs.value, {
    heading: chapterTitle.value.trim() || "第一章参考文献",
    caseMode: caseMode.value,
    removeDuplicates: removeDuplicates.checked,
  });
  latestSections = result.sections;
  latestChanges = result.changes;
  outputRefs.value = result.sections
    .map((section) => `${section.heading}\n${section.items.join("\n")}`)
    .join("\n\n");
  renderChanges(result.changes.length ? result.changes : ["未发现需要记录的改动。"]);
});

document.querySelector("#copyBtn").addEventListener("click", async () => {
  if (!outputRefs.value.trim()) return;
  await navigator.clipboard.writeText(outputRefs.value);
  renderChanges([...latestChanges, "已复制校对后版本。"]);
});

document.querySelector("#downloadTxtBtn").addEventListener("click", () => {
  const content = (latestChanges.length ? latestChanges : ["暂无改动清单。"]).join("\n");
  downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), "参考文献改动清单.txt");
});

document.querySelector("#downloadDocxBtn").addEventListener("click", async () => {
  if (!latestSections.length) {
    const result = proofread(inputRefs.value, {
      heading: chapterTitle.value.trim() || "第一章参考文献",
      caseMode: caseMode.value,
      removeDuplicates: removeDuplicates.checked,
    });
    latestSections = result.sections;
    latestChanges = result.changes;
    outputRefs.value = result.sections
      .map((section) => `${section.heading}\n${section.items.join("\n")}`)
      .join("\n\n");
    renderChanges(result.changes.length ? result.changes : ["未发现需要记录的改动。"]);
  }
  if (!latestSections.length) return;
  const blob = await buildDocx(latestSections);
  downloadBlob(blob, "参考文献_GBT7714_整理版.docx");
});

function proofread(raw, options) {
  const changes = [];
  const sections = parseSections(raw, options.heading);
  const normalizedSections = sections.map((section) => {
    const entries = splitEntries(section.text);
    const seen = new Map();
    const items = [];

    entries.forEach((entry, index) => {
      const original = entry;
      let cleaned = normalizeEntry(entry, options, changes);
      const duplicateKey = makeDuplicateKey(cleaned);

      if (options.removeDuplicates && duplicateKey && seen.has(duplicateKey)) {
        changes.push(`删除章内重复：原第 ${index + 1} 条与第 ${seen.get(duplicateKey) + 1} 条疑似重复。`);
        return;
      }

      if (duplicateKey) seen.set(duplicateKey, items.length);
      if (cleaned !== original.trim()) {
        changes.push(`整理第 ${index + 1} 条：修正链接/标点/空格/著录符号。`);
      }
      items.push(cleaned);
    });

    return {
      heading: section.heading,
      items: renumber(items),
    };
  });

  noteCrossSectionDuplicates(normalizedSections, changes);

  return {
    sections: normalizedSections.filter((section) => section.items.length),
    changes: unique(changes),
  };
}

function parseSections(raw, fallbackHeading) {
  const text = stripMarkdownLinks(raw).replace(/\u00a0/g, " ").trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = { heading: fallbackHeading, text: "" };
  const headingPattern = /^(第[一二三四五六七八九十\d]+章参考文献|#{1,3}\s*.+参考文献)\s*$/;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (headingPattern.test(trimmed)) {
      if (current.text.trim()) sections.push(current);
      current = { heading: trimmed.replace(/^#{1,3}\s*/, ""), text: "" };
    } else {
      current.text += `${line}\n`;
    }
  });
  if (current.text.trim()) sections.push(current);
  return sections;
}

function splitEntries(text) {
  return text
    .replace(/\s+(?=\[\d+]\s*)/g, "\n")
    .replace(/\r/g, "")
    .split(/\n(?=\s*\[\d+\])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripMarkdownLinks(text) {
  return text
    .replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\\\]/g, "]")
    .replace(/\\\[/g, "[");
}

function normalizeEntry(entry, options, changes) {
  let s = stripMarkdownLinks(entry).replace(/\u00a0/g, " ").trim();
  s = s.replace(/^\[\d+]\s*/, "");
  s = s.replace(/[，]/g, ",").replace(/[：]/g, ":").replace(/[；]/g, ";");
  s = s.replace(/\[J\\]/g, "[J]").replace(/\[\s*J\s*\/\s*OL\s*]/gi, "[J/OL]");
  s = s.replace(/\s+\[([JMCDBA-Z/]+)]/g, "[$1]");
  s = s.replace(/\[([JMCDBA-Z/]+)]\s*\.\s*/g, "[$1]. ");
  s = s.replace(/,\s*/g, ", ");
  s = protectUrls(s, (value) => value.replace(/:\s*/g, ": "));
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/DOL\s*:/gi, "DOI: ");
  s = s.replace(/DOI\s*:\s*/gi, "DOI: ");
  s = s.replace(/\[(\d{4})-(\d{1,2})-(\d{1,2})]/g, (_, y, m, d) => `[${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}]`);
  s = s.replace(/Jourmal/g, "Journal");
  s = s.replace(/ADDISION/g, "ADDISON");
  s = s.replace(/\bAI X Y\b/, "CAI X Y");
  s = normalizeAuthorBlock(s, changes);
  s = s.replace(/DING D,\s*et al\./g, "DING D, et al.");

  if (options.caseMode === "upper") {
    s = uppercaseEnglishAuthorBlock(s);
  }

  s = s.replace(/\s+([.。])/g, "$1");
  s = s.replace(/([。])\s*/g, "$1 ");
  s = s.replace(/\s+\.$/, ".");
  if (!/[.。]$/.test(s)) s += ".";

  if (/Journal of Manufacturing Processes/.test(s) && /Jourmal/.test(entry)) {
    changes.push("修正拼写：Jourmal -> Journal。");
  }
  if (/ADDISON/.test(s) && /ADDISION/.test(entry)) {
    changes.push("修正作者拼写：ADDISION -> ADDISON。");
  }
  if (/CAI X Y/.test(s) && /\bAI X Y\b/.test(entry)) {
    changes.push("修正疑似漏字作者：AI X Y -> CAI X Y。");
  }
  return s;
}

function normalizeAuthorBlock(entry, changes) {
  const parts = splitAuthorAndRest(entry);
  if (!parts) return entry;

  const { authorBlock, rest } = parts;
  const normalizedBlock = isEnglishOrMixedAuthorBlock(authorBlock)
    ? normalizeMixedEnglishAuthorBlock(authorBlock, changes)
    : normalizeChineseAuthorBlock(authorBlock, changes);

  return normalizedBlock + rest;
}

function splitAuthorAndRest(entry) {
  const etAlMatch = entry.match(/^(.+?,\s*et al\.)\s+(.+)$/i);
  if (etAlMatch) {
    return {
      authorBlock: etAlMatch[1].trim(),
      rest: ` ${etAlMatch[2]}`,
    };
  }

  const firstDot = entry.indexOf(".");
  if (firstDot < 0) return null;
  return {
    authorBlock: entry.slice(0, firstDot).trim(),
    rest: entry.slice(firstDot),
  };
}

function isEnglishOrMixedAuthorBlock(authorBlock) {
  return /[A-Za-z]{2,}\s+[A-Z](\s+[A-Z])?/.test(authorBlock);
}

function normalizeMixedEnglishAuthorBlock(authorBlock, changes) {
  let block = authorBlock;
  const original = block;
  const transliterations = {
    "曹晓磊": "CAO X L",
  };

  Object.entries(transliterations).forEach(([cnName, romanized]) => {
    if (block.includes(cnName)) {
      block = block.replaceAll(cnName, romanized);
      changes.push(`英文或混合作者区中中文作者改为拼音缩写：${cnName} -> ${romanized}。`);
    }
  });

  block = block.replace(/,\s*et al\./i, ", et al.");
  block = trimAuthorsBeforeEtAl(block, changes, "英文作者");
  return block || original;
}

function normalizeChineseAuthorBlock(authorBlock, changes) {
  let block = authorBlock.replace(/\s+/g, " ").trim();
  block = block.replace(/\s*等$/, ", 等").replace(/,\s*,\s*等$/, ", 等");

  const hasEtAl = /,\s*等$/.test(block);
  if (!hasEtAl) return block;

  const names = block.replace(/,\s*等$/, "").split(/\s*,\s*/).filter(Boolean);
  if (names.length > 3) {
    const original = block;
    block = `${names.slice(0, 3).join(", ")}, 等`;
    changes.push(`中文作者超过3人时列前3位加“等”：${original} -> ${block}。`);
  }
  return block;
}

function trimAuthorsBeforeEtAl(authorBlock, changes, label) {
  const hasEtAl = /,\s*et al\.$/i.test(authorBlock);
  if (!hasEtAl) return authorBlock;

  const authors = authorBlock.replace(/,\s*et al\.$/i, "").split(/\s*,\s*/).filter(Boolean);
  if (authors.length <= 3) return authorBlock;

  const trimmed = `${authors.slice(0, 3).join(", ")}, et al.`;
  changes.push(`${label}超过3人时列前3位加“et al.”：${authorBlock} -> ${trimmed}。`);
  return trimmed;
}

function protectUrls(text, transform) {
  const urls = [];
  const masked = text.replace(/https?:\/\/\S+/g, (url) => {
    urls.push(url);
    return `__URL_${urls.length - 1}__`;
  });
  const transformed = transform(masked);
  return transformed.replace(/__URL_(\d+)__/g, (_, index) => urls[Number(index)]);
}

function uppercaseEnglishAuthorBlock(entry) {
  const parts = splitAuthorAndRest(entry);
  if (!parts) return entry;
  const authors = parts.authorBlock;
  if (!/[A-Za-z]/.test(authors) || /[\u4e00-\u9fa5]/.test(authors)) return entry;
  return authors.toUpperCase() + parts.rest;
}

function makeDuplicateKey(entry) {
  const body = entry.replace(/^\[\d+]\s*/, "");
  const titleMatch = body.match(/^[^.。]+[.。]\s*(.*?)\[[A-Z/]+]/);
  const yearMatch = body.match(/,\s*(19|20)\d{2}[,\s]/);
  const title = titleMatch ? normalizeKey(titleMatch[1]) : "";
  const year = yearMatch ? yearMatch[0].match(/\d{4}/)[0] : "";
  if (!title || !year) return "";
  return `${title}|${year}`;
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/\bplus\b/g, "+")
    .replace(/wire\s*\+\s*arc/g, "wire+arc")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}

function renumber(items) {
  return items.map((item, index) => `[${index + 1}] ${item.replace(/^\[\d+]\s*/, "")}`);
}

function noteCrossSectionDuplicates(sections, changes) {
  const seen = new Map();
  sections.forEach((section) => {
    section.items.forEach((item) => {
      const key = makeDuplicateKey(item);
      if (!key) return;
      if (seen.has(key) && seen.get(key) !== section.heading) {
        changes.push(`跨章重复保留：${seen.get(key)} 与 ${section.heading} 中存在疑似重复文献。`);
      } else {
        seen.set(key, section.heading);
      }
    });
  });
}

function unique(items) {
  return [...new Set(items)];
}

function renderChanges(changes) {
  changeList.innerHTML = "";
  changes.forEach((change) => {
    const li = document.createElement("li");
    li.textContent = change;
    if (/需核验|疑似|缺|错误/.test(change)) li.className = "warning";
    changeList.appendChild(li);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function buildDocx(sections) {
  if (!window.JSZip) {
    throw new Error("JSZip 未加载，无法生成 Word。");
  }

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels").file(".rels", relsXml());
  const word = zip.folder("word");
  word.file("document.xml", documentXml(sections));
  word.file("styles.xml", stylesXml());
  word.folder("_rels").file("document.xml.rels", documentRelsXml());
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function documentXml(sections) {
  const body = [];
  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) body.push(pageBreakXml());
    body.push(paragraphXml(section.heading, { style: "Heading1" }));
    section.items.forEach((item) => body.push(paragraphXml(item, { style: "Reference" })));
  });
  body.push(`<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1152" w:right="1224" w:bottom="1152" w:left="1224" w:header="648" w:footer="648" w:gutter="0"/></w:sectPr>`);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body.join("")}</w:body>
</w:document>`;
}

function paragraphXml(text, options = {}) {
  const style = options.style ? `<w:pStyle w:val="${options.style}"/>` : "";
  const indent = options.style === "Reference" ? `<w:ind w:left="360" w:hanging="360"/>` : "";
  const spacing = options.style === "Heading1"
    ? `<w:spacing w:before="0" w:after="160"/>`
    : `<w:spacing w:after="80" w:line="278" w:lineRule="auto"/>`;
  return `<w:p><w:pPr>${style}${indent}${spacing}</w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function pageBreakXml() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="宋体"/><w:sz w:val="21"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:after="160"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="黑体"/><w:b/><w:sz w:val="30"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Reference">
    <w:name w:val="Reference"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="80" w:line="278" w:lineRule="auto"/><w:ind w:left="360" w:hanging="360"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="宋体"/><w:sz w:val="21"/></w:rPr>
  </w:style>
</w:styles>`;
}
