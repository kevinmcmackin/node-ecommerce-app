const express = require('express'); // import express
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const https = require('https');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session); // for setting up the storing of sessions
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const notFoundController = require('./controllers/404.js');
const User = require('./models/user');

const MONGODBURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ropffer.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

// run express function
const app = express();

// configuring where we are storing the sessions
const store = new MongoDBStore({
    uri: MONGODBURI,
    collection: 'sessions'
});

const csrfProtection = csrf()

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

// controlling file storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
})

// make sure we only get valid image types
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true); // accept it if an image
    } else { // otherwise we reject it
        cb(null, false);
    }
}

app.set('view engine', 'ejs'); // set the default engine
app.set('views', 'views'); // where views to be found. views is default

// importing the routers from admin and shop
const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), 
    { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

// makes a middlewear that parses the body request for us. only parses certain types
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// when there is a request for a file, the request is forwarded to the public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images'))); // for servbing the images

// this is where we configure the session and the associated cookie 
// resave false means the session only sent if somehting changes.
app.use(
    session({
        secret: 'my secret', 
        resave: false, 
        saveUninitialized: false, 
        store: store // session data will be stored in here
    })
); 

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

// this way we are able to access the methods on the models. otherwise we only have the data related to the user
// then we will have the mongoose models to work with
app.use((req, res, next) => {
    // throw new Error('Sync dummy')
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id) // fetch using the session instead
    .then(user => {
        if (!user) {
            return next();
        }
        req.user = user
        next();
    })
    .catch(err => {
        next(new Error(err))
    });
});

// this is how to use the router from admin
// we add the /admin here instead of in each admit router path
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', notFoundController.get500);

// making 404 page
app.use(notFoundController.get404);

// error handling middlewear. express will go right to this when you call .next(<error>)
app.use((error, req, res, next) => {
    // res.redirect('/500');
    res.status(500).render('500', { 
        pageTitle: 'Error!', 
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
}); 

mongoose
    .connect(MONGODBURI)
    .then(result => {
        // https
        //     .createServer({ key: privateKey, cert: certificate }, app)
        //     .listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000);
    }).catch(err => {
        console.log(err);
    })