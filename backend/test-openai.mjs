import dotenv from 'dotenv';
dotenv.config();

const key = process.env.OPENAI_API_KEY;
console.log('Key starts with:', key?.slice(0, 10));

const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say hello in one word.' }],
    temperature: 0,
  }),
});

const data = await res.json();
if (!res.ok) {
  console.log('ERROR STATUS:', res.status);
  console.log('ERROR:', JSON.stringify(data, null, 2));
} else {
  console.log('SUCCESS:', data.choices?.[0]?.message?.content);
}
