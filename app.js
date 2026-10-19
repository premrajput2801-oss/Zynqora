(function () {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const notes = Array.isArray(window.ZYNQORA_NOTES) ? window.ZYNQORA_NOTES : [];
  const interviews = Array.isArray(window.ZYNQORA_INTERVIEWS) ? window.ZYNQORA_INTERVIEWS : [];
  const quizBank = Array.isArray(window.ZYNQORA_QUIZ) ? window.ZYNQORA_QUIZ : [];
  const projects = Array.isArray(window.ZYNQORA_PROJECTS) ? window.ZYNQORA_PROJECTS : [];
  const products = Array.isArray(window.ZYNQORA_PRODUCTS) ? window.ZYNQORA_PRODUCTS : [];
  const STORAGE_KEY = 'zynqora-learning-v1';
  const ROADMAP = [
    {number:1,title:'Excel',short:'Tables, formulas and summaries',ids:['excel-foundations'],categories:['Microsoft Excel']},
    {number:2,title:'SQL and MySQL',short:'Queries, joins and aggregation',ids:['sql-mysql'],categories:['SQL and MySQL']},
    {number:3,title:'Python + Pandas',short:'Python, NumPy and table analysis',ids:['python-analytics','numpy','pandas'],categories:['Python for Data Analytics','NumPy','Pandas']},
    {number:4,title:'Statistics and EDA',short:'Distributions, quality and patterns',ids:['statistics','eda','data-cleaning'],categories:['Statistics for Data Analytics','Exploratory Data Analysis (EDA)','Data Cleaning']},
    {number:5,title:'Power BI + DAX',short:'Models, measures and reports',ids:['powerbi','powerbi-pdf','dax','visualization'],categories:['Microsoft Power BI','DAX Formulas','Data Visualization']},
    {number:6,title:'Portfolio projects',short:'Build, validate and explain your work',ids:['analyst-projects'],categories:['Data Analyst Projects']},
    {number:7,title:'Resume + interviews',short:'Present skills clearly and truthfully',ids:['resume-interview'],categories:['Resume and Interview Preparation']}
  ];
  const TOPIC_SYMBOLS = {
    'Microsoft Excel':'▦','SQL and MySQL':'⌘','Python for Data Analytics':'⌁','NumPy':'⠿','Pandas':'▤',
    'Data Cleaning':'⌕','Exploratory Data Analysis (EDA)':'◌','Statistics for Data Analytics':'∑','Data Visualization':'◒',
    'Microsoft Power BI':'▥','DAX Formulas':'ƒx','Business Intelligence':'◫','Data Analyst Projects':'⌂','Resume and Interview Preparation':'✦'
  };
  const state = loadState();
  let selectedNoteId = notes[0]?.id || null;
  let showOnlyBookmarks = false;
  let questionLimit = 20;
  let toastTimer;
  let quizState = null;
  let currentView = 'home';

  function loadState() {
    const base = {completedNotes:[],bookmarkedNotes:[],bookmarkedQuestions:[],completedProjects:[],quizResults:[]};
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      for (const key of Object.keys(base)) if (Array.isArray(parsed[key])) base[key] = parsed[key];
      return base;
    } catch (error) {
      return base;
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { toast('Browser storage is unavailable; changes may not persist after refresh.'); }
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function formatINR(value) {
    return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value) || 0);
  }
  function unique(values) { return [...new Set(values.filter(Boolean))]; }
  function includesQuery(value, query) { return String(value ?? '').toLocaleLowerCase().includes(query.toLocaleLowerCase()); }
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function changeView(view, updateHash = true) {
    const target = $(`[data-view="${view}"]`);
    if (!target) view = 'home';
    currentView = view;
    $$('.view').forEach(section => {
      const active = section.dataset.view === view;
      section.classList.toggle('active', active);
      section.hidden = !active;
      if (active) section.setAttribute('aria-current','page'); else section.removeAttribute('aria-current');
    });
    $$('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.go === view));
    $('#primary-nav')?.classList.remove('open');
    $('#menu-toggle')?.setAttribute('aria-expanded','false');
    $('#menu-toggle')?.setAttribute('aria-label','Open navigation');
    if (updateHash && location.hash !== `#${view}`) history.replaceState(null,'',`#${view}`);
    window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    if (view === 'notes') renderNotes();
    if (view === 'interviews') renderInterviews();
    if (view === 'dashboard') renderDashboard();
    if (view === 'projects') renderProjects();
    if (view === 'products') renderProducts();
    if (view === 'search') { const input = $('#global-search'); if (input) input.focus({preventScroll:true}); }
  }
  function populateSelect(selector, values, firstLabel) {
    const select = $(selector);
    if (!select) return;
    const existing = select.value;
    const options = [`<option value="all">${escapeHtml(firstLabel)}</option>`, ...values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join('');
    select.innerHTML = options;
    if (values.includes(existing)) select.value = existing;
  }
  function renderHome() {
    const homeRoadmap = $('#home-roadmap');
    if (homeRoadmap) homeRoadmap.innerHTML = ROADMAP.map(stage => {
      const complete = stage.ids.every(id => state.completedNotes.includes(id));
      return `<button class="roadmap-item" data-go="${stage.number === 6 ? 'projects' : stage.number === 7 ? 'interviews' : 'notes'}" aria-label="Stage ${stage.number}: ${escapeHtml(stage.title)}">
        <span class="roadmap-num">${String(stage.number).padStart(2,'0')}</span>${complete ? '<span class="roadmap-tick" aria-label="Completed">✓</span>' : ''}
        <strong>${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.short)}</small></button>`;
    }).join('');
    const featuredIds = ['excel-foundations','sql-mysql','python-analytics','powerbi-pdf'];
    const featured = featuredIds.map(id => notes.find(note => note.id === id)).filter(Boolean);
    const featureGrid = $('#featured-notes');
    if (featureGrid) featureGrid.innerHTML = featured.map(note => `<button class="topic-card" data-open-note="${escapeHtml(note.id)}"><span class="topic-symbol">${escapeHtml(note.icon || '◈')}</span><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.summary)}</p><span class="card-foot"><span>${escapeHtml(note.category)}</span><span class="card-arrow">↗</span></span></button>`).join('');
    const projectGrid = $('#featured-projects');
    if (projectGrid) projectGrid.innerHTML = projects.slice(0,3).map(projectCardPreview).join('');
  }
  function renderNotes() {
    populateSelect('#notes-category', unique(notes.map(note => note.category)), 'All topics');
    const query = $('#notes-search')?.value.trim() || '';
    const category = $('#notes-category')?.value || 'all';
    const filtered = notes.filter(note => {
      const searchable = [note.title,note.category,note.summary,note.hinglish,note.english,...(note.steps || []),...(note.visuals || []).map(item => `${item.name} ${item.definition} ${item.use} ${item.example}`)].join(' ');
      return (category === 'all' || note.category === category) && (!query || includesQuery(searchable,query));
    });
    const grid = $('#notes-grid');
    if (!grid) return;
    $('#notes-count').textContent = `${filtered.length} note${filtered.length === 1 ? '' : 's'}`;
    grid.innerHTML = filtered.length ? filtered.map(note => `<button class="note-card ${selectedNoteId === note.id ? 'selected' : ''}" data-note-id="${escapeHtml(note.id)}" aria-pressed="${selectedNoteId === note.id}">
      <span class="note-icon">${escapeHtml(note.icon || '◈')}</span><span class="category-label">${escapeHtml(note.category)}</span><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.summary)}</p><span class="card-foot"><span>${state.completedNotes.includes(note.id) ? '✓ Completed' : escapeHtml(note.level || 'Beginner')}</span><span class="card-arrow">${state.bookmarkedNotes.includes(note.id) ? '★' : '↗'}</span></span></button>`).join('') : '<div class="empty-results">No notes match your search. Try another keyword or choose “All topics”.</div>';
    if (filtered.length && !filtered.some(note => note.id === selectedNoteId)) selectedNoteId = filtered[0].id;
    if (selectedNoteId && filtered.some(note => note.id === selectedNoteId)) renderNoteDetail(selectedNoteId);
    else if (!filtered.length) $('#note-detail').innerHTML = '<div class="detail-empty"><div class="empty-symbol">⌕</div><h2>No matching notes</h2><p>Clear the search or switch to another category.</p></div>';
  }
  function renderNoteDetail(id) {
    const note = notes.find(item => item.id === id);
    const panel = $('#note-detail');
    if (!note || !panel) return;
    const isComplete = state.completedNotes.includes(id);
    const isBookmarked = state.bookmarkedNotes.includes(id);
    const list = items => `<ul>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    const exercises = (note.exercises || []).map((exercise,index) => `<details class="exercise-item"><summary>Practice ${index+1}: ${escapeHtml(exercise.question)}</summary><p><strong>Answer:</strong> ${escapeHtml(exercise.answer).replace(/\n/g,'<br>')}</p></details>`).join('');
    const visuals = (note.visuals || []).length ? `<div class="detail-section"><h3>Visual reference from the uploaded PDF (${note.visuals.length} entries)</h3><p>Use this as a quick reference. Entry 29 is blank in the source, so the name is intentionally not supplied.</p><div class="visual-reference-grid">${note.visuals.map(item => `<article class="visual-reference"><div class="visual-reference-top"><span>${String(item.number).padStart(2,'0')}</span><strong>${item.name ? escapeHtml(item.name) : 'Name blank in source PDF'}</strong></div><p><b>Definition:</b> ${escapeHtml(item.definition)}</p><p><b>Use:</b> ${escapeHtml(item.use)}</p><p><b>Example:</b> ${escapeHtml(item.example)}</p><small>Remember: ${escapeHtml(item.memory)}</small></article>`).join('')}</div></div>` : '';
    const revision = (note.revision || []).length ? `<div class="detail-section"><h3>Super-easy revision sheet</h3><div class="revision-list">${note.revision.map(item => `<div><span>${escapeHtml(item.need)}</span><strong>${escapeHtml(item.use)}</strong></div>`).join('')}</div></div>` : '';
    panel.innerHTML = `<div class="detail-header"><div><div class="detail-badges"><span class="soft-tag">${escapeHtml(note.category)}</span><span class="soft-tag">${escapeHtml(note.level || 'Beginner')}</span></div><h2>${escapeHtml(note.title)}</h2><p class="muted-copy" style="font-size:10px;margin:0">${escapeHtml(note.summary)}</p></div><div class="detail-actions"><button class="icon-button ${isBookmarked ? 'is-active' : ''}" data-action="toggle-note-bookmark" data-id="${escapeHtml(id)}" aria-label="${isBookmarked ? 'Remove note bookmark' : 'Bookmark note'}" aria-pressed="${isBookmarked}">${isBookmarked ? '★' : '☆'}</button></div></div>
      <div class="detail-section definition-box"><strong>SIMPLE HINGLISH</strong><p>${escapeHtml(note.hinglish)}</p></div>
      <div class="detail-section"><h3>Professional English definition</h3><p>${escapeHtml(note.english)}</p></div>
      <div class="detail-section"><h3>Step-by-step workflow</h3>${list(note.steps)}</div>
      <div class="detail-section"><h3>Example: ${escapeHtml(note.example?.label || 'Practical application')}</h3><p>${escapeHtml(note.example?.explanation || '')}</p><div class="code-example"><div class="code-example-head"><span>EXAMPLE / FORMULA</span><span>READABLE SAMPLE</span></div><pre><code>${escapeHtml(note.example?.code || 'No code example for this topic.')}</code></pre><div class="expected-output"><b>Expected output / result</b><br>${escapeHtml(note.example?.output || 'Follow the steps and validate the result.')}</div></div></div>
      <div class="detail-section"><h3>Common beginner mistakes</h3>${list(note.mistakes)}</div>
      <div class="detail-section"><h3>Practical use cases</h3>${list(note.useCases)}</div>
      <div class="detail-section"><h3>Try it yourself</h3>${exercises || '<p>No exercises are available yet.</p>'}</div>
      ${visuals}${revision}<div class="detail-section"><button class="button ${isComplete ? 'button-secondary progress-toggle done' : 'button-primary progress-toggle'}" data-action="toggle-note-complete" data-id="${escapeHtml(id)}"><span>${isComplete ? '✓ Marked complete' : '○ Mark note complete'}</span></button><p class="source-note">${escapeHtml(note.source || 'Original Zynqora learning notes')}</p></div>`;
  }
  function renderInterviews() {
    const categories = unique(interviews.map(item => item.category));
    populateSelect('#interview-category', categories, 'All categories');
    const query = $('#interview-search')?.value.trim() || '';
    const category = $('#interview-category')?.value || 'all';
    const difficulty = $('#interview-difficulty')?.value || 'all';
    const filtered = interviews.filter(item => {
      const searchable = [item.question,item.answer,item.example,item.category].join(' ');
      return (category === 'all' || item.category === category) && (difficulty === 'all' || item.difficulty === difficulty) && (!showOnlyBookmarks || state.bookmarkedQuestions.includes(item.id)) && (!query || includesQuery(searchable,query));
    });
    const shown = filtered.slice(0,questionLimit);
    $('#interview-count').textContent = `${filtered.length} result${filtered.length===1?'':'s'}`;
    const summary = $('#interview-summary');
    if (summary) summary.innerHTML = `<span class="stat-pill"><strong>${interviews.length}</strong> questions</span><span class="stat-pill"><strong>${unique(interviews.map(x=>x.category)).length}</strong> skill areas</span><span class="stat-pill"><strong>${interviews.filter(x=>x.difficulty==='Beginner').length}</strong> beginner-friendly</span>`;
    const list = $('#question-list');
    if (list) list.innerHTML = shown.length ? shown.map((item,index) => {
      const bookmarked = state.bookmarkedQuestions.includes(item.id);
      const levelClass = item.difficulty.toLowerCase();
      return `<article class="question-card" data-question-card="${escapeHtml(item.id)}"><div class="question-num">${String(index+1).padStart(2,'0')}</div><div class="question-main"><h3>${escapeHtml(item.question)}</h3><div class="question-tags"><span>${escapeHtml(item.category)}</span><span class="level-${escapeHtml(levelClass)}">${escapeHtml(item.difficulty)}</span></div><button class="answer-toggle" data-action="toggle-answer" data-id="${escapeHtml(item.id)}" aria-expanded="false">View answer +</button><div class="answer-content" hidden><p>${escapeHtml(item.answer)}</p>${item.example ? `<p><strong>Example:</strong> ${escapeHtml(item.example)}</p>` : ''}</div></div><div class="question-controls"><button class="icon-button ${bookmarked?'is-active':''}" data-action="toggle-question-bookmark" data-id="${escapeHtml(item.id)}" aria-label="${bookmarked?'Remove bookmark':'Bookmark question'}" aria-pressed="${bookmarked}">${bookmarked?'★':'☆'}</button></div></article>`;
    }).join('') : '<div class="empty-results">No questions found for these filters. Clear a filter or bookmark some questions for later.</div>';
    $('#load-more-questions').hidden = shown.length >= filtered.length;
    $('#show-bookmarks').classList.toggle('is-active',showOnlyBookmarks);
    $('#show-bookmarks').textContent = showOnlyBookmarks ? 'Show all questions' : `☆ Bookmarks only (${state.bookmarkedQuestions.length})`;
  }
  function renderQuizTopics() {
    populateSelect('#quiz-topic', unique(quizBank.map(item => item.topic)), 'Mixed topics');
  }
  function startQuiz(event) {
    event?.preventDefault();
    const topic = $('#quiz-topic')?.value || 'all';
    const difficulty = $('#quiz-difficulty')?.value || 'all';
    const requested = Number($('#quiz-length')?.value || 10);
    let pool = quizBank.filter(item => (topic==='all' || item.topic===topic) && (difficulty==='all' || item.difficulty===difficulty));
    if (!pool.length) { toast('No quiz questions match those filters. Try a different topic or level.'); return; }
    pool = pool.slice().sort(() => Math.random() - .5).slice(0,Math.min(requested,pool.length));
    quizState = {questions:pool,index:0,answers:[],selected:null,revealed:false,topic,difficulty,startedAt:Date.now()};
    renderQuizQuestion();
  }
  function renderQuizQuestion() {
    const shell = $('#quiz-shell');
    if (!shell || !quizState) return;
    if (quizState.index >= quizState.questions.length) { finishQuiz(); return; }
    const question = quizState.questions[quizState.index];
    const answered = quizState.revealed;
    const selected = quizState.selected;
    shell.innerHTML = `<div class="quiz-live"><div class="quiz-live-top"><span>${escapeHtml(question.topic)} · ${escapeHtml(question.difficulty)}</span><span>QUESTION ${quizState.index+1} / ${quizState.questions.length}</span></div><div class="quiz-progress-track"><i style="width:${(quizState.index/quizState.questions.length)*100}%"></i></div><h2>${escapeHtml(question.question)}</h2><div class="quiz-options">${question.options.map((option,index) => {
      let cls = '';
      if (answered && index === question.answer) cls = ' correct';
      else if (answered && index === selected && index !== question.answer) cls = ' incorrect';
      return `<button class="quiz-option${cls}" data-quiz-option="${index}" ${answered?'disabled':''}><span class="option-letter">${String.fromCharCode(65+index)}</span><span>${escapeHtml(option)}</span></button>`;
    }).join('')}</div>${answered ? `<div class="quiz-feedback ${selected===question.answer?'good':'bad'}"><strong>${selected===question.answer?'Correct — nice work.':'Not quite; use this to learn.'}</strong><br>${escapeHtml(question.explanation)}</div>` : ''}<div class="quiz-live-actions"><small>${quizState.answers.filter(a=>a.correct).length} correct so far</small>${answered ? `<button class="button button-primary" data-action="quiz-next">${quizState.index === quizState.questions.length-1 ? 'See results' : 'Next question'} <span>→</span></button>` : '<small>Select one answer to see feedback.</small>'}</div></div>`;
  }
  function chooseQuizOption(index) {
    if (!quizState || quizState.revealed) return;
    const question = quizState.questions[quizState.index];
    quizState.selected = index;
    quizState.revealed = true;
    quizState.answers.push({questionId:question.id,question:question.question,selected:index,correct:index===question.answer,answer:question.answer,explanation:question.explanation});
    renderQuizQuestion();
  }
  function nextQuizQuestion() {
    if (!quizState || !quizState.revealed) return;
    quizState.index += 1;
    quizState.selected = null;
    quizState.revealed = false;
    renderQuizQuestion();
  }
  function finishQuiz() {
    if (!quizState) return;
    const correct = quizState.answers.filter(item => item.correct).length;
    const total = quizState.questions.length;
    const percent = Math.round((correct/total)*100);
    const result = {id:`attempt-${Date.now()}`,date:new Date().toISOString(),topic:quizState.topic==='all'?'Mixed topics':quizState.topic,difficulty:quizState.difficulty==='all'?'Mixed levels':quizState.difficulty,correct,total,percentage:percent,questionIds:quizState.questions.map(item=>item.id)};
    state.quizResults.unshift(result);
    state.quizResults = state.quizResults.slice(0,20);
    saveState();
    const review = quizState.answers.map((answer,index) => `<li><strong>${index+1}. ${escapeHtml(answer.question)}</strong><br>${answer.correct?'Correct.':'Review the concept.'} ${escapeHtml(answer.explanation)}</li>`).join('');
    $('#quiz-shell').innerHTML = `<div class="quiz-result"><div class="eyebrow">ROUND COMPLETE</div><div class="result-ring" aria-label="Quiz score">${percent}%</div><div class="result-score">${correct}<small> / ${total}</small></div><h2>${percent>=80?'Strong work. Keep practising.':percent>=50?'Good progress. Review the explanations.':'A useful first round. Try again after revision.'}</h2><p>${escapeHtml(result.topic)} · ${escapeHtml(result.difficulty)} · Results saved on this device.</p><div class="result-review"><h3>Answer review</h3><ol>${review}</ol></div><div class="hero-actions" style="justify-content:center"><button class="button button-primary" data-action="quiz-restart">Try another round <span>↗</span></button><button class="button button-secondary" data-go="dashboard">View progress</button></div></div>`;
    quizState = null;
  }
  function renderDashboard() {
    const completed = state.completedNotes.length;
    const percent = notes.length ? Math.round(completed/notes.length*100) : 0;
    const attempts = state.quizResults.length;
    const best = attempts ? Math.max(...state.quizResults.map(item => item.percentage || 0)) : 0;
    $('#dashboard-stats').innerHTML = `<div class="dashboard-stat"><span class="stat-label">Notes completed</span><strong>${completed}<small style="font-size:13px;color:#8193af"> / ${notes.length}</small></strong><small>${percent}% of the library</small></div><div class="dashboard-stat"><span class="stat-label">Question bookmarks</span><strong>${state.bookmarkedQuestions.length}</strong><small>Saved for revision</small></div><div class="dashboard-stat"><span class="stat-label">Quiz attempts</span><strong>${attempts}</strong><small>Recent results on this device</small></div><div class="dashboard-stat"><span class="stat-label">Best quiz score</span><strong>${best}%</strong><small>${attempts?'Across saved attempts':'Take your first quiz'}</small></div>`;
    const roadmap = $('#dashboard-roadmap');
    roadmap.innerHTML = ROADMAP.map(stage => {
      const done = stage.ids.filter(id => state.completedNotes.includes(id)).length;
      const total = stage.ids.length;
      const progress = total ? Math.round(done/total*100) : 0;
      const complete = progress === 100;
      return `<div class="roadmap-row"><span class="roadmap-num">${String(stage.number).padStart(2,'0')}</span><div><strong>${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.short)}</small></div><span class="roadmap-status ${complete?'complete':''}">${complete?'Complete':`${done}/${total} notes`}</span><div class="roadmap-progress"><i style="width:${progress}%"></i></div></div>`;
    }).join('');
    const bookmarkedQuestions = state.bookmarkedQuestions.map(id => interviews.find(item => item.id === id)).filter(Boolean).slice(0,5);
    const bookmarkedNotes = state.bookmarkedNotes.map(id => notes.find(item => item.id === id)).filter(Boolean).slice(0,3);
    $('#dashboard-bookmarks').innerHTML = bookmarkedQuestions.length || bookmarkedNotes.length ? `${bookmarkedQuestions.map(item=>`<div class="compact-row"><div><strong>${escapeHtml(item.question)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.difficulty)}</small></div><button class="text-button" data-action="open-question" data-id="${escapeHtml(item.id)}">Practise ↗</button></div>`).join('')}${bookmarkedNotes.map(item=>`<div class="compact-row"><div><strong>${escapeHtml(item.title)}</strong><small>Note bookmark · ${escapeHtml(item.category)}</small></div><button class="text-button" data-action="open-note" data-id="${escapeHtml(item.id)}">Open ↗</button></div>`).join('')}` : '<div class="compact-empty">No bookmarks yet. Save interview questions or notes to keep them here.</div>';
    $('#quiz-history').innerHTML = attempts ? state.quizResults.slice(0,5).map(item=>`<div class="compact-row"><div><strong>${escapeHtml(item.topic)}</strong><small>${new Date(item.date).toLocaleDateString()} · ${item.correct}/${item.total} correct</small></div><strong>${item.percentage}%</strong></div>`).join('') : '<div class="compact-empty">Your quiz scores will show up here after your first practice round.</div>';
  }
  function projectCardPreview(project) {
    return `<article class="project-card"><div class="project-topline"><span class="project-number">PROJECT ${escapeHtml(project.number)}</span><span class="soft-tag">${escapeHtml(project.tag)}</span></div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.summary)}</p><div class="project-tools">${(project.tools||[]).map(tool=>`<span class="tool-chip">${escapeHtml(tool)}</span>`).join('')}</div><div class="project-actions"><button class="text-button" data-go="projects">View blueprint <span>↗</span></button></div></article>`;
  }
  function renderProjects() {
    const container = $('#all-projects');
    if (!container) return;
    container.innerHTML = projects.map(project => {
      const explored = state.completedProjects.includes(project.id);
      const sectionList = (items) => `<ul>${(items||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
      return `<article class="project-card project-detail-card"><div class="project-topline"><span class="project-number">PROJECT ${escapeHtml(project.number)}</span><span class="soft-tag">${escapeHtml(project.tag)}</span></div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.summary)}</p><div class="project-tools">${(project.tools||[]).map(tool=>`<span class="tool-chip">${escapeHtml(tool)}</span>`).join('')}</div><details class="project-card-detail"><summary>Open full project blueprint</summary><h4>Objective</h4><p>${escapeHtml(project.objective)}</p><h4>Suggested dataset columns / tables</h4>${sectionList(project.columns)}<h4>Cleaning and validation steps</h4>${sectionList(project.cleaning)}<h4>Analysis questions</h4>${sectionList(project.questions)}<h4>Expected deliverables</h4>${sectionList(project.outputs)}<h4>Portfolio presentation tips</h4><p>${escapeHtml(project.presentation)}</p></details><div class="project-actions"><button class="button ${explored?'button-secondary':'button-primary'} button-small" data-action="toggle-project" data-id="${escapeHtml(project.id)}">${explored?'✓ Blueprint explored':'Mark blueprint explored'}</button></div></article>`;
    }).join('');
  }
  function renderProducts() {
    const grid = $('#product-grid');
    if (!grid) return;
    grid.innerHTML = products.map(product => `<article class="product-card"><span class="product-symbol">${escapeHtml(product.icon || '▤')}</span><span class="soft-tag">${escapeHtml(product.status || 'Coming soon')}</span><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(product.description)}</p><div class="product-bottom"><span class="product-price">${formatINR(product.priceINR)}</span><button class="button button-secondary" data-action="product-buy" data-id="${escapeHtml(product.id)}">${product.purchaseUrl ? 'Open purchase link ↗' : 'Coming soon'}</button></div></article>`).join('');
  }
  function globalSearch(query) {
    const results = $('#global-results');
    if (!results) return;
    const value = query.trim();
    if (!value) {
      results.innerHTML = '<div class="detail-empty"><div class="empty-symbol">⌕</div><h2>Start with a keyword</h2><p>Results from notes, interview questions and projects will appear here.</p></div>';
      return;
    }
    const noteMatches = notes.filter(item=>includesQuery([item.title,item.category,item.summary,item.hinglish,item.english,...(item.visuals||[]).map(v=>`${v.name} ${v.definition} ${v.use} ${v.example}`)].join(' '),value)).slice(0,6);
    const questionMatches = interviews.filter(item=>includesQuery([item.question,item.answer,item.example,item.category].join(' '),value)).slice(0,6);
    const projectMatches = projects.filter(item=>includesQuery([item.title,item.summary,item.objective,...(item.columns||[]),...(item.questions||[]),...(item.tools||[])].join(' '),value)).slice(0,6);
    const group = (title,items,renderer) => items.length ? `<div class="global-result-group"><h2>${title} <span class="muted-copy">(${items.length})</span></h2>${items.map(renderer).join('')}</div>` : '';
    results.innerHTML = group('Notes',noteMatches,item=>`<button class="global-result-card" data-open-note="${escapeHtml(item.id)}"><div><span class="global-kind">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div><span class="card-arrow">↗</span></button>`)+
      group('Interview questions',questionMatches,item=>`<button class="global-result-card" data-open-question="${escapeHtml(item.id)}"><div><span class="global-kind">${escapeHtml(item.category)} · ${escapeHtml(item.difficulty)}</span><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer.slice(0,190))}${item.answer.length>190?'…':''}</p></div><span class="card-arrow">↗</span></button>`)+
      group('Project blueprints',projectMatches,item=>`<button class="global-result-card" data-open-project="${escapeHtml(item.id)}"><div><span class="global-kind">${escapeHtml(item.tag)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div><span class="card-arrow">↗</span></button>`);
    if (!results.innerHTML) results.innerHTML = '<div class="empty-results">No matching results. Try a broader keyword such as “sales”, “JOIN”, “Power BI” or “missing values”.</div>';
  }
  function toggleArrayItem(arrayName,id) {
    const array = state[arrayName];
    const index = array.indexOf(id);
    if (index >= 0) array.splice(index,1); else array.unshift(id);
    saveState();
  }
  function openNote(id) {
    if (!notes.some(note=>note.id===id)) return;
    selectedNoteId = id;
    changeView('notes');
    renderNotes();
    const card = $(`[data-note-id="${CSS.escape(id)}"]`);
    card?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function openQuestion(id) {
    const item = interviews.find(question=>question.id===id);
    if (!item) return;
    changeView('interviews');
    $('#interview-search').value = item.question;
    $('#interview-category').value = 'all';
    $('#interview-difficulty').value = 'all';
    showOnlyBookmarks = false;
    questionLimit = 20;
    renderInterviews();
    const match = $(`[data-question-card="${CSS.escape(id)}"]`);
    if (match) {
      const button = $('[data-action="toggle-answer"]',match);
      button?.click();
      match.scrollIntoView({block:'center',behavior:'smooth'});
    }
  }
  function openProject(id) {
    changeView('projects');
    const index = projects.findIndex(project=>project.id===id);
    const cards = $$('.project-detail-card');
    if (index >= 0 && cards[index]) {
      $('details',cards[index])?.setAttribute('open','');
      cards[index].scrollIntoView({block:'center',behavior:'smooth'});
    }
  }
  function handleAction(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'toggle-note-complete') {
      toggleArrayItem('completedNotes',id);
      renderNotes(); renderHome(); renderDashboard();
      toast(state.completedNotes.includes(id) ? 'Note marked complete.' : 'Completion status removed.');
    } else if (action === 'toggle-note-bookmark') {
      toggleArrayItem('bookmarkedNotes',id);
      renderNotes(); renderDashboard();
      toast(state.bookmarkedNotes.includes(id) ? 'Note bookmarked.' : 'Note bookmark removed.');
    } else if (action === 'toggle-question-bookmark') {
      toggleArrayItem('bookmarkedQuestions',id);
      renderInterviews(); renderDashboard();
      toast(state.bookmarkedQuestions.includes(id) ? 'Question saved to bookmarks.' : 'Question removed from bookmarks.');
    } else if (action === 'toggle-answer') {
      const card = button.closest('.question-card');
      const answer = $('.answer-content',card);
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded',String(!expanded));
      button.textContent = expanded ? 'View answer +' : 'Hide answer −';
      answer.hidden = expanded;
    } else if (action === 'quiz-next') {
      nextQuizQuestion();
    } else if (action === 'quiz-restart') {
      $('#quiz-shell').innerHTML = '<div class="quiz-config"><div class="quiz-config-copy"><div class="quiz-mark">✳</div><h2>Build a focused practice round.</h2><p>Choose a topic and level. Questions are drawn from the site\'s editable quiz bank.</p></div><form id="quiz-config-form" class="quiz-form"><label>Topic<select id="quiz-topic"><option value="all">Mixed topics</option></select></label><label>Difficulty<select id="quiz-difficulty"><option value="all">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Questions<select id="quiz-length"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="15">15 questions</option></select></label><button class="button button-primary" type="submit">Start quiz <span>↗</span></button></form></div><div class="quiz-start-note"><span>✦</span> Feedback after every answer · Score saved on this device</div>';
      quizState = null; renderQuizTopics();
    } else if (action === 'toggle-project') {
      toggleArrayItem('completedProjects',id); renderProjects();
      toast(state.completedProjects.includes(id) ? 'Blueprint marked as explored.' : 'Blueprint status cleared.');
    } else if (action === 'open-note') {
      openNote(id);
    } else if (action === 'open-question') {
      openQuestion(id);
    } else if (action === 'product-buy') {
      const product = products.find(item=>item.id===id);
      if (!product) return;
      if (product.purchaseUrl && /^https:\/\//i.test(product.purchaseUrl)) {
        window.open(product.purchaseUrl,'_blank','noopener,noreferrer');
      } else {
        toast('Coming soon: no payment is taken. Add a real checkout URL in products-data.js when ready.');
      }
    }
  }
  function exportProgress() {
    const payload = {exportedAt:new Date().toISOString(),version:1,completedNotes:state.completedNotes,bookmarkedNotes:state.bookmarkedNotes,bookmarkedQuestions:state.bookmarkedQuestions,completedProjects:state.completedProjects,quizResults:state.quizResults};
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'zynqora-learning-progress.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Progress export prepared.');
  }
  function initCanvas() {
    const canvas = $('#data-canvas');
    if (!canvas) return;
    let ctx;
    try { ctx = canvas.getContext('2d'); } catch (error) { ctx = null; }
    if (!ctx) { canvas.hidden = true; canvas.parentElement.classList.add('canvas-fallback'); return; }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = [];
    const total = 190;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i=0;i<total;i++) {
      const y = 1 - (i/(total-1))*2;
      const radius = Math.sqrt(Math.max(0,1-y*y));
      const theta = golden*i;
      nodes.push({x:Math.cos(theta)*radius,y,z:Math.sin(theta)*radius,phase:i*.13});
    }
    let width=620,height=620,dpr=1,raf=0,lastTime=0,rotation=0,pointerX=0,pointerY=0;
    function sizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(260,rect.width || 500); height = Math.max(260,rect.height || width);
      dpr = Math.min(window.devicePixelRatio || 1,2);
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw(lastTime);
    }
    function draw(time) {
      if (!ctx) return;
      ctx.clearRect(0,0,width,height);
      const minSide = Math.min(width,height);
      const cx=width/2,cy=height/2;
      const radius=minSide*.34;
      const angleY=rotation+pointerX*.14;
      const angleX=.24+pointerY*.12;
      const sinY=Math.sin(angleY),cosY=Math.cos(angleY),sinX=Math.sin(angleX),cosX=Math.cos(angleX);
      const projected=nodes.map((point,index)=>{
        const x1=point.x*cosY-point.z*sinY;
        const z1=point.x*sinY+point.z*cosY;
        const y1=point.y*cosX-z1*sinX;
        const z2=point.y*sinX+z1*cosX;
        const perspective=2.65/(2.65-z2*.68);
        return {x:cx+x1*radius*perspective,y:cy+y1*radius*perspective,z:z2,index,scale:perspective,alpha:.24+((z2+1)/2)*.76};
      });
      // Connections are based on the sphere's original coordinates, which prevents flickering when it rotates.
      for (let i=0;i<nodes.length;i++) {
        for (let j=i+1;j<nodes.length;j++) {
          const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,dz=nodes[i].z-nodes[j].z;
          const distance=dx*dx+dy*dy+dz*dz;
          if (distance<.105) {
            const a=projected[i],b=projected[j];
            const depth=(a.z+b.z+2)/4;
            ctx.strokeStyle=`rgba(105,168,248,${.045+depth*.13})`;
            ctx.lineWidth=.45+depth*.4;
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          }
        }
      }
      projected.forEach((point,i)=>{
        const glowRadius=(i%11===0?3.2:1.35)*point.scale;
        const alpha=.25+point.alpha*.68;
        ctx.beginPath();ctx.arc(point.x,point.y,glowRadius,0,Math.PI*2);
        ctx.fillStyle=i%17===0?`rgba(108,227,220,${alpha})`:i%13===0?`rgba(167,139,250,${alpha})`:`rgba(117,174,255,${alpha})`;
        ctx.fill();
        if(i%19===0){ctx.beginPath();ctx.arc(point.x,point.y,glowRadius*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(99,152,242,${.06+point.alpha*.07})`;ctx.fill();}
      });
      // A restrained inner halo gives the sphere depth without hiding the data nodes.
      const halo=ctx.createRadialGradient(cx-radius*.2,cy-radius*.25,2,cx,cy,radius*1.15);
      halo.addColorStop(0,'rgba(75,132,229,.055)');halo.addColorStop(.7,'rgba(57,101,175,.025)');halo.addColorStop(1,'rgba(8,13,24,0)');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,radius*1.15,0,Math.PI*2);ctx.fill();
    }
    function animate(time) {
      if (!reduceMotion && time-lastTime>26) { rotation+=.0031; draw(time); lastTime=time; }
      if (!reduceMotion) raf=requestAnimationFrame(animate);
    }
    const wrap=canvas.closest('.hero-art-wrap');
    wrap?.addEventListener('pointermove',event=>{
      if (reduceMotion) return;
      const rect=wrap.getBoundingClientRect();
      pointerX=((event.clientX-rect.left)/rect.width-.5)*2;
      pointerY=((event.clientY-rect.top)/rect.height-.5)*2;
      wrap.style.setProperty('--px',`${pointerX*7}px`);wrap.style.setProperty('--py',`${pointerY*7}px`);
    });
    wrap?.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;wrap.style.setProperty('--px','0px');wrap.style.setProperty('--py','0px');});
    if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(canvas); else window.addEventListener('resize',sizeCanvas);
    sizeCanvas();
    if (!reduceMotion) raf=requestAnimationFrame(animate);
    window.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
  }
  function init() {
    $('#current-year').textContent = String(new Date().getFullYear());
    populateSelect('#notes-category',unique(notes.map(item=>item.category)),'All topics');
    populateSelect('#interview-category',unique(interviews.map(item=>item.category)),'All categories');
    renderQuizTopics();
    renderHome();
    renderNotes();
    renderInterviews();
    renderDashboard();
    renderProjects();
    renderProducts();
    initCanvas();
    const startHash=location.hash.replace(/^#/,'');
    if ($(`[data-view="${startHash}"]`)) changeView(startHash,false);

    document.addEventListener('click',event=>{
      const go = event.target.closest('[data-go]');
      if (go) { event.preventDefault(); changeView(go.dataset.go); return; }
      const openNoteButton = event.target.closest('[data-open-note]');
      if (openNoteButton) { openNote(openNoteButton.dataset.openNote); return; }
      const openQuestionButton = event.target.closest('[data-open-question]');
      if (openQuestionButton) { openQuestion(openQuestionButton.dataset.openQuestion); return; }
      const openProjectButton = event.target.closest('[data-open-project]');
      if (openProjectButton) { openProject(openProjectButton.dataset.openProject); return; }
      const noteCard = event.target.closest('[data-note-id]');
      if (noteCard) { selectedNoteId=noteCard.dataset.noteId; renderNotes(); return; }
      const quizOption=event.target.closest('[data-quiz-option]');
      if (quizOption) { chooseQuizOption(Number(quizOption.dataset.quizOption)); return; }
      const actionButton=event.target.closest('[data-action]');
      if (actionButton) handleAction(actionButton);
    });
    $('#menu-toggle').addEventListener('click',()=>{
      const nav=$('#primary-nav');const open=nav.classList.toggle('open');
      $('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');
    });
    $('#notes-search').addEventListener('input',renderNotes);
    $('#notes-category').addEventListener('change',renderNotes);
    $('#interview-search').addEventListener('input',()=>{questionLimit=20;renderInterviews();});
    $('#interview-category').addEventListener('change',()=>{questionLimit=20;renderInterviews();});
    $('#interview-difficulty').addEventListener('change',()=>{questionLimit=20;renderInterviews();});
    $('#show-bookmarks').addEventListener('click',()=>{showOnlyBookmarks=!showOnlyBookmarks;questionLimit=20;renderInterviews();});
    $('#load-more-questions').addEventListener('click',()=>{questionLimit+=20;renderInterviews();});
    document.addEventListener('submit',event=>{ if(event.target && event.target.id==='quiz-config-form') startQuiz(event); });
    $('#export-progress').addEventListener('click',exportProgress);
    $('#reset-progress').addEventListener('click',()=>{
      const dialog=$('#confirm-dialog');
      if (typeof dialog.showModal==='function') dialog.showModal();
      else if (window.confirm('Reset all Zynqora progress stored on this browser?')) { resetState(); }
    });
    $('#confirm-dialog').addEventListener('close',()=>{ if ($('#confirm-dialog').returnValue==='confirm') resetState(); });
    $('#back-to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
    $('#global-search').addEventListener('input',event=>globalSearch(event.target.value));
    $('#global-search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();globalSearch(event.target.value);}});
    $('#header-search')?.addEventListener('click',()=>changeView('search'));
    document.addEventListener('keydown',event=>{
      const target=event.target;
      if (event.key==='/' && !event.ctrlKey && !event.metaKey && !['INPUT','TEXTAREA','SELECT'].includes(target.tagName) && !target.isContentEditable) {event.preventDefault();changeView('search');}
      if (event.key==='Escape') $('#primary-nav')?.classList.remove('open');
    });
    window.addEventListener('hashchange',()=>{const hash=location.hash.replace(/^#/,'');if($(`[data-view="${hash}"]`))changeView(hash,false);});
  }
  function resetState() {
    state.completedNotes=[];state.bookmarkedNotes=[];state.bookmarkedQuestions=[];state.completedProjects=[];state.quizResults=[];
    saveState();renderNotes();renderHome();renderInterviews();renderDashboard();renderProjects();
    toast('Local learning progress has been reset.');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
