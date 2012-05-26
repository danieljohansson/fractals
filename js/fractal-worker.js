//
//	Worker - Mandelbrot
//	
//	Daniel Johansson
//	2012-04-12
//

"use strict";

var normalizeData = function ( data, fromMax, toMax ) {
	var len = data.length, i;
	
	for ( i = 0; i < len; i++ ) {
		// f(x) = (y2-y1)/(x2-x1)*(x-x1) + y1
		// x1, y1 = 0  ==>  f(x) = y2/x2 * x
		data[i] = toMax / fromMax * data[i];
	}
},

mandelbrot = function ( opt, diverge ) {
	var width = opt.width,
		height = opt.height,
		partSize = opt.partSize,
		offset = opt.offset,
		
		x1 = opt.x1,  y1 = opt.y1,
		x2 = opt.x2,  y2 = opt.y2,
		
		nMax = opt.nMax,
		x, y, n, 
		cRe, cIm, re, im, reNext;
	
	// y = (offset) to (offset + partSize)
	for ( y = offset; y < offset + partSize; y++ ) {
		for ( x = 0; x < width; x++ ) {
		
			// map:  0 to width  -->  x1 to x2
			cRe = (x2-x1) / width * x + x1;
			
			// map:  0 to height  -->  y1 to y2
			cIm = (y2-y1) / height * y + y1;
			
			re = 0;
			im = 0;
			
			n = 0;
			
			while ( re*re + im*im < 4 && n < nMax ) { // 4 == 2*2
				// z^2 + c
				reNext = re*re - im*im + cRe;
				im = 2*re*im + cIm;
				re = reNext;
				
				n++;
			}
			
			// Make n fit nicely into one byte
			n = Math.round( n / nMax * 255 );
			
			diverge[(y-offset) * width + x] = n;
		}
	}
},

julia = function ( opt, diverge ) {
	var width = opt.width,
		height = opt.height,
		partSize = opt.partSize,
		offset = opt.offset,
		
		x1 = opt.x1,  y1 = opt.y1,
		x2 = opt.x2,  y2 = opt.y2,
		
		nMax = opt.nMax,
		x, y, n,
		cRe = opt.cRe,
		cIm = opt.cIm,
		re, im, reNext;
	
	// y = (offset) to (offset + partSize)
	for ( y = offset; y < offset + partSize; y++ ) {
		for ( x = 0; x < width; x++ ) {
		
			// f(x) = (yMax-yMin)/(xMax-xMin)*(x-xMin) + yMin
			// map:  0 to width  -->  x1 to x2
			re = (x2-x1) / width * x + x1;
			
			// map:  0 to height  -->  y1 to y2
			im = (y2-y1) / height * y + y1;
			
			n = 0;
			
			while ( re*re + im*im < 4 && n < nMax ) { // 4 == 2*2
				// z^2 + c
				reNext = re*re - im*im + cRe;
				im = 2*re*im + cIm;
				re = reNext;
				
				n++;
			}
			
			// Make n fit nicely into one byte
			n = Math.round( n / nMax * 255 );
			
			diverge[(y-offset) * width + x] = n;
		}
	}
},

