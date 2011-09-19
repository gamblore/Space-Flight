var MAX_INT = 4294967294/2;

var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_SPACE = 32;
var KEY_W = 87;
var KEY_A = 65;
var KEY_S = 83;
var KEY_D = 68;

var KEYS=new Array(KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, KEY_W, KEY_A, KEY_S, KEY_D);

var WIDTH = 800;
var HEIGHT = 600;

var GRID_WIDTH = 800;
var GRID_HEIGHT = 800;

var viewport = Point(-(WIDTH/2), -(HEIGHT/2));
var newViewport = Point(0,0);   // reduce GC stuff
var viewportDelta = Point(0,0);

var TurningSpeed = 1.7;

var nextUID = 1;

var shipImage = new Image();

var drawableList = [];
var maxLayer = 3;

var player;

var KeysDown = {};

function randomRange(x, y) {
	return Math.floor(Math.random() * (y-x + 1) + x);
}

function inArray(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] == value) {
			return true;
		}
	}
	return false;
}

function deleteDrawable(id) {
	for (var i = 0; i < drawableList.length; i++) {
		if (drawableList[i].id == id) {
			console.log("Deleting: "+ drawableList[i].id);
			drawableList.splice(i, 1);
			return;
		}
	}
}

function inViewport(d) {
	if (d.attr.x < viewport.x + WIDTH && d.attr.x + d.attr.w > viewport.x &&
			d.attr.y < viewport.y + WIDTH && d.attr.y + d.attr.h > viewport.y) {
		return true;
	}
	return false;
}

function Attributes(x,y,w,h) {
	var ret = { 
		x: 0,
		y: 0,
		w: 0,
		h: 0
	};
	
	ret.x = typeof(x) != 'undefined' ? x : 0;
  	ret.y = typeof(y) != 'undefined' ? y : 0;
  	ret.w = typeof(w) != 'undefined' ? h : 0;
  	ret.h = typeof(h) != 'undefined' ? w : 0;
  	
  	return ret;
}

function Point(x,y) {
	return {
		x: x,
		y: y
	};
}

function Drawable(nx, ny, nw, nh, nz) {
	var x, y, w, h, z;
	x = typeof(nx) != 'undefined' ? nx : 0;
  	y = typeof(ny) != 'undefined' ? ny : 0;
  	w = typeof(nw) != 'undefined' ? nh : 0;
  	h = typeof(nh) != 'undefined' ? nw : 0;
  	z = typeof(nz) != 'undefined' ? nz : 0;
  	
  	if (z > maxLayer) {
  		maxLayer = z;
  	}
  	
	return {
		id: nextUID++,
		attr: Attributes(x,y,w,h),
		rotx: 0,
		z: z,
		visible: true,
		img: undefined,
		
		contains: function(p) {
			if (p.x >= this.attr.x && p.x <= this.attr.x + this.attr.w && p.y >= this.attr.y && p.y <= this.attr.y + this.attr.h) {
				return true;
			} else {
				return false;
			}
		},
		
		draw: function(ctx) {
			if(this.img != undefined) {
				ctx.save();
					ctx.translate(this.attr.x + this.attr.w/2, this.attr.y + this.attr.h/2);
					if (this.rotx) { 
						ctx.rotate(this.rotx * Math.PI / 180);
					}
					ctx.drawImage(this.img, -this.attr.w/2, -this.attr.h/2);
				ctx.restore();
			}
		}
	};
}

function Bullet(ship) {

	var newx, newy;
	newx = Math.sin(ship.rotx * Math.PI/ 180) * ship.attr.h/2;
	newy = -Math.cos(ship.rotx * Math.PI/ 180) * ship.attr.h/2;
	console.log("rotx: "+ ship.rotx + " x: " + newx + " y:" + newy);
	var bullet = Drawable(ship.attr.x + ship.attr.w/2 + newx + 2, ship.attr.y + ship.attr.h/2 + newy + 1, 2, 10, ship.z);
	bullet.type = "bullet";
	bullet.velocity = Math.max(Math.sqrt(ship.velocity.x*ship.velocity.x + ship.velocity.y*ship.velocity.y)+2, 6);
	bullet.rotx = ship.rotx;
	bullet.dirx = newx;
	bullet.diry = newy;
	bullet.life = 100;
	
	bullet.draw = function(ctx) {
		ctx.save();
			ctx.fillStyle = "rgb(255,255,255)";
			
			ctx.translate(this.attr.x + this.attr.w/2, this.attr.y + this.attr.h/2);
			if (this.rotx) { 
				ctx.rotate(this.rotx * Math.PI / 180);
			}
			ctx.fillRect(-this.attr.w/2-1, -this.attr.h/2-1, this.attr.w, this.attr.h);
		ctx.restore();
	};
	
	bullet.update = function() {
		this.attr.x += Math.sin(this.rotx * Math.PI/180) * this.velocity;
		this.attr.y -= Math.cos(this.rotx * Math.PI/180) * this.velocity;
		
		this.life--;
		if (this.life == 0) {
			deleteDrawable(this.id);
		} 
	};
	
	return bullet;
}

