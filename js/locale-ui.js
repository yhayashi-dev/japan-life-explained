/* Native-language search and browser-local email drafts. No automatic submissions. */
(() => {
  'use strict';
  // Presentation-only link: keep the existing consent collector/config unchanged.
  const privacyLocale = {'vi':'vi', 'zh-hans':'zh-hans'}[document.documentElement.lang.toLowerCase()];
  const consentPrivacy = document.querySelector('#su-analytics-panel a');
  if (privacyLocale && consentPrivacy && location.pathname.startsWith('/japan-life-explained/')) {
    consentPrivacy.href = new URL('/japan-life-explained/' + privacyLocale + '/privacy.html', location.origin).href;
  }
  const node = document.getElementById('locale-config');
  if (!node) return;
  const config = JSON.parse(node.textContent), ui = config.ui;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value).normalize('NFC').replace(/\u200B/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (config.mode === 'search') {
    const input = document.getElementById('site-search'), results = document.getElementById('search-results'), status = document.getElementById('search-status');
    let index = [];
    input.value = new URLSearchParams(location.search).get('q') || '';
    const number = n => new Intl.NumberFormat(config.language).format(n);
    function render(query) {
      const q = normalize(query), terms = q.split(/\s+/).filter(Boolean);
      const matched = q ? index.map(page => {
        const title = normalize(page.title), summary = normalize(page.summary), keywords = normalize(page.keywords);
        let score = (page.search_phrases || []).some(phrase => normalize(phrase) === q) ? 100 : 0;
        for (const term of terms) { if (title.includes(term)) score += 8; if (summary.includes(term)) score += 4; if (keywords.includes(term)) score += 1; }
        return {...page, score};
      }).filter(page => page.score > 0).sort((a,b) => b.score - a.score) : index;
      status.textContent = q ? (matched.length ? ui.matches_prefix + number(matched.length) + ui.matches_suffix : ui.none) : ui.all;
      results.innerHTML = matched.map(page => '<a class="search-result-card" lang="' + config.language + '" href="' + escapeHtml(page.url.slice(config.prefix.length)) + '"><span class="badge">' + escapeHtml(config.labels[page.url].category) + '</span><h3>' + escapeHtml(config.labels[page.url].title) + '</h3><p>' + escapeHtml(page.summary) + '</p><span class="locale-read">' + escapeHtml(ui.read) + ' →</span></a>').join('');
    }
    function update() {
      const url = new URL(location.href);
      if (input.value) url.searchParams.set('q', input.value); else url.searchParams.delete('q');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      if (index.length) render(input.value);
    }
    input.addEventListener('input', update);
    document.querySelector('.locale-search-form').addEventListener('submit', event => { event.preventDefault(); update(); });
    document.getElementById('clear-search').addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    fetch(config.index_url).then(response => { if (!response.ok) throw new Error('index'); return response.json(); }).then(data => {
      const filtered = data.filter(page => typeof page.url === 'string' && page.url.startsWith(config.prefix + 'articles/') && /^[a-z0-9-]+\.html$/.test(page.url.slice((config.prefix + 'articles/').length)));
      if (filtered.length !== config.expected_count) throw new Error('scope');
      index = filtered;
      render(input.value);
    }).catch(() => { results.innerHTML = ''; status.textContent = ui.failure; });
  }
  if (config.mode === 'feedback') {
    const form = document.getElementById('feedback-draft-form'), prepare = document.getElementById('feedback-prepare');
    if (!form || !prepare) return;
    const status = document.getElementById('feedback-status');
    function makeDraft(event) {
      event.preventDefault();
      const message = document.getElementById('feedback-message').value.trim();
      if (!message) { status.textContent = ui.feedback_error; document.getElementById('feedback-message').focus(); return; }
      const guide = document.getElementById('feedback-guide').value, kind = document.getElementById('feedback-kind').value;
      const body = ui.feedback_kind + ': ' + kind + '\n' + (guide ? ui.feedback_guide + ': ' + guide + '\n' : '') + '\n' + message;
      const subject = '[Japan Life Explained][' + config.language + '] ' + kind;
      document.getElementById('feedback-prepared-body').value = body;
      document.getElementById('feedback-prepared-mailto').href = 'mailto:yhayashi7036@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      document.getElementById('feedback-draft-output').hidden = false;
      status.textContent = ui.feedback_prepared;
    }
    prepare.disabled = false;
    prepare.addEventListener('click', makeDraft);
    form.addEventListener('submit', makeDraft);
    function invalidateDraft() {
      document.getElementById('feedback-draft-output').hidden = true;
      document.getElementById('feedback-prepared-mailto').href = 'mailto:yhayashi7036@gmail.com';
      document.getElementById('feedback-prepared-body').value = '';
      status.textContent = '';
    }
    form.addEventListener('input', invalidateDraft);
    form.addEventListener('change', invalidateDraft);
    document.getElementById('feedback-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(document.getElementById('feedback-prepared-body').value); status.textContent = ui.feedback_copied; }
      catch { document.getElementById('feedback-prepared-body').focus(); document.getElementById('feedback-prepared-body').select(); status.textContent = ui.feedback_copy_failed; }
    });
  }
})();
