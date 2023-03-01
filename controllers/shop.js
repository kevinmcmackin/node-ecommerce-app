const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_Hrs6SAopgFPF0bZXSN3f6ELN');

const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

const ITEMS_PER_PAGE = 3;

const express = require('express'); // import express


const app = express();


exports.getIndex = (req, res, next) => {
    return res.redirect('/shop');
}

exports.getShop = (req, res, next) => {
    // page number is added as a query in url
    const page = +req.query.page || 1;
    let totalItems;

    const search = req.query.search;

    let query = { quantity: { $gt: 0 } };
    if (req.user) {
        query.userId = { $ne: req.user._id };
    }
    if (search) { // to retrieve results similar to the books title and/or author
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } }
        ];
    }

    Product.find(query)
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find(query) 
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
                .populate({
                    path: 'userId',
                    select: 'username'
                })
    })
    .then(products => {
        res.render('shop/shop', { 
            products: products,
            pageTitle: 'Products', 
            path: '/shop',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            errorMessage: null,
            cartTot: req.cartTot,
            search: search,
            page: page,
            totalItems: totalItems
        }); 
    })
    .catch(err => {
        // TODO: throw error
    });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .populate({
            path: 'userId',
            select: 'username'
        })
        .then(product => {
            res.render('shop/product-detail', {
                product: product, 
                pageTitle: product.title,
                path: '/',
                cartTot: req.cartTot
            });
        })
        .catch(err => {
            // TODO: throw error
            console.log(err);
        })
}

exports.getUserPage = (req, res, next) => {
    const userId = req.params.userId;
    let username;
    const page = +req.query.page || 1;
    let totalItems;
    const ITEMS_PER_PAGE_USER = 3;

    User.findById(userId)
        .then(user => {
            username = user.username;
            Product.find({ 'userId': userId, 'quantity': { $gt: 0 } })
            .countDocuments()
            .then(numProducts => {
                totalItems = numProducts;
                return Product.find({'userId': userId, 'quantity': { $gt: 0 } })
                    .skip((page - 1) * ITEMS_PER_PAGE_USER) 
                    .limit(ITEMS_PER_PAGE_USER)
                    .populate({
                        path: 'userId',
                        select: 'username'
                    })
            })
            .then(products => {
                res.render('shop/user', { 
                    products: products,
                    pageTitle: 'Products', 
                    path: '/shop',
                    currentPage: page,
                    hasNextPage: ITEMS_PER_PAGE_USER * page < totalItems,
                    hasPreviousPage: page > 1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE_USER),
                    errorMessage: null,
                    cartTot: req.cartTot,
                    username: username
                }); 
            })
            .catch(err => {
                // TODO: throw error
                console.log(err)
            });
        })


}

exports.getCart = (req, res, next) => {

    // check for errors

    req.user.populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;

            const subtotal = Number(products.reduce((acc, curr) => {
                if (curr.productId.quantity > 0) {
                  return acc + (curr.productId.price * curr.quantity);
                } else {
                  return acc;
                }
            }, 0));              
            const total = Number((subtotal + (subtotal * 0.15)));
            const tax = Number(total - subtotal);

            res.render('shop/cart', {
                pageTitle: 'Cart',
                path: '/cart',
                products: products,
                errorMessage: null,
                errorItem: null,
                indexes: [],
                subtotal: subtotal,
                tax: tax,
                total: total,
                cartTot: req.cartTot
            });
        })
        .catch(err => {
            console.log(err)
            // TODO: throw error
        })
}

