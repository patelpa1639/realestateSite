const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT_DIR = __dirname;
const DEFAULT_PORT = Number(process.env.PORT || 3000);
const LEADS_FILE = process.env.LEADS_FILE || path.join(ROOT_DIR, 'data', 'leads.ndjson');
const LEAD_WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || '';

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon']
]);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sanitizeSegment(segment) {
  return decodeURIComponent(segment).replace(/\0/g, '');
}

function resolveStaticPath(requestPath) {
  const decodedPath = sanitizeSegment(requestPath.split('?')[0]);
  let safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  safePath = safePath.replace(/^[/\\]+/, '');

  if (!safePath || safePath === '.') {
    return path.join(ROOT_DIR, 'index.html');
  }

  const candidates = [];
  if (path.extname(safePath)) {
    candidates.push(path.join(ROOT_DIR, safePath));
  } else if (safePath.endsWith('/')) {
    candidates.push(path.join(ROOT_DIR, safePath, 'index.html'));
    candidates.push(path.join(ROOT_DIR, `${safePath.slice(0, -1)}.html`));
  } else {
    candidates.push(path.join(ROOT_DIR, `${safePath}.html`));
    candidates.push(path.join(ROOT_DIR, safePath, 'index.html'));
    candidates.push(path.join(ROOT_DIR, safePath));
  }

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (normalized.startsWith(ROOT_DIR)) {
      return normalized;
    }
  }

  return path.join(ROOT_DIR, 'index.html');
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function appendLead(lead) {
  await ensureParentDir(LEADS_FILE);
  await fs.appendFile(LEADS_FILE, `${JSON.stringify(lead)}\n`, 'utf8');
}

async function forwardLead(lead) {
  const response = await fetch(LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lead)
  });

  if (!response.ok) {
    const error = new Error(`Lead webhook failed with status ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
}

async function deliverLead(lead) {
  if (LEAD_WEBHOOK_URL) {
    await forwardLead(lead);
    return;
  }

  await appendLead(lead);
}

function normalizeLead(body, request) {
  const name = [body.firstName, body.lastName].filter(Boolean).join(' ').trim() || body.name || '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!email && !phone) {
    return { error: 'At least one contact method is required.' };
  }

  if (!name && !message && !body.propertyAddress && !body.inquiryType) {
    return { error: 'Lead payload is missing meaningful details.' };
  }

  return {
    lead: {
      submittedAt: new Date().toISOString(),
      pagePath: body.pagePath || request.headers.referer || '',
      userAgent: request.headers['user-agent'] || '',
      name,
      firstName: typeof body.firstName === 'string' ? body.firstName.trim() : '',
      lastName: typeof body.lastName === 'string' ? body.lastName.trim() : '',
      email,
      phone,
      inquiryType: typeof body.inquiryType === 'string' ? body.inquiryType.trim() : '',
      propertyAddress: typeof body.propertyAddress === 'string' ? body.propertyAddress.trim() : '',
      timeline: typeof body.timeline === 'string' ? body.timeline.trim() : '',
      budget: typeof body.budget === 'string' ? body.budget.trim() : '',
      preferredContactMethod: typeof body.preferredContactMethod === 'string' ? body.preferredContactMethod.trim() : '',
      message,
      source: typeof body.source === 'string' ? body.source.trim() : 'website'
    }
  };
}

async function collectJsonBody(request, limitBytes = 1_000_000) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > limitBytes) {
      const error = new Error('Request body too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

async function handleLeadSubmission(request, response) {
  if (request.method !== 'POST') {
    response.writeHead(405, { Allow: 'POST' });
    response.end();
    return;
  }

  const contentType = request.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    sendJson(response, 415, { ok: false, error: 'Content-Type must be application/json.' });
    return;
  }

  try {
    const body = await collectJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      sendJson(response, 400, { ok: false, error: 'Lead payload must be a JSON object.' });
      return;
    }

    const normalized = normalizeLead(body, request);
    if (normalized.error) {
      sendJson(response, 400, { ok: false, error: normalized.error });
      return;
    }

    await deliverLead(normalized.lead);
    sendJson(response, 201, { ok: true, message: 'Lead saved.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, {
      ok: false,
      error: statusCode === 500 ? 'Failed to save lead.' : error.message
    });
  }
}

async function serveStatic(request, response, pathname) {
  const decodedPath = sanitizeSegment(pathname.split('?')[0]);
  let safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  safePath = safePath.replace(/^[/\\]+/, '');

  const candidates = [];
  if (!safePath || safePath === '.') {
    candidates.push(path.join(ROOT_DIR, 'index.html'));
  } else if (path.extname(safePath)) {
    candidates.push(path.join(ROOT_DIR, safePath));
  } else if (safePath.endsWith('/')) {
    candidates.push(path.join(ROOT_DIR, safePath, 'index.html'));
    candidates.push(path.join(ROOT_DIR, `${safePath.slice(0, -1)}.html`));
  } else {
    candidates.push(path.join(ROOT_DIR, `${safePath}.html`));
    candidates.push(path.join(ROOT_DIR, safePath, 'index.html'));
    candidates.push(path.join(ROOT_DIR, safePath));
  }

  for (const filePath of candidates) {
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(ROOT_DIR)) {
      continue;
    }

    try {
      const stat = await fs.stat(normalized);
      if (!stat.isFile()) {
        continue;
      }

      const ext = path.extname(normalized).toLowerCase();
      const contentType = MIME_TYPES.get(ext) || 'application/octet-stream';
      response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      const stream = require('node:fs').createReadStream(normalized);
      stream.on('error', () => {
        if (!response.headersSent) {
          response.writeHead(500);
        }
        response.end();
      });
      stream.pipe(response);
      return;
    } catch {
      continue;
    }
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const parsedUrl = new URL(request.url, 'http://localhost');
      if (parsedUrl.pathname === '/health') {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (parsedUrl.pathname === '/api/leads') {
        await handleLeadSubmission(request, response);
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD, POST' });
        response.end();
        return;
      }

      await serveStatic(request, response, parsedUrl.pathname);
    } catch (error) {
      sendJson(response, 500, { ok: false, error: 'Unexpected server error.' });
    }
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(DEFAULT_PORT, () => {
    console.log(`Server running on http://localhost:${DEFAULT_PORT}`);
  });
}

module.exports = {
  createServer,
  resolveStaticPath,
  normalizeLead,
  collectJsonBody,
  LEADS_FILE
};
