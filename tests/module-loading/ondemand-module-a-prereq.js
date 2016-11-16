define([
    {'Test':'../test-fixture/test-fixture'}
],
function(){
    "use strict";
    var scope = this;
    var test = scope.imports.Test;
    test.log('Loading ondemand-module-a-prereq',true); 
});