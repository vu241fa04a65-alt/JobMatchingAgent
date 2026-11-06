import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://127.0.0.1:5000';

async function runCompanyTests() {
  console.log('\n====================================================');
  console.log('🏢 RUNNING COMPANY LOGO UPLOAD & SYNCHRONIZATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    passed++;
    console.log(`✅ [PASS] ${msg}`);
  }

  function fail(msg, err) {
    failed++;
    console.error(`❌ [FAIL] ${msg}`);
    if (err) console.error(err);
  }

  try {
    // 1. Authenticate T&P Officer
    const tpLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'TP-OFFICER-01', password: 'TPCell@123', role: 'T_AND_P' })
    });
    const tpLoginData = await tpLoginRes.json();
    const tpToken = tpLoginData.token;
    assert.ok(tpToken, 'T&P Officer login should return JWT token');
    pass('T&P Officer authenticated successfully');

    // 2. Authenticate Student
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '1RV23CS184', password: 'Student@123', role: 'STUDENT' })
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.token;
    assert.ok(studentToken, 'Student login should return JWT token');
    pass('Student authenticated successfully');

    // 3. Test: Unauthenticated access rejected
    const unauthRes = await fetch(`${BASE_URL}/api/companies`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated GET /api/companies must return 401');
    pass('Security: Unauthenticated access to /api/companies rejected (401)');

    // 4. Test: Student cannot create company (403)
    const studentCreateRes = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ name: 'HackerCorp', industry: 'Tech' })
    });
    assert.strictEqual(studentCreateRes.status, 403, 'Student creating company must return 403');
    pass('Security: Student blocked from registering company (403)');

    // 5. Test: Upload valid PNG logo
    // 1x1 transparent PNG base64
    const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await fetch(`${BASE_URL}/api/companies/upload-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        image_data: validPngBase64,
        filename: 'test-logo.png'
      })
    });
    assert.strictEqual(uploadRes.status, 200, 'Valid logo upload should succeed (200)');
    const uploadData = await uploadRes.json();
    assert.ok(uploadData.logo_url, 'Response should contain logo_url');
    assert.ok(uploadData.logo_url.startsWith('/uploads/company-logos/'), 'logo_url should point to /uploads/company-logos/');
    pass(`Valid logo upload succeeded: ${uploadData.logo_url}`);

    // Verify file exists on disk
    const filename = path.basename(uploadData.logo_url);
    const diskPath = path.join(__dirname, '..', 'uploads', 'company-logos', filename);
    assert.ok(fs.existsSync(diskPath), `Uploaded logo must exist on disk at ${diskPath}`);
    pass('Uploaded logo physically verified on disk');

    // 6. Test: Reject invalid file type (e.g. text/html)
    const invalidTypeRes = await fetch(`${BASE_URL}/api/companies/upload-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        data_base64: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        filename: 'evil.html'
      })
    });
    assert.strictEqual(invalidTypeRes.status, 400, 'Invalid file type must be rejected with 400');
    pass('Validation: Non-image upload rejected (400)');

    // 7. Test: Add company WITHOUT logo (Optional Logo requirement)
    const testCompNoLogoName = `TestCorp_NoLogo_${Date.now()}`;
    const createNoLogoRes = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        name: testCompNoLogoName,
        industry: 'Cloud Infrastructure',
        tier: 'Tier 1',
        description: 'Pioneering cloud computing systems'
      })
    });
    assert.strictEqual(createNoLogoRes.status, 201, 'Company creation without logo must succeed (201)');
    const createNoLogoData = await createNoLogoRes.json();
    assert.strictEqual(createNoLogoData.company.logo_url, null, 'Logo URL must be null when not provided');
    pass('Company registration WITHOUT logo succeeded (Optional logo confirmed)');

    // 8. Test: Add company WITH logo
    const testCompWithLogoName = `TestCorp_WithLogo_${Date.now()}`;
    const createWithLogoRes = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        name: testCompWithLogoName,
        industry: 'FinTech',
        tier: 'Tier 1',
        logo_url: uploadData.logo_url,
        description: 'Next-gen payment rails'
      })
    });
    assert.strictEqual(createWithLogoRes.status, 201, 'Company creation with logo must succeed (201)');
    const createWithLogoData = await createWithLogoRes.json();
    const createdCompanyId = createWithLogoData.company.id;
    assert.strictEqual(createWithLogoData.company.logo_url, uploadData.logo_url, 'Saved logo_url must match uploaded URL');
    pass(`Company registration WITH logo succeeded: ${createdCompanyId} (${uploadData.logo_url})`);

    // 9. Test: Prevent duplicate company registration
    const dupRes = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        name: testCompWithLogoName,
        industry: 'FinTech'
      })
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate company name must be rejected with 409 Conflict');
    pass('Validation: Duplicate company name rejected with 409 Conflict');

    // 10. Test: Edit company - Replace logo
    const newLogoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const uploadNewRes = await fetch(`${BASE_URL}/api/companies/upload-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        data_base64: newLogoBase64,
        filename: 'new-logo.jpeg'
      })
    });
    const newUploadData = await uploadNewRes.json();

    const editRes = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        name: testCompWithLogoName,
        industry: 'FinTech & AI',
        logo_url: newUploadData.logo_url
      })
    });
    assert.strictEqual(editRes.status, 200, 'Editing company logo must succeed (200)');
    const editData = await editRes.json();
    assert.strictEqual(editData.company.logo_url, newUploadData.logo_url, 'Updated logo_url must reflect new logo');
    pass('Edit Company: Successfully replaced logo with new uploaded asset');

    // 11. Test: Edit company - Remove logo (remove_logo: true)
    const removeLogoRes = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tpToken}`
      },
      body: JSON.stringify({
        name: testCompWithLogoName,
        remove_logo: true
      })
    });
    assert.strictEqual(removeLogoRes.status, 200, 'Removing company logo must succeed (200)');
    const removeLogoData = await removeLogoRes.json();
    assert.strictEqual(removeLogoData.company.logo_url, null, 'logo_url must become null after removal');
    pass('Edit Company: Successfully removed logo (reverts to default placeholder)');

    // 12. Test: Verification of isolation (Company 1 logo does not bleed into Company 2)
    const comp1Detail = await fetch(`${BASE_URL}/api/companies/${createNoLogoData.company.id}`, {
      headers: { 'Authorization': `Bearer ${tpToken}` }
    }).then(r => r.json());
    assert.strictEqual(comp1Detail.company.logo_url, null, 'Company 1 must remain without logo');
    pass('Isolation: Distinct company logo records are strictly segregated');

    // Clean up created test companies from database
    await db.run('DELETE FROM placement_companies WHERE id IN (?, ?)', [createdCompanyId, createNoLogoData.company.id]);
    pass('Test cleanup: Temporary test companies pruned safely');

  } catch (err) {
    fail('Company Logo test execution failed', err);
  }

  console.log('\n====================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} COMPANY LOGO & SYNCHRONIZATION TESTS PASSED!`);
  } else {
    console.error(`💥 ${failed} TESTS FAILED! (${passed} passed)`);
    process.exit(1);
  }
  console.log('====================================================\n');
}

runCompanyTests();
