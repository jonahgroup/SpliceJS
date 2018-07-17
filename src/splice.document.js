"use strict";

class EventTarget {
    constructor(){

    }
}

/**
 *
 */
class Node extends EventTarget {
  constructor(name) {
    super();
    this.childNodes = [];
    this.nodeName = name;
  }

  appendChild(child){
    this.childNodes.push(child);
  }
}

/**
 *
 */
class Element extends Node {
  constructor(name) {
    super(name);
    this.attributes = {};
  }
  getAttribute(attrName){
    return this.attributes[attrName];
  }
  setAttribute(attrName, attrValue){
    this.attributes[attrName] = attrValue;
  }
}

/**
 *
 */
var fs = require('fs');
class HTMLHeadElement extends Node {
    constructor(){
        super('head');
    }

    appendChild(child){
        super.appendChild(child);
        if(child instanceof HTMLScriptElement){
            if(child.getAttribute('sjs-start-mode') == 'console') return;
            if(child.src){
                // fs.readFile(child.src, { encoding: 'utf8' }, function (err, data) {
                //     eval(data);
                    
                // });
              document.currentScript = child;
              require(child.src);
              document.currentScript = null;
              setTimeout(function(){
                  child.onload();
              },1);
            }
        }
    }
}


/**
 *
 */
class HTMLBodyElement extends Node {
   constructor(){
       super('body');
   }
}


/**
 *
 */
class HTMLScriptElement extends Element {
    constructor(){
        super('script');
        //callback delegate
        this.onload = null;
    }

    setAttribute(attr,value){
        super.setAttribute(attr,value);
        if(attr == 'src') this.src = value;
    }
}

/**
*/
class Document {
  constructor() {
    this.head = new HTMLHeadElement('head');
    this.body = new HTMLBodyElement('body');
  }

  getElementsByTagName(tagName){
    if(tagName == 'head') return [this.head];
    return [];
  }

  createElement(elementName){
      if(elementName == 'script') {
          return new HTMLScriptElement();
      }
  }
}

/*
  Configure document based on the command line arguments input
*/
var document = new Document();

var script = new HTMLScriptElement('script');

var argOffset = -1;
var check = /splice.js$/;
for(var i=0; i<process.argv.length; i++){
    if(check.test(process.argv[i])){
        argOffset = i;
        argOffset--;
        break;
    }
}

script.setAttribute('src', process.argv[1+argOffset]);

if(argOffset > -1) {
    if(process.argv[2+argOffset] == '--init' || process.argv[2+argOffset] == '-i' ) {
        script.setAttribute('sjs-init',process.argv[3+argOffset]);
        script.setAttribute('sjs-main',process.argv[4+argOffset] || "");
    } else {
        script.setAttribute('sjs-main',process.argv[2+argOffset] || "");
    }
} else {
    script.setAttribute('sjs-main', '');
}

script.setAttribute('sjs-start-mode','console');
document.head.appendChild(script);
module.exports = document;
