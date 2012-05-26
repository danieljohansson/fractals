
// ----- Extend (overwrites property in dest if present in both)

window.extendObj = function ( dest, source ) {
	var prop;
	for ( prop in source ) {
		if ( source.hasOwnProperty(prop) ) {
			dest[prop] = source[prop];
		}
	}
	return dest;
};
