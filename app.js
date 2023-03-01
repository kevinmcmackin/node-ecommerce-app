const express = require('express'); // import express
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session); // for setting up the storing of sessions
const multer = require('multer'); // for storing files uploaded in forms
const flash = require('connect-flash');
const keys = require('./environments/keys');


const User = require('./models/user');

// url for mongoDB
const MONGODBURI = keys.mongoDB;

// set up the app
const app = express();

// config where sessions are stored
const store = new MongoDBStore({
    uri: MONGODBURI,
    collection: 'sessions'
});

// multer used for file uploads as part of forms
const fileStorage = multer.diskStorage({
    // where to store files
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    // naming convention for stored files
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
})

// make sure we only get valid image types as uploads
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true); // accept if an image
    } else { // otherwise reject it
        cb(null, false);
    }
}

// set the default engine
app.set('view engine', 'ejs'); 

// import routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// middlewear that parses the body request for us. only parses certain types
app.use(bodyParser.urlencoded({ extended: false }));

// using multer for file uploads
app.use(
    multer({ 
        storage: fileStorage, // where to store, defined above
        fileFilter: fileFilter // make sure only get certain file types
    })
    .single('image') // only handle the first file with field name 'image' in the incoming req
);

// so that it knows to look for static files, such as css or js, in the public folder
app.use(express.static(path.join(__dirname, 'public')));

// for serving the images
app.use('/images', express.static(path.join(__dirname, 'images'))); 

// this is where we configure the session and the associated cookie 
app.use(
    session({ // config express session middleware
        secret: keys.secret, // signs the session ID cookie
        resave: false, // don't auto write to the session store every time theres a req
        saveUninitialized: false, // if a session is created but no data added, don't save session
        store: store // where to store sessions
    })
);

// 
app.use(flash());

// locally set of the res whether the user is logged in or not
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next(); // pass req to next middleware
});

// TODO: can remove this and just use req.session.user everywhere
// to get the methods in the 'user' model. can also access info related to user, such as when adding a product we need the user id
app.use((req, res, next) => {
    // we add 'user' to the session when we post login
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if (!user) {
            return next();
        }
        req.user = user
        req.cartTot = req.user.getCartTot();
        next();
    })
    .catch(err => {
        next(new Error(err))
    });
});

// to parse the data for updating the cart amount
app.use(express.json())

// telling express to use the shopRoutes middleware function for all incoming requests that match the paths within it 
// express checks in the order this middleware is mounted
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

mongoose
    .connect(MONGODBURI)
    .then(result => {
        app.listen(3001);
    }).catch(err => {
        console.log(err);
    })
