_.Module({

required:[
    'modules/splice.controls/splice.controls.chart.htmlt'
],

definition:function(){

var Dial = _.Namespace('SpliceJS.Controls').Class(
function Dial(){
	
    this.dom = this.canvas = this.elements.controlContainer;
	var canvas = this.canvas;
    
    var scale = this.scale ? this.scale : 1;

    this.label  = this.label ? this.label : '%';
    this.size = {width:this.dom.clientWidth, height:this.dom.clientHeight};


	this.ctx = canvas.getContext('2d');
	this.scale = scale;
	
	this.arcStart = 1;
	this.arcEnd = 2*3.1415 - 1;
	this.arcRange = this.arcEnd - this.arcStart;
	
	this.value = this.value?this.value : 80;
	this.alpha = this.arcRange * this.value / 100 + this.arcStart; 
	this._alpha = this.alpha;
	
	var self = this;
	

	canvas.onmouseout = function(e){
		self.draw();
	};
	
	var selectdown = function(e){
		if(!e) e = window.event;
		var d = document;
		
		var config = {};
		
		if(e.touches && e.touches.length > 0){
			var p = JSPositioning.absPosition(canvas);
			config ={mouse:[e.touches[0].clientX-p.x,  e.touches[0].clientY-p.y]};
		}
		else{
			config ={mouse:[e.offsetX - d.body.scrollLeft,  e.offsetY - d.body.scrollTop]};
		}
		
		self.ghost_alpha = Dial.calculateAlpha(config,scale);
		
		var alpha = self.ghost_alpha;
		self.value = Math.round(100 * (self.alpha - self.arcStart) / self.arcRange);
		
		new _.StoryBoard([
            new _.Animation(self._alpha, alpha, 700, _.Animation.cubicEaseInOut, 
            		function(v){
            	self.alpha = v;
            	self.draw();
            }, function(){
            		self._alpha = self.alpha; 
            		self.onchange(self.value);	
            } )
		]).animate();
		
		
		//self.draw();
	};
	this.draw();
	canvas.onmousedown = selectdown;
	canvas.addEventListener( 'touchstart', selectdown,	false );
});

Dial.prototype.dataIn = function(dataItem){
    if(!this.dataPath) return;

    this.value = dataItem[this.dataPath];


    this.value = this.value?this.value : 80;
    this.alpha = this.arcRange * this.value / 100 + this.arcStart; 
    this._alpha = this.alpha;

    this.draw();
};


Dial.Geometry = {
Dial: [
	["#1d1d1f",100],
	["#f5f5f5",96],
	["#313140",90],
	["#f5f5f5",79],
	["#1d1d1f",75],
	["#f5f5f5",71]],
Pivot:[
	["#1d1d1f",11],
	["#f5f5f5",8],
	["#1d1d1f",5]
]};


Dial.calculateAlpha = function(config,scale){
	
	var v1 = [0,-1];
    var v2 = [config.mouse[0] - 100*scale, config.mouse[1] - 100*scale];
    
    var v1_length = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
    var v2_length = Math.sqrt(v2[0]*v2[0] + v2[1]*v2[1]);
     
    var dot = v1[0]*v2[0] + v1[1]*v2[1];
    var alpha = 3.1415-Math.acos(dot/(v2_length*v1_length));
    if(v2[0] > 0) alpha = 2*3.1415 - alpha;
    
    
    if(alpha < 1 ) alpha = 1;
    if(alpha > 2*3.1415-1) alpha = 2*3.1415-1;
    
    return alpha;
	
};

Dial.prototype.draw = function(config){
	
    var ctx = this.ctx;
    var scale = this.scale;
    ctx.save();
    ctx.scale(scale,scale);

    
    
    Dial.Geometry.Dial.forEach(function(item){
    	ctx.fillStyle = item[0];
    	ctx.beginPath();
    	ctx.arc( 100, 100, item[1], 0,2*3.1415);
    	ctx.fill();
    });
    
   
    /* Post threshold marker */
    ctx.save();
    
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#e0c636";
    ctx.arc( 100, 100, 66, this.alpha+1.55,2*3.1415+0.55);
    
    ctx.stroke();
       
   
    ctx.restore();
    
    
    
    /*labels */
    ctx.fillStyle = "#1d1d1f";
    ctx.font = '15px Arial';
    var n = 8;
    
    for(var i=0; i<= n; i++){
        ctx.save();
        ctx.translate(100,100);
        ctx.rotate(1+i*((2*3.1415-2)/(n)));
        ctx.translate(0,50);
        ctx.scale(-1,-1);
        
        var txt = Math.round(i*100/n);
        var metrics = ctx.measureText(txt);
        
        ctx.fillText(txt,0-metrics.width/2,0);
        ctx.fillText(txt,0-metrics.width/2,0);
        ctx.fillText(txt,0-metrics.width/2,0);
        ctx.fillText(txt,0-metrics.width/2,0);
        
      
        ctx.restore();
        
        ctx.save();
        ctx.translate(100,100);
       
       ctx.rotate(1+i*((2*3.1415-2)/n));
       ctx.translate(0,65);
       ctx.fillRect(0,0,3,8);  
        ctx.restore();
    }
    
    
    //Static percent label
    ctx.save();
    ctx.fillStyle = "#1d1d1f";
    ctx.font="20px Arial";
    ctx.translate(100,80);
    
    var txt = this.label;
    var metrics = ctx.measureText(txt);
    
    ctx.fillText(txt,0-metrics.width/2,0);
    ctx.fillText(txt,0-metrics.width/2,0);
  
    ctx.restore();
    
    
    //Draw current label
    ctx.save();
    ctx.fillStyle = "#1d1d1f";
    ctx.font="40px Arial";
    
    ctx.translate(100,150);
    
    var txt = 0;
    if(!config)
    	txt = Math.round(Math.round(100 * (this.alpha - 1)/(2*3.1415-2)));
    else
    	txt = Math.round(Math.round(100 * (this.ghost_alpha - 1)/(2*3.1415-2)));
    
    var metrics = ctx.measureText(txt);
    
    ctx.fillText(txt,0-metrics.width/2,0);
    ctx.fillText(txt,0-metrics.width/2,0);
  
    ctx.restore();
    
    
   
    
    
    /*hand*/
    ctx.fillStyle = "#1d1d1f";
    ctx.save();
    ctx.translate(100,100);
   	ctx.rotate(this.alpha);
    ctx.scale(1,76);
    ctx.beginPath();
    ctx.moveTo(-3,0);
    ctx.lineTo(0,1);
    ctx.lineTo(3,0);
    ctx.fill();
    ctx.restore();
    
    /*pivot*/
    Dial.Geometry.Pivot.forEach(function(item){
    	ctx.fillStyle = item[0];
    	ctx.beginPath();
    	ctx.arc( 100, 100, item[1], 0,2*3.1415);
    	ctx.fill();
    });
    
    ctx.restore();    
    
    if(!config)  return; //no special processing
    
    /* 
     * Draw a ghost hand on mouse move event 
     * 
     * */
    var ghost_alpha = this.ghost_alpha;
    
    ctx.fillStyle = "#F42300";
    ctx.save();
    ctx.scale(scale,scale);
    ctx.translate(100,100);
    ctx.rotate(ghost_alpha);
    ctx.scale(1,76);
    ctx.beginPath();
    ctx.moveTo(-3,0);
    ctx.lineTo(0,1);
    ctx.lineTo(3,0);
    ctx.fill();
    ctx.restore();

};
Dial.prototype.onchange = function(){};

}});
