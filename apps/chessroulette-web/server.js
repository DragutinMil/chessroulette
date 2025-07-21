
// server.js
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

app.listen(3001, () => {
  console.log('✅ Server running on http://localhost:3001');
});