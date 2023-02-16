const express = require('express');
const adminController = require('../controllers/admin');
const { check, body } = require('express-validator');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth , adminController.getAddProduct);

router.post('/add-product', 
    [
        body('title')
            .isString()
            .isLength({ min: 5, max: 60 })
            .trim()
            .withMessage('Please enter title between 5 and 30 characters.'),
        body('price')
            .isFloat(),
        body('quantity')
            .isInt({ min: 0 }),
        body('description')
            .trim()
            .isLength({ min: 5, max: 400 })
    ],
isAuth, adminController.postAddProduct)

router.get('/products', isAuth, adminController.getAdminProducts);

router.get('/sold-items', isAuth, adminController.getAdminSales);

// router.get('/sales', adminController.getSaleOrders);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', 
    [
        body('title')
            .isString()
            .isLength({ min: 5, max: 60 })
            .trim()
            .withMessage('Please enter title between 5 and 30 characters.'),
        body('price')
            .isFloat(),
        body('quantity')
            .isInt({ min: 0 })
            .custom((value, {req}) => {
                let hasNonNumber = !value.match(/^[0-9]+$/);
                if (hasNonNumber) {
                    throw new Error('Error!');
                }
                return true;
            }),
        body('description')
            .trim()
            .isLength({ min: 5, max: 400 })
    ],
isAuth, adminController.postEditProduct)

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router