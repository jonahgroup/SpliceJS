$js.module({
prerequisite:[
    '../module-loading/extension-module.js'
],
imports:[
    {'virtual':'module.virt'}
],
definition:function(){
    var imports = this.scope.imports;
    imports.virtual.virtualCall();
}
});