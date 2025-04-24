import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { TweetSchema, getModelForQuery } from '@/app/models/socialSchema.js'; // Adjust the import path as needed
export async function POST(req) {
  const { query, maxResults = 10, lang = 'en' } = await req.json();
  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }
  await connectToDB();

  // Dynamic model for this query's collection
  const TweetModel = getModelForQuery({ schema: TweetSchema, query, prefix: 'tweets' });

  // Fetch tweets with metrics
  const { data } = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
    headers: { Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}` },
    params: {
      query:       `${query} lang:${lang}`,
      max_results: Math.max(10, Math.min(maxResults, 100)),
      'tweet.fields': 'author_id,created_at,text,public_metrics',
      expansions:    'referenced_tweets.id,referenced_tweets.id.author_id',
    },
  });

  const tweets   = data.data || [];
  const included = data.includes?.tweets || [];
  const origMap  = Object.fromEntries(included.map(t => [t.id, t.public_metrics]));

  // Prepare and upsert docs into the query-specific collection
  const docs = tweets.map(t => {
    const isRetweet = t.referenced_tweets?.[0]?.type === 'retweeted';
    const stats     = isRetweet ? origMap[t.referenced_tweets[0].id] : t.public_metrics;
    return {
      id:           t.id,
      text:         t.text,
      tweetUrl:     `https://twitter.com/i/web/status/${t.id}`,
      createdAt:    t.created_at,
      authorId:     t.author_id,
      retweetCount: stats.retweet_count,
      replyCount:   stats.reply_count,
      likeCount:    stats.like_count,
      quoteCount:   stats.quote_count,
    };
  });

  await Promise.all(
    docs.map(doc =>
      TweetModel.updateOne(
        { id: doc.id },
        { $set: doc },
        { upsert: true, runValidators: true }
      )
    )
  );

  return Response.json(docs);
}