exports.addToCart = (req, res, next) => {
    const prodId = req.body.productId;
    const quantity = +req.body.quantity;

    // get product info

    Product.findById(prodId)
        .then(product => {
            const stock = product.quantity;
            let cartAmount;
            req.user
                // populate replaces the 'productId field on each item in the cart with the full product document'. Mongoose inferes that we want to user Product
                .populate('cart.items.productId')
                .then(user => {
                    const products = user.cart.items;
                    const cartProductIndex = products.findIndex(p => {
                        return p.productId._id.toString() === prodId;
                    });

                    if (cartProductIndex >= 0) {
                        cartAmount = products[cartProductIndex].quantity; 
                    } else {
                        cartAmount = 0;
                    }

                    // if theres not enough in stock then re-render the page with error message

                    if (quantity + cartAmount > stock) {
                        const page = +req.query.page || 1;
                        let totalItems;
                    
                        Product.find()
                            .countDocuments().then(numProducts => {
                                totalItems = numProducts;
                                return Product.find()
                                    .skip((page - 1) * ITEMS_PER_PAGE)
                                    .limit(ITEMS_PER_PAGE)
                        })
                        .then(products => {
                            return res.render('shop/product-list', { 
                                prods: products,
                                pageTitle: 'Products', 
                                path: '/products',
                                currentPage: page,
                                hasNextPage: ITEMS_PER_PAGE * page < totalItems, // to see if there will be a next page
                                hasPreviousPage: page > 1,
                                nextPage: page + 1,
                                previousPage: page - 1,
                                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                                errorMessage: 'Sorry, there are only ' + stock + ' of these items left in stock.',
                                cartTot: req.cartTot
                            }); 
                        })
                        .catch(err => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                    } 
                    
                    // if there is enough in stock, then add to cart

                    else { 
                        return req.user.addToCart(product, quantity)
                        .then(
                            res.redirect('/cart')
                        )
                        .catch(err => {
                            console.log(err);
                        })
                    }
                })
        })
}

// exports.updateQuantity = (req, res, next) => {
//     const prodId = req.body.productId;
//     const newQuantity = req.body.quantity;

//     req.user.updateQuantity(prodId, newQuantity)
//         .then(result => {
//             res.redirect('/cart');
//         })
//         .catch(err => {
//             // TODO: throw error 
//         });
// }

exports.deleteItem = (req, res, next) => {
    const prodId = req.body.productId;

    req.user.deleteItem(prodId)
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => {
            // TODO: throw error
        })
};

exports.addAmount = (req, res, next) => {
    const prodId = req.body.productId;

    Product.findById(prodId)
        .then(product => {
            return product.quantity;
        })
        .then(stock => {
            req.user.addAmount(prodId, stock)
            .then(result => {
                res.redirect('/cart');
            })
            .catch(err => {
                req.user.populate('cart.items.productId')
                    .then(user => {
                        const products = user.cart.items;

                        const subtotal = Number(products.reduce((acc, curr) => {
                            if (curr.productId.quantity > 0) {
                              return acc + (curr.productId.price * curr.quantity);
                            } else {
                              return acc;
                            }
                        }, 0));
                        const total = Number((subtotal + (subtotal * 0.15)));
                        const tax = Number(total - subtotal);

                        res.render('shop/cart', {
                            pageTitle: 'Cart',
                            path: '/cart',
                            products: products,
                            errorMessage: 'Insufficient stock.',
                            errorItem: prodId,
                            indexes: [],
                            subtotal: subtotal,
                            tax: tax,
                            total: total,
                            cartTot: req.cartTot
                        });
                    })
                    .catch(err => {
                        // TODO: throw error
                    })
            })
        })
        .catch(err => {
            
            // TODO: throw error
            console.log(err);
        })
}

exports.minusAmount = (req, res, next) => {
    const prodId = req.body.productId;

    req.user.minusAmount(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            // TODO: throw error 
        });
}


exports.createOrder = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .then(user => {

        // get list of all products

        const products = user.cart.items.map(p => {
            return {quantity: p.quantity, product:{ ...p.productId._doc }};
        });

        const dispProducts = user.cart.items;

        const subtotal = Number(products.reduce((acc, curr) => {
            if (curr.product.quantity > 0) {
              return acc + (curr.product.price * curr.quantity);
            } else {
              return acc;
            }
        }, 0));              
        const total = Number((subtotal + (subtotal * 0.15)));
        const tax = Number(total - subtotal);

        // TODO: if all items in the cart are sold out, then return to cart with error message

        if (total === 0) {
            return res.redirect('/cart');
        }

        // checking if any of the products in the cart exceed the amount of that product in stock

        const indexArray = products
            .map((product, index) => product.quantity > product.product.quantity ? index : -1)
            .filter(index => index !== -1);

        for (let i = 0; i < indexArray.length; i++) {
            products.splice(indexArray[i], 1);
        }

        // check stock and update quantity

        for (let i = 0; i < products.length; i++) {
            Product.findById(products[i].product._id)
                .then(product => {
                    if (product.quantity < products[i].quantity) {
                        // TODO: throw error
                    }
                    product.quantity = product.quantity - products[i].quantity;
                    product.save();
                })
        }

        // create the order

        const date = new Date();
        const minute = date.getMinutes();
        const year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();

        if (month.toString().length === 1) {
            month = '0' + month.toString();
        };

        if (day.toString().length === 1) {
            day = '0' + day.toString();
        };

        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: products,
            total: total,
            date: {
                date: date,
                day: day,
                month: month,
                year: year,
                minute: minute
            }
        });

        return order.save()
            .then(result => {
                return req.user.clearCart();
            })
            .then(() => {
                return res.render('shop/checkout', {
                    path: '/checkout',
                    pageTitle: 'Checkout',
                    cartTot: req.cartTot,
                    orderNum: order._id
                })
            })
            .catch(err => {
                // TODO: throw error properly
                console.log(err)
            });
    })
}

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        cartTot: req.cartTot,
    })
}

