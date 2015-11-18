sjs({
  required:['splash.screen.html'],
  definition:function(sjs){
    var Class = sjs.Class;


    var TestSplash = Class(function SplashScreenController(){
      this.super();
      this.percentComplete = 0;
    }).extend(sjs.SplashScreenController);

    TestSplash.prototype.update = function(total, complete, itemName){

      var p = Math.round(complete/total*100);
      //if(this.percentComplete < p)
      this.percentComplete = p;

      this.views.label.content(''+this.percentComplete).replace();

    };



    sjs.exports.scope(
        TestSplash
    );

    sjs.exports.module(
        TestSplash
    );



  }
})