function Ship(x, y) {
	var ship = Drawable(x, y, 41, 43);
	ship.img = shipImage;
	ship.type = "ship";
	ship.velocity = Point(0,0);
	
	ship.impulse = function() {
		this.velocity.x += Math.sin(this.rotx * Math.PI/180) * 0.1;
		this.velocity.y += Math.cos(this.rotx * Math.PI/180) * 0.1;
	};
	
	ship.update = function() {
		this.attr.x += this.velocity.x;
		this.attr.y -= this.velocity.y;
	};
	
	return ship;
}

function init() {
	console.log("Init()");
	
	shipImage.src = "ship.png";
	
	player = new Ship(0, 0);
	player.z = 2;

	drawableList.push(player);
	
	setInterval(tick, 10);
	Event.observe(document, 'keydown', onKeyDown);
	Event.observe(document, 'keyup', onKeyUp);
	//Event.observe($('screen'), 'mousedown', onMouseDown);
	//Event.observe($('screen'), 'mouseup', onMouseUp);
	
	
}

function findMinIndex(array) {
	var min = array[0];
	var minIndex = 0;
	for (var i = 1; i < array.length; i++) {
		if (array[i] < min) {
			minIndex = i;
			min = array[i];
		}
	}
	return minIndex;
}


function onKeyDown(event) {
    //console.log(event.keyCode);
	if (inArray(event.keyCode, KEYS)) {
		KeysDown[""+event.keyCode] = 1;
		event.preventDefault();
		return true;
	}
}

function onKeyUp(event) {
	if (inArray(event.keyCode, KEYS)) {
		KeysDown[""+event.keyCode] = 0;
		event.preventDefault();
		return true;
	}
}


function tick() {

	if (KeysDown[""+KEY_UP] || KeysDown[""+KEY_W]) {
		player.impulse();
	}
	
	if (KeysDown[""+KEY_DOWN]  || KeysDown[""+KEY_S]) {
		player.velocity.x = 0;
		player.velocity.y = 0;
	}
	
	if (KeysDown[""+KEY_LEFT]  || KeysDown[""+KEY_A]) {
		player.rotx = player.rotx - TurningSpeed < 0 ? player.rotx -TurningSpeed + 360 : player.rotx - TurningSpeed;
	}
	if (KeysDown[""+KEY_RIGHT]  || KeysDown[""+KEY_D]) {
		player.rotx = player.rotx + TurningSpeed < 360 ? player.rotx +TurningSpeed : player.rotx + TurningSpeed - 360;
	}
	if (KeysDown[""+KEY_SPACE]) {
		drawableList.push(Bullet(player));
		KeysDown[""+KEY_SPACE] = 0;
	}
	
	for(var i = 0; i < drawableList.length; i++) {
		if (drawableList[i].update) {
			drawableList[i].update();
		}
	}
	
	
	newViewport.x = player.attr.x+(player.attr.w/2)-(WIDTH/2);
	newViewport.y = player.attr.y+(player.attr.h/2)-(HEIGHT/2);
	
	viewportDelta.x = newViewport.x - viewport.x;
	viewportDelta.y = newViewport.y - viewport.y;
	
	viewport.x = newViewport.x;
	viewport.y = newViewport.y;
	
	draw();
	
}

var m_w, m_z;
function seedStarRandom(x,y) {
	m_w = Math.floor(x); if( m_w == 0 ) m_w = 1;
	m_z = Math.floor(y); if( m_z == 0 ) m_z = 1;
}

function starRandom() {
	m_z = 36969 * (m_z & 65535) + (m_z >> 16);
	m_w = 18000 * (m_w & 65535) + (m_w >> 16);
	return (((m_z << 16) + m_w) & 0x7fffffff) / MAX_INT;  /* 32-bit result */


}

function starRandomRange(x,y) {
	return Math.floor(starRandom() * (y-x + 1) + x);
}

var starBlurLine = Point(0,0);

