$js.module({
preload:[
    '../module-loading/extension-module.js'
],
imports:[
    {'virtual':'module.virt'}
],
definition:function(){
    var imports = this.imports;
    imports.virtual.virtualCall();
}
});