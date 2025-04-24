import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';

import { VideoSchema,getModelForQuery } from '@/app/models/socialSchema.js'; // Adjust the import path as needed

export async function POST(req) {
  const { query, maxResults = 5 } = await req.json();
  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }
  await connectToDB();

  // Dynamic model for this query's collection
  const VideoModel = getModelForQuery({ schema: VideoSchema, query, prefix: 'videos' });

  // Search videos
  const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      key:       process.env.YOUTUBE_API_KEY,
      q:         query,
      part:      'snippet',
      maxResults,
      type:      'video',
    },
  });

  const videos = (searchRes.data.items || [])
    .filter(item => item.id.videoId)
    .map(item => ({
      id:           item.id.videoId,
      title:        item.snippet.title,
      description:  item.snippet.description || '',
      thumbnail:    item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt:  item.snippet.publishedAt,
      videoUrl:     `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

  // Fetch statistics
  const ids     = videos.map(v => v.id).join(',');
  const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: { key: process.env.YOUTUBE_API_KEY, id: ids, part: 'statistics' },
  });

  const statsMap = Object.fromEntries(
    statsRes.data.items.map(item => [item.id, item.statistics])
  );

  // Prepare and upsert docs into the query-specific collection
  const docs = videos.map(vid => ({
    ...vid,
    viewCount:    statsMap[vid.id]?.viewCount,
    likeCount:    statsMap[vid.id]?.likeCount,
    commentCount: statsMap[vid.id]?.commentCount,
    dislikeCount: statsMap[vid.id]?.dislikeCount,
  }));

  await Promise.all(
    docs.map(doc =>
      VideoModel.updateOne(
        { id: doc.id },
        { $set: doc },
        { upsert: true, runValidators: true }
      )
    )
  );

  return Response.json(docs);
}
