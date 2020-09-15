import { Schema } from "mongoose";
import mongoose from "mongoose";

/**
 * User Schema
 */
var userSchema = new Schema({
  username: String,
  userId: Number,
  password: String,
  session: String,
  isAdmin: Boolean,
});

var UserModel = mongoose.model("UserModel", userSchema);

export default UserModel;
