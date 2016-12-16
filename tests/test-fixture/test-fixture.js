/** 
 * desc: Test fixture module, allow logging output to the document
 * dependencies: none
*/
define([
    (function(loader){
        if(loader.platform == "WEB") return 'test-fixture-web';
            return 'test-fixture-node';
    })(global.require('loader'))
],function(fixture){
    return fixture;
});