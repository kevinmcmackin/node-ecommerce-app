const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');

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

        console.log(errors.array()[0].msg)

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
            cart: { items: [] }
        });
        return user.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        // TODO: throw error here properly
        console.log('error')
    });
};

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