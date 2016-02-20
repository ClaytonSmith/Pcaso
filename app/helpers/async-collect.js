'use strict'

function asyncCollect( document ){
    var local = this;
    var collect = [];
    
    function helper(docCollection){
	var ids = {};
	docCollection.forEach(function(d, i){  ids[ d._id ] = i; });	    
	return function(id){
	    return ids[ id ] !== undefined ? docCollection[ ids[ id ] ] : undefined ;  
	}
    }

    local.add = function(query, collectionName){	
	collect.push({
	    query: query,
	    collectionName: collectionName 
	});
    }
    
    local.getQueries = function(){
	return collect.map(function(obj){return obj.query;});
    }
    
    local.merge = function(results){

	collect.forEach(function(obj, index){

	    console.log( document[ collect[index].collectionName ], collect[index].collectionName,  collect[index] );
	    
	    var docFinder = helper( results[index] );
	    document[ collect[index].collectionName ] = document[ collect[index].collectionName ].map( docFinder ).filter( Boolean );
	});
    }

    return local;
}


exports.asyncCollect = asyncCollect;

