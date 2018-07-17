define([
     '../test-fixture/test-fixture.js'
],function(test){

    var Counter = {
        total:0,
        count:function(){
            this.total++;

            //console.log(this.total);
            if(this.total == 2000) test.log('2000 modules loaded and executed', this.total == 2000);
        }
    }

    
    return    {ModuleCounter:Counter};
    

});