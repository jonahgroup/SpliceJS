define([
    'require',
    '../test-fixture/test-fixture'
],
function(require,test){
    "use strict";
    var scope = this;
 
    test.log('Loading importmodule.js', true);
    
    function sayHi(){
        return true;
    }
    
    require(
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
    require(['ondemand-module-c'],function(){
        test.log('promise fullfilled',true);
    });

    require(['ondemand-module-c'],function(){
        test.log('promise fullfilled',true);
    });

    return {
        sayHi : sayHi
    };
});
