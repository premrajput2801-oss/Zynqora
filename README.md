# Zynqora — Learn Data. Build Skills. Get Career Ready.

Zynqora is a static, responsive learning website for beginner Data Analysts. It uses HTML, CSS and vanilla JavaScript. No API key, server backend, build step, account, payment provider or paid dependency is required for the starter version.

## Features

- Premium dark navy interface with a Canvas-rendered animated data sphere (no WebGL or Three.js dependency).
- Responsive navigation and keyboard-friendly controls, with reduced-motion support.
- 14 core notes categories with original Hinglish/English explanations, steps, code/formula examples, expected output, common mistakes, use cases and practice answers.
- Power BI Charts, Maps & Visuals chapter extracted and organised from the uploaded 10-page PDF. The source's entry 29 is explicitly blank and remains unnamed here. There are 36 entries including that blank item, plus a revision sheet.
- 152 unique interview questions across Excel (20), SQL/MySQL (31), Python/Pandas (25), Power BI/DAX (25), Statistics/EDA (20) and Business/Projects/Resume/HR (31). The requested category minimums are met.
- Interactive multiple-choice quizzes with topic/difficulty selection, immediate explanations, results and restart support.
- Notes completion, note/question bookmarks, project-blueprint progress, quiz history and progress export stored in browser `localStorage`.
- Search across notes, interview questions and project blueprints.
- Six project blueprints and six demo digital products with editable INR prices.
- No recorded-video section. No real payment flow is simulated.

## Run it on Windows with VS Code

1. Extract `Zynqora_Complete_Website.zip` to a normal folder such as `C:\Users\YourName\Documents\Zynqora`.
2. Open VS Code → **File → Open Folder** → select the extracted `zynqora-website` folder.
3. For the easiest workflow, install the free **Live Server** extension in VS Code (Ritwick Dey), then right-click `index.html` and choose **Open with Live Server**.
4. The browser opens a local URL such as `http://127.0.0.1:5500`. Keep the VS Code window open while using Live Server.
5. If you do not want an extension, open PowerShell in the project folder and run:

   ```powershell
   py -m http.server 8000
   ```

   Then open `http://localhost:8000` in your browser. Stop the server with `Ctrl+C`.

The Google Fonts connection is optional visual polish. The site falls back to system fonts if you are offline; all learning content and core interactions remain local.

## Project files

- `index.html` — page structure and section headings.
- `style.css` — responsive visual design, cards, canvas fallback and reduced-motion styles.
- `app.js` — navigation, search, note rendering, bookmarks, progress, quiz behaviour and local storage.
- `notes-data.js` — educational notes, examples, exercises and Power BI visual reference. Edit this file to add learning material.
- `interview-data.js` — 152 interview questions. Edit the question groups to add more.
- `quiz-data.js` — multiple-choice quiz questions. Every item has a topic, difficulty, options, correct answer index and explanation.
- `projects-data.js` — project objectives, fields, cleaning steps, analysis questions, deliverables and presentation tips.
- `products-data.js` — demo digital products, INR prices and purchase URLs.
- `source-material/Power_BI_Charts_Maps_Easy_Notes.pdf` — the supplied source PDF for the imported Power BI notes.
- `README.md` — this guide.

## Add a new note

Open `notes-data.js` and add a new object to `window.ZYNQORA_NOTES`. Use this shape (the strings below are guidance, not an empty sample page):

```js
{
  id: "unique-note-id",
  category: "Microsoft Excel",
  title: "New note title",
  icon: "▦",
  level: "Beginner",
  summary: "One-line description",
  hinglish: "Explain it simply in Hinglish.",
  english: "A professional English definition.",
  steps: ["Step one", "Step two"],
  example: {
    label: "Example name",
    code: "=SUM(A2:A8)",
    output: "Expected total based on the sample data",
    explanation: "Why the formula works."
  },
  mistakes: ["A common mistake"],
  useCases: ["A practical use case"],
  exercises: [{question: "Practice prompt", answer: "Worked answer"}],
  source: "Original Zynqora learning notes"
}
```

Keep `id` unique. Match one of the existing category names to put the note under the intended category. `visuals` and `revision` are optional fields used by the Power BI PDF chapter.

## Add interview questions

