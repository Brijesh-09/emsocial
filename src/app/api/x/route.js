import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { getModelForKeyword } from '@/app/models/socialSchema'; // new schema

export async function POST(req) {
  const { query, maxResults = 10, lang = 'en' } = await req.json();

  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }

  await connectToDB();

  // Use the new unified model for this query
  const SocialPostModel = getModelForKeyword(query);

  // Fetch tweets
  const { data } = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
    headers: { Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}` },
    params: {
      query: `${query} lang:${lang}`,
      max_results: Math.max(10, Math.min(maxResults, 100)),
      'tweet.fields': 'author_id,created_at,text,public_metrics',
      expansions: 'referenced_tweets.id,referenced_tweets.id.author_id',
    },
  });

  const tweets = data.data || [];
  const included = data.includes?.tweets || [];
  const origMap = Object.fromEntries(included.map(t => [t.id, t.public_metrics]));

  // Prepare mapped posts
  const docs = tweets.map(t => {
    const isRetweet = t.referenced_tweets?.[0]?.type === 'retweeted';
    const stats = isRetweet ? origMap[t.referenced_tweets[0].id] : t.public_metrics;
    return {
      postId: t.id,
      text: t.text,
      createdAt: t.created_at,
      likeCount: stats.like_count,
      commentCount: stats.reply_count,
      shareCount: stats.retweet_count,
      viewCount: null,  // tweets don't have viewCount unless you want to add impressions
      mediaUrl: null,   // tweets might have media, but not fetching here
      postUrl: `https://twitter.com/i/web/status/${t.id}`,
      query,
      analysis: {}, // Will be filled later maybe
    };
  });

  // Save to DB with upsert
  await Promise.all(
    docs.map(doc =>
      SocialPostModel.updateOne(
        { postId: doc.postId },
        { $set: doc },
        { upsert: true, runValidators: true }
      )
    )
  );

  return Response.json({ message: 'Tweets saved successfully', count: docs.length });
}
