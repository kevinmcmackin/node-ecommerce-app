const path = require('path');

const express = require('express');

const { check, body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// both actually start with admin because of filter in app.js
// req goes from left to right so we needto put isAuth first
router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

// post only triggers for post requests, not also get
router.post('/add-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 400 })
        .trim()
],
isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 400 })
        .trim()
],
isAuth, adminController.postEditProduct);

// could use any word here. we just choose delete for clarity
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;

