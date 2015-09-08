//display button control

sjs().display.overlay(new (sjs('buttons.js').Button)({content:{label:'This is a test button'}}));
sjs().display.overlay(new (sjs('buttons.js').CheckBox)());
sjs().display.overlay(new (sjs('buttons.js').TextField)());
sjs().display.overlay(new (sjs('buttons.js').RadioButton)());

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
		
		var data = this.scope.Data;
		
		console.log("----- numeric iterator -----");
		var result = data.data(10).to().current();
		console.log(result);
		
		var result = data.data(10).to(function(item){return item%2;}).to(function(item){return item*5;}).current();
		console.log(result);
		
		var itr = data.data(10).to(function(item){return item%2;}).to(function(item){return item*5;});
		itr.next(function(item){console.log(item);});
	}
});