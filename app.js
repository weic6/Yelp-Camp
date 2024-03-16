if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose"); //will use Mongoose to interact with a MongoDB
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const { campgroundSchema, reviewSchema } = require("./schemas.js");
// const { campgroundSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError"); //Colts just add this, dont know why
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";

const MongoDBStore = require("connect-mongo")(session);
// "mongodb://localhost:27017/yelp-camp";
mongoose.connect(dbUrl, {
  //   useNewUrlParser: true,
  //   useCreateIndex: true,
  //   useUnifiedTopology: true,
  //   useFindAndModify: false,
  //
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});
const app = express();
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //specifies that the views (EJS templates) should be placed in a directory named "views" located in the same directory as the application script.

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method")); //HTTP forms on web pages only support GET and POST methods. to support PUT, PATCH, and DELETE methods (which are typically used to update and delete resources as per RESTful practices), the methodOverride middleware is used. The string _method passed to methodOverride() is the name of the parameter to look for in the request body. This means you're telling methodOverride to look for a request body field named _method to determine the actual HTTP method to be used. You could use a different name if you preferred, but _method is a common convention.
//e.g.<form action="/your-route?_method=DELETE" method="POST">. when this form is submitted, the methodOverride middleware will recognize the _method parameter and do the DELETE and override the POST method
app.use(express.static(path.join(__dirname, "public")));

const secret = process.env.SECRET || "thisshouldbeabettersecret!";
const store = new MongoDBStore({
  url: dbUrl,
  secret: secret,
  touchAfter: 24 * 60 * 60, //second
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store: store,
  secret: secret, //only for development environment, in production environ, need to use a random long one
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expres: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7, //milisecond
  },
  // store: // By default, Express session uses in-memory storage, but this isn't suitable for production environments due to memory leaks and lack of persistence.
};
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user; //all templates can use variable currentUser
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/fakeUser", async (req, res) => {
  const user = new User({
    email: "coltttttt@gmail.com",
    username: "coltttttt",
  });
  const newUser = await User.register(user, "chicken");
  res.send(newUser);
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home"); //Express uses the EJS view engine to look for a file named 'home.ejs' in the 'views' directory.
});

// app.all("*", (req, res, next) => {
//   next(new ExpressError("Page Not Found", 404));
// });

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`serving on port ${port}`);
});
