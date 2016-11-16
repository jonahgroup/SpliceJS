define([
    'require',
    {'Test':'../test-fixture/test-fixture'}
],
function(require){
    "use strict";
    var scope = this;

    var test = scope.imports.Test; 
    test.log('Loading importmodule.js', true);
    
    function sayHi(){
        return true;
    }
    
    scope.imports.$js.load(
        [
          'ondemand-module-b',
          'test'
        ],
        function(){
           // this.imports.AdhocModule.foo();
            test.log('Inline load ondemand-module-b from import-module',true);    
        }
    );

    //load into current scope
    require(['ondemand-module-c']).then(function(){
        test.log('promise fullfilled',true);
    });

    require(scope)(['ondemand-module-c']).then(function(){
        test.log('promise fullfilled',true);
    });

    scope.exports(
        sayHi
    );
});
