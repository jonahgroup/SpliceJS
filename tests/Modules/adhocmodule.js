$js.module({
prerequisite:[
    'adhocprerequisite.js'
],
definition:function(){
    console.log('adhocmodule.js - loaded');
    this.exports(function foo(){
        console.log('adhocmodule.js - Hi! I am function foo');
    });
}});

