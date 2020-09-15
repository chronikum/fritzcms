import { Schema } from "mongoose";
import mongoose from "mongoose";

/**
 * Post Schema
 */
var postSchema = new Schema({
  title: String,
  description: String,
  content: String,
  date: Date,
  postID: Number,
});

var PostModel = mongoose.model("PostModel", postSchema);

export default PostModel;
