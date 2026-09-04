import http from 'http';
import querystring from 'querystring';
import crypto from 'crypto';

const PORT = 5000;
const SECRET_KEY = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";

function postRequest(path, data, isUrlEncoded = true, token = null) {
  return new Promise((resolve, reject) => {
    const postData = isUrlEncoded ? querystring.stringify(data) : JSON.stringify(data);
    const headers = {
      'Content-Type': isUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'POST',
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 [TEST SUITE] Starting MONTAGE CORPORATION Verification...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      process.exit(1);
    }
  }

  // 1. Test C++ Handshake with fresh test key
  const testKey = 'MONTAGE-FF-TEST-' + Date.now();
  const testSerial = 'UUID-TEST-DEVICE-AAA';
  const game = 'FreeFire';

  // Create fresh unused key directly via db for isolated testing
  const { db } = await import('./db.js');
  await db.createKey({
    id: testKey,
    user_key: testKey,
    game: game,
    duration: '7d',
    status: 'unused',
    hwid: null,
    max_devices: 1,
    created_at: new Date().toISOString(),
    first_used_at: null,
    expires_at: null,
    paused_at: null,
    remaining_seconds_on_pause: 0,
    reset_count: 0,
    last_reset_at: null,
    created_by: 'admin',
    notes: 'Automated test key'
  });

  console.log('1️⃣ Testing C++ Client Handshake (POST /connect)...');
  const res1 = await postRequest('/connect', {
    game: game,
    user_key: testKey,
    serial: testSerial
  }, true);

  assert(res1.data.status === true, 'C++ Handshake returns status: true');
  assert(res1.data.data && res1.data.data.token, 'Response contains auth token');

  // Verify MD5 formula
  const expectedToken = crypto.createHash('md5').update(`${game}-${testKey}-${testSerial}-${SECRET_KEY}`).digest('hex');
  assert(res1.data.data.token === expectedToken, `MD5 token perfectly matches C++ algorithm (${expectedToken})`);

  // Verify RNG replay check
  const nowSec = Math.floor(Date.now() / 1000);
  assert(res1.data.data.rng + 30 > nowSec, `RNG is fresh and passes (rng + 30 > time(0)) replay window`);

  // 2. Test same device reconnect
  console.log('\n2️⃣ Testing Reconnection on Same Device...');
  const res2 = await postRequest('/connect', {
    game: game,
    user_key: testKey,
    serial: testSerial
  }, true);
  assert(res2.data.status === true, 'Same device reconnects successfully');

  // 3. Test HWID Mismatch (different device)
  console.log('\n3️⃣ Testing HWID Lock with Different Device...');
  const res3 = await postRequest('/connect', {
    game: game,
    user_key: testKey,
    serial: 'UUID-DIFFERENT-PHONE-BBB'
  }, true);
  assert(res3.data.status === false, 'Different device rejected as expected');
  assert(res3.data.reason.includes('HWID Mismatch'), 'Reason explains HWID mismatch');

  // 4. Test Login to Dashboard
  console.log('\n4️⃣ Testing Admin Dashboard Authentication...');
  const loginRes = await postRequest('/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, false);
  assert(loginRes.data.token, 'Admin logged in and received JWT token');
  const adminToken = loginRes.data.token;

  // 5. Test Key Pause (Time Freeze Engine)
  console.log('\n5️⃣ Testing Key Pause (Time Freeze Engine)...');
  const pauseRes = await postRequest(`/api/keys/${testKey}/pause`, {}, false, adminToken);
  assert(pauseRes.data.success === true, 'Key paused successfully');
  assert(pauseRes.data.key.status === 'paused', 'Key status set to paused');
  assert(pauseRes.data.key.remaining_seconds_on_pause > 0, 'Remaining duration preserved');

  // Connect while paused must be rejected
  const connectPaused = await postRequest('/connect', {
    game: game,
    user_key: testKey,
    serial: testSerial
  }, true);
  assert(connectPaused.data.status === false, 'Paused key rejected at C++ connect');
  assert(connectPaused.data.reason.includes('paused'), 'Paused reason provided to client');

  // Resume key
  console.log('\n6️⃣ Testing Key Resume (Preserved Time Restored)...');
  const resumeRes = await postRequest(`/api/keys/${testKey}/resume`, {}, false, adminToken);
  assert(resumeRes.data.success === true, 'Key resumed successfully');
  assert(resumeRes.data.key.status === 'active', 'Key status restored to active');

  // Connect after resume must succeed
  const connectResumed = await postRequest('/connect', {
    game: game,
    user_key: testKey,
    serial: testSerial
  }, true);
  assert(connectResumed.data.status === true, 'Resumed key connects successfully');

  // 7. Test Reseller Generation and Wallet Deduction
  console.log('\n7️⃣ Testing Reseller Wallet Deduction on Key Generation...');
  const resellerLogin = await postRequest('/api/auth/login', {
    username: 'reseller_alex',
    password: 'admin123'
  }, false);
  const resellerToken = resellerLogin.data.token;
  const initialBalance = resellerLogin.data.user.balance;

  const genRes = await postRequest('/api/keys/generate', {
    duration: '1d',
    count: 1,
    prefix: 'TEST-ALEX',
    game: 'FreeFire'
  }, false, resellerToken);

  assert(genRes.data.success === true, 'Reseller generated key');
  const meRes = await getRequest('/api/auth/me', resellerToken);
  assert(meRes.data.balance === initialBalance - 20, `Wallet deducted exactly ₹20 for 1-Day key (Previous: ₹${initialBalance}, Current: ₹${meRes.data.balance})`);

  // 8. Test Self-Service Device Reset
  console.log('\n8️⃣ Testing Self-Service HWID Reset...');
  const resetRes = await postRequest('/api/public/reset', { user_key: testKey }, false);
  assert(resetRes.data.success === true, 'Public HWID reset executed');

  // Reconnect with NEW device now succeeds because HWID was cleared
  const connectNewDevice = await postRequest('/connect', {
    game: game,
    user_key: testKey,
    serial: 'UUID-NEW-PHONE-CCC'
  }, true);
  assert(connectNewDevice.data.status === true, 'Key successfully re-bound to new device after HWID reset');

  console.log(`\n🎉 ALL ${passed}/${total} AUTOMATED TESTS PASSED CLEANLY!`);
  process.exit(0);
}

// Start server and run tests
import('./index.js').then(() => {
  setTimeout(runTests, 1000);
});
