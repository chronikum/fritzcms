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
      this.createUsers();
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

    app.get("/", function (req, res) {
      res.render("pages/index", {
        siteTitle: "FritzCMS",
        siteDescription: "A CMS which fits your needs",
      });
    });

    /**
     * Authenticate user with post request
     */
    app.get("/doLogin", passport.authenticate("local"), function (req, res) {
      res.redirect("dashboard");
    });

    /**
     * Authenticate user with post request
     */
    app.get("/dashboard", checkAuthentication, function (req, res) {
      res.send("Welcome user");
    });

    /**
     * Authenticate user with post request
     */
    app.get("/login", function (req, res) {
      res.render("pages/loginPage");
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
