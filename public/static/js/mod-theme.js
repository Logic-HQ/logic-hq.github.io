   // =========================
    // Theme handling (dark/light)
    // =========================
    (function () {
      const root = document.documentElement;
      const toggleBtn = document.getElementById('themeToggle');
      const themeIcon = document.getElementById('themeIcon');
      const themeLabel = document.getElementById('themeLabel');
      const STORAGE_KEY = 'blog-theme';

      function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
          return stored;
        }
        // Fallback to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      }

      // function applyTheme(theme) {
      //   root.setAttribute('data-theme', theme);
      //   if (theme === 'dark') {
      //     themeIcon.textContent = '☀️';
      //     themeLabel.textContent = 'Light';
      //   } else {
      //     themeIcon.textContent = '🌙';
      //     themeLabel.textContent = 'Dark';
      //   }

              function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  
  if (theme === 'dark') {
    // Insert your custom Sun SVG code here
    themeIcon.innerHTML = `
      <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>`;
    themeLabel.textContent = 'Light';
  } else {
    // Insert your custom Moon SVG code here
    themeIcon.innerHTML = `
      <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>`;
    themeLabel.textContent = 'Dark';
  }
};
      

      function initTheme() {
        const theme = getPreferredTheme();
        applyTheme(theme);
      }

      toggleBtn.addEventListener('click', function () {
        const current = root.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
      });

      // Optional: react to system changes if user hasn't set a preference
      if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        mq.addEventListener('change', function (e) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      }

      initTheme();
    })();

    // Footer year
    document.getElementById('year').textContent = new Date().getFullYear();
