const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const keys = require('../environments/keys');

// for sending emails
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

// setup how the emails will be sent
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: keys.sendgridApiKey
    }
}));

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: '',
      oldInput: {
        email: ''
      },
      cartTot: req.cartTot
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;

    // check for errors

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            oldInput: {
                email: email,
                username: username
            },
            cartTot: req.cartTot
          });
    }

    // if no errors then make new user

    bcrypt.hash(password, 12)
    .then(hashedPass => {
        const user = new User({
            email: email,
            username: username,
            password: hashedPass,
            cart: { items: [] },
            confirm: false
        });
        return user.save();
    })
    .then(result => {
        const userId = result._id.toString();
        res.redirect('/confirm');
        // send confirmation email
        return transporter.sendMail({
        to: email,
        from: keys.fromEmail,
        subject: 'Confirm your email address',
        html: `
            <head>
                <link rel="stylesheet" href="/css/auth.css">    
            </head>

            <style>
                main {
                padding: 50px;
                }
                body, html {
                height: 100%;
                margin: 0;
                }
                main {
                height: 100%;
                }
                .email-wrap {
                height: 100%;
                width: 100%;
                }
                .button-div {
                    width: 80px;
                    height: 40px;
                    background-color: red;
                }
                #link {
                    display:inline-block; 
                    padding:10px; 
                    background-color: #faae2b; 
                    color: #00473e; 
                    text-decoration:none;
                    border-radius: 4px;
                }
            </style>

            <body>
                <main>
                    <div class="email-wrap">
                        <h1>Please click below to confirm your email.</h1>
                        <a href="http://localhost:3001/confirm/${userId}" id="link">Confirm Email</a>
                    </div>
                </main>
            </body>
        `
        })
    })
    .catch(err => {
        // TODO: throw error here properly
        console.log(err);
    });
};

exports.getConfirm = (req, res, next) => {
    res.render('auth/confirm', {
        path: '/confirm',
        pageTitle: 'Confirm',
        cartTot: req.cartTot
    });
}

exports.getConfirmID = (req, res, next) => {
    const userId = req.params.id;
    User.findById(userId)
        .then(user => {
            user.confirm = true;
            return user.save();
        })
        .then(result => {
            res.render('auth/confirmed', {
                path: '/confirm',
                pageTitle: 'Confirm',
                cartTot: req.cartTot
            });
        })
        .catch(err => {
            console.log(err);
            //TODO: handle error
        })
}

exports.getLogin = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/cart');
    }
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: null,
      oldInput: {
        email: '',
        password: ''
      },
      cartTot: req.cartTot
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    // check for errors

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
            validationErrors: errors.array(),
            cartTot: req.cartTot
        });
    }

    // check if account exists. could also be a validator

    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        username: username,
                        password: password,
                    },
                    validationErrors: [],
                    cartTot: req.cartTot
                });
            }

            // check password

            bcrypt
            .compare(password, user.password)
            .then(result => {
                if (result) {
                    if (!user.confirm) {
                        return res.status(422).render('auth/verify', {
                            path: '/verify',
                            pageTitle: 'Verify',
                        });
                    }

                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    // if we don't use this save method, then it may redirect before the two above lines have completed
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/');
                    });
                }

                // if the password is incorrect

                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: [],
                    cartTot: req.cartTot
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

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    }); 
}