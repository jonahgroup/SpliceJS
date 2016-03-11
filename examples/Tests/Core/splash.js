sjs.module({
definition:function splash(sjs){

  function Splash(){

  }
  Splash.prototype = {
    //doc is a document reference
    show:function(doc){
      sjs.log.info('Splash screen show');
    },
    hide:function(){
      sjs.log.info('Splash screen hide');
    },
    update:function(){

    }
  };

  return Splash;
}})
