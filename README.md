# Reading A-Z Interactive Book Platform

Interactive teaching website for Reading A-Z leveled books. Deploy on GitHub Pages.

## Features

Each book configures its own activities via JSON — the same template engine supports any combination:

- 📖 **Read** — Full text with sentence annotations + study notes
- 🔢 **Sequence Events** — Drag & drop events onto a timeline
- ❓ **Evidence Q&A** — Highlight text evidence, then answer questions
- 📝 **Summarize** — Select key details, arrange with transition words
- 📚 **Vocabulary** — Word Wall + Matching + Fill-in-the-blank
- ⌨️ **Typing** — Type sentences with vocabulary, WPM tracking
- 🎯 **Author's Purpose** — Identify Inform/Entertain/Persuade with evidence
- 📊 **KWLS Chart** — What I Know / Want to Know / Learned / Still Want to Know
- 🔤 **Pronoun Agreement** — Replace nouns with correct pronouns
- 📐 **Grammar** — Interactive grammar exercises based on each book's Lesson Plan
- 🔥 **Problem & Solution** — Identify problems, causes, effects, and solutions
- ⭐ **Star System** — Gamified progress tracking with localStorage

## Book Activity Examples

| Book | Activities |
|------|-----------|
| A New Skyline | Read, Sequence, Evidence, Summarize, Vocab, Grammar, Typing |
| Ancient Greek and Roman Gods | Read, Evidence, Author's Purpose, KWLS, Pronoun, Vocab, Grammar, Typing |
| Ancient Mesopotamia | Read, Sequence, Evidence, Summarize, Vocab, Grammar, Typing |
| Color Blindness | Read, Evidence, Author's Purpose, KWLS, Vocab, Grammar, Typing |
| Climbing Mountains | Read, Evidence, Author's Purpose, Summarize, Vocab, Grammar, Typing |
| Atlantic Crossing | Read, Evidence, Summarize, Vocab, Grammar, Typing |
| Hurricanes | Read, Evidence, Problem & Solution, Vocab, Grammar, Typing |
| Mummies | Read, Evidence, Summarize, Vocab, Grammar, Typing |
| The Nobel Prize | Read, Evidence, Summarize, Author's Purpose, Vocab, Grammar, Typing |
| Curiosity on Mars | Read, Evidence, Summarize, Vocab, Grammar, Typing |
| Desert People | Read, Evidence, Summarize, Vocab, Grammar, Typing |
| Earthquakes, Volcanoes, and Tsunamis | Read, Evidence, KWLS, Vocab, Grammar, Typing |

## How to Add a New Book

### ⚠️ Step 0: Analyze the Lesson Plan (MANDATORY)

Every book in Reading A-Z comes with a Lesson Plan (LP). **The LP drives ALL module decisions.** Before writing any JSON, read the LP carefully and extract:

| LP Section | Maps To | Why It Matters |
|---|---|---|
| **Targeted Reading Strategy** | `summarize` / `kwls` / `authorPurpose` | Core comprehension approach (Summarize? Ask & Answer? Visualize?) |
| **Comprehension Skill** | `evidence` questions + `problemSolution` / `kwls` | The analytical lens (Main Idea? Compare/Contrast? Fact or Opinion? Cause & Effect?) |
| **Grammar and Mechanics** | `grammar` module (**REQUIRED**) | Every LP specifies a grammar focus — this MUST become a `grammar` module |
| **Word Work** | `grammar` module (integrated) | Synonyms/antonyms, compound words, number words — integrated into grammar exercises |
| **Vocabulary** | `vocabulary` module | Story-critical + enrichment words from the LP |
| **CQ / Quick Check** | `evidence` questions | CQ quiz questions must be woven into evidence module questions |

**Key principles:**
1. **Grammar is NOT optional.** Every book's LP has a "Build Skills → Grammar and Mechanics" section. This must be implemented as a `grammar` activity with contextual exercises using sentences from the book text.
2. **Word Work belongs in Grammar.** The LP's "Word Work" section (synonyms/antonyms, compound words, number words, etc.) should be integrated into the `grammar` module as additional exercise types.
3. **For young learners with weak grammar foundations**, the grammar module must be engaging and contextual:
   - Start with **wordBuilding** (show HOW to form/construct the grammar element)
   - Then **exercises** using actual sentences from the book
   - Never teach grammar in isolation — always tie back to the reading text

