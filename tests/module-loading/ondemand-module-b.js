$js.module({
imports:[
    {'Test':'../test-fixture/test-fixture.js'}
],
definition:function(scope){
    var test = scope.imports.Test;
    test.log('adhocmodule2 - loaded');
}});