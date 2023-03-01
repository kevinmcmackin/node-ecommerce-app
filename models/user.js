const mongoose = require('mongoose');

const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    username: {
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
    },
    confirm: {
        type: Boolean,
        required: true
    }
});

userSchema.methods.getCartTot = function() {
    const count = this.cart.items.length;
    return count;
};

userSchema.methods.addToCart = function(product, selectedQuantity) {

    // get index if product in cart already

    const cartProductIndex = this.cart.items.findIndex(p => {
        return p.productId._id.toString() === product._id.toString();
    });
    let newQuantity = selectedQuantity;
    const updatedCartItems = [...this.cart.items];

    // if product already in the cart

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + selectedQuantity;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } 
    
    // if its not already a product in the cart

    else {
        updatedCartItems.push({
            productId: new ObjectId(product._id),
            quantity: newQuantity
        })
    }

    // store only the reference as we want the cart data to change when product data chanegs (price, etc.)
    const updatedCart = {
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.updateQuantity = function(productId, newQuantity) {
    
    // get index of item in cart
    
    const index = this.cart.items.findIndex(item => {
        return item.productId.toString() === productId.toString();
    })

    if (index >= 0) {
        this.cart.items[index].quantity = newQuantity;
        return this.save();
    } else {
        return Promise.reject('Product not found in cart'); 
    }
};

userSchema.methods.deleteItem = function(prodId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== prodId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.addAmount = function(prodId, stock) {
    
    // check if item exists
    
    const index = this.cart.items.findIndex(item => {
        return item.productId.toString() === prodId.toString();
    });

    if (index >= 0) {
        const inCart = this.cart.items[index].quantity;

        // check if enough product in stock

        if (inCart + 1 > stock) {
            return Promise.reject('Not enough in stock'); 
        } 

        // add 1 to cart

        this.cart.items[index].quantity += 1;
        return this.save();

    } else {
        return Promise.reject('Product not found in cart'); 
    }
};

userSchema.methods.minusAmount = function(prodId) {
    
    // check if item exists
    
    const index = this.cart.items.findIndex(item => {
        return item.productId.toString() === prodId.toString();
    });

    if (index >= 0) {
        
        const cartQuant = this.cart.items[index].quantity;
        if (cartQuant === 1) {
            return this.deleteItem(prodId);
        }

        this.cart.items[index].quantity -= 1;
        return this.save();

    } else {
        return Promise.reject('Product not found in cart'); 
    }
};

userSchema.methods.clearCart = function(prodId) {
    this.cart = {items: []};
    return this.save();
}

module.exports = mongoose.model('User', userSchema);