$js.module({
prerequisite:[
    {Splash:'../SplashScreens/splash2.js'}
],
imports:[
    'splice.test.components.js'
],definition:function(){
    var Splash = this.imports.Splash;
    Splash.hideSplash();
}
});