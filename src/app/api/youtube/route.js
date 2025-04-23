import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';

import { Video } from '@/app/models/socialSchema.js'; // Adjust the import path as needed

export async function POST(req) {
  await connectToDB();
  const { query, maxResults = 5 } = await req.json();
  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }

  // 1️⃣ Search for videos
  const searchRes = await axios.get(
    'https://www.googleapis.com/youtube/v3/search',
    {
      params: {
        key:       process.env.YOUTUBE_API_KEY,
        q:         query,
        part:      'snippet',
        maxResults,
        type:      'video',
      },
    }
  );

  const videos = (searchRes.data.items || [])
    .filter(item => item.id.videoId)
    .map(item => ({
      query,
      id:           item.id.videoId,
      title:        item.snippet.title,
      description:  item.snippet.description || '',
      thumbnail:    item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt:  item.snippet.publishedAt,
      videoUrl:     `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

  // 2️⃣ Fetch statistics
  const ids = videos.map(v => v.id).join(',');
  const statsRes = await axios.get(
    'https://www.googleapis.com/youtube/v3/videos',
    {
      params: {
        key:  process.env.YOUTUBE_API_KEY,
        id:   ids,
        part: 'statistics',
      },
    }
  );

  const statsMap = Object.fromEntries(
    statsRes.data.items.map(item => [
      item.id,
      {
        viewCount:    item.statistics.viewCount,
        likeCount:    item.statistics.likeCount,
        commentCount: item.statistics.commentCount,
        dislikeCount: item.statistics.dislikeCount,
      }
    ])
  );

  // 3️⃣ Merge and upsert
  const results = await Promise.all(
    videos.map(async (vid) => {
      const stats = statsMap[vid.id] || {};
      const doc   = { ...vid, ...stats };

      await Video.updateOne(
        { query, id: doc.id },
        { $set: doc },
        { upsert: true, runValidators: true }
      );
      return doc;
    })
  );

  return Response.json(results);
  
}