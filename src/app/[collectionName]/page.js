import mongoose from 'mongoose';
import { connectToDB } from '@/app/lib/mongodb';
import { notFound } from 'next/navigation';

//import AnalyseButton from '@/app/components/AnalyseButton';
import AnalyseButton from '@/components/AnalyseButton';



const YOUTUBE_FIELDS = [
  'id',
  '__v',
  'channelTitle',
  'commentCount',
  'createdAt',
  'description',
  'likeCount',
  'publishedAt',
  'thumbnail',
  'title',
  'updatedAt',
  'videoUrl',
  'viewCount',
];

const TWITTER_FIELDS = [
  'id',
  '__v',
  'authorId',
  'createdAt',
  'likeCount',
  'quoteCount',
  'replyCount',
  'retweetCount',
  'text',
  'tweetUrl',
  'updatedAt',
];

export default async function CollectionPage({ params }) {
  const { collectionName } = params;

  await connectToDB();
  const db = mongoose.connection.db;
  if (!db) return notFound();

  let docs;
  try {
    docs = await db.collection(collectionName).find().toArray();
  } catch {
    return notFound();
  }

  if (!docs.length) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Collection: {collectionName}</h1>

        <p className="text-gray-400">No documents found.</p>
      </div>
    );
  }

  const isYouTube = collectionName.startsWith('videos');
  const FIELDS_TO_SHOW = isYouTube ? YOUTUBE_FIELDS : TWITTER_FIELDS;

  return (
    <div className="p-6 bg-gray-950 text-white min-h-screen">
      <div className="flex items-center justify-between p-2">
        <h1 className="text-2xl font-bold mb-6 ">Collection: {collectionName}</h1>
        <AnalyseButton collectionName={collectionName} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 text-white border border-gray-700">
          <thead>
            <tr className="bg-gray-900">
              {FIELDS_TO_SHOW.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left font-medium uppercase text-xs border border-gray-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc._id} className="border-t border-gray-700 hover:bg-gray-700">
                {FIELDS_TO_SHOW.map((col) => {
                  let value = doc[col] ?? doc.analysis?.[col];

                  if (col === 'thumbnail' && typeof value === 'string') {
                    return (
                      <td key={col} className="px-4 py-2">
                        <img src={value} alt="thumbnail" className="w-20 h-auto rounded" />
                      </td>
                    );
                  }

                  if ((col === 'videoUrl' || col === 'tweetUrl') && typeof value === 'string') {
                    return (
                      <td key={col} className="px-4 py-2">
                        <a href={value} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                          Open Link
                        </a>
                      </td>
                    );
                  }

                  if (['createdAt', 'updatedAt', 'publishedAt'].includes(col) && value) {
                    value = new Date(value).toLocaleString();
                  }

                  return (
                    <td key={col} className="px-4 py-2 text-sm max-w-xs break-words">
                      {value?.toString() ?? ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
