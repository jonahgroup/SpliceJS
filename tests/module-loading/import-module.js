$js.module({
imports:[{'Test':'../test-fixture/test-fixture.js'}],
definition:function(scope){
    
    var test = scope.imports.Test; 
    test.log('importmodule.js - loaded');
    function sayHi(){
        test.log('Hi i am an importmodule.js');
    }
    
    scope.imports.$js.load(
        [
          'ondemand-module-b.js',
          'test-modules.js'
        ],
        function(){
           // this.imports.AdhocModule.foo();
            test.log('importmodule.js 1. - inline loaded adhocmodule2.js');    
        }
    );

    scope.exports(
        sayHi
    );
    
}});
