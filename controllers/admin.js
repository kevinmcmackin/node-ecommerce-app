const { validationResult } = require('express-validator');

const fileHelper = require('../util/file');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 9;

exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        product: {
            title: '',
            author: '',
            price: '',
            quantity: 1,
            description: ''
        },
        cartTot: req.cartTot,
        condition: null
    });
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const author = req.body.author;
    const image = req.file;
    const price = req.body.price;
    const quantity = req.body.quantity;
    const description = req.body.description;
    const condition = req.body.condition;

    // check if image passes image filter

    if (!image) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            hasError: true, // for dynamic styling, only true in this block.
            product: {
                title: title,
                author: author,
                price: price,
                quantity: quantity,
                description: description,
                condition: condition
            },
            errorMessage: 'Attached file is not an image',
            validationErrors: [],
            cartTot: req.cartTot,
            condition: condition
        });
    }

    // check for other errors

    const errors = validationResult(req); // 
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                author: author,
                price: price,
                quantity: quantity,
                description: description,
                condition: condition
            },
            // for displaying error message related to adding/editing product
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            cartTot: req.cartTot
        });
    }

    // for fetching image. reference to image in the DB
    const imageUrl = image.path;

    // create new product

    const product = new Product({
        title: title, 
        author: author,
        price: Number(price).toFixed(2), 
        quantity: quantity,
        description: description, 
        imageUrl: imageUrl, 
        userId: req.user, // here we dont have to specify _id as mongoose will do it for us
        condition: condition
    });

    product.save()
    .then(result => {
        console.log('Created product');
        res.redirect('/');
    })
    .catch(err => {
        console.log(err);
        // TODO: throw error
    }); 
};

exports.getAdminProducts = (req, res, next) => {

    const page = +req.query.page || 1;
    let totalItems;

    Product.find({ quantity: { $gt: 0 } ,  userId: req.user._id })
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find({ quantity: { $gt: 0 }, userId: req.user._id })
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
        res.render('admin/products', { 
            products: products,
            pageTitle: 'Admin Products', 
            path: '/admin/products',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            errorMessage: null,
            cartTot: req.cartTot,
            page: page,
            totalItems: totalItems
        }); 
    })
    .catch(err => {
        // TODO: throw error
    });
}

exports.getAdminSales = (req, res, next) => {

    const page = +req.query.page || 1;
    let totalItems;

    Product.find({ quantity: 0 })
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find({ quantity: 0 })
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
        res.render('admin/sales', { 
            products: products,
            pageTitle: 'Admin Products', 
            path: '/admin/sold-items',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            errorMessage: null,
            cartTot: req.cartTot,
            page: page,
            totalItems: totalItems
        }); 
    })
    .catch(err => {
        // TODO: throw error
    });
}

// exports.getSaleOrders = (req, res, next) => {
//     let ITEMS_PER_PAGE_ORDERS = 1;
//     let totalOrders;
//     const page = +req.query.page || 1;

//     Order.find({ "user.userId": req.user._id })
//     .countDocuments()
//     .then(numOrders => {
//         totalOrders = numOrders;
//         return Order.find({ "user.userId": req.user._id })
//             .skip((page - 1) * ITEMS_PER_PAGE_ORDERS)
//             .limit(ITEMS_PER_PAGE_ORDERS)
//             .populate({
//                 path: 'products.product.userId', 
//                 model: 'User'
//             })
//     })
//     .then(orders => {
//         res.render('admin/sale-orders', {
//             orders: orders,
//             pageTitle: 'Orders',
//             path: '/orders',
//             pages: totalOrders / ITEMS_PER_PAGE_ORDERS,
//             currentPage: page,
//             hasNextPage: ITEMS_PER_PAGE_ORDERS * page < totalOrders,
//             hasPreviousPage: page > 1,
//             nextPage: page + 1,
//             previousPage: page - 1,
//             lastPage: Math.ceil(totalOrders / ITEMS_PER_PAGE_ORDERS),
//             cartTot: req.cartTot,
//         })
//     })
//     .catch(err => {
//         console.log(err);
//         // TODO: properly throw error
//     })
// }

exports.getEditProduct = (req, res, next) => {
    const prodId = req.params.productId
    Product.findById(prodId)
        .then(product => {
            res.render('admin/edit-product', {
                product: product,
                pageTitle: 'Product Edit',
                path: 'admin/edit-product',
                errorMessage: null,
                validationErrors: [],
                cartTot: req.cartTot,
            });
        });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId
    const title = req.body.title;
    const author = req.body.author;
    const price = req.body.price;
    const description = req.body.description;
    const quantity = req.body.quantity;
    const image = req.file;
    const condition = req.body.condition;

    // check for errors

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Product Edit',
            path: 'admin/edit-product',
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            product: {
                _id: prodId,
                title: title,
                author: author,
                price: price,
                description: description,
                quantity: quantity,
                condition: condition
            },
            cartTot: req.cartTot
        })
    }

    // check if user allowed to edit

    Product.findById(prodId)
        .then(product => {

            if (req.user._id.toString() !== product.userId.toString()) {
                return res.redirect('/');
            }

            // user allowed to edit

            product.title = title;
            product.author = author;
            product.price = Number(price).toFixed(2);
            product.description = description;
            product.quantity = quantity;
            product.condition = condition;

            // check if user uploaded new image

            if (image) {
                fileHelper.deleteFile(product.imageUrl); // delete old image file
                product.imageUrl = image.path
            }

            return product.save()
                .then(result => {
                    res.redirect('/admin/products');
                })
        })
        .catch(err => {
            console.log(err);
        })
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                // TODO: throw error with next
                return res.redirect('/admin/products')
            }

            // make sure user deleting is user who made product

            if (product.userId.toString() !== req.user._id.toString()) {
                res.redirect('/');
            }

            // delete product

            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId });
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}