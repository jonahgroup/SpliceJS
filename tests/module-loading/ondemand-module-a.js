$js.module({
preload:[
    'ondemand-module-a-prereq.js'
],
imports:[
    {'Test':'../test-fixture/test-fixture.js'}
],
definition:function(scope){
    var test = scope.imports.Test;
    test.log('adhocmodule.js - loaded');
    this.exports(function foo(){
        test.log('adhocmodule.js - Hi! I am function foo');
    });
}});

