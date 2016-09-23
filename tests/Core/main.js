$js.module({
required:[
  {Component:'/{$jshome}/modules/splice.component.js'},
  {Controls : '/{$jshome}/modules/splice.component.controls.js'}
],
definition:function(sjs){
  new this.scope.Component.DocumentApplication(this.scope).run();
}});
