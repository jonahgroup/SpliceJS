sjs.module({
required:[
  {Component:'/{sjshome}/modules/splice.component.js'},
  {Controls : '/{sjshome}/modules/splice.component.controls.js'},
  'main2.html'
],
definition:function component(sjs){
  new this.scope.Component.DocumentApplication(this.scope).run();
}});
