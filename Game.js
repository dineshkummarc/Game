(function(window, document) {

var tick, tickID,
    prev = (+ new Date),
    current = (+ new Date),
    curTime = Date.now(),
    FPS = 60,
    skipTicks = 1000 / FPS,
    nextGameTick = (new Date).getTime(),
	frame = 0,
	
	stagePos;
	
	
function addEvent(ctx, obj, type, callback) {
	if (arguments.length === 3) {
		callback = type;
		type = obj;
		obj = document;
	}

	//save anonymous function to be able to remove
	var afn = function (e) { 
		var e = e || window.event; 
		callback.call(ctx, e) 
	};

	if (obj.attachEvent) { //IE
		obj.attachEvent('on' + type, afn);
	} else { //Everyone else
		obj.addEventListener(type, afn, false);
	}
}

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function Rect(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

function clone(obj){
    var temp = {}; // changed

    for(var key in obj)
        temp[key] = obj[key];
		
    return temp;
}

//input events
function onPos(e) {
	e = clone(e);
	
	var type;
	
	if(e.type == "mousedown" || e.type == "touchstart")
		type = "Down";
	else if(e.type == "mouseup" || e.type == "touchend")
		type = "Up";
	else
		type = "Click";
	
	e.point = new Point(
		e.clientX - stagePos.x + document.body.scrollLeft + document.documentElement.scrollLeft,
		e.clientY - stagePos.y + document.body.scrollTop + document.documentElement.scrollTop
	);
	
	Game._input(type, e);
}

function onKey(e) {
	e = clone(e);
	Game._input(e.type, e);
}

var Game = {
    _cb: {
        tick: [],
        render: [],
        input: []    
    },

    extend: function(obj) {
        //shallow copy
        for(var key in obj) {
            if(!obj.hasOwnProperty(key)) continue;
            this[key] = obj[key];
        }
    },

    start: function(canvas) {
        this._canvas = canvas;
        this._ctx = canvas.getContext("2d");
		this.width = canvas.width;
		this.height = canvas.height;

        var onFrame = window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    null;

        if (onFrame) {
            tick = function () {
                Game.step();
                tickID = onFrame(tick);
            }

            tick();
        } else {
            tick = setInterval(Game.step, 1000 / FPS);
        }
		
		addEvent(this, canvas, "touchstart", onPos);
		addEvent(this, canvas, "mousedown", onPos);
		addEvent(this, canvas, "touchend", onPos);
		addEvent(this, canvas, "mouseup", onPos);
		addEvent(this, canvas, "keydown", onKey);
		addEvent(this, canvas, "keyup", onKey);
		addEvent(this, canvas, "click", onPos);
		addEvent(this, canvas, "tap", onPos);
		
		addEvent(this, window, "resize", function() {
			stagePos = Game.DOM.inner(canvas);
		});
		
		stagePos = Game.DOM.inner(canvas);
    },

    step: function() {
        var loops = 0;
        var dt = Date.now() - curTime;
        curTime = Date.now();

        if(curTime - nextGameTick > FPS * skipTicks) {
            nextGameTick = curTime - skipTicks;
        }

        while(curTime > nextGameTick) {
            Game._tick(dt, frame++);
            nextGameTick += skipTicks;
            loops++;
        }

        if(loops) {
            Game._render(this._ctx);
        }
    },

    stop: function() {

    },

    _tick: function(dt, frame) {
        var cbs = this._cb.tick,
            i = 0, l = cbs.length;

        for(; i < l; ++i) {
            cbs[i](dt, frame);
        }
    },

    tick: function(cb) {
        this._cb.tick.push(cb);
    },

    _render: function(ctx) {
        var cbs = this._cb.render,
            i = 0, l = cbs.length;

        for(; i < l; ++i) {
            cbs[i](ctx);
        }
    },

    render: function(cb) {
        this._cb.render.push(cb);
    },
	
	_input: function(type, e) {
		var cbs = this._cb.input,
            i = 0, l = cbs.length;

        for(; i < l; ++i) {
            cbs[i](type, e);
        }
	},

    input: function(cb) {
		this._cb.input.push(cb);
    }
};

/**
* DOM features
*/
Game.extend({ DOM: {
	inner: function (obj) {
		var rect = obj.getBoundingClientRect(),
			x = rect.left + (window.pageXOffset ? window.pageXOffset : document.body.scrollTop),
			y = rect.top + (window.pageYOffset ? window.pageYOffset : document.body.scrollLeft),

			//border left
			borderX = parseInt(this.getStyle(obj, 'border-left-width') || 0, 10) || 
					parseInt(this.getStyle(obj, 'borderLeftWidth') || 0, 10) || 0,
					
			borderY = parseInt(this.getStyle(obj, 'border-top-width') || 0, 10) || 
					parseInt(this.getStyle(obj, 'borderTopWidth') || 0, 10) || 0;

		x += borderX;
		y += borderY;

		return { x: x, y: y };
	},
	
	getStyle: function (obj, prop) {
		var result;
		if (obj.currentStyle)
			result = obj.currentStyle[this.camelize(prop)];
		else if (window.getComputedStyle)
			result = document.defaultView.getComputedStyle(obj, null).getPropertyValue(this.csselize(prop));
		return result;
	},

	camelize: function (str) {
		return str.replace(/-+(.)?/g, function (match, chr){ return chr ? chr.toUpperCase() : '' });
	},

	csselize: function (str) {
		return str.replace(/[A-Z]/g, function (chr){ return chr ? '-' + chr.toLowerCase() : '' });
	}
}});

window.Game = Game;

}(window, window.document));