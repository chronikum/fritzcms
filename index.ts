import express from "express";
import { Schema } from "mongoose";
import mongoose from "mongoose";
import passport from "passport";
import UserModel from "./models/usermodel";
import shajs from "sha.js";
import SystemlogModel from "./models/systemlogmodel";

var LocalStrategy = require("passport-local").Strategy;
let path = "mongodb://localhost:27017/database";
mongoose.connect(path, { useNewUrlParser: true });
var db = mongoose.connection;

export default class FritzCMS {
  /**
   * Constructs an instance of FritzCMS
   */
  constructor() {
    this.startServer();
    this.checkSetup();
  }

  async checkSetup() {
    var setupNeeded = await SystemlogModel.count({});
    if (setupNeeded === 0) {
      this.setupAuthentication();
      var message = new SystemlogModel({
        message: "System ran setup process :) Everything is fine!",
        timestamp: Date.now(),
      });
      message.save(function (err, message) {
        if (err) return console.error(err);
      });
    } else {
      console.log("System was started already. Welcome back!");
    }
  }

  startServer() {
    const app = express();
    const port = 80; // default port to listen

    app.get("/", (req: any, res: any) => {
      res.send("<h1>hello</h1>");
    });

    // start the express server
    app.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  }

  /**
   * Setup passportjs Authentication
   */
  setupAuthentication() {
    console.log("Setting up local authentication strategy!");
    // Setup authentication strategies
    passport.use(
      new LocalStrategy(function (
        username: string,
        password: string,
        done: any
      ) {
        UserModel.findOne({ username: username }, function (
          err: any,
          user: any
        ) {
          console.log("Authenticating...");
          if (err) {
            console.log(err);
            return done(err);
          }
          if (!user) {
            console.log("User not found!");
            return done(null, false, { message: "Incorrect username." });
          }
          if (user.password !== password) {
            console.log("Password incorrect");
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        });
      })
    );
    passport.serializeUser(function (user: any, done) {
      console.log("serialize user: ", user);
      console.log("Authentication successful!");
      done(null, user["_id"]);
    });

    passport.deserializeUser(function (id, done) {
      UserModel.findOne({ _id: id })
        .then(function (user) {
          console.log("Found user!");
          console.log("Session restored");
          console.log(user);
          done(null, user);
        })
        .catch(function (err) {
          console.log("Something went wrong");
          done(err, null);
        });
    });
    this.createUsers();
  }
  /**
   * SETUP
   * Create users
   */
  createUsers() {
    var userpassword = "12345";
    var admin = new UserModel({
      username: "admin",
      userId: 2,
      password: shajs("sha256").update(userpassword).digest("hex"),
      isAdmin: true,
    });
    admin.save(function (err, message) {
      console.log("Created admin");
      if (err) return console.error(err);
    });
  }
}

db.once("open", function () {
  let fritzCMS = new FritzCMS();
});

db.on("error", function () {
  console.error.bind(console, "connection error:");
});
