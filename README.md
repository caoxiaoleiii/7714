# GB/T 7714 Reference Proofreader

这是一个用于校对参考文献的 Codex skill，面向论文、学位论文、报告和按章节组织的参考文献清单。它的目标是把用户提供的参考文献按 GB/T 7714-2025 口径整理，并输出可直接使用的 Word 文档和改动说明。

## 功能

- 按 GB/T 7714-2025 校对中文、英文参考文献。
- 规范作者、题名、文献类型标识、刊名、年份、卷期、页码、DOI、URL、引用日期等字段。
- 支持按章节处理参考文献，如“第一章参考文献”“第二章参考文献”。
- 章内重复默认删除并重新编号。
- 跨章重复默认保留，并在改动清单中提示。
- 对疑似不存在、信息不完整或字段明显矛盾的文献标注“需核验”。
- 可生成无标题页、无页眉、无页脚的分章 Word 文档。
- 提供 GitHub/Gitee Pages 静态网页，可在浏览器本地完成基础校对并下载 Word。

## 默认规则

- 英文作者大小写按 GB/T 7714 原则处理：遵循来源语言习惯，不固定强制全大写。
- 西文作者姓名采用“姓在前，名在后”的形式。
- 西文作者的名可以缩写为首字母；首字母大写，不加缩写点。
- 作者超过 3 人时，中文文献用“等”，英文文献用 `et al.`。
- 访问日期统一为 `[YYYY-MM-DD]`。
- DOI 统一写为 `DOI: 10...`。
- 会议论文缺页码、论文编号或 DOI 时，标记为需补信息。

## 目录结构

```text
gbt7714-reference-proofreader/
├─ SKILL.md
├─ README.md
├─ index.html
├─ app.js
├─ styles.css
├─ agents/
│  └─ openai.yaml
├─ references/
│  └─ gbt7714-rules.md
└─ scripts/
   └─ make_reference_docx.py
```

## 使用方式

### 网页版

仓库根目录包含一个纯静态网页：

```text
index.html
```

启用 GitHub Pages 或 Gitee Pages 后，可直接在浏览器中使用。网页功能包括：

- 粘贴参考文献。
- 基础格式校对。
- 章内重复删除。
- 跨章重复提示。
- 复制校对后版本。
- 下载改动清单。
- 下载 Word 文件。

当前网页版不做联网真实性核验。

### Codex Skill

在 Codex 中可这样调用：

```text
Use $gbt7714-reference-proofreader to 校对我的参考文献，按 GB/T 7714 输出 Word 和改动清单。
```

如果需要生成 Word，可先把校对后的参考文献整理成 JSON：

```json
{
  "sections": [
    {
      "heading": "第一章参考文献",
      "items": [
        "[1] WILLIAMS S W, MARTINA F, ADDISON A C, et al. Wire + arc additive manufacturing[J]. Materials Science and Technology, 2016, 32(7): 641-647."
      ]
    }
  ]
}
```

然后运行：

```bash
python scripts/make_reference_docx.py input_sections.json output.docx
```

## 输出要求

最终回复通常包括：

- Word 文件链接。
- 各章参考文献数量和总数。
- 主要改动。
- 已删除的章内重复文献。
- 保留的跨章重复文献。
- 仍需核验的文献。
- 是否完成 Word 视觉渲染检查。

## 真实性核验说明

该 skill 会提示疑似错误和需核验项，但离线情况下不能保证每条文献真实存在。若用户要求“识别参考文献是否真实存在”或“核验 DOI/题名/页码”，应优先联网查询 DOI、出版社、期刊官网、数据库或其他权威来源，并在最终回复中说明依据。
