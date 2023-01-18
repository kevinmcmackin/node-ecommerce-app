const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1; // we set the page number as a query in the url
    let totalItems;

    Product.find() // get all products and count how many
        .countDocuments().then(numProducts => {
            totalItems = numProducts;
            return Product.find() // gets the indexes of all the 'Product'
                .skip((page - 1) * ITEMS_PER_PAGE) // start getting items at correct index
                .limit(ITEMS_PER_PAGE) // sstop retrieving items after got two
    })
    .then(products => {
        res.render('shop/product-list', { 
            prods: products,
            pageTitle: 'Products', 
            path: '/products',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems, // to see if there will be a next page
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        }); 
    })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getProduct = (req,res,next) => {
    const prodId = req.params.productId;
    Product.findById(prodId) // findById method available by mongoose
        .then(product => {
            res.render('shop/product-detail', {
                product: product, 
                pageTitle: product.title,
                path: '/products',
                // isAuthenticated: req.session.isLoggedIn, // old way
                // csrfToken: req.csrfToken()
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1; // we set the page number as a query in the url
    let totalItems;

    Product.find() // get all products and count how many
        .countDocuments().then(numProducts => {
            totalItems = numProducts;
            return Product.find() // gets the indexes of all the 'Product'
                .skip((page - 1) * ITEMS_PER_PAGE) // start getting items at correct index
                .limit(ITEMS_PER_PAGE) // sstop retrieving items after got two
    })
    .then(products => {
        res.render('shop/index', { 
            prods: products,
            pageTitle: 'Shop', 
            path: '/',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems, // to see if there will be a next page
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        }); 
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCart = (req,res,next) => {
    req.user
    .populate('cart.items.productId') // this will take the product id and convert it to an object with the product id but also all product info associated with that id
    .then(user => {
        const products = user.cart.items;
        res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products,
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

// add to cart
exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product);
    })
    .then(result => {
        console.log(result);
        res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
    .removeFromCart(prodId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
    .populate('cart.items.productId') // this will take the product id and convert it to an object with the product id but also all product info associated with that id
    .then(user => {
        const products = user.cart.items.map(i => {
            return {quantity: i.quantity, product:{ ...i.productId._doc }}; // productId has metadata. this is how we are able to get all data associated with productId
        });
        console.log(req.user)
        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user // will pick out the id from here
            },
            products: products
        });
        return order.save(); //saves order to db
    })
    .then(result => {
        return req.user.clearCart(); // clear cart
    })
    .then(() => {
        res.redirect('/orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postOrder = (req, res, next) => {
    req.user
    .populate('cart.items.productId') // this will take the product id and convert it to an object with the product id but also all product info associated with that id
    .then(user => {
        const products = user.cart.items.map(i => {
            return {quantity: i.quantity, product:{ ...i.productId._doc }}; // productId has metadata. this is how we are able to get all data associated with productId
        });
        console.log(req.user)
        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user // will pick out the id from here
            },
            products: products
        });
        return order.save(); //saves order to db
    })
    .then(result => {
        return req.user.clearCart(); // clear cart
    })
    .then(() => {
        res.redirect('orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
    req.user
      .populate('cart.items.productId')
      .then(user => {
        const products = user.cart.items;
        let total = 0;
        products.forEach(p => {
          total += p.quantity * p.productId.price;
        });
        res.render('shop/checkout', {
          path: '/checkout',
          pageTitle: 'Checkout',
          products: products,
          totalSum: total
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  };

// exports.getCheckout = (req, res, next) => {
//     let products;
//     let total = 0;
//     req.user
//       .populate('cart.items.productId')
//       // .execPopulate() //
//       .then(user => {
//         products = user.cart.items;
//         products.forEach(p => {
//           total += p.quantity * p.productId.price;
//         });
  
//         // if I comment out this return statement then the session is undefined, but if i keep it, checkout breaks
//         return stripe.checkout.sessions.create({
//           payment_method_types: ['card'],
//           line_items: products.map(p => {
//             return {
//               name: p.productId.title,
//               description: p.productId.description,
//               amount: p.productId.price * 100,
//               currency: 'usd',
//               quantity: p.quantity
//             };
//           }),
//           mode: 'payment',
//           success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
//           cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
//         });

//         // console.log(products)

//         // const session = stripe.checkout.sessions.create({
//         //     payment_method_types: ['card'],
//         //     line_items: products.map(p => {
//         //         return {
//         //             price: p.productId.price,
//         //             quantity: p.quantity
//         //         };
//         //     }),
//         //     mode: 'payment',
//         //     success_url: 'http://localhost:3000/orders',
//         //     cancel_url: 'http://localhost:3000/cart',
//         // });

//         // res.render('shop/checkout', {
//         //     path: '/checkout',
//         //     pageTitle: 'Checkout',
//         //     products: products,
//         //     totalSum: total,
//         //   //   sessionId: session.id
//         //   });



//       })
//       .then(session => {
//         console.log('fu')
//         res.render('shop/checkout', {
//           path: '/checkout',
//           pageTitle: 'Checkout',
//           products: products,
//           totalSum: total,
//         //   sessionId: session.id
//         });
//       })
//       .catch(err => {
//         const error = new Error(err);
//         error.httpStatusCode = 500;
//         return next(error);
//       });
// };

exports.getOrders = (req,res,next) => {
    Order.find({"user.userId": req.user._id}) // find where user order id equal to logged in user id
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    // we need to check to see if user should be able to download the requested invoice file
    Order.findById(orderId)
      .then(order => {
        // if no order found...
        if (!order) {
          return next(new Error('No order found.'));
        }
        // if the user logged in is not equal to the user on the invoice...
        if (order.user.userId.toString() !== req.user._id.toString()) {
          return next(new Error('Unauthorized'));
        }
        // now we can give user the file if passed both if checks
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);
  
        // creating a pdf to make an invoice
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'inline; filename="' + invoiceName + '"'
        );
        pdfDoc.pipe(fs.createWriteStream(invoicePath)); // write the pdf to the server and not just client
        pdfDoc.pipe(res); // return to client 
  
        // adding text to pdf document
        pdfDoc.fontSize(26).text('Invoice', {
          underline: true
        });
        pdfDoc.text('-----------------------');

        // adding the products to the invoice
        let totalPrice = 0;
        order.products.forEach(prod => {
          totalPrice += prod.quantity * prod.product.price;
          pdfDoc
            .fontSize(14)
            .text(
              prod.product.title +
                ' - ' +
                prod.quantity +
                ' x ' +
                '$' +
                prod.product.price
            );
        });
        pdfDoc.text('---');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
  
        pdfDoc.end(); // done writing to the stream. response now sent

        // fs.readFile(invoicePath, (err, data) => {
        //   if (err) {
        //     return next(err);
        //   }
        //   res.setHeader('Content-Type', 'application/pdf');
        //   res.setHeader(
        //     'Content-Disposition',
        //     'inline; filename="' + invoiceName + '"'
        //   );
        //   res.send(data);
        // });
        // const file = fs.createReadStream(invoicePath);
  
        // file.pipe(res);
      })
      .catch(err => next(err));
  };