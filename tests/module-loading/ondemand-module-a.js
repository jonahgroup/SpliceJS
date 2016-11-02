$js.module({
preload:[
    'ondemand-module-a-prereq.js'
],
imports:[
    {'Test':'../test-fixture/test-fixture.js'}
],
definition:function(scope){
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-a.js',true);
    this.exports(function foo(){
        test.log('Calling function "foo" from ondemand-module-a.js',true);
    });
}});

