import axios from 'axios';
import { connectToDB } from '@/app/lib/mongodb';
import { getModelForKeyword } from '@/app/models/socialSchema'; // new schema

export async function POST(req) {
  const { query, maxResults = 5 } = await req.json();

  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }

  await connectToDB();

  // Use the new unified model for this query
  const SocialPostModel = getModelForKeyword(query);

  // Search for videos
  const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      q: query,
      part: 'snippet',
      maxResults,
      type: 'video',
    },
  });

  const videos = (searchRes.data.items || [])
    .filter(item => item.id.videoId)
    .map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnail: item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

  if (videos.length === 0) {
    return Response.json({ message: 'No videos found.' });
  }

  // Fetch video statistics
  const ids = videos.map(v => v.id).join(',');
  const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      id: ids,
      part: 'statistics',
    },
  });

  const statsMap = Object.fromEntries(
    statsRes.data.items.map(item => [item.id, item.statistics])
  );

  // Map to unified schema
  const docs = videos.map(vid => ({
    postId: vid.id,
    text: `${vid.title}\n\n${vid.description}`, // combine title + description for now
    createdAt: vid.publishedAt,
    likeCount: parseInt(statsMap[vid.id]?.likeCount || 0),
    commentCount: parseInt(statsMap[vid.id]?.commentCount || 0),
    shareCount: null, // YouTube API does not give share count
    viewCount: parseInt(statsMap[vid.id]?.viewCount || 0),
    mediaUrl: vid.thumbnail,
    postUrl: vid.videoUrl,
    query,
    analysis: {}, // Will fill later
  }));

  await Promise.all(
    docs.map(doc =>
      SocialPostModel.updateOne(
        { postId: doc.postId },
        { $set: doc },
        { upsert: true, runValidators: true }
      )
    )
  );

  return Response.json({ message: 'Videos saved successfully', count: docs.length });
}
