(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var menuToggle = document.getElementById('menuToggle');
  var mainNav = document.getElementById('mainNav');
  var navLinks = document.querySelectorAll('.nav-link');
  var sections = document.querySelectorAll('main section[id]');
  var yearEl = document.getElementById('year');
  var backToTop = document.getElementById('backToTop');
  var reveals = document.querySelectorAll('.reveal');
  var statNumbers = document.querySelectorAll('.stat-number');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Header background on scroll */
  function onScroll() {
    if (window.scrollY > 12) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Scroll-spy for nav active state */
  if ('IntersectionObserver' in window && sections.length) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            navLinks.forEach(function (link) {
              link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach(function (section) { spyObserver.observe(section); });
  }

  /* Reveal on scroll */
  if ('IntersectionObserver' in window && reveals.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* Animated stat counters */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    var duration = 1100;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }
    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && statNumbers.length) {
    var statObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNumbers.forEach(function (el) { statObserver.observe(el); });
  }

  /* Back to top */
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Phone number: hidden from source, revealed on click, second click calls */
  var phoneCard = document.getElementById('phoneCard');
  var phoneValue = document.getElementById('phoneValue');
  if (phoneCard && phoneValue) {
    phoneCard.addEventListener('click', function () {
      if (phoneCard.classList.contains('is-revealed')) {
        window.location.href = 'tel:' + phoneCard.dataset.tel;
        return;
      }
      var decoded = atob(phoneCard.getAttribute('data-phone-enc'));
      phoneValue.textContent = decoded;
      phoneValue.classList.remove('contact-value-mask');
      phoneCard.classList.add('is-revealed');
      phoneCard.dataset.tel = decoded.replace(/\s+/g, '');
      phoneCard.setAttribute('aria-label', 'Call ' + decoded);
    });
  }

  /* Email: copy to clipboard + visible confirmation, on top of the mailto: link */
  function wireEmailCopy(el, valueEl, activeLabel, idleLabel, duration) {
    if (!el) return;
    el.addEventListener('click', function () {
      var email = el.getAttribute('href').replace('mailto:', '').split('?')[0];
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(email).then(function () {
        if (!valueEl) return;
        var original = valueEl.textContent;
        valueEl.textContent = activeLabel;
        valueEl.classList.add('copied');
        window.setTimeout(function () {
          valueEl.textContent = idleLabel || original;
          valueEl.classList.remove('copied');
        }, duration || 1800);
      }).catch(function () {});
    });
  }
  wireEmailCopy(
    document.getElementById('emailCard'),
    document.getElementById('emailValue'),
    'Copied to clipboard ✓'
  );
  wireEmailCopy(
    document.getElementById('ctaEmailBtn'),
    document.getElementById('ctaEmailBtn'),
    'Copied ✓ opening mail…',
    'Send an email'
  );

  /* Contact form -> /api/contact (Resend) */
  var contactForm = document.getElementById('contactForm');
  var cfSubmit = document.getElementById('cfSubmit');
  var cfStatus = document.getElementById('cfStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var formData = new FormData(contactForm);
      var payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        company: formData.get('company')
      };

      cfSubmit.disabled = true;
      cfSubmit.textContent = 'Sending...';
      cfStatus.textContent = '';
      cfStatus.className = 'form-status';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            cfStatus.textContent = "Message sent — I'll get back to you soon.";
            cfStatus.className = 'form-status form-status-success';
            contactForm.reset();
          } else {
            cfStatus.textContent = (result.data && result.data.error) || 'Something went wrong. Please try again.';
            cfStatus.className = 'form-status form-status-error';
          }
        })
        .catch(function () {
          cfStatus.textContent = 'Network error. Please try again in a moment.';
          cfStatus.className = 'form-status form-status-error';
        })
        .finally(function () {
          cfSubmit.disabled = false;
          cfSubmit.textContent = 'Send message';
        });
    });
  }
})();
