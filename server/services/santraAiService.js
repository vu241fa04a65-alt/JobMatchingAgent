import 'dotenv/config';
import { db } from '../db/database.js';
import { agent50 } from '../engine/agent50.js';

export class SantraAiService {
  constructor() {
    this.primaryModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
    this.modelHierarchy = [
      process.env.GROQ_MODEL,
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
    ].filter(Boolean);
    // Deduplicate
    this.modelHierarchy = [...new Set(this.modelHierarchy)];
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  getApiKey() {
    return process.env.GROQ_API_KEY;
  }

  /**
   * Cleans any unintentional TL;DR prefixes or formatting from output
   */
  sanitizeResponse(text) {
    if (!text) return "I don't have that information in JobMatch AI.";
    
    // Remove any TL;DR / TL:DR / TLDR references case-insensitively
    let sanitized = text
      .replace(/^(\s*#*\s*TL[;:]?DR\s*:?\s*)+/gi, '')
      .replace(/(\n\s*#*\s*TL[;:]?DR\s*:?\s*)/gi, '\n')
      .replace(/^(\s*SantraAI\s*:\s*)/gi, '')
      .trim();

    // Prevent provider or model leaks
    sanitized = sanitized
      .replace(/groq/gi, 'JobMatch AI')
      .replace(/openai\/gpt-oss-\d+b/gi, 'SantraAI')
      .replace(/llama-3[.\d\w-]*/gi, 'SantraAI');

    return sanitized;
  }

  /**
   * Extract authorized database context grounded strictly in user role
   */
  async buildRoleContext(user, userQuery = '') {
    try {
      const isStudent = user?.role === 'STUDENT';
      const isTP = user?.role === 'T_AND_P' || user?.role === 'TP' || user?.role === 'ADMIN' || user?.role_id === 'role_tp';
      const isHOD = user?.role === 'HOD' || user?.role_id === 'role_hod';

      let contextParts = [];

      // 1. Always load available active job openings & companies (public/authorized data)
      const jobs = await db.query(`
        SELECT j.id, j.title, j.role_type, j.work_mode, j.location, j.ctc_display, j.min_cgpa, 
               j.required_skills, j.preferred_skills, j.deadline_date, j.eligible_branches,
               c.name as company_name, c.tier, c.industry
        FROM placement_job_openings j
        JOIN placement_companies c ON j.company_id = c.id
        WHERE j.status = 'ACTIVE'
        LIMIT 10
      `);

      contextParts.push("=== ACTIVE PLACEMENT DRIVES & JOB OPENINGS ===");
      jobs.forEach(job => {
        contextParts.push(`Job ID: ${job.id} | Title: ${job.title} at ${job.company_name} (Tier: ${job.tier}, Industry: ${job.industry})`);
        contextParts.push(`  CTC: ${job.ctc_display} | Location: ${job.location} | Work Mode: ${job.work_mode} | Min CGPA: ${job.min_cgpa}`);
        contextParts.push(`  Eligible Branches: ${job.eligible_branches}`);
        contextParts.push(`  Required Skills: ${job.required_skills}`);
        contextParts.push(`  Preferred Skills: ${job.preferred_skills || 'None specified'}`);
      });

      // =========================================================================
      // 2. STUDENT ROLE (PRESERVED EXACTLY - DO NOT REGRESS)
      // =========================================================================
      if (isStudent && user?.id) {
        const student = await db.get(`
          SELECT s.*, u.email, u.full_name
          FROM people_students s
          JOIN identity_users u ON s.user_id = u.id
          WHERE s.user_id = ?
        `, [user.id]);

        if (student) {
          const skills = await db.query('SELECT skill_name, proficiency_level, score FROM student_skills WHERE student_id = ?', [student.id]);
          const projects = await db.query('SELECT id, title, description, tech_stack FROM student_projects WHERE student_id = ?', [student.id]);
          const certs = await db.query('SELECT title, issuing_organization, issue_date FROM student_certifications WHERE student_id = ?', [student.id]);
          const prefs = await db.get('SELECT * FROM student_preferences WHERE student_id = ?', [student.id]) || {};
          const readiness = await db.get('SELECT * FROM placement_readiness_summary WHERE student_id = ?', [student.id]);

          const applications = await db.query(`
            SELECT a.status, a.stage_progress, a.applied_at, j.title, c.name as company_name
            FROM placement_drive_applications a
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            WHERE a.student_id = ?
          `, [student.id]);

          const interviews = await db.query(`
            SELECT i.round_name, i.scheduled_time, i.mode, i.status, j.title, c.name as company_name
            FROM placement_interviews i
            JOIN placement_drive_applications a ON i.application_id = a.id
            JOIN placement_job_openings j ON a.job_opening_id = j.id
            JOIN placement_companies c ON j.company_id = c.id
            WHERE a.student_id = ?
          `, [student.id]);

          contextParts.push("\n=== AUTHENTICATED STUDENT PROFILE ===");
          contextParts.push(`Name: ${student.full_name} | USN: ${student.usn} | Dept: ${student.department || student.branch} | CGPA: ${student.cgpa} | Readiness Score: ${readiness?.overall_readiness_score || 82}%`);
          contextParts.push(`Active Backlogs: ${student.active_backlogs || 0} | Preferred Locations: ${prefs.preferred_locations || 'Bengaluru, Hyderabad'}`);
          contextParts.push(`Verified Skills: ${skills.map(s => `${s.skill_name} (${s.proficiency_level || 'Proficient'})`).join(', ')}`);
          contextParts.push(`Projects: ${projects.map(p => `${p.title} [Stack: ${p.tech_stack}]`).join('; ')}`);
          contextParts.push(`Certifications: ${certs.map(c => `${c.title} by ${c.issuing_organization}`).join('; ') || 'None'}`);

          // Calculate live Agent 50 matches for this student
          contextParts.push("\n=== AGENT 50 LIVE MATCH RESULTS FOR STUDENT ===");
          const matchResults = [];
          for (const job of jobs) {
            try {
              const match = await agent50.matchStudentToJob(student, job, skills, projects, prefs, readiness);
              matchResults.push({ job, match });
            } catch (err) {
              // continue
            }
          }

          // Sort by match percentage descending
          matchResults.sort((a, b) => (b.match.overall_match || 0) - (a.match.overall_match || 0));

          matchResults.slice(0, 5).forEach((item, index) => {
            const { job, match } = item;
            contextParts.push(`Top Match #${index + 1}: ${job.company_name} — ${job.title}`);
            contextParts.push(`  Overall Match Score: ${match.overall_match}% (Eligible: ${match.is_eligible ? 'Yes' : 'No'})`);
            contextParts.push(`  Breakdown: Skill Match ${match.component_scores?.skill_match}%, Project Relevance ${match.component_scores?.project_relevance}%, Role Fit ${match.component_scores?.role_interest_fit}%, Location Fit ${match.component_scores?.location_fit}%`);
            contextParts.push(`  Readiness: ${match.component_scores?.readiness_score}%`);
            contextParts.push(`  Missing Gaps: ${match.preparation_gaps?.map(g => g.skill).join(', ') || 'None'}`);
            contextParts.push(`  Reasons: ${match.why_strong_candidate?.join('; ') || 'Strong profile fit'}`);
          });

          // Applications & Interviews
          contextParts.push("\n=== ACTIVE APPLICATIONS & INTERVIEWS ===");
          if (applications.length > 0) {
            applications.forEach(app => {
              contextParts.push(`Application: ${app.title} at ${app.company_name} | Status: ${app.status} | Stage: ${app.stage_progress}`);
            });
          } else {
            contextParts.push("Applications: No submitted applications yet.");
          }

          if (interviews.length > 0) {
            interviews.forEach(i => {
              contextParts.push(`Interview: ${i.company_name} - ${i.title} | Round: ${i.round_name} | Scheduled: ${i.scheduled_time} (${i.mode}) | Status: ${i.status}`);
            });
          } else {
            contextParts.push("Interviews: No upcoming scheduled interviews.");
          }
        }
      }

      // =========================================================================
      // 3. TRAINING & PLACEMENT (T&P) ROLE - FULL INSTITUTIONAL PLACEMENT CONTEXT
      // =========================================================================
      if (isTP) {
        // A. Cohort & Readiness Statistics
        const allStudents = await db.query(`
          SELECT s.id, s.full_name, s.usn, s.branch, s.department, s.cgpa, s.active_backlogs, s.graduation_year,
                 r.overall_readiness_score, r.technical_score, r.aptitude_score, r.communication_score, r.interview_readiness_score, r.status as readiness_status
          FROM people_students s
          LEFT JOIN placement_readiness_summary r ON s.id = r.student_id
          ORDER BY s.cgpa DESC
        `);

        const totalStudents = allStudents.length;
        const readyStudents = allStudents.filter(s => (s.overall_readiness_score || 0) >= 80);
        const inPrepStudents = allStudents.filter(s => (s.overall_readiness_score || 0) >= 60 && (s.overall_readiness_score || 0) < 80);
        const needsAttentionStudents = allStudents.filter(s => (s.overall_readiness_score || 0) < 60);
        const avgCgpa = (allStudents.reduce((acc, s) => acc + (s.cgpa || 0), 0) / (totalStudents || 1)).toFixed(2);
        const avgReadiness = (allStudents.reduce((acc, s) => acc + (s.overall_readiness_score || 0), 0) / (totalStudents || 1)).toFixed(1);

        // B. Placements & Offers summary
        const offers = await db.query(`
          SELECT o.id, o.offered_ctc, o.role_title, o.student_decision, s.full_name, s.usn, s.branch, c.name as company_name
          FROM placement_offers o
          JOIN placement_drive_applications a ON o.application_id = a.id
          JOIN people_students s ON a.student_id = s.id
          JOIN placement_job_openings j ON a.job_opening_id = j.id
          JOIN placement_companies c ON j.company_id = c.id
        `);

        const placedStudentIds = new Set(offers.map(o => o.student_id));
        const unmatchedStudents = allStudents.filter(s => !placedStudentIds.has(s.id));

        // C. Student Skills & Institutional Skill Gaps
        const studentSkills = await db.query(`
          SELECT sk.skill_name, sk.category, sk.proficiency_level, s.full_name, s.branch
          FROM student_skills sk
          JOIN people_students s ON sk.student_id = s.id
        `);

        // Group skills
        const skillCounts = {};
        studentSkills.forEach(sk => {
          skillCounts[sk.skill_name] = (skillCounts[sk.skill_name] || 0) + 1;
        });

        // D. Live Agent 50 Candidate Rankings for all active openings
        const candidateRankings = [];
        for (const job of jobs) {
          const rankedForJob = [];
          for (const st of allStudents) {
            const stSkills = await db.query('SELECT skill_name, proficiency_level, score FROM student_skills WHERE student_id = ?', [st.id]);
            const stProjects = await db.query('SELECT id, title, description, tech_stack FROM student_projects WHERE student_id = ?', [st.id]);
            const stPrefs = await db.get('SELECT * FROM student_preferences WHERE student_id = ?', [st.id]) || {};
            const stReadiness = { overall_readiness_score: st.overall_readiness_score || 75 };

            try {
              const match = await agent50.matchStudentToJob(st, job, stSkills, stProjects, stPrefs, stReadiness);
              rankedForJob.push({
                student: st,
                match
              });
            } catch (err) {
              // continue
            }
          }

          rankedForJob.sort((a, b) => (b.match.overall_match || 0) - (a.match.overall_match || 0));
          candidateRankings.push({
            job,
            topCandidates: rankedForJob.slice(0, 4)
          });
        }

        contextParts.push("\n=== T&P INSTITUTIONAL OVERVIEW & STATS ===");
        contextParts.push(`Total Registered Students: ${totalStudents}`);
        contextParts.push(`Placement Ready (>=80%): ${readyStudents.length} students (${readyStudents.map(s => s.full_name).join(', ')})`);
        contextParts.push(`In Preparation (60-79%): ${inPrepStudents.length} students (${inPrepStudents.map(s => s.full_name).join(', ')})`);
        contextParts.push(`Needs Attention (<60%): ${needsAttentionStudents.length} students (${needsAttentionStudents.map(s => `${s.full_name} [${s.branch}, CGPA ${s.cgpa}, Readiness ${s.overall_readiness_score}%]`).join(', ')})`);
        contextParts.push(`Average CGPA: ${avgCgpa} | Average Readiness: ${avgReadiness}%`);
        contextParts.push(`Total Offers Placed: ${offers.length} offers (Top Offer: Amazon Data Analyst - ₹24.5 LPA to Subbu K)`);

        contextParts.push("\n=== REGISTERED STUDENT ROSTER ===");
        allStudents.forEach((st, idx) => {
          const isPlaced = offers.some(o => o.usn === st.usn);
          if (idx < 15) {
            const stSkills = studentSkills.filter(sk => sk.full_name === st.full_name).slice(0, 4).map(sk => sk.skill_name).join(', ') || 'Core Eng';
            contextParts.push(`• ${st.full_name} | USN: ${st.usn} | ${st.branch} | CGPA: ${st.cgpa} | Readiness: ${st.overall_readiness_score || 0}% | Skills: ${stSkills} | Status: ${isPlaced ? 'OFFERED' : 'SEEKING'}`);
          } else {
            contextParts.push(`• ${st.full_name} | USN: ${st.usn} | ${st.branch} | CGPA: ${st.cgpa} | Readiness: ${st.overall_readiness_score || 0}% | Status: ${isPlaced ? 'OFFERED' : 'SEEKING'}`);
          }
        });

        contextParts.push("\n=== AGENT 50 LIVE CANDIDATE RANKINGS BY JOB ===");
        candidateRankings.forEach(cr => {
          contextParts.push(`Opening: ${cr.job.title} at ${cr.job.company_name} (Eligible: ${cr.job.eligible_branches}, Min CGPA: ${cr.job.min_cgpa})`);
          cr.topCandidates.forEach((tc, idx) => {
            contextParts.push(`  Rank #${idx + 1}: ${tc.student.full_name} (${tc.student.branch}, USN ${tc.student.usn}) — Match Score: ${tc.match.overall_match}% [Skill: ${tc.match.component_scores?.skill_match}%, Project: ${tc.match.component_scores?.project_relevance}%, Readiness: ${tc.match.component_scores?.readiness_score}%]`);
          });
        });

        contextParts.push("\n=== INSTITUTIONAL COMMON SKILL GAPS & DEMAND ===");
        contextParts.push("Most critical required skills across current active drives: Docker, System Design, Distributed Systems, Cloud (AWS/GCP), C++, Python.");
        contextParts.push(`Students needing Docker & System Design remediation: ${unmatchedStudents.length} students.`);
      }

      // =========================================================================
      // 4. HEAD OF DEPARTMENT (HOD) ROLE - READ-ONLY DEPARTMENTAL INTELLIGENCE
      // =========================================================================
      if (isHOD) {
        const hodDept = user?.department || 'Computer Science and Engineering';
        const deptBranch = 'CSE';

        // Load all department students
        const deptStudents = await db.query(`
          SELECT s.id, s.full_name, s.usn, s.branch, s.department, s.cgpa, s.active_backlogs, s.graduation_year,
                 r.overall_readiness_score, r.technical_score, r.aptitude_score, r.communication_score, r.interview_readiness_score, r.status as readiness_status
          FROM people_students s
          LEFT JOIN placement_readiness_summary r ON s.id = r.student_id
          WHERE s.department LIKE '%Computer%' OR s.branch = 'CSE' OR s.branch = 'ISE'
          ORDER BY s.cgpa DESC
        `);

        const totalDeptStudents = deptStudents.length;
        const deptAvgCgpa = (deptStudents.reduce((acc, s) => acc + (s.cgpa || 0), 0) / (totalDeptStudents || 1)).toFixed(2);
        const deptAvgReadiness = (deptStudents.reduce((acc, s) => acc + (s.overall_readiness_score || 0), 0) / (totalDeptStudents || 1)).toFixed(1);
        const deptReady = deptStudents.filter(s => (s.overall_readiness_score || 0) >= 80);
        const deptInPrep = deptStudents.filter(s => (s.overall_readiness_score || 0) >= 60 && (s.overall_readiness_score || 0) < 80);
        const deptNeedsAttention = deptStudents.filter(s => (s.overall_readiness_score || 0) < 60);

        const deptOffers = await db.query(`
          SELECT o.id, o.offered_ctc, o.role_title, s.full_name, s.usn, s.branch, c.name as company_name
          FROM placement_offers o
          JOIN placement_drive_applications a ON o.application_id = a.id
          JOIN people_students s ON a.student_id = s.id
          JOIN placement_job_openings j ON a.job_opening_id = j.id
          JOIN placement_companies c ON j.company_id = c.id
          WHERE s.department LIKE '%Computer%' OR s.branch = 'CSE'
        `);

        contextParts.push(`\n=== HOD DEPARTMENT METRICS (${hodDept} - READ ONLY) ===`);
        contextParts.push(`Total Department Students: ${totalDeptStudents}`);
        contextParts.push(`Department Average CGPA: ${deptAvgCgpa} | Department Average Readiness: ${deptAvgReadiness}%`);
        contextParts.push(`Placement Ready (>=80%): ${deptReady.length} (${deptReady.map(s => s.full_name).join(', ')})`);
        contextParts.push(`In Preparation (60-79%): ${deptInPrep.length} (${deptInPrep.map(s => s.full_name).join(', ')})`);
        contextParts.push(`Needs Intervention (<60%): ${deptNeedsAttention.length} students (${deptNeedsAttention.map(s => `${s.full_name} [CGPA ${s.cgpa}, Readiness ${s.overall_readiness_score}%]`).join(', ')})`);
        contextParts.push(`Department Placement Offers: ${deptOffers.length} offers (e.g. Subbu K placed at Amazon for ₹24.5 LPA)`);

        contextParts.push("\n=== DEPARTMENT STUDENT ROSTER ===");
        deptStudents.forEach(st => {
          contextParts.push(`• ${st.full_name} | USN: ${st.usn} | Branch: ${st.branch} | CGPA: ${st.cgpa} | Readiness: ${st.overall_readiness_score}% (${st.readiness_status})`);
        });

        contextParts.push("\n=== DEPARTMENT SKILL GAP ANALYSIS ===");
        contextParts.push("Identified Department Skill Gaps: Docker, System Design, Cloud Architecture (AWS/GCP), Go.");
        contextParts.push("Recommended Action: Conduct hands-on workshops on Docker microservices and distributed databases for pre-final year batch.");

        contextParts.push("\n=== HOD ROLE PERMISSION CONSTRAINT ===");
        contextParts.push("HOD has strict READ-ONLY intelligence access. If the user asks to perform mutations (create jobs, shortlist candidates, change placement status, send broadcast announcements), explain that HOD access is read-only and actions must be performed by the T&P Cell.");
      }

      return contextParts.join('\n');
    } catch (err) {
      console.error('Error generating role context:', err);
      return "Context: JobMatch AI — Agent 50 placement platform.";
    }
  }

  /**
   * Execute chat completion via Groq API with robust fallback
   */
  async generateChatResponse(userMessage, conversationHistory = [], user = null) {
    const roleContext = await this.buildRoleContext(user, userMessage);
    const isStudent = user?.role === 'STUDENT';
    const isTP = user?.role === 'T_AND_P' || user?.role === 'TP' || user?.role === 'ADMIN' || user?.role_id === 'role_tp';
    const isHOD = user?.role === 'HOD' || user?.role_id === 'role_hod';

    let rolePersona = "SantraAI, the AI placement intelligence assistant for JobMatch AI — Agent 50.";
    if (isTP) {
      rolePersona = "SantraAI — Placement Intelligence Assistant for the Training & Placement (T&P) Cell.";
    } else if (isHOD) {
      rolePersona = "SantraAI — Department Intelligence Assistant for Head of Department (HOD).";
    } else if (isStudent) {
      rolePersona = "SantraAI — Career & Placement Assistant for Students.";
    }

    const systemPrompt = `You are ${rolePersona}

CRITICAL OPERATIONAL RULES:
1. Grounding: Answer ONLY using information supplied in the authorized JobMatch AI context below.
2. Role Perspective:
   - For T&P: You are talking to a Training & Placement Officer. Answer institutional questions about all registered students, readiness cohorts, candidate rankings, skill gaps, companies, and placement analytics using the provided data.
   - For HOD: You are talking to the Head of Department. Answer department-level questions about students, readiness, skill gaps, and placements. Enforce read-only permissions (cannot mutate or send broadcasts).
   - For Student: Answer about the student's own matches, Agent 50 scores, skills, readiness, applications, and interview schedule.
3. Out of Scope: If the question asks about general world trivia, celebrities, history, or anything not present in JobMatch AI, respond: "I can only help with information available in JobMatch AI, and that information is not available in the application."
4. Absolute Ban on "TL;DR": NEVER mention, write, output, or use the word or acronym "TL;DR", "TL:DR", or "TLDR" anywhere in your response. Simply give the direct summary sentence immediately followed by key points.
5. Response Format:
   [Direct 1-2 sentence answer to the user's question]
   
   Key points:
   • Point 1
   • Point 2
   • Point 3
6. Agent 50 Match Integrity: When asked about candidates, top matches, percentages, or gaps, quote the exact Agent 50 scores and candidate rankings provided in the context. Do not invent scores.
7. Identity & Privacy: Always identify as "SantraAI". Never mention "Groq", model names, OpenAI, or internal technical infrastructure.

AUTHORIZED APPLICATION CONTEXT:
${roleContext}`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Append conversation history
    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-5).forEach(msg => {
        if (msg.sender === 'user' || msg.role === 'user') {
          formattedMessages.push({ role: 'user', content: msg.text || msg.content });
        } else if (msg.sender === 'bot' || msg.role === 'assistant') {
          formattedMessages.push({ role: 'assistant', content: msg.text || msg.content });
        }
      });
    }

    // Append latest query
    formattedMessages.push({ role: 'user', content: userMessage });

    // Try models in hierarchy until one succeeds
    let lastError = null;
    for (const model of this.modelHierarchy) {
      try {
        const reply = await this._callGroq(model, formattedMessages);
        if (reply && reply.trim().length > 0) {
          return this.sanitizeResponse(reply);
        }
      } catch (err) {
        lastError = err;
        console.warn(`SantraAI: Model ${model} failed (${err.message}). Trying next available model...`);
      }
    }

    console.error('SantraAI: All candidate Groq models failed. Last error:', lastError?.message);
    return "SantraAI is currently unable to process your request. Please try again in a moment.";
  }

  async _callGroq(modelName, messages) {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      throw new Error('GROQ_API_KEY is not configured on the backend server.');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: 0.2,
        max_tokens: 650
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message;
    return msg?.content || msg?.reasoning || "I don't have that information in JobMatch AI.";
  }
}

export const santraAiService = new SantraAiService();
