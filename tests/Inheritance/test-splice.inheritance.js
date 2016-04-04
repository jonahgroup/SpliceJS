global.sjs.module({
required:[
    {Inheritance:'/{sjshome}/modules/splice.inheritance.js'}    
]
,  
definition:function(scope){
    
    var sjs = scope.sjs
    ,   imports = scope.imports
    ,   log = scope.sjs.log;
    
    
    var Class = imports.Inheritance.Class;

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
      this.base();
      console.log('B constructor');
    }).extend(A);

    B.prototype.initialize = function(args){
      this.base(A).initialize('from B');
      console.log('Class B.initialize ' + args );
    }

    B.prototype.onlyA = function(args){
      console.log('onlyA override in B ' + args );
    }

    /**
      C Class
    */
    var C = Class(function C(){
      this.base()
      console.log('C constructor');
    }).extend(B);

    C.prototype.initialize = function(){
      this.base(B).initialize('from C');
      console.log('Class C.initialize');
    };

    C.prototype.onlyA = function(){
      this.base(B).onlyA('called from C');
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
      this.base();
      console.log('Classic B constructor');
    }).extend(ClassicA);

    ClassicB.prototype.initialize = function(){
      this.base(ClassicA).initialize();
      console.log('Classic B initialize');
    }



    /**
     * Interface implementation
     * 
    */
    var Interface = imports.Inheritance.Interface;
    
    var ITest = new Interface({
        ITest:{
            testOne: function(){},
            testTwo: function(){}
        }
    }); 


    var D = Class(function D(){
        
    }).extend(A).implement(ITest);


    D.prototype.testOne = function(){}
    


    function test(){

        log.log('----------------------');
        log.info('Creating instance of A');
        var a = new A();

        log.log('----------------------');
        log.info('Creating instance of B');
        var b = new B();
        b.initialize('hah');
        b.onlyA();

        log.log('----------------------');
        log.info('Creating instance of C');
        var c = new C();
        c.initialize();
        c.onlyA();

        log.log('----------------------');
        log.info('Creating instance of Classic B');
        var cb = new ClassicB();
        cb.initialize();
      
      
        log.log('----------------------');
        log.info('Testing interface implementation');
        var d = new D(); 

        try {
            d.testOne();
            log.log('Interface implementation testOne, implemented - OK');            
        } catch(ex){
            log.error('Unexpected error: testOne is not implemented in D - Fail' );
        }

      
        try {
            d.testTwo();
            log.error('Unexpected error: testTwo is implemented in D - Fail' );
        } catch(ex){
            log.log('Interface implementation testTwo, not implemented   - OK' );
        }
    }

    test();


}});
