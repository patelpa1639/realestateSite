/* ============================================
   NEENA K HOMES - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.NK_DATA || { listings: [], neighborhoods: [], office: {} };
  const listings = Array.isArray(data.listings) ? data.listings : [];
  const neighborhoods = Array.isArray(data.neighborhoods) ? data.neighborhoods : [];
  const formEndpoint = window.NK_FORM_ENDPOINT || 'https://formsubmit.co/ajax/realtor.neena.kalra@gmail.com';
  const crmEndpoint = 'https://nkhomes-arm-intelligence.vercel.app/api/submissions';
  const loftyCrmEndpoint = 'https://nkhomes-arm-intelligence.vercel.app/api/lofty';
  const favoriteStorageKey = 'nk-favorite-listings';
  const favoriteSet = new Set(readFavorites());

  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  let animationObserver = null;

  initNavigation();
  initAnimationObserver();
  initTestimonials();
  initSmoothAnchors();
  initCounters();
  initSearchForms();
  renderHomeFeaturedListings();
  initListingsPage();
  initListingDetailPage();
  initLeadForms();
  initFavoriteToggle();

  function readFavorites() {
    try {
      const raw = window.localStorage.getItem(favoriteStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveFavorites() {
    try {
      window.localStorage.setItem(favoriteStorageKey, JSON.stringify(Array.from(favoriteSet)));
    } catch {
      // Ignore storage errors.
    }
  }

  function initNavigation() {
    if (nav) {
      const handleScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

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
  }

  function initAnimationObserver() {
    animationObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animationObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    observeAnimatedElements(document);
  }

  function observeAnimatedElements(root) {
    if (!animationObserver) return;
    root.querySelectorAll('.fade-up, .fade-in').forEach((element) => {
      animationObserver.observe(element);
    });
  }

  function initTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonial-dot');

    if (!testimonials.length || !dots.length) return;

    let currentTestimonial = 0;
    let testimonialInterval;

    function showTestimonial(index) {
      testimonials.forEach((testimonial, itemIndex) => {
        testimonial.style.display = itemIndex === index ? 'block' : 'none';
        testimonial.style.opacity = itemIndex === index ? '1' : '0';
      });

      dots.forEach((dot, itemIndex) => {
        dot.classList.toggle('active', itemIndex === index);
      });

      currentTestimonial = index;
    }

    function startAutoRotate() {
      testimonialInterval = window.setInterval(() => {
        showTestimonial((currentTestimonial + 1) % testimonials.length);
      }, 6000);
    }

    showTestimonial(0);

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showTestimonial(index);
        window.clearInterval(testimonialInterval);
        startAutoRotate();
      });
    });

    startAutoRotate();
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function onClick(event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks) navLinks.classList.remove('open');
      });
    });
  }

  function initCounters() {
    function animateCounters() {
      document.querySelectorAll('.stat-number, .hero-stat-number').forEach((counter) => {
        if (counter.dataset.animated) return;

        const target = counter.textContent || '';
        const numericPart = parseInt(target.replace(/[^0-9]/g, ''), 10);
        const suffix = target.replace(/[0-9]/g, '');
        const prefixMatch = target.match(/^\D+/);
        const prefix = prefixMatch ? prefixMatch[0] : '';

        if (Number.isNaN(numericPart)) return;

        counter.dataset.animated = 'true';
        let current = 0;
        const increment = numericPart / 60;
        const timer = window.setInterval(() => {
          current += increment;
          if (current >= numericPart) {
            counter.textContent = target;
            window.clearInterval(timer);
          } else {
            counter.textContent = prefix + Math.floor(current) + suffix;
          }
        }, 20);
      });
    }

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.stats-bar, .hero-stats').forEach((element) => {
      statsObserver.observe(element);
    });
  }

  function initFavoriteToggle() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('.listing-favorite');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const slug = button.dataset.slug;
      if (!slug) return;

      if (favoriteSet.has(slug)) {
        favoriteSet.delete(slug);
      } else {
        favoriteSet.add(slug);
      }

      saveFavorites();
      syncFavoriteButtons();
    });

    syncFavoriteButtons();
  }

  function syncFavoriteButtons() {
    document.querySelectorAll('.listing-favorite[data-slug]').forEach((button) => {
      const active = favoriteSet.has(button.dataset.slug);
      button.textContent = active ? '\u2665' : '\u2661';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function initSearchForms() {
    document.querySelectorAll('[data-search-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        const formData = new FormData(form);

        ['location', 'type', 'price', 'beds'].forEach((field) => {
          const value = String(formData.get(field) || '').trim();
          if (value) params.set(field, value);
        });

        const currentFilter = getInitialListingFilter();
        if (currentFilter && currentFilter !== 'all') {
          params.set('filter', currentFilter);
        }

        window.location.href = `listings.html${params.toString() ? `?${params.toString()}` : ''}`;
      });
    });
  }

  function renderHomeFeaturedListings() {
    const grid = document.querySelector('[data-listings-grid="home-featured"]');
    if (!grid || !listings.length) return;

    const featured = listings.filter((listing) => listing.tags.includes('featured')).slice(0, 3);
    grid.innerHTML = featured.map((listing) => renderListingCard(listing)).join('');
    observeAnimatedElements(grid);
    syncFavoriteButtons();
  }

  function initListingsPage() {
    const grid = document.querySelector('[data-listings-grid="search-results"]');
    if (!grid || !listings.length) return;

    const searchForm = document.querySelector('[data-search-form="listings"]');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const resultsCopy = document.querySelector('[data-results-copy]');
    const emptyState = document.querySelector('[data-empty-state]');

    const params = new URLSearchParams(window.location.search);
    const state = {
      filter: getInitialListingFilter()
    };

    populateSearchForm(searchForm, params);
    syncFilterButtons();
    render();

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter || 'all';
        syncFilterButtons();
        render();
        updateListingUrl(params, state.filter);
      });
    });

    function render() {
      const results = filterListings(params, state.filter);
      grid.innerHTML = results.map((listing) => renderListingCard(listing)).join('');
      emptyState.hidden = results.length > 0;

      const copyParts = [];
      if (params.get('location')) copyParts.push(`for "${params.get('location')}"`);
      if (params.get('type')) copyParts.push(params.get('type'));
      if (params.get('beds')) copyParts.push(`${params.get('beds')}+ beds`);
      if (params.get('price')) copyParts.push(priceLabel(params.get('price')));
      if (state.filter !== 'all') copyParts.push(filterLabel(state.filter));

      resultsCopy.textContent = copyParts.length
        ? `${results.length} transaction${results.length === 1 ? '' : 's'} found ${copyParts.join(' • ')}.`
        : `${results.length} recent Northern Virginia transaction${results.length === 1 ? '' : 's'} highlighted here.`;

      observeAnimatedElements(grid);
      syncFavoriteButtons();
    }

    function syncFilterButtons() {
      filterButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.filter === state.filter);
      });
    }
  }

  function getInitialListingFilter() {
    const params = new URLSearchParams(window.location.search);
    const queryFilter = params.get('filter');
    const hashFilter = window.location.hash.replace('#', '');
    const allowedFilters = new Set(['all', 'featured', 'new', 'premium', 'sold', 'loudoun', 'fairfax']);

    if (queryFilter && allowedFilters.has(queryFilter)) return queryFilter;
    if (hashFilter && allowedFilters.has(hashFilter)) return hashFilter;
    return 'all';
  }

  function updateListingUrl(existingParams, filter) {
    const nextParams = new URLSearchParams(existingParams.toString());
    if (filter && filter !== 'all') {
      nextParams.set('filter', filter);
    } else {
      nextParams.delete('filter');
    }

    const query = nextParams.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${filter && filter !== 'all' ? `#${filter}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }

  function populateSearchForm(form, params) {
    if (!form) return;

    ['location', 'type', 'price', 'beds'].forEach((field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;
      input.value = params.get(field) || '';
    });
  }

  function filterListings(params, filter) {
    let results = listings.slice();
    const location = (params.get('location') || '').trim().toLowerCase();
    const type = params.get('type') || '';
    const price = params.get('price') || '';
    const beds = Number(params.get('beds') || 0);

    if (location) {
      results = results.filter((listing) => {
        const haystack = [
          listing.address,
          listing.city,
          listing.zip,
          listing.county,
          listing.neighborhoodSlug
        ].join(' ').toLowerCase();
        return haystack.includes(location);
      });
    }

    if (type) {
      results = results.filter((listing) => listing.type === type);
    }

    if (price) {
      results = results.filter((listing) => priceMatches(listing.price, price));
    }

    if (beds > 0) {
      results = results.filter((listing) => listing.beds >= beds);
    }

    if (filter && filter !== 'all') {
      results = results.filter((listing) => listing.tags.includes(filter) || listing.statusStyle === filter);
    }

    return results;
  }

  function initListingDetailPage() {
    const primaryContent = document.getElementById('listing-primary-content');
    if (!primaryContent || !listings.length) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('listing');
    const listing = listings.find((item) => item.slug === slug) || listings[0];
    const neighborhood = neighborhoods.find((item) => item.slug === listing.neighborhoodSlug);

    updateListingHead(listing);
    renderListingGallery(listing);
    renderListingPrimaryContent(listing, neighborhood);
    initMortgageCalculator(listing);
    hydrateShowingForm(listing);
    renderSimilarListings(listing);
  }

  function updateListingHead(listing) {
    document.title = `${listing.address}, ${listing.city} | Neena K Homes`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `${listing.beds} bed, ${listing.baths} bath ${listing.type.toLowerCase()} in ${listing.city}, ${listing.state}. ${formatNumber(listing.sqft)} sqft listed by Neena K Homes.`
      );
    }

    const breadcrumbs = document.getElementById('listing-breadcrumbs');
    if (breadcrumbs) {
      breadcrumbs.innerHTML = `
        <a href="index.html">Home</a> <span>/</span>
        <a href="listings.html">Listings</a> <span>/</span>
        ${listing.address}
      `;
    }
  }

  function renderListingGallery(listing) {
    const gallery = document.getElementById('listing-gallery');
    if (!gallery) return;

    gallery.innerHTML = listing.gallery
      .slice(0, 3)
      .map((image, index) => `<img src="${image}" alt="${listing.address} photo ${index + 1}">`)
      .join('');
  }

  function renderListingPrimaryContent(listing, neighborhood) {
    const container = document.getElementById('listing-primary-content');
    if (!container) return;

    const propertyDetails = [
      ['Property Type', listing.type],
      ['Year Built', listing.yearBuilt],
      ['Garage', listing.garage],
      ['HOA', listing.hoa ? `${formatCurrency(listing.hoa)}/month` : 'None'],
      ['Heating', listing.heating],
      ['Cooling', listing.cooling],
      ['School District', listing.schoolDistrict],
      ['MLS #', listing.mls]
    ];

    const neighborhoodLink = neighborhood ? `${neighborhood.slug}.html` : 'neighborhoods.html';
    const neighborhoodName = neighborhood ? neighborhood.name : capitalizeWords(listing.neighborhoodSlug.replace(/-/g, ' '));

    container.innerHTML = `
      <span class="listing-badge ${listing.statusStyle}" style="display: inline-block; margin-bottom: 1rem;">${listing.status}</span>
      <h1 class="listing-page-title">${listing.address}</h1>
      <p class="listing-page-location">${listing.city}, ${listing.state} ${listing.zip}</p>
      <div class="listing-price listing-page-price">${formatCurrency(listing.price)}</div>

      <div class="listing-detail-features">
        <div class="listing-detail-feature">
          <div class="value">${listing.beds}</div>
          <div class="label">Bedrooms</div>
        </div>
        <div class="listing-detail-feature">
          <div class="value">${listing.baths}</div>
          <div class="label">Bathrooms</div>
        </div>
        <div class="listing-detail-feature">
          <div class="value">${formatNumber(listing.sqft)}</div>
          <div class="label">Square Feet</div>
        </div>
        <div class="listing-detail-feature">
          <div class="value">${listing.acres}</div>
          <div class="label">Acres</div>
        </div>
      </div>

      <div class="listing-section">
        <h3>About This Home</h3>
        ${listing.summary.map((paragraph) => `<p>${paragraph}</p>`).join('')}
      </div>

      <div class="listing-section">
        <h3>Why Buyers Save This One</h3>
        <div class="listing-highlight-grid">
          ${listing.highlights.map((highlight) => `<div class="listing-highlight-chip">${highlight}</div>`).join('')}
        </div>
      </div>

      <div class="listing-section">
        <h3>Property Details</h3>
        <div class="listing-detail-table">
          ${propertyDetails.map(([label, value]) => `
            <div class="listing-detail-row">
              <span>${label}</span>
              <strong>${value}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="listing-section">
        <h3>Neighborhood Context</h3>
        <div class="listing-neighborhood-card">
          <div>
            <span class="section-label" style="margin-bottom: 0.45rem;">Located In</span>
            <h4>${neighborhoodName}</h4>
            <p>${neighborhood ? neighborhood.overview : listing.description}</p>
          </div>
          <a href="${neighborhoodLink}" class="btn btn-outline-dark">Explore ${neighborhoodName}</a>
        </div>
      </div>

      <div class="listing-section">
        <h3>Location</h3>
        <div class="listing-map-card">
          <iframe
            title="Map of ${listing.address}"
            src="https://www.google.com/maps?q=${encodeURIComponent(listing.mapQuery)}&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    `;
  }

  function hydrateShowingForm(listing) {
    const form = document.querySelector('[data-lead-form="showing-request"]');
    if (!form) return;

    form.dataset.propertyAddress = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`;
    form.dataset.inquiryType = 'Similar Homes Request';
    form.dataset.defaultMessage = `I would like similar active homes to ${listing.address}.`;
  }

  function initMortgageCalculator(listing) {
    const summary = document.getElementById('mortgage-summary');
    if (!summary) return;

    const inputs = {
      price: document.getElementById('mortgage-price'),
      downPaymentPercent: document.getElementById('mortgage-down'),
      interestRate: document.getElementById('mortgage-rate'),
      taxes: document.getElementById('mortgage-tax'),
      insurance: document.getElementById('mortgage-insurance'),
      hoa: document.getElementById('mortgage-hoa')
    };

    if (!inputs.price || !inputs.downPaymentPercent || !inputs.interestRate || !inputs.taxes || !inputs.insurance || !inputs.hoa) return;

    inputs.price.value = String(listing.price);
    inputs.taxes.value = String(listing.taxesMonthly || 0);
    inputs.insurance.value = String(listing.insuranceMonthly || 0);
    inputs.hoa.value = String(listing.hoa || 0);

    const updateSummary = () => {
      const price = Number(inputs.price.value || 0);
      const downPaymentPercent = Number(inputs.downPaymentPercent.value || 0);
      const interestRate = Number(inputs.interestRate.value || 0) / 100;
      const taxes = Number(inputs.taxes.value || 0);
      const insurance = Number(inputs.insurance.value || 0);
      const hoa = Number(inputs.hoa.value || 0);
      const loanAmount = Math.max(price * (1 - downPaymentPercent / 100), 0);
      const monthlyRate = interestRate / 12;
      const months = 30 * 12;

      let principalAndInterest = 0;
      if (loanAmount > 0) {
        if (monthlyRate === 0) {
          principalAndInterest = loanAmount / months;
        } else {
          principalAndInterest = loanAmount * (monthlyRate * (1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
        }
      }

      const total = principalAndInterest + taxes + insurance + hoa;

      summary.innerHTML = `
        <div class="mortgage-total">${formatCurrency(total)}</div>
        <div class="mortgage-total-label">Estimated Monthly Payment</div>
        <div class="mortgage-breakdown">
          <div><span>Principal &amp; Interest</span><strong>${formatCurrency(principalAndInterest)}</strong></div>
          <div><span>Property Tax</span><strong>${formatCurrency(taxes)}</strong></div>
          <div><span>Insurance</span><strong>${formatCurrency(insurance)}</strong></div>
          <div><span>HOA</span><strong>${formatCurrency(hoa)}</strong></div>
        </div>
      `;
    };

    Object.values(inputs).forEach((input) => {
      input.addEventListener('input', updateSummary);
    });

    updateSummary();
  }

  function renderSimilarListings(currentListing) {
    const grid = document.querySelector('[data-listings-grid="similar-listings"]');
    if (!grid) return;

    const similar = listings
      .filter((listing) => listing.slug !== currentListing.slug)
      .sort((left, right) => similarityScore(right, currentListing) - similarityScore(left, currentListing))
      .slice(0, 3);

    grid.innerHTML = similar.map((listing) => renderListingCard(listing)).join('');
    observeAnimatedElements(grid);
    syncFavoriteButtons();
  }

  function similarityScore(candidate, current) {
    let score = 0;
    if (candidate.neighborhoodSlug === current.neighborhoodSlug) score += 6;
    if (candidate.city === current.city) score += 4;
    if (candidate.type === current.type) score += 3;
    score += Math.max(0, 5 - Math.abs(candidate.beds - current.beds));
    score += Math.max(0, 5 - Math.abs(candidate.price - current.price) / 250000);
    return score;
  }

  function initLeadForms() {
    document.querySelectorAll('[data-lead-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const honeypot = form.querySelector('[name="company"]');
        if (honeypot && honeypot.value.trim()) return;

        const button = form.querySelector('.btn');
        const status = form.querySelector('.form-status');
        const originalText = button ? button.textContent : '';
        const payload = buildLeadPayload(form);

        if (!payload.email && !payload.phone) {
          if (status) status.textContent = 'Add at least an email address or phone number so Neena can reply.';
          return;
        }

        if (button) {
          button.disabled = true;
          button.textContent = 'Sending...';
        }
        if (status) status.textContent = 'Sending your details...';

        try {
          // Send to Lofty CRM via proxy
          const loftyBody = {
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            name: payload.name || '',
            email: payload.email || '',
            phone: payload.phone || '',
            formType: form.dataset.leadForm || 'general',
          };

          const loftyResponse = await fetch(loftyCrmEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loftyBody),
          });
          if (!loftyResponse.ok) {
            throw new Error('Submission failed. Please try again.');
          }

          // Also try FormSubmit for email notification (best-effort)
          try {
            await fetch(formEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
              },
              body: JSON.stringify(payload)
            });
          } catch (_) { /* email notification is best-effort */ }

          form.reset();
          if (status) status.textContent = 'Thanks! Neena will be in touch shortly.';

          if (form.dataset.leadForm === 'showing-request' && form.dataset.defaultMessage) {
            const messageField = form.querySelector('[name="message"]');
            if (messageField) messageField.value = form.dataset.defaultMessage;
          }
        } catch (error) {
          if (status) {
            status.textContent = error instanceof Error ? error.message : 'Unable to send your request right now.';
          }
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      });

      if (form.dataset.leadForm === 'showing-request' && form.dataset.defaultMessage) {
        const messageField = form.querySelector('[name="message"]');
        if (messageField && !messageField.value) {
          messageField.value = form.dataset.defaultMessage;
        }
      }
    });
  }

  function buildLeadPayload(form) {
    const formData = new FormData(form);
    const payload = {};

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        payload[key] = value.trim();
      }
    });

    if (payload.name && !payload.firstName && !payload.lastName) {
      payload.name = payload.name.trim();
    }

    payload.pagePath = `${window.location.pathname}${window.location.search}`;
    payload.source = 'website';
    payload._subject = `New website lead: ${payload.inquiryType}`;
    payload._template = 'table';
    payload._captcha = 'false';

    if (form.dataset.propertyAddress) {
      payload.propertyAddress = form.dataset.propertyAddress;
    }

    if (form.dataset.inquiryType && !payload.inquiryType) {
      payload.inquiryType = form.dataset.inquiryType;
    }

    if (!payload.inquiryType) {
      const labels = {
        contact: 'General Website Inquiry',
        valuation: 'Home Valuation Request',
        'showing-request': 'Similar Homes Request'
      };
      payload.inquiryType = labels[form.dataset.leadForm] || 'Website Inquiry';
    }

    if (form.dataset.leadForm === 'showing-request' && !payload.message && form.dataset.defaultMessage) {
      payload.message = form.dataset.defaultMessage;
    }

    delete payload.company;
    return payload;
  }

  function renderListingCard(listing) {
    const addressLine = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`;
    return `
      <a href="listing-detail.html?listing=${listing.slug}" class="listing-card fade-up" data-slug="${listing.slug}">
        <div class="listing-card-image">
          <img src="${listing.heroImage}" alt="${addressLine}">
          <span class="listing-badge ${listing.statusStyle}">${listing.status}</span>
          <button class="listing-favorite" aria-label="Save ${addressLine}" aria-pressed="false" data-slug="${listing.slug}">\u2661</button>
        </div>
        <div class="listing-card-body">
          <div class="listing-price">${formatCurrency(listing.price)}</div>
          <div class="listing-address">${addressLine}</div>
          <div class="listing-features">
            <span class="listing-feature">${listing.beds} Beds</span>
            <span class="listing-feature">${listing.baths} Baths</span>
            <span class="listing-feature">${formatNumber(listing.sqft)} Sqft</span>
          </div>
        </div>
      </a>
    `;
  }

  function priceMatches(priceValue, filterValue) {
    if (!filterValue) return true;
    if (filterValue.endsWith('+')) {
      return priceValue >= Number(filterValue.replace('+', ''));
    }

    const [min, max] = filterValue.split('-').map((value) => Number(value));
    return priceValue >= min && priceValue <= max;
  }

  function priceLabel(filterValue) {
    if (!filterValue) return '';
    if (filterValue.endsWith('+')) {
      return `${formatCurrency(Number(filterValue.replace('+', '')))}+`;
    }

    const [min, max] = filterValue.split('-').map((value) => Number(value));
    return `${formatCurrency(min)} to ${formatCurrency(max)}`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(Number(value || 0));
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }

  function filterLabel(value) {
    const labels = {
      sold: 'recent closings',
      loudoun: 'Loudoun County',
      fairfax: 'Fairfax County',
      premium: 'premium sales',
      featured: 'featured transactions',
      new: 'recent additions'
    };

    return labels[value] || value;
  }

  function capitalizeWords(value) {
    return value.split(' ').map(capitalize).join(' ');
  }
});
