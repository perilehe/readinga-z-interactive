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
- ⭐ **Star System** — Gamified progress tracking with localStorage

## Book Activity Examples

| Book | Activities |
|------|-----------|
| A New Skyline | Read, Sequence, Evidence, Summarize, Vocab, Typing |
| Ancient Greek and Roman Gods | Read, Evidence, Author's Purpose, KWLS, Pronoun, Vocab, Typing |

## How to Add a New Book

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
- `evidence` — needs `questions` array
- `summarize` — needs `summarizeActivities` array
- `vocabulary` — needs `vocabulary` array
- `typing` — uses `vocabulary` sentences
- `authorPurpose` — needs `authorPurpose` object
- `kwls` — needs `kwls` object
- `pronoun` — needs `pronounAgreement` array

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
│   └── pronoun.js      # 🔤 Pronoun Agreement module
└── books/
    ├── a-new-skyline.json
    └── ancient-greek-gods.json
```

## Tips for Creating Book JSON

- **Vocabulary**: Use words from the book's Glossary page
- **Questions**: Use the Text-Dependent Questions from the Lesson Plan
- **Sequence Events**: Use timeline/chart data from the book
- **Summarize**: One activity per major section, with 3-4 key details + 1-2 distractors
- **Notes**: Vocab notes (green) and grammar notes (orange) for the Read tab sidebar

## Browser Support

Works in all modern browsers. Tested on Chrome, Firefox, Safari, Edge.
