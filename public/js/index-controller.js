

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

    var timezoneOffset = new Date().getTimezoneOffset() / 60 * (-1) ;	
 
    var dateFormatOptions = {
	weekday: "long", year: "numeric", month: "short",
	day: "numeric", hour: "2-digit", minute: "2-digit"
    };

    function buildTile( datascapeContainer ){
	var dsTime = new Date( datascapeContainer.dateAdded );
	
	dsTime.setHours( dsTime.getHours() - timezoneOffset - 5);

	var containerSettings = {
	    class: "dataspace-tile"
	};
	var linkSettings = {
	    href: datascapeContainer.links.local
	};
	var viewSettings = {
	    class: "view-count",
	    html: 'Views: '+ datascapeContainer.statistics.viewCount
	};
	var commentSettings = {
	    class: "view-count",
	    html: 'Comments: '+ datascapeContainer.comments.length
	};
	var createdSettings = {
	    class: "view-count",
	    html: 'Created on: <br> '+ dsTime.toLocaleTimeString("en-us", dateFormatOptions)
	};

	
	var container = $('<div/>', containerSettings )
	var link      = $('<a/>', linkSettings )
	var title     = $('<h4/>', {html: datascapeContainer.displaySettings.title });
	var views     = $('<p/>', viewSettings);
	var comments  = $('<p/>', commentSettings);
	var created   = $('<p/>', createdSettings);
	    
	link.append( title );
	link.append( views );
	link.append( comments );
	link.append( created );
	container.append( link );

	console.log( container ) ;
	return container;
    };

    
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
    	    constructDisplay( data );
	}).error(function(err){
    	    console.log(err);
	});
    };

    updateDatascapeDisplay(0);
}

document.addEventListener("DOMContentLoaded", init);