### 1. Create the JSON data file

Create a new file in `books/` named `your-book-id.json`. Use this schema:

```jsonc
{
  "meta": {
    "id": "your-book-id",
    "title": "Your Book Title",
    "level": "W",
    "author": "Author Name",
    "focusQuestion": "Main question for the book?"
  },

  // REQUIRED: List which activity modules this book uses
  "activities": ["read", "sequence", "evidence", "summarize", "vocabulary", "typing", "authorPurpose", "kwls", "pronoun"],
  // (Only include the ones your book needs!)

  "sections": [ ... ],
  "vocabulary": [ ... ],
  "questions": [ ... ],
  // ... other module-specific data
}
```

**Available activities:**
- `read` — always include
- `sequence` — needs `sequenceEvents` array
- `evidence` — needs `questions` array (integrate CQ/Quick Check questions here)
- `summarize` — needs `summarizeActivities` array
- `vocabulary` — needs `vocabulary` array
- `typing` — uses `vocabulary` sentences
- `authorPurpose` — needs `authorPurpose` object
- `kwls` — needs `kwls` object
- `pronoun` — needs `pronounAgreement` array
- `grammar` — needs `grammar` object (**required for every book — based on LP**)
- `problemSolution` — needs `problemSolution` array

  "vocabulary": [
    {
      "word": "example",
      "pos": "n.",
      "definition": "the definition from the glossary",
      "section": "section-id",
      "sentence": "The sentence from the text using this word.",
      "quiz": {
        "prompt": "\"Example\" is closest in meaning to:",
        "options": ["correct meaning", "wrong 1", "wrong 2", "wrong 3"],
        "answer": 0
      }
    }
  ],

  "sequenceEvents": [
    {
      "event": "Event Name",
      "year": 1900,
      "detail": "Additional detail",
      "order": 1
    }
  ],

  "questions": [
    {
      "id": "q1",
      "level": 1,
      "question": "The question text?",
      "section": "section-id",
      "pages": "4",
      "evidence": "The evidence sentence from the text.",
      "choices": ["Correct answer.", "Wrong 1.", "Wrong 2.", "Wrong 3."],
      "correctChoice": 0,
      "explanation": "Why this is the correct answer."
    }
  ],

  "summarizeActivities": [
    {
      "section": "section-id",
      "sectionTitle": "Section Title",
      "mainIdea": "The main idea of this section.",
      "keyDetails": ["Detail 1", "Detail 2"],
      "distractors": ["Wrong detail"],
      "transitionWords": ["First", "Next", "Then", "Finally"]
    }
  ],

  // REQUIRED: Grammar module based on Lesson Plan "Build Skills → Grammar and Mechanics"
  // Integrates both grammar AND word work (synonyms, compound words, number words, etc.)
  "grammar": {
    "target": "adverbs",                    // The grammar focus from the LP
    "title": "Adverbs",                     // Display title
    "explanation": "Simple kid-friendly explanation of the grammar concept.",
    "rules": [
      "Rule 1: Most adverbs are formed by adding -ly to an adjective.",
      "Rule 2: Some adverbs don't end in -ly: soon, very, often."
    ],
    "wordBuilding": [                      // Show HOW to form/construct the element
      { "base": "rapid", "answer": "rapidly" }   // For prepositions: "above" → "above the planet"
    ],                                        // For commas: "gas ash rock" → "gas, ash, and rock"
    "exercises": [                           // Mix of types, all using sentences FROM THE BOOK
      {
        "type": "identify",                  // Find the grammar element in a book sentence
        "sentence": "The upward-moving air rapidly cools.",
        "answers": ["rapidly"],
        "hint": "Which word tells HOW the air cools?"
      },
      {
        "type": "multipleChoice",            // Which word is the grammar element?
        "question": "Which word is an adverb?",
        "sentence": "Satellites orbiting high above Earth take frequent pictures.",
        "options": ["Satellites", "orbiting", "high", "frequent"],
        "answer": 2
      },
      {
        "type": "fillBlank",                 // Choose the correct form
        "sentence": "The storm _____ (final/finally) moved inland.",
        "answer": "finally"
      },
      {
        "type": "synonym",                   // Word Work: synonyms/antonyms (LP-driven)
        "word": "cry",
        "prompt": "Which word is a SYNONYM of \"cry\"?",
        "options": ["laugh", "weep", "run", "shout"],
        "answer": 1
      },
      {
        "type": "compoundWord",              // Word Work: compound words (LP-driven)
        "word": "landslide",
        "prompt": "What two words make up \"landslide\"?",
        "answer": "land + slide"
      },
      {
        "type": "numberWord",                // Word Work: number words (LP-driven)
        "display": "49°C",
        "prompt": "How do you read this aloud?",
        "answer": "forty-nine degrees Celsius"
      }
    ]
  },

  "notes": {
    "section-id": [
      {
        "type": "vocab",
        "title": "Word",
        "content": "Simple definition for students."
      },
      {
        "type": "grammar",
        "title": "Grammar Point",
        "content": "Explanation of the grammar concept."
      }
    ]
  }
}
```

### 2. Add the book to the bookshelf

Edit `index.html` and add the book to the `books` array:

```javascript
const books = [
  {
    id: 'a-new-skyline',
    title: 'A New Skyline',
    author: 'Susan Lennox',
    level: 'W'
  },
  {
    id: 'your-book-id',
    title: 'Your Book Title',
    author: 'Author Name',
    level: 'X'
  }
];
```

### 3. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/readinga-z-interactive.git
git push -u origin main
```

