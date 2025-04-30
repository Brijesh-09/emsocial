import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { getModelForKeyword } from '@/app/models/socialSchema';

export async function POST(_, { params }) {
  const keyword = params.query; // dynamic path param, e.g., /analyse/ipl

  if (!keyword) {
    return Response.json({ error: 'Missing keyword' }, { status: 400 });
  }

  await connectToDB();

  const Model = getModelForKeyword(keyword);
  const docs = await Model.find().lean();

  if (!docs.length) {
    return Response.json({ error: 'No data found for keyword' }, { status: 404 });
  }

  const prompt = `
Analyze the following social media data for "${keyword}" and return a compact JSON with:

- sentimentDistribution (positive, neutral, negative summaries)
- topEngagers (top 3 with reason)
- contentThemes (main topics with examples)
- keywordFrequency (top 10 keywords and counts)
- wordCountStats (average words, max words, min words)
- topPositiveWords (top 5 words)
- topNegativeWords (top 5 words)

No extra text. Only valid JSON.

Data:
\n\n
${docs.map(d => JSON.stringify(d)).join('\n')}
  `;

  const geminiRes = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const content = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

  let analysis;
  try {
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    analysis = JSON.parse(cleaned);
  } catch (e) {
    return Response.json({ error: 'Failed to parse Gemini response', raw: content }, { status: 500 });
  }

  await Promise.all(
    docs.map(d =>
      Model.updateOne({ _id: d._id }, { $set: { analysis } })
    )
  );

  return Response.json({ keyword, analysis });
}
