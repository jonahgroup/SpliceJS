# SpliceJS Module Loader - AMD [DRAFT]
For background on AMD please refer to the AMD specfication:
[AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md)

SpliceJS module specification slightly differs from AMD however is also asynchronous.


# Terminology
__module definition__ - is a call to 'define' function, which may take a form: 
```javascript
// module defintion without dependencies
define(function(){});

//mode defintion with dependencies specified in the imports array
define(imports,function(){});

```
__resolving module__ - 
	module is said to be resolved if all of its import requirements have been satisfied and module' factory function has been executed

__resource__ - any item apearing within the import list.


# API	
### __define()__
Global scope function implementing module definition
```javascript
define(imports,callback);
```

### __require()__
Global scope function resolves import dependencies in context of the containing module.

Invokes a callback after imports have been resolved. This call is only available within module.
```javascript
require(imports,callback);
```

Returns an object containing exports of the 'importname'. 
This function call is accessible both globally and withing a module. An import resource under 'importname' must have been resolved for the function to return a value. 
If the import has not been resolved, null is returned.
```javascript
require(importname);
```

---
### __Namespace__
Object of kind Namespace are property containers that provide API to help avoid name collisions when new properties are added to the namespace. 

```javascript
var ns = new Namespace();
```
### __Namespace.prototype.add(propertyName, value);__
```javascript
ns.add('print',function(){});
```

### __Namespace.prototype.lookup(propertyName);__
```javascript
ns.lookup('print');
```
---
### __LoadingIndicator__
This is an abstract type that can be implemented to get updates on the loader's progress

### __LoadingIndicator.prototype.onBegin(fileName)__
Called when file is set to start loading. Loader desides when to call this method, and does so before control is passed to the browser native routines. 

### __LoadingIndicator.prototype.onComplete(fileName)__
Function is called by the loader when a resource or file is has completed loading.

---
### __Loader__
Is a type of the framework loader. This type is internal to the framework. Object of this type is passed to the ImportHandler.prototype.load function to receive resource loading completion notifications. 

See loader extension section below for the extension pattern.

### __Loader__.prototype.notify(importSpec)
Method is called to notify loader when a resource has finished loading. Parameter passed is an ImportSpec of the resource that has been loaded. This method will notify all the loaders registered to listen of the ImportSpec. Multiple loader may subscribe to a single ImportSpec in cases where define() or require() have been called synchronously to import same resource, as shown below.

```javascript
require(['moduleA'],function(a){

});

require(['moduleA','moduleB'], function(a,b){

})
```
As a result of the code above, to loaders will be listening for the notifications on 'moduleA' ImportSpec. After notification fires, each respective loader will decide whether to proceed loading other modules or complete resolution of the module. 

---
### __ImportHandler__
This interface allows implementing loader extensions. Instances of the ImportHandler are registered with the loader to support desired resource types.
Resource type is decodes via file extension including the leading period, such as .png
### __ImportHandler.prototype.importSpec(fileName);__
ImportHandler is responsible to returning ImportSpec implementation which handles the content being imported.
### __ImportHandler.prototype.load(loader,spec);__
Implements import loading. This functions if invoked by the loader framework when module' imports are processed.

---
### __ImportSpec__
Is an abstract base type representing a generic import. Specific imports such as modules implement derived types. For example to import .js files or javascript modules, SpliceJS implements ModuleSpec type which implemented ImportSpec interface.  
### __ImportSpec.fileName__
Returns an absolute URL of the resource being loaded.

### __ImportSpec.status__
Gets or sets the status of the ImportSpec instance 
Value | Description
---------------|-----------------
pending | Indicates that the import has been added to the loading queue. Next status change from there is 'loaded'
loaded | Indicates that import spec is loaded, however it may not be processed yet

### __ImportSpec.prototype.execute()__
Executes the loaded content of the ImportSpec. The result of this functions execution varies based on the type of the import spec. For instance ModuleSpec would run its factory functions when this method is invoked.


# Importing Dependencies
## Simple Imports
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

Modules A and B above are each exporting 'greet' function, which outputs module specific greeting text. Module C is importing content exported from modules A and B. Notice how import names are listed without file extensions, .js extension is implied and loader will be looking for file names moduleA.js and moduleB.js  
Generally the sequence of import dependencies matches the sequence of arguments to the factory function of the dependent modules.
The imports-to-argument mapping is used to retrieve imported dependencies, hence 'greet' function for each imported module can be accessed through arguments 'a' and 'b' respectivelly.

## Dependency paths

By default dependcy paths are relative and resolved relative to the importing module.
It is possible to specify absolute paths and parameterized paths also.

Example of relative path
```javascript
define(['moduleA'],function(){});
```
Absolute paths are resolved against application context (location). By default it is a location of the file speficied in the "sjs-main" atrribute of the splice.js script import. 

Example of an absolute path
```javascript
define(['/lib/moduleA'],function(){});
```

## Parameterized path

Import paths may contain custom parameters. This is useful to reference modules or other resources in a centralized location that is configurable.

Example
```javascript
define(['/{splicejs.modules}/splice.networking'],function(){});
```



## Special import words
A few import words that looks like relative path modules have special meaning.
* *require* - injects require() function
* *exports* - contains all module exports
* *scope* - provides reference to the module's scope.  Similer to exports object, however scope contains references to all the scoped imports (see below for scoped imports)  
* *core* - supplies core API calls. See [core](#CoreReference) refence
```javascript
define(['require','exports','scope','moduleA'],
	function(require,exports,scope,modulea){
});
```

## Scoped Imports
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
## Using scope
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
## Using require()
```javascript
define([require,'moduleA'],function(require){

	//both require() calls below run in the context of the enclosing module

	//resolves moduleB and invokes the callback
	require(['moduleB'],function(moduleB){

	});

	//return exports of the moduleA
	var moduleA = require('moduleA');
});
```

## Importing Other Dependencies


## Preloading Dependencies
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

# Sample Application
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
# Core Reference
This API allows controlling and extending behavior of the loader. API is available through importing special 'core' dependency.
## Functions
### core.setPathVar();
Set path variable that will be resolved when module location is calculated. Path varibles are resolved though a direct substitution.
```javascript
core.setPathVar('{splice.modules}','/lib/SpliceJS.Modules/modules');
```
### core.setLoadingIndicator(indicator);
Sets an object that will receive loader progress status for each item being loaded. See LoadingIndicator in the API Elements section.
```javascript
core.setLoadingIndicator({
	begin:function(fileName){},
	complete:function(fileName){}
});
```
### core.setFileHandler(handler);
```javascript
core.setFileHandler({
	importSpec:function(){},
	load:function(){},

});
```



## Properties
```javascript
core.ImportSpec;
```

```javascript
core.Namespace;
```


# Running Tests
## Simple Import

## Large Module Tree (2000 modules )

# Extending Loader
Below is an example of extending module loader for loading .gif, .png and .jpg files.
Such extension may be used to preload image files. 

```javascript
//myloaderextensions.js
define(['core'],function(core){
	var imageHandler = {
		importSpec : function(filename, stackId){
			return new ImportSpec();
		},
		load:function(filename,loader,spec){
		var img = new Image();
		img.onload = function(){
			loader.onitemloaded(filename);
		}
		img.src = filename;
		}
	}; 


	core.setImportHandler('.gif',imageHandler);
	core.setImportHandler('.png',imageHandler);
	core.setImportHandler('.jpg',imageHandler);
}
```

# Node.js Integration

# TypeScript Integration





