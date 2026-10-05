//Require all dependencies and modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocal = require('passport-local');
const User = require('./models/user');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoStore = require('connect-mongo');
const app = express();

if (process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

//Importing all routes
const campgroundRouter = require('./routes/campgrounds');
const reviewRouter = require('./routes/reviews');
const authRouter = require('./routes/auth');


//Connect to MongoDB
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';
try {
    mongoose.connect(dbUrl).then(() => {
        console.log("DATABASE CONNECTED");
    });
} catch (e) {
    console.log("ERROR CONNECTING TO MONGODB");
    console.log(e);
}

//Configure Express
app.set('view engine', "ejs");
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
const secret = process.env.SECRET || 'secret';
app.use(mongoSanitize());
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});

app.set('trust proxy', 1);
app.use(session({
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));
app.use(flash());
app.use(helmet());
//Allowed APIs
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dbh56ykfb/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.user;
    if (!req.isAuthenticated() && req.originalUrl !== '/login' && req.originalUrl !== '/register'){
        req.session.returnTo = req.originalUrl;
    }
    next();
});
//Home route
app.get('/', (req, res) => {
    res.render('home');
});

//Use routers
app.use('/campgrounds', campgroundRouter);
app.use('/campgrounds/:id/reviews', reviewRouter);
app.use('/', authRouter);

//404 error handler
app.all('*', (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
});

//Final error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh no! Something went wrong!"
    res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 3000;
//Confirm server is running
app.listen(port, () => {
    console.log(`LISTENING AT PORT ${port}`);
});
