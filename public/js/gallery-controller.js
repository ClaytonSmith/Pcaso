

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    // Globals
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    var columnTypes  = [];
    var file         = null;
    var title        = null;
    var displayLimit = 25;  
    var page = parseInt( getUrlParameter( 'page'));
    
    // If not a number, default to `0`
    if( isNaN( page ) ) page = 0;

    
    // If on first page, do not allow user to go back
    if( page <= 0 ) $('#prev-page').attr('disabled', true);
    
    // Move user to next gallery page
    $('#next-page').click(function(){
	//	var nextPage = page +1;	
	
	page += 1;

	updateDatascapeDisplay(page);
	
	//Window.location.href = path +'?'+ $.param({page: nextPage});
    });
    
    // Move user page a page
    $('#prev-page').click(function(){
	if( page <= 0 ) return;
	
	page -= 1;

	updateDatascapeDisplay(page);
	
	    //window.location.href = path +'?'+ $.param({page: nextPage});
    })

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
	
	container.empty();

	data.docs.forEach(function(tile){
	    setTimeout( 700 );
	    loadElement( container, tile );
	});
	
	
	$('#prev-page').attr('disabled', ( page <= 0 ) );


	var disableNext = ( data.page === data.pages )
	console.log(data)
	$('#next-page').attr('disabled', disableNext);

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
	    console.log(data.docs.length * data.offset >= data.total, data.docs.length, data.offset)
	}).error(function(err){
    	    console.log(err);
	});
    };
    
    
    updateDatascapeDisplay( page ); 


}

document.addEventListener("DOMContentLoaded", init);
