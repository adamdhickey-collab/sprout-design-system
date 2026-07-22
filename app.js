    // Set indeterminate state on checkboxes flagged with data-indeterminate
    document.querySelectorAll('input[type="checkbox"][data-indeterminate]').forEach(cb => {
      cb.indeterminate = true;
    });

    // Reliably jump to a same-page anchor. `scroll-behavior: smooth` on <html>
    // doesn't always complete the browser's native hash-scroll — on initial page
    // load in particular, it can silently no-op. Anything that needs to land on
    // a section (sidebar links, search results) goes through this instead.
    function sproutJumpToHash(hash) {
      const id = hash.replace(/^#/, '');
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      // The `behavior` option alone doesn't reliably beat the CSS scroll-behavior
      // rule in every engine, so force it via inline style for this one jump.
      const root = document.documentElement;
      const prevBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      el.scrollIntoView({ block: 'start' });
      root.style.scrollBehavior = prevBehavior;
    }
    if (location.hash) {
      const hashToJump = location.hash;
      // Let any (possibly broken) native browser attempt at the hash-scroll
      // happen and finish first, so ours is the one that actually sticks.
      window.addEventListener('load', () => {
        setTimeout(() => {
          sproutJumpToHash(hashToJump);
          const link = document.querySelector('.sidebar-link[href="' + hashToJump + '"]');
          if (link) {
            document.querySelectorAll('.sidebar-link--active').forEach((l) => l.classList.remove('sidebar-link--active'));
            link.classList.add('sidebar-link--active');
          }
        }, 150);
      });
    }

    // Sidebar scroll-spy · highlight the section closest to (and above) the viewport top
    (function () {
      const links = Array.from(document.querySelectorAll('.sidebar-link[href^="#"]'));
      if (!links.length) return;
      const linkBy = Object.fromEntries(links.map(l => [l.getAttribute('href').substring(1), l]));
      const sections = links
        .map(l => document.getElementById(l.getAttribute('href').substring(1)))
        .filter(Boolean);
      if (!sections.length) return;

      // Sort by document position so iteration matches scroll order
      sections.sort((a, b) =>
        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
      );

      let currentId = null;
      function setActive(id) {
        if (id === currentId) return;
        currentId = id;
        links.forEach(l => l.classList.remove('sidebar-link--active'));
        if (linkBy[id]) linkBy[id].classList.add('sidebar-link--active');
      }

      function update() {
        // If we can't scroll further (or are within ~120 px of the bottom),
        // force the last section active so the tail of the page isn't stuck.
        const nearBottom = (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 120);
        if (nearBottom) {
          setActive(sections[sections.length - 1].id);
          return;
        }
        // "Active" = last section whose top has scrolled above the upper third of the viewport.
        const threshold = Math.max(120, window.innerHeight * 0.3);
        let bestId = sections[0].id;
        for (const s of sections) {
          if (s.getBoundingClientRect().top - threshold <= 0) {
            bestId = s.id;
          } else {
            break;
          }
        }
        setActive(bestId);
      }

      let scheduled = false;
      function onScroll() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          update();
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });

      // Snap immediately on click, and drive the scroll ourselves — see
      // sproutJumpToHash above for why the native hash-scroll can't be trusted.
      links.forEach(l => {
        l.addEventListener('click', (e) => {
          const id = l.getAttribute('href').substring(1);
          setActive(id);
          e.preventDefault();
          sproutJumpToHash('#' + id);
          history.pushState(null, '', '#' + id);
        });
      });

      update();
    })();

    // Theme toggle · light / dark, persisted across pages
    (function () {
      const KEY = 'sprout-theme';
      const root = document.documentElement;
      const toggle = document.getElementById('theme-toggle');
      function apply(theme) {
        if (theme === 'dark') root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
        if (toggle) {
          toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
          // Both options are drawn in the track and the active one is styled off
          // [data-theme] in CSS, so nothing here swaps glyphs — the only job left
          // is keeping the switch's accessible name in step with what's shown.
          toggle.setAttribute('aria-label', theme === 'dark' ? 'Dark mode' : 'Light mode');
        }
        document.querySelectorAll('.theme-label').forEach(el => {
          el.textContent = theme === 'dark' ? 'Dark theme' : 'Light theme';
        });
      }
      let saved = null;
      try { saved = localStorage.getItem(KEY); } catch (e) {}
      let systemPrefersDark = false;
      try { systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
      apply(saved || (root.getAttribute('data-theme') === 'dark' || systemPrefersDark ? 'dark' : 'light'));
      if (toggle) {
        toggle.addEventListener('click', () => {
          const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          apply(next);
          try { localStorage.setItem(KEY, next); } catch (e) {}
        });
      }
    })();

    // Search · Cmd/Ctrl+K palette across every Foundations section and component
    (function () {
      const INDEX = [
        { title: 'Getting started', category: 'Start here', page: 'getting-started.html', anchor: '' },
        { title: 'Color', category: 'Foundations', page: 'index.html', anchor: '#color' },
        { title: 'Typography', category: 'Foundations', page: 'index.html', anchor: '#type' },
        { title: 'Layout & shape', category: 'Foundations', page: 'index.html', anchor: '#space' },
        { title: 'Iconography', category: 'Foundations', page: 'index.html', anchor: '#icons' },
        { title: 'Logo', category: 'Foundations', page: 'index.html', anchor: '#logo' },
        { title: 'Themes', category: 'System', page: 'index.html', anchor: '#themes' },
        { title: 'Elevation', category: 'System', page: 'index.html', anchor: '#elevation' },
        { title: 'Authentication', category: 'Forms & inputs', page: 'forms.html', anchor: '#authentication' },
        { title: 'Button', category: 'Forms & inputs', page: 'forms.html', anchor: '#buttons' },
        { title: 'Checkbox', category: 'Forms & inputs', page: 'forms.html', anchor: '#checkbox' },
        { title: 'Combobox', category: 'Forms & inputs', page: 'forms.html', anchor: '#combobox' },
        { title: 'Date input', category: 'Forms & inputs', page: 'forms.html', anchor: '#date-input' },
        { title: 'File upload', category: 'Forms & inputs', page: 'forms.html', anchor: '#file-upload' },
        { title: 'Input', category: 'Forms & inputs', page: 'forms.html', anchor: '#input' },
        { title: 'Label', category: 'Forms & inputs', page: 'forms.html', anchor: '#label' },
        { title: 'Number input', category: 'Forms & inputs', page: 'forms.html', anchor: '#number-input' },
        { title: 'Radio button', category: 'Forms & inputs', page: 'forms.html', anchor: '#radio' },
        { title: 'Search', category: 'Forms & inputs', page: 'forms.html', anchor: '#search' },
        { title: 'Segmented control', category: 'Forms & inputs', page: 'forms.html', anchor: '#segmented-control' },
        { title: 'Select', category: 'Forms & inputs', page: 'forms.html', anchor: '#select' },
        { title: 'Slider', category: 'Forms & inputs', page: 'forms.html', anchor: '#slider' },
        { title: 'Textarea', category: 'Forms & inputs', page: 'forms.html', anchor: '#textarea' },
        { title: 'Time input', category: 'Forms & inputs', page: 'forms.html', anchor: '#time-input' },
        { title: 'Toggle', category: 'Forms & inputs', page: 'forms.html', anchor: '#toggle' },
        { title: 'Accordion', category: 'Layout & content', page: 'content.html', anchor: '#accordion' },
        { title: 'Avatar', category: 'Layout & content', page: 'content.html', anchor: '#avatar' },
        { title: 'Badge', category: 'Layout & content', page: 'content.html', anchor: '#badge' },
        { title: 'Card', category: 'Layout & content', page: 'content.html', anchor: '#card' },
        { title: 'Carousel', category: 'Layout & content', page: 'content.html', anchor: '#carousel' },
        { title: 'Chip', category: 'Layout & content', page: 'content.html', anchor: '#chip' },
        { title: 'Container', category: 'Layout & content', page: 'content.html', anchor: '#container' },
        { title: 'Divider', category: 'Layout & content', page: 'content.html', anchor: '#divider' },
        { title: 'Empty state', category: 'Layout & content', page: 'content.html', anchor: '#empty-state' },
        { title: 'Hero', category: 'Layout & content', page: 'content.html', anchor: '#hero' },
        { title: 'Marquee', category: 'Layout & content', page: 'content.html', anchor: '#marquee' },
        { title: 'Progress bar', category: 'Layout & content', page: 'content.html', anchor: '#progress-bar' },
        { title: 'Progress gauge', category: 'Layout & content', page: 'content.html', anchor: '#progress-gauge' },
        { title: 'Ratings', category: 'Layout & content', page: 'content.html', anchor: '#ratings' },
        { title: 'Status indicator', category: 'Layout & content', page: 'content.html', anchor: '#status-indicator' },
        { title: 'Table', category: 'Layout & content', page: 'content.html', anchor: '#tables' },
        { title: 'Tabs', category: 'Layout & content', page: 'content.html', anchor: '#tabs' },
        { title: 'Tree view', category: 'Layout & content', page: 'content.html', anchor: '#tree-view' },
        { title: 'Alert', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#alert' },
        { title: 'Banner', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#banner' },
        { title: 'Breadcrumb', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#breadcrumb' },
        { title: 'Footer', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#footer' },
        { title: 'Link', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#link' },
        { title: 'Modal', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#modal' },
        { title: 'Page indicator', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#page-indicator' },
        { title: 'Pagination', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#pagination' },
        { title: 'Popover', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#popover' },
        { title: 'Sheet', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#sheet' },
        { title: 'Snackbar', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#snackbar' },
        { title: 'Spinner', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#spinner' },
        { title: 'Stepper', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#stepper' },
        { title: 'Toast', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#toast' },
        { title: 'Tooltip', category: 'Navigation & feedback', page: 'navigation.html', anchor: '#tooltip' }
      ];

      const overlay = document.getElementById('search-overlay');
      const input = document.getElementById('search-input');
      const results = document.getElementById('search-results');
      const trigger = document.getElementById('search-trigger');
      if (!overlay || !input || !results) return;

      let activeIndex = -1;
      let filtered = [];
      let previouslyFocused = null;

      function currentPage() {
        const p = location.pathname.split('/').pop();
        return p === '' ? 'index.html' : p;
      }

      function setActive(i) {
        activeIndex = i;
        Array.from(results.children).forEach((el, idx) => {
          const isActive = idx === i;
          el.classList.toggle('search-result-item--active', isActive);
          if (el.id) el.setAttribute('aria-selected', String(isActive));
        });
        const el = results.children[i];
        if (el) {
          el.scrollIntoView({ block: 'nearest' });
          input.setAttribute('aria-activedescendant', el.id);
        } else {
          input.removeAttribute('aria-activedescendant');
        }
      }

      function go(item) {
        close();
        if (item.page === currentPage() && item.anchor) {
          sproutJumpToHash(item.anchor);
          history.pushState(null, '', item.anchor);
        } else {
          location.href = item.page + item.anchor;
        }
      }

      function render(list) {
        filtered = list;
        results.innerHTML = '';
        if (!list.length) {
          results.innerHTML = '<p class="search-empty">No matches.</p>';
          activeIndex = -1;
          input.removeAttribute('aria-activedescendant');
          return;
        }
        list.forEach((item, i) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'search-result-item';
          row.id = 'search-result-' + i;
          row.setAttribute('role', 'option');
          row.setAttribute('aria-selected', 'false');
          row.setAttribute('tabindex', '-1');
          row.innerHTML =
            '<span class="search-result-title"></span><span class="search-result-category"></span>';
          row.querySelector('.search-result-title').textContent = item.title;
          row.querySelector('.search-result-category').textContent = item.category;
          row.addEventListener('mouseenter', () => setActive(i));
          row.addEventListener('click', () => go(item));
          results.appendChild(row);
        });
        setActive(0);
      }

      function filter(query) {
        const q = query.trim().toLowerCase();
        if (!q) return render(INDEX);
        render(INDEX.filter((i) => i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)));
      }

      function open() {
        previouslyFocused = document.activeElement;
        overlay.hidden = false;
        input.value = '';
        input.setAttribute('aria-expanded', 'true');
        render(INDEX);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => input.focus());
      }
      function close() {
        overlay.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        document.body.style.overflow = '';
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          previouslyFocused.focus();
        }
        previouslyFocused = null;
      }

      if (trigger) trigger.addEventListener('click', open);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });
      input.addEventListener('input', () => filter(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive(Math.min(activeIndex + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive(Math.max(activeIndex - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filtered[activeIndex]) go(filtered[activeIndex]);
        } else if (e.key === 'Tab') {
          // Result rows aren't tab-stops (arrow keys drive selection), so the
          // input is the only focusable element in the dialog — trap Tab here
          // rather than letting it escape to the page underneath.
          e.preventDefault();
        } else if (e.key === 'Escape') {
          close();
        }
      });
      document.addEventListener('keydown', (e) => {
        const isTypingField = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          overlay.hidden ? open() : close();
        } else if (e.key === '/' && !isTypingField) {
          e.preventDefault();
          open();
        } else if (e.key === 'Escape' && !overlay.hidden) {
          close();
        }
      });
    })();

    // "View code" toggle · injected once per .component, reveals the example's own
    // markup rather than a hand-written snippet, so it can never drift out of sync.
    (function () {
      let counter = 0;
      document.querySelectorAll('.component').forEach((comp) => {
        const label = comp.querySelector('.component-label');
        if (!label) return;

        const snippet = comp.innerHTML.replace(label.outerHTML, '').replace(/\n\s*\n/g, '\n').trim();
        if (!snippet) return;

        const codeId = 'component-code-' + counter++;
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'component-code-toggle';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', codeId);
        toggle.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">code</span><span>Code</span>';

        const pre = document.createElement('pre');
        pre.className = 'component-code';
        pre.id = codeId;
        const code = document.createElement('code');
        code.textContent = snippet;
        pre.appendChild(code);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'component-code-copy';
        copyBtn.setAttribute('aria-label', 'Copy this markup');
        copyBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">content_copy</span><span>Copy</span>';
        copyBtn.addEventListener('click', () => sproutCopy(snippet, 'Copied markup'));
        pre.appendChild(copyBtn);

        toggle.addEventListener('click', () => {
          const isOpen = pre.classList.toggle('component-code--visible');
          toggle.setAttribute('aria-expanded', String(isOpen));
          toggle.querySelector('span:last-child').textContent = isOpen ? 'Hide' : 'Code';
        });

        comp.appendChild(toggle);
        comp.appendChild(pre);
      });
    })();

    // Clipboard helper + toast · shared by code blocks, swatches, and playgrounds.
    function sproutToast(message) {
      let toast = document.getElementById('sprout-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sprout-toast';
        toast.className = 'sprout-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      // force reflow so re-triggering restarts the transition
      void toast.offsetWidth;
      toast.classList.add('sprout-toast--visible');
      clearTimeout(toast._sproutTimer);
      toast._sproutTimer = setTimeout(() => {
        toast.classList.remove('sprout-toast--visible');
      }, 1800);
    }
    function sproutCopy(text, message) {
      const done = () => sproutToast(message || 'Copied');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => sproutCopyFallback(text, done));
      } else {
        sproutCopyFallback(text, done);
      }
    }
    function sproutCopyFallback(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* no-op */ }
      document.body.removeChild(ta);
      done();
    }
    function sproutEscape(str) {
      return String(str).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    // Click-to-copy on tonal-ramp token swatches · copies the displayed hex.
    (function () {
      document.querySelectorAll('.palette-swatch').forEach((swatch) => {
        const hexEl = swatch.querySelector('.palette-swatch-hex');
        if (!hexEl) return;
        const hex = hexEl.textContent.trim();
        swatch.setAttribute('role', 'button');
        swatch.setAttribute('tabindex', '0');
        swatch.setAttribute('aria-label', 'Copy ' + hex);
        const copy = () => sproutCopy(hex, 'Copied ' + hex);
        swatch.addEventListener('click', copy);
        swatch.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); }
        });
      });
    })();

    // Interactive playgrounds · live variant controls + synced code readout.
    (function () {
      const PLAYGROUNDS = {
        button: {
          title: 'Button playground',
          controls: [
            { key: 'variant', label: 'Style', options: [['primary', 'Primary'], ['secondary', 'Secondary'], ['ghost', 'Ghost']] },
            { key: 'size', label: 'Size', options: [['sm', 'Small'], ['', 'Medium'], ['lg', 'Large']], def: '' },
            { key: 'danger', label: 'Intent', options: [['', 'Default'], ['danger', 'Destructive']], def: '' },
            { key: 'state', label: 'State', options: [['', 'Enabled'], ['disabled', 'Disabled']], def: '' },
            { key: 'label', label: 'Label', type: 'text', def: 'Get started' }
          ],
          render: function (s) {
            const cls = ['btn', 'btn-' + s.variant];
            if (s.size) cls.push('btn--' + s.size);
            if (s.danger) cls.push('btn--danger');
            if (s.state === 'disabled') cls.push('btn--disabled');
            const dis = s.state === 'disabled' ? ' disabled' : '';
            return '<button class="' + cls.join(' ') + '"' + dis + '>' + sproutEscape(s.label) + '</button>';
          }
        },
        alert: {
          title: 'Alert playground',
          controls: [
            { key: 'variant', label: 'Type', options: [['success', 'Success'], ['error', 'Error'], ['warning', 'Warning'], ['info', 'Info'], ['neutral', 'Neutral']] },
            { key: 'title', label: 'Title', type: 'text', def: 'Heads up' },
            { key: 'body', label: 'Message', type: 'text', def: 'This is what an alert of this type looks like.' }
          ],
          render: function (s) {
            const icons = { success: 'check', error: 'error', warning: 'warning', info: 'info', neutral: 'campaign' };
            return [
              '<div class="alert alert--' + s.variant + '" style="max-width: 460px;">',
              '  <span class="alert-icon"><span class="material-symbols-rounded">' + icons[s.variant] + '</span></span>',
              '  <div class="alert-content">',
              '    <span class="alert-title">' + sproutEscape(s.title) + '</span>',
              '    <span class="alert-body">' + sproutEscape(s.body) + '</span>',
              '  </div>',
              '  <button class="alert-close" aria-label="Dismiss"><span class="material-symbols-rounded">close</span></button>',
              '</div>'
            ].join('\n');
          }
        },
        card: {
          title: 'Card playground',
          controls: [
            { key: 'layout', label: 'Layout', options: [['', 'Rich media'], ['card-rich--side', 'Side'], ['card-rich--overlay', 'Overlay']], def: '' },
            { key: 'eyebrow', label: 'Eyebrow', type: 'text', def: 'Field report · 2026' },
            { key: 'title', label: 'Title', type: 'text', def: 'Regenerative wheat' },
            { key: 'body', label: 'Body', type: 'text', def: 'Image, caption, title, body, and a primary action.' }
          ],
          render: function (s) {
            const cls = ['card', 'card-rich'];
            if (s.layout) cls.push(s.layout);
            return [
              '<article class="' + cls.join(' ') + '" style="max-width: 340px;">',
              '  <div class="card-media" role="presentation"></div>',
              '  <div class="card-content">',
              '    <p class="card-eyebrow">' + sproutEscape(s.eyebrow) + '</p>',
              '    <h3 class="card-title">' + sproutEscape(s.title) + '</h3>',
              '    <p class="card-body">' + sproutEscape(s.body) + '</p>',
              '    <div class="btn-row" style="margin-top: 4px;">',
              '      <button class="btn btn-primary btn--sm">Read more</button>',
              '    </div>',
              '  </div>',
              '</article>'
            ].join('\n');
          }
        }
      };

      document.querySelectorAll('.playground[data-playground]').forEach((container) => {
        const cfg = PLAYGROUNDS[container.dataset.playground];
        if (!cfg) return;

        const state = {};
        cfg.controls.forEach((c) => {
          state[c.key] = c.def !== undefined ? c.def : (c.type === 'text' ? '' : c.options[0][0]);
        });

        container.innerHTML =
          '<div class="playground-head">' +
            '<span class="playground-eyebrow">Try it live</span>' +
            '<span class="playground-title">' + cfg.title + '</span>' +
          '</div>' +
          '<div class="playground-stage"></div>' +
          '<div class="playground-controls"></div>' +
          '<div class="playground-code-wrap">' +
            '<pre class="playground-code"><code></code></pre>' +
            '<button class="playground-copy" type="button" aria-label="Copy this markup">' +
              '<span class="material-symbols-rounded" aria-hidden="true">content_copy</span><span>Copy</span>' +
            '</button>' +
          '</div>';

        const stage = container.querySelector('.playground-stage');
        const controlsEl = container.querySelector('.playground-controls');
        const codeEl = container.querySelector('.playground-code code');

        cfg.controls.forEach((c) => {
          const group = document.createElement('div');
          group.className = 'playground-control';
          const lbl = document.createElement('span');
          lbl.className = 'playground-control-label';
          lbl.textContent = c.label;
          group.appendChild(lbl);

          if (c.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'playground-input';
            input.value = state[c.key];
            input.setAttribute('aria-label', c.label);
            input.addEventListener('input', () => { state[c.key] = input.value; update(); });
            group.appendChild(input);
          } else {
            const seg = document.createElement('div');
            seg.className = 'playground-segmented';
            seg.setAttribute('role', 'group');
            seg.setAttribute('aria-label', c.label);
            c.options.forEach((opt) => {
              const val = opt[0], text = opt[1];
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'playground-seg-btn';
              b.textContent = text;
              b.setAttribute('aria-pressed', String(val === state[c.key]));
              b.addEventListener('click', () => {
                state[c.key] = val;
                seg.querySelectorAll('.playground-seg-btn').forEach((x) => x.setAttribute('aria-pressed', 'false'));
                b.setAttribute('aria-pressed', 'true');
                update();
              });
              seg.appendChild(b);
            });
            group.appendChild(seg);
          }
          controlsEl.appendChild(group);
        });

        function update() {
          const markup = cfg.render(state);
          stage.innerHTML = markup;
          codeEl.textContent = markup;
        }

        container.querySelector('.playground-copy').addEventListener('click', () => {
          sproutCopy(codeEl.textContent, 'Copied markup');
        });

        update();
      });
    })();

    // Version + last-updated · single source of truth.
    // Bump SPROUT_VERSION on each release and mirror the same string onto the
    // Figma Cover page (node 3:14) in the same change — see the "Versioning"
    // section of FIGMA-SYNC.md for the exact contract. The updated date is
    // derived from the page's own last-modified timestamp so it never needs
    // manual editing.
    (function () {
      const SPROUT_VERSION = '1.2';

      document.querySelectorAll('.js-version').forEach(el => {
        el.textContent = 'v' + SPROUT_VERSION;
      });

      const updatedEls = document.querySelectorAll('.js-updated');
      if (updatedEls.length) {
        const d = new Date(document.lastModified);
        if (!isNaN(d.getTime())) {
          const pad = n => String(n).padStart(2, '0');
          const stamp = pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '.' + d.getFullYear();
          updatedEls.forEach(el => { el.textContent = stamp; });
        }
      }
    })();
