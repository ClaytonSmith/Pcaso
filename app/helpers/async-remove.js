'use strict'

function asyncRemove(sequence, method, callback){
    if( sequence.length === 0 || sequence.length === undefined ) callback( null );
    else {
	method( sequence[0], function(err){
	    if( err ) callback( err );		
	    else asyncRemove( sequence, method, callback );
	});
    }
}

exports.asyncRemove = asyncRemove;
