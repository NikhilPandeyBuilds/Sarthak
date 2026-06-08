const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make POST requests
function post(url, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataStr.length
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`POST failed [${res.statusCode}]: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(dataStr);
    req.end();
  });
}

// Helper to make GET requests
function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`GET failed [${res.statusCode}]: ${responseBody}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

// Full simulation test
async function runTest() {
  console.log('\n======================================================');
  console.log('  SAKSHAT ENGINE: SIMULATING ADAPTIVE INTERVIEW PIPELINE  ');
  console.log('======================================================\n');

  try {
    // 1. Resume Ingestion
    console.log('[TEST 1] Ingesting candidate resume...');
    const resumeText = `
      Nikhil Sharma
      AI/ML Engineer
      Skills: Python, PyTorch, TensorFlow, Scikit-Learn, CNNs, Transformers, Docker
      Experience: Built an image classifier using PyTorch CNNs. Fine-tuned Llama models using PEFT/LoRA.
    `;
    const parseRes = await post(`${BASE_URL}/api/analyze`, {
      resumeText,
      fileName: 'nikhil_resume.txt'
    });
    console.log('  -> Resume successfully parsed and stored in DB.');
    console.log(`  -> Domain detected: ${parseRes.analysis.domain_specialization}`);
    console.log(`  -> Core skills: ${parseRes.analysis.skills.join(', ')}`);
    console.log(`  -> Resume ID: ${parseRes.resumeId}\n`);

    // 2. Start Interview Session
    console.log('[TEST 2] Booting interview chamber for NVIDIA (AI/ML)...');
    const startRes = await post(`${BASE_URL}/api/start`, {
      resumeId: parseRes.resumeId,
      company: 'NVIDIA',
      role: 'AI/ML Engineer',
      experienceLevel: 'Fresher'
    });
    const sessionId = startRes.sessionId;
    let currentQuestion = startRes.question;

    console.log('  -> Interview session successfully initialized in DB.');
    console.log(`  -> Session ID: ${sessionId}`);
    console.log(`  -> Initial Question: "${currentQuestion.question_text}"\n`);

    // Simulated answers mapping our adaptive tests
    const simulatedAnswers = [
      "I used CNNs (Convolutional Neural Networks) inside PyTorch to perform image feature extraction, pooling, and soft-max classification. I utilized cross-entropy loss and Adam optimizer to stabilize weights.",
      "Backpropagation works by calculating the gradient of the loss function with respect to each weight using the chain rule. We compute partial derivatives layer by layer, starting from the output backwards. The Jacobian matrix is used to map gradient dimensions across layers.",
      "Maximum Likelihood Estimation mathematically aims to maximize the likelihood function, meaning we choose parameters that make the observed data most probable. In contrast, MAP (Maximum A Posteriori) includes a prior distribution over parameters, using Bayes' theorem.",
      "Batch Normalization normalizes activations across the mini-batch dimension, which introduces dependency between batch samples and can fail with small batch sizes. Layer Normalization normalizes across features within a single sample, making it ideal for sequential recurrent architectures and Transformers.",
      "Yes, the self-attention formula is Softmax(QK^T / sqrt(d_k)) * V. The scaling factor sqrt(d_k) scales the dot products to prevent the softmax from entering regions with extremely small gradients when d_k is large.",
      "MLOps deployment involves serializing the model to ONNX, optimizing with NVIDIA TensorRT to enable FP16 quantization, and serving it in a containerized FastAPI service deployed on Docker."
    ];

    // 3. Adaptive loop (6 Questions)
    for (let qNum = 1; qNum <= 6; qNum++) {
      console.log(`\n------------------- [QUESTION ${qNum} / 6] -------------------`);
      console.log(`AI Question: "${currentQuestion.question_text}"`);
      console.log(`Competency: ${currentQuestion.competency} | Difficulty: ${currentQuestion.difficulty_level}/5 | Origin: ${currentQuestion.origin}`);
      
      const answer = simulatedAnswers[qNum - 1] || "I don't know the exact mathematical proof, but I have used it in training.";
      console.log(`Candidate Response: "${answer}"`);

      console.log('[SYS] Transmitting answer & evaluating...');
      const respondRes = await post(`${BASE_URL}/api/respond`, {
        sessionId,
        questionId: currentQuestion.id,
        answerText: answer,
        durationSeconds: 25
      });

      if (respondRes.isComplete) {
        console.log('\n[SUCCESS] Interview loop completed. Dossier generated.');
        break;
      } else {
        currentQuestion = respondRes.question;
        console.log(`[AI DECISION] Next Competency: ${currentQuestion.competency}`);
        console.log(`[AI LOG] ${currentQuestion.adaptation_log}`);
      }
    }

    // 4. Fetch and Verify Dossier Report
    console.log('\n[TEST 3] Retrieving final Hiring Dossier Report...');
    const reportData = await get(`${BASE_URL}/api/report/${sessionId}`);
    
    const { report, session, history } = reportData;
    console.log('  -> Report fetched successfully.');
    console.log('\n================== HIRING DOSSIER RESULT ==================');
    console.log(`Candidate Fit Indicators:`);
    console.log(`  - Technical Knowledge:  ${report.technical_score}%`);
    console.log(`  - Problem Solving:      ${report.problem_solving_score}%`);
    console.log(`  - Communication:        ${report.communication_score}%`);
    console.log(`  - Role Readiness:       ${report.role_readiness_score}%`);
    console.log(`  - Company Readiness:    ${report.company_readiness_score}%`);
    console.log(`\nCompetency Breakdown:`, report.competency_scores);
    console.log(`\nTop Strengths:`);
    report.strengths.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
    console.log(`\nTop Gaps:`);
    report.weaknesses.forEach((w, i) => console.log(`  ${i+1}. ${w}`));
    console.log(`\nCritical Failure Points:`);
    report.failure_points.forEach((f, i) => console.log(`  - ${f}`));
    console.log(`\nSkills Claims Analysis:`);
    report.claim_vs_demonstrated.forEach(c => {
      console.log(`  - ${c.claim}: demonstrated="${c.demonstrated}" [${c.match_status.toUpperCase()}]`);
    });
    console.log('===========================================================\n');
    console.log('✓ VERIFICATION TEST COMPLETED SUCCESSFULLY. ENGINE STACK IS OPERATIONAL!');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    process.exit(1);
  }
}

runTest();
