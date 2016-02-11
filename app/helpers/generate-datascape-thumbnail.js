'use strict'


var gd = require('node-gd');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = function(path, callback){
    
    // Total x and y size
    var imageSize = 200;
    // Create blank new image in memory
    gd.createTrueColor(imageSize, imageSize, function(err, img){
	if( err ) return callback( err );

	var lines = Array( getRandomInt(7, 3) );

	// o and e are undefined
	for( var i = 0; i < lines.length; i++ ){
	    lines[i] = Array( getRandomInt(15, 3) );
	    
	    for( var j = 0; j < lines[i].length; j++ ){
		
		lines[i][j] = {
		    x:  getRandomInt(imageSize, 0),
		    y: getRandomInt(imageSize, 0)
		};
	    };
	};
	
	// The above generate a random number of lines,
	// containing a rondom number of points,
	// where the x y of each point is random.
	
	// Set background color to white
	//img.colorAllocate(255, 255, 255);


	lines.forEach( function(line){
	// plot line with random color
	    var color = gd.trueColor( getRandomInt(255,0),
				      getRandomInt(255,0),
				      getRandomInt(255,0));
	    
	    img.setThickness( getRandomInt(5, 1) );
	    img.openPolygon( line, color );
	});
	
	img.negate();
	// Write image buffer to disk
	img.savePng(path, 0, callback );
    });
}
