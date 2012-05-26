//
//	Fractal w/ Worker
//	
//	Daniel Johansson
//	2012-04-11
//	

;(function () {
"use strict";

var Fractal = function ( containerId ) {

	var container = document.getElementById( containerId ),
		wrap = document.createElement('div');
		
	wrap.classList.add( 'wrap' );
	
	// ----- canvas
	this.cnvs = document.createElement('canvas');
	this.width = 500;
	this.height = 500;
	this.cnvs.width = this.width;
	this.cnvs.height = this.height;
	this.ctx = this.cnvs.getContext('2d');
	
	wrap.appendChild( this.cnvs );
	
	// fullscreen button
	this.fullscreenBtn = document.createElement('button');
	this.fullscreenBtn.textContent = 'Fullscreen';
	wrap.appendChild( this.fullscreenBtn );
	
	container.appendChild( wrap );
	
	// ----- Workers!
	this.wrkr = []; 

	// ----- flags/counters
	this.spawnedCount = 0;
	this.doneCount = 0;
	this.renderTimestamp = 0;
	
	this.view = {
		type: 'mandelbrot',
		map: 'gray',
		width:  this.width,
		height: this.height,
		xMid: -0.75,
		yMid: 0,
		scale: 1.3,
		cRe: -0.7588,
		cIm: 0.079,
		nMax: 100
	};
	
	// ----- events for zooming
	this.initEventHandlers();
};
	
Fractal.prototype = {
	draw : function ( width, partSize, offset, lightnessBuf8, colorBuf8 ) {

		var imageData = this.ctx.createImageData(width, partSize),
			data = imageData.data,
			x, y, idx, val, color,
			colorMap = map[this.view.map];

		// supposedly faster, meh...
		// http://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
		
		for ( y = 0; y < partSize; y++ ) {
			for ( x = 0; x < width; x++ ) {
				
				idx = (y * width + x);
				
				// grab value from 8 bit array buffer view
				val = lightnessBuf8[idx];
				
				// grab color index if any
				if (colorBuf8) color = colorBuf8[idx];
				if (color) colorMap = map[ map.names[color] ];
				
				idx *= 4; // 4 bytes per pixel..
				
				data[idx    ] = colorMap[val][0];   // R
				data[idx + 1] = colorMap[val][1];   // G
				data[idx + 2] = colorMap[val][2];   // B					
				data[idx + 3] = 255;                // alpha
			}
		}
		this.ctx.putImageData( imageData, 0, offset );
	},
	handleWorkerResult : function (e) {
		// ignore data if old render
		if ( e.data.timestamp !== this.renderTimestamp ) { console.log('abort'); return; }
		
		this.draw( this.width, e.data.partSize, e.data.offset, e.data.lightness, e.data.color );
		if ( ++this.doneCount === this.spawnedCount ) this.renderComplete();
	},
	render : function () {
		var parts, partSize, partOpt, rest = 0, i,
			view = this.view,
			height = this.height,
			width = this.width;
		
		tic('Total'); // Start timer
		this.renderTimestamp = new Date().getTime();
		
		// reset
		this.spawnedCount = 0; 
		this.doneCount = 0;
		
		// calculate boudaries (scale 2 ==> 4 units wide image)
		view.x1 = view.xMid - view.scale;
		view.x2 = view.xMid + view.scale;
		view.y1 = view.yMid - view.scale * (height / width);
		view.y2 = view.yMid + view.scale * (height / width);
		
		// Determine how many workers to spawn (limit to 16). 
		// 500000 pts/render gives good performance, and drawing times of around 10 ms
		parts = Math.ceil( width * height / 5e5 );
		if ( parts > 16 ) parts = 16;
		
		partSize = Math.floor( height / parts );

		for ( i = 0; i < parts; i++ ) {
			
			// create a new worker
			this.wrkr[i] = new Worker('js/fractal-worker.js');
			
			// if last part, include what's left
			if (i === parts - 2) rest = height - partSize * parts;
			
			// prepare options object
			partOpt = extendObj( {}, view ); // copy
			extendObj( partOpt, {
				partSize: (partSize + rest),
				offset: (i * partSize),
				timestamp: this.renderTimestamp
			});
			
			// action!
			this.wrkr[i].postMessage( partOpt );
			
			// listen for message when done
			this.wrkr[i].addEventListener('message', this.handleWorkerResult.bind(this), false);
			
			this.spawnedCount++;
		}
	},
	renderComplete : function () {
		toc('Total');
		console.log('Render time   :', timers.Total.time/(this.width*this.height)*1000, 'µs/pixel');
		// console.log('Fullscreen    :', timers.Total.time/(this.width*this.height)*screen.width*screen.height/1000, 's');
	},
	zoom : function ( x, y, zoom ) {

		var view = this.view,
			xWorld = (view.x2 - view.x1) / this.width * x + view.x1,
			yWorld = (view.y2 - view.y1) / this.height * y + view.y1,
			x1, x2, y1, y2, 
			
			s = 1 + zoom * 0.1;
		
		if ( s < 0.1 ) s = 0.1;
		if ( s > 2 ) s = 2;
		view.scale *= s;
		
		x1 = view.x1 + (1-s) * (xWorld - view.x1);
		y1 = view.y1 + (1-s) * (yWorld - view.y1);
		
		view.xMid = x1 + view.scale;
		view.yMid = y1 + view.scale * (this.height / this.width);
		
		this.render();
	},
	setSize : function ( width, height ) {
		if ( width > 1 && height > 1 ) {
			this.width  = this.view.width  = this.cnvs.width  = width;
			this.height = this.view.height = this.cnvs.height = height;
		}
	},
	goFullscreen : function () {
		this.setSize( window.screen.width, window.screen.height );
		
		if      ( this.cnvs.requestFullScreen )       this.cnvs.requestFullScreen(); 
		else if ( this.cnvs.mozRequestFullScreen )    this.cnvs.mozRequestFullScreen(); 
		else if ( this.cnvs.webkitRequestFullScreen ) this.cnvs.webkitRequestFullScreen();
		
		this.render();
	},
	initEventHandlers : function () {
	
		var that = this,
			wheelEvent = function (element, callback) {
				if ( element.addEventListener ) {
					element.addEventListener('DOMMouseScroll', callback, false);
					element.addEventListener('mousewheel', callback, false);
				} 
				else if ( element.attachEvent ) {
					element.attachEvent('onmousewheel', callback);
				}
			},
			handleWheelEvent = function (e) {
				e || (e = window.event);
				var raw = e.detail || e.wheelDelta,
					normal = e.detail ? e.detail * -1 : e.wheelDelta / 40,
					
					// relative to page minus offset of itself and parent
					x = e.pageX - e.target.offsetLeft,
					y = e.pageY - e.target.offsetTop;
					
				// Cancel default
				if (e.stopPropagation) e.stopPropagation();
				if (e.preventDefault) e.preventDefault();
				e.cancelBubble = true;
				e.cancel = true;
				e.returnValue = false;
				
				that.zoom( x, y, -normal );
			};
			
		this.cnvs.addEventListener('contextmenu', function (e) {
			e.preventDefault();
		}, false);
		
		// zoom on click
		this.cnvs.addEventListener('mousedown', function (e) {
			
			var x, y, zoom;
			
			// left btn: zoom in, right btn: zoom out
			zoom = (e.which === 3) ? 2 : -2;
			
			// relative to page minus offset of itself and parent
			x = e.pageX - e.target.offsetLeft;
			y = e.pageY - e.target.offsetTop;
			
			that.zoom( x, y, zoom );
		}, false);
		
		// zoom by scrolling
		wheelEvent( this.cnvs, handleWheelEvent );
		
		// pan with keyboard arrows
		document.addEventListener('keydown', function (e) {
			
			var step = (that.view.x2 - that.view.x1) / 20;
			
			switch ( e.which ) {
				case 37:                      // left
					that.view.xMid -= step;
					break;
				case 38:                      // up
					that.view.yMid -= step;
					break;
				case 39:                      // right
					that.view.xMid += step;
					break;
				case 40:                      // down
					that.view.yMid += step;
					break;
				default:
					return;
			}
			
			that.render();
			
		}, false);
		
		// Fullscreen
		this.fullscreenBtn.addEventListener('click', this.goFullscreen.bind(this), false);
	}
};

window.Fractal = Fractal;

})();


// f(x) = (yMax-yMin)/(xMax-xMin)*(x-xMin) + yMin
