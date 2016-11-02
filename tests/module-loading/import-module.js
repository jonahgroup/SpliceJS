define([
    {'Test':'../test-fixture/test-fixture.js'}
],
function(scope){
    "use strict";
    
    var test = scope.imports.Test; 
    test.log('Loading importmodule.js', true);
    
    function sayHi(){
        return true;
    }
    
    scope.imports.$js.load(
        [
          'ondemand-module-b.js',
          'test.js'
        ],
        function(){
           // this.imports.AdhocModule.foo();
            test.log('Inline load adhocmodule2.js from import-module.js',true);    
        }
    );

    scope.exports(
        sayHi
    );
});
