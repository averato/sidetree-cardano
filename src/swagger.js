"use strict";
var express = require('express');
const root = __dirname.substring(0, __dirname.lastIndexOf('/'));
var app = express();
app.get('/', function (_request, response) {
    response.sendFile(root + '/www/swagger/index.html');
});
app.get('/api.yml', function (_request, response) {
    response.sendFile(root + '/www/swagger/api.yml');
});
app.listen(8090);
console.log('Access Swagger at http://localhost:8090');
//# sourceMappingURL=swagger.js.map