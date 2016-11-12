define([
    {'Test':'../test-fixture/test-fixture'}
],
function(scope){
    "use strict";
    var scope = this;
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-b.js',true);
});