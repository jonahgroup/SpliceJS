sjs.module({// this function causes stack overflow
/*
function AnimationLoop(callback){
	if(!callback()) return;
	window.requestAnimationFrame(AnimationLoop(callback));
}
*/
definition:function(){
	"use strict";

	//extends the instance of the library
	function AnimationLoop(callback){

		var fn = function(){
			if(!callback()) {callback = null; return;}
			if(!window.requestAnimationFrame) setTimeout(fn, 1000/60);
			else requestAnimationFrame(fn); //this is a nonblocking call
		};

		fn();
	};


	/* supports story board animation */
	function StoryBoard(animations){
		this.animationset = animations;
		this.clock = 0;
	};

	/* one step of the animation */
	StoryBoard.prototype.frame = function(){

		var result = false;
		if(this.animationset)
		for(var i=0; i< this.animationset.length; i++){
			result = result | this.animationset[i].frame(this.clock*1000/60);
		}

		this.clock++;
		return result;
	};

	StoryBoard.prototype.animate = function(){
		var sb = this;
		AnimationLoop(function(){
			if(!sb.frame()) {sb = null; return false;}
			return true;
		});
	};



	function Animation(from, to, ms, fn, callback, oncomplete){
		this.from = from;
		this.to = to;
		this.callback = callback;
		this.oncomplete = oncomplete;
		this.duration = ms; //duration is milliseconds
		this.fn = fn;
		this.progress = 0; //indicate percent completion for the animation 0-1
	};

	Animation.prototype.frame = function(time){
		if(this.progress == 1) return false;

		var current = this.fn(this.from, this.to - this.from, time, this.duration);
		this.callback(current[0]);

		/*animation is complete */
		if(current[1] == 1) {
			this.progress = 1;
			if(this.oncomplete) this.oncomplete();
			return false;
		};

		return true;
	};


	Animation.linear = function(origin, distance, time, duration){
		time = time / duration;
		if(time >= 1) time = 1;
		return [distance * time + origin, time] ;
	};


	Animation.easeIn = function(origin, distance, time, duration){
		time = time / duration;
		if(time >= 1) time = 1;
		return [distance * time * time + origin, time] ;
	};

	Animation.cubicEaseIn = function(origin, distance, time, duration){
		time = time / duration;
		if(time >= 1) time = 1;
		return [distance * time * time * time + origin, time] ;
	};



	Animation.easeOut = function(origin, distance, time, duration){
		time = time / duration;
		if(time >= 1) time = 1;
		return [-distance * (time * (time-2)) + origin, time] ;
	};


	Animation.cubicEaseInOut = function(origin, distance, time, duration){

		time = time / (duration/2);
		if (time < 1) return [distance/2*time*time*time + origin,time];
		time -= 2;

		return [distance/2*(time*time*time + 2) + origin,time>=0?1:0];
	};

	Animation.bezier = function(origin, distance, time, duration){
		var t = time / duration;
		var p1 = -distance * 1.5;
		var p2 = distance * 1.5;
		if(t >= 1) t = 1;
		return [origin + (3*(1-t)*(1-t)*t*p1 + 3*(1-t)*t*t*p2 + t*t*t*distance),t];
	};



	var Animate = function(obj){
		if(!obj) return;

		var objStyle = obj.style;

		return {
			opacity:function(from, to, duration,oncomplete){
			new StoryBoard([
			new Animation(from,  to, duration, Animation.cubicEaseIn,
					function(value){
							objStyle.opacity = value * 0.1 / 10;
						},
					oncomplete
				)]).animate();

			},

			width:function(from, to, duration,oncomplete){
			new StoryBoard([
			new Animation(from,  to, duration ? duration: 300, Animation.cubicEaseInOut,
					function(value){
						objStyle.width = value+'px';
					},
					oncomplete
				)]).animate();
			}
		}
	}

	//module exports
	this.exports(
		StoryBoard, Animation, Animate
	);
}});
