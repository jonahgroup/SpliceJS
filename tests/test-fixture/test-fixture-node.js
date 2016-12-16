define(function(){
    return {log:function(text,result){
        if(result === true){console.log(text + ' - OK');}
        else console.log(text + ' - Fail');
    }}
});