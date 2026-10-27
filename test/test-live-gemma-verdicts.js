/**
 * Live end-to-end verification of Gemma 4 verdict generation
 */
const { app } = require('../server');
const http = require('http');

const server = http.createServer(app);

async function test() {
  await new Promise(r => server.listen(3006, r));
  console.log('Test server running on port 3006...');

  try {
    // 1. Phishing OTP Scam -> Expect HIGH_RISK
    console.log('\n--- 1. Testing Phishing OTP Scam (Expecting HIGH_RISK) ---');
    const scamText = 'URGENT from Bank Security: Your account is locked! Share your 6-digit OTP immediately to unlock, or your account will be deleted in 24 hours.';
    const res1 = await fetch('http://127.0.0.1:3006/api/analyze/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: scamText })
    });
    const data1 = await res1.json();
    console.log('Status:', res1.status);
    console.log('Verdict:', data1.report?.verdict);
    console.log('Verdict Label:', data1.report?.verdictLabel);
    console.log('Risk Level:', data1.report?.riskLevel);
    console.log('Summary:', data1.report?.summary);
    console.log('Warning Signs:', data1.report?.warningSigns);

    // 2. Inaccessible URL -> Expect UNVERIFIED
    console.log('\n--- 2. Testing Inaccessible URL (Expecting UNVERIFIED) ---');
    const res2 = await fetch('http://127.0.0.1:3006/api/analyze/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://this-is-a-definitely-nonexistent-domain-xyz1234567.org/' })
    });
    const data2 = await res2.json();
    console.log('Status:', res2.status);
    console.log('Verdict:', data2.report?.verdict);
    console.log('Verdict Label:', data2.report?.verdictLabel);
    console.log('Summary:', data2.report?.summary);

  } catch (err) {
    console.error('Live test error:', err);
  } finally {
    server.close();
  }
}

test().catch(console.error);
