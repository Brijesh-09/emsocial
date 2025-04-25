import mongoose from 'mongoose';
import { connectToDB } from '@/app/lib/mongodb';

export async function GET(req, { params }) {
  const { collectionName } = params;

  try {
    await connectToDB();
    const db = mongoose.connection.db;

    if (!db) {
      return Response.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Only return the analysis field from each document
    const docs = await db.collection(collectionName).find({}, { projection: { analysis: 1 } }).toArray();

    const analysisData = docs.map((doc) => doc.analysis).filter(Boolean); // Remove undefined/nulls

    return Response.json({ analysis: analysisData });
  } catch (error) {
    console.error(`Error fetching analysis for ${collectionName}:`, error);
    return Response.json(
      { error: 'Failed to fetch analysis', detail: error.message },
      { status: 500 }
    );
  }
}
