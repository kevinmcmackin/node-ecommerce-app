const mongoose = require('mongoose');

const fileHelper = require('../util/file');

const { validationResult } = require('express-validator/check');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) { // if doesn't pass filter
        console.log('fuck')
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true, // for dynamic styling, only true in this block.
            product: {
                title: title,
                price: price,
                description: description
            },
            // for displaying error message related to adding/editing product
            errorMessage: 'Attached file is not an image',
            validationErrors: []
        });
    }

    // collect the errors from the validators in the routes file
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true, // for dynamic styling, only true in this block.
            product: {
                title: title,
                imageUrl: imageUrl,
                price: price,
                description: description
            },
            // for displaying error message related to adding/editing product
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    // for fetching image. must have a reference to it in the DB
    const imageUrl = image.path;

    const product = new Product({
        title: title, 
        price: price, 
        description: description, 
        imageUrl: imageUrl, 
        userId: req.user // here we dont have to specift _id as mongoose will do it for us
    });
    product
    .save() // provided by mongoose. we also get 'then' and 'catch' despite not getting promise
    .then(result => {
        console.log('created product');
        res.redirect('/admin/products')
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }); 
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        // if no product, redirect
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true, // for dynamic styling, only true in this block.
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId
            },
            // for displaying error message related to adding/editing product
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
    
    Product.findById(prodId).then(product => {
        // make sure user can't edit if they didn't create product
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDesc;
        if (image) { // if the user is uploading a new image. if not then it is not updated
            fileHelper.deleteFile(product.imageUrl); // to delete the image if user overriding with new one
            product.imageUrl = image.path;
        }
        return product.save() // mongoose method. will just update the product
        .then(result => {
            res.redirect('/admin/products');
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProducts = (req,res,next) => {
    // we only want to render products created by logged in user
    Product.find({userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name') // populate field with all detail information and not just the ID
    .then((products) => {
        console.log(products)
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl); // delete file from storage
            return Product.deleteOne({ _id: prodId, userId: req.user._id }) // delete the product if the user who created matches user deleting
        })
        .then(() => {
            console.log('Destroyed product');
            res.status(200).json({message: 'Success!'});
        })
        .catch(err => {
            res.status(500).json({message: 'Deleting product failed!'});    
        });};