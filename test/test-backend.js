/**
 * PhantomCheck AI — Automated Test Suite
 * Tests SSRF protection, AI response parsing, HTML extraction,
 * API error handling, and OCR functionality.
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const {
  app,
  isPrivateOrReservedIP,
  validateUrlForSSRF,
  parseAndValidateAiResponse,
  extractReadableWebText,
  inspectUrlCharacteristics,
  isKnownUrlShortener
} = require('../server');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failedTests++;
  }
}

async function main() {
  console.log('\n=======================================================');
  console.log('🧪 Starting PhantomCheck AI Automated Test Suite');
  console.log('=======================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: SSRF IP Filter
  // --------------------------------------------------------------------------
  console.log('--- 1. SSRF IP Validation Tests ---');

  runTest('Detects IPv4 loopback (127.0.0.1)', () => {
    assert.strictEqual(isPrivateOrReservedIP('127.0.0.1'), true);
  });

  runTest('Detects IPv4 private 10.x.x.x (10.0.0.5)', () => {
    assert.strictEqual(isPrivateOrReservedIP('10.0.0.5'), true);
  });

  runTest('Detects IPv4 private 192.168.x.x (192.168.1.100)', () => {
    assert.strictEqual(isPrivateOrReservedIP('192.168.1.100'), true);
  });

  runTest('Detects IPv4 private 172.16-31.x.x (172.20.1.1)', () => {
    assert.strictEqual(isPrivateOrReservedIP('172.20.1.1'), true);
  });

  runTest('Detects IPv4 link-local (169.254.169.254)', () => {
    assert.strictEqual(isPrivateOrReservedIP('169.254.169.254'), true);
  });

  runTest('Detects IPv4 broadcast (255.255.255.255)', () => {
    assert.strictEqual(isPrivateOrReservedIP('255.255.255.255'), true);
  });

  runTest('Detects IPv6 loopback (::1)', () => {
    assert.strictEqual(isPrivateOrReservedIP('::1'), true);
  });

  runTest('Detects IPv6 Unique Local Address (fc00::1)', () => {
    assert.strictEqual(isPrivateOrReservedIP('fc00::1'), true);
  });

  runTest('Allows valid public IPv4 address (8.8.8.8)', () => {
    assert.strictEqual(isPrivateOrReservedIP('8.8.8.8'), false);
  });

  runTest('Allows valid public IPv4 address (93.184.216.34)', () => {
    assert.strictEqual(isPrivateOrReservedIP('93.184.216.34'), false);
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 2: SSRF URL Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 2. SSRF URL Rejection Tests ---');

  await runAsyncTest('Rejects localhost hostname', async () => {
    let threw = false;
    try {
      await validateUrlForSSRF('http://localhost:3000/admin');
    } catch (err) {
      threw = true;
      assert(err.message.includes('forbidden') || err.message.includes('blocked'), `Unexpected error: ${err.message}`);
    }
    assert.strictEqual(threw, true, 'Should have rejected localhost');
  });

  await runAsyncTest('Rejects file:// URI scheme', async () => {
    let threw = false;
    try {
      await validateUrlForSSRF('file:///etc/passwd');
    } catch (err) {
      threw = true;
      assert(err.message.includes('Unsupported protocol'), `Unexpected error: ${err.message}`);
    }
    assert.strictEqual(threw, true, 'Should have rejected file:// scheme');
  });

  await runAsyncTest('Rejects javascript: URI scheme', async () => {
    let threw = false;
    try {
      await validateUrlForSSRF('javascript:alert(1)');
    } catch (err) {
      threw = true;
    }
    assert.strictEqual(threw, true, 'Should have rejected javascript:');
  });

  await runAsyncTest('Rejects embedded credentials in URL', async () => {
    let threw = false;
    try {
      await validateUrlForSSRF('http://admin:secret@example.com/');
    } catch (err) {
      threw = true;
      assert(err.message.includes('credentials'), `Unexpected error: ${err.message}`);
    }
    assert.strictEqual(threw, true, 'Should have rejected credentials');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 3: AI Response Parsing & Normalization
  // --------------------------------------------------------------------------
  console.log('\n--- 3. AI Response Parser & Sanitizer Tests ---');

  runTest('Parses clean, valid JSON report', () => {
    const raw = JSON.stringify({
      assessment: 'Suspicious Indicators Found',
      riskLevel: 'High',
      summary: 'Phishing attempt detected with urgent deadline.',
      warningSigns: [{ phrase: 'Account suspended in 24 hours', reason: 'Artificial urgency' }],
      evidenceAvailable: ['Account ending in 4102'],
      evidenceGaps: ['Official sender address unverified'],
      verificationSteps: ['Call bank support directly'],
      safeActions: ['Do not click link'],
      limitations: ['Text only evaluation']
    });

    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.assessment, 'Suspicious Indicators Found');
    assert.strictEqual(parsed.riskLevel, 'HIGH');
    assert.strictEqual(parsed.warningSigns.length, 1);
    assert.strictEqual(parsed.warningSigns[0].phrase, 'Account suspended in 24 hours');
  });

  runTest('Strips Markdown ```json fences from AI output', () => {
    const raw = "```json\n" + JSON.stringify({
      assessment: 'Needs Verification',
      riskLevel: 'Medium',
      summary: 'Sensational claims lacking evidence.',
      warningSigns: [],
      evidenceAvailable: [],
      evidenceGaps: [],
      verificationSteps: [],
      safeActions: [],
      limitations: []
    }) + "\n```";

    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.assessment, 'Needs Verification');
    assert.strictEqual(parsed.riskLevel, 'MEDIUM');
  });

  runTest('Repairs and extracts JSON with preamble commentary', () => {
    const raw = "Here is my detailed report:\n\n" + JSON.stringify({
      assessment: 'No Major Warning Signs Detected',
      riskLevel: 'Low',
      summary: 'Standard weather advisory.',
      warningSigns: [],
      evidenceAvailable: ['Wind speeds 25 to 35 mph'],
      evidenceGaps: [],
      verificationSteps: ['Check official NWS website'],
      safeActions: ['Follow local advisories'],
      limitations: ['Content evaluation only']
    }) + "\n\nHope this helps you!";

    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.assessment, 'No Significant Threats Detected');
    assert.strictEqual(parsed.riskLevel, 'LOW');
  });

  runTest('Normalizes non-standard assessment strings gracefully', () => {
    const raw = JSON.stringify({
      assessment: 'High suspicion / potential scam detected',
      riskLevel: 'critical-high',
      summary: 'Severe scam mechanics present.'
    });

    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.verdict, 'HIGH_RISK');
    assert.strictEqual(parsed.verdictLabel, 'High Risk Threat Detected');
    assert.strictEqual(parsed.riskLevel, 'HIGH');
    assert(Array.isArray(parsed.verificationSteps));
    assert(Array.isArray(parsed.safeActions));
    assert(Array.isArray(parsed.limitations));
  });

  runTest('Classifies HIGH_RISK verdict for credential theft / OTP scam', () => {
    const raw = JSON.stringify({
      verdict: 'HIGH_RISK',
      riskLevel: 'HIGH',
      summary: 'Severe phishing attempt asking for OTP.',
      warningSigns: [{ evidence: 'Send your 6-digit OTP', reason: 'Credential theft' }]
    });
    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.verdict, 'HIGH_RISK');
    assert.strictEqual(parsed.verdictLabel, 'High Risk Threat Detected');
    assert.strictEqual(parsed.riskLevel, 'HIGH');
  });

  runTest('Classifies SAFE verdict with No Significant Threats Detected', () => {
    const raw = JSON.stringify({
      verdict: 'SAFE',
      riskLevel: 'LOW',
      summary: 'Official weather notice with verifiable attributes.'
    });
    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.verdict, 'SAFE');
    assert.strictEqual(parsed.verdictLabel, 'No Significant Threats Detected');
    assert.strictEqual(parsed.riskLevel, 'LOW');
  });

  runTest('Classifies UNVERIFIED when evidence is insufficient or missing', () => {
    const raw = JSON.stringify({
      verdict: 'UNVERIFIED',
      riskLevel: 'UNKNOWN',
      summary: 'Claim cannot be corroborated with available data.'
    });
    const parsed = parseAndValidateAiResponse(raw);
    assert.strictEqual(parsed.verdict, 'UNVERIFIED');
    assert.strictEqual(parsed.verdictLabel, 'Needs Verification');
    assert.strictEqual(parsed.riskLevel, 'UNKNOWN');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 4: URL Characteristics & Shortener Inspection
  // --------------------------------------------------------------------------
  console.log('\n--- 4. URL Characteristics & Shortener Detection Tests ---');

  runTest('Detects known URL shorteners (bit.ly, tinyurl, t.co)', () => {
    assert.strictEqual(isKnownUrlShortener('bit.ly'), true);
    assert.strictEqual(isKnownUrlShortener('tinyurl.com'), true);
    assert.strictEqual(isKnownUrlShortener('t.co'), true);
    assert.strictEqual(isKnownUrlShortener('github.com'), false);
    assert.strictEqual(isKnownUrlShortener('wikipedia.org'), false);
  });

  runTest('Inspects URL for deceptive brand subdomains and raw IPs', () => {
    const res1 = inspectUrlCharacteristics(new URL('http://paypal.com.account-verify.xyz/login'));
    assert(res1.flags.length > 0, 'Should detect deceptive subdomain');
    assert(res1.flags.some(f => f.evidence.includes('paypal')), 'Should flag paypal brand in subdomain');

    const res2 = inspectUrlCharacteristics(new URL('http://198.51.100.12/phish'));
    assert(res2.isIp, 'Should detect raw IP hostname');
    assert(res2.flags.some(f => f.evidence.includes('raw IP')), 'Should flag raw IP address');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 5: HTML Text Extraction with Cheerio
  // --------------------------------------------------------------------------
  console.log('\n--- 5. HTML Extraction Tests ---');

  runTest('Removes scripts, styles, navs and extracts article content', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Breaking: Major Scientific Discovery</title>
          <meta name="description" content="Researchers find new atmospheric phenomenon.">
          <style>body { font-size: 14px; }</style>
          <script>console.log("malicious code here");</script>
        </head>
        <body>
          <nav><a href="/">Home</a><a href="/login">Login</a></nav>
          <article>
            <h1>Breaking: Major Scientific Discovery</h1>
            <p>Researchers announced today a landmark breakthrough in solar physics.</p>
            <p>The observation was confirmed by multiple astronomical observatories worldwide.</p>
          </article>
          <footer>Copyright 2026. All rights reserved.</footer>
        </body>
      </html>
    `;

    const extracted = extractReadableWebText(sampleHtml, 'https://example.com/news/123');
    assert.strictEqual(extracted.title, 'Breaking: Major Scientific Discovery');
    assert.strictEqual(extracted.description, 'Researchers find new atmospheric phenomenon.');
    assert(extracted.readableText.includes('landmark breakthrough in solar physics'));
    assert(!extracted.readableText.includes('malicious code here'), 'Should strip script tags');
    assert(!extracted.readableText.includes('Copyright 2026'), 'Should strip footer tags');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Express API Endpoint Integration
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Express API Endpoints Integration Tests ---');

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const testPort = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  // Helper fetch
  async function makeRequest(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, options);
    const json = await res.json().catch(() => null);
    return { status: res.status, headers: res.headers, data: json };
  }

  await runAsyncTest('GET /api/health returns health status', async () => {
    const res = await makeRequest('/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status, 'Should include status');
    assert(res.data.ollama, 'Should include ollama info');
    assert.strictEqual(typeof res.data.ollama.configuredModel, 'string');
  });

  await runAsyncTest('POST /api/analyze/message rejects empty input (400)', async () => {
    const res = await makeRequest('/api/analyze/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' })
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('valid text message') || res.data.error.includes('too short'));
  });

  await runAsyncTest('POST /api/analyze/message rejects short input (400)', async () => {
    const res = await makeRequest('/api/analyze/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hi' })
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('too short'));
  });

  await runAsyncTest('Tesseract OCR successfully extracts text from image', async () => {
    const Tesseract = require('tesseract.js');
    const { createSimpleBmp } = require('./generate-test-image');
    const testImgPath = path.join(__dirname, 'test-sample.bmp');
    if (!fs.existsSync(testImgPath)) {
      createSimpleBmp(testImgPath, 'URGENT SCAM');
    }
    const ocrResult = await Tesseract.recognize(testImgPath, 'eng');
    const extracted = (ocrResult.data && ocrResult.data.text ? ocrResult.data.text : '').trim();
    assert(extracted.includes('URGENT') || extracted.includes('SCAM'), `Expected 'URGENT SCAM', got '${extracted}'`);
  });

  await runAsyncTest('POST /api/test-ai handles offline/unavailable Ollama gracefully', async () => {
    const res = await makeRequest('/api/test-ai', {
      method: 'POST'
    });
    // If Ollama is running, it returns 200 or 502/503; if offline, returns 503
    assert([200, 502, 503].includes(res.status), `Unexpected status ${res.status}`);
    assert(typeof res.data === 'object' && res.data !== null);
  });

  await runAsyncTest('POST /api/analyze/url rejects loopback / SSRF destination (400)', async () => {
    const res = await makeRequest('/api/analyze/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:8080/test' })
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('forbidden') || res.data.error.includes('blocked'));
  });

  await runAsyncTest('POST /api/analyze/url rejects 127.0.0.1 SSRF destination (400)', async () => {
    const res = await makeRequest('/api/analyze/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1:9090/' })
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('blocked'));
  });

  await runAsyncTest('POST /api/analyze/image rejects missing image (400)', async () => {
    const res = await makeRequest('/api/analyze/image', {
      method: 'POST'
    });
    assert.strictEqual(res.status, 400);
    assert(res.data.error.includes('No image file'));
  });

  // Close test server
  await new Promise((resolve) => testServer.close(resolve));

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n=======================================================');
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed.`);
  console.log('=======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
