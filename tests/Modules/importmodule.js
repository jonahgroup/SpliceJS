$js.module({
required:[{'test':'test-modules.js'}],
definition:function(){

    var scope = this
    ,   log = this.imports.sjs.log;
    
    function saySomething(){
        log.info('Hi i an import module');
    }
    
    scope.exports(
        saySomething
    );
    
}});