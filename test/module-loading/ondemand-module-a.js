define([
    'preload|ondemand-module-a-prereq',
    '../test-fixture/test-fixture'
],
function(a, test){
    "use strict";
    test.log('Loading ondemand-module-a.js',true);
    
    return {
        foo:function(){
            test.log('Calling function "foo" from ondemand-module-a.js',true);
        }
    }
});

