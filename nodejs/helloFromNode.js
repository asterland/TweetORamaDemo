var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("Hello From NodeJs");
}).listen(1337, "127.0.0.1");

console.log('Tweet\'R\'Us server running at http://127.0.0.1:1337/');