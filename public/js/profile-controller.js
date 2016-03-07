

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
    });

    
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
	    parentID: focusEntity._id,
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
    	    console.log(data);
	    constructDisplay( data );
	    console.log(data.docs.length * data.offset >= data.total, data.docs.length, data.offset)
	}).error(function(err){
    	    console.log(err);
	});
    };
    
    
    updateDatascapeDisplay( page ); 


}

document.addEventListener("DOMContentLoaded", init);
