const fs = require('fs');


const requestHandler = (req, res) => {

    // req gets a bunch of info. including the url and method
    const url = req.url;
    const method = req.method;

    if (url === '/') {

        // returns the code contained within 'write'
        res.write('<html>');
        res.write('<head><title>Enter Message</title><head>');
        // sends post request to display the input box. once we submit that input, it routes to /message because of the action
        res.write('<body><form action="/message" method="POST"><input type="text" name="message"><button type="submit">Send</button></form></body>');
        res.write('</html>');
        return res.end(); // return so that doesnt return anything beyond here

    }

    // checks url & checks if method is 'POST'
    if (url === '/message' && method === 'POST') {

        // .on method listens for events. NOTE: other code is run in the meantime
        // 'data' is for when a new chunk is ready to be read
        const body = [];
        req.on('data', (chunk) => {
            console.log(chunk);
            body.push(chunk);
        });

        // 'end' is fired when done parsing incoming requests
        return req.on('end', () => {

            // creates a new buffer and adds all chunks from the body to it (makes legible)
            const parsedBody = Buffer.concat(body).toString();
            // the parsedBody is presented as a key-value pair. this gets just the message
            const message = parsedBody.split('=')[1];

            // writes a file with dummy text. This is asynchronous, writeFileSync would add blocking (would wait until done to move on)
            fs.writeFile('message.txt', message, (err) => {
                // if there's an error, give a status code and redirect
                res.statusCode = 302; 
                res.setHeader('Location', '/');
                return res.end();
            });

        })
    }

    // will attach header to the response. This tells the browser it will be html code
    res.setHeader('Content-type', 'text/html');
    res.write('<html>');
    res.write('<p>Kevins server</p>');
    res.write('</html>');
    res.end(); // ends the writing

}

module.exports = requestHandler;

// another way to export if need to export multiple things
// module.exports = {
//     handler: requestHandler, 
//     someText: 'Some hard coded text'
// }

// another way to export
// module.exports.handler = requestHandler;
// or just
// exports.handler = requestHandler