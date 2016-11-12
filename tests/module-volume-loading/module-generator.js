
var moduleCount = 2000
,   moduleList = []
,   stack = [];

//file API
var fs = require('fs');

//generates module's body
function generateModule(m){
    var name = m.name;
    var imports = "{'Test':'../../test-fixture/test-fixture.js'},{'ModuleCounter':'../module-counter.js'}";
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

    var body = "";
    for(var i=0; i<2048; i++){
        body += "a";
    }

    var code = 'define('+imports+'function(scope){'+
    
        "scope.imports.Test.log('Loading module "+name+"',true);" +
        "scope.imports.ModuleCounter.ModuleCounter.count();"+

        "var body = '"+body+"';"+
        '});';
    
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


//returns next module fom the list
function getNextItem(start){
    for(var i=start; i<start+moduleList.length; i++){
        if(!moduleList[i%moduleList.length].isVisited) {
            moduleList[i%moduleList.length].isVisited = true;
            return moduleList[i%moduleList.length];
        }
    }
    return null;
}



function buildDependencyTree(root){

    if(root == null){
        root = getNextItem(Math.round(Math.random()*moduleCount));
    }
    
    //get n children    
    for(var i=0; i<Math.round(1+Math.random()*20); i++ ){
        var child = getNextItem(Math.round(Math.random()*moduleCount));
        if(!child) break;
        root.children.push(child);
    }
    
    for(var i=0; i<root.children.length; i++){
        buildDependencyTree(root.children[i]);
    }
        
    return root
}




//generate module names
for(var i=0; i<moduleCount; i++){
    var name = 'mod-test-n' + (i+1) + '.js';
    //name - module name
    //[] - children
    moduleList.push({name:name, cycles:[],children:[],toString:function(){return this.name;}});
}

//build dependency tree
var root = buildDependencyTree();

//print root name
console.log(root.name);

for(var i=0; i<moduleCount; i++){
    generateModule(moduleList[i]);
}

//write test file 
fs.writeFile('./test.js',"define(["+
     "{'Test':'../test-fixture/test-fixture.js'},"+
     "'modules/"+root.name+"'"+
    "],function(scope){})",function(err){
        if(err) {console.log(err); return;}
 });