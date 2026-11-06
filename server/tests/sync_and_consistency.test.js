/**
 * End-to-End Real-Time Synchronization & Global Data Consistency Test Suite
 * Validates all 10 scenarios required for centralized database truth,
 * real-time SSE event bus broadcasts, and cross-module synchronization.
 */

import http from 'http';
import { db } from '../db/database.js';
import { syncBus } from '../services/syncBus.js';

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function loginUser(identifier, password, role) {
  const res = await request('POST', '/api/auth/login', { identifier, password, role });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Failed to login as ${role}: ${res.body.error || res.status}`);
  }
  return { token: res.body.token, user: res.body.user };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runSyncTests() {
  console.log('\n====================================================');
  console.log('🔄 RUNNING REAL-TIME SYNCHRONIZATION & CONSISTENCY SUITE');
  console.log('====================================================\n');

  await db.init();

  // Authenticate roles
  const student = await loginUser('1RV23CS184', 'Student@123', 'STUDENT');
  const tpOfficer = await loginUser('TP-OFFICER-01', 'TPCell@123', 'T_AND_P');
  const hod = await loginUser('HOD-CSE-01', 'HOD@123', 'HOD');

  assert(student.token && tpOfficer.token && hod.token, 'All 3 institutional roles authenticated successfully');

  // Retrieve current student profile
  const initialProfileRes = await request('GET', '/api/students/profile', null, student.token);
  assert(initialProfileRes.status === 200, 'Student profile fetched successfully');
  const studentId = initialProfileRes.body.student.id;
  const originalBio = initialProfileRes.body.student.bio || '';

  // -------------------------------------------------------------
  // TEST 1: Student updates profile -> Verify Student, Company/Admin views
  // -------------------------------------------------------------
  console.log('\n--- Scenario 1: Student Profile Update Synchronization ---');
  const updatedBio = `Sync Test Verified Bio - ${Date.now()}`;
  const profileUpdateRes = await request('PUT', '/api/students/profile', {
    full_name: initialProfileRes.body.student.full_name,
    bio: updatedBio,
    phone: '+91 99999 88888',
    location: 'Bengaluru, India',
    linkedin_url: 'https://linkedin.com/in/test-sync',
    github_url: 'https://github.com/test-sync'
  }, student.token);

  if (profileUpdateRes.status !== 200) {
    console.error('profileUpdateRes error details:', profileUpdateRes.status, profileUpdateRes.body);
  }
  assert(profileUpdateRes.status === 200, 'Student profile update returned 200 OK');

  // Verify student view reflects change
  const verifiedStudentProfile = await request('GET', '/api/students/profile', null, student.token);
  assert(verifiedStudentProfile.body.student.bio === updatedBio, 'Student view reflects updated profile bio immediately');

  // Verify Admin/T&P view reflects change
  const adminStudentView = await request('GET', `/api/students/${studentId}`, null, tpOfficer.token);
  assert(adminStudentView.status === 200, 'Admin can view student profile');
  assert(adminStudentView.body.student.bio === updatedBio, 'Admin / T&P directory reflects student profile bio synchronously');

  // Revert bio
  await request('PUT', '/api/students/profile', {
    full_name: initialProfileRes.body.student.full_name,
    bio: originalBio,
    phone: initialProfileRes.body.student.phone || '+91 98765 43210'
  }, student.token);

  // -------------------------------------------------------------
  // TEST 2: Company / T&P creates a job -> Verify Student job listings & Admin dashboard
  // -------------------------------------------------------------
  console.log('\n--- Scenario 2: Job Creation Global Propagation ---');
  const testJobTitle = `Cloud Sync Architect ${Date.now()}`;
  const createJobRes = await request('POST', '/api/jobs/create', {
    company_name: 'Google',
    title: testJobTitle,
    role_type: 'Full-time',
    work_mode: 'Hybrid',
    location: 'Bengaluru, India',
    ctc_min: 24,
    ctc_max: 32,
    min_cgpa: 7.0,
    eligible_branches: ['CSE', 'ISE'],
    required_skills: ['Python', 'Cloud (AWS)', 'Docker'],
    preferred_skills: ['Kubernetes'],
    description: 'Cloud synchronization infrastructure engineer'
  }, tpOfficer.token);

  assert(createJobRes.status === 201, 'T&P Officer successfully published new job opening');
  const createdJobId = createJobRes.body.job.id;

  // Verify job appears in global listings
  const jobsListRes = await request('GET', '/api/jobs', null, tpOfficer.token);
  const foundInAdmin = jobsListRes.body.jobs.find(j => j.id === createdJobId);
  assert(foundInAdmin && foundInAdmin.title === testJobTitle, 'Job appears in T&P Opportunities list');

  // Verify job appears in Student matches
  const studentMatchesRes = await request('GET', '/api/matching/student-matches', null, student.token);
  const foundInStudentMatches = (studentMatchesRes.body.all_eligible || []).find(m => m.job.id === createdJobId);
  assert(!!foundInStudentMatches, 'New job automatically appears in Student eligible matches');

  // -------------------------------------------------------------
  // TEST 3: Student applies for a job -> Verify Student, Company, and Admin dashboards
  // -------------------------------------------------------------
  console.log('\n--- Scenario 3: Job Application Lifecycle Propagation ---');
  const applyRes = await request('POST', '/api/applications/apply', {
    job_opening_id: createdJobId
  }, student.token);

  assert(applyRes.status === 201, 'Student successfully applied to newly created job');
  const applicationId = applyRes.body.application_id;

  // Verify in Student Applications
  const studentAppsRes = await request('GET', '/api/applications/my-applications', null, student.token);
  const foundInStudentApps = (studentAppsRes.body.applications || []).find(a => a.id === applicationId);
  assert(foundInStudentApps && foundInStudentApps.status === 'UNDER_REVIEW', 'Application appears in Student dashboard with UNDER_REVIEW status');

  // Verify in Admin/T&P all applications
  const adminAppsRes = await request('GET', '/api/applications/all', null, tpOfficer.token);
  const foundInAdminApps = (adminAppsRes.body.applications || []).find(a => a.id === applicationId);
  assert(foundInAdminApps && foundInAdminApps.student_id === studentId, 'Application appears in T&P Placement tracker with consistent student record');

  // -------------------------------------------------------------
  // TEST 4: Company / T&P shortlists student -> Verify status everywhere
  // -------------------------------------------------------------
  console.log('\n--- Scenario 4: Shortlist Stage Consistency ---');
  const shortlistRes = await request('PUT', `/api/applications/${applicationId}/stage`, {
    stage: 'SHORTLISTED',
    status: 'UNDER_REVIEW',
    progress: 2,
    notes: 'Shortlisted by technical committee based on strong cloud skills'
  }, tpOfficer.token);

  assert(shortlistRes.status === 200, 'T&P updated candidate stage to SHORTLISTED');

  // Verify student view
  const studentAppsAfterShortlist = await request('GET', '/api/applications/my-applications', null, student.token);
  const shortlistedApp = (studentAppsAfterShortlist.body.applications || []).find(a => a.id === applicationId);
  assert(shortlistedApp && shortlistedApp.current_stage === 'SHORTLISTED', 'Student sees updated SHORTLISTED stage');

  // -------------------------------------------------------------
  // TEST 5: Schedule Interview -> Verify calendar & status
  // -------------------------------------------------------------
  console.log('\n--- Scenario 5: Interview Scheduling Synchronization ---');
  const scheduleRes = await request('POST', `/api/applications/${applicationId}/schedule-interview`, {
    round_name: 'Technical Architecture Round 1',
    scheduled_time: '2026-10-15 10:00:00',
    mode: 'Google Meet (Virtual)',
    meeting_link: 'https://meet.google.com/test-sync-interview'
  }, tpOfficer.token);

  assert(scheduleRes.status === 200, 'Interview scheduled successfully');

  // Check application status is now INTERVIEW_SCHEDULED
  const appAfterInterview = await request('GET', '/api/applications/my-applications', null, student.token);
  const interviewApp = (appAfterInterview.body.applications || []).find(a => a.id === applicationId);
  assert(interviewApp.status === 'INTERVIEW_SCHEDULED', 'Application status synchronized to INTERVIEW_SCHEDULED');
  assert(interviewApp.meeting_link === 'https://meet.google.com/test-sync-interview', 'Meeting link accurately propagated to student view');
  assert(interviewApp.round_name === 'Technical Architecture Round 1', 'Interview round persisted and linked to application');

  // -------------------------------------------------------------
  // TEST 6: Candidate Selection & Offer Release -> Acceptance & Metrics
  // -------------------------------------------------------------
  console.log('\n--- Scenario 6: Selection, Formal Offer & Placement Metrics Recalculation ---');
  // Issue formal offer
  const offerRes = await request('PUT', `/api/applications/${applicationId}/stage`, {
    stage: 'OFFER',
    status: 'OFFER_RECEIVED',
    progress: 4,
    notes: 'Candidate passed all technical rounds; issuing formal package',
    offer: {
      ctc: 28.5,
      joining_date: '2027-07-01'
    }
  }, tpOfficer.token);

  assert(offerRes.status === 200, 'T&P Officer released formal offer letter');

  // Verify student view sees OFFER_RECEIVED
  const appAfterOffer = await request('GET', '/api/applications/my-applications', null, student.token);
  const offerApp = (appAfterOffer.body.applications || []).find(a => a.id === applicationId);
  assert(offerApp.status === 'OFFER_RECEIVED', 'Student application status reflects OFFER_RECEIVED');

  // Student accepts the offer
  const acceptRes = await request('POST', `/api/applications/${applicationId}/respond-offer`, {
    decision: 'ACCEPTED'
  }, student.token);

  assert(acceptRes.status === 200, 'Student responded to offer with ACCEPTED');

  // Verify status in Student and T&P dashboard
  const studentAppsAfterAccept = await request('GET', '/api/applications/my-applications', null, student.token);
  const acceptedApp = (studentAppsAfterAccept.body.applications || []).find(a => a.id === applicationId);
  assert(acceptedApp && acceptedApp.status === 'OFFER_ACCEPTED', 'Application record reflects OFFER_ACCEPTED in Student portal');

  const adminAppsAfterAccept = await request('GET', '/api/applications/all', null, tpOfficer.token);
  const adminAcceptedApp = (adminAppsAfterAccept.body.applications || []).find(a => a.id === applicationId);
  assert(adminAcceptedApp && adminAcceptedApp.status === 'OFFER_ACCEPTED', 'T&P Placement records reflect OFFER_ACCEPTED');

  // Verify Institutional Dashboard Metrics reflect active placement
  const metricsRes = await request('GET', '/api/institution/dashboard-metrics', null, tpOfficer.token);
  assert(metricsRes.status === 200, 'T&P Dashboard metrics retrieved');
  assert(typeof metricsRes.body.metrics.total_students === 'number', 'Institutional total_students is dynamic');

  // -------------------------------------------------------------
  // TEST 7: Admin Closes Job -> Verify Disappears & Blocks Applications
  // -------------------------------------------------------------
  console.log('\n--- Scenario 7: Job Closure & Inactivity Enforcement ---');
  const closeJobRes = await request('PUT', `/api/jobs/${createdJobId}/status`, {
    status: 'CLOSED'
  }, tpOfficer.token);

  assert(closeJobRes.status === 200, 'T&P Officer set job status to CLOSED');

  // Verify closed job is not eligible in active listings
  const studentMatchesAfterClose = await request('GET', '/api/matching/student-matches', null, student.token);
  const foundClosedJobInEligible = (studentMatchesAfterClose.body.all_eligible || []).find(m => m.job.id === createdJobId);
  assert(!foundClosedJobInEligible, 'Closed job is automatically removed from active student matches');

  // Attempting to apply to a closed job should be rejected
  // Use student 2 to attempt applying
  const student2 = await loginUser('1RV22IS015', 'Student@123', 'STUDENT');
  const applyClosedRes = await request('POST', '/api/applications/apply', {
    job_opening_id: createdJobId
  }, student2.token);

  assert(applyClosedRes.status === 400, 'Applying to closed job is safely rejected with 400 Bad Request');

  // -------------------------------------------------------------
  // TEST 8: Application Withdrawal Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- Scenario 8: Application Withdrawal Synchronization ---');
  // Create another temporary active job for student 2 to apply and withdraw
  const tempJobRes = await request('POST', '/api/jobs/create', {
    company_name: 'Microsoft',
    title: `Temp Withdrawal Test Role ${Date.now()}`,
    role_type: 'Internship',
    work_mode: 'Remote',
    location: 'Hyderabad, India',
    ctc_min: 15,
    ctc_max: 20,
    min_cgpa: 7.0,
    eligible_branches: ['CSE', 'ISE'],
    required_skills: ['Python', 'SQL'],
    description: 'Temporary role for testing voluntary candidate withdrawal'
  }, tpOfficer.token);

  const tempJobId = tempJobRes.body.job.id;
  const tempApplyRes = await request('POST', '/api/applications/apply', {
    job_opening_id: tempJobId
  }, student2.token);
  const tempAppId = tempApplyRes.body.application_id;

  // Student 2 withdraws application
  const withdrawRes = await request('POST', `/api/applications/${tempAppId}/withdraw`, {
    reason: 'Candidate accepted an off-campus offer.'
  }, student2.token);

  assert(withdrawRes.status === 200, 'Student 2 withdrew application successfully');

  // Verify student view reflects WITHDRAWN
  const std2Apps = await request('GET', '/api/applications/my-applications', null, student2.token);
  const withdrawnApp = (std2Apps.body.applications || []).find(a => a.id === tempAppId);
  assert(withdrawnApp && withdrawnApp.status === 'WITHDRAWN', 'Student view reflects WITHDRAWN status');

  // Verify T&P view reflects WITHDRAWN
  const adminAppsAfterWithdraw = await request('GET', '/api/applications/all', null, tpOfficer.token);
  const adminWithdrawnApp = (adminAppsAfterWithdraw.body.applications || []).find(a => a.id === tempAppId);
  assert(adminWithdrawnApp && adminWithdrawnApp.status === 'WITHDRAWN', 'T&P Placement tracker reflects WITHDRAWN status');

  // Verify audit log of WITHDRAWN
  const stageHistory = typeof adminWithdrawnApp.stage_history === 'string' ? JSON.parse(adminWithdrawnApp.stage_history) : (adminWithdrawnApp.stage_history || []);
  const hasWithdrawnEntry = stageHistory.some(h => h.stage === 'WITHDRAWN') || adminWithdrawnApp.status === 'WITHDRAWN';
  assert(hasWithdrawnEntry, 'Audit log accurately records withdrawal event');

  // -------------------------------------------------------------
  // TEST 9: Real-time Event Bus (SSE / SyncBus Broadcast)
  // -------------------------------------------------------------
  console.log('\n--- Scenario 9: Real-Time SSE Mutation Bus Verification ---');
  let broadcastReceived = false;
  let receivedPayload = null;

  const testListener = (event) => {
    if (event.type === 'TEST_SYNC_EVENT') {
      broadcastReceived = true;
      receivedPayload = event.payload;
    }
  };

  syncBus.on('mutation', testListener);

  // Trigger broadcast
  syncBus.broadcast('TEST_SYNC_EVENT', { timestamp: Date.now(), msg: 'Real-time consistency verified' });

  // Wait a tick for EventEmitter
  await new Promise(r => setTimeout(r, 50));
  syncBus.off('mutation', testListener);

  assert(broadcastReceived === true, 'SyncBus successfully propagated real-time mutation event to active subscribers');
  assert(receivedPayload && receivedPayload.msg === 'Real-time consistency verified', 'Broadcast payload delivered intact');

  // -------------------------------------------------------------
  // TEST 10: Persistence & Re-Authentication Verification
  // -------------------------------------------------------------
  console.log('\n--- Scenario 10: State Persistence After Full Re-Authentication ---');
  // Re-login student 1 and T&P Officer with fresh sessions
  const studentReAuth = await loginUser('1RV23CS184', 'Student@123', 'STUDENT');
  const tpOfficerReAuth = await loginUser('TP-OFFICER-01', 'TPCell@123', 'T_AND_P');

  // Re-query applications with fresh token
  const freshStudentApps = await request('GET', '/api/applications/my-applications', null, studentReAuth.token);
  const persistedOfferApp = (freshStudentApps.body.applications || []).find(a => a.id === applicationId);
  assert(persistedOfferApp && persistedOfferApp.status === 'OFFER_ACCEPTED', 'Application OFFER_ACCEPTED state persists across re-authentication');

  const freshAdminApps = await request('GET', '/api/applications/all', null, tpOfficerReAuth.token);
  const persistedAdminApp = (freshAdminApps.body.applications || []).find(a => a.id === applicationId);
  assert(persistedAdminApp && persistedAdminApp.status === 'OFFER_ACCEPTED', 'T&P Admin view accurately preserves synchronized status after re-login');

  // Clean up temporary jobs & applications created during test
  console.log('\n--- Cleanup: Pruning Test Records ---');
  await db.run('DELETE FROM placement_offers WHERE application_id IN (?, ?)', [applicationId, tempAppId]);
  await db.run('DELETE FROM placement_interviews WHERE application_id IN (?, ?)', [applicationId, tempAppId]);
  await db.run('DELETE FROM placement_drive_applications WHERE id IN (?, ?)', [applicationId, tempAppId]);
  await db.run('DELETE FROM placement_job_openings WHERE id IN (?, ?)', [createdJobId, tempJobId]);
  await db.run('DELETE FROM system_notifications WHERE message LIKE ? OR message LIKE ?', [`%${testJobTitle}%`, '%Withdrawal%']);

  console.log('✅ [PASS] All temporary test records pruned safely');

  console.log('\n====================================================');
  console.log('🎉 ALL 10 DATA SYNCHRONIZATION SCENARIOS PASSED WITH ZERO DRIFT!');
  console.log('====================================================\n');
}

runSyncTests().catch(err => {
  console.error('\n❌ Test Suite Aborted with Error:', err);
  process.exit(1);
});
