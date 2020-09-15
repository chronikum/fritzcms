import { Schema } from "mongoose";
import mongoose from "mongoose";

var systemlogSchema = new Schema({
  message: String,
  timestamp: Number,
});

var SystemlogModel = mongoose.model("SystemlogModel", systemlogSchema);

export default SystemlogModel;
