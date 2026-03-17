# FUCS Exam Prep — Claude Code Project Guide

## Project Overview
Medical exam preparation platform for FUCS (Fundación Universitaria de Ciencias de la Salud, Colombia). 
1000 questions extracted from simulacros 2019-2024, with AI-powered tutor using Claude Sonnet 4.6.

## Tech Stack
- **Frontend:** React 18 + Vite 6
- **Styling:** CSS-in-JS (inline styles), dark theme (#08061a), purple gradients
- **AI:** Claude Sonnet 4.6 via Anthropic API (`claude-sonnet-4-6`)
- **Backend:** Vercel Serverless Functions (Node 20)
- **Deploy:** Vercel (auto-deploy from GitHub)
- **Repo:** github.com/Ddropero/fucs-exam-prep

## Project Structure
```
fucs-exam-prep/
├── api/
│   ├── chat.js          # Serverless proxy to Anthropic API (protects API key)
│   └── health.js        # Diagnostic endpoint (/api/health)
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AITutor.jsx  # Chat widget with Claude (appears after answering)
│   │   └── Icons.jsx    # SVG icon components
│   ├── data/
│   │   └── questions.js # 1000 questions bank (598KB)
│   ├── App.jsx          # Main app: Home, Quiz, Results, Study screens
│   ├── index.css        # Global styles, scrollbar, animations
│   └── main.jsx         # React entry point
├── .env.example         # Template for ANTHROPIC_API_KEY
├── vercel.json          # Vercel config (Vite + Node 20 functions)
├── package.json         # Dependencies (React 18, Vite 6)
└── CLAUDE.md            # This file
```

## App Modes
1. **Simulacro (Quiz):** Configurable quiz (5/10/20/50/100 questions), specialty filter, real-time score, progress bar
2. **Estudio (Study):** Flashcard navigation with tap-to-reveal, specialty filter
3. **Tutor IA:** Chat with Claude after each question — knows the question context, correct answer, and student's response

## Question Bank Format (src/data/questions.js)
```javascript
{
  id: 1,
  specialty: "Fisiología",     // One of 9 specialties
  topic: "Cardiovascular",     // Sub-topic
  year: "2019",                // Simulacro year
  difficulty: "alta",          // alta | media
  question: "...",             // Question text
  options: ["A", "B", "C", "D"],  // Answer options
  correct: 1,                  // 0-based index of correct answer
  explanation: "..."           // Medical explanation
}
```

## 9 Specialties Distribution
- Epidemiología: 226 questions
- Cirugía: 207
- Medicina Interna: 131
- Pediatría: 97
- Fisiología: 94
- Ginecología: 76
- Patología: 70
- Anatomía: 51
- Farmacología: 48

## API Architecture
Frontend (`/api/chat` POST) → Vercel Serverless → Anthropic API

The serverless function:
- Reads ANTHROPIC_API_KEY from environment variable
- Builds system prompt with full question context
- Proxies to Claude Sonnet 4.6
- Returns all errors as HTTP 200 with descriptive `reply` field (never silent failures)

## Development Commands
```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (no API functions)
vercel dev               # Start with serverless functions (requires vercel CLI)
npm run build            # Production build → dist/
```

## Environment Variables
- `ANTHROPIC_API_KEY` — Required for Tutor IA feature. Set in Vercel dashboard or .env for local dev.

## Known Issues & Decisions
- Template literal escaping in serverless functions caused silent failures → rewrote with plain string concatenation
- `vercel.json` rewrites field broke API routing → removed, using direct /api/ paths
- Serverless functions return HTTP 200 even for errors (with error message in `reply` field) for easier frontend debugging
- GitHub PAT needs explicit `repo` scope for push access
- questions.js is 598KB — the 1000 questions are embedded directly (Vite handles code splitting in production)
- High-frequency questions (Gustilo, CRF, Nodo AV, Graves, Microglia etc.) have verified answers
- Less common questions may need manual answer review

## Source Data
- Original file: FUCS_2019-2024_.pdf (actually a UTF-8 text file, 8475 lines)
- 8 simulacro sections parsed → 1217 MCQs → 1155 after dedup → 1000 selected with specialty balancing
- Pattern analysis documented in analisis_patrones_fucs.md

## Potential Next Steps
- Add more questions or verify answers for less common specialties
- Add user progress tracking (localStorage or database)
- Add timed exam mode with countdown
- Add question bookmarking/flagging
- Add spaced repetition algorithm
- Improve AI tutor with conversation memory across questions
- Add admin panel for question CRUD
- Mobile app wrapper (React Native or PWA)
