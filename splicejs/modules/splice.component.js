sjs.module({
required:[
  {Inheritance : '/{sjshome}/modules/splice.Inheritance.js'},
  {Core : '/{sjshome}/modules/splice.component.core.js'},
  {Controls : '/{sjshome}/modules/splice.component.controls.js'}
]},
function(scope){


  var
    Class = scope.imports.Inheritance.Class
    ComponentTemplate = scope.imports.Core.Template
    Controller = scope.imports.Core.Controller
  ;

  var DocumentApplication = Class(function DocumentApplication(_scope){
    this.scope = _scope;
    if(!this.scope.components)
      this.scope.components = sjs.namespace();
  });

  DocumentApplication.prototype.run =  function(){
    var bodyTemplate = new ComponentTemplate(sjs.document.body);
    bodyTemplate.compile(this.scope);
    var controller = new Controller();
    bodyTemplate.processIncludeAnchors(sjs.document.body,controller,this.scope);
    controller.onDisplay();
  };

  scope.exports(
    DocumentApplication, Controller
  );


});