exports.getStripe = async (req, res, next) => {
    const YOUR_DOMAIN = 'http://localhost:3001';

    try {
        const user = await req.user.populate('cart.items.productId');
        // get list of all products
        const products = user.cart.items.map(p => {
            return {quantity: p.quantity, product:{ ...p.productId._doc }};
        });

        const subtotal = Number(products.reduce((acc, curr) => {
            if (curr.product.quantity > 0) {
              return acc + (curr.product.price * curr.quantity);
            } else {
              return acc;
            }
        }, 0));              
        const total = Number((subtotal + (subtotal * 0.15)));
        console.log(total)

        // TODO: if all items in the cart are sold out, then return to cart with error message

        if (total === 0) {
            return res.redirect('/cart');
        }

        // checking if any of the products in the cart exceed the amount of that product in stock

        const indexArray = products
            .map((product, index) => product.quantity > product.product.quantity ? index : -1)
            .filter(index => index !== -1);

        for (let i = 0; i < indexArray.length; i++) {
            products.splice(indexArray[i], 1);
        }

        // check stock

        for (let i = 0; i < products.length; i++) {
            const product = await Product.findById(products[i].product._id);
            if (product.quantity < products[i].quantity) {
                // TODO: throw error
            }
        }

        // stripe

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'tshirt'
                        },
                        unit_amount: Math.trunc(total * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/create-order`,
            cancel_url: `${YOUR_DOMAIN}/cart`,
        });
        res.redirect(303, session.url);
    } catch (err) {
        console.log(err);
        res.redirect('/cart');
    }
};

exports.getOrders = (req, res, next) => {
    let ITEMS_PER_PAGE_ORDERS = 3;
    let totalOrders;
    const page = +req.query.page || 1;

    Order.find({ "user.userId": req.user._id })
    .countDocuments()
    .then(numOrders => {
        totalOrders = numOrders;
        return Order.find({ "user.userId": req.user._id })
            .sort({ 'date.year': -1 })
            .sort({ 'date.month': -1 })
            .sort({ 'date.day': -1 })
            .sort({ 'date.hour': -1 })
            .sort({ 'date.minute': -1 })
            .skip((page - 1) * ITEMS_PER_PAGE_ORDERS)
            .limit(ITEMS_PER_PAGE_ORDERS)
            .populate({
                path: 'products.product.userId', 
                model: 'User'
            })
    })
    .then(orders => {
        res.render('shop/orders', {
            orders: orders,
            pageTitle: 'Orders',
            path: '/orders',
            pages: totalOrders / ITEMS_PER_PAGE_ORDERS,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE_ORDERS * page < totalOrders,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalOrders / ITEMS_PER_PAGE_ORDERS),
            cartTot: req.cartTot,
        })
    })
    .catch(err => {
        console.log(err);
        // TODO: properly throw error
    })
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then(order => {

            // check if order exists

            if (!order) {
                // TODO: throw error properly like above
                return res.redirect('/orders');
            }

            // make sure user allowed to access invoice

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }

            // give invoice

            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '"'
            );

            // saving pdf doc to file system
            pdfDoc.pipe(fs.createWriteStream(invoicePath));

            // send pdf to client as an HTTP response
            pdfDoc.pipe(res);

            const pageWidth = 612; // standard US letter-size page width in points
            const lineWidth = pageWidth * 0.9; // 90% of page width
            const leftMargin = (pageWidth - lineWidth) / 2; // 5% left margin
            const textWidth = pdfDoc.widthOfString('INVOICE');
            const xdis = Math.trunc(612 - leftMargin - textWidth) - 105;

            // adding text to pdf document
            pdfDoc.fillColor('#888888').font('Times-Bold').fontSize(26).text('INVOICE', xdis, pdfDoc.y - 20);
            pdfDoc.moveTo(leftMargin, pdfDoc.y + 20) // pdfDoc.y + 20 specifies that the line should be under the title
                .lineTo(leftMargin + lineWidth, pdfDoc.y + 20)
                .stroke();

            pdfDoc.font('Times-Roman').fillColor('#000000');

            pdfDoc.moveDown()

            // company info
            pdfDoc.fontSize(14).text('[Company name]', leftMargin, pdfDoc.y);
            pdfDoc.fontSize(14).text('[Address]', leftMargin, pdfDoc.y);
            pdfDoc.fontSize(14).text('[Customer support number]', leftMargin, pdfDoc.y);

            // rectangle for the table
            pdfDoc.moveTo(leftMargin, pdfDoc.y + 20);
            const rectWidth = 450;
            const rectHeight = 400;
            const rectX = (pageWidth - rectWidth) / 2;
            const rectY = pdfDoc.y + 40;
            pdfDoc.rect(rectX, rectY, rectWidth, rectHeight).stroke();

            // shading for top of table
            const topY = rectY + 30;
            pdfDoc.fillColor('#EEEEEE').rect(rectX + 1, rectY + 1, rectWidth - 2, topY - rectY - 2).fill();

            // column line of table
            const centerX = rectX + rectWidth / 1.4;
            pdfDoc.moveTo(centerX, rectY)
                .lineTo(centerX, rectY + rectHeight)
                .stroke();

            // top line of table
            pdfDoc.moveTo(rectX, topY)
                .lineTo(rectX + rectWidth, topY)
                .stroke();

            // Add "Description" text within the table
            pdfDoc.fillColor('#000000').font('Times-Bold').fontSize(14)
                .text('Description', rectX + 10, topY - 20);

            // Add "Amount" text within the table
            pdfDoc.fillColor('#000000').font('Times-Bold').fontSize(14)
                .text('Amount', rectX + 360, topY - 20);


            // adding the products to the invoice
            let totalPrice = 0;

            order.products.forEach(prod => {
                totalPrice += Number(prod.quantity * prod.product.price);
                pdfDoc
                .font('Times-Roman')
                    .fontSize(14)
                    .text(prod.product.title + ' (' + prod.quantity + ')', rectX + 10, pdfDoc.y + 15);
                pdfDoc
                    .fontSize(14)
                    .text('$' + Number(prod.product.price).toFixed(2), rectX + 365, pdfDoc.y - 15);
            });
            totalPrice = (totalPrice * 1.15).toFixed(2);

            // shading for bottom of table
            const bottomY = rectY + rectHeight - 30; // Adjust as needed for spacing
            pdfDoc.fillColor('#EEEEEE').rect(rectX + 1, bottomY + 1, rectWidth - 2, topY - rectY - 2).fill();

            // column line for bottom
            const centerXbottom = rectX + rectWidth / 1.9;
            pdfDoc.moveTo(centerXbottom, bottomY)
                .lineTo(centerXbottom, bottomY + (topY - rectY))
                .stroke();
            
            // bottom hor line of table
            pdfDoc.moveTo(rectX, bottomY)
                .lineTo(rectX + rectWidth, bottomY)
                .stroke();

            // Add "Total" text within the table
            pdfDoc.fillColor('#000000').font('Times-Roman').fontSize(14)
                .text('Total:', (pageWidth / 2) + 20, bottomY + 9);

            // Add "Total" text within the table
            pdfDoc.fillColor('#000000').font('Times-Bold').fontSize(14)
                .text('$' + totalPrice, rectX + 365, bottomY + 9);

            pdfDoc.end();

        })
        .catch(err => {
            // TODO: log error
            console.log(err);
        });
}

exports.postUpdate = (req, res, next) => {
    const amount = req.body.amount;
    const prodId = req.body.prodId;

    req.user.updateQuantity(prodId, amount)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            // TODO: throw error 
        });
};