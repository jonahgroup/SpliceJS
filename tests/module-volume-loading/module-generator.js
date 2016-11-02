
var moduleCount = 500;
var fs = require('fs');

function generateModule(name,dep){
    var imports = '';
    if(dep && dep.length > 0){
        
        var sep = '';
        for(var i=0; i<dep.length; i++){
            imports =  imports + sep +  "{'ns"+i+"':'" + dep[i] + "'}";
            sep = ',';
        }
        imports = '[' + imports+ '],';
    }

    var code = 'define('+imports+'function(scope){});';
    
    fs.writeFile('modules/'+name,code,function(err){
        if(err) {console.log(err); return;}
    });
}



var moduleList = [];
for(var i=0; i<moduleCount; i++){
    var name = 'mod-test-n' + (i+1) + '.js';
    moduleList.push([name,0]);
}



for(var i=0; i<moduleCount; i++){
    //random number of imports
    var imports = Math.round(Math.random()*15,0);
    var dependencies = [];
    for(var j=0; j<imports; j++){
        var randomImport = Math.round(Math.random()*1000,0)%moduleCount;
        dependencies.push(moduleList[randomImport][0]);
    }
    generateModule(moduleList[i][0],dependencies);
}