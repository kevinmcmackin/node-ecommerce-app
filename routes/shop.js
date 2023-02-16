const express = require('express');
const router = express.Router();

const isAuth = require('../middleware/is-auth');

const shopController = require('../controllers/shop');

router.get('/', shopController.getIndex); // redirect to shop

router.get('/shop', shopController.getShop);

router.get('/shop/:productId', shopController.getProduct);

router.get('/cart', shopController.getCart);

router.post('/cart', isAuth, shopController.addToCart);

router.post('/cart-delete-item', isAuth, shopController.deleteItem);

router.post('/update-amount', isAuth, shopController.postUpdate);

router.post('/cart-add-amount', isAuth, shopController.addAmount);

router.post('/cart-minus-amount', isAuth, shopController.minusAmount);

router.post('/create-order', isAuth, shopController.createOrder);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/users/:userId', shopController.getUserPage);

// router.get('/orders-confirm', shopController.getOrderConfirm);

router.get('/orders/:orderId', shopController.getInvoice);

module.exports = router