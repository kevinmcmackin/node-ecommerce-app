const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String, 
        required: true
    },
    author: {
        type: String,
        required: true
    },
    price: {
        type: String, 
        required: true
    },
    quantity: {
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
    },
    condition: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);
