$js.module({
imports:[
    {'Test':'../test-fixture/test-fixture.js'}
],
definition:function(scope){
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-b.js',true);
}});