In `interview-data.js`, add a `q("Beginner", "Question text", "Answer", "Optional practical example")` entry to the relevant category's `items` array. Supported difficulty names are `Beginner`, `Intermediate` and `Advanced`. Keep questions distinct and validate the answer before publishing.

## Add quiz questions

Add another object to `window.ZYNQORA_QUIZ` in `quiz-data.js`:

```js
{
  id: "unique-quiz-id",
  topic: "SQL and MySQL",
  difficulty: "Beginner",
  question: "Which clause filters source rows?",
  options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
  answer: 0,
  explanation: "WHERE filters rows before grouped aggregation."
}
```

`answer` is the zero-based index of the correct option. Make sure it matches `options`.

## Add a project blueprint

Add an object to `window.ZYNQORA_PROJECTS` in `projects-data.js` with a unique `id`, display `number`, `title`, `tag`, `summary`, `tools`, `objective`, `columns`, `cleaning`, `questions`, `outputs` and `presentation` fields. Describe expected deliverables, and do not write results as if you ran the analysis unless you really did.

## Configure products and future checkout

Edit `products-data.js`. `priceINR` is the displayed price in Indian rupees; `purchaseUrl` should remain an empty string until a real purchase link is set up. After configuring a legitimate checkout/provider link, put its full HTTPS URL in `purchaseUrl`. The button simply opens that link in a new tab; this website itself does not create payments, verify payment status or deliver files. Test any real checkout separately before publishing.

## Publish for free

### Option A — GitHub Pages

1. Sign in to GitHub and create a new public repository named `zynqora-learning`.
2. Upload all files from the `zynqora-website` folder to the repository root. `index.html` must be at the root, not inside an extra nested folder.
3. Open the repository's **Settings → Pages**.
4. Under the build/deployment source choose **Deploy from a branch**, select branch `main` and folder `/(root)`, then save.
5. Wait for GitHub Pages to finish deployment. The Pages panel will show the generated site URL.
6. Open that URL and test Notes, search, quizzes, bookmarks, mobile navigation and project cards.

### Option B — Netlify

1. Sign in to Netlify and use **Add new site / Deploy manually** (the menu wording may change).
2. Drag the extracted `zynqora-website` folder or select it in the deploy interface. Ensure `index.html` and the JavaScript/CSS files are at the publish root.
3. Netlify creates a free site URL. Open the deployment and run the same checks listed below.
4. If you later change files, upload/deploy the updated folder again. You can connect a GitHub repository if you prefer automatic deployments.

Both are static hosting options; availability/quotas and dashboard labels are controlled by those providers and can change over time.

## Local data and privacy

Progress and bookmarks are stored in this browser on this device under the key `zynqora-learning-v1`. There is no account sync or backend backup. Clearing browser site data or using a different browser/device will not carry progress over. **Export my progress** downloads a JSON file that you can keep as a backup. It does not import or restore files automatically in this initial build.

## Testing checklist

- [ ] Open Home and verify the data sphere moves; try reduced-motion mode if preferred.
- [ ] Use desktop and narrow/mobile viewport sizes.
- [ ] Open Notes, switch categories, search for `SUMX` or `Ribbon Chart`, expand a practice answer and mark a note complete.
- [ ] Refresh and verify the completed note remains completed.
- [ ] Bookmark an interview question, toggle bookmarks-only and refresh to check persistence.
- [ ] Take a quiz with a small number of questions, check immediate feedback, final score and quiz history, then restart.
- [ ] Search across notes, interview questions and projects.
- [ ] Expand a project blueprint and mark it explored.
- [ ] Check digital product buttons show a clearly labelled coming-soon message rather than claiming payment.
- [ ] Open the browser console. There should be no uncaught JavaScript errors during the tested flows.

## Limitations to know

- The site is a static educational starter; it does not connect to live data, an AI service, user accounts, cloud sync or a payment system.
- Product links are intentionally unconfigured; demo purchase buttons do not take money.
- No dataset has been analysed by this site to invent business outcomes. The projects are learning blueprints until you execute them with a dataset.
- Google Fonts requires an internet connection for the chosen typefaces; local system fonts are used as a fallback.
- Browser `localStorage` is local to the current browser profile and is not a secure place for sensitive information.
