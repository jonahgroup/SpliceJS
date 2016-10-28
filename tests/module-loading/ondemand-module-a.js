$js.module({
prerequisite:[
    'ondemand-module-a-prereq.js'
],
definition:function(){
    console.log('adhocmodule.js - loaded');
    this.exports(function foo(){
        console.log('adhocmodule.js - Hi! I am function foo');
    });
}});

