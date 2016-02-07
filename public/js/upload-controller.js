

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    // Globals
    var columnTypes = [];
    var file = null;
    var title = null;
    
    function genTitle( title ){
	var containerSettings = {
	    class:"pure-control-group"
	}
	var labelSettings = {
	    for: 'title',
	    html: 'Title'
	}
	var inputSettings = {
	    id: 'title',
	    type: 'text',
	    value: title
	}
	
	var container = $('<div\>',   containerSettings);
	var label     = $('<label/>', labelSettings);
	var input     = $('<input/>', inputSettings);

	// on change, set new value
	input.change(function(value){
	    title = this.value;
	});

	container.append( label );
	container.append( input );

	return container;
    }
    
    function genTable(data){
	var tableConfig = {
	    id: "data-display-table",
	    class: "pure-table pure-table-horizontal"
	}
	
	var theadConfig  = {}
	var tbodyConfig  = {}
	var selectConfig = {}
	
	var table = $("<table\>", tableConfig);
	var thead = $("<thead\>", theadConfig);
	var tbody = $("<tbody\>", tbodyConfig);
	
	// Construct table head
	var trHead = $("<tr\>", {/* No config */})
	data[0].forEach(function(datum){ trHead.append( $("<th\>", {html: datum} ) ); })
	thead.append( trHead );
	
	// Only display fist 3
	for( var i = 1; i < 4 ; i++ ){
	    var tr = $("<tr\>", {/* No config */})
	    data[ i ].forEach(function(datum){ tr.append( $("<td\>", {html: datum} ) ); })
	    tbody.append( tr );
	}
	
	// Build eval-as input field
	var trEvalAs = $("<tr\>", {class: 'eval-as'});
	
	data[0].forEach(function(datum, index){
	    var sID = 'evalColumns'+ index +'As';
	    var select = $("<select\>", {name: sID, size: 4} );
	
	    select.append( $("<option\>", {value: 'id',    html: 'ID', slected: true }) );
	    select.append( $("<option\>", {value: 'axis',  html: 'Axis' }) );
	    select.append( $("<option\>", {value: 'meta',  html: 'Meta' }) );
	    select.append( $("<option\>", {value: 'value', html: 'Value'}) );
	    select.append( $("<option\>", {value: 'omit',  html: 'Omit' }) );
	     
	    // Init 
	    columnTypes[ index ] = select.val();
	    
	    // Creates a change method for each method built
	    select.change( function(value){
		columnTypes[ index ] = this.value;
	    });
	    
	    trEvalAs.append( $("<td\>", {html: select} ) );
	}); 

	tbody.append( trEvalAs ); 

	table.append( thead );
	table.append( tbody );
	
	return table;
    }
    
    function insertTable(table, file){
	if( table.errors.length ) return console.log( table.errors );
	
	var csvDisplayContainer = $("#csv-display-container")
	var layout = $('<div\>');
	


	var title = $('<h3\>', {class:'file-title', html: file.name });
	var tableContainer = $('<div\>');
	var description = $("<textarea\>", { name: "caption", id: "caption"});
	
	// Clear any existing elements
	csvDisplayContainer.empty();
	
	// Create table
	tableContainer.append( genTable( table.data ) );
	
	// Create layout with title and table
	layout.append( genTitle( file.name ));
	layout.append( tableContainer );
	layout.append( description );
	
	// Insert into dom
	csvDisplayContainer.append( layout );
	console.log( columnTypes );
    }

    function isValid(form){
	// Soon to come
	return true;
    }
    
    $("#file-select").change(function (e){
	if( !e.target.files ) return null;
	
	file = e.target.files[0];
	console.log(file.name);
	
	Papa.parse( file, {
	    complete: function(parsedObj){ insertTable( parsedObj, file ); }
	});
    });

    
    $("#dataset-upload-form").submit(function(e){	
     	e.preventDefault();
	return false;
    });
    
    $("#submit-button").click(function(){
    	var form = $("#dataset-upload-form");
    	var formData = new FormData();	
	var actionURL = form.attr('action');
	var method = form.attr('method').toUpperCase();

	var data = {
	    displaySettings: {
		title: title,
		caption: $('#caption').val(),	    
		display: {
		    columnTypes: columnTypes
		}
	    },
	    ownership: $("input:radio[name=ownership]").val()
	};
	    
	// I hate to do this but I don't know how else to send objects
	formData.append( 'revertUponArival', JSON.stringify( data ) );
	formData.append( 'file', file);
	
	//console.log( 'Hi', actionURL, formData.getAll('file'), formData.getAll('legacyData') ); 
	
	$.ajax({
            url: actionURL,
            type: method,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
	});
  	
	return false;
    });
}

document.addEventListener("DOMContentLoaded", init);
