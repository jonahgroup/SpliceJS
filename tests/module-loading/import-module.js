$js.module({
//imports:[{'test':'test-modules.js'}],
definition:function(){

    var scope = this;
    console.log('importmodule.js - loaded');
    function sayHi(){
        console.info('Hi i am an importmodule.js');
    }
    
    scope.imports.$js.load(
        [
          'ondemand-module-b.js',
          'test-modules.js'
        ],
        function(){
           // this.imports.AdhocModule.foo();
            console.log('importmodule.js 1. - inline loaded adhocmodule2.js');    
        }
    );

    scope.exports(
        sayHi
    );
    
}});