newton = function ( opt, diverge, colors ) {
	var width = opt.width,
		height = opt.height,
		partSize = opt.partSize,
		offset = opt.offset,
		
		x1 = opt.x1,  y1 = opt.y1,
		x2 = opt.x2,  y2 = opt.y2,
		
		nMax = opt.nMax,
		thresh = 1e-9,
		x, y, n, idx, j,
		a, b, aNext, bNext, denom,
		a2, a3, a4, a5, a6, a8, a10, a12, a14,
		b2, b3, b4, b5, b6, b8, b10, b12, b14;

	/*
		z^4 - 1
		(a+ib) - ((a+ib)^4-1)/(4*(a+ib)^3)
		
		denom: 4*(a^6+3 a^4 b^2+3 a^2 b^4+b^6)
	    re: (a^3-3*a*b^2) / (4*(a^6+3 a^4 b^2+3 a^2 b^4+b^6)) + (3*a)/4
	    im: (b^3-3*a^2*b) / (4*(a^6+3 a^4 b^2+3 a^2 b^4+b^6)) + (3*b)/4
	*/
	/*
		z^3 - 1
	    (a+ib) - ((a+ib)^4-1)/(4*(a+ib)^3)
		
	    re: (2*a)/3+(a^2-b^2)/(3*(a^4+2*a^2*b^2+b^4))
		im: (2*b)/3-(2*a*b)/(3*(a^4+2*a^2*b^2+b^4))
	*/
	/*
		z^3 - 2z + 2
	    (a+ib) - ((a+ib)^3 - 2(a+ib) + 2) / (3(a+ib)^2 - 2) 
		
	    re: (-(6*a^2)-(4*a)+(6*b^2)+4-(3*a*b^4)-(3*a^5)-(6*a^3*b^2)+(8*a^3)) / (9*a^4+18*a^2*b^2-12*a^2+9*b^4+12*b^2+4) + a
		im: ((12*a*b)-(4*b)-(3*b^5)-(6*a^2*b^3)-(8*b^3)-(3*a^4*b)) / (9*a^4+18*a^2*b^2-12*a^2+9*b^4+12*b^2+4) + b
	*/
	/*
		z^8 - 1
	    (a+ib) - ((a+ib)^8-1) / (8(a+ib)^7)
		
		denom: 8*(a^14+7*a^12*b^2+21*a^10*b^4+35*a^8*b^6+35*a^6*b^8+21*a^4*b^10+7*a^2*b^12+b^14)
		re: (-a*(a^14+7*a^12*b^2+21*a^10*b^4+35*a^8*b^6+35*a^6*b^8-a^6+21*a^4*b^10+21*a^4*b^2+7*a^2*b^12-35*a^2*b^4+b^14+7*b^6)) / denom + a
		im: (-b*(a^14+7*a^12*b^2+21*a^10*b^4+35*a^8*b^6+35*a^6*b^8+7*a^6+21*a^4*b^10-35*a^4*b^2+7*a^2*b^12+21*a^2*b^4+b^14-b^6)) / denom + b
	*/
	/*
		z^5 - 1
		
		denom: 5*a^8+20*a^6*b^2+30*a^4*b^4+20*a^2*b^6+5*b^8
		re: (a^4-6*a^2*b^2-a*b^8+b^4-a^9-4*a^7*b^2-6*a^5*b^4-4*a^3*b^6) / denom + a
		im: (-b^9-4*a^2*b^7+4*a*b^3-a^8*b-4*a^6*b^3-6*a^4*b^5-4*a^3*b) / denom + b
	*/
	
	// var roots = [ [0, 1], [-1, 0], [0, -1], [1, 0] ];
	// var roots = [ [1, 0], [-.5, Math.sqrt(3)/2], [-.5, -Math.sqrt(3)/2] ];
	// var roots = [ [-1.7692923542386314152, 0], [0.88464617711931570762, -0.58974280502220550165], [0.88464617711931570762, 0.58974280502220550165] ];
	// var roots = [ 
		// [0.70710678118654752440, 0.70710678118654752440],
		// [0, 1],
		// [0.70710678118654752440, -0.70710678118654752440],
		// [1, 0],
		// [-0.70710678118654752440, -0.70710678118654752440],
		// [0, -1],
		// [-1, 0],
		// [-0.70710678118654752440, 0.70710678118654752440]
	// ];
	var roots = [ 
		[1, 0],
		[0.309016994374947424102, 0.95105651629515357211],
		[-0.80901699437494742410, 0.58778525229247312916],
		[-0.80901699437494742410, -0.58778525229247312916],
		[0.309016994374947424102, -0.95105651629515357211]
	];
	
	
	// y = (offset) to (offset + partSize)
	for ( y = offset; y < offset + partSize; y++ ) {
		for ( x = 0; x < width; x++ ) {
		
			idx = (y-offset) * width + x;
			
			// map:  0 to width  -->  x1 to x2
			a = (x2-x1) / width * x + x1;
			
			// map:  0 to height  -->  y1 to y2
			b = (y2-y1) / height * y + y1;
			
			n = 0;
			
			while (n < nMax) {
				
				a2 = a*a;      b2 = b*b;
				a3 = a2*a;     b3 = b2*b;
				a4 = a3*a;     b4 = b3*b;
				
				a5 = a3*a2;    b5 = b3*b2;
				a6 = a3*a3;    b6 = b3*b3;
				
				a8 = a4*a4;    b8 = b4*b4;
				a10 = a4*a6;   b10 = b4*b6;
				a12 = a6*a6;   b12 = b6*b6;
				a14 = a8*a6;   b14 = b8*b6;
				
				// z^4 -1
				// denom = 4*(a6+3*a4*b2+3*a2*b4+b6);
				// aNext = (a3-3*a*b2) / denom + (3*a)/4;
				// bNext = (b3-3*a2*b) / denom + (3*b)/4;
				
				// z^3 - 1
				// aNext = (2*a)/3+(a2-b2)/(3*(a4+2*a2*b2+b4));
				// bNext = (2*b)/3-(2*a*b)/(3*(a4+2*a2*b2+b4));
				
				// z^3 - 2z + 2
				// denom = 9*a4+18*a2*b2-12*a2+9*b4+12*b2+4;
				// aNext = (-(6*a2)-(4*a)+(6*b2)+4-(3*a*b4)-(3*a5)-(6*a3*b2)+(8*a3)) / denom + a;
				// bNext = ((12*a*b)-(4*b)-(3*b5)-(6*a2*b3)-(8*b3)-(3*a4*b)) / denom + b;
				
				// z^8 - 1		
				// denom = 8*(a14+7*a12*b2+21*a10*b4+35*a8*b6+35*a6*b8+21*a4*b10+7*a2*b12+b14);
				// aNext = (-a*(a14+7*a12*b2+21*a10*b4+35*a8*b6+35*a6*b8+21*a4*b10+21*a4*b2+7*a2*b12-35*a2*b4+7*b6+b14-a6)) / denom + a;
				// bNext = (-b*(a14+7*a12*b2+21*a10*b4+35*a8*b6+35*a6*b8+7*a6+21*a4*b10-35*a4*b2+7*a2*b12+21*a2*b4+b14-b6)) / denom + b;
				
				// z^5 - 1		
				denom = 5*a8+20*a6*b2+30*a4*b4+20*a2*b6+5*b8;
				aNext = (a4-6*a2*b2-a*b8+b4-a8*a-4*a6*a*b2-6*a5*b4-4*a3*b6) / denom + a;
				bNext = (-b8*b-4*a2*b6*b+4*a*b3-a8*b-4*a6*b3-6*a4*b5-4*a3*b) / denom + b;
				
				a = aNext;
				b = bNext;
			
				colors[idx] = 0;
				
				// // z^4 - 1, somewhat faster...
				// if      ( a <    thresh && a >   -thresh && b <  1+thresh && b >  1-thresh ) colors[idx] = 1;
				// else if ( a < -1+thresh && a > -1-thresh && b <    thresh && b >   -thresh ) colors[idx] = 2; 
				// else if ( a <    thresh && a >   -thresh && b < -1+thresh && b > -1-thresh ) colors[idx] = 3;
				// else if ( a <  1+thresh && a >  1-thresh && b <    thresh && b >   -thresh ) colors[idx] = 4;
				
				for ( j = 0; j < roots.length; j++ ) {
					if (
						a < roots[j][0] + thresh && 
					    a > roots[j][0] - thresh && 
						b < roots[j][1] + thresh && 
						b > roots[j][1] - thresh
					) {
						colors[idx] = j+1;
						break;
					}
				}
			
				if (colors[idx] !== 0) break;
				
				n++;
			}
	
			// Make n fit nicely into one byte
			n = Math.round( n / nMax * 255 );
			
			diverge[idx] = n;
		}
	}
},

