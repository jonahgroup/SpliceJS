$js.module({
prerequisite:[
    'adhocprerequisite.js'
],
definition:function(){
    console.log('adhocmodule.js - loaded');
    this.exports(function foo(){
        console.log('Hi! I am function foo from adhocmodule.js');
    });
}});