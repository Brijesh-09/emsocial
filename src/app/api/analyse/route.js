import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { TweetSchema, getModelForQuery, VideoSchema } from '@/app/models/socialSchema';

export async function POST(req) {
  const { query, platform } = await req.json();
  if (!query || !platform || !['twitter','youtube'].includes(platform)) {
    return Response.json({ error: 'Missing or invalid query/platform' }, { status: 400 });
  }
  await connectToDB();

  const { schema, prefix } = platform === 'twitter'
    ? { schema: TweetSchema, prefix: 'tweets' }
    : { schema: VideoSchema, prefix: 'videos' };
  const Model = getModelForQuery({ schema, query, prefix });
  const docs  = await Model.find().lean();
  if (!docs.length) {
    return Response.json({ error: 'No data found for query' }, { status: 404 });
  }

  // build a single string payload (truncate if too long!)
  const prompt = `Analyze the following ${platform} data for "${query}". Return structured JSON with sentimentDistribution, topEngagers, contentThemes:\n\n` +
    docs.map(d => JSON.stringify(d)).join('\n');

  // ▶ Correct Gemini REST call
  const geminiRes = await axios.post(
    // use v1beta and a valid Gemini model name
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  // extract the generated text
  const content = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
  let analysis;
try {
  const cleaned = content
    .replace(/^```json\s*/i, '') // remove starting ```json
    .replace(/```$/, '')         // remove ending ```
    .trim();                     // remove any extra whitespace

  analysis = JSON.parse(cleaned);
} catch (e) {
  return Response.json({ error: 'Failed to parse Gemini response', raw: content }, { status: 500 });
}

  // write the analysis back into each doc
  await Promise.all(
    docs.map(d =>
      Model.updateOne({ _id: d._id }, { $set: { analysis } })
    )
  );

  return Response.json({ query, platform, analysis });
}
