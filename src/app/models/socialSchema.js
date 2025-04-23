import mongoose from 'mongoose';

// Tweet schema with query indexing and compound unique index
const TweetSchema = new mongoose.Schema({
  query:     { type: String, required: true, index: true },
  id:        { type: String, required: true },
  text:      String,
  tweetUrl:  String,
  createdAt: Date,
  authorId:  String,
  retweetCount: Number,
  replyCount:   Number,
  likeCount:    Number,
  quoteCount:   Number,
}, { timestamps: true });
// Ensure uniqueness per query + tweet id
TweetSchema.index({ query: 1, id: 1 }, { unique: true });

// Video schema with query indexing and compound unique index
const VideoSchema = new mongoose.Schema({
  query:        { type: String, required: true, index: true },
  id:           { type: String, required: true },
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
}, { timestamps: true });
// Ensure uniqueness per query + video id
VideoSchema.index({ query: 1, id: 1 }, { unique: true });

export const Tweet = mongoose.models.Tweet || mongoose.model('Tweet', TweetSchema);
export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
