sjs.module({
/* low level module, does not have any dependencies */  
definition:function(sjs){

    var Class = sjs.Class;

    /**
      A CLass
    */
    var A = Class(function A(){
      console.log('A constructor');
    });

    A.prototype.initialize = function(args){
      console.log('Class A.initialize ' + args );
    };

    A.prototype.onlyA = function(args){
      console.log('This is onlyA method ' + args );
    };


    /**
      B CLass
    */
    var B = Class(function B(){
      this.super();
      console.log('B constructor');
    }).extend(A);

    B.prototype.initialize = function(args){
      this.super(A).initialize('from B');
      console.log('Class B.initialize ' + args );
    }

    B.prototype.onlyA = function(args){
      console.log('onlyA override in B ' + args );
    }

    /**
      C Class
    */
    var C = Class(function C(){
      this.super()
      console.log('C constructor');
    }).extend(B);

    C.prototype.initialize = function(){
      this.super(B).initialize('from C');
      console.log('Class C.initialize');
    };

    C.prototype.onlyA = function(){
      this.super(B).onlyA('called from C');
    }


    /**
      Classic A Class
    */
    function ClassicA(){
      console.log('Classic A constructor');
    }

    ClassicA.prototype.initialize = function(){
      console.log('Classic A initialize');
    };

    var ClassicB = Class(function ClassicB(){
      this.super();
      console.log('Classic B constructor');
    }).extend(ClassicA);

    ClassicB.prototype.initialize = function(){
      this.super(ClassicA).initialize();
      console.log('Classic B initialize');
    }

    function test(){

      console.log('----------------------');
      console.log('Creating instance of A');
      var a = new A();

      console.log('----------------------');
      console.log('Creating instance of B');
      var b = new B();
      b.initialize('hah');
      b.onlyA();

      console.log('----------------------');
      console.log('Creating instance of C');
      var c = new C();
      c.initialize();
      c.onlyA();

      console.log('----------------------');
      console.log('Creating instance of Classic B');
      var cb = new ClassicB();
      cb.initialize();
    }

    sjs.exports.module (
        test
    );

return {test:test}
}});
