define([
    '!preload:ondemand-module-a-prereq.js',
    {'Test':'../test-fixture/test-fixture.js'}
],
function(scope){
    "use strict";
    
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-a.js',true);
    this.exports(function foo(){
        test.log('Calling function "foo" from ondemand-module-a.js',true);
    });

});

