const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

function loadServer(tempDir, leadsFile) {
  const serverPath = path.join(__dirname, '..', 'server.js');
  delete require.cache[require.resolve(serverPath)];
  process.env.LEADS_FILE = leadsFile;
  process.env.PORT = '0';
  return require(serverPath);
}

test('serves the homepage', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'realestate-site-'));
  const leadsFile = path.join(tempDir, 'leads.ndjson');
  const { createServer } = loadServer(tempDir, leadsFile);
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());

  const url = `http://127.0.0.1:${server.address().port}/`;
  const res = await fetch(url);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Neena K Homes/);
});

test('appends valid leads and rejects invalid payloads', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'realestate-site-'));
  const leadsFile = path.join(tempDir, 'leads.ndjson');
  const { createServer } = loadServer(tempDir, leadsFile);
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const okRes = await fetch(`${baseUrl}/api/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Alex',
      lastName: 'Kim',
      email: 'alex@example.com',
      message: 'Looking to buy in Ashburn.',
      inquiryType: 'Buying a Home'
    })
  });

  assert.equal(okRes.status, 201);
  assert.deepEqual(await okRes.json(), { ok: true, message: 'Lead saved.' });

  const contents = await fs.readFile(leadsFile, 'utf8');
  assert.match(contents, /alex@example.com/);
  assert.match(contents, /Looking to buy in Ashburn/);

  const badRes = await fetch(`${baseUrl}/api/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Missing contact info' })
  });

  assert.equal(badRes.status, 400);
  const badJson = await badRes.json();
  assert.equal(badJson.ok, false);
  assert.match(badJson.error, /contact method/i);
});
