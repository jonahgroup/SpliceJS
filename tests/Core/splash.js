$js.module({
definition:function splash(sjs){

  var document = sjs.document;

  var style = 'position:absolute; top:50%; left:50%; height:33px; width:84px;' +
             'margin-left:-42px;'+
             'background-image:url(\''+sjs.context().resolve('/{$jshome}/resources/images/bootloading.gif').aurl+'\');'+
             'border-bottom:1px solid #7d7d7d;'+
             'background-position:top center;'+
             'background-repeat:no-repeat;' +
             'transition:opacity 0.4s;';

  var spinnerStyle = ''


  function Splash(){
     this.dom = document.createElement('div');
     this.label = document.createElement('div');
     var spinner = document.createElement('div');

     this.dom.appendChild(spinner);
     this.dom.appendChild(this.label);

     this.dom.setAttribute('style',style);

     this.progress = 0;
  }
  Splash.prototype = {
    //doc is a document reference
    show:function(doc){
      sjs.log.info('Splash screen show');
      document.body.appendChild(this.dom);

    },
    hide:function(){
      //return;
      sjs.log.info('Splash screen hide');
      this.dom.style.opacity = 0;
      var dom = this.dom;
      this.dom.addEventListener('transitionend',function(e){
          document.body.removeChild(dom);
      },false);
    },

    update:function(complete,total,itemName){
      var p = Math.round(complete/total*100);
      this.progress = p;
    //  this.label.innerHTML = itemName;

    }
  };

  return Splash;
}})
