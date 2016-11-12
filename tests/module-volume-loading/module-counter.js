define([
     {'Test':'../test-fixture/test-fixture.js'}
],function(scope){

    var Counter = {
        total:0,
        count:function(){
            this.total++;

            console.log(this.total);
            if(this.total == 2000) alert(this.total + ' modules loaded and executed');
        }
    }

    scope.exports(
        {ModuleCounter:Counter}
    );

});