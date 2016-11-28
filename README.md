#SpliceJS Module Loader - AMD [DRAFT]
For background on AMD please refer to the AMD specfication:
[AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md)

SpliceJS module specification slightly differs from the AMD however is also asynchronous and tries to maintain compatibility with AMD.

##API Elements 	
### define() function
```javascript
define(imports,callback);
```

### require() function
```javascript
require(imports,callback);
```


##Terminology
module definition:
is a call to define function in the form: 
```javascript
	define(imports,function(){});
```
resolving module:
	module is said to be resolved if all import requirements have been resolved and the module'body function has been executed

## Importing Dependencies
### Simple Imports
Consider three JavaScript files named *__moduleA.js__*, *__moduleB.js__*, *__moduleC.js__* containing the following code:
```javascript
	//moduleA.js
	define(function(){
		return function greet(){
			console.log('Hi, I am module A');
		}
	});
```
```javascript
	//moduleB.js
	define(function(){
		return function greet(){
			console.log('Hi, I am module B');
		}
	});
```


```javascript
	//moduleC.js
	define([
		'moduleA',
		'moduleB'
	],function(a,b){
		a.greet();
		b.greet();
	});
```
Lets assume all three files above are located within the same directory/URL. Each file represents a module. In AMD specfication these modules are knows as anonymous. 

While AMD allows named modules, all modules in SpliceJS are anonymous.

Above modules A and B are each exporting 'greet' function, which outputs module specific greeting text. Module C is importing content exported from modules A and B. Notice how import names are listed without file extensions, .js extension is implied and loader will be looking for file names moduleA.js and moduleB.js  
Generally the sequence of import dependencies matches the sequence of arguments to the factory function of the dependent modules.
The imports-to-argument mapping is used to retrieve imported dependencies, hence 'greet' function for each imported module can be accessed through arguments 'a' and 'b' respectivelly.
### Special import words:
A few import words have a special meaning.
* *require* - injects require function
* *exports* - contains all module exports
* *scope* - provides reference to the module's scope.  Similer to exports object, however scope contains references to all the scoped imports (see below for scoped imports)  

```javascript
define(['require','exports','scope','moduleA'],
	function(require,exports,scope,modulea){
});
```

### Scoped Imports
```javascript
define([
	'require',
	'exports',
	'ModuleA',
	{'ModuleB':'ModuleB'} //object literal to define import scope
],function(require,exports,a){
	this.ModuleB.greet();
});
```
####Using scope
```javascript
define(['require','exports','scope',{'ModuleA':'moduleA'}],
	function(require,exports,scope){
		var a = scope.ModuleA;
});
```
alternative access to the scope object
```javascript
define(['require','exports',{'ModuleA':'moduleA'}],
	function(require,exports,scope){
		var a = this.ModuleA;
});
```


### Importing Other Dependencies


###Preloading Dependencies
Imports prefixed with 'preload|' list will be resolved before any other item in the imports list is loaded
```javascript
define(['require','exports','preload|import.extension'],
	function(require,exports,modulea){
});
```

```javascript
define([
	'require','exports',
	'preload|import.extension', // loader extension module, enables loading .html and .css files
	'!template.html','!template.css'
],function(require,exports,modulea){
});
```

## Sample Application
index.html
```html
<!DOCTYPE html>
<html>
	<head>
		<script src="lib/splicejs/splice.js" sjs-main="app.js"></script>
		<title>Sample Application</title>
	</head>
	<body></body>
</html>
```
app.js
```javascript
define([
	greeter
],function(g){
	document.body.appendChild(
		document.createTextNode(g.greet())
	);
});
```
greeter.js
```javascript
define(function(){
	return function greet(){
		return 'Hellow World';
	}
});
```

#SpliceJS - Scoped Module Definition
```javascript
define({
imports:[
	{'anim':'animation'},
	{'utils':'string.utils'},
	'!template.html',
	'!template.css',
	'preload|loader.extensions'
],
definition:function(){
	//module's scope is bound to 'this'
	var scope = this; 
	
	//imports are found
	var n = this.imports.utils.format(12468796); 

	var animation = this.imports.anim;
	
	//access to SpliceJS calls, may be used to extension implementation
	var $js = scope.imports.$js;
	
	//sample function for export
	function foo(){}
	
	//exports function foo and n under result
	scope.exports(foo,{result:n});
	
	}
});	
```









