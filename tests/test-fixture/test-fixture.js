/** 
 * desc: Test fixture module, allow logging output to the document
 * dependencies: none
*/
!function(loader){
    loader.setVar('{test-fixture}','test-fixture-web');
}(require('loader'));

define(['{test-fixture}'],function(fixture){
    return fixture;
});