import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { Tweet } from '@/app/models/index';

export async function POST(req) {
  const { query, maxResults = 10, lang = 'en' } = await req.json();
  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }
  await connectToDB();

  // Fetch tweets with metrics and expansions
  const { data } = await axios.get(
    'https://api.twitter.com/2/tweets/search/recent',
    {
      headers: { Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}` },
      params: {
        query:        `${query} lang:${lang}`,
        max_results:  Math.max(10, Math.min(maxResults, 100)),
        'tweet.fields':'author_id,created_at,text,public_metrics',
        expansions:   'referenced_tweets.id,referenced_tweets.id.author_id',
      },
    }
  );

  const tweets   = data.data || [];
  const included = data.includes?.tweets || [];

  // Map original tweet metrics for retweets
  const origMap = Object.fromEntries(
    included.map(t => [t.id, t.public_metrics])
  );

  const results = await Promise.all(
    tweets.map(async (t) => {
      const isRetweet = t.referenced_tweets?.[0]?.type === 'retweeted';
      const metrics    = isRetweet
        ? origMap[t.referenced_tweets[0].id]
        : t.public_metrics;

      const doc = {
        query,
        id:           t.id,
        text:         t.text,
        tweetUrl:     `https://twitter.com/i/web/status/${t.id}`,
        createdAt:    t.created_at,
        authorId:     t.author_id,
        retweetCount: metrics.retweet_count,
        replyCount:   metrics.reply_count,
        likeCount:    metrics.like_count,
        quoteCount:   metrics.quote_count,
      };

      // Upsert into query-specific collection
      await Tweet.updateOne(
        { query, id: doc.id },
        { $set: doc },
        { upsert: true, runValidators: true }
      );
      return doc;
    })
  );

  return Response.json(results);
}
