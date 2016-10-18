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
          'adhocmodule2.js'
        ],
        function(){
           // this.imports.AdhocModule.foo();
            console.log('Pseudo import callback from importmodule.js');    
        }
    );


    scope.exports(
        sayHi
    );
    
}});