sjs.module({
required:[
  {Component:'/{sjshome}/modules/splice.component.js'},
  {Controls : '/{sjshome}/modules/splice.component.controls.js'}
],
definition:function(sjs){
  new this.scope.Component.DocumentApplication(this.scope).run();
}});
