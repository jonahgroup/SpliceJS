sjs({definition:function(sjs){
"use strict";

  /* es 6 classes*/
  class Shape {
      constructor(width, height){
        this.width = width;
        this.height = height;
        this.name = 'shape';
      }

      getName() {
        console.log(this.name);
      }
  };

  class Circle extends Shape {
    constructor(width,height){
      super(width,height);
      this.name = 'circle';
    }

    area(){
      console.log('Circle area');
    }
  };

  class Oval extends Circle {
    constructor(width,height){
        super(width,height);
        this.name = 'oval';
    }

    area(){
      console.log('Oval');
      super.area();
    }
  };

  var shape = new Shape(10,10);
  var circle = new Circle(5,5);
  var oval = new Oval(8,8);

  console.log(shape);
  console.log(circle);
  console.log(oval);


  /* ES.5 classes*/
  function AShape(width, height){
    this.width = width;
    this.height = height;
    this.name = 'shape'
  }

  function ACircle(w,h){
    this.super(w,h);
    this.name = 'circle';
  }
  sjs.extend(ACircle,AShape);


  function AOval(){
    this.super(8,8);
    this.name = 'oval';
  }
  sjs.extend(AOval,ACircle);

  var ashape = new AShape(10,10);
  var acircle = new ACircle(5,5);
  var aoval = new AOval(8,8);

  console.log('-------------------------------');
  console.log(ashape);
  console.log(acircle);
  console.log(aoval);


  /*SJS Class*/
  var Class  = sjs.Class;
  var BShape = Class(function BShape(w,h){
    this.width = w;
    this.height = h;
    this.name = 'BShape';
  });

  var BCircle = Class.extend(BShape)(function BCircle(w,h){
    this.super(w,h);
    this.name = 'BCircle';
  });


  var bshape = new BShape(10,10);
  var bcircle = new BCircle(5,5);


  console.log('-------------------------------');
  console.log(bshape);
  console.log(bcircle);



  /* cross framework*/
  class XShape extends BShape {
    constructor(){
      super(1,1);
      this.name = 'XShape';
    }
  }

  XShape.prototype.constructor = XShape.constructor;

  var xshape = new XShape(10,10);
    console.log('-------------------------------');
  console.log(xshape);

}

});
