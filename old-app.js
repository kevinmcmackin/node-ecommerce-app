const http = require('http');
const routes = require('./routes'); // importing the routing file
const express = require('express'); // import express

// run express function
const app = express();

/* next is a function passed to the callback function.
func must be executed for the request to move on to the next middleware
first param is a path */
app.use((req, res, next) => {
    console.log('In the middleware');
    // next func allows the middleware to move on
    next();
});

app.use('/', (req, res, next) => {
    console.log('In the other middleware');
    // by default sends content type is html. could override this
    // no need to next() when we use send
    res.send('<h1>hello from express</h1>');
});

// create server with express
const server = http.createServer(app);

// creating & storing the server in a var
//const server = http.createServer(routes);

// js will listen for incoming requests on local host 3000
server.listen(3000);