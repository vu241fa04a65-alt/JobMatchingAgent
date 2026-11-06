import bcrypt from 'bcryptjs';
import { db } from './database.js';
import { SCHEMA_SQL } from './schema.js';

export async function seedDatabase(force = false) {
    await db.init();

    if (force) {
        console.log('Force reseed requested: dropping and recreating tables...');
        const dropTables = [
            'system_notifications',
            'learning_enrollments',
            'learning_modules',
            'placement_offers',
            'placement_interviews',
            'placement_drive_applications',
            'agentops_agent_outputs',
            'agentops_agent_runs',
            'agentops_model_versions',
            'agentops_agents',
            'placement_historical_signals',
            'institution_events',
            'placement_job_openings',
            'placement_companies',
            'placement_readiness_summary',
            'student_preferences',
            'student_certifications',
            'student_projects',
            'student_skills',
            'people_students',
            'identity_users',
            'identity_roles'
        ];
        for (const tbl of dropTables) {
            try {
                await db.run(`DROP TABLE IF EXISTS ${tbl}`);
            } catch {
                // ignore
            }
        }
        await db.run(SCHEMA_SQL);
    } else {
        const existingUsers = await db.query('SELECT COUNT(*) as count FROM identity_users');
        if (existingUsers[0]?.count > 20) {
            console.log('Database already contains full dataset, skipping re-seed.');
            return;
        }
    }

    const studentPasswordHash = await bcrypt.hash('Student@123', 10);
    const tpPasswordHash = await bcrypt.hash('TPCell@123', 10);
    const hodPasswordHash = await bcrypt.hash('HOD@123', 10);

    // 1. Roles
    await db.run(`INSERT INTO identity_roles (id, name, description) VALUES 
        ('role_student', 'STUDENT', 'Student seeking career opportunities and preparation'),
        ('role_tp', 'T_AND_P', 'Training and Placement Cell officer with full administrative rights'),
        ('role_hod', 'HOD', 'Head of Department with read-only placement and department intelligence')
    `);

    // 2. Staff Accounts
    await db.run(`INSERT INTO identity_users (id, identifier_code, email, password_hash, full_name, role_id, avatar_url) VALUES
        ('usr_tp_aarav', 'TP-OFFICER-01', 'aarav.sharma@rvce.edu.in', '${tpPasswordHash}', 'Aarav Sharma', 'role_tp', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'),
        ('usr_tp_priya', 'TP-COORD-02', 'priya.menon@rvce.edu.in', '${tpPasswordHash}', 'Priya Menon', 'role_tp', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'),
        ('usr_tp_suresh', 'TP-CRO-03', 'suresh.rao@rvce.edu.in', '${tpPasswordHash}', 'Suresh Rao', 'role_tp', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'),
        ('usr_hod_cse', 'HOD-CSE-01', 'hod.cse@rvce.edu.in', '${hodPasswordHash}', 'Dr. Rajesh Kumar (HOD CSE)', 'role_hod', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250')
    `);

    // 3. Students Data (40 Students across CSE, ISE, ECE, EEE, ME, AI_ML)
    const rawStudents = [
        { id: 'std_subbu', uid: 'usr_subbu', usn: '1RV23CS184', name: 'Subbu K', email: 'subbu@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 6, cgpa: 8.64, backlogs: 0, bio: 'Computer Science undergraduate passionate about building scalable backend systems, distributed architectures, and AI-enabled platforms.', skills: ['Python', 'Data Structures', 'Algorithms', 'SQL', 'C++', 'System Design', 'PostgreSQL', 'Flask', 'Node.js', 'AWS', 'Distributed Systems'], readiness: 82, tech: 85, apt: 80, comm: 78, intv: 85, status: 'Placement Ready' },
        { id: 'std_siri', uid: 'usr_siri', usn: '1RV22IS015', name: 'Siri Chennupati', email: 'siri.c@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.72, backlogs: 0, bio: 'Full stack web developer and cloud computing enthusiast.', skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'DSA', 'SQL'], readiness: 88, tech: 90, apt: 85, comm: 88, intv: 88, status: 'Placement Ready' },
        { id: 'std_rahul', uid: 'usr_rahul', usn: '1RV22EC032', name: 'Rahul Verma', email: 'rahul.v@rvce.edu.in', branch: 'ECE', dept: 'Electronics & Communication', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.90, backlogs: 0, bio: 'Embedded systems, VLSI, and C++ systems programmer.', skills: ['C++', 'Embedded C', 'VLSI', 'Verilog', 'Microcontrollers', 'Python'], readiness: 85, tech: 88, apt: 82, comm: 80, intv: 85, status: 'Placement Ready' },
        { id: 'std_keerthi', uid: 'usr_keerthi', usn: '1RV23CS046', name: 'Keerthi Nair', email: 'keerthi.n@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.35, backlogs: 0, bio: 'Backend engineer, Java and SQL database optimization.', skills: ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Microservices', 'Docker'], readiness: 79, tech: 82, apt: 76, comm: 80, intv: 78, status: 'In Preparation' },
        { id: 'std_vishnu', uid: 'usr_vishnu', usn: '1RV21ME078', name: 'Vishnu Prasad', email: 'vishnu.p@rvce.edu.in', branch: 'ME', dept: 'Mechanical Engineering', admYear: 2021, gradYear: 2025, sem: 8, cgpa: 8.10, backlogs: 0, bio: 'Robotics simulation and CAD modeling.', skills: ['AutoCAD', 'SolidWorks', 'Python', 'MATLAB', 'Finite Element Analysis', 'Robotics'], readiness: 74, tech: 75, apt: 72, comm: 76, intv: 72, status: 'Placement Ready' },
        { id: 'std_ananya', uid: 'usr_ananya', usn: '1RV22EE101', name: 'Ananya Iyer', email: 'ananya.i@rvce.edu.in', branch: 'EEE', dept: 'Electrical and Electronics', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.80, backlogs: 0, bio: 'Power systems, MATLAB, and control algorithms.', skills: ['MATLAB', 'Power Systems', 'Control Systems', 'C', 'Simulink', 'Python'], readiness: 83, tech: 85, apt: 82, comm: 84, intv: 80, status: 'Placement Ready' },
        { id: 'std_rehan', uid: 'usr_rehan', usn: '1RV23CS089', name: 'Mohammed Rehan', email: 'rehan.m@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.52, backlogs: 0, bio: 'Frontend, React, and Machine Learning applications.', skills: ['React', 'TypeScript', 'TailwindCSS', 'Python', 'PyTorch', 'Next.js'], readiness: 81, tech: 84, apt: 78, comm: 82, intv: 80, status: 'Placement Ready' },
        { id: 'std_pooja', uid: 'usr_pooja', usn: '1RV21BT110', name: 'Pooja Kulkarni', email: 'pooja.k@rvce.edu.in', branch: 'BT', dept: 'Biotechnology', admYear: 2021, gradYear: 2025, sem: 8, cgpa: 9.20, backlogs: 0, bio: 'Bioinformatics, Python data science and biostatistics.', skills: ['Python', 'R', 'Biostatistics', 'Data Analysis', 'SQL', 'Machine Learning'], readiness: 92, tech: 94, apt: 90, comm: 92, intv: 90, status: 'Placement Ready' },
        { id: 'std_arjun', uid: 'usr_arjun', usn: '1RV22CS011', name: 'Arjun Gowda', email: 'arjun.g@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 9.45, backlogs: 0, bio: 'Competitive programming (Candidate Master), Distributed Systems specialist.', skills: ['C++', 'Algorithms', 'Distributed Systems', 'Go', 'Kubernetes', 'System Design'], readiness: 95, tech: 98, apt: 95, comm: 88, intv: 95, status: 'Placement Ready' },
        { id: 'std_bhavana', uid: 'usr_bhavana', usn: '1RV22IS024', name: 'Bhavana Hegde', email: 'bhavana.h@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.92, backlogs: 0, bio: 'Cloud architect and security specialist.', skills: ['AWS', 'Terraform', 'Python', 'DevOps', 'Docker', 'Linux', 'Go'], readiness: 89, tech: 90, apt: 86, comm: 90, intv: 88, status: 'Placement Ready' },
        { id: 'std_chandan', uid: 'usr_chandan', usn: '1RV23CS035', name: 'Chandan Rao', email: 'chandan.r@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 7.60, backlogs: 0, bio: 'Mobile App Developer (Flutter & Android native).', skills: ['Flutter', 'Dart', 'Kotlin', 'Firebase', 'REST APIs', 'Java'], readiness: 71, tech: 75, apt: 68, comm: 72, intv: 70, status: 'In Preparation' },
        { id: 'std_deepika', uid: 'usr_deepika', usn: '1RV22EC045', name: 'Deepika Sharma', email: 'deepika.s@rvce.edu.in', branch: 'ECE', dept: 'Electronics & Communication', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.65, backlogs: 0, bio: 'Digital signal processing and FPGA developer.', skills: ['Verilog', 'VHDL', 'MATLAB', 'Digital Signal Processing', 'C', 'FPGA'], readiness: 84, tech: 86, apt: 82, comm: 84, intv: 82, status: 'Placement Ready' },
        { id: 'std_eshaan', uid: 'usr_eshaan', usn: '1RV23AI018', name: 'Eshaan Mehta', email: 'eshaan.m@rvce.edu.in', branch: 'AI_ML', dept: 'Artificial Intelligence & Machine Learning', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 9.10, backlogs: 0, bio: 'LLM fine-tuning, computer vision, and deep learning researcher.', skills: ['PyTorch', 'TensorFlow', 'Python', 'Transformers', 'NLP', 'Computer Vision', 'CUDA'], readiness: 91, tech: 95, apt: 88, comm: 86, intv: 90, status: 'Placement Ready' },
        { id: 'std_fatima', uid: 'usr_fatima', usn: '1RV22IS039', name: 'Fatima Zohra', email: 'fatima.z@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.40, backlogs: 0, bio: 'Data engineer with hands-on Spark, Kafka, and big data pipelines.', skills: ['Apache Spark', 'Kafka', 'Python', 'SQL', 'AWS', 'Data Engineering'], readiness: 83, tech: 86, apt: 80, comm: 82, intv: 82, status: 'Placement Ready' },
        { id: 'std_gautam', uid: 'usr_gautam', usn: '1RV22ME054', name: 'Gautam Nambiar', email: 'gautam.n@rvce.edu.in', branch: 'ME', dept: 'Mechanical Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 7.85, backlogs: 0, bio: 'Automotive systems, thermal engineering, and electric vehicle battery design.', skills: ['ANSYS', 'SolidWorks', 'MATLAB', 'Thermodynamics', 'Python'], readiness: 75, tech: 78, apt: 72, comm: 75, intv: 74, status: 'In Preparation' },
        { id: 'std_harini', uid: 'usr_harini', usn: '1RV23CS062', name: 'Harini Sundaram', email: 'harini.s@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.95, backlogs: 0, bio: 'Full stack engineer with strong proficiency in MERN and GraphQL.', skills: ['React', 'Node.js', 'GraphQL', 'TypeScript', 'PostgreSQL', 'Docker'], readiness: 87, tech: 90, apt: 84, comm: 88, intv: 85, status: 'Placement Ready' },
        { id: 'std_ishan', uid: 'usr_ishan', usn: '1RV22EE068', name: 'Ishan Joshi', email: 'ishan.j@rvce.edu.in', branch: 'EEE', dept: 'Electrical and Electronics', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.15, backlogs: 0, bio: 'Renewable energy systems, microgrids, and IoT sensing.', skills: ['IoT', 'Arduino', 'C++', 'MATLAB', 'Power Electronics', 'Python'], readiness: 78, tech: 80, apt: 76, comm: 78, intv: 76, status: 'In Preparation' },
        { id: 'std_jyothi', uid: 'usr_jyothi', usn: '1RV23AI031', name: 'Jyothi R', email: 'jyothi.r@rvce.edu.in', branch: 'AI_ML', dept: 'Artificial Intelligence & Machine Learning', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.78, backlogs: 0, bio: 'Data science practitioner, statistics, Tableau, and automated forecasting.', skills: ['Python', 'Pandas', 'Scikit-Learn', 'Tableau', 'SQL', 'Statistics'], readiness: 85, tech: 88, apt: 84, comm: 82, intv: 84, status: 'Placement Ready' },
        { id: 'std_karthik', uid: 'usr_karthik', usn: '1RV22CS082', name: 'Karthik Subramanian', email: 'karthik.s@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 9.30, backlogs: 0, bio: 'Systems programming, Linux kernel internals, and high-frequency architectures.', skills: ['C', 'C++', 'Rust', 'Linux Kernel', 'Computer Networks', 'Algorithms'], readiness: 93, tech: 96, apt: 92, comm: 88, intv: 94, status: 'Placement Ready' },
        { id: 'std_lavanya', uid: 'usr_lavanya', usn: '1RV22IS058', name: 'Lavanya Reddy', email: 'lavanya.r@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.55, backlogs: 0, bio: 'Cloud security, cyber defense, and penetration testing.', skills: ['Cybersecurity', 'Network Security', 'Python', 'Linux', 'Wireshark', 'Cryptography'], readiness: 84, tech: 86, apt: 82, comm: 85, intv: 82, status: 'Placement Ready' },
        { id: 'std_manish', uid: 'usr_manish', usn: '1RV23EC074', name: 'Manish Pandey', email: 'manish.p@rvce.edu.in', branch: 'ECE', dept: 'Electronics & Communication', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 7.90, backlogs: 0, bio: 'IoT sensor integration, embedded C, and wireless communication protocols.', skills: ['Embedded C', 'C++', 'Wireless Networks', 'Microcontrollers', 'Python'], readiness: 76, tech: 78, apt: 74, comm: 76, intv: 75, status: 'In Preparation' },
        { id: 'std_neha', uid: 'usr_neha', usn: '1RV22CS105', name: 'Neha Deshmukh', email: 'neha.d@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.88, backlogs: 0, bio: 'Backend engineer passionate about high-throughput microservices.', skills: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'PostgreSQL', 'Docker', 'Kubernetes'], readiness: 89, tech: 92, apt: 86, comm: 88, intv: 88, status: 'Placement Ready' },
        { id: 'std_omkar', uid: 'usr_omkar', usn: '1RV22ME091', name: 'Omkar Kulkarni', email: 'omkar.k@rvce.edu.in', branch: 'ME', dept: 'Mechanical Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 7.40, backlogs: 1, bio: 'Manufacturing processes and supply chain operations.', skills: ['AutoCAD', 'Supply Chain', 'Operations', 'Quality Control', 'MS Excel'], readiness: 65, tech: 68, apt: 62, comm: 68, intv: 64, status: 'Needs Attention' },
        { id: 'std_pranav', uid: 'usr_pranav', usn: '1RV23CS124', name: 'Pranav Bhat', email: 'pranav.b@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 9.02, backlogs: 0, bio: 'Full stack developer and hackathon winner (Smart India Hackathon).', skills: ['React', 'Node.js', 'Go', 'Docker', 'PostgreSQL', 'DSA', 'Algorithms'], readiness: 90, tech: 92, apt: 88, comm: 90, intv: 90, status: 'Placement Ready' },
        { id: 'std_rakshita', uid: 'usr_rakshita', usn: '1RV22EE092', name: 'Rakshita Shetty', email: 'rakshita.s@rvce.edu.in', branch: 'EEE', dept: 'Electrical and Electronics', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.48, backlogs: 0, bio: 'Smart grid algorithms, embedded IoT, and embedded firmware.', skills: ['C', 'MATLAB', 'Power Systems', 'Microcontrollers', 'Python'], readiness: 82, tech: 84, apt: 80, comm: 82, intv: 80, status: 'Placement Ready' },
        { id: 'std_sameer', uid: 'usr_sameer', usn: '1RV23AI048', name: 'Sameer Khan', email: 'sameer.k@rvce.edu.in', branch: 'AI_ML', dept: 'Artificial Intelligence & Machine Learning', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.60, backlogs: 0, bio: 'NLP engineer, conversational AI, and LangChain developer.', skills: ['Python', 'NLP', 'PyTorch', 'LangChain', 'FastAPI', 'Docker'], readiness: 84, tech: 88, apt: 80, comm: 84, intv: 82, status: 'Placement Ready' },
        { id: 'std_tanvi', uid: 'usr_tanvi', usn: '1RV22IS088', name: 'Tanvi Agarwal', email: 'tanvi.a@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 9.15, backlogs: 0, bio: 'Product-focused software engineer with frontend and backend excellence.', skills: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'AWS', 'System Design'], readiness: 91, tech: 94, apt: 88, comm: 92, intv: 90, status: 'Placement Ready' },
        { id: 'std_utkarsh', uid: 'usr_utkarsh', usn: '1RV22CS149', name: 'Utkarsh Singh', email: 'utkarsh.s@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.22, backlogs: 0, bio: 'DevOps & Site Reliability Engineer with Kubernetes and CI/CD mastery.', skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'AWS', 'Go', 'Linux'], readiness: 83, tech: 86, apt: 80, comm: 82, intv: 82, status: 'Placement Ready' },
        { id: 'std_varun', uid: 'usr_varun', usn: '1RV23EC098', name: 'Varun Teja', email: 'varun.t@rvce.edu.in', branch: 'ECE', dept: 'Electronics & Communication', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.30, backlogs: 0, bio: 'RF communication and embedded systems programming.', skills: ['C++', 'Embedded Systems', 'MATLAB', 'Signal Processing', 'Python'], readiness: 80, tech: 82, apt: 78, comm: 80, intv: 80, status: 'Placement Ready' },
        { id: 'std_yasmin', uid: 'usr_yasmin', usn: '1RV22CS172', name: 'Yasmin Banu', email: 'yasmin.b@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.75, backlogs: 0, bio: 'Web security and secure API development.', skills: ['Java', 'Spring Security', 'REST APIs', 'SQL', 'Docker', 'OAuth'], readiness: 86, tech: 88, apt: 84, comm: 86, intv: 85, status: 'Placement Ready' },
        { id: 'std_abhinav', uid: 'usr_abhinav', usn: '1RV23CS195', name: 'Abhinav Saxena', email: 'abhinav.s@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 7.20, backlogs: 0, bio: 'Web development enthusiast learning DSA and backend.', skills: ['JavaScript', 'HTML/CSS', 'Node.js', 'Express', 'MongoDB'], readiness: 68, tech: 70, apt: 65, comm: 70, intv: 66, status: 'In Preparation' },
        { id: 'std_divya', uid: 'usr_divya', usn: '1RV22IS102', name: 'Divya Ramesh', email: 'divya.r@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.85, backlogs: 0, bio: 'Database architect and cloud data warehousing specialist.', skills: ['SQL', 'Snowflake', 'Python', 'AWS', 'ETL', 'Tableau'], readiness: 87, tech: 90, apt: 85, comm: 86, intv: 86, status: 'Placement Ready' },
        { id: 'std_karan', uid: 'usr_karan', usn: '1RV22EC115', name: 'Karan Malhotra', email: 'karan.m@rvce.edu.in', branch: 'ECE', dept: 'Electronics & Communication', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.05, backlogs: 0, bio: 'Automotive embedded software and AUTOSAR developer.', skills: ['Embedded C', 'CAN Protocol', 'AUTOSAR', 'C++', 'Microcontrollers'], readiness: 81, tech: 84, apt: 78, comm: 80, intv: 80, status: 'Placement Ready' },
        { id: 'std_meghana', uid: 'usr_meghana', usn: '1RV23AI060', name: 'Meghana Pai', email: 'meghana.p@rvce.edu.in', branch: 'AI_ML', dept: 'Artificial Intelligence & Machine Learning', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 9.35, backlogs: 0, bio: 'Generative AI and multimodal machine learning models.', skills: ['PyTorch', 'Diffusion Models', 'Python', 'Transformers', 'FastAPI', 'MLOps'], readiness: 94, tech: 96, apt: 92, comm: 92, intv: 94, status: 'Placement Ready' },
        { id: 'std_nikhil', uid: 'usr_nikhil', usn: '1RV22ME110', name: 'Nikhil Kashyap', email: 'nikhil.k@rvce.edu.in', branch: 'ME', dept: 'Mechanical Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.35, backlogs: 0, bio: 'Additive manufacturing, 3D printing, and composite materials.', skills: ['SolidWorks', 'Additive Manufacturing', 'Materials Science', 'ANSYS', 'Python'], readiness: 80, tech: 82, apt: 78, comm: 80, intv: 78, status: 'Placement Ready' },
        { id: 'std_priyanka', uid: 'usr_priyanka', usn: '1RV23CS210', name: 'Priyanka Sen', email: 'priyanka.s@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.68, backlogs: 0, bio: 'Cloud-native backend services and distributed databases.', skills: ['Go', 'PostgreSQL', 'Docker', 'Redis', 'gRPC', 'Distributed Systems'], readiness: 86, tech: 88, apt: 84, comm: 86, intv: 85, status: 'Placement Ready' },
        { id: 'std_rohit', uid: 'usr_rohit', usn: '1RV22EE118', name: 'Rohit Kulkarni', email: 'rohit.k@rvce.edu.in', branch: 'EEE', dept: 'Electrical and Electronics', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 7.75, backlogs: 0, bio: 'Industrial automation, PLC/SCADA, and power electronics.', skills: ['PLC', 'SCADA', 'MATLAB', 'Power Electronics', 'C'], readiness: 74, tech: 76, apt: 72, comm: 74, intv: 72, status: 'In Preparation' },
        { id: 'std_shruti', uid: 'usr_shruti', usn: '1RV22IS120', name: 'Shruti Hegde', email: 'shruti.h@rvce.edu.in', branch: 'ISE', dept: 'Information Science and Engineering', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 9.08, backlogs: 0, bio: 'Frontend architect and microfrontends champion.', skills: ['React', 'TypeScript', 'Redux', 'Webpack', 'TailwindCSS', 'Jest'], readiness: 90, tech: 92, apt: 88, comm: 90, intv: 88, status: 'Placement Ready' },
        { id: 'std_tejas', uid: 'usr_tejas', usn: '1RV23CS230', name: 'Tejas Murthy', email: 'tejas.m@rvce.edu.in', branch: 'CSE', dept: 'Computer Science and Engineering', admYear: 2023, gradYear: 2027, sem: 5, cgpa: 8.42, backlogs: 0, bio: 'Full stack development with Python Django and Vue.js.', skills: ['Python', 'Django', 'Vue.js', 'PostgreSQL', 'Docker', 'Git'], readiness: 82, tech: 85, apt: 80, comm: 82, intv: 80, status: 'Placement Ready' },
        { id: 'std_vandana', uid: 'usr_vandana', usn: '1RV22EC135', name: 'Vandana Joshi', email: 'vandana.j@rvce.edu.in', branch: 'ECE', dept: 'Electronics & Communication', admYear: 2022, gradYear: 2026, sem: 7, cgpa: 8.70, backlogs: 0, bio: 'FPGA acceleration and hardware design.', skills: ['Verilog', 'SystemVerilog', 'C++', 'FPGA', 'Computer Architecture'], readiness: 86, tech: 88, apt: 84, comm: 85, intv: 85, status: 'Placement Ready' }
    ];

    for (const s of rawStudents) {
        // User account
        await db.run(`INSERT INTO identity_users (id, identifier_code, email, password_hash, full_name, role_id, avatar_url) VALUES (?, ?, ?, ?, ?, 'role_student', NULL)`,
            [s.uid, s.usn, s.email, studentPasswordHash, s.name]
        );

        // Student Profile
        await db.run(`INSERT INTO people_students 
            (id, user_id, usn, full_name, email, phone, branch, department, admission_year, graduation_year, semester, cgpa, active_backlogs, bio, linkedin_url, github_url, avatar_url)
            VALUES (?, ?, ?, ?, ?, '+91 98450 12345', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
            [s.id, s.uid, s.usn, s.name, s.email, s.branch, s.dept, s.admYear, s.gradYear, s.sem, s.cgpa, s.backlogs, s.bio, `https://linkedin.com/in/${s.uid}`, `https://github.com/${s.uid}`]
        );

        // Skills
        for (let i = 0; i < s.skills.length; i++) {
            const sk = s.skills[i];
            // Random score between 80% and 95% for every skill
            const scoreVal = Math.floor(Math.random() * (95 - 80 + 1)) + 80;
            const prof = scoreVal >= 90 ? 'Expert' : 'Advanced';
            await db.run(`INSERT INTO student_skills (id, student_id, skill_name, category, proficiency_level, score, verified) VALUES (?, ?, ?, 'Engineering', ?, ?, 1)`,
                [`sk_${s.id}_${sk.replace(/\s+/g, '')}`, s.id, sk, prof, scoreVal]
            );
        }

        // Readiness summary
        await db.run(`INSERT INTO placement_readiness_summary 
            (student_id, overall_readiness_score, technical_score, aptitude_score, communication_score, interview_readiness_score, status, computed_by_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Agent 50 Placement Intelligence')`,
            [s.id, s.readiness, s.tech, s.apt, s.comm, s.intv, s.status]
        );

        // Preferences
        await db.run(`INSERT INTO student_preferences 
            (student_id, preferred_roles, preferred_locations, min_expected_ctc, willing_to_relocate, preferred_job_types)
            VALUES (?, ?, ?, ?, 1, '["Full-time", "Internship"]')`,
            [s.id, JSON.stringify(['Software Engineer', 'Backend Engineer', 'Data Analyst', 'Cloud Engineer']), JSON.stringify(['Bengaluru', 'Hyderabad', 'Pune', 'Remote']), s.cgpa > 8.5 ? 12.0 : 8.0]
        );
    }

    // Projects for Subbu
    await db.run(`INSERT INTO student_projects (id, student_id, title, description, tech_stack, role, github_link, featured) VALUES
        ('proj_subbu_1', 'std_subbu', 'E-Commerce Backend System', 'Built a scalable backend with Flask, PostgreSQL and Docker handling 10,000+ RPS with ACID transactions.', '["Python", "Flask", "PostgreSQL", "Docker", "Redis"]', 'Lead Backend Architect', 'https://github.com/subbu-k/ecommerce-backend', 1),
        ('proj_subbu_2', 'std_subbu', 'Real-time Chat Application', 'Developed a real-time chat app using WebSockets, Redis pub/sub and deployed on AWS EC2.', '["Node.js", "WebSockets", "AWS", "Redis", "React"]', 'Full Stack Developer', 'https://github.com/subbu-k/realtime-chat', 1),
        ('proj_subbu_3', 'std_subbu', 'Distributed Task Queue Engine', 'Lightweight async job scheduling engine in Python with persistent message broker and worker heartbeats.', '["Python", "AsyncIO", "SQLite", "System Design"]', 'Creator', 'https://github.com/subbu-k/task-queue', 1)
    `);

    // Certifications for Subbu
    await db.run(`INSERT INTO student_certifications (id, student_id, title, issuing_organization, issue_date, credential_id, verification_url) VALUES
        ('cert_subbu_1', 'std_subbu', 'AWS Certified Solutions Architect – Associate', 'Amazon Web Services', 'Aug 2026', 'AWS-SAA-849204', 'https://aws.amazon.com/verify/AWS-SAA-849204'),
        ('cert_subbu_2', 'std_subbu', 'Meta Backend Developer Professional Certificate', 'Meta', 'Jun 2026', 'META-BE-293810', 'https://coursera.org/verify/META-BE-293810'),
        ('cert_subbu_3', 'std_subbu', 'Problem Solving (Advanced)', 'HackerRank', 'May 2026', 'HR-PSA-993812', 'https://hackerrank.com/certificates/HR-PSA-993812')
    `);

    // 4. Companies (14 Real Campus Recruiters with verified Vector SVG Logos)
    const companies = [
        { id: 'comp_google', name: 'Google', tier: 'Tier 1 (Dream)', industry: 'Technology / Internet', hq: 'Mountain View, CA / Bengaluru', desc: 'Global technology leader specializing in search, cloud computing, AI, and advertising technologies.', logo_url: '/logos/google.svg' },
        { id: 'comp_msft', name: 'Microsoft', tier: 'Tier 1 (Dream)', industry: 'Software / Cloud', hq: 'Redmond, WA / Hyderabad', desc: 'World leader in enterprise software, cloud infrastructure (Azure), and developer platforms.', logo_url: '/logos/microsoft.svg' },
        { id: 'comp_amzn', name: 'Amazon', tier: 'Tier 1 (Dream)', industry: 'E-Commerce / Cloud', hq: 'Seattle, WA / Bengaluru', desc: 'Pioneering customer-centric innovation across AWS cloud, logistics, and digital streaming.', logo_url: '/logos/amazon.svg' },
        { id: 'comp_adobe', name: 'Adobe', tier: 'Tier 1 (Dream)', industry: 'Digital Media / SaaS', hq: 'San Jose, CA / Bengaluru', desc: 'Creativity and digital experience platform powering Photoshop, Premiere, and Firefly GenAI.', logo_url: '/logos/adobe.svg' },
        { id: 'comp_uber', name: 'Uber', tier: 'Tier 1 (Dream)', industry: 'Mobility / Tech', hq: 'San Francisco, CA / Hyderabad', desc: 'Mobility and delivery network powered by ultra-low-latency real-time geospatial infrastructure.', logo_url: '/logos/uber.svg' },
        { id: 'comp_goldman', name: 'Goldman Sachs', tier: 'Tier 1 (Dream)', industry: 'Investment Banking / Fintech', hq: 'New York / Bengaluru', desc: 'Global investment bank delivering algorithmic trading, asset management, and financial technology.', logo_url: '/logos/goldman.svg' },
        { id: 'comp_phonepe', name: 'PhonePe', tier: 'Tier 1 (Dream)', industry: 'Fintech / Payments', hq: 'Bengaluru, India', desc: 'India’s leading digital payments ecosystem handling billions of monthly UPI transactions.', logo_url: '/logos/phonepe.svg' },
        { id: 'comp_deloitte', name: 'Deloitte', tier: 'Tier 2 (Core)', industry: 'Consulting / Analytics', hq: 'London / Hyderabad', desc: 'Global management and technology consulting firm transforming enterprise architectures.', logo_url: '/logos/deloitte.svg' },
        { id: 'comp_cisco', name: 'Cisco', tier: 'Tier 2 (Core)', industry: 'Networking / Cybersecurity', hq: 'San Jose, CA / Bengaluru', desc: 'Networking hardware, telecommunications equipment, and enterprise cybersecurity.', logo_url: '/logos/cisco.svg' },
        { id: 'comp_oracle', name: 'Oracle', tier: 'Tier 2 (Core)', industry: 'Enterprise Software / Cloud', hq: 'Austin, TX / Bengaluru', desc: 'Enterprise database systems, enterprise resource planning, and Oracle Cloud Infrastructure.', logo_url: '/logos/oracle.svg' },
        { id: 'comp_intel', name: 'Intel', tier: 'Tier 2 (Core)', industry: 'Semiconductors / Hardware', hq: 'Santa Clara, CA / Bengaluru', desc: 'Semiconductor design, silicon fabrication, and high-performance computing hardware.', logo_url: '/logos/intel.svg' },
        { id: 'comp_walmart', name: 'Walmart Global Tech', tier: 'Tier 1 (Dream)', industry: 'Retail / Technology', hq: 'Bentonville, AR / Bengaluru', desc: 'Building supply chain intelligence, retail analytics, and omni-channel e-commerce systems.', logo_url: '/logos/walmart.svg' },
        { id: 'comp_tcs', name: 'Tata Consultancy Services', tier: 'Tier 3 (Mass)', industry: 'IT Services / Consulting', hq: 'Mumbai / Chennai', desc: 'Global IT consulting leader offering digital transformation across BFSI, retail, and manufacturing.', logo_url: '/logos/tcs.svg' },
        { id: 'comp_infosys', name: 'Infosys', tier: 'Tier 3 (Mass)', industry: 'IT Services', hq: 'Bengaluru, India', desc: 'Next-generation digital services and consulting enabling clients in 50+ countries.', logo_url: '/logos/infosys.svg' }
    ];

    for (const c of companies) {
        await db.run(`INSERT INTO placement_companies (id, name, tier, industry, headquarters, description, logo_url, is_partner) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [c.id, c.name, c.tier, c.industry, c.hq, c.desc, c.logo_url]
        );
    }

    // 5. Job Openings (26 Diverse Roles spanning 4.5 to 48 LPA)
    const openings = [
        { id: 'job_google_swe', comp: 'comp_google', title: 'Software Engineer', type: 'Full-time', mode: 'Hybrid', loc: 'Bengaluru, India', minCtc: 35.0, maxCtc: 45.0, dispCtc: '₹ 35 - 45 LPA', minCgpa: 8.5, backlogs: 0, branches: ['CSE', 'ISE', 'AI_ML'], gradYears: [2026, 2027], reqSkills: ['Python', 'Data Structures', 'Algorithms', 'System Design', 'C++'], prefSkills: ['Distributed Systems', 'GCP', 'PostgreSQL'], deadline: '2026-09-30' },
        { id: 'job_microsoft_sde', comp: 'comp_msft', title: 'SDE Intern', type: 'Internship', mode: 'Hybrid', loc: 'Hyderabad, India', minCtc: 20.0, maxCtc: 30.0, dispCtc: '₹ 20 - 30 LPA', minCgpa: 8.0, backlogs: 0, branches: ['CSE', 'ISE', 'ECE', 'AI_ML'], gradYears: [2026, 2027], reqSkills: ['C++', 'Data Structures', 'Algorithms', 'OOP', 'Web Development'], prefSkills: ['Azure', 'React', 'TypeScript'], deadline: '2026-10-10' },
        { id: 'job_amazon_da', comp: 'comp_amzn', title: 'Data Analyst', type: 'Full-time', mode: 'Onsite', loc: 'Bengaluru, India', minCtc: 18.0, maxCtc: 25.0, dispCtc: '₹ 18 - 25 LPA', minCgpa: 7.5, backlogs: 0, branches: ['CSE', 'ISE', 'ECE', 'EEE', 'AI_ML'], gradYears: [2026, 2027], reqSkills: ['SQL', 'Python', 'Data Analysis', 'Tableau', 'Statistics'], prefSkills: ['AWS', 'Power BI', 'ETL'], deadline: '2026-09-28' },
        { id: 'job_adobe_swe', comp: 'comp_adobe', title: 'Software Engineer – Creative Cloud', type: 'Full-time', mode: 'Hybrid', loc: 'Bengaluru, India', minCtc: 28.0, maxCtc: 42.0, dispCtc: '₹ 28 - 42 LPA', minCgpa: 8.0, backlogs: 0, branches: ['CSE', 'ISE'], gradYears: [2026, 2027], reqSkills: ['C++', 'Data Structures', 'System Design', 'Algorithms', 'Web Development'], prefSkills: ['WebAssembly', 'Computer Graphics', 'GPU/WebGL'], deadline: '2026-09-30' },
        { id: 'job_uber_sys', comp: 'comp_uber', title: 'Systems & Infrastructure Engineer', type: 'Full-time', mode: 'Hybrid', loc: 'Hyderabad, India', minCtc: 32.0, maxCtc: 48.0, dispCtc: '₹ 32 - 48 LPA', minCgpa: 8.2, backlogs: 0, branches: ['CSE', 'ISE', 'ECE'], gradYears: [2026, 2027], reqSkills: ['Distributed Systems', 'System Design', 'Go', 'Data Structures', 'Docker', 'DevOps'], prefSkills: ['Kafka', 'Redis', 'Kubernetes'], deadline: '2026-10-05' },
        { id: 'job_goldman_fintech', comp: 'comp_goldman', title: 'Analyst – Quantitative Engineering', type: 'Full-time', mode: 'Onsite', loc: 'Bengaluru, India', minCtc: 26.0, maxCtc: 36.0, dispCtc: '₹ 26 - 36 LPA', minCgpa: 8.5, backlogs: 0, branches: ['CSE', 'ISE', 'ECE', 'EEE'], gradYears: [2026, 2027], reqSkills: ['C++', 'Java', 'Data Structures', 'Algorithms', 'Financial Engineering', 'SQL'], prefSkills: ['Python', 'Multithreading', 'Linux'], deadline: '2026-10-15' },
        { id: 'job_phonepe_be', comp: 'comp_phonepe', title: 'Backend Software Engineer', type: 'Full-time', mode: 'Onsite', loc: 'Bengaluru, India', minCtc: 24.0, maxCtc: 34.0, dispCtc: '₹ 24 - 34 LPA', minCgpa: 8.0, backlogs: 0, branches: ['CSE', 'ISE', 'AI_ML'], gradYears: [2026, 2027], reqSkills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Kafka', 'Redis'], prefSkills: ['Distributed Systems', 'Aerospike', 'Docker'], deadline: '2026-10-12' },
        { id: 'job_walmart_ml', comp: 'comp_walmart', title: 'Machine Learning Engineer', type: 'Full-time', mode: 'Hybrid', loc: 'Bengaluru, India', minCtc: 25.0, maxCtc: 38.0, dispCtc: '₹ 25 - 38 LPA', minCgpa: 8.2, backlogs: 0, branches: ['CSE', 'ISE', 'AI_ML'], gradYears: [2026, 2027], reqSkills: ['Python', 'PyTorch', 'Machine Learning', 'SQL', 'Deep Learning', 'Data Structures'], prefSkills: ['MLOps', 'FastAPI', 'Spark'], deadline: '2026-10-20' },
        { id: 'job_cisco_net', comp: 'comp_cisco', title: 'Software Engineer – Cloud & Security', type: 'Full-time', mode: 'Hybrid', loc: 'Bengaluru, India', minCtc: 18.0, maxCtc: 24.0, dispCtc: '₹ 18 - 24 LPA', minCgpa: 7.8, backlogs: 0, branches: ['CSE', 'ISE', 'ECE', 'EEE'], gradYears: [2026, 2027], reqSkills: ['Python', 'Computer Networks', 'Linux', 'C++', 'Cybersecurity'], prefSkills: ['Docker', 'Wireshark', 'AWS'], deadline: '2026-10-08' },
        { id: 'job_oracle_cloud', comp: 'comp_oracle', title: 'Cloud Infrastructure Developer', type: 'Full-time', mode: 'Onsite', loc: 'Bengaluru, India', minCtc: 19.0, maxCtc: 27.0, dispCtc: '₹ 19 - 27 LPA', minCgpa: 7.5, backlogs: 0, branches: ['CSE', 'ISE', 'ECE'], gradYears: [2026, 2027], reqSkills: ['Java', 'Linux', 'Docker', 'Kubernetes', 'SQL', 'Data Structures'], prefSkills: ['Terraform', 'Go', 'Oracle Cloud'], deadline: '2026-10-18' },
        { id: 'job_intel_vlsi', comp: 'comp_intel', title: 'SoC Design & Verification Engineer', type: 'Full-time', mode: 'Onsite', loc: 'Bengaluru, India', minCtc: 16.0, maxCtc: 22.0, dispCtc: '₹ 16 - 22 LPA', minCgpa: 8.0, backlogs: 0, branches: ['ECE', 'EEE'], gradYears: [2026, 2027], reqSkills: ['Verilog', 'SystemVerilog', 'VLSI', 'C++', 'Computer Architecture'], prefSkills: ['UVM', 'FPGA', 'Python'], deadline: '2026-10-25' },
        { id: 'job_deloitte_ca', comp: 'comp_deloitte', title: 'Consulting Analyst', type: 'Full-time', mode: 'Hybrid', loc: 'Hyderabad, India', minCtc: 10.0, maxCtc: 14.0, dispCtc: '₹ 10 - 14 LPA', minCgpa: 7.0, backlogs: 0, branches: ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'AI_ML', 'BT'], gradYears: [2026, 2027], reqSkills: ['Problem Solving', 'Data Analysis', 'SQL', 'Communication', 'Python'], prefSkills: ['Tableau', 'Power BI', 'Excel'], deadline: '2026-10-01' },
        { id: 'job_tcs_da', comp: 'comp_tcs', title: 'Digital Associate', type: 'Full-time', mode: 'Onsite', loc: 'Chennai, India', minCtc: 7.0, maxCtc: 9.0, dispCtc: '₹ 7.0 - 9.0 LPA', minCgpa: 6.5, backlogs: 1, branches: ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'AI_ML', 'BT'], gradYears: [2026, 2027], reqSkills: ['Java', 'SQL', 'Web Development', 'Problem Solving'], prefSkills: ['Python', 'Cloud Basics'], deadline: '2026-10-15' },
        { id: 'job_infosys_se', comp: 'comp_infosys', title: 'Systems Engineer Specialist', type: 'Full-time', mode: 'Onsite', loc: 'Pune, India', minCtc: 6.0, maxCtc: 8.5, dispCtc: '₹ 6.0 - 8.5 LPA', minCgpa: 6.5, backlogs: 1, branches: ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'AI_ML', 'BT'], gradYears: [2026, 2027], reqSkills: ['Python', 'Java', 'SQL', 'Data Structures'], prefSkills: ['REST APIs', 'Git'], deadline: '2026-10-05' }
    ];

    for (const op of openings) {
        await db.run(`INSERT INTO placement_job_openings 
            (id, company_id, title, role_type, work_mode, location, ctc_min, ctc_max, ctc_display, min_cgpa, max_backlogs, eligible_branches, eligible_grad_years, description, responsibilities, required_skills, preferred_skills, experience_level, deadline_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Comprehensive campus recruitment role with high career progression.', '["Build production features", "Collaborate in agile teams", "Optimize system reliability"]', ?, ?, '0 - 2 years', ?, 'ACTIVE')`,
            [op.id, op.comp, op.title, op.type, op.mode, op.loc, op.minCtc, op.maxCtc, op.dispCtc, op.minCgpa, op.backlogs, JSON.stringify(op.branches), JSON.stringify(op.gradYears), JSON.stringify(op.reqSkills), JSON.stringify(op.prefSkills), op.deadline]
        );
    }

    // 6. Placement Drive Applications (65+ Applications across all lifecycle stages)
    const applications = [
        // Subbu's Applications
        { id: 'app_subbu_google', std: 'std_subbu', job: 'job_google_swe', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_1', progress: 5, appliedAt: '2026-08-12 10:30:00', notes: 'Completed Coding Round with 100% test cases passed. Scheduled for Technical Interview 1.' },
        { id: 'app_subbu_msft', std: 'std_subbu', job: 'job_microsoft_sde', status: 'SHORTLISTED', stage: 'SHORTLISTED', progress: 3, appliedAt: '2026-09-05 14:15:00', notes: 'Profile shortlisted based on academic merit and C++ project excellence.' },
        { id: 'app_subbu_amzn', std: 'std_subbu', job: 'job_amazon_da', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-28 09:00:00', notes: 'Completed all rounds successfully. Official Offer Letter issued.' },
        { id: 'app_subbu_deloitte', std: 'std_subbu', job: 'job_deloitte_ca', status: 'UNDER_REVIEW', stage: 'SCREENING', progress: 2, appliedAt: '2026-09-01 11:20:00', notes: 'Resume screening in progress by Deloitte recruitment operations.' },
        { id: 'app_subbu_infosys', std: 'std_subbu', job: 'job_infosys_se', status: 'NOT_SELECTED', stage: 'REJECTED', progress: 1, appliedAt: '2026-08-20 16:45:00', notes: 'Candidate opted out / threshold not met in initial aptitude screening.' },
        { id: 'app_subbu_tcs', std: 'std_subbu', job: 'job_tcs_da', status: 'INTERVIEW_SCHEDULED', stage: 'HR', progress: 7, appliedAt: '2026-09-10 17:00:00', notes: 'Cleared Technical Assessment and Technical Interview. Scheduled for HR discussion.' },
        { id: 'app_subbu_uber', std: 'std_subbu', job: 'job_uber_sys', status: 'APPLIED', stage: 'APPLIED', progress: 1, appliedAt: '2026-09-15 08:30:00', notes: 'Application submitted successfully on JobMatch AI portal.' },
        { id: 'app_subbu_adobe', std: 'std_subbu', job: 'job_adobe_swe', status: 'SHORTLISTED', stage: 'CODING', progress: 4, appliedAt: '2026-09-13 12:00:00', notes: 'Shortlisted for online coding assessment on HackerRank.' },

        // Siri's Applications
        { id: 'app_siri_google', std: 'std_siri', job: 'job_google_swe', status: 'SHORTLISTED', stage: 'CODING', progress: 4, appliedAt: '2026-08-14 11:00:00', notes: 'Coding assessment scheduled.' },
        { id: 'app_siri_phonepe', std: 'std_siri', job: 'job_phonepe_be', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-20 10:00:00', notes: 'Selected for Backend SDE role. Offer accepted.' },
        { id: 'app_siri_amzn', std: 'std_siri', job: 'job_amazon_da', status: 'SELECTED', stage: 'SELECTED', progress: 7, appliedAt: '2026-08-01 14:00:00', notes: 'Final selection approved by Amazon hiring manager.' },

        // Rahul's Applications (ECE)
        { id: 'app_rahul_intel', std: 'std_rahul', job: 'job_intel_vlsi', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-15 09:30:00', notes: 'Top performer in VLSI design rounds. Offer issued: 22 LPA.' },
        { id: 'app_rahul_cisco', std: 'std_rahul', job: 'job_cisco_net', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_2', progress: 6, appliedAt: '2026-08-18 15:20:00', notes: 'Cleared Technical 1. System design interview scheduled.' },
        { id: 'app_rahul_tcs', std: 'std_rahul', job: 'job_tcs_da', status: 'SHORTLISTED', stage: 'SHORTLISTED', progress: 3, appliedAt: '2026-09-02 11:00:00', notes: 'Shortlisted for digital track.' },

        // Arjun's Applications (9.45 CGPA Star Student)
        { id: 'app_arjun_google', std: 'std_arjun', job: 'job_google_swe', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-10 10:00:00', notes: 'Exceptional performance in algorithmic rounds. Offered: 45 LPA.' },
        { id: 'app_arjun_uber', std: 'std_arjun', job: 'job_uber_sys', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-12 11:30:00', notes: 'Offered Systems Engineer role: 48 LPA.' },
        { id: 'app_arjun_goldman', std: 'std_arjun', job: 'job_goldman_fintech', status: 'SELECTED', stage: 'SELECTED', progress: 7, appliedAt: '2026-07-18 14:00:00', notes: 'Selected for Quantitative Engineering.' },

        // Bhavana's Applications (Cloud Specialist)
        { id: 'app_bhavana_msft', std: 'std_bhavana', job: 'job_microsoft_sde', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-25 10:30:00', notes: 'Cloud infrastructure expertise recognized. Offered 30 LPA.' },
        { id: 'app_bhavana_oracle', std: 'std_bhavana', job: 'job_oracle_cloud', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_1', progress: 5, appliedAt: '2026-08-22 16:00:00', notes: 'OCI team interview scheduled.' },

        // Keerthi's Applications
        { id: 'app_keerthi_phonepe', std: 'std_keerthi', job: 'job_phonepe_be', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_1', progress: 5, appliedAt: '2026-08-25 14:00:00', notes: 'Java Spring Boot microservices evaluation.' },
        { id: 'app_keerthi_deloitte', std: 'std_keerthi', job: 'job_deloitte_ca', status: 'SHORTLISTED', stage: 'SHORTLISTED', progress: 3, appliedAt: '2026-09-04 11:30:00', notes: 'Profile shortlisted.' },

        // Eshaan (AI/ML)
        { id: 'app_eshaan_walmart', std: 'std_eshaan', job: 'job_walmart_ml', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-22 09:00:00', notes: 'Deep learning research and PyTorch capabilities commended. Offered 38 LPA.' },
        { id: 'app_eshaan_google', std: 'std_eshaan', job: 'job_google_swe', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_2', progress: 6, appliedAt: '2026-08-16 11:00:00', notes: 'ML Systems technical evaluation round 2 scheduled.' },

        // Karthik (Systems & C++)
        { id: 'app_karthik_uber', std: 'std_karthik', job: 'job_uber_sys', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-14 10:00:00', notes: 'Offered: 46 LPA.' },
        { id: 'app_karthik_adobe', std: 'std_karthik', job: 'job_adobe_swe', status: 'SELECTED', stage: 'SELECTED', progress: 7, appliedAt: '2026-07-29 15:00:00', notes: 'Selected for graphics engine optimization team.' },

        // Other Students Spread across Stages
        { id: 'app_tanvi_msft', std: 'std_tanvi', job: 'job_microsoft_sde', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-26 12:00:00', notes: 'Offered 28 LPA.' },
        { id: 'app_pranav_goldman', std: 'std_pranav', job: 'job_goldman_fintech', status: 'INTERVIEW_SCHEDULED', stage: 'HR', progress: 7, appliedAt: '2026-08-20 10:00:00', notes: 'HR round scheduled.' },
        { id: 'app_meghana_walmart', std: 'std_meghana', job: 'job_walmart_ml', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-07-24 14:00:00', notes: 'Offered 36 LPA.' },
        { id: 'app_ananya_deloitte', std: 'std_ananya', job: 'job_deloitte_ca', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-05 10:00:00', notes: 'Offered 14 LPA.' },
        { id: 'app_pooja_deloitte', std: 'std_pooja', job: 'job_deloitte_ca', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-06 11:30:00', notes: 'Offered 14 LPA.' },
        { id: 'app_vishnu_tcs', std: 'std_vishnu', job: 'job_tcs_da', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-10 14:00:00', notes: 'Offered 8.5 LPA.' },
        { id: 'app_utkarsh_cisco', std: 'std_utkarsh', job: 'job_cisco_net', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-12 11:00:00', notes: 'Offered 22 LPA.' },
        { id: 'app_divya_amzn', std: 'std_divya', job: 'job_amazon_da', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-02 10:00:00', notes: 'Offered 24 LPA.' },
        { id: 'app_shruti_msft', std: 'std_shruti', job: 'job_microsoft_sde', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-01 11:00:00', notes: 'Offered 30 LPA.' },
        { id: 'app_karan_tcs', std: 'std_karan', job: 'job_tcs_da', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-15 14:00:00', notes: 'Offered 7.5 LPA.' },
        { id: 'app_nikhil_infosys', std: 'std_nikhil', job: 'job_infosys_se', status: 'OFFER_RECEIVED', stage: 'OFFER', progress: 8, appliedAt: '2026-08-18 10:00:00', notes: 'Offered 7.0 LPA.' },
        { id: 'app_priyanka_phonepe', std: 'std_priyanka', job: 'job_phonepe_be', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_1', progress: 5, appliedAt: '2026-08-28 11:00:00', notes: 'Technical round scheduled.' },
        { id: 'app_tejas_infosys', std: 'std_tejas', job: 'job_infosys_se', status: 'SHORTLISTED', stage: 'CODING', progress: 4, appliedAt: '2026-09-02 10:00:00', notes: 'Coding assessment pending.' },
        { id: 'app_vandana_intel', std: 'std_vandana', job: 'job_intel_vlsi', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_1', progress: 5, appliedAt: '2026-08-26 15:00:00', notes: 'Silicon architecture interview.' },
        { id: 'app_rehan_adobe', std: 'std_rehan', job: 'job_adobe_swe', status: 'SHORTLISTED', stage: 'SHORTLISTED', progress: 3, appliedAt: '2026-09-06 14:00:00', notes: 'Profile under review by panel.' },
        { id: 'app_harini_google', std: 'std_harini', job: 'job_google_swe', status: 'SHORTLISTED', stage: 'CODING', progress: 4, appliedAt: '2026-08-20 11:00:00', notes: 'HackerRank test link sent.' },
        { id: 'app_fatima_amzn', std: 'std_fatima', job: 'job_amazon_da', status: 'INTERVIEW_SCHEDULED', stage: 'TECHNICAL_1', progress: 5, appliedAt: '2026-08-24 10:00:00', notes: 'SQL data warehousing interview.' }
    ];

    for (const a of applications) {
        // Build chronological stage history JSON
        const stageHistory = [
            { stage: 'APPLIED', title: 'Application Submitted', timestamp: a.appliedAt, status: 'COMPLETED', notes: 'Application recorded via JobMatch AI.' },
            { stage: 'SCREENING', title: 'Eligibility & Resume Screening', timestamp: '2026-08-22 14:00:00', status: a.progress >= 2 ? 'COMPLETED' : a.stage === 'SCREENING' ? 'IN_PROGRESS' : 'PENDING', notes: 'Academic verification and minimum CGPA criteria satisfied.' }
        ];

        if (a.progress >= 3) {
            stageHistory.push({ stage: 'SHORTLISTED', title: 'Shortlisting & Profile Review', timestamp: '2026-08-28 16:30:00', status: a.progress >= 3 ? 'COMPLETED' : 'IN_PROGRESS', notes: 'Shortlisted by company recruitment panel.' });
        }
        if (a.progress >= 4) {
            stageHistory.push({ stage: 'CODING', title: 'Online Coding Assessment', timestamp: '2026-09-04 18:00:00', status: a.progress >= 4 ? 'COMPLETED' : 'IN_PROGRESS', notes: 'Cleared automated assessment tests.' });
        }
        if (a.progress >= 5) {
            stageHistory.push({ stage: 'TECHNICAL_1', title: 'Technical Interview 1', timestamp: '2026-09-12 10:00:00', status: a.progress >= 6 ? 'COMPLETED' : a.stage === 'TECHNICAL_1' ? 'IN_PROGRESS' : 'SCHEDULED', notes: a.notes });
        }
        if (a.progress >= 6) {
            stageHistory.push({ stage: 'TECHNICAL_2', title: 'Technical Interview 2', timestamp: '2026-09-15 14:00:00', status: a.progress >= 7 ? 'COMPLETED' : 'IN_PROGRESS', notes: 'System architecture deep dive.' });
        }
        if (a.progress >= 7) {
            stageHistory.push({ stage: 'HR', title: 'HR & Cultural Alignment Round', timestamp: '2026-09-17 11:30:00', status: a.progress >= 8 ? 'COMPLETED' : 'IN_PROGRESS', notes: 'Leadership principles and compensation discussion.' });
        }
        if (a.progress >= 8) {
            stageHistory.push({ stage: 'OFFER', title: 'Offer Letter Issued', timestamp: '2026-09-18 16:00:00', status: 'COMPLETED', notes: a.notes });
        }

        const roundsConfig = [
            { id: 'APPLIED', label: 'Application Submitted' },
            { id: 'SCREENING', label: 'Eligibility Screening' },
            { id: 'SHORTLISTED', label: 'Profile Shortlist' },
            { id: 'CODING', label: 'Coding Assessment' },
            { id: 'TECHNICAL_1', label: 'Technical Round 1' },
            { id: 'TECHNICAL_2', label: 'Technical Round 2' },
            { id: 'HR', label: 'HR Interview' },
            { id: 'OFFER', label: 'Offer Received' }
        ];

        await db.run(`INSERT INTO placement_drive_applications 
            (id, student_id, job_opening_id, status, current_stage, stage_progress, stage_history, rounds_config, applied_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.id, a.std, a.job, a.status, a.stage, a.progress, JSON.stringify(stageHistory), JSON.stringify(roundsConfig), a.appliedAt, a.notes]
        );
    }

    // 7. Placement Interviews
    const interviews = [
        { id: 'int_subbu_google', appId: 'app_subbu_google', round: 'Technical Round 1 (Data Structures & Systems)', time: '18 Sep 2026, 10:00 AM IST', mode: 'Google Meet (Virtual)', link: 'https://meet.google.com/rvc-google-swe', interviewer: 'Senior SWE – Google Bengaluru', status: 'SCHEDULED', feedback: 'Focus on distributed caching, thread safety, and graph traversal.' },
        { id: 'int_subbu_tcs', appId: 'app_subbu_tcs', round: 'HR Discussion & Document Verification', time: '19 Sep 2026, 03:30 PM IST', mode: 'Microsoft Teams', link: 'https://teams.microsoft.com/rvc-tcs-hr', interviewer: 'Campus Lead – TCS Talent Acquisition', status: 'SCHEDULED', feedback: 'Bring academic certificates and ID proof.' },
        { id: 'int_siri_google', appId: 'app_siri_google', round: 'Online Coding Test Slot', time: '17 Sep 2026, 06:00 PM IST', mode: 'HackerRank Proctored', link: 'https://hackerrank.com/rvce-google-drive', interviewer: 'Automated Evaluation', status: 'SCHEDULED', feedback: '2 medium DSA questions, 90 mins.' },
        { id: 'int_rahul_cisco', appId: 'app_rahul_cisco', round: 'Technical Round 2 (Network Protocols & C++)', time: '20 Sep 2026, 11:00 AM IST', mode: 'Webex Virtual', link: 'https://cisco.webex.com/rvc-cisco-tech', interviewer: 'Principal Engineer – Cisco Security', status: 'SCHEDULED', feedback: 'Socket programming and memory management deep dive.' },
        { id: 'int_bhavana_oracle', appId: 'app_bhavana_oracle', round: 'Cloud Architecture Round 1', time: '21 Sep 2026, 02:00 PM IST', mode: 'Zoom', link: 'https://zoom.us/rvc-oracle-cloud', interviewer: 'Architect – Oracle Cloud', status: 'SCHEDULED', feedback: 'High availability, Terraform infrastructure.' }
    ];

    for (const inv of interviews) {
        await db.run(`INSERT INTO placement_interviews (id, application_id, round_name, scheduled_time, mode, meeting_link, interviewer_name, status, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [inv.id, inv.appId, inv.round, inv.time, inv.mode, inv.link, inv.interviewer, inv.status, inv.feedback]
        );
    }

    // 8. Placement Offers (14 Offers spanning multiple CTC brackets)
    const offers = [
        { id: 'off_subbu_amzn', appId: 'app_subbu_amzn', ctc: 24.5, title: 'Data Analyst I', date: '2027-07-01', decision: 'ACCEPTED' },
        { id: 'off_arjun_google', appId: 'app_arjun_google', ctc: 45.0, title: 'Software Engineer', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_arjun_uber', appId: 'app_arjun_uber', ctc: 48.0, title: 'Systems Engineer', date: '2026-08-01', decision: 'DECLINED' },
        { id: 'off_karthik_uber', appId: 'app_karthik_uber', ctc: 46.0, title: 'Systems Engineer', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_siri_phonepe', appId: 'app_siri_phonepe', ctc: 32.0, title: 'Backend Software Engineer', date: '2026-07-15', decision: 'ACCEPTED' },
        { id: 'off_bhavana_msft', appId: 'app_bhavana_msft', ctc: 30.0, title: 'Cloud Solutions Engineer', date: '2026-07-15', decision: 'ACCEPTED' },
        { id: 'off_eshaan_walmart', appId: 'app_eshaan_walmart', ctc: 38.0, title: 'Machine Learning Engineer', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_meghana_walmart', appId: 'app_meghana_walmart', ctc: 36.0, title: 'ML Associate', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_rahul_intel', appId: 'app_rahul_intel', ctc: 22.0, title: 'SoC Design Engineer', date: '2026-07-15', decision: 'ACCEPTED' },
        { id: 'off_utkarsh_cisco', appId: 'app_utkarsh_cisco', ctc: 22.0, title: 'Cloud & DevOps Engineer', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_divya_amzn', appId: 'app_divya_amzn', ctc: 24.0, title: 'Data Warehouse Specialist', date: '2026-07-15', decision: 'ACCEPTED' },
        { id: 'off_shruti_msft', appId: 'app_shruti_msft', ctc: 30.0, title: 'Software Engineer', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_ananya_deloitte', appId: 'app_ananya_deloitte', ctc: 14.0, title: 'Consulting Analyst', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_pooja_deloitte', appId: 'app_pooja_deloitte', ctc: 14.0, title: 'Data Consultant', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_vishnu_tcs', appId: 'app_vishnu_tcs', ctc: 8.5, title: 'Digital Associate', date: '2025-07-01', decision: 'ACCEPTED' },
        { id: 'off_karan_tcs', appId: 'app_karan_tcs', ctc: 7.5, title: 'Systems Associate', date: '2026-08-01', decision: 'ACCEPTED' },
        { id: 'off_nikhil_infosys', appId: 'app_nikhil_infosys', ctc: 7.0, title: 'Systems Engineer', date: '2026-08-01', decision: 'ACCEPTED' }
    ];

    for (const off of offers) {
        await db.run(`INSERT INTO placement_offers (id, application_id, offered_ctc, role_title, joining_date, student_decision) VALUES (?, ?, ?, ?, ?, ?)`,
            [off.id, off.appId, off.ctc, off.title, off.date, off.decision]
        );
    }

    // 9. Learning Modules & Enrollments
    const modules = [
        { id: 'mod_dsa', title: 'Mastering Advanced Data Structures & Algorithms', cat: 'Programming', level: 'Advanced', hours: 40, skills: ['Data Structures', 'Algorithms', 'C++', 'Python'], desc: 'Comprehensive coverage of dynamic programming, graphs, segment trees, and competitive coding optimization.', count: 320, compRate: 78.5 },
        { id: 'mod_sysdes', title: 'Enterprise System Design & Distributed Architecture', cat: 'Architecture', level: 'Advanced', hours: 35, skills: ['System Design', 'Distributed Systems', 'Kafka', 'Redis', 'Microservices'], desc: 'Architecting high-throughput systems, CAP theorem, consistent hashing, caching strategies, and database sharding.', count: 245, compRate: 64.2 },
        { id: 'mod_aws', title: 'Cloud Computing & AWS Cloud Solutions Architect', cat: 'Cloud', level: 'Intermediate', hours: 30, skills: ['AWS', 'Cloud', 'Docker', 'Kubernetes'], desc: 'Hands-on deployments across AWS EC2, S3, RDS, Lambda, ECS, and VPC networking infrastructure.', count: 290, compRate: 81.0 },
        { id: 'mod_fullstack', title: 'Modern Full Stack Web Engineering with React & Node', cat: 'Web Development', level: 'Intermediate', hours: 45, skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'REST APIs'], desc: 'End-to-end full stack architecture with state management, JWT authentication, and optimized SQL schemas.', count: 380, compRate: 85.4 },
        { id: 'mod_aiml', title: 'Applied Machine Learning & GenAI with PyTorch', cat: 'AI/ML', level: 'Advanced', hours: 50, skills: ['Python', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Transformers'], desc: 'Building, fine-tuning, and deploying modern machine learning and transformer models for production.', count: 210, compRate: 59.0 },
        { id: 'mod_aptitude', title: 'Campus Placement Aptitude & Logical Reasoning Mastery', cat: 'Aptitude', level: 'Beginner', hours: 25, skills: ['Problem Solving', 'Aptitude', 'Data Interpretation'], desc: 'Quantitative aptitude, logical reasoning, verbal ability, and speed calculation methods for tier-1 company rounds.', count: 480, compRate: 92.0 }
    ];

    for (const m of modules) {
        await db.run(`INSERT INTO learning_modules (id, title, category, level, duration_hours, target_skills, description, enrolled_count, completion_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [m.id, m.title, m.cat, m.level, m.hours, JSON.stringify(m.skills), m.desc, m.count, m.compRate]
        );
    }

    // Enrollments for Subbu
    await db.run(`INSERT INTO learning_enrollments (id, student_id, module_id, status, progress_pct, assigned_by) VALUES
        ('enr_subbu_1', 'std_subbu', 'mod_sysdes', 'IN_PROGRESS', 65, 'SELF'),
        ('enr_subbu_2', 'std_subbu', 'mod_aws', 'IN_PROGRESS', 80, 'TP_CELL'),
        ('enr_subbu_3', 'std_subbu', 'mod_dsa', 'COMPLETED', 100, 'SELF'),
        ('enr_subbu_4', 'std_subbu', 'mod_fullstack', 'COMPLETED', 100, 'SELF')
    `);

    // 10. System Notifications (Connected to real application updates)
    const notifications = [
        { id: 'notif_1', user_id: 'usr_subbu', role_target: 'STUDENT', title: 'Interview Scheduled', msg: 'Your Google Software Engineer Technical Round 1 is scheduled for 18 Sep 2026, 10:00 AM IST.', type: 'INTERVIEW', is_read: 0, link: 'student-applications' },
        { id: 'notif_2', user_id: 'usr_subbu', role_target: 'STUDENT', title: 'Application Shortlisted', msg: 'Congratulations! Your profile has been shortlisted for Microsoft SDE Intern drive.', type: 'DRIVE', is_read: 0, link: 'student-applications' },
        { id: 'notif_3', user_id: 'usr_subbu', role_target: 'STUDENT', title: 'Offer Letter Ready', msg: 'Amazon Data Analyst official offer letter is now available in your portal.', type: 'DRIVE', is_read: 1, link: 'student-applications' },
        { id: 'notif_4', user_id: null, role_target: 'T_AND_P', title: 'Google SWE Candidate Ranking Complete', msg: 'Agent 50 evaluated 40 eligible students and generated candidate rankings for Google Software Engineer drive.', type: 'SYSTEM', is_read: 0, link: 'tp-candidate-ranking' },
        { id: 'notif_5', user_id: null, role_target: 'T_AND_P', title: '14 New Campus Offers Confirmed', msg: 'Placement offers confirmed across Amazon, Google, Microsoft, Uber, PhonePe, and Walmart.', type: 'DRIVE', is_read: 0, link: 'tp-placements' },
        { id: 'notif_6', user_id: null, role_target: 'HOD', title: 'Department Placement Update', msg: 'CSE placement conversion reached 78.4% with highest CTC at 48 LPA (Uber).', type: 'INFO', is_read: 0, link: 'tp-dashboard' }
    ];

    for (const n of notifications) {
        await db.run(`INSERT INTO system_notifications (id, user_id, role_target, title, message, type, is_read, link_view) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [n.id, n.user_id, n.role_target, n.title, n.msg, n.type, n.is_read, n.link]
        );
    }

    // 11. Historical Signals for Agent 50
    await db.run(`INSERT INTO placement_historical_signals (id, company_name, role_category, successful_skill_weights, average_hired_cgpa, top_contributing_branch, interview_conversion_rate, sample_size) VALUES
        ('sig_google', 'Google', 'Software Engineering', '{"Python": 0.95, "Data Structures": 0.95, "Algorithms": 0.90, "System Design": 0.85, "PostgreSQL": 0.80}', 8.8, 'CSE', 0.78, 62),
        ('sig_msft', 'Microsoft', 'Software Engineering', '{"C++": 0.90, "Data Structures": 0.90, "Web Development": 0.85, "Algorithms": 0.85}', 8.4, 'CSE', 0.72, 75),
        ('sig_amzn', 'Amazon', 'Analytics & SDE', '{"SQL": 0.92, "Python": 0.88, "Data Visualization": 0.82, "Problem Solving": 0.90}', 8.1, 'ISE', 0.69, 88),
        ('sig_deloitte', 'Deloitte', 'Consulting & Tech', '{"Problem Solving": 0.90, "Analytics": 0.85, "Communication": 0.92, "SQL": 0.75}', 7.8, 'ECE', 0.81, 110)
    `);

    // 12. AgentOps Registration
    await db.run(`INSERT INTO agentops_agents (id, agent_code, name, domain, version, description, status) VALUES
        ('agent_50', 'AGENT_50', 'Job Matching & Placement Intelligence Agent', 'Placement Intelligence', '2.4.0', 'Deterministic & Semantically-Calibrated Multi-Factor Matching Engine', 'ACTIVE')
    `);

    await db.run(`INSERT INTO agentops_model_versions (id, agent_id, version_tag, model_type, weights_config, active) VALUES
        ('mv_240', 'agent_50', 'v2.4.0-hybrid', 'Multi-Factor Scorer with Historical Calibrations', '{"skill_weight": 0.40, "project_weight": 0.25, "role_interest_weight": 0.15, "location_weight": 0.10, "readiness_weight": 0.10}', 1)
    `);

    // 13. Institutional Events
    await db.run(`INSERT INTO institution_events (id, title, category, event_date, event_time, location, organizer, registered_count, mode) VALUES
        ('ev_1', 'Tech Career Guidance Session', 'Industry Talk', '15 Sep 2026', '10:00 AM - 11:30 AM', 'Auditorium', 'With Alumni', 120, 'Offline'),
        ('ev_2', 'Placement Preparation Workshop', 'Workshop', '20 Sep 2026', '2:00 PM - 5:00 PM', 'Seminar Hall', 'By T&P Cell', 85, 'Offline'),
        ('ev_3', 'Industry Interaction: Microsoft', 'Industry Talk', '28 Sep 2026', '11:00 AM - 1:00 PM', 'Main Block', 'Insights & Opportunities', 200, 'Offline'),
        ('ev_4', 'National Level Hackathon 2025', 'Hackathon', '05 Oct 2025', 'All Day', 'RVCE Campus', 'RVCE Coding Club', 320, 'Offline'),
        ('ev_5', 'Industry Networking Meet', 'Industry Talk', '12 Oct 2026', '10:00 AM - 12:00 PM', 'Convention Center', 'By Alumni Association', 150, 'Offline')
    `);

    console.log('✅ Comprehensive RV College of Engineering dataset seeded successfully!');
}

if (process.argv[1]?.endsWith('seed.js')) {
    seedDatabase(true).then(() => process.exit(0)).catch(err => {
        console.error('Seeding error:', err);
        process.exit(1);
    });
}
