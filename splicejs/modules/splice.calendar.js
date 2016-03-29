/* global sjs*/
sjs.module(
function(scope){

  function date(d){
    return {
      reverseUTC:function(){
        //getTimezoneOffset returns value in minutes
        return date(new Date(d.getTime() + d.getTimezoneOffset()*60*1000));
      },

      firstOfTheMonth:function(){
        var ms = (d.getDate() - 1) * 24 * 3600 * 1000;
        return date(new Date(d.getTime() - ms ));
      },
      date:d
    }
  }


});
