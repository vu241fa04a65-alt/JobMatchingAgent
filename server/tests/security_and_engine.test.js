import { agent50 } from '../engine/agent50.js';
import { db } from '../db/database.js';

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 COMPREHENSIVE SECURITY, ENGINE & RBAC TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // --- UNIT TESTS: Matching Engine Calculations & Edge Cases ---
  console.log('--- 1. Agent 50 Matching Engine Unit Tests ---');

  // Verify weights total exactly 1.00 (100%)
  const weightSum = Object.values(agent50.weights).reduce((a, b) => a + b, 0);
  assert(Math.abs(weightSum - 1.0) < 0.001, `Weights sum to exactly 1.00 (Current: ${weightSum.toFixed(2)})`);
  assert(agent50.weights.skill === 0.40, 'Skill weight is exactly 40% (0.40)');
  assert(agent50.weights.project === 0.20, 'Project weight is exactly 20% (0.20)');
  assert(agent50.weights.experience_role === 0.15, 'Experience/Role weight is exactly 15% (0.15)');
  assert(agent50.weights.certifications_academics === 0.15, 'Certifications/Academics weight is exactly 15% (0.15)');
  assert(agent50.weights.readiness === 0.10, 'Readiness weight is exactly 10% (0.10)');

  // Verify alias matching avoids false positives
  const mockSkills = [
    { skill_name: 'JavaScript', proficiency_level: 'Expert', score: 0.95, verified: 1 },
    { skill_name: 'Python', proficiency_level: 'Advanced', score: 0.88, verified: 1 }
  ];

  // 'Java' should NOT match 'JavaScript'
  const javaMatch = agent50.matchSkill('Java', mockSkills);
  assert(javaMatch === null, "False positive test: 'Java' does NOT match 'JavaScript'");

  // 'C' should NOT match 'Docker'
  const cMatch = agent50.matchSkill('C', [{ skill_name: 'Docker' }]);
  assert(cMatch === null, "False positive test: 'C' does NOT match 'Docker'");

  // 'React.js' SHOULD match 'React'
  const reactMatch = agent50.matchSkill('React', [{ skill_name: 'React.js' }]);
  assert(reactMatch !== null, "Synonym test: 'React' matches 'React.js'");

  // Match scores always clamped to 0-100
  const sampleStudent = { id: 'std_test', branch: 'CSE', graduation_year: 2027, cgpa: 8.5, active_backlogs: 0 };
  const sampleJob = { id: 'job_test', min_cgpa: 7.0, max_backlogs: 0, required_skills: ['Python', 'SQL'], eligible_branches: ['CSE'] };
  const matchResult = await agent50.matchStudentToJob(sampleStudent, sampleJob, mockSkills, [], {}, { overall_readiness_score: 85 });
  assert(matchResult.overall_match >= 0 && matchResult.overall_match <= 100, `Score is within [0, 100] (Got: ${matchResult.overall_match})`);
  assert(Array.isArray(matchResult.why_strong_candidate) && matchResult.why_strong_candidate.length > 0, 'Generates explainable reasoning');

  // Edge case: empty/missing student fields
  const emptyStudentMatch = await agent50.matchStudentToJob({}, {}, [], [], {}, null);
  assert(emptyStudentMatch.overall_match >= 0 && emptyStudentMatch.overall_match <= 100, 'Handles null/empty student & job safely');

  // Hard eligibility: CGPA below requirement caps score and marks ineligible
  const ineligibleStudent = { id: 'std_low', cgpa: 5.5, branch: 'CSE' };
  const highBarJob = { id: 'job_high', min_cgpa: 8.0, eligible_branches: ['CSE'] };
  const ineligResult = await agent50.matchStudentToJob(ineligibleStudent, highBarJob, mockSkills, [], {}, null);
  assert(!ineligResult.is_eligible, 'Hard eligibility gate catches CGPA shortfall');
  assert(ineligResult.overall_match <= 48, 'Ineligible candidate score capped at 48');

  // --- INTEGRATION TESTS: HTTP & RBAC ---
  console.log('\n--- 2. Authentication & Security Hardening Tests ---');

  // 1. Unauthenticated access rejected (401)
  const unauthRes = await fetch(`${BASE_URL}/api/students/profile`);
  assert(unauthRes.status === 401, 'Unauthenticated access to /api/students/profile returns 401');

  // 2. Fallback password vulnerability fix verification
  const fallbackLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'TP-OFFICER-01', password: 'Student@123' }) // Wrong password for TP officer
  });
  assert(fallbackLoginRes.status === 401, 'Hardcoded cross-account fallback password rejected with 401');

  // 3. Generic login error (no user enumeration)
  const invalidUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'non_existent_user_99999@rvce.edu.in', password: 'Password@123' })
  });
  const invalidUserData = await invalidUserRes.json();
  assert(invalidUserRes.status === 401 && invalidUserData.error.includes('Invalid identifier or password'), 'Generic login error prevents user enumeration');

  // 4. Predefined accounts directory protected
  const unauthAccountsRes = await fetch(`${BASE_URL}/api/auth/predefined-accounts`);
  assert(unauthAccountsRes.status === 401, 'Public account enumeration blocked: /predefined-accounts requires auth (401)');

  // Log in as Subbu (Student 1)
  const student1Login = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '1RV23CS184', password: 'Student@123', role: 'STUDENT' })
  });
  const student1Data = await student1Login.json();
  const student1Token = student1Data.token;
  assert(student1Login.status === 200 && Boolean(student1Token), 'Student 1 (Subbu) logs in successfully');

  // Log in as Siri (Student 2)
  const student2Login = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '1RV22IS015', password: 'Student@123', role: 'STUDENT' })
  });
  const student2Data = await student2Login.json();
  const student2Token = student2Data.token;
  assert(student2Login.status === 200 && Boolean(student2Token), 'Student 2 (Siri) logs in successfully');

  // Log in as T&P Officer
  const tpLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'TP-OFFICER-01', password: 'TPCell@123', role: 'T_AND_P' })
  });
  const tpData = await tpLogin.json();
  const tpToken = tpData.token;
  assert(tpLogin.status === 200 && Boolean(tpToken), 'T&P Officer logs in successfully');

  // Log in as HOD
  const hodLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'HOD-CSE-01', password: 'HOD@123', role: 'HOD' })
  });
  const hodData = await hodLogin.json();
  const hodToken = hodData.token;
  assert(hodLogin.status === 200 && Boolean(hodToken), 'HOD logs in successfully');

  console.log('\n--- 3. Horizontal Privilege Escalation Tests ---');

  // Student 1 attempts to fetch Student 2's profile
  const horizProfileRes = await fetch(`${BASE_URL}/api/students/std_siri`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  assert(horizProfileRes.status === 403, "Horizontal privilege escalation prevented: Student 1 blocked from Student 2's profile (403)");

  // Student 1 attempts to fetch Student 2's matching results
  const horizMatchRes = await fetch(`${BASE_URL}/api/matching/student-matches?student_id=std_siri`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  assert(horizMatchRes.status === 403, "Horizontal privilege escalation prevented: Student 1 blocked from Student 2's matches (403)");

  // Student 1 attempts to fetch Student 2's applications
  const horizAppRes = await fetch(`${BASE_URL}/api/applications/my-applications?student_id=std_siri`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  assert(horizAppRes.status === 403, "Horizontal privilege escalation prevented: Student 1 blocked from Student 2's applications (403)");

  console.log('\n--- 4. Vertical Privilege Escalation Tests ---');

  // Student attempts to access T&P all students directory
  const studentListAllRes = await fetch(`${BASE_URL}/api/students`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  assert(studentListAllRes.status === 403, 'Vertical escalation blocked: Student cannot list all institutional students (403)');

  // Student attempts to access institutional dashboard metrics
  const studentMetricsRes = await fetch(`${BASE_URL}/api/institution/dashboard-metrics`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  assert(studentMetricsRes.status === 403, 'Vertical escalation blocked: Student cannot access dashboard metrics (403)');

  // Student attempts to access AgentOps execution logs
  const studentLogsRes = await fetch(`${BASE_URL}/api/agentops/logs`, {
    headers: { 'Authorization': `Bearer ${student1Token}` }
  });
  assert(studentLogsRes.status === 403, 'Vertical escalation blocked: Student cannot access AgentOps logs (403)');

  // HOD read-only rule: HOD mutation blocked
  const hodMutationRes = await fetch(`${BASE_URL}/api/students`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}` 
    },
    body: JSON.stringify({ full_name: 'Unauthorized Student', usn: '1RV99CS000', email: 'test@rvce.edu.in', branch: 'CSE', cgpa: 9.0 })
  });
  assert(hodMutationRes.status === 403, 'HOD read-only policy strictly enforced: HOD cannot create student (403)');

  console.log('\n--- 5. Dashboard Data Accuracy & SantraAI Tests ---');

  // Dashboard metrics from real database records
  const tpMetricsRes = await fetch(`${BASE_URL}/api/institution/dashboard-metrics`, {
    headers: { 'Authorization': `Bearer ${tpToken}` }
  });
  const tpMetricsData = await tpMetricsRes.json();
  assert(tpMetricsRes.status === 200, 'T&P can access institutional dashboard metrics (200)');
  assert(tpMetricsData.metrics.total_students >= 40, `Total students reflects real DB records (${tpMetricsData.metrics.total_students})`);
  assert(typeof tpMetricsData.metrics.placement_ready === 'number', 'Placement ready count computed dynamically');

  // SantraAI Live Groq Test
  console.log('Testing SantraAI chat endpoint with live Groq LLM integration...');
  const santraRes = await fetch(`${BASE_URL}/api/santra-ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${student1Token}`
    },
    body: JSON.stringify({ message: 'What is my CGPA and top job recommendation?' })
  });
  const santraData = await santraRes.json();
  assert(santraRes.status === 200 && Boolean(santraData.reply), 'SantraAI successfully returns response using live Groq model');
  assert(!santraData.reply.toLowerCase().includes('tl;dr'), 'SantraAI response adheres to TL;DR ban rule');

  // SantraAI Skill Learning Roadmap Test
  console.log('Testing SantraAI skill learning roadmap response with steps...');
  const roadmapRes = await fetch(`${BASE_URL}/api/santra-ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${student1Token}`
    },
    body: JSON.stringify({ message: 'to learn power bi give me road map' })
  });
  const roadmapData = await roadmapRes.json();
  assert(roadmapRes.status === 200 && Boolean(roadmapData.reply), 'SantraAI successfully returns response for roadmap query');
  assert(roadmapData.reply.toLowerCase().includes('step 1') || roadmapData.reply.toLowerCase().includes('step'), 'SantraAI roadmap response contains structured learning steps');
  assert(!roadmapData.reply.includes('information is not available'), 'SantraAI does not produce out-of-scope refusal for roadmap query');

  console.log('\n====================================================');
  console.log(`🎉 TEST EXECUTION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

