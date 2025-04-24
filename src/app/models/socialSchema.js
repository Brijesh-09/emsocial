import mongoose from 'mongoose';

// Tweet schema with query indexing and compound unique index
export const TweetSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  text:         String,
  tweetUrl:     String,
  createdAt:    Date,
  authorId:     String,
  retweetCount: Number,
  replyCount:   Number,
  likeCount:    Number,
  quoteCount:   Number,
  // AI analysis placeholder
  analysis:     { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Base Video schema (raw + analysis)
export const VideoSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  title:        String,
  description:  String,
  thumbnail:    String,
  channelTitle: String,
  publishedAt:  Date,
  videoUrl:     String,
  viewCount:    Number,
  likeCount:    Number,
  commentCount: Number,
  dislikeCount: Number,
  // AI analysis placeholder
  analysis:     { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Helper to get/create a model bound to a collection named after the query
export function getModelForQuery({ schema, query, prefix }) {
  const name = `${prefix}_${query.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }
  // Use same string for collection name
  return mongoose.model(name, schema, name);
}
