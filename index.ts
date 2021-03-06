import { SiteSettings } from "./interfaces/SiteSettings";
import { DBClient } from "./dbclient";
import { Post } from "./interfaces/Post";
import express from "express";
import { Schema } from "mongoose";
import mongoose from "mongoose";
import passport from "passport";
import UserModel from "./models/usermodel";
var session = require("express-session");
var flash = require("connect-flash");
var bodyParser = require("body-parser");
var crypto = require("crypto");
var cors = require("cors");

import shajs from "sha.js";
import SystemlogModel from "./models/systemlogmodel";
import SiteSettingsModel from "./models/sitesettingsmodel";

var LocalStrategy = require("passport-local").Strategy;
let path = "mongodb://localhost:27017/database";
mongoose.connect(path, { useNewUrlParser: true });
var db = mongoose.connection;

let dbClient: DBClient = new DBClient();

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
      this.createUsers();
      this.createSiteSettings();
    } else {
      console.log("System was started already. Welcome back!");
      this.setupAuthentication();
    }
  }

  startServer() {
    const app = express();
    const port = 80; // default port to listen

    app.set("view engine", "ejs");
    app.use(cors({ credentials: true, origin: "http://localhost" }));

    app.use(express.json({ type: "*/*" }));
    app.use(
      session({
        // cookie: { maxAge: 10000 },
        secret: "ztziwFOAILEUDFGVAIWZ3IGULesdthgse5r",
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    /**
     * Index Site
     */
    app.get("/", async function (req, res) {
      // Recent posts
      let posts = await dbClient.getRecentPosts();
      // Site Settings
      var siteSettings = await dbClient.getSiteSettings();
      console.log(siteSettings);
      res.render("pages/index", {
        admin: req.isAuthenticated(),
        siteTitle: siteSettings.siteTitle,
        siteDescription: siteSettings.siteDescription,
        posts: posts,
      });
    });

    /**
     * Authenticate user with post request
     */
    app.get("/post", async function (req, res) {
      let postID = (req.query.id as any) || -1;
      let postbyID = (await dbClient.getPostbyPostID(postID)) || ({} as any);
      console.log(postbyID);
      res.render("pages/postDetailPage", {
        admin: req.isAuthenticated(),
        postTitle: postbyID.title || "Error 404",
        postDescription: postbyID.description || "This post does not exist",
        postContent: postbyID.content || "",
      });
    });

    /**
     * Authenticate user with post request
     */
    app.post("/doLogin", passport.authenticate("local"), function (req, res) {
      res.send({
        success: true,
      });
    });

    /**
     * Deauthenticate user with post request
     */
    app.get("/logout", checkAuthentication, function (req, res) {
      req.logOut();
      res.redirect("/");
    });

    /**
     * Dashboard
     */
    app.get("/dashboard", checkAuthentication, async function (req, res) {
      let posts = await dbClient.getRecentPosts();

      res.render("pages/dashboardPage", {
        admin: req.isAuthenticated(),
        siteTitle: "FritzCMS",
        siteDescription: "A CMS which fits your needs",
        posts: posts,
      });
    });

    /**
     * Create new post page
     */
    app.get("/create", checkAuthentication, function (req, res) {
      res.render("pages/createPostPage", {
        admin: req.isAuthenticated(),
      });
    });

    /**
     * Get recent posts
     */
    app.post("/DogetRecentPosts", checkAuthentication, async function (
      req,
      res
    ) {
      let posts = await dbClient.getRecentPosts();
      res.send(posts);
    });

    /**
     * Get Site Settings
     */
    app.post("/getSiteSettings", async function (req, res) {
      let siteSettings: SiteSettings = await dbClient.getSiteSettings();
    });

    /**
     * Deletes post by ID
     */
    app.post("/doDeletePost", checkAuthentication, async function (req, res) {
      let postID = (req as any).body.postID || -1;
      let success = await dbClient.deletePost(postID);
      res.send({
        success: success,
      });
    });

    /**
     * Set Site Settings
     */
    app.get("/editSiteSettings", checkAuthentication, async function (
      req,
      res
    ) {
      var siteSettings = await dbClient.getSiteSettings();
      res.render("pages/editSiteSettings", {
        admin: req.isAuthenticated(),
        siteTitle: siteSettings.siteTitle,
        siteDescription: siteSettings.siteDescription,
        siteSubtitle: siteSettings.siteSubtitle,
      });
    });

    /**
     * Set Site Settings
     */
    app.post("/doEeditSiteSettings", checkAuthentication, async function (
      req,
      res
    ) {
      let siteSettings: SiteSettings = {
        siteTitle: (req as any).body.siteTitle || "",
        siteDescription: (req as any).body.siteDescription || "",
        siteSubtitle: (req as any).body.siteSubtitle || "",
      };

      let success = await dbClient.setSiteSettings(siteSettings);
      res.send({
        success: success,
      });
    });

    /**
     * Get recent posts
     */
    app.get("/getRecentPosts", checkAuthentication, async function (req, res) {
      let posts = await dbClient.getRecentPosts();

      res.render("pages/createPostPage", {
        admin: req.isAuthenticated(),
      });
    });

    /**
     * Create new post page
     */
    app.post("/doCreate", checkAuthentication, async function (req, res) {
      let title = (req as any).body.title;
      let description = (req as any).body.description;
      let content = JSON.stringify((req as any).body.content);

      let post: Post = {
        title,
        description,
        content,
        date: +Date.now(),
      };

      let success = await dbClient.createPost(post);

      res.send({
        success: success,
      });
    });

    /**
     * Authenticate user with post request
     */
    app.get("/login", function (req, res) {
      res.render("pages/loginPage", {
        admin: req.isAuthenticated(),
      });
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
          const hashedPW = crypto.createHmac("sha256", password).digest("hex");
          if (user.password !== hashedPW) {
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
  }
  /**
   * SETUP
   * Create users
   */
  createUsers() {
    console.log(
      "IMPORTANT! YOUR RANDOM INITIAL GENERATED ADMIN PASSWORD WILL APPEAR HERE!"
    );
    let initialAdminPassword = crypto.randomBytes(20).toString("hex");
    var userpassword = initialAdminPassword;
    console.log("Your initial admin password is:");
    console.log(userpassword);
    dbClient.registerUser("admin", userpassword, true);
  }

  /**
   * SETUP
   * Create site settings
   */
  createSiteSettings() {
    var siteSettings = new SiteSettingsModel({
      siteTitle: "Fritz CMS",
      siteDescription: "Your site description",
      siteSubTitle: "Your site subtitle",
    });

    siteSettings.save(function (err, message) {
      console.log("Created site settings");
      if (err) return console.error(err);
    });
  }
}

/**
 * Checks authentication state
 */
function checkAuthentication(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    console.log("Authenticated!");
    next();
  } else {
    console.log("Authentication failed.");
    res.send(401);
  }
}

db.once("open", function () {
  let fritzCMS = new FritzCMS();
});

db.on("error", function () {
  console.error.bind(console, "connection error:");
});
