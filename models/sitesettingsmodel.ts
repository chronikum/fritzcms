import { Schema } from "mongoose";
import mongoose from "mongoose";

/**
 * Post Schema
 */
var siteSettingsSchema = new Schema({
  siteTitle: String,
  siteDescription: String,
  siteSubtitle: String,
});

var SiteSettingsModel = mongoose.model("siteSettingsSchem", siteSettingsSchema);

export default SiteSettingsModel;
