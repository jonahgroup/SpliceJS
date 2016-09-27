$js.module({
imports:[
  {Inheritance : '/{$jshome}/modules/splice.Inheritance.js'},
  {Core : '/{$jshome}/modules/splice.component.core.js'},
  {Controls : '/{$jshome}/modules/splice.component.controls.js'}
],
definition:function(){

  var scope = this;

  var imports = scope.imports;

  var Class = imports.Inheritance.Class
  ,   ComponentTemplate = imports.Core.Template
  ,   Controller = imports.Core.Controller
  ;

  var DocumentApplication = Class(function DocumentApplication(document,scope){
    this.scope = scope;
    this.document = document;
    if(!this.scope.components)
      this.scope.components = sjs.namespace();
  });

  DocumentApplication.prototype.run =  function(){
    var bodyTemplate = new ComponentTemplate(this.document.body);
    bodyTemplate.compile(this.scope);
    var controller = new Controller();
    bodyTemplate.processIncludeAnchors(this.document.body,controller,this.scope);
    controller.onDisplay();
  };

  scope.exports(
    DocumentApplication, 
    Controller, 
    imports.Core.defineComponents
  );
}});
