

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    // Globals
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    var columnTypes  = [];
    var file         = null;
    var title        = null;
    var displayLimit = 3;   

    
    function constructDisplay(data){
	var container   = $("#datascape-preview-container");
	var leftTile    = $("#tile-left");
	var centerTile  = $("#tile-center");
	var rightTile   = $("#tile-right");
	

	function loadElement(dest, elm){
	    setTimeout( 2000 );
	    dest.hide()
		.empty()
		.append( buildTile( elm ) )
		.fadeIn( 'slow');
	}	    
	
	loadElement( leftTile,   data[0] );
	loadElement( centerTile, data[1] );
	loadElement( rightTile,  data[2] );
	
   
    };

    function updateDatascapeDisplay(pageNumber){
	var request = {
	    page: pageNumber,
	    limit: displayLimit
	};
	
	$.ajax({
    	    url: '/api/datascapes/paginate',
    	    type: 'GET',
    	    dataType: 'json',	
    	    cache: false,
    	    data: request
	}).success(function(data){
    	    constructDisplay( data.docs );
	}).error(function(err){
    	    console.log(err);
	});
    };

    updateDatascapeDisplay(0);
}

document.addEventListener("DOMContentLoaded", init);
