# Reading A-Z Interactive — 书籍制作手册

## 目录

1. [项目架构概览](#1-项目架构概览)
2. [书籍 JSON 数据规范](#2-书籍-json-数据规范)
3. [制作流程与步骤](#3-制作流程与步骤)
4. [踩过的坑与解决方案](#4-踩过的坑与解决方案)
5. [Lesson Plan 对照清单](#5-lesson-plan-对照清单)
6. [模块开发指南](#6-模块开发指南)
7. [本地化数据存储方案](#7-本地化数据存储方案)

---

## 1. 项目架构概览

### 1.1 项目结构

```
readinga-z-interactive/
── index.html              # 书架主页（列出所有书籍卡片）
├── reader.html             # 阅读器模板引擎（动态加载书籍）
├── css/styles.css          # 全局样式
├── js/
│   ├── stars.js            # 星星/积分系统（localStorage）
│   ├── app.js              # 主控制器（Tab管理、阅读渲染）
│   ├── grammar.js          # 语法练习模块
│   ├── evidence.js         # Evidence Q&A 模块
│   ├── summarize.js        # 摘要练习模块
│   ├── vocabulary.js       # 词汇练习模块
│   ├── typing.js           # 打字练习模块
│   ├── problemSolution.js  # 问题/解决方案模块
│   ├── authorPurpose.js    # 作者意图模块
│   ├── kwls.js             # KWLS 图表模块
│   ├── pronoun.js          # 代词一致性模块
│   └── sequence.js         # 事件排序模块
└── books/
    ├── hurricanes.json
    ├── mummies.json
    └── ...
```

### 1.2 工作原理

- `index.html` 中的 `books` 数组定义书架上的书
- 点击书卡 → 跳转到 `reader.html?book=hurricanes`
- `reader.html` 加载对应 JSON → `app.js` 根据 `activities` 数组动态创建 Tab
- 每个 Tab 对应一个 JS 模块，模块通过 `window.ModuleName` 暴露给 `getModule()`
- 星星系统用 `localStorage` 持久化，key 格式：`stars_{bookId}`

---

## 2. 书籍 JSON 数据规范

### 2.1 基本结构

```jsonc
{
  "meta": {
    "id": "book-id",           // URL 中的 book 参数
    "title": "Book Title",
    "level": "W",
    "author": "Author Name",
    "focusQuestion": "Main question?"
  },
  "activities": ["read", "evidence", "grammar", "vocabulary", "typing"],
  "sections": [ ... ],          // 正文段落（带语法高亮）
  "vocabulary": [ ... ],        // 词汇列表（含测验）
  "grammar": { ... },           // 语法练习数据
  "questions": [ ... ],         // Evidence 问答题
  "notes": { ... },             // 侧栏笔记
  // 以下按需添加：
  "problemSolution": [ ... ],
  "summarizeActivities": [ ... ],
  "authorPurpose": { ... },
  "kwls": { ... },
  "pronounAgreement": [ ... ],
  "sequenceEvents": [ ... ]
}
```

### 2.2 activities 可用模块

| 模块名 | Tab 图标 | 需要的数据字段 |
|--------|---------|---------------|
| `read` | 📖 Read | `sections`, `vocabulary`, `grammar`（可选） |
| `evidence` | ❓ Evidence | `questions` |
| `grammar` | 📐 Grammar | `grammar` |
| `summarize` | 📝 Summarize | `summarizeActivities` |
| `vocabulary` | 📚 Vocab | `vocabulary` |
| `typing` | ⌨️ Typing | `vocabulary`（复用词汇的句子） |
| `authorPurpose` | 🎯 Purpose | `authorPurpose` |
| `kwls` | 📊 KWLS | `kwls` |
| `pronoun` | 🔤 Pronouns | `pronounAgreement` |
| `problemSolution` | 🔍 Problem | `problemSolution` |
| `sequence` |  Sequence | `sequenceEvents` |

### 2.3 sections 段落中的标签

**语法高亮标签** `<g>`：

```html
The <g data-word="ancient" data-type="adjective" data-modifies="Egyptians" data-rule="tells WHICH Egyptians">ancient</g> Egyptians...
```

- `data-word`: 高亮的单词
- `data-type`: 词性（`adjective` / `adverb` / `homophone`）
- `data-modifies`: 修饰的对象
- `data-rule`: 构词规则或解释
- 点击后弹出 tooltip 显示以上信息

**注意**：不要再使用旧的 `<s>` `<v>` `<o>` 标签（已被移除）。

### 2.4 vocabulary 格式

```json
{
  "word": "evacuate",
  "pos": "v.",
  "definition": "to move people out of danger",
  "section": "intro",
  "sentence": "Some people evacuate their homes.",
  "quiz": {
    "prompt": "To \"evacuate\" means to:",
    "options": ["wrong1", "wrong2", "wrong3", "correct answer"],
    "answer": 3
  }
}
```

### 2.5 grammar 格式

```json
{
  "target": "adverbs",
  "title": "Adverbs",
  "explanation": "Adverbs describe verbs or adjectives...",
  "rules": [
    "Most adverbs end in -ly: rapid → rapidly",
    "Some don't end in -ly: soon, very, often"
  ],
  "wordBuilding": [
    {"base": "rapid", "answer": "rapidly"},
    {"base": "slow", "answer": "slowly"}
  ],
  "homophones": [
    {"pair": ["one", "won"], "sentence": "She _____ the race.", "answer": "won"},
    {"pair": ["eight", "ate"], "sentence": "_____ people came.", "answer": "eight"}
  ],
  "exercises": [
    {
      "type": "identify",
      "sentence": "The air rapidly cools.",
      "answers": ["rapidly"],
      "hint": "Which word tells HOW?"
    },
    {
      "type": "multipleChoice",
      "question": "Which is an adverb?",
      "sentence": "The wind blows fiercely.",
      "options": ["wind", "blows", "fiercely", "storm"],
      "answer": 2,
      "explanation": "'Fiercely' describes HOW the wind blows."
    },
    {
      "type": "fillBlank",
      "sentence": "The storm _____ (final/finally) moved inland.",
      "answer": "finally",
      "explanation": "'Finally' is the adverb form."
    },
    {
      "type": "homophone",
      "sentence": "She _____ (won/one) the prize.",
      "options": ["won", "one"],
      "answer": 0,
      "explanation": "'Won' = past tense of win."
    }
  ]
}
```

### 2.6 questions（Evidence Q&A）格式

```json
{
  "id": "q1",
  "level": 1,
  "question": "The question text?",
  "section": "section-id",
  "pages": "4",
  "evidence": "The evidence sentence from text.",
  "choices": ["Correct answer", "Wrong 1", "Wrong 2", "Wrong 3"],
  "correctChoice": 0,
  "explanation": "Why this is correct."
}
```

`level`: 1 = 基础事实题, 2 = 推理/分析题, 3 = 开放题（无选项）

---

## 3. 制作流程与步骤

### Step 1: 提取 PDF 文本

```python
import fitz  # PyMuPDF
doc = fitz.open('book.pdf')
for page in doc:
    print(page.get_text())
```

### Step 2: 阅读 Lesson Plan (_LP.pdf)

**必须提取的关键信息：**
- Targeted Reading Strategy（阅读策略）
- Comprehension Skill（理解技能）
- Grammar and Mechanics（语法目标）
- Word Work（词汇技能）
- Story Critical Vocabulary（核心词汇）
- Enrichment Vocabulary（拓展词汇）
- Academic Vocabulary（学术词汇，部分书有）
- Text-Dependent Questions（阅读理解题）

### Step 3: 准备 JSON 基础数据

1. 从 PDF 提取正文，按章节分段
2. 在段落中添加 `<g>` 语法高亮标签
3. 从 Glossary 提取 vocabulary，编写 quiz
4. 根据 LP 编写 questions
5. 编写 notes（侧栏讲解）

### Step 4: 添加 grammar 字段

根据 LP 的 Grammar and Mechanics 部分，创建 grammar 对象：
- `target`: 语法目标（adverbs / adjectives / etc.）
- `rules`: 3-4 条语法规则
- `wordBuilding`: 6 个构词法练习
- `exercises`: 识别题 + 选择题 + 填空题（共 8-10 题）
- `homophones`: 如果 LP 有同音词要求，加 4 个

### Step 5: 检查 LP 覆盖度

对照 [Lesson Plan 对照清单](#5-lesson-plan-对照清单) 逐一检查。

### Step 6: 测试与调试

1. 将 JSON 放入 `books/` 目录
2. 在 `index.html` 添加书籍信息
3. 在浏览器中打开 `reader.html?book=book-id` 测试
4. 检查所有 Tab 功能正常
5. 检查 `<g>` 标签正确显示为高亮而非原文字
6. 检查星星计数正确

### Step 7: 提交到 GitHub

```bash
git add -A
git commit -m "Add [Book Title] with grammar module"
git push
```

---

## 4. 踩过的坑与解决方案

### ❌ 坑 1：SVO 标注过多，视觉干扰严重

**问题：** 最初每句话都标注了 `<s>主语</s> <v>谓语</v> <o>宾语</o>`，导致几乎每个词都有波浪线，学生分不清重点。而且 LP 要求的是副词/形容词/同音词，不是主谓宾。

**解决：** 删除所有 `<s><v><o>` 标注，改为只高亮 LP 指定的目标语法词（`<g>` 标签）。

### ❌ 坑 2：GrammarModule 不显示

**问题：** Grammar Tab 显示 "Module 'grammar' not available for this book."

**原因：** `const GrammarModule = (() => {...})()` 创建的是脚本作用域变量，不会自动挂载到 `window`。`app.js` 的 `getModule()` 用 `window['GrammarModule']` 查找，返回 `null`。

**解决：** 在文件末尾加一行：
```javascript
window.GrammarModule = GrammarModule;
```

**教训：** 所有新模块都必须在末尾显式挂载到 `window`！参考其他模块的写法：
```javascript
// authorPurpose.js 第170行
window.AuthorPurposeModule = AuthorPurposeModule;

// evidence.js 第203行
window.EvidenceModule = EvidenceModule;
```

### ❌ 坑 3：Evidence 模块显示乱码

**问题：** Evidence 的 Passage 面板显示 `<g data-word="first" data-type="adjective"...>first</g>` 原文。

**原因：** `evidence.js` 用正则清除了旧的 `<s><v><o>` 标签，但没有清除新的 `<g>` 标签。加上用了 `textContent`（纯文本渲染），所以标签被原样显示。

**解决：** 在第 61 行的正则中加一段：
```javascript
// 之前
const cleanPara = para.replace(/<\/?s>/g, '').replace(/<\/?v>/g, '').replace(/<\/?o>/g, '');

// 之后
const cleanPara = para.replace(/<\/?s>/g, '').replace(/<\/?v>/g, '').replace(/<\/?o>/g, '').replace(/<g [^>]*>([^<]*)<\/g>/g, '$1');
```

**教训：** 任何显示段落原文的模块（evidence、future modules），都需要清除 `<g>` 标签。

### ❌ 坑 4：mummies.json 的残留标签

**问题：** Python 批量删除 SVO 标签时，一行中有 `<s>the dead body</s> <v>is preserved</v>`，删除后变成了 `<s>the dead body</v>`（标签交叉残留）。

**原因：** 原始文本中标签嵌套不严格，Python 正则的非贪婪匹配导致错误。

**解决：** 手动修复残留标签。

**教训：** 批量处理完后，用正则扫描所有 JSON 文件确认没有残留标签：
```python
import re
text = open('books/book.json').read()
tags = re.findall(r'<[sgvo][^>]*>|</[sgvo]>', text)
```

### ❌ 坑 5：子代理（Agent）频繁中断

**问题：** 使用后台 Agent 修改 JSON 文件时，多次因模型不支持或会话中断而失败。

**解决：** 改用本地 Python 脚本直接修改 JSON，更可靠。

**教训：** 大文件批量修改用 Python 脚本比 Agent 更稳定。Agent 适合做探索性任务，不适合精确的数据修改。

### ❌ 坑 6：Enrichment Vocabulary 覆盖不全

**问题：** Mummies 的 LP 列了 15 个 Enrichment 词汇，但最初只加了 12 个总词汇（含 6 个 Story Critical），意味着只有 6 个 Enrichment 被覆盖。

**解决：** 对比 LP 的 vocabulary 列表，逐个检查是否在 JSON 的 vocabulary 数组中。补充了 arrested, ba, ka, shabtis, incision, tempted 共 6 个。

**教训：** 制作时必须对照 LP 的 vocabulary 列表做覆盖度检查。

### ❌ 坑 7：Academic Vocabulary 完全遗漏

**问题：** Nobel Prize 的 LP 列了 6 个 Academic Vocabulary（create, important, individual, influence, receive, study），这些是跨学科通用学术词汇，但 JSON 中完全没有。

**解决：** 补充 6 个 Academic Vocabulary 到 vocabulary 数组。

**教训：** 不是所有书都有 Academic Vocabulary，但如果有（LP 中会单独列出），必须覆盖。

---

## 5. Lesson Plan 对照清单

### 5.1 每次制作新书时的必查项

```
□ Reading Strategy 是否对应？
  - Summarize → summarizeActivities
  - Connect to prior knowledge → kwls（或 buildBackground notes）

□ Comprehension Skill 是否对应？
  - Cause and effect → problemSolution
  - Main idea and details → evidence questions + summarize
  - Author's point of view → authorPurpose

□ Grammar and Mechanics 是否覆盖？
  - 是否有 grammar 字段？
  - 是否有 <g> 高亮标签？
  - 练习题数量是否足够（≥8题）？
  - 构词法练习是否覆盖 LP 例子？

□ Word Work 是否覆盖？
  - Numbers/abbreviations → 目前没有模块，可在 notes 中提及
  - Multiple-meaning words → 目前没有模块
  - Homophones → grammar.homophones

□ Story Critical Vocabulary 是否 100% 覆盖？

□ Enrichment Vocabulary 覆盖率？
  - 列出 LP 中所有 enrichment 词
  - 检查每个是否在 JSON 的 vocabulary 中
  - 目标：≥80% 覆盖

□ Academic Vocabulary 是否覆盖？（如有）

□ Text-Dependent Questions 是否对应 LP？
  - LP 中的每个问题是否在 questions 数组中有对应？
  - Level 1/2/3 分布是否合理？
```

### 5.2 各书 LP 对照表

| 书 | Reading Strategy | Comprehension Skill | Grammar | Word Work | 特殊要求 |
|---|---|---|---|---|---|
| Hurricanes | Connect to prior knowledge | Cause & effect | Adverbs | Numbers & abbreviations | Science connection |
| Mummies | Summarize | Main idea & details | Adjectives | Multiple-meaning words | Social studies |
| Nobel Prize | Summarize | Author's point of view | Adjectives | Homophones | Academic vocab |

---

## 6. 模块开发指南

### 6.1 创建新模块的步骤

1. 在 `js/` 创建新文件，如 `newModule.js`
2. 用 IIFE 模式定义模块：

```javascript
const NewModule = (() => {
  function render(container) {
    // 渲染逻辑
  }
  function getStarCount() {
    return { earned: StarSystem.getSectionStars('new-'), total: 10 };
  }
  return { render, getStarCount };
})();
window.NewModule = NewModule;  // ← 这行不能忘！
```

3. 在 `app.js` 的 `MODULE_REGISTRY` 中添加：
```javascript
newModule: { icon: '🆕', label: 'New', moduleName: 'NewModule' }
```

4. 在 `app.js` 的 `calculateTotalStars` 中添加 case
5. 在 `app.js` 的 `getModuleStars` 中添加 case
6. 在 `reader.html` 中添加 `<script src="js/newModule.js?v=8"></script>`
7. 在 `css/styles.css` 中添加样式
8. 在 JSON 的 `activities` 数组中添加 `"newModule"`

### 6.2 星星系统约定

- Key 格式：`{prefix}-{index}` 如 `grammar-ex-0`, `vocab-evacuate`
- 用 `StarSystem.earn(key)` 获得星星
- 用 `StarSystem.earned(key)` 检查是否已获得
- 模块星星前缀要与 `getModuleStars` 中的一致
- 每次获得星星后调用 `updateAllTabStars()` 刷新 UI

### 6.3 显示段落原文的模块注意事项

任何需要在界面上显示书籍段落原文的模块（如 Evidence、未来可能的 KWLS 等），必须：

```javascript
// 清除所有标签，只保留纯文本
const cleanPara = para
  .replace(/<\/?s>/g, '')
  .replace(/<\/?v>/g, '')
  .replace(/<\/?o>/g, '')
  .replace(/<g [^>]*>([^<]*)<\/g>/g, '$1');  // ← 不能忘！

p.textContent = cleanPara;  // 用 textContent，不用 innerHTML
```

---

## 7. 本地化数据存储方案

### 7.1 当前状态

目前星星进度使用 `localStorage` 存储：
```javascript
localStorage.setItem('stars_hurricanes', JSON.stringify(stars));
```

**局限性：**
- 每个浏览器独立存储，换设备/浏览器会丢失
- 浏览器清除缓存会丢失
- 无法导出/分享学习进度
- 无法在不同设备间同步

### 7.2 推荐的本地存储方案

#### 方案 A：JSON 导出/导入（推荐，最轻量）

在书架页面（index.html）添加"导出进度"和"导入进度"按钮：

```javascript
// 导出：下载所有书籍进度为 JSON 文件
function exportProgress() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('stars_')) {
      data[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reading-progress-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 导入：从 JSON 文件恢复进度
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    alert('进度已恢复！');
    location.reload();
  };
  reader.readAsText(file);
}
```

**优点：** 无需服务器、跨设备（通过文件传输）、可备份
**缺点：** 需要手动操作

#### 方案 B：IndexedDB（适合大数据量）

如果未来需要存储更复杂的数据（如作文、笔记、学习时长统计），可以升级为 IndexedDB：

```javascript
// 使用 localForage 库简化 IndexedDB 操作
// <script src="https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js"></script>

await localforage.setItem('stars_hurricanes', stars);
const data = await localforage.getItem('stars_hurricanes');
```

#### 方案 C：GitHub 用户登录 + Issues（高级）

利用 GitHub API 将进度保存到用户的 GitHub 仓库：
- 用户登录 GitHub
- 每本书的进度保存为一个 JSON 文件
- 推送到用户的 fork 或特定分支

**优点：** 自动同步、跨设备、版本历史
**缺点：** 需要 GitHub 账号、实现复杂

### 7.3 推荐实施路径

**第一步（最简单）：** 添加导出/导入按钮到书架页面
- 修改 `index.html` 添加两个按钮
- 创建 `js/progress-io.js` 处理导出导入逻辑
- 不需要修改任何模块代码

**第二步（可选）：** 添加自动备份
- 每次完成一本书时，自动将进度导出为 JSON 并提示下载
- 或者使用 IndexedDB 作为主存储，localStorage 作为缓存

**第三步（远期）：** 考虑 GitHub 集成
- 如果目标用户有 GitHub 账号
- 可以实现进度自动同步到云端

### 7.4 导出/导入功能的 UI 设计建议

```
书架页面右上角添加：
[📤 导出进度] [📥 导入进度]

导出时：
- 弹出对话框显示将导出 X 本书的进度
- 下载文件名：reading-progress-2026-07-16.json
- 文件内容示例：
  {
    "stars_hurricanes": {"vocab-evacuate": true, "ev-q1": true, ...},
    "stars_mummies": {"vocab-afterlife": true, ...},
    "stars_nobel-prize": {"grammar-ex-0": true, ...}
  }

导入时：
- 打开文件选择器，选择 .json 文件
- 显示即将导入 X 本书的进度
- 确认后写入 localStorage 并刷新页面
```

---

## 附录 A：快速启动清单

制作一本新书时，按此清单操作：

```
□ 1. 提取 PDF 正文 → 写入 sections.paragraphs
□ 2. 阅读 LP → 记录 grammar target, vocabulary, questions
□ 3. 添加 vocabulary（Story Critical + Enrichment + Academic）
□ 4. 添加 <g> 语法高亮标签到段落
□ 5. 创建 grammar 字段（rules + wordBuilding + exercises）
□ 6. 编写 questions（覆盖 LP 的 text-dependent questions）
□ 7. 编写 notes（vocab + grammar + evidence 侧栏讲解）
□ 8. 按需添加 summarizeActivities / problemSolution / authorPurpose 等
□ 9. 在 index.html 添加书籍信息
□ 10. 在浏览器测试所有 Tab
□ 11. LP 对照检查（见第5节清单）
□ 12. git commit & push
```

## 附录 B：常用 Python 脚本

```python
# 批量删除旧标签
import re, json

with open('books/book.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for section in data['sections']:
    section['paragraphs'] = [
        re.sub(r'<[svo]>(.*?)</[svo]>', r'\1', p)
        for p in section['paragraphs']
    ]

with open('books/book.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 检查残留标签
import re
text = open('books/book.json', 'r', encoding='utf-8').read()
tags = re.findall(r'<[sgvo][^>]*>|</[sgvo]>', text)
if tags:
    print('残留标签:', tags[:10])
else:
    print('干净，无残留标签')
```

---

*手册版本: 1.0 | 更新日期: 2026-07-16*