newton2 = function ( opt, diverge, colors ) {
	var width = opt.width,  
		height = opt.height,
		partSize = opt.partSize,
		offset = opt.offset,
		
		x1 = opt.x1,  y1 = opt.y1,
		x2 = opt.x2,  y2 = opt.y2,
		
		nMax = opt.nMax,
		thresh = 1e-6,     // artifacts if too small
		x, y, n, idx, j,
		a, b, aNext, bNext, denom,
		sumRe, sumIm, 
		g = Math.sqrt(3)/2,
		c = 0.5,
		d = 0.0,
		a2, b2, c2, d2, g2;
		
	/*
		Hardcoded for
		z^3 - 1
	*/
	
	var roots = [ [1, 0], [-.5, g], [-.5, -g] ];

	
	// y = (offset) to (offset + partSize)
	for ( y = offset; y < offset + partSize; y++ ) {
		for ( x = 0; x < width; x++ ) {
		
			idx = (y-offset) * width + x;
			
			// map:  0 to width  -->  x1 to x2
			a = (x2-x1) / width * x + x1;
			
			// map:  0 to height  -->  y1 to y2
			b = (y2-y1) / height * y + y1;
			
			n = 0;
			
			while (n < nMax) {
			
				a2 = a*a;
				b2 = b*b;
				g2 = g*g;
				
				/*
					http://www.chiark.greenend.org.uk/~sgtatham/newton/
					http://www.wolframalpha.com/input/?i=%28%28%28c%2Bid%29+%2F+%28a%2Bib+-+1%29+%2B+1%2F%28a%2Bib+%2B+0.5-i*g%29+%2B+1%2F%28a%2Bib+%2B+0.5%2Bi*g%29%29%29^%28-1%29
					
					z_n+1 = z - 1/sum
					sum = k/( z - root1 ) + 1/( z - root2 ) + 1/( z - root3 )
					k = c+id
				*/
				
				sumRe = a/((a2+a+0.25)+(b2+2*b*g+g2))+0.5/((a2+a+0.25)+(b2+2*b*g+g2))+
						a/((a2+a+0.25)+(b2-2*b*g+g2))+0.5/((a2+a+0.25)+(b2-2*b*g+g2))+
						(a*c)/((a2-2*a+1)+b2)-c/((a2-2*a+1)+b2)+(b*d)/((a2-2*a+1)+b2);
				
				sumIm = -b/((a2+a+0.25)+(b2+2*b*g+g2))-g/((a2+a+0.25)+(b2+2*b*g+g2))+
						g/((a2+a+0.25)+(b2-2*b*g+g2))-b/((a2+a+0.25)+(b2-2*b*g+g2))+
						(a*d)/((a2-2*a+1)+b2)-d/((a2-2*a+1)+b2)-(b*c)/((a2-2*a+1)+b2);
				
				denom = sumRe*sumRe + sumIm*sumIm;
				
				colors[idx] = 0;
				
				// prevent divide by zero
				if ( denom === 0 ) break;
				
				aNext = a - sumRe / denom;
				bNext = b + sumIm / denom;
				
				a = aNext;
				b = bNext;
				
				for ( j = 0; j < roots.length; j++ ) {
					if (
						a < roots[j][0] + thresh && 
					    a > roots[j][0] - thresh && 
						b < roots[j][1] + thresh && 
						b > roots[j][1] - thresh
					) {
						colors[idx] = j+1;
						break;
					}
				}
			
				if (colors[idx] !== 0) break;
				
				n++;
			}
	
			// Make n fit nicely into one byte
			n = Math.round( n / nMax * 255 );
			
			diverge[idx] = n;
		}
	}
};


self.addEventListener('message', function (e) {
	var buf = new ArrayBuffer( e.data.width * e.data.partSize ),
		bufColor = new ArrayBuffer( e.data.width * e.data.partSize ),  
		
		diverge = new Uint8Array( buf ),             // 8 bit view of buffer
		colors = new Uint8Array( bufColor );         // 8 bit view of buffer
	
	switch ( e.data.type ) {
		case 'mandelbrot':
			mandelbrot( e.data, diverge );
			break;
		case 'julia':
			julia( e.data, diverge );
			break;
		case 'newton':
			newton( e.data, diverge, colors );
			break;
		case 'newton2':
			newton2( e.data, diverge, colors );
			break;
	}

	self.postMessage({ 
		lightness: diverge,
		color: colors,
		partSize: e.data.partSize,
		offset: e.data.offset,
		timestamp: e.data.timestamp
	});
	
	// close worker when done
	// prevents spawning too many when continously rendering
	close();
	
}, false);
