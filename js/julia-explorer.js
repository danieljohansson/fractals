
;(function () {
"use strict";

var julia = new Fractal('container');

julia.renderPause = true;

julia.renderComplete = function () {
	// toc('Total');
	// console.log('Render time   :', timers.Total.time/(width*height)*1000, 'µs/pixel');

	if ( julia.mouseXLast === julia.mouseX && julia.mouseYLast === julia.mouseY ) {
		// coordinates are unchanged
		julia.renderPause = true;
	}
	else {
		julia.mouseXLast = julia.mouseX;
		julia.mouseYLast = julia.mouseY;
		
		tic('Total');
		julia.frame();
	}
};

extendObj( julia.view, {
	type: 'julia',
	map: 'red2',
	xMid: 0, yMid: 0,
	scale: 1.7,
	cRe: 0.105,
	cIm: -0.645,
	nMax: 120
});

julia.frame = function () {
	var x1 = mandel.view.xMid - mandel.view.scale,
		x2 = mandel.view.xMid + mandel.view.scale,
		y1 = mandel.view.yMid - mandel.view.scale * (mandel.height/mandel.width),
		y2 = mandel.view.yMid + mandel.view.scale * (mandel.height/mandel.width);
	
	julia.view.cRe = (x2 - x1) / mandel.width * julia.mouseX + x1;
	julia.view.cIm = (y2 - y1) / mandel.height * julia.mouseY + y1;
	
	julia.render();
};

julia.mouseX = 0; 
julia.mouseY = 0;
julia.mouseXLast = 0; 
julia.mouseYLast = 0;

julia.init = function () {

	// listen for mousemove on mandelbrot canvas
	mandel.cnvs.addEventListener('mousemove', function (e) {

		// Keep mouse coordinates updated
		julia.mouseX = e.pageX - e.target.offsetLeft;
		julia.mouseY = e.pageY - e.target.offsetTop;
		
		if ( julia.renderPause ) {
			julia.renderPause = false;
			julia.frame();
		}
		
	}, false);
	
	// start the rendering
	julia.frame();
};


julia.init();

// expose to outer world
window.julia = julia;

})();
