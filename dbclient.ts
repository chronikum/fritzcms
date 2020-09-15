import { Post } from "./interfaces/Post";
import { User } from "./interfaces/User";
import UserModel from "./models/usermodel";
import shajs from "sha.js";
import PostModel from "./models/postmodel";

export class DBClient {
  constructor() {}

  /**
   * Register user with hashed password and incremented userId
   * @param username username which should be set for the new user
   * @param password password which should be set for the new user
   * @returns True, if success
   */
  async registerUser(username: string, password: string): Promise<Boolean> {
    var highestUsers = (await UserModel.find()
      .sort({ userId: -1 })
      .limit(1)) as User[];
    var toIncrement: number = highestUsers[0].userId as number;
    toIncrement++;
    var newUser = new UserModel({
      username: username,
      userId: toIncrement,
      password: password,
      isAdmin: false,
    });
    // Create user only if user doesn't exist already
    var existingUser = await UserModel.findOne({ username: username });
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
   * Creates new Post
   *
   * @param Post
   * @returns true if successful
   */
  async createPost(post: Post): Promise<Boolean> {
    return new Promise(function (resolve, reject) {
      var postModel = new PostModel({
        title: post.title,
        description: post.description,
        date: post.date,
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