function drawStarsForGrid(ctx, gridx, gridy, fac, starLevel) {
		
	seedStarRandom(gridx + (starLevel*13), gridy + (starLevel*7));
	
	var lineLen = Math.sqrt(viewportDelta.x * viewportDelta.x + viewportDelta.y * viewportDelta.y);
	if( lineLen == 0.0) lineLen = 1;
	
	// Normalize
	starBlurLine.x = viewportDelta.x / lineLen;
	starBlurLine.y = viewportDelta.y / lineLen;
	lineLen = Math.max(0, lineLen - 15) * fac;

    var starAlpha = 1.0-Math.min(1.0, (Math.max(0, lineLen / 5)));
    
	//var numStars = starRandomRange(45, 100);
	var numStars = starRandomRange(15, 30);
    var drawLine = lineLen > 0;
    
    
	for (var i = 0; i < numStars; i++) {
		//var position = Point(starRandomRange(gridx*GRID_WIDTH, (gridx+1)*GRID_WIDTH),
		//	starRandomRange(gridy*GRID_HEIGHT, (gridy+1)*GRID_HEIGHT));
		
		var position = Point(starRandom() * GRID_WIDTH, starRandom() * GRID_HEIGHT);
				
		var rotation = starRandomRange(0, 359);
		var level = Math.round(starRandomRange(220,255) * fac * 0.7);
		var width = starRandomRange(1,3);
		var height = starRandomRange(1,3);
		    ctx.globalAlpha = starAlpha;
		    //ctx.save();
			    ctx.fillStyle = "rgb("+level+","+level+","+level+")";
			    
			    //ctx.translate(position.x, position.y);
			    //ctx.rotate(rotation * Math.PI / 180);
			    //ctx.fillRect(-width/2, -height/2, width, height);
			    ctx.fillRect(position.x-width/2, position.y-height/2, width, height);
		    //ctx.restore();
		    
		if( drawLine ){
		    
		    ctx.save();
		        ctx.globalAlpha = 1.0;
                ctx.strokeStyle="rgb("+level+","+level+","+level+")";
		        ctx.translate(position.x, position.y);
			    ctx.beginPath();
			    ctx.moveTo(0,0)
			    ctx.lineTo( starBlurLine.x * lineLen, starBlurLine.y * lineLen );
			    ctx.stroke();
		    ctx.restore();
		}
	}
}
var lastGrid = Point(0,0);
function drawStars2(ctx, c, starLevel ){
	//var grid = Point(Math.floor(viewport.x*c/GRID_WIDTH)+1, Math.floor(viewport.y*c/GRID_HEIGHT)+1);
	  var grid = Point(Math.floor(viewport.x*c/GRID_WIDTH), Math.floor(viewport.y*c/GRID_HEIGHT));
	/*
	// debug stats about what grid you're in
	
	if( c == 1.0 && (grid.x != lastGrid.x || grid.y != lastGrid.y) )
	    console.log(grid.x + " " + grid.y);
	   
	   if( c == 1.0 ) lastGrid = grid;
	  */
	   
	/*
	//real layers
	for (var i = -1; i < 2; i++) {
		for (var j = -1; j < 2; j++) {
			if (grid.x +i > 0 && grid.y > 0) {
				drawStarsForGrid(ctx,grid.x+i, grid.y+j);
			}		
		}
	}*/
	
	//parallax layers
	ctx.save();
		//ctx.translate(viewport.x-(viewport.x*c), viewport.y-(viewport.y*c));
		ctx.translate(-viewport.x*c, -viewport.y*c);
		var gx, gy;
		for (var i = -1; i < 2; i++) {
			for (var j = -1; j < 2; j++) {

			    gx = grid.x + i;
			    gy = grid.y + j;
			    
			    if( (gx + 1) * GRID_WIDTH < viewport.x * c) continue;
			    if( gx * GRID_WIDTH > viewport.x *c + WIDTH ) continue;

			    if( (gy + 1) * GRID_HEIGHT < viewport.y * c) continue;
			    if( gy * GRID_HEIGHT > viewport.y * c + HEIGHT ) continue;
			    
				//if (grid.x +i > 0 && grid.y > 0) {
				    ctx.save();
				    ctx.translate( gx * GRID_WIDTH, gy * GRID_HEIGHT );
					drawStarsForGrid(ctx, gx, gy, c, starLevel);
					ctx.restore();
				//}		
			}
		}
	ctx.restore();

}
function drawStars(ctx) {
 //drawStars2(ctx, 1, 5 );
 var l = 1;
    for( var c = 0.2, l=0; c < 1.1; c += 0.1, l++ ){
        drawStars2(ctx, c, l )
    }
}

function draw() {
	var screen = $('screen');
	var ctx = screen.getContext('2d');
	
	
	ctx.fillRect(0,0,screen.width,screen.height); 
	ctx.save();
		//ctx.translate(-viewport.x, -viewport.y);
		drawStars(ctx);
		ctx.translate(-viewport.x, -viewport.y);
		for(var layer = 0; layer < maxLayer; layer++) {
			for(var i=0; i < drawableList.length; i++) {
				var elm = drawableList[i];
				if (elm.visible && elm.z == layer && inViewport(elm) ) {
					elm.draw(ctx);
				}
			}
		}
	ctx.restore();
	
	
}