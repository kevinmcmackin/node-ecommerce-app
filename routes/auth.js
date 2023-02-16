const express = require('express');

const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/signup', authController.getSignup);

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            // check if user exists already
            .custom((value, {req}) => {
                return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) { 
                        return Promise.reject('Email exists already.')
                    }
                })
            }),
        check('username', 'Username must be at least four characters long.')
            .trim()
            .isLength({ min: 4 })
            .custom((value, { req }) => {
                return User.findOne({ username: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Username already taken.')
                    }
                })
            }), 
        body(
            'password',
            'Please enter a paswword with only numbers and text, and is at least 5 characters long.'
            )
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match!');
                }
                return true;
            })
    ],
    authController.postSignup
);

router.get('/login', authController.getLogin);

router.post('/login', 
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .normalizeEmail(),
        body('password', 'Invalid email or password.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
authController.postLogin);

router.post('/logout', authController.postLogout);

module.exports = router