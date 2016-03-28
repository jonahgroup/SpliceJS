global.sjs.module({},
function(scope){
    var log = scope.sjs.log;
    function saySomething(){
        log.info('Hi i an import module');
    }
    
    scope.exports(
        saySomething
    );
    
});