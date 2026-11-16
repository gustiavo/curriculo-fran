/**
 * Currículo Interativo - Franciele Alves da Silva
 * Funcionalidades: Tema Dark/Light, Filtro por área, Copiar contato, Print/PDF, Animações scroll
 */

(function() {
  'use strict';

  // ========================================
  // STATE & CONFIG
  // ========================================
  const state = {
    theme: 'light',
    activeFilter: 'all'
  };

  const FILTER_TAGS = {
    admin: 'admin',
    rh: 'rh',
    logistics: 'logistics',
    ti: 'ti'
  };

  const FILTER_MAP = {
    all: null,
    admin: [FILTER_TAGS.admin, FILTER_TAGS.rh],
    logistics: [FILTER_TAGS.logistics, FILTER_TAGS.admin],
    ti: [FILTER_TAGS.ti]
  };

  // ========================================
  // DOM ELEMENTS
  // ========================================
  const elements = {
    html: document.documentElement,
    themeToggle: document.getElementById('theme-toggle'),
    printBtn: document.getElementById('print-btn'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    experienceCards: document.querySelectorAll('.experience-card'),
    contactItems: document.querySelectorAll('.contact-item[data-copy]'),
    animatedElements: document.querySelectorAll('.section, .experience-card, .education-card, .course-card, .skills-cloud')
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ========================================
  // THEME MANAGEMENT
  // ========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    elements.html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateLucideIcons();
  }

  function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);

    // Add subtle animation feedback
    elements.themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
      elements.themeToggle.style.transform = '';
    }, 150);
  }

  function updateLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ========================================
  // FILTER FUNCTIONALITY
  // ========================================
  function initFilters() {
    elements.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => handleFilterClick(btn));
    });
  }

  function handleFilterClick(clickedBtn) {
    const filter = clickedBtn.dataset.filter;
    if (state.activeFilter === filter) return;

    // Update active button
    elements.filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    state.activeFilter = filter;
    filterExperienceCards(filter);

    // Announce to screen readers
    announceFilterChange(filter);
  }

  function filterExperienceCards(filter) {
    const allowedTags = FILTER_MAP[filter];

    elements.experienceCards.forEach((card, index) => {
      const cardTags = card.dataset.tags.split(' ');
      const shouldShow = allowedTags === null || cardTags.some(tag => allowedTags.includes(tag));

      if (shouldShow) {
        card.style.display = '';
        // Stagger animation
        requestAnimationFrame(() => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        });
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });

    // Also filter skill badges
    filterSkillBadges(filter);
  }

  function filterSkillBadges(filter) {
    const badges = document.querySelectorAll('.skill-badge');
    const allowedTags = FILTER_MAP[filter];

    badges.forEach(badge => {
      const badgeTag = badge.dataset.tag;
      const shouldShow = allowedTags === null || allowedTags.includes(badgeTag);

      if (shouldShow) {
        badge.style.display = '';
        badge.style.opacity = '1';
        badge.style.transform = 'scale(1)';
      } else {
        badge.style.opacity = '0';
        badge.style.transform = 'scale(0.8)';
        setTimeout(() => {
          badge.style.display = 'none';
        }, 200);
      }
    });
  }

  function announceFilterChange(filter) {
    const labels = {
      all: 'Todas as áreas',
      admin: 'Administrativo e RH',
      logistics: 'Logística e Operações',
      ti: 'Suporte de TI'
    };
    const message = `Exibindo experiências: ${labels[filter] || filter}`;
    announceToScreenReader(message);
  }

  // ========================================
  // COPY TO CLIPBOARD
  // ========================================
  function initCopyToClipboard() {
    elements.contactItems.forEach(item => {
      item.addEventListener('click', handleCopyClick);
      // Keyboard support
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopyClick(e);
        }
      });
    });
  }

  async function handleCopyClick(e) {
    const item = e.currentTarget;
    const textToCopy = item.dataset.copy;
    const feedback = item.querySelector('.copy-feedback');

    if (!textToCopy || !feedback) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showCopyFeedback(feedback, 'Copiado!');
      item.setAttribute('aria-label', 'Copiado para a área de transferência');
    } catch (err) {
      // Fallback for older browsers
      fallbackCopyText(textToCopy);
      showCopyFeedback(feedback, 'Copiado!');
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function showCopyFeedback(feedback, message) {
    feedback.textContent = message;
    feedback.classList.add('show');

    setTimeout(() => {
      feedback.classList.remove('show');
    }, 2000);
  }

  // ========================================
  // PRINT / PDF
  // ========================================
  function initPrint() {
    elements.printBtn.addEventListener('click', () => {
      // Add a class for print-specific adjustments if needed
      document.body.classList.add('printing');
      window.print();
      // Remove class after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 1000);
    });

    // Keyboard shortcut: Ctrl/Cmd + P
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        // Let browser handle it naturally, but we could add custom behavior here
      }
    });
  }

  // ========================================
  // SCROLL ANIMATIONS (IntersectionObserver)
  // ========================================
  function initScrollAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Show all elements immediately
      elements.animatedElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Add animation classes and observe
    elements.animatedElements.forEach((el, index) => {
      el.classList.add('animate-on-scroll');
      // Add stagger delay classes
      if (el.classList.contains('experience-card') ||
          el.classList.contains('education-card') ||
          el.classList.contains('course-card')) {
        const delayClass = `delay-${(index % 6) + 1}`;
        el.classList.add(delayClass);
      }
      observer.observe(el);
    });
  }

  // ========================================
  // ACCESSIBILITY HELPERS
  // ========================================
  function announceToScreenReader(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-9999px';
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  // ========================================
  // LUCIDE ICONS INITIALIZATION
  // ========================================
  function initLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons({
        strokeWidth: 2,
        'aria-hidden': 'true'
      });
    }
  }

  // ========================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ========================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.focus({ preventScroll: true });
        }
      });
    });
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }

  function bootstrap() {
    initLucideIcons();
    initTheme();
    initFilters();
    initCopyToClipboard();
    initPrint();
    initScrollAnimations();
    initSmoothScroll();

    // Add loaded class for any CSS transitions
    document.body.classList.add('loaded');

    console.log('✨ Currículo interativo carregado com sucesso!');
  }

  // Start the app
  init();

  // Expose for debugging (optional)
  window.CurriculoApp = {
    state,
    applyTheme,
    toggleTheme
  };
})();