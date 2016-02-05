

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    function genTable(data){
	var tableConfig = {
	    id: "data-display-table",
	    class: "pure-table pure-table-horizontal"
	}
	var theadConfig = {}
	var tbodyConfig = {}
	var selectConfig = {
	    
	}


	var table = $("<table\>", tableConfig);
	var thead = $("<thead\>", theadConfig);
	var tbody = $("<tbody\>", tbodyConfig);
	
	// Construct table head
	var trHead = $("<tr\>", {/* No config */})
	data[0].forEach(function(datum){ trHead.append( $("<th\>", {html: datum} ) ); })
	thead.append( trHead );
	
	// Start at 1 because we have already processed the first row
	for( var i = 1; i < data.length ; i++ ){
	    var tr = $("<tr\>", {/* No config */})
	    data[ i ].forEach(function(datum){ tr.append( $("<td\>", {html: datum} ) ); })
	    tbody.append( tr );
	}
	
	// Build eval-as input field
	var trEvalAs = $("<tr\>", {class: 'eval-as'});
	
	data[0].forEach(function(datum, index){
	    var sID = 's['+ index +']';
	    var select = $("<select\>", {name: sID, id: sID, size: 4} );
	    
	    select.append( $("<option\>", {value: 'id',    html: 'ID', slected: "id"}) );
	    select.append( $("<option\>", {value: 'axis',  html: 'Axis' }) );
	    select.append( $("<option\>", {value: 'value', html: 'Value'}) );
	    select.append( $("<option\>", {value: 'axis',  html: 'Omit' }) );
	    
	    
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
	var description = $("<textarea\>", { name: "description", id: "description"});
	
	// Clear any existing elements
	csvDisplayContainer.empty();
	
	// Create table
	tableContainer.append( genTable( table.data ) );
	
	// Create layout with title and table
	layout.append( title );
	layout.append( tableContainer );
	layout.append( description );
	
	
	
	
	
	// Insert into dom
	csvDisplayContainer.append( layout );
    }
    
    $("#file-select").change(function (e){
	if( !e.target.files ) return null;

	var file = e.target.files[0];
	console.log(file.name);
	
	Papa.parse( file, {
	    complete: function(parsedObj){ insertTable( parsedObj, file ); }
	});
    });
}

document.addEventListener("DOMContentLoaded", init);
