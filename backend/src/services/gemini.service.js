import config from '../config/env.js';

const GEMINI_MODEL = 'gemini-3.5-flash-lite';

function geminiUrl() {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.geminiApiKey}`;
}

async function callGemini(prompt) {
  console.log('Gemini model:', GEMINI_MODEL);
  console.log('Prompt length:', prompt.length);

  const res = await fetch(geminiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
    }),
  });

  console.log('Gemini status:', res.status);

  if (!res.ok) {
    const err = await res.text();
    console.log('Gemini error:', err);
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();

  console.log('Gemini response:', JSON.stringify(data, null, 2));

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function extractJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);

  const text = fenced
    ? fenced[1].trim()
    : raw.trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in AI response.');
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    console.error('Failed to parse Gemini JSON:', text);
    throw new Error('Gemini returned invalid JSON.');
  }
}

/*
  Convert AI-detected risk levels into a deterministic numerical score.

  low      = 15
  medium   = 40
  high     = 70
  critical = 100

  The final score is the average severity of all detected risks.
*/
function calculateRiskScore(risks) {
  if (!Array.isArray(risks) || risks.length === 0) {
    return 0;
  }

  const severityScores = {
    low: 15,
    medium: 40,
    high: 70,
    critical: 100,
  };

  const total = risks.reduce((sum, risk) => {
    const level = String(risk.level || '').toLowerCase();

    return sum + (severityScores[level] || 0);
  }, 0);

  return Math.min(
    100,
    Math.round(total / risks.length)
  );
}

export async function analyzeContract(extractedText) {
  const prompt = `You are a legal contract analyst.

Analyze the contract below and respond ONLY with a valid JSON object.

Do not use markdown.
Do not include explanations outside the JSON.
Do not wrap the response in code fences.

Required JSON structure:

{
  "summary": "3-5 sentence plain-English summary of the contract.",
  "importantClauses": [
    {
      "title": "Clause name",
      "content": "Exact or accurately paraphrased clause text",
      "explanation": "Plain-English explanation of what the clause means"
    }
  ],
  "risks": [
    {
      "clause": "Clause name",
      "level": "low",
      "explanation": "Why this clause creates a contractual risk"
    }
  ]
}

Rules:

1. The "level" field must be exactly one of:
   - low
   - medium
   - high
   - critical

2. Identify at least 3 important clauses.

3. Identify significant contractual risks that are actually supported by the contract.

4. Do not invent clauses, obligations, penalties, rights, or facts that are not present in the contract.

5. For every risk, explain why the specific clause may create a risk.

6. Consider areas such as:
   - payment obligations
   - termination
   - intellectual property
   - confidentiality
   - limitation of liability
   - indemnification
   - warranties
   - penalties
   - delays
   - dispute resolution
   - governing law
   - data protection
   - security obligations
   - renewal
   - restrictive obligations

7. Use "critical" only when the contractual risk is exceptionally serious.

8. Use "high" when the clause could create substantial financial, legal, operational, or business exposure.

9. Use "medium" when the clause creates a meaningful but manageable concern.

10. Use "low" when the concern is relatively minor.

11. DO NOT calculate a numerical risk score.

12. DO NOT include a "riskScore" field.

CONTRACT TEXT:

${extractedText.slice(0, 30000)}`;

  const raw = await callGemini(prompt);

  const result = extractJson(raw);

  /*
    Validate the risks returned by Gemini before calculating the score.
  */
  if (!Array.isArray(result.risks)) {
    result.risks = [];
  }

  result.risks = result.risks
    .filter((risk) => risk && typeof risk === 'object')
    .map((risk) => ({
      clause: String(risk.clause || 'Unknown clause'),
      level: ['low', 'medium', 'high', 'critical'].includes(
        String(risk.level || '').toLowerCase()
      )
        ? String(risk.level).toLowerCase()
        : 'medium',
      explanation: String(
        risk.explanation || 'No explanation provided.'
      ),
    }));

  /*
    The backend calculates the numerical score.
    Gemini does NOT control this number.
  */
  result.riskScore = calculateRiskScore(result.risks);

  /*
    Make sure important clauses is always an array.
  */
  if (!Array.isArray(result.importantClauses)) {
    result.importantClauses = [];
  }

  /*
    Make sure summary is always a string.
  */
  if (typeof result.summary !== 'string') {
    result.summary = '';
  }

  console.log('Calculated risk score:', result.riskScore);

  return result;
}

export async function askQuestion(extractedText, question) {
  const prompt = `You are a legal assistant.

Answer the following question about the contract in plain English.

Be concise, clear, and base your answer only on the contract.

If the contract does not contain enough information to answer the question, clearly say that the contract does not provide enough information.

QUESTION:

${question}

CONTRACT TEXT:

${extractedText.slice(0, 30000)}`;

  return callGemini(prompt);
}