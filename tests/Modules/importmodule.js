$js.module({
//imports:[{'test':'test-modules.js'}],
definition:function(){

    var scope = this;
    
    function saySomething(){
        console.info('Hi i am an import module');
    }
    
    scope.exports(
        saySomething
    );
    
}});