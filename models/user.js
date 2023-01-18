const mongoose = require('mongoose');

const mongodb = require('mongodb');
const { update } = require('./product');
const ObjectId = mongodb.ObjectId;

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    // not required, only added when password reset requested
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product', // tell it what type of model 
                required: true
            }, 
            quantity: {
                type: Number, required: true
            }
        }]
    }
})

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) { // if it exists already in the cart
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else { // if doesnt already exist, create and give these two properties
        updatedCartItems.push({
            productId: new ObjectId(product._id), // these names must be same as those in schema
            quantity: newQuantity 
        })
    }
    const updatedCart = {
        // store only the reference as we want the cart data to change when product data chanegs (price, etc.)
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();    
}

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(item => { // return true if we want to keep item and false to delete it
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = {items: []};
    return this.save();
}


// userSchema.methods.getCart = function() {
//     const db = getDb();
//     // makes an array of all product ids in the cart
//     const productIds = this.cart.items.map(i => {
//         return i.productId;
//     });
//     return db
//     .collection('products')
//     .find({ _id: { $in: productIds } }) // gives elements where the id is one of the ids in the array
//     .toArray()
//     .then(products => {
//         return products.map(p => {
//             return {...p, quantity: this.cart.items.find(i => { // look through all elements in cart items
//                 return i.productId.toString() === p._id.toString(); // find where cart item equals item in database
//             }).quantity}
//         })
//     }); 
// }

module.exports = mongoose.model('User', userSchema);


// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username; 
//         this.email = email;
//         this.cart = cart; // {items: []}
//         this._id = id;
//     }

//     save() {
//         const db = getDb();
//         return db
//         .collection('users') // new collection
//         .insertOne(this); // store user
//     }

//     addToCart(product) {
//         // check if item exists already
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });
//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];
//         if (cartProductIndex >= 0) { // if it exists already
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else { // if doesnt already exist, create and give these two properties
//             updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity })
//         }
//         const updatedCart = {
//             // store only the reference as we want the cart data to change when product data chanegs (price, etc.)
//             items: updatedCartItems
//         };
//         const db = getDb();
//         return db
//         .collection('users')
//         .updateOne(
//             { _id: new ObjectId(this._id) }, 
//             { $set: {cart: updatedCart} } // replace cart with updated cart
//         );
//     }

//     getCart() {
//         const db = getDb();
//         // makes an array of all product ids in the cart
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         });
//         return db
//         .collection('products')
//         .find({ _id: { $in: productIds } }) // gives elements where the id is one of the ids in the array
//         .toArray()
//         .then(products => {
//             return products.map(p => {
//                 return {...p, quantity: this.cart.items.find(i => { // look through all elements in cart items
//                     return i.productId.toString() === p._id.toString(); // find where cart item equals item in database
//                 }).quantity}
//             })
//         }); 
//     }

//     deleteItemFromCart(prodId) {
//         const updatedCartItems = this.cart.items.filter(item => { // return true if we want to keep item and false to delete it
//             return item.productId.toString() !== prodId.toString();
//         });
//         const db = getDb();
//         return db
//         .collection('users')
//         .updateOne(
//             { _id: new ObjectId(this._id) }, 
//             { $set: {cart: {items: updatedCartItems}} } // replace cart with updated cart
//         );
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart() // must return so that we can call .then on this method in the controller
//             .then(products => {
//                 const order = { // create an order with the cart data
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name,
//                     }
//                 };
//                 return db
//                 .collection('orders')
//                 .insertOne(order) // insert cart into the orders before clearing it
//                 })
//                 .then(result => {
//                     this.cart = { items: [] }; // clear in the local cart
//                     return db // now clearing cart in the db
//                     .collection('users')
//                     .updateOne(
//                         { _id: new ObjectId(this._id) }, 
//                         { $set: {cart: {items: []}} } // replace cart with updated cart
//                     );
//                 });
//     }

//     getOrders() {
//         const db = getDb();
//         return db
//         .collection('orders')
//         .find({ 'user._id': new ObjectId(this._id) })
//         .toArray();
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db
//         .collection('users')
//         .findOne({_id: new ObjectId(userId)});
//     }
// }

// module.exports = User;