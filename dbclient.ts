import { SiteSettings } from "./interfaces/SiteSettings";
import { Post } from "./interfaces/Post";
import { User } from "./interfaces/User";
import UserModel from "./models/usermodel";
import shajs from "sha.js";
import PostModel from "./models/postmodel";
import SiteSettingsModel from "./models/sitesettingsmodel";
const crypto = require("crypto");

export class DBClient {
  constructor() {}

  /**
   * Register user with hashed password and incremented userId
   * @param username username which should be set for the new user
   * @param password password which should be set for the new user
   * @returns True, if success
   */
  async registerUser(
    username: string,
    password: string,
    isAdmin: boolean
  ): Promise<Boolean> {
    let userCount = await UserModel.countDocuments({});

    // Oh shit this is really crappy and not easy to read.
    // What it is doing: highestUser just returns the highest number of the user in the user collection.
    // If there is not any user, we will just set highestUser to zero
    var highestUser: number =
      userCount === 0
        ? 0
        : ((((await UserModel.find()
            .sort({ userId: -1 })
            .limit(1)) as User[])[0].userId || 0) as number);

    const hash = crypto.createHmac("sha256", password).digest("hex");
    console.log("Hashed Password:");
    console.log(hash);
    var newUser = new UserModel({
      username: username,
      userId: highestUser + 1,
      password: hash,
      isAdmin: isAdmin,
    });
    // Create user only if user doesn't exist already
    var existingUser = await UserModel.findOne({ userId: highestUser });
    if (existingUser) {
      console.log("User does already exist!");
      return false;
    } else {
      console.log("User will be created!");
      newUser.save(function (err, message) {
        console.log("Created user");
        if (err) return false;
      });
      return true;
    }
  }

  /**
   * Returns most recent posts
   *
   * @returns Promise<Post[]>
   */
  async getRecentPosts(): Promise<Post[]> {
    return new Promise(async function (resolve, reject) {
      var latestPosts = ((await PostModel.find()
        .sort({ date: -1 })
        .limit(5)) as unknown) as Post[];
      resolve(latestPosts);
    });
  }

  /**
   * Get site settings
   */
  async getSiteSettings(): Promise<SiteSettings> {
    return new Promise(async function (resolve, reject) {
      var siteSettings = ((await SiteSettingsModel.findOne()) as unknown) as SiteSettings;
      resolve(siteSettings);
    });
  }

  /**
   * Saves site settings
   * @param SiteSettings
   * @returns true if successfull
   */
  async setSiteSettings(siteSettings: SiteSettings): Promise<Boolean> {
    return new Promise(async function (resolve, reject) {
      SiteSettingsModel.deleteMany({}, function (err) {
        if (err) console.log(err);
      });
      let count = await SiteSettingsModel.count({});
      console.log("Count of models: " + count);
      var newSiteSettings = new SiteSettingsModel({
        siteTitle: siteSettings.siteTitle,
        siteDescription: siteSettings.siteDescription,
        siteSubTitle: siteSettings.siteSubtitle,
      });

      newSiteSettings.save(function (err, message) {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Get a post by its postID
   * @returns Post
   */
  async getPostbyPostID(postID: number): Promise<Post> {
    return new Promise(function (resolve, reject) {
      let post = (PostModel.findOne({ postID: postID }) as unknown) as Post;
      if (post) {
        resolve(post);
      } else {
        resolve({} as any);
      }
    });
  }

  /**
   * Delete post by ID
   * @param postID postID
   */
  async deletePost(postID: number): Promise<Boolean> {
    return new Promise(function (resolve, reject) {
      PostModel.findOneAndDelete({ postID: postID }, function (err, message) {
        if (err) {
          console.log("Error!");
          resolve(false);
        } else {
          console.log("Success");
          resolve(true);
        }
      });
    });
  }

  /**
   * Creates new Post
   *
   * @param Post
   * @returns true if successful
   */
  async createPost(post: Post): Promise<Boolean> {
    var incrementedPostCount = (await PostModel.countDocuments()) + 1;
    return new Promise(function (resolve, reject) {
      var postModel = new PostModel({
        title: post.title,
        description: post.description,
        content: post.content,
        date: post.date,
        postID: incrementedPostCount,
      });
      postModel.save(function (err, message) {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
