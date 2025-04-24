// src/app/api/collections/route.js
import mongoose from 'mongoose';
import { connectToDB } from '@/app/lib/mongodb';

export async function GET() {
  try {
    // 1. Ensure Mongoose is connected
    await connectToDB();

    // 2. Grab the native driver DB object
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No database connection available');
    }

    // 3. List collections via the native driver
    const cols = await db.listCollections().toArray();
    const collectionNames = cols.map(c => c.name);

    return Response.json({ collections: collectionNames });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return Response.json(
      { error: 'Failed to fetch collections', detail: error.message },
      { status: 500 }
    );
  }
}
