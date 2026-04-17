// ============================================================
// SectorScope — Main Application Logic
// ============================================================

(function () {
    'use strict';

    // ── State ──
    const state = {
        apiKey: localStorage.getItem('ss_api_key') || '',
        selectedGeo: 'India',
        focusAreas: [],
        currentReport: null,
        reports: JSON.parse(localStorage.getItem('ss_reports') || '[]'),
        isGenerating: false,
        abortController: null,
    };

    // ── DOM References ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Elements
    const appLoader = $('#app-loader');
    const mainNav = $('#main-nav');
    const heroSection = $('#hero');
    const reportModal = $('#report-modal');
    const historyModal = $('#history-modal');
    const progressOverlay = $('#progress-overlay');
    const reportView = $('#report-view');
    const reportForm = $('#report-form');
    const mainFooter = $('#main-footer');

    // ── Initialization ──
    function init() {
        // Hide loader after animation
        setTimeout(() => {
            appLoader.classList.add('fade-out');
            setTimeout(() => appLoader.style.display = 'none', 600);
        }, 1800);

        // Initialize Mermaid
        if (window.mermaid) {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                themeVariables: {
                    darkMode: true,
                    primaryColor: '#6366f1',
                    primaryTextColor: '#f0f0f5',
                    primaryBorderColor: '#4f46e5',
                    lineColor: '#6366f1',
                    secondaryColor: '#1e1e30',
                    tertiaryColor: '#14141f',
                    background: '#14141f',
                    mainBkg: '#1e1e30',
                    nodeBkg: '#1e1e30',
                    nodeBorder: '#6366f1',
                    clusterBkg: '#14141f',
                    clusterBorder: '#4f46e5',
                    titleColor: '#f0f0f5',
                    edgeLabelBackground: '#14141f',
                    nodeTextColor: '#f0f0f5',
                },
                flowchart: { curve: 'basis', padding: 15 },
                fontSize: 14,
            });
        }

        // Configure marked
        if (window.marked) {
            marked.setOptions({
                breaks: true,
                gfm: true,
            });
        }

        createParticles();
        animateCounters();
        setupEventListeners();
        setupScrollAnimations();
        setupNavScroll();

        // Restore API key
        if (state.apiKey) {
            const apiKeyInput = $('#api-key');
            if (apiKeyInput) apiKeyInput.value = state.apiKey;
        }
    }

    // ── Particles ──
    function createParticles() {
        const container = $('#hero-particles');
        if (!container) return;
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'hero-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.animationDuration = (6 + Math.random() * 6) + 's';
            p.style.width = (2 + Math.random() * 3) + 'px';
            p.style.height = p.style.width;
            const colors = ['rgba(99,102,241,0.5)', 'rgba(139,92,246,0.4)', 'rgba(6,182,212,0.4)'];
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            container.appendChild(p);
        }
    }

    // ── Counter Animation ──
    function animateCounters() {
        const counters = $$('.stat-number[data-target]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.target);
                    let current = 0;
                    const step = target / 40;
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        el.textContent = Math.round(current);
                    }, 40);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach((c) => observer.observe(c));
    }

    // ── Event Listeners ──
    function setupEventListeners() {
        // Modal open
        const openModal = () => {
            reportModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        $('#hero-start-btn')?.addEventListener('click', openModal);
        $('#nav-cta-btn')?.addEventListener('click', openModal);
        $('#mobile-cta-btn')?.addEventListener('click', () => {
            $('#mobile-menu')?.classList.remove('active');
            openModal();
        });

        // Modal close
        $('#modal-close-btn')?.addEventListener('click', closeReportModal);
        reportModal?.addEventListener('click', (e) => {
            if (e.target === reportModal) closeReportModal();
        });

        // History modal
        const openHistory = () => {
            renderHistoryList();
            historyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        $('#nav-history-btn')?.addEventListener('click', (e) => { e.preventDefault(); openHistory(); });
        $('#mobile-history-btn')?.addEventListener('click', (e) => { e.preventDefault(); openHistory(); });
        $('#history-close-btn')?.addEventListener('click', () => {
            historyModal.classList.remove('active');
            document.body.style.overflow = '';
        });
        historyModal?.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        $('#history-new-btn')?.addEventListener('click', () => {
            historyModal.classList.remove('active');
            openModal();
        });

        // Geography toggle
        $$('.geo-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                $$('.geo-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedGeo = btn.dataset.geo;
            });
        });

        // Focus chips
        $$('.focus-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const focus = chip.dataset.focus;
                if (state.focusAreas.includes(focus)) {
                    state.focusAreas = state.focusAreas.filter((f) => f !== focus);
                } else {
                    state.focusAreas.push(focus);
                }
            });
        });

        // Quick picks
        $$('.quick-pick').forEach((pick) => {
            pick.addEventListener('click', () => {
                const input = $('#sector-name');
                if (input) input.value = pick.dataset.value;
            });
        });

        // API key toggle visibility
        $('#toggle-api-key')?.addEventListener('click', () => {
            const input = $('#api-key');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // Form submit
        reportForm?.addEventListener('submit', handleFormSubmit);

        // Mobile menu
        $('#mobile-menu-btn')?.addEventListener('click', () => {
            $('#mobile-menu')?.classList.toggle('active');
        });

        // Close mobile menu on link click
        $$('.mobile-link').forEach((link) => {
            link.addEventListener('click', () => {
                $('#mobile-menu')?.classList.remove('active');
            });
        });

        // Report view actions
        $('#back-to-home')?.addEventListener('click', () => showHome());
        $('#export-pdf-btn')?.addEventListener('click', exportReport);
        $('#print-btn')?.addEventListener('click', () => window.print());
        $('#cancel-generation')?.addEventListener('click', cancelGeneration);

        // Nav logo
        $('#nav-logo')?.addEventListener('click', (e) => {
            e.preventDefault();
            showHome();
        });

        // TOC toggle
        $('#toc-toggle')?.addEventListener('click', () => {
            $('#report-toc')?.classList.toggle('collapsed');
        });

        // Demo button — generate a sample
        $('#hero-demo-btn')?.addEventListener('click', () => {
            const input = $('#sector-name');
            if (input) input.value = 'Electric Vehicles';
            state.selectedGeo = 'India';
            $$('.geo-btn').forEach((b) => b.classList.remove('active'));
            $('#geo-india')?.classList.add('active');
            openModal();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (reportModal.classList.contains('active')) closeReportModal();
                if (historyModal.classList.contains('active')) {
                    historyModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }

    function closeReportModal() {
        reportModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── Scroll Animations ──
    function setupScrollAnimations() {
        // Add animate-on-scroll to feature cards and steps
        $$('.feature-card, .hiw-step').forEach((el) => {
            el.classList.add('animate-on-scroll');
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || 0);
                    setTimeout(() => entry.target.classList.add('visible'), delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        $$('.animate-on-scroll').forEach((el) => observer.observe(el));
    }

    // ── Nav Scroll ──
    function setupNavScroll() {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (scrollY > 50) {
                mainNav.classList.add('scrolled');
            } else {
                mainNav.classList.remove('scrolled');
            }
            lastScroll = scrollY;
        }, { passive: true });
    }

    // ── Form Submit ──
    async function handleFormSubmit(e) {
        e.preventDefault();

        const apiKey = $('#api-key').value.trim();
        const sectorName = $('#sector-name').value.trim();
        const model = $('#model-select').value;

        if (!apiKey) { showToast('Please enter your Gemini API key', 'error'); return; }
        if (!sectorName) { showToast('Please enter a sector name', 'error'); return; }

        // Save API key
        state.apiKey = apiKey;
        localStorage.setItem('ss_api_key', apiKey);

        closeReportModal();
        await generateReport(sectorName, state.selectedGeo, model, state.focusAreas);
    }

    // ── Report Generation ──
    async function generateReport(sector, geography, model, focusAreas) {
        state.isGenerating = true;
        state.abortController = new AbortController();

        // Show progress
        showProgress();
        updateProgress(0, 'Building analysis prompt...');

        // Build prompt
        const prompt = buildPrompt(sector, geography, focusAreas);

        // Initialize progress levels
        const progressLevels = $('#progress-levels');
        progressLevels.innerHTML = '';
        LEVEL_LABELS.forEach((label, i) => {
            const div = document.createElement('div');
            div.className = 'progress-level-item';
            div.textContent = label;
            div.id = `prog-level-${i}`;
            progressLevels.appendChild(div);
        });

        $('#progress-title').textContent = `Analyzing: ${sector}`;
        $('#progress-subtitle').textContent = `Geography: ${geography} | Model: ${model}`;

        try {
            updateProgress(5, 'Connecting to Gemini AI...');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${state.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.8,
                            topP: 0.95,
                            topK: 40,
                            maxOutputTokens: 65536,
                        },
                    }),
                    signal: state.abortController.signal,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
                throw new Error(errorMsg);
            }

            let fullContent = '';
            let currentLevel = -1;
            const streamContent = $('#stream-content');

            updateProgress(10, 'Receiving analysis...');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6).trim();
                        if (jsonStr === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(jsonStr);
                            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';

                            if (text) {
                                fullContent += text;

                                // Update stream preview (last 500 chars)
                                const previewText = fullContent.slice(-500);
                                streamContent.textContent = previewText;
                                streamContent.parentElement.scrollTop = streamContent.parentElement.scrollHeight;

                                // Track progress by detecting level headings
                                const newLevel = detectCurrentLevel(fullContent);
                                if (newLevel > currentLevel) {
                                    currentLevel = newLevel;
                                    updateLevelProgress(currentLevel);
                                    const pct = Math.min(10 + (currentLevel / LEVEL_LABELS.length) * 85, 95);
                                    updateProgress(pct, `Analyzing: ${LEVEL_LABELS[Math.min(currentLevel, LEVEL_LABELS.length - 1)]}...`);
                                }
                            }
                        } catch (parseErr) {
                            // Skip unparseable chunks
                        }
                    }
                }
            }

            // Finalize
            updateProgress(100, 'Report complete!');

            if (fullContent.trim().length < 100) {
                throw new Error('The AI returned an empty or too-short response. Please try again.');
            }

            // Save report
            const reportData = {
                id: Date.now().toString(),
                sector,
                geography,
                model,
                content: fullContent,
                createdAt: new Date().toISOString(),
            };

            state.reports.unshift(reportData);
            // Keep last 20 reports
            if (state.reports.length > 20) state.reports = state.reports.slice(0, 20);
            localStorage.setItem('ss_reports', JSON.stringify(state.reports));

            state.currentReport = reportData;

            setTimeout(() => {
                hideProgress();
                showReport(reportData);
                showToast('Report generated successfully!', 'success');
            }, 800);

        } catch (err) {
            hideProgress();
            if (err.name === 'AbortError') {
                showToast('Report generation cancelled.', 'info');
            } else {
                showToast(`Error: ${err.message}`, 'error');
                console.error('Generation error:', err);
            }
        } finally {
            state.isGenerating = false;
            state.abortController = null;
        }
    }

    function detectCurrentLevel(text) {
        // Count how many LEVEL headings have appeared
        let maxLevel = -1;
        const levelPatterns = [
            /LEVEL 0|Industry Immersion/i,
            /Business Model Simplified|ANALOGY MODE/i,
            /LEVEL 1|Value Chain Dissection/i,
            /LEVEL 2|Profit Pool Analysis/i,
            /LEVEL 3|Growth Pocket/i,
            /LEVEL 4|Company Mapping/i,
            /LEVEL 5|Demand Drivers/i,
            /LEVEL 6|Supply Side|Competition/i,
            /LEVEL 7|Industry Cycles/i,
            /LEVEL 8|Unit Economics/i,
            /LEVEL 9|KPI Framework/i,
            /Tips.*Tricks.*Patterns|TIPS.*PATTERNS/i,
            /LEVEL 10|Proxies.*Indirect/i,
            /LEVEL 11|Regulation.*Disruption/i,
            /LEVEL 12|Capital Flow/i,
            /LEVEL 13|Winner.*Loser/i,
            /LEVEL 14|Valuation Landscape/i,
            /LEVEL 15|Investor Playbook/i,
            /LEVEL 16|Future Outlook/i,
        ];

        for (let i = 0; i < levelPatterns.length; i++) {
            if (levelPatterns[i].test(text)) {
                maxLevel = i;
            }
        }
        return maxLevel;
    }

    function updateLevelProgress(level) {
        for (let i = 0; i < LEVEL_LABELS.length; i++) {
            const el = $(`#prog-level-${i}`);
            if (!el) continue;
            if (i < level) {
                el.className = 'progress-level-item done';
            } else if (i === level) {
                el.className = 'progress-level-item active';
            } else {
                el.className = 'progress-level-item';
            }
        }
    }

    function updateProgress(percent, stage) {
        const fill = $('#progress-fill');
        const pctEl = $('#progress-percent');
        const stageEl = $('#progress-stage');
        if (fill) fill.style.width = percent + '%';
        if (pctEl) pctEl.textContent = Math.round(percent) + '%';
        if (stageEl) stageEl.textContent = stage;
    }

    function showProgress() {
        progressOverlay.classList.remove('hidden');
        heroSection.style.display = 'none';
        $$('#features, #how-it-works').forEach(s => s.style.display = 'none');
        mainFooter.style.display = 'none';
        document.body.style.overflow = 'hidden';
    }

    function hideProgress() {
        progressOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function cancelGeneration() {
        if (state.abortController) {
            state.abortController.abort();
        }
        hideProgress();
        showHome();
    }

    // ── Show Report ──
    async function showReport(report) {
        // Hide other views
        heroSection.style.display = 'none';
        $$('#features, #how-it-works').forEach(s => s.style.display = 'none');
        mainFooter.style.display = 'none';
        mainNav.style.display = 'none';

        // Set topbar info
        $('#report-topbar-title').textContent = `${report.sector} — ${report.geography}`;
        $('#report-topbar-date').textContent = new Date(report.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Render markdown
        const article = $('#report-article');
        const rawHtml = marked.parse(report.content);
        article.innerHTML = rawHtml;

        // Process Mermaid diagrams
        await renderMermaidDiagrams(article);

        // Build TOC
        buildTOC(article);

        // Show report view
        reportView.classList.remove('hidden');

        // Scroll to top of report
        const reportMain = $('#report-main');
        if (reportMain) reportMain.scrollTop = 0;

        // Setup TOC scroll tracking
        setupTocScrollTracking();
    }

    async function renderMermaidDiagrams(container) {
        const codeBlocks = container.querySelectorAll('pre code.language-mermaid, pre code');
        let mermaidIdx = 0;
        for (const block of codeBlocks) {
            const text = block.textContent.trim();
            // Check if it looks like mermaid syntax
            const isMermaid = block.classList.contains('language-mermaid') ||
                /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram|journey|gitGraph)/m.test(text);

            if (isMermaid && window.mermaid) {
                try {
                    const id = `mermaid-${Date.now()}-${mermaidIdx++}`;
                    const { svg } = await mermaid.render(id, text);
                    const div = document.createElement('div');
                    div.className = 'mermaid';
                    div.innerHTML = svg;
                    block.closest('pre').replaceWith(div);
                } catch (err) {
                    console.warn('Mermaid render failed:', err);
                    // Leave as code block
                }
            }
        }
    }

    function buildTOC(article) {
        const tocNav = $('#toc-nav');
        tocNav.innerHTML = '';
        const headings = article.querySelectorAll('h1, h2, h3');

        headings.forEach((h, i) => {
            const id = `section-${i}`;
            h.id = id;

            const link = document.createElement('a');
            link.className = 'toc-link' + (h.tagName === 'H3' ? ' toc-sub' : '');
            link.href = `#${id}`;
            link.textContent = h.textContent.replace(/^#+\s*/, '');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            tocNav.appendChild(link);
        });
    }

    function setupTocScrollTracking() {
        const reportMain = $('#report-main');
        const tocLinks = $$('.toc-link');
        const headings = $$('.report-article h1[id], .report-article h2[id], .report-article h3[id]');

        if (!reportMain || headings.length === 0) return;

        reportMain.addEventListener('scroll', () => {
            let current = '';
            headings.forEach((h) => {
                const rect = h.getBoundingClientRect();
                if (rect.top < 150) {
                    current = h.id;
                }
            });

            tocLinks.forEach((link) => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }, { passive: true });
    }

    // ── Show Home ──
    function showHome() {
        reportView.classList.add('hidden');
        progressOverlay.classList.add('hidden');
        heroSection.style.display = '';
        $$('#features, #how-it-works').forEach(s => s.style.display = '');
        mainFooter.style.display = '';
        mainNav.style.display = '';
        document.body.style.overflow = '';
    }

    // ── History ──
    function renderHistoryList() {
        const container = $('#history-list');
        if (state.reports.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No reports generated yet.</p>
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('history-modal').classList.remove('active');document.getElementById('report-modal').classList.add('active');">Generate Your First Report</button>
                </div>
            `;
            return;
        }

        container.innerHTML = state.reports.map((r) => `
            <div class="history-item" data-id="${r.id}">
                <div class="history-item-info">
                    <h4>${r.sector}</h4>
                    <div class="history-item-meta">
                        <span>${r.geography}</span>
                        <span>${new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span>${r.model}</span>
                    </div>
                </div>
                <div class="history-item-actions">
                    <button class="history-delete" data-id="${r.id}" aria-label="Delete report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Click handlers
        container.querySelectorAll('.history-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-delete')) return;
                const report = state.reports.find((r) => r.id === item.dataset.id);
                if (report) {
                    historyModal.classList.remove('active');
                    document.body.style.overflow = '';
                    showReport(report);
                }
            });
        });

        container.querySelectorAll('.history-delete').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                state.reports = state.reports.filter((r) => r.id !== id);
                localStorage.setItem('ss_reports', JSON.stringify(state.reports));
                renderHistoryList();
                showToast('Report deleted', 'info');
            });
        });
    }

    // ── Export ──
    function exportReport() {
        if (!state.currentReport) {
            // Try to get content from article
            const article = $('#report-article');
            if (article) {
                const blob = new Blob([article.innerText], { type: 'text/plain;charset=utf-8' });
                downloadBlob(blob, 'sector-report.txt');
                showToast('Report exported as text', 'success');
            }
            return;
        }

        const report = state.currentReport;
        const markdown = report.content;
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        downloadBlob(blob, `${report.sector.replace(/\s+/g, '-')}-Research-Report.md`);
        showToast('Report exported as Markdown', 'success');
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Toast ──
    function showToast(message, type = 'info') {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} 
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ── Boot ──
    document.addEventListener('DOMContentLoaded', init);
})();
