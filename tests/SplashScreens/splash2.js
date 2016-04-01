global.sjs.module({
type:'splash',
definition:function(scope){
  var document = scope.sjs.document;
  
  var style = "position:absolute; left:0px; top:0px; right:0px; bottom:0px; transition:opacity 0.4s;     background-color: rgba(10,10,10,0.8);";

  var wrapStyle ="position:absolute; left:0px; right:0px; top:50%; transition:opacity 0.4s;";

  var spinnerStyle = 'position:absolute; left:50%; height:33px; width:84px;' +
             'margin-left:-42px;'+
             'background-image:url(\''+scope.sjs.context().resolve('/{sjshome}/resources/images/bootloading.gif')+'\');'+
             'border-bottom:1px solid #7d7d7d;'+
             'background-position:top center;'+
             'background-repeat:no-repeat;'
  ;


  var labelStyle = 'font-size:11px; text-align:center; margin-top:50px;';

  function Splash(){
     this.dom = document.createElement('div');
     var wrap = document.createElement('div');
     this.label = document.createElement('div');
     var spinner = document.createElement('div');

     wrap.appendChild(spinner);
     wrap.appendChild(this.label);

     this.dom.appendChild(wrap);

     wrap.setAttribute('style',wrapStyle);
     spinner.setAttribute('style',spinnerStyle);
     this.dom.setAttribute('style',style);
     this.label.setAttribute('style',labelStyle);

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
      //document.body.removeChild(this.dom);
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
      this.label.innerHTML = itemName.substring(itemName.lastIndexOf('/')+1);

    }
  };

  return Splash;
}});