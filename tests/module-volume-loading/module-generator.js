
var moduleCount = 60
,   moduleList = []
,   stack = [];

//file API
var fs = require('fs');

//generates module's body
function generateModule(m){
    var name = m.name;
    var imports = "{'Test':'../../test-fixture/test-fixture.js'}";
    if(m && m.children.length > 0){        
        var sep = ',';
        for(var i=0; i<m.children.length; i++){
            if(m.cycles[i] == true) {
                console.log('Cycle reference  - skipping');
                continue;
            }
            imports =  imports + sep +  "{'ns"+i+"':'" + m.children[i].name + "'}";
        }
    }

    imports = '[' + imports+ '],';

    var code = 'define('+imports+'function(scope){'+
    
        "scope.imports.Test.log('Loading module "+name+"',true);"
    
    +'});';
    
    fs.writeFile('./modules/'+name,code,function(err){
        if(err) {console.log(err); return;}
    });
}
/**
 * Checks for cycles on the stack
 */
function isCycle(name){
    for(var i=0; i<stack.length; i++){
        if(stack[i].name == name) return true;
    }
}

function resolveCycles(m){
    if(!m || !m.children) return;
    stack.push(m);
    for(var i = 0; i < m.children.length; i++){
        var child = m.children[i];
        if(isCycle(child.name)){
            //console.log('Detected cycle');
            //console.log(i);
            m.cycles[i] = true;
            continue;
        }
        resolveCycles(child); 
    }
    stack.pop();
}



//generate module names
for(var i=0; i<moduleCount; i++){
    var name = 'mod-test-n' + (i+1) + '.js';
    //name - module name
    //[] - children
    moduleList.push({name:name, cycles:[],children:[],toString:function(){return this.name;}});
}

/**
 * 
 */
function getNextItems(list,size){
    var result = [];
    var start = Math.round(Math.random()*list.length,0)%list.length;
    for(var i=start; i < start+list.length; i++){
        var item = list[i % list.length];
        if(item.visited) continue;
        
        item.visited = true;
        result.push(item);
        if(result.length >= size) return result;
    }
    if(result.length == 0) return null;
    return result;
}

function buildDependencyTree(list){

    Math.round(Math.random()*moduleCount,0)

}

var item =null;
while(item = getNextItems(moduleList,10)){
    console.log(item);
}

//generate random dependencies
// for(var i=0; i < moduleCount/4; i++){
//     //random number of imports
//     var imports = Math.round(Math.random()*moduleCount,0);
//     var children = [];
//     for(var j=0; j<imports; j++){
//         var randomImport = Math.round(Math.random()*1000,0)%moduleCount;
//         //do not add itself as a dependency
//         if(randomImport == i) continue;
//         children.push(moduleList[randomImport]);
//     }
//     moduleList[i].children = children;    
// }

//remove cycles
// for(var x=0; x < moduleList.length; x++){
// }
// var root = buildDependencyTree(moduleList); 

// resolveCycles(moduleList[1]);
// console.log(moduleList[1].name);
// //write module files
// for(var i = 0; i < moduleList.length; i++){
//     generateModule(moduleList[i]);
// }
