
// ----- ENGAGE!!
// var mandel = new Fractal('container');
// mandel.view.map = 'green2';
// mandel.render();

// Newton
// var newton = new Fractal('container');

// extendObj( newton.view, {
	// type : 'newton',
	// xMid : 0,
	// yMid : 0,
	// scale : 1.5,
	// nMax : 40
// });

// newton.setSize(800, 600);
// newton.render();

// Newton2
var newton2 = new Fractal('container');

extendObj( newton2.view, {
	type : 'newton2',
	map: 'green2',
	xMid : 0.5,
	yMid : 0,
	scale : 2,
	nMax : 80
});

newton2.setSize(640, 480);
newton2.render();

