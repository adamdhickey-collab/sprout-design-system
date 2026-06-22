    // Set indeterminate state on checkboxes flagged with data-indeterminate
    document.querySelectorAll('input[type="checkbox"][data-indeterminate]').forEach(cb => {
      cb.indeterminate = true;
    });

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

      // Snap immediately on click so the highlight doesn't lag the smooth scroll
      links.forEach(l => {
        l.addEventListener('click', () => {
          setActive(l.getAttribute('href').substring(1));
        });
      });

      update();
    })();

    // Theme toggle · light / dark, persisted across pages
    (function () {
      const KEY = 'sprout-theme';
      const root = document.documentElement;
      const btns = Array.from(document.querySelectorAll('.theme-btn'));
      function apply(theme) {
        if (theme === 'dark') root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
        btns.forEach(b => b.classList.toggle('segmented-btn--active', b.dataset.themeValue === theme));
        document.querySelectorAll('.theme-label').forEach(el => {
          el.textContent = theme === 'dark' ? 'Dark theme' : 'Light theme';
        });
      }
      let saved = null;
      try { saved = localStorage.getItem(KEY); } catch (e) {}
      apply(saved || (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'));
      btns.forEach(b => {
        b.addEventListener('click', () => {
          const theme = b.dataset.themeValue;
          apply(theme);
          try { localStorage.setItem(KEY, theme); } catch (e) {}
        });
      });
    })();

    // Version + last-updated · single source of truth.
    // Bump SPROUT_VERSION on each release; the updated date is derived from the
    // page's own last-modified timestamp so it never needs manual editing.
    (function () {
      const SPROUT_VERSION = '1.0';

      document.querySelectorAll('.js-version').forEach(el => {
        el.textContent = 'v' + SPROUT_VERSION;
      });

      const updatedEls = document.querySelectorAll('.js-updated');
      if (updatedEls.length) {
        const d = new Date(document.lastModified);
        if (!isNaN(d.getTime())) {
          const pad = n => String(n).padStart(2, '0');
          const stamp = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
          updatedEls.forEach(el => { el.textContent = stamp; });
        }
      }
    })();
