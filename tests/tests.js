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
		{'Data':'{$jshome}/modules/splice.data.js'}
	],
	definition:function(sjs){
		var scope = this.scope;
		var data = this.scope.Data.data;
		
		console.log("----- numeric iterator -----");
		var result = data(10).array();
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
		
		sjs.load([{'Applets':'{$jshome}/modules/splice.controls/splice.controls.buttons.js'}])(
			function(){
				var v = new scope.Applets.Button();
				console.log(v);	
			}
		);


		var i = data(100).to(function(v,k,i){})
		console.log(i.length);
		
		var p = data(data(100).array()).page(10).to(function(item){return item/2;});
		
		console.log(p.array());
		
		
		//p.next();		
		// while(p.next(function(item){
		// 	var a = item.array();
		// 	console.log(a);
		// }));
		
		
		var d = data(100); //wrapped array
		var a = d.array(); //plain array

		var time_each = 0; 
		for(var i=0; i< 100; i++){		
		time_each += sjs.timing(function(){
			var k=0;
			d.each(function(item){
				k++;
				k--;
			});
		});
		}
		time_each = time_each / 100;

		var time_plain =0;
		for(var j=0; j< 100; j++){	
		 time_plain +=sjs.timing(function(){
			var k=0;
			for(var i = 0; i < a.length; i++){
				k++; k--;
			}
		});
		}
		time_plain = time_plain / 100;
		
		console.log("Pl: " + Math.floor(1000*time_plain));
		console.log("Ea: " + Math.floor(1000*time_each));
		
		
		
		
		/*
		while(fi.next(function(item){
			console.log(item.array());		
		}));
		console.log(fi.array());
		*/
		

		
		/*
		data('data.svc/somehting').frame().next()
		*/
	}
});


