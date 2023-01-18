const express = require('express');

// for validation
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', 
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .normalizeEmail(),
        body('password', 'Please enter a paswword with only numbers and text, and is at least 5 characters long.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
authController.postLogin);

router.post('/signup', 
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            // adding async custom validation to check if email exists already
            .custom((value, {req}) => {
                // if (value === 'test@test.com') {
                //     throw new Error('This email is forbidden');
                // }
                // return true;
                return User.findOne({ email: value }) // find the user that matches the email
                .then(userDoc => {
                    // if the user already exists then redirect them
                    if (userDoc) { 
                        return Promise.reject('Email exists already.')
                    }
                })
            })
            .normalizeEmail(),
        body(
            'password',
            // instead of adding .withMessage for each one, we add the mssage as a second param for default message
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
authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;