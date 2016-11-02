define([
    {'Test':'../test-fixture/test-fixture.js'}
],
function(scope){
    "use strict";
    
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-b.js',true);
});