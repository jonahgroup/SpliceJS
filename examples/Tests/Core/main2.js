sjs.module({
type:'component'
,
required:[
  {Inheritance: '/{sjshome}/modules/splice.inheritance.js'},
  {Component:'/{sjshome}/modules/splice.component.js'},
  {Controls : '/{sjshome}/modules/splice.component.controls.js'},
  'main2.html'
]
,
definition:function(sjs){

    var
      scope = this.scope
    ;

    var
      Class = scope.Inheritance.Class
    ;

    var MainController = Class(function MainController{

    }).extend();

    new this.scope.Component.DocumentApplication(this.scope).run();


}});
