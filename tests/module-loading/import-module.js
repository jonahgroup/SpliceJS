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
            test.log('Inline load adhocmodule2.js from import-module.js',true);    
        }
    );

    //promise me this
    require(['ondemand-module-c']).then(function(){
        console.log('promise fullfilled');
    });

    scope.exports(
        sayHi
    );
});
