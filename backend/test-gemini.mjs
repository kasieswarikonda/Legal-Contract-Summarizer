import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log('Gemini key starts with:', key?.slice(0, 8));

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Say hello in one word.' }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 10 },
  }),
});

const data = await res.json();
if (!res.ok) {
  console.log('ERROR STATUS:', res.status);
  console.log('ERROR:', JSON.stringify(data, null, 2));
} else {
  console.log('SUCCESS:', data.candidates?.[0]?.content?.parts?.[0]?.text);
}
