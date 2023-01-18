const crypto = require('crypto');

const bcrypt = require('bcryptjs');

// for sending emails
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

// setup how the emails will be sent
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req,res,next) => {
    // doing this as otherwise box always renders 
    let message = req.flash('error'); 
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error'); 
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: message,
      oldInput: { // for populating form after login fails 
        email: '',
        password: '',
        confirmPassword: ''
      },
      validationErrors: []
    });
};

exports.postLogin = (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;

    // must retrieve the error(s) thrown by the validator(s) in the routes to display
    // these will be the errors related to the validator(s) such as password length, etc.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array()
        });
    }

    // now if the validators are good, we check to see if its even an actual account that exists
    // could make this a validator if you wanted to
    User.findOne({email: email})
        .then(user => {
            // if the email doesnt exist then they must try again
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    // we dont want to give away whether the password or the email was incorrect
                    validationErrors: []
                });
            }
            // now we need to check the pass using bcrypt
            bcrypt
            .compare(password, user.password)
            .then(result => { // result is a bool
                if (result) { // if they match
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    // if we dont use this save method, then it may redirect before the two above lines have completed
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/');
                    });
                }
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: []
                });
            })
            .catch(err => {
                console.log(err);
                res.redirect('/login');
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    // picking up any errors thrown by the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array()[0])
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            // we store the old input here to display it when login fails so that user input not lost
            oldInput: { 
                email: email, 
                password: password,
                confirmPassword: req.body.confirmPassword 
            },
            validationErrors: errors.array() // for conditional css formatting
          });
    }

    // encrypting pass
    bcrypt.hash(password, 12) // returns a promise so we can call then on it
    // we only want to run the following code if we are signing up
    .then(hashedPass => {
        // create a new user to sign them up if they don't already exists
        const user = new User({
            email: email,
            password: hashedPass,
            cart: { items: [] }
        });
        return user.save(); //save user and then redirect
    })
    .then(result => {
        res.redirect('/login');
        // sending signup confirmation email
        return transporter.sendMail({
            to: email,
            from: 'kevinmcmackin@outlook.com',
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>'
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postLogout = (req,res,next) => {
    req.session.destroy((err) => { // function called when session destroyed
        console.log(err);
        res.redirect('/');
    }); 
}

exports.getReset = (req,res,next) => {
    let message = req.flash('error'); 
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
}

// for resetting pass
exports.postReset = (req, res, next) => {
    // we get 32 random bytes 
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex'); // buffer stored as hex
        // find the email we are resetting pass for
        User.findOne({email: req.body.email})
        .then(user => {
            if (!user) {
                req.flash('error', 'No account with that email found.');
                return res.redirect('/reset');
            }
            // add token to user if found
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        // once added the token, we will send the pass reset email
        .then(result => {
            res.redirect('/')
            transporter.sendMail({
                to: req.body.email,
                from: 'kevinmcmackin@outlook.com',
                subject: 'Password reset',
                html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password</p>
                `
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    });
};

exports.getNewPassword = (req, res, next) => {
    // pulling the token from the request and making sure its equal to the token on the user. make sure valid as well
    const token = req.params.token; 
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        let message = req.flash('error'); 
        if (message.length > 0) {
            message = message[0];
        } else {
            message = null;
        }
        res.render('auth/new-pass', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken, 
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}