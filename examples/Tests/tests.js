//display button control

sjs().display.overlay(new (sjs('buttons.js').Button)({content:{label:'This is a test button'}}));
sjs().display.overlay(new (sjs('buttons.js').CheckBox)());
sjs().display.overlay(new (sjs('buttons.js').TextField)());
sjs().display.overlay(new (sjs('buttons.js').RadioButton)());

/* test inheritance */
sjs(function(){
	var Class = this.Class;
	
	var A  = Class(function A(){
		this.name = 'this is a'; 	
	});
	
	A.prototype.getName = function(){
		console.log('A:getName'); 
		return this.name;
	};

	var B = Class.extend(A)(function B(){
		this.super();
	});
	
	B.prototype.getName = function(){
		this.super.getName();
		console.log('B:getName');
			
	};

	var C = Class.extend(B)(function C(){
		//this.super();				
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

console.log('--------------------- break between modules ---------------- ');

sjs(function(){
	var fn = Function('var binding = arguments[0].Binding; var scope = this; var Obj = arguments[0].Obj; return binding;');
	var result = fn.call(this,this);
	console.log(result);
	return {
		test:'Test2'
	}
});