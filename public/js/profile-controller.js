

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    // Globals
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    var columnTypes  = [];
    var file         = null;
    var title        = null;
    var displayLimit = 15;   

    var timezoneOffset = new Date().getTimezoneOffset() / 60 * (-1) ;	
 
    var dateFormatOptions = {
	weekday: "long", year: "numeric", month: "short",
	day: "numeric", hour: "2-digit", minute: "2-digit"
    };

    function buildTile( datascapeContainer ){
	var dsTime = new Date( datascapeContainer.dateAdded );
	
	dsTime.setHours( dsTime.getHours() - timezoneOffset - 5);

	var containerSettings = {
	    class: "dataspace-tile pure-u-1-5"
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
	    html: 'Painted: <br> '+ dsTime.toLocaleTimeString("en-us", dateFormatOptions)
	};

	
	var container = $('<div/>', containerSettings );
	var link      = $('<a/>', linkSettings );
	var title     = $('<h4/>', {html: datascapeContainer.displaySettings.title });
	var views     = $('<p/>', viewSettings);
	var comments  = $('<p/>', commentSettings);
	var created   = $('<p/>', createdSettings);
	    
	link.append( title );
	link.append( views );
	link.append( comments );
	link.append( created );

	container.append( link );

	return container;
    };

    
    function constructDisplay(data){
	var container   = $("#datascape-tile-preview-anchor");
	var leftTile    = $("#tile-left");
	var centerTile  = $("#tile-center");
	var rightTile   = $("#tile-right");
	

	function loadElement(dest, elm){
	    dest.hide()
		.append( buildTile( elm ) )
		.fadeIn( 'slow');
	}	    

	console.log(data.length);
	data.forEach(function(tile){
	    setTimeout( 700 );
	    loadElement( container, tile );
	});
	
    };

    function updateDatascapeDisplay(pageNumber){
	var request = {
	    parentID: focusEntity,
	    page:  pageNumber,
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
    
    updateDatascapeDisplay( getUrlParameter( 'page') || 0 ); 
}

document.addEventListener("DOMContentLoaded", init);