Then go to **Settings → Pages → Source → Deploy from branch → main → / (root)**.

## File Structure

```
├── index.html          # Bookshelf (lists all books)
├── reader.html         # Dynamic template engine (minimal skeleton)
├── README.md           # This file
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── app.js          # Dynamic controller (reads activities config)
│   ├── stars.js        # Star system + localStorage
│   ├── sequence.js     # 🔢 Sequence Events module
│   ├── evidence.js     # ❓ Q&A with Evidence module
│   ├── summarize.js    # 📝 Summarize module
│   ├── vocabulary.js   # 📚 Vocabulary module
│   ├── typing.js       # ⌨️ Typing speed test
│   ├── authorPurpose.js# 🎯 Author's Purpose module
│   ├── kwls.js         # 📊 KWLS Chart module
│   ├── pronoun.js      # 🔤 Pronoun Agreement module
│   ├── grammar.js      # 📐 Grammar module (LP-driven)
│   └── progress-io.js  # Progress tracking (user-added)
└── books/
    ├── a-new-skyline.json
    └── ancient-greek-gods.json
```

## Tips for Creating Book JSON

- **Start with the Lesson Plan** — The LP tells you exactly which modules to build. Read the "Objectives", "Build Skills → Grammar", and "Word Work" sections carefully.
- **Vocabulary**: Use words from the book's Glossary page. Include both story-critical and enrichment words from the LP.
- **Questions**: Integrate CQ/Quick Check questions into the evidence module. Match the LP's comprehension skill focus.
- **Sequence Events**: Use timeline/chart data from the book
- **Summarize**: One activity per major section, with 3-4 key details + 1-2 distractors
- **Notes**: Vocab notes (green) and grammar notes (orange) for the Read tab sidebar
- **Grammar (REQUIRED)**: Every book MUST have a `grammar` module based on the LP:
  - Read the LP's "Build Skills → Grammar and Mechanics" section to identify the grammar focus
  - Read the LP's "Word Work" section to identify vocabulary exercises (synonyms/antonyms, compound words, number words, etc.)
  - Design `wordBuilding` to show HOW to form/construct the grammar element
  - Create exercises using **actual sentences from the book text** — never teach grammar in isolation
  - Integrate word work as additional exercise types (`synonym`, `antonym`, `compoundWord`, `numberWord`)
  - For young learners: keep explanations simple, use visual/contextual clues, tie everything back to the reading
- **Answer distribution**: Questions and vocabulary quizzes should have balanced A/B/C/D correct answers (~25% each). Options should be similar in length with deceptive distractors.

## Browser Support

Works in all modern browsers. Tested on Chrome, Firefox, Safari, Edge.
