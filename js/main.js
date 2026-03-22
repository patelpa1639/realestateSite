/* ============================================
   NEENA K HOMES - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Navigation Scroll Effect ----------
  const nav = document.querySelector('.nav');
  if (nav) {
    const handleScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ---------- Mobile Nav Toggle ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const spans = navToggle.querySelectorAll('span');
      if (navLinks.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ---------- Scroll Animations ----------
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up, .fade-in').forEach(el => {
    observer.observe(el);
  });

  // ---------- Testimonial Carousel ----------
  const testimonials = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.testimonial-dot');
  let currentTestimonial = 0;
  let testimonialInterval;

  function showTestimonial(index) {
    testimonials.forEach((t, i) => {
      t.style.display = i === index ? 'block' : 'none';
      t.style.opacity = i === index ? '1' : '0';
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
    currentTestimonial = index;
  }

  if (testimonials.length > 0) {
    showTestimonial(0);

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        showTestimonial(i);
        clearInterval(testimonialInterval);
        startAutoRotate();
      });
    });

    function startAutoRotate() {
      testimonialInterval = setInterval(() => {
        showTestimonial((currentTestimonial + 1) % testimonials.length);
      }, 6000);
    }
    startAutoRotate();
  }

  // ---------- Listing Favorite Toggle ----------
  document.querySelectorAll('.listing-favorite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const heart = btn.textContent.trim();
      btn.textContent = heart === '\u2661' ? '\u2665' : '\u2661';
      btn.style.color = heart === '\u2661' ? '#e74c3c' : '';
    });
  });

  // ---------- Listing Filter ----------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const listingCards = document.querySelectorAll('.listing-card[data-type]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      listingCards.forEach(card => {
        if (filter === 'all' || card.dataset.type === filter) {
          card.style.display = '';
          setTimeout(() => card.style.opacity = '1', 10);
        } else {
          card.style.opacity = '0';
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });

  // ---------- Smooth Anchor Scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks) navLinks.classList.remove('open');
      }
    });
  });

  // ---------- Counter Animation ----------
  function animateCounters() {
    document.querySelectorAll('.stat-number, .hero-stat-number').forEach(counter => {
      if (counter.dataset.animated) return;
      const target = counter.textContent;
      const numericPart = parseInt(target.replace(/[^0-9]/g, ''));
      const suffix = target.replace(/[0-9]/g, '');
      const prefix = target.match(/^\D+/) ? target.match(/^\D+/)[0] : '';

      if (isNaN(numericPart)) return;

      counter.dataset.animated = 'true';
      let current = 0;
      const increment = numericPart / 60;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericPart) {
          counter.textContent = target;
          clearInterval(timer);
        } else {
          counter.textContent = prefix + Math.floor(current) + suffix;
        }
      }, 20);
    });
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stats-bar, .hero-stats').forEach(el => {
    statsObserver.observe(el);
  });

  // ---------- Form Submission ----------
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.btn');
      const originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = 'Sent Successfully!';
        btn.style.background = '#27ae60';
        form.reset();

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });
  });

  // ---------- Search Bar ----------
  const searchForm = document.querySelector('.search-bar form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'listings.html';
    });
  }

});
