//
//	Color Map Generator
//	
//	Daniel Johansson
//	2012-03-31
//	

;(function () {
"use strict";


var map = {},
	depth = 255,
	
	i, j, x, r, g, b,
	name, len,
	c1, c2, c3, c4, c5,
	constrain = function ( val ) {
		if      ( val <= 0 ) val = 0;
		else if ( val >= 1 ) val = 1;
		
		return Math.round( val * depth );
	};

map.names = [
	'gray',
	'red2',
	'green2',
	'blue2',
	'yellow2',
	'purple2',
	'red',
	'green',
	'blue',
	'yellow',
	'purple',
	'orange',
	'cyan',
	'brown',
	'magic',
	
	'pink',
	'jet',
	'hot'
];
len = map.names.length;

for ( i = 0; i < len; i++ ) {
	
	name = map.names[i];
	map[name] = [];
	
	for ( j = 0; j <= depth; j++ ) {
		
		x = j / depth;
		
		switch (name) {
			case 'red2':
				r = (1-x)*1.5;
				g = (0.4-x)*1.8;
				b = (0.4-x)*1.2;
				break;
				
			case 'green2':
				r = (0.3-x)*2.5;
				g = (1-x)*1;
				b = (0.2-x)*3;
				break;
				
			case 'blue2':
				r = (0.4-x)*1;
				g = (0.5-x)*2;
				b = (1-x)*2;
				break;
				
			case 'yellow2':
				r = (1-x)*2;
				g = (1-x)*1;
				b = (0.2-x)*4;
				break;
				
			case 'purple2':
				r = (0.9-x)*1.4;
				g = (0.3-x)*2.5;
				b = (1-x)*1.4;
				break;
				
			case 'red':
				r = x*3;
				g = (x-0.25)*2;
				b = (x-0.5)*2;
				break;
				
			case 'green':
				r = (x-0.25)*2;
				g = x*2.2;
				b = (x-0.5)*2;
				break;
				
			case 'blue':
				r = (x-0.5)*2;
				g = (x-0.12)*2;
				b = x*3;
				break;
				
			case 'yellow':
				r = x*2.5;
				g = x*2;
				b = (x-0.5)*2;
				break;
				
			case 'orange':
				r = x*3;
				g = x*1.5;
				b = (x-0.5)*2;
				break;
				
			case 'purple':
				r = x*2;
				g = (x-0.25)*2;
				b = x*2;
				break;
				
			case 'cyan':
				r = (x-0.25)*2;
				g = x*2.3;
				b = x*2.3;
				break;
				
			case 'brown':
				r = x*2;
				g = x;
				b = (x-0.25)*1.4;
				break;
				
			case 'magic':
				r = x*3;
				g = (x-0.25)*3;
				b = x;
				break;
				
			case 'gray':
				r = x;
				g = x;
				b = x;
				break;
				
			case 'jet':
				r = 1.1*Math.sin((x-96)/60);
				g = 1.1*Math.sin((x-32)/60);
				b = 1.1*Math.sin((x+32)/60);
				break;
	
			case 'hot':
				r = x/26;
				g = (x-0.12)/26;
				b = (x-0.2)/13;
				break;
				
			case 'pink':
				c1 = Math.sqrt(x)/6.4;
				c2 = Math.sqrt(x)/9.7;
				c3 = Math.sqrt(x)/11 + 0.28;
				c4 = Math.sqrt(x)/5 - 0.46;
				c5 = Math.sqrt(x)/3.5 - 1.265;
				
				if ( c1 < c3 ) r = c1;
				else           r = c3;
				
				if      ( c2 > c4 ) g = c2;
				else if ( c4 < c3 ) g = c4;
				else                g = c3;
				
				if ( c2 > c5 ) b = c2;
				else           b = c5;
				break;
				
		}
	
		map[name][j] = [
			constrain( r ),
			constrain( g ),
			constrain( b )
		];
	}
}

// expose to outer world
window.map = map;

})();