import { User } from "./interfaces/User";
import UserModel from "./models/usermodel";
import shajs from "sha.js";

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
      password: shajs("sha256").update(password).digest("hex"),
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
}
