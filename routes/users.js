const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const users = require("../controllers/users");

const passport = require("passport");
const { storeReturnTo } = require("../middleware");

router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.userRegister));
// router.get("/register", users.renderRegister);

// router.post("/register", catchAsync(users.userRegister));

// router.get("/login", users.userRenderLogin);

// router.post(
//   "/login",
//   storeReturnTo, // use the storeReturnTo middleware to save the returnTo value from session to res.locals
//   passport.authenticate("local", {
//     failureFlash: true,
//     failureRedirect: "/login",
//   }),
//   users.login
// );

router
  .route("/login")
  .get(users.userRenderLogin)
  .post(
    storeReturnTo, // use the storeReturnTo middleware to save the returnTo value from session to res.locals
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

router.get("/logout", users.logout);

module.exports = router;
