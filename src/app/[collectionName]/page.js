import mongoose from 'mongoose';
import { connectToDB } from '@/app/lib/mongodb';
import { notFound } from 'next/navigation';
import AnalyseButton from '@/components/AnalyseButton';

const FIELDS_TO_SHOW = [
  'postId',
  'commentCount',
  'createdAt',
  'likeCount',
  'mediaUrl',
  'postUrl',
  'shareCount',
  'text',
  'viewCount',
];

export default async function CollectionPage({ params }) {
  const { collectionName } = params;

  await connectToDB();
  const db = mongoose.connection.db;
  if (!db) return notFound();

  let docs;
  try {
    docs = await db.collection(collectionName).find().toArray();
  } catch (err) {
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

  const analysis = docs[0]?.analysis || null;

  return (
    <div className="p-6 bg-gray-950 text-white min-h-screen">
      <div className="flex items-center justify-between p-2">
        <h1 className="text-2xl font-bold mb-6">Collection: {collectionName}</h1>
        <AnalyseButton collectionName={collectionName} />
      </div>

      <div className="overflow-x-auto mb-10">
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

                  if (col === 'mediaUrl' && typeof value === 'string') {
                    const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(value);
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(value);

                    return (
                      <td key={col} className="px-4 py-2">
                        {isImage ? (
                          <img src={value} alt="media" className="w-24 h-auto rounded" />
                        ) : isVideo ? (
                          <video src={value} controls className="w-32 h-auto rounded" />
                        ) : (
                          <a
                            href={value}
                            className="text-blue-400 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Media
                          </a>
                        )}
                      </td>
                    );
                  }

                  if (col === 'postUrl' && typeof value === 'string') {
                    return (
                      <td key={col} className="px-4 py-2 max-w-xs break-words">
                        <a
                          href={value}
                          className="text-blue-400 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {value.length > 50 ? value.slice(0, 50) + '...' : value}
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

      {/* Analysis Section */}
      {analysis && (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 space-y-6">
          <h2 className="text-xl font-bold mb-4">📊 Analysis Report</h2>

          <div>
            <h3 className="font-semibold text-lg">💬 Sentiment Distribution</h3>
            <ul className="list-disc list-inside text-sm">
              <li><strong>Positive:</strong> {analysis.sentimentDistribution?.positive}</li>
              <li><strong>Neutral:</strong> {analysis.sentimentDistribution?.neutral}</li>
              <li><strong>Negative:</strong> {analysis.sentimentDistribution?.negative}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg">🔝 Top Engagers</h3>
            <ul className="list-disc list-inside text-sm">
              {analysis.topEngagers?.map((engager) => (
                <li key={engager.postId}>
                  <strong>{engager.postId}:</strong> {engager.reason}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg">🎯 Content Themes</h3>
            <ul className="list-disc ml-6 text-sm">
              {Object.entries(analysis.contentThemes || {}).map(([theme, items]) => (
                <li key={theme}>
                  <strong>{theme}:</strong>{' '}
                  {Array.isArray(items)
                    ? items.join(', ')
                    : typeof items === 'object'
                      ? JSON.stringify(items)
                      : String(items)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg">🔍 Keyword Frequency</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(analysis.keywordFrequency || {}).map(([kw, val]) => (
                <li key={kw}>
                  <strong>{kw}</strong>: {val?.$numberInt ?? val}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg">📐 Word Count Statistics</h3>
            <ul className="list-disc list-inside text-sm">
              <li>Average Words: {analysis.wordCountStats?.averageWords?.$numberDouble ?? analysis.wordCountStats?.averageWords}</li>
              <li>Max Words: {analysis.wordCountStats?.maxWords?.$numberInt ?? analysis.wordCountStats?.maxWords}</li>
              <li>Min Words: {analysis.wordCountStats?.minWords?.$numberInt ?? analysis.wordCountStats?.minWords}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg">✅ Top Positive Words</h3>
            <p className="text-sm">{analysis.topPositiveWords?.join(', ')}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">❌ Top Negative Words</h3>
            <p className="text-sm">{analysis.topNegativeWords?.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
