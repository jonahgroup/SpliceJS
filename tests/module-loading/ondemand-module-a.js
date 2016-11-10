define([
    '!preload:ondemand-module-a-prereq',
    {'Test':'../test-fixture/test-fixture'}
],
function(scope){
    "use strict";
    
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-a.js',true);
    this.exports(function foo(){
        test.log('Calling function "foo" from ondemand-module-a.js',true);
    });

});

