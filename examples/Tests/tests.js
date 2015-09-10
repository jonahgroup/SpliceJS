//display button control

sjs().display.overlay(new (sjs('buttons.js')().Button)({content:{label:'This is a test button'}}));
sjs().display.overlay(new (sjs('buttons.js')().CheckBox)());
sjs().display.overlay(new (sjs('buttons.js')().TextField)());
sjs().display.overlay(new (sjs('buttons.js')().RadioButton)());

/* test inheritance */
console.log('--------------------- Inheritance testing ---------------- ');
sjs(function(sjs){
	var Class = sjs.Class;
	
	var A  = Class(function A(){
		this.name = 'this is a'; 	
		console.log('A constructor');
	});
	
	A.prototype.getName = function(){
		console.log('A:getName'); 
		return this.name;
	};

	var B = Class.extend(A)(function B(){
		this.super();
		console.log('B constructor');
	});
	
	B.prototype.getName = function(){
		this.super.getName();
		console.log('B:getName');
	};

	var C = Class.extend(B)(function C(){
		this.super();				
	});	
	
	C.prototype.getName = function(){
		this.super.getName();
		console.log('C:getName');
	}
	
	var a = new A();
	a.getName();
	console.log('-------------------');
	var b = new B();
	b.getName();
	console.log('-------------------');
	var c = new C();
	c.getName();

	return {
	
		test:'test'
	}

});

console.log('--------------------- Data Testing ---------------- ');

sjs({
	required:[
		{'Data':'{sjshome}/modules/splice.data.js'}
	],
	definition:function(sjs){
		
		var data = this.scope.Data.data;
		
		console.log("----- numeric iterator -----");
		var result = data(10).to().current();
		console.log(result);
		
		var si = data(10).to(function(item){return item%2;}).to(function(item){return item*5;});
		
		// iterate over si
		while(si.next(function(item){
			console.log(item);
		}));
		
		
		var result = si.current();
		
		var ai = data(result).to(function(v,k){
			return {k:k, v:v};	
		}).to(function(v,k){
			console.log(v);
			return k;
		});
		
		console.log(ai.current());
	
	
		var obj = {};
		ai.each(function(v,k){
			obj['prop'+v] = v;
		});
		
		console.log(obj);
		
		var bi = data(obj).to(function(v,k){return k; });
		
		console.log(bi.current());
		
	
	}
});

var button = new (sjs('buttons.js')().Button)();
console.log(button);
/*
sjs({
	required:['tests.html'],
	definition:function(){
	
		var tc = new this.scope.components.TestComponent();
		console.log(tc);
	}
});
*/