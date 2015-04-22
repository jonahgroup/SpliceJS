/*
documentRoot
*/
var docRoot = process.argv[2]?process.argv[2]:'.';
console.log('Document Root: ' + docRoot);

var CONTENT_TYPE_MAP = {

	'jpg'	:'image/jpg',
	'png'	:'image/png',
	'gif'	:'image/gif',

	'js'	:'text/javascript',
	'css'	:'text/css',
	'html'	:'text/html',
	'ttf'	:'application/octet-stream'
};


var regex = /\.([A-Za-z_0-9]+)$/;
function getContent(path){
	if(!path) return;
	var m = regex.exec(path);
	if(m) return CONTENT_TYPE_MAP[m[1].toLowerCase()];
}


require('http').createServer(function (request,response){

	var filePath = docRoot + request.url;
	if(filePath === '../') filePath += 'examples/example.html';



	var fs = require('fs');

	fs.readFile(filePath, function(err,fd){
		if(err) { 
			response.end();
			return; // do nothing on file errors
		}
		
		var content = getContent(filePath);
		if(!content) content = 'text/html';

		
		console.log('URL: ' + filePath + ' Content-Type:' + content);

		response.writeHead(200, {'Content-Type': content});
		response.write(fd);
		response.end();
	});


}).listen(8081);

