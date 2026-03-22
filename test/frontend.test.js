const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const ROOT_DIR = path.join(__dirname, '..');

async function loadPage(htmlFile, url, options = {}) {
  const { Window } = await import('happy-dom');
  const window = new Window({
    url,
    settings: {
      disableJavaScriptEvaluation: false,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true
    }
  });

  const html = await fs.readFile(path.join(ROOT_DIR, htmlFile), 'utf8');
  const siteData = await fs.readFile(path.join(ROOT_DIR, 'js', 'site-data.js'), 'utf8');
  const mainScript = await fs.readFile(path.join(ROOT_DIR, 'js', 'main.js'), 'utf8');

  window.IntersectionObserver = class {
    observe(element) {
      element.classList.add('visible');
    }

    unobserve() {}

    disconnect() {}
  };

  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
  window.setInterval = () => 1;
  window.clearInterval = () => {};
  window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
  window.fetch = options.fetchImpl || (async () => ({
    ok: true,
    json: async () => ({ ok: true, message: 'Lead saved.' })
  }));

  window.document.write(html);
  window.document.close();
  window.eval(siteData);
  window.eval(mainScript);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await window.happyDOM.whenAsyncComplete();

  return window;
}

test('home page renders featured listings from shared data', async (t) => {
  const window = await loadPage('index.html', 'http://127.0.0.1:3000/');
  t.after(() => window.close());
  const cards = window.document.querySelectorAll('[data-listings-grid="home-featured"] .listing-card');

  assert.equal(cards.length, 3);
  assert.match(cards[0].textContent, /\$1,385,000/);
  assert.match(cards[0].getAttribute('href'), /listing-detail\.html\?listing=/);
});

test('listings page applies query filters and updates search controls', async (t) => {
  const window = await loadPage(
    'listings.html',
    'http://127.0.0.1:3000/listings.html?location=Ashburn&beds=4&filter=featured'
  );
  t.after(() => window.close());

  const cards = window.document.querySelectorAll('[data-listings-grid="search-results"] .listing-card');
  const resultsCopy = window.document.querySelector('[data-results-copy]');
  const locationInput = window.document.querySelector('[name="location"]');
  const bedsSelect = window.document.querySelector('[name="beds"]');

  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /42778 Ravenglass Dr/);
  assert.match(resultsCopy.textContent, /1 transaction found/i);
  assert.equal(locationInput.value, 'Ashburn');
  assert.equal(bedsSelect.value, '4');
});

test('listing detail page hydrates address, map, and mortgage summary', async (t) => {
  const window = await loadPage(
    'listing-detail.html',
    'http://127.0.0.1:3000/listing-detail.html?listing=23957-nightsong-ct-aldie-va-20105'
  );
  t.after(() => window.close());

  const title = window.document.title;
  const heading = window.document.querySelector('#listing-primary-content h1');
  const mapFrame = window.document.querySelector('.listing-map-card iframe');
  const mortgageTotal = window.document.querySelector('.mortgage-total');
  const galleryImages = window.document.querySelectorAll('#listing-gallery img');

  assert.match(title, /23957 Nightsong Ct/);
  assert.equal(heading.textContent.trim(), '23957 Nightsong Ct');
  assert.equal(galleryImages.length, 3);
  assert.match(mapFrame.getAttribute('src'), /23957%20Nightsong%20Ct/);
  assert.match(mortgageTotal.textContent, /\$/);
});

test('contact form posts a real lead payload to the API endpoint', async (t) => {
  let requestPayload = null;

  const window = await loadPage('contact.html', 'http://127.0.0.1:3000/contact.html', {
    fetchImpl: async (url, options) => {
      requestPayload = {
        url,
        options
      };

      return {
        ok: true,
        json: async () => ({ ok: true, message: 'Lead saved.' })
      };
    }
  });
  t.after(() => window.close());

  window.document.getElementById('contact-first-name').value = 'Jordan';
  window.document.getElementById('contact-last-name').value = 'Lee';
  window.document.getElementById('contact-email').value = 'jordan@example.com';
  window.document.getElementById('contact-phone').value = '571-555-0100';
  window.document.getElementById('contact-message').value = 'Looking for a home in Broadlands.';

  const form = window.document.querySelector('[data-lead-form="contact"]');
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await window.happyDOM.whenAsyncComplete();

  assert.ok(requestPayload);
  assert.equal(requestPayload.url, '/api/leads');

  const body = JSON.parse(requestPayload.options.body);
  assert.equal(body.firstName, 'Jordan');
  assert.equal(body.lastName, 'Lee');
  assert.equal(body.email, 'jordan@example.com');
  assert.equal(body.inquiryType, 'Buying a Home');
  assert.match(body.pagePath, /contact\.html/);
  assert.match(window.document.querySelector('.form-status').textContent, /sent successfully/i);
});
