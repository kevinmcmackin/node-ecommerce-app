const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// defining a product schema
const productSchema = new Schema({
    title: {
        type: String, 
        required: true
    },
    price: {
        type: Number, 
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }, 
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // refer to user model to tell it what specific type
        required: true
    }
});

// giving model a name in the brackets. mongoose takes the name here, makes lowercase and makes plural for naming table in the db
module.exports = mongoose.model('Product', productSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb; // method gives connection to db

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) { // only might have an id
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         // mongo stores the ids as weird objects. this way we convert strings to those objects
//         this._id = id ? new mongodb.ObjectId(id) : null; // only make an id if one passed in
//         this.userId = userId; // points at user who created the product
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) { // for updating
//             dbOp = db
//             .collection('products')
//             .updateOne({_id: this._id}, { $set: this }); // same as saying title: this.title, etc.
//         } else { // if new product
//             dbOp = db
//             .collection('products') // connect to products collection (or makes one)
//             .insertOne(this); // inserts the product above
//         }
//         return dbOp
//         .then(result => {
//             console.log(result);
//         })
//         .catch(err => {
//             console.log(err);
//         })
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db
//         .collection('products')
//         .find()
//         .toArray()
//         .then(products => {
//             console.log(products);
//             return products;
//         })
//         .catch(err => {
//             console.log(err);
//         });
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return db
//         .collection('products')
//          // _id auto managed by mongo. is not a string which is why we must convert our id
//         .find({ _id: new mongodb.ObjectId(prodId) })
//         .next() // to get the next returned by find
//         .then(product => {
//             console.log(product);
//             return product;
//         })
//         .catch(err => console.log(err))
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db
//         .collection('products')
//         .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//         .then(result => {
//             console.log('Deleted!')
//         })
//         .catch(err => console.log(err));
//     }
// }

// module.exports = Product;