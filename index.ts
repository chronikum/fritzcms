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
    app.get("/doLogin", passport.authenticate("local"), function (req, res) {
      res.redirect("dashboard");
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
     * Set Site Settings
     */
    app.get("/editSiteSettings", async function (req, res) {
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
    app.post("/doEeditSiteSettings", async function (req, res) {
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
      let content = (req as any).body.content;
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
      password: userpassword,
      isAdmin: true,
    });
    admin.save(function (err, message) {
      console.log("Created admin");
      if (err) return console.error(err);
    });
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
