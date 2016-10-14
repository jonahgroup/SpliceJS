$js.module({
//imports:[{'test':'test-modules.js'}],
definition:function(){

    var scope = this;
    
    function sayHi(){
        console.info('Hi i am an importmodule.js');
    }
    
    scope.exports(
        sayHi
    );
    
}});