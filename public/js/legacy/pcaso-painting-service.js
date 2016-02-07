
function init() {

    // ===========================================================================
    // == Config
    // ===========================================================================

    // Static settings
    var _c = {
	'nLinesPrev'    : 3,
	'minPCA'        : 2,
	'maxPCA'        : 8,
	'minID'         : 1,
	'maxID'         : 1,
	// whole svg
	'padding'       : 20,
	'padding_fraction' : 0.04,
	// margin for coordinates
	'margin-left'   : 10,
	'margin-bottom' : 10,
	'svg-margin-bottom' : 30,

	// legend
	'legend-on'     : "#111",
	'legend-off'    : "#ccc",
	'point-na'      : "#888",
	// plot settings
	'pt_size'       : 1,
	'transition'    : 800,//ms
	'y_axis_label_side' : "left",
	'x_axis_label_side' : "bottom",
	'plot_edge_padding_fraction' : 0.10, // 10% padding on all sides of the plots
	'caption' : ""
    }

    var colorbrewer_scale_paired_12 = d3.scale.ordinal().range(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']);


    // NEW 
    var datasheet = null;

    // ===========================================================================
    // == Parse $_GET parameters
    // ===========================================================================
    var rawData = []
    var loadDataConfig = {}

    var filePath = location.pathname;
    var showUpload = false;

    $.get(filePath + '/csv', function(csvData){
	if(!csvData) throw new Error( 'Unable to load csv file' );
	datasheet = csvData;
	parseData(csvData);
	
    });

    // ===========================================================================
    // == File upload
    // ===========================================================================

    // if(showUpload){
    // 	var data      = [];
    // 	var reader    = new FileReader();
    // 	var uploadBox = document.getElementById("upload-file");

    // 	// Read file as text when selected
    // 	uploadBox.addEventListener("change", function() { reader.readAsText(this.files[0]); }, false);
    // 	// When file is read, load first 5 lines
    // 	reader.onload = function(e){
    // 	    rawData = e.target.result
	    
    // 	    //
    // 	    // Parse data as CSV and load first few lines
    // 	    parseData(rawData);
    // 	};
    // }

    // Parse data as CSV and load first few lines
    function parseData(rawData){
	
	var head = [];
	// Un-hide step 2
	
	//document.getElementById('step2').style.visibility = "visible";

	data = d3.csv.parse(rawData, function(d, i){
	    
	    if( i < _c['nLinesPrev'] ) head.push(d);
	    return d;
	});
	
	// Header
	var fields = d3.keys(head[0]);

	// Load table header
	d3.select("#table")
	    .html("")
	    .append("tr")
	    .attr("class","fixed")
	    .selectAll("th")
	    .data(fields)
	    .enter()
	    .append("th")
	    .html(function(d, i) {return d; });
	// Load table rows
	d3.select("#table")
	    .selectAll("tr.row")
	    .data(head)
	    .enter().append("tr")
	    .attr("class", "row")
	    .selectAll("td")
	    .data(function(d){ return fields.map(function(field) { return d[field] }) ; })
	    .enter().append("td")
	    .text(function(d) { return d; });
	// Put dropdown
	var nbAxis = 0
	d3.select("#table")
	    .append("tr")
	    .attr("class", "row")
	    .selectAll("td")
	    .data(fields)
	    .enter()
	    .append("td")
	    .html(function(d, i){
		
		var selectBtns = '',
		isSelected = ['', '', '', ''],
		isDisabled = ['', '', '', ''],
		allVals    = {}
		
		// Check if all lines are numeric
		var isNum = true
		// var isUnique = true
		for(j in data){
		    //
		    isNum = isNum & isNumeric(data[j][d]);
		    //
		    // allVals[data[j][d]] = (allVals[data[j][d]] || 0) + 1
		    // for(j in allVals) {
		    //   isUnique = isUnique & (allVals[j] < 2)
		    //   if(!isUnique)
		    //     break;
		    // }
		    if(!isNum) // && !isUnique
			break;
		}
		
		// if(isUnique)
		// isSelected[0] = 'selected'
		if(isNum) {
		    if(nbAxis >= _c['maxPCA'])
			isSelected[3] = 'selected'
		    else
			isSelected[1] = 'selected'
		    nbAxis++
		} else {
		    isSelected[2] = 'selected'
		    isDisabled[1] = 'disabled'
		}
		
		// Dropdown menu
		selectBtns = '<br/><select id="s['+i+']" name="s[' + i + ']" size="4">' + 
		    '<option value="id" '   + isSelected[0] + ' ' + isDisabled[0] + ' >ID</option>' +
		    '<option value="axis" ' + isSelected[1] + ' ' + isDisabled[1] + ' >Axis</option>' +
		    '<option value="meta" ' + isSelected[2] + ' ' + isDisabled[2] + ' >Metadata</option>' +
		    '<option value="omit" ' + isSelected[3] + ' ' + isDisabled[3] + ' >Omit</option>'+
		    '</select><br/><br/>'
		
		return selectBtns
	    });
	
	
	$.get( filePath + '/config', function(config){
	    if(config){
		//config = JSON.parse(config)

		// --
		
		p2 = "fields-pca"; p = config[p2]; _c['fields-pca'] = [];
		for(i=0; i<p.length; i++) _c['fields-pca'][i] = parseInt(p[i])

		p2 = "fields-meta";    p = config[p2]; _c['fields-meta'] = [];    for(i=0; i<p.length; i++) _c['fields-meta'][i] = parseInt(p[i])
		
		p2 = "fields-meta-id";
		if(p2 in config)
		    p = config[p2]; _c['fields-meta-id'] = []; for(i=0; i<p.length; i++) _c['fields-meta-id'][i] = parseInt(p[i])

		// --
		// for(i in _c['fields-pca'])
		//     document.getElementById("s[" + (_c['fields-pca'][i]-1) + "]").selectedIndex=1
		//for(i in _c['fields-meta'])
		//     document.getElementById("s[" + (_c['fields-meta'][i]-1) + "]").selectedIndex=2
		// for(i in _c['fields-meta-id'])
		//     document.getElementById("s[" + (_c['fields-meta-id'][i]-1) + "]").selectedIndex=0

		console.log(config);
		_c["caption"] = config["caption"]
		//
		// document.getElementById('pcaso-upload').style.display = "none"
		document.getElementById('pcaso-panel').style.display = "inline-block"
		document.getElementById('pcaso').style.visibility = "visible"
		//document.getElementById('backBtn').style.display = "block"
		document.getElementById('loading').style.display = "none"

		//
		pcaso();
	    }
	}); //  POSSIBLE CAUSE
	
    }


    // ===========================================================================
    // == Pcaso
    // ===========================================================================
    var _p_colorBy = null;;
    var _p_legend = {};
    var _p_header = [];
    var _p_color = null;
    var _pcaso = null;

    
    var responsive_padding  = null;

    var current_p_in_preview  = null;;
    var currently_full_screen = false;
    var point_size  = null;

    var brush = d3.svg.brush()
	.on("brushstart",brushstart)
	.on("brush",brushmove)
	.on("brushend",brushend);
    
    var preview_x_scale = d3.scale.linear();
    var preview_y_scale = d3.scale.linear();

    var numeric_columns = [];


    function pcaso(){
	document.getElementById("pcaso").innerHTML = '';

	// Get window size and determine SVG size
	_c['nPCs']   = _c['fields-pca'].length
	_c['width']  = getWindowSize()
	_c['height'] = getWindowSize()
	_c['size']   = getWindowSize() / (0.2 + _c['nPCs'])

	responsive_padding = getWindowSize() * _c['padding_fraction'];
	console.log(responsive_padding);

	point_size = _c['pt_size']+parseInt(5/Math.log(data.length));

	// Show caption
	document.getElementById('show-caption').style.display = "block"
	document.getElementById("show-caption").innerHTML = _c["caption"]


	// Dynamic app settings
	_p_colorBy = _c['fields-meta'][0]
	_p_legend = {}
	_p_header = []

	// Create SVG element
	_pcaso = d3.select("#pcaso")
	// .classed("svg-container", true)
	    .append("svg")
	    .attr("width",  _c['width' ])
	    .attr("height", _c['height'])
	    .attr("viewBox", "-5 0 " + getWindowSize() + " " + getWindowSize())
	    .attr("preserveAspectRatio", "xMinYMin meet")
	    .classed("svg-responsive", true)
	
	var newCircles = _pcaso.selectAll("circle");

	resizeWindow();


	// ===========================================================================
	// == Load data and plot
	// ===========================================================================
	// d3.csv(csvFile, function(error, data)
	// {
	//
	// if (error)
	// throw error;

	// -- Load data
	// Parse header
	_p_header = d3.keys(data[0])
	PCs = _p_header.filter(function(d, i) { return _c['fields-pca'].indexOf(i+1) > -1; })

	// Get domain for each PC
	domainByPC = {};
	PCs.forEach(function(label) {
	    domainByPC[label] = d3.extent(data, function(d) { return parseFloat(d[label]); });
	    var domain_padding = (domainByPC[label][1]-domainByPC[label][0])*_c["plot_edge_padding_fraction"]
	    domainByPC[label][0] = domainByPC[label][0]-domain_padding;
	    domainByPC[label][1] = domainByPC[label][1]+domain_padding;
	});

	// Define all possible legends
	for(i in _c['fields-meta']) {
	    f = _c['fields-meta'][i]
	    _p_legend[f] = d3.map(data, function(d) { return d[_p_header[f-1]]; }).keys()
	    _p_legend[f].sort()

	    // Check if all lines are numeric
	    var isNum = true
	    for(j in data){
		if (!(isNum & isNumeric(data[j][_p_legend[f]]))) {
		    isNum = false
		}
	    }
	    if (isNum) { 
		numeric_columns.push(_p_header[f-1])
	    }

	    // Deal with empty columns
	    for(j in _p_legend[f])
		if(_p_legend[f][j] == "")
		    _p_legend[f][j] = "Unknown"
	}





	// Define x/y axes
	var xAxis, yAxis;
	var x    = d3.scale.linear().range([responsive_padding / 2, _c["size"] - responsive_padding / 2]),
	y    = d3.scale.linear().range([_c["size"] - responsive_padding / 2, responsive_padding / 2]),
	PCsX = PCs.concat(PCs[0]),
	PCsY = PCs.concat(PCs[1]);


	// Plot the cells

	var PC_pairs = getLayoutPairs(PCsX,PCsY);
	
	var cell = _pcaso.selectAll(".cell")
	    .data( getLayoutPairs(PCsX,PCsY) )
	    .enter()
	    .append("g")
	    .attr("class", "cell")
	// .attr("transform", function(d){ return "translate(" + (_c["width"]-_c["size"]-(d.i*_c['size'])) + "," + (_c["height"]-_c["size"]-(d.j*_c['size'])) + ")"; })
	    .attr("transform", function(d){ return "translate(" + (_c["margin-left"] + d.i*_c['size']) + "," + (d.j*_c['size']) + ")"; })
	    .each(drawCell);



	drawPreview(PC_pairs[0]);

	

	var button_size = responsive_padding;
	var full_screen_toggle_button = _pcaso.append("svg:image")
	    .attr("id","full_screen_toggle")
	    .attr("x",preview_x_shift()+preview_size()-button_size*1.5)
	    .attr("y",responsive_padding/2)
	    .attr("width",button_size)
	    .attr("height",button_size)
	    .attr("xlink:href","/img/grow-big.png")
	// .text("full screen")
	    .on("click",function(d) {full_screen_toggle();});




	// Color points, legend, and selection box
	colorPoints(_p_colorBy)
	// d3.select("#pcaso-selection").style("top", ((_c['size']+responsive_padding/2)*(PCs.length-2)) + "px")
	// d3.select("#pcaso-selection").style("left", ((_c['size']+responsive_padding/2)*(PCs.length)+20) + "px")

	function preview_x_shift() {
	    // var x_shift = 0;

	    // Preview in top right corner
	    // If odd number of PCs, there will be not be a small plot in the middle, so the preview can expand into that space
	    if (_c['nPCs']%2 != 0) { // odd number of PCs
		return _c["width"]/2-_c["size"]/2 + _c["margin-left"]*2 ; //  - responsive_padding/2
	    } 
	    // But if there is an even number of PCs, there will be a small plot in the middle, so the preview should avoid filling that space
	    else {
		return _c["width"]/2 + _c["margin-left"] ; // Even number of PCs // - responsive_padding/2
	    }
	}

	function preview_size() {
	    x_shift = preview_x_shift();

	    return _c["width"]-x_shift; //-responsive_padding*2;
	}

	function drawPreview(p){
	    // console.log("drawPreview");
	    current_p_in_preview = p;

	    var x_shift = preview_x_shift();

	    size = preview_size();
	    
	    preview_x_scale.range([  responsive_padding / 2, size - responsive_padding / 2]);
	    preview_y_scale.range([ size - responsive_padding / 2, responsive_padding / 2]);

	    preview_x_scale.domain(domainByPC[p.x]);
	    preview_y_scale.domain(domainByPC[p.y]);

	    brush.x(preview_x_scale).y(preview_y_scale)
	    
	    var cell = _pcaso.append("g").attr("id","preview_holder")
		.append("g").attr("id","preview")
	    // .attr("x",_c["width"]/2)
		.attr("transform", function() {
		    return "translate(" + x_shift + "," + 0 + ")";
		});

	    cell.append("rect")
		.attr("class","box-preview")
		.attr("x", responsive_padding / 2)
		.attr("y", responsive_padding / 2)
		.attr("width", size - responsive_padding)
		.attr("height", size - responsive_padding)
	    // .call(brush);
	    // .on("click", function(d){
	    //     _p_mode_highlight = -1;
	    //     colorPoints(_p_colorBy);
	    //     size_points_by_selection();
	    // });

	    //  activate brush listener
	    cell.call(brush);
	    // cell.call(function(d){console.log(d)})
	    
	    // Axes, ticks, and scaling:
	    y_axis_label_side = _c["y_axis_label_side"]
	    if (y_axis_label_side=="right") {
		yAxis = d3.svg.axis().scale(preview_y_scale).orient("right").ticks(5)
		cell.append("g")
		    .attr("class","y axis")
		    .attr("id", "y_axis")
		    .attr("transform", "translate(" + (size - responsive_padding/2 )+ "," +  0 +  ")")
		    .call(yAxis);

		// Axis label:
		cell.append("text")
		    .attr("text-anchor", "middle")
		    .attr("id","y_label")
		    .attr("transform", "translate(" + 0 + "," + size/2 +  ") rotate(-90)")
		    .text( p.y ) // PC2
	    } else {
		yAxis = d3.svg.axis().scale(preview_y_scale).orient("left" ).ticks(5)
		cell.append("g")
		    .attr("class","y axis")
		    .attr("id", "y_axis")
		    .attr("transform", "translate(" + responsive_padding/2 + "," +  0 +  ")")
		    .call(yAxis);

		// Axis label:
		cell.append("text")
		    .attr("text-anchor", "middle")
		    .attr("id","y_label")
		    .attr("transform", "translate(" +  (-responsive_padding) + "," + size/2 +  ") rotate(-90)")
		    .text( p.y ) // PC2
	    }

	    x_axis_label_side = _c["x_axis_label_side"]
	    if (x_axis_label_side == "top"){
		xAxis = d3.svg.axis().scale(preview_x_scale).orient("top").ticks(5)      
		cell.append("g")
		    .attr("class","x axis")
		    .attr("id", "x_axis")
		    .attr("transform", "translate(" + 0 +  "," + (responsive_padding/2) + ")")
		    .call(xAxis);

		// Axis label:
		cell.append("text")
		    .attr("text-anchor", "middle")
		    .attr("id","x_label")
		    .attr("transform", "translate(" + size/2 + "," + (size + responsive_padding/2) + ")")
		    .text( p.x) // PC1

	    } else {
		xAxis = d3.svg.axis().scale(preview_x_scale).orient("bottom").ticks(5)      
		cell.append("g")
		    .attr("class","x axis")
		    .attr("id", "x_axis")
		    .attr("transform", "translate(" + 0 +  "," + (size -responsive_padding/2) + ")")
		    .call(xAxis);

		// Axis label:
		cell.append("text")
		    .attr("text-anchor", "middle")
		    .attr("id","x_label")
		    .attr("transform", "translate(" + size/2 + "," + (size + responsive_padding) + ")")
		    .text( p.x) // PC1
	    }


	    // Plot data points
	    cell.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")
		.attr("class","selected")
		.attr("r", point_size)
		.attr("cx", function(d){ return preview_x_scale(d[p.x]); })
		.attr("cy", function(d){ return preview_y_scale(d[p.y]); })
	    
	    // Only hover or click on preview box
	    cell.selectAll("circle")
		.style("cursor", "crosshair")
		.on("mouseover", function(d){ hoverPoint(p, d); })
		.on("click", function(d){ clickPoint(p, d); });
	}
	
	// -- Draw a cell
	function drawCell(p)
	{
	    // -- Styling
	    size = _c['size']
	    
	    // -- Draw
	    // Set x/y ranges and axes
	    x.domain(domainByPC[p.x]);
	    y.domain(domainByPC[p.y]);
	    

	    // Draw box
	    var whichClass = "box"
	    //
	    var cell = d3.select(this);
	    cell.append("rect")
		.attr("class", whichClass)
		.attr("x", responsive_padding / 2)
		.attr("y", responsive_padding / 2)
		.attr("width", size - responsive_padding)
		.attr("height", size - responsive_padding)
		.on("click", function(d){
		    redrawPreview(p)
		})

	    // Draw coordinate (1st col => mid-left to box)
	    cs = size/2
	    

	    // Y axis label
	    if(p.i == 0 )
		cell.append("text")
		.attr("text-anchor", "middle")
		.attr("x", 0)
		.attr("y", cs - _c['margin-left']*1.1)
		.attr("transform", function(d){
		    return "translate(-" + cs/1.2 + ", " + (cs+_p_header[_c['fields-pca'][d.j]-1].length * 2) + ") rotate(-90)"
		})
		.text(function(d) { return _p_header[_c['fields-pca'][d.j]-1]; })
	    // .style("cursor", "pointer")
	    // .on('click', function(p) { redrawPreview(p) })

	    // Draw coordinate (last row => mid-bottom to box)
	    // Note: not else if because bottom left box has 2 coordinates
	    if(p.j == (_c['fields-pca'].length-1) )
		cell.append("text")
		.attr("text-anchor", "middle")
		.attr("x", cs)
		.attr("y", cs*2+_c['margin-bottom'])
		.attr("transform", function(d){
		    return "translate(-" + _p_header[_c['fields-pca'][d.i]-1].length * 1.5 + ",0)"
		})
		.text(function(d) { return _p_header[_c['fields-pca'][d.i]-1]; })
	    // .style("cursor", "pointer")
	    // .on('click', function(d) { l(d); l(p); l("---")  })

	    // Plot data points
	    cell.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")
		.attr("class","selected")
		.attr("r", point_size)
		.attr("cx", function(d){ return x(d[p.x]); })
		.attr("cy", function(d){ return y(d[p.y]); })
		.on("click", function(d){
		    redrawPreview(p)
		})

	    // Set selected box with stroke
	    if(p.i == 1 && p.j == 0)
		highlightCell(p.i, p.j)
	}

	function full_screen_toggle() {
	    if (currently_full_screen==true) {
		_pcaso.selectAll(".cell").style("visibility", "visible");
		currently_full_screen=false;

		_pcaso.select("#preview_holder").transition().duration(_c["transition"]).ease("variable")
		    .attr("transform","scale(" + 1 + ")");

		_pcaso.select("#preview").transition().duration(_c["transition"]).ease("variable")
		    .attr("transform","translate(" + preview_x_shift() + "," + 0 + ")")

		// Set zoom icon to collapse            
		_pcaso.select("#full_screen_toggle")
		    .attr("xlink:href","images/grow-big.png")
	    }
	    else {
		_pcaso.selectAll(".cell").style("visibility", "hidden");
		var full_screen_x_shift = responsive_padding*2;
		
		_pcaso.select("#preview_holder").transition().duration(_c["transition"]*1.5).ease("variable")
		    .attr("transform","scale(" + ((_c["width"]-full_screen_x_shift*1.5)/preview_size())+ ")");

		_pcaso.select("#preview").transition().duration(_c["transition"]).ease("variable")
		    .attr("transform","translate(" + (full_screen_x_shift+1) + "," + -2 + ")")

		// Set zoom icon to collapse            
		_pcaso.select("#full_screen_toggle")
		    .attr("xlink:href","images/shrink-big.png")
		

		currently_full_screen=true;
	    }
	    colorPoints(_p_colorBy)

	}

	// -- Redraw points in big view with animation
	function redrawPreview(p)
	{
	    current_p_in_preview = p;
	    //
	    newX = p.x
	    newY = p.y
	    highlightCell(p.i, p.j)

	    // Reset x/y domains
	    preview_x_scale.domain(domainByPC[newX]);
	    preview_y_scale.domain(domainByPC[newY]);

	    // Clear the brush
	    d3.selectAll("#preview").call(brush.clear());

	    // Update data points
	    d3.select("#preview").selectAll("circle")
	    // Data remains the same, only need to update which columns of the data to use for x and y axes
	    // Transition properties
		.transition()
		.duration(_c['transition'])
		.ease("variable")
	    // Plot coordinates
		.attr("cx", function(d) { return preview_x_scale(d[newX]); })
		.attr("cy", function(d) { return preview_y_scale(d[newY]); })

	    // Update x and y axes
	    xAxis = d3.svg.axis().scale(preview_x_scale).orient(_c["x_axis_label_side"]).ticks(5);
	    yAxis = d3.svg.axis().scale(preview_y_scale).orient(_c["y_axis_label_side"]).ticks(5);

	    // Animate x & y axes
	    _pcaso.select("#x_axis").transition().duration(_c['transition']).ease("variable").call(xAxis);
	    _pcaso.select("#y_axis").transition().duration(_c['transition']).ease("variable").call(yAxis);

	    // Axis labels:
	    d3.select("#x_label").text(p.x);
	    d3.select("#y_label").text(p.y);
	    
	}


	// -- Highlight cell at given coordinates
	function highlightCell(i, j) { d3.selectAll(".box").style("stroke-width", 1); selectBox(i, j).style("stroke-width", 3).style("stroke", "#aaa"); }
	// -- Select cell or surrounding box with given coordinates
	function selectCell(i, j)    { return d3.selectAll(".cell").filter(function(d){ return d.i == i && d.j == j; })}
	function selectBox(i, j)     { return d3.selectAll(".box").filter(function(d){ return d.i == i && d.j == j; })}
	// -- Returns true if given coordinates are for preview pane

	// -- Hover on a point
	function hoverPoint(p, d)
	{ 
	    // Get coordinates
	    var x = d[p.x]
	    var y = d[p.y]

	    // Extra meta information
	    var extra = ""
	    for(j in [0, 1])
	    {
		if(j == 1)
		    arrMeta = _c['fields-meta']
		else 
		    arrMeta = _c['fields-meta-id']

		for(i in arrMeta)
		{
		    var ind = _p_header[-1+arrMeta[i]]
		    var val =         d[ind]
		    extra += '<br/><span class="meta-text">' + ind + ': ' + val + '</span>'
		}
	    }

	    // Output on screen
	    d3.select("#pcaso-hover").html('Last hovered point ( ' + x + ', ' + y + ' )' + "<br>" + extra);
	}
	function clickPoint(p, this_data)
	{
	    // p is which plot the point is from
	    // d is the data

	    d3.selectAll("circle").attr("class", function(d){
		if (d === this_data) {
		    // console.log(this_data);
		    return "selected";
		} else {
		    return "unselected";
		}
	    })

	    update_styles_on_selection();

	    d3.selectAll("circle.selected")
		.style("r", function(d) {if (d==this_data){return 4*point_size} else {return point_size}})
	    
	    // console.log("this_data");
	    // console.log(this_data);

	    //////////////////////////////////////////////////////////
	    // This reorders the data which creates errors downstream 
	    //////////////////////////////////////////////////////////

	    // // Move selected point to the front
	    _pcaso.selectAll("circle").each(function(d) {
		if (d === this_data) {
		    // console.log(d)
		    // console.log("This:")
		    // console.log(this)
		    
		    // Adapted from: http://bl.ocks.org/alignedleft/9612839                
		    var orig = d3.select(this);

		    var origNode = orig.node();
		    
		    var dupe = d3.select(origNode.parentNode.appendChild(origNode.cloneNode(true)));
		    
		    // Reattaches the data. Cloning the point doesn't transfer the data, so we have to reattach it.
		    dupe.data([this_data])  
		    // console.log(dupe);

		    orig.remove();
		}
	    });
	}
    }

    // ===========================================================================
    // == Color points using different column and draw legend
    // ===========================================================================
    var _p_mode_highlight = -1
    function colorPoints(whichColumn, onlyHighlight){

	// console.log("colorPoints()")
	// Update app settings
	_p_colorBy = whichColumn;
	legend     = _p_legend[_p_colorBy];

	// If select one legend item
	if(onlyHighlight && (_p_mode_highlight == -1 || _p_mode_highlight != onlyHighlight))
	{
	    console.log("If select one legend item")
	    //
	    _p_mode_highlight = onlyHighlight
	    onlyHighlight     = legend[onlyHighlight]
	    
	    d3.selectAll("circle").attr("class", function(d){
		
		if(d[_p_header[_p_colorBy-1]] == onlyHighlight || (onlyHighlight == "Unknown" && d[_p_header[_p_colorBy-1]] == "")) {
		    // console.log(onlyHighlight);
		    return "selected";
		}
		else {
		    return "unselected";
		}
	    })
	    
	    // Generate new legend
	    h = "";
	    for(i in legend){
		//
		col = _c['legend-off']
		if(i == _p_mode_highlight)
		    col = _p_color(legend[i])
		//
		h += '<a href="javascript:void(0)" onclick="javascript:colorPoints(\'' + _p_colorBy + '\',\'' + i + '\')"><span style="color:' + col + '">' + legend[i] + '<span></a><br/>'
		if(i == (legend.length - 1))
		    h += '<hr><a href="javascript:void(0)" onclick="javascript:colorPoints(\'' + _p_colorBy + '\')"><span style="color:#ccc;">&#8592; all<span></a><br/>'
	    }
	    // d3.select("#pcaso-legend").transition().duration(200).style('opacity', 0)
	    // d3.select("#pcaso-legend").html(h).transition().duration(300).style('opacity', 1)
	    d3.select("#pcaso-legend").html(h)
	    color_points_by_selection();
	    size_points_by_selection();

	    return
	}

	// If a specific legend item is not selected, color everything

	_p_color = d3.scale.category10();

	if (numeric_columns.indexOf(_p_header[_p_colorBy-1]) > -1) {
	    // Numeric: Diverging
	    if (legend.length <= 3) {
		_p_color   = d3.scale.ordinal().domain(legend).range(colorbrewer["RdYlBu"][3]); // Use PuBuGn to avoid yellow 
	    } else if (legend.length <= 11) {
		_p_color   = d3.scale.ordinal().domain(legend).range(colorbrewer["RdYlBu"][legend.length]);     
	    } else if (legend.length == 12) {
		_p_color   = d3.scale.ordinal().domain(legend).range(colorbrewer["Paired"]);   
	    } else if (legend.length <= 14) {
		_p_color   = d3.scale.category20();
	    } else { // legend.length >= 15 {
		_p_color   = d3.scale.category20b();
	    }
	    
	} else {
	    // Qualitative

	    if (legend.length <= 3) {
		_p_color   = d3.scale.category10();
	    } else if (legend.length <= 12) {
		_p_color   = colorbrewer_scale_paired_12;
	    } else if (legend.length <= 14) {
		_p_color   = d3.scale.category20();
	    } else { // legend.length >= 15 {
		_p_color   = d3.scale.category20b();
	    }
	}
	

	select_all_points();
	color_points_by_selection();
	size_all_points_small();

	// Populate legend
	h = "";
	for(i in legend)
	{
	    col = _p_color(legend[i])
	    if(legend[i] == "Unknown")
		col = _c['point-na']

	    h += '<a href="javascript:void(0)" onclick="javascript:colorPoints(\'' + _p_colorBy + '\',\'' + i + '\')"><span style="color:' + col + '">' + legend[i] + '<span></a><br/>'
	}
	d3.select("#pcaso-legend").html(h)

	//
	_p_mode_highlight = -1

	
	color_points_by_selection();
	

	// Change 'color by' box
	h = "Color by"
	allMeta = _c["fields-meta"]
	for(i in allMeta)
	{
	    if(allMeta[i] == _p_colorBy)
		h += '<br/>&nbsp;&nbsp;<strong>' + _p_header[allMeta[i]-1] + '</strong>'
	    else
		h += '<br/>&nbsp;&nbsp;<a href="javascript:void(0)" onclick="javascript:colorPoints(\'' + allMeta[i] + '\')" style="color:#bbb; font-weight:bold">' + _p_header[allMeta[i]-1] + '</a>'
	}
	d3.select("#pcaso-selection").html(h)
    }


    /////////////// Style selected vs. unselected points ////////////////

    function color_points_by_selection() {
	// Color selected points
	_pcaso.selectAll("circle.selected")
	    .style("fill", function(d) {
		val = d[_p_header[_p_colorBy-1]]
		if(val == "")
		    return _c['point-na']
		return _p_color(val);
	    })  


	// Color unselected points
	_pcaso.selectAll("circle.unselected")
	    .style("fill",_c["legend-off"])
    }

    function size_points_by_selection() {
	// Size selected points
	_pcaso.selectAll("circle.selected")
	    .style("r",2*point_size)

	// Size unselected points
	_pcaso.selectAll("circle.unselected")
	    .style("r",point_size)
    }
    function size_all_points_small() {
	// Return all points to their original size
	_pcaso.selectAll("circle")
	    .style("r",point_size)
    }

    function push_selected_points_to_front() {
	// Push the selected points to the front by cloning them and deleting the originals:
	_pcaso.selectAll("circle.selected").each(function(d) {
	    // Adapted from: http://bl.ocks.org/alignedleft/9612839                
	    var orig = d3.select(this);

	    var origNode = orig.node();
	    
	    var dupe = d3.select(origNode.parentNode.appendChild(origNode.cloneNode(true)));
	    
	    // Reattach the data: Cloning the point doesn't transfer the data, so we have to reattach it.
	    dupe.data([d])  
	    orig.remove();

	})
	    }

    function select_all_points() {
	_pcaso.selectAll("circle.unselected").attr("class", "selected");
    }


    function update_styles_on_selection() {
	
	color_points_by_selection()
	size_points_by_selection()
	push_selected_points_to_front()
    }


    ////////////////////////////    Brushing to select points    ///////////////////////////////////

    // var brushCell;
    function brushstart() {
	console.log("brushstart")
	d3.select(this).call(brush.clear());
	preview_x_scale.domain(domainByPC[current_p_in_preview.x]);
	preview_y_scale.domain(domainByPC[current_p_in_preview.y]);
    }

    function brushmove() {
	var p=current_p_in_preview; 
	var e = brush.extent();
	// console.log(e[0][0]) // x start
	// console.log(e[0][1]) // y start
	// console.log(e[1][0]) // x end
	// console.log(e[1][1]) // y end

	if ((e[0][0]-e[1][0] != 0) || (e[0][1]-e[1][1] != 0)) {
	    console.log("brushmove");

	    var num_highlighted = 0;
	    
	    
	    _pcaso.selectAll("circle").attr("class", function(d) {
		if (e[0][0] > d[p.x] || d[p.x] > e[1][0] || e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
		    return "unselected";
		} else {
		    return "selected";
		}
	    });
			 
			 // Count only the number in the preview plot by looking for all the selected circles within the preview plot
	    _pcaso.select("#preview").selectAll("circle.selected").each( function(d) {
	    num_highlighted = num_highlighted + 1;
	    });

	    //Update the number selected on the right panel 
	    d3.select("#search_results").html("" + num_highlighted + " selected");

	    color_points_by_selection();
	    size_all_points_small();
	}
    }

    function brushend() {
	console.log("brushend")
	if (brush.empty()) {
	    
	    colorPoints(_p_colorBy);
	    // select_all_points();
	    // _p_mode_highlight = -1;
	    // color_points_by_selection();
	    // size_all_points_small()
	}

    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////


    /////////////////////////////    Search    ////////////////////////////////////////

    // Meta-data search by text-box
    function handleSearch(event){
	var search_term = document.getElementById("search_input").value.toLowerCase();
	if (search_term.length > 0) {
	    // console.log(search_term);
	    // console.log(_p_header);
	    // console.log(_p_header[_c['fields-meta-id']-1]);
	    // console.log(_c['fields-meta']);

	    var use_exact_match = d3.select("#search_exact_checkbox").property("checked");
	    console.log(use_exact_match);

	    var unique_matches_to_show = [];
	    _pcaso.selectAll("circle").attr("class",function(d){
		var match = false;
		for (var i=0;i<_p_header.length;i++){
		    if (use_exact_match) {
			// console.log("exact matching")
			//  exact match
			if (d[_p_header[i]].toLowerCase() == search_term) {
			    match = true
			}

		    } else {
			//  inexact (substring) match
			if (d[_p_header[i]].toLowerCase().search(search_term) > -1) {
			    match = true
			}
			// console.log("inexact matching")
		    }
		}
		if (match==true) {
		    if ( unique_matches_to_show.indexOf(d) == -1){
			unique_matches_to_show.push(d);
		    }
		    return "selected"
		} else {
		    return "unselected";
		}
	    });

	    update_styles_on_selection();
	    

	    //////////////// OUTPUT selected points to the console (can be printed on the UI later) ///////////////////
	    // for (var i=0;i < unique_matches_to_show.length; i++) {
	    //   console.log(unique_matches_to_show[i]);  
	    // }
	    // console.log(unique_matches_to_show.length);


	    d3.select("#search_results").html("" + unique_matches_to_show.length + " found");

	}
	
	return false;
    }


    //  Clear the previous search results when typing a new query
    $('#search_input').each(function() {
	var elem = $(this);
	elem.data('oldVal',elem.val());
	elem.bind("propertychange change click keyup input paste",function(event){
	    // console.log("typing")
	    if (elem.data('oldVal') != elem.val()) {
		elem.data('oldVal',elem.val());

		$('#search_results').html("");
		// console.log("change detected")

	    }
	})
    })

	// ===========================================================================
	// == Returns pairs of elements: lower triangular + top-right-most square
	// ===========================================================================
	// e.g. x = [ 1, 2, 3, 5 ]
	//      y = [ 1, 2, 3, 7 ]
	//      Returns pairs of [1,2,3], and [0,4]/[5,7]
	function getLayoutPairs(x, y)
    {
	// Init
	var pairs = [], i, j;
	var n     = x.length - 1;

	// Generate lower triangular pairs
	for(j = 0; j < n; j++)
	    for(i = 0; i < j; i++)
		pairs.push({ i:i, j:j, x:x[i], y:y[j] })

	// Extra box for top right preview box
	// pairs.push({ i:0, j:n - 2, x:x[1], y:y[0] })

	return pairs;
    }


    // ===========================================================================
    // == Responsiveness
    // ===========================================================================

    // 
    // Resize SVG and sidebar when window size changes
    window.onresize = resizeWindow;
    function resizeWindow()
    {
	//
	var windowSize = getWindowSize()
	responsive_padding = getWindowSize()*_c['padding_fraction'];
	
	//
	_pcaso.attr("width", windowSize).attr("height", windowSize)

	// Panel on the right side of the plotting area
	d3.select("#pcaso-panel").style("width", getPanelWidth() + "px")

	//  Row 1:
	d3.select("#search_panel").style("height", (0.3*windowSize-20) + "px").style("width", getPanelWidth()*0.4 + "px")
	d3.select("#pcaso-hover").style("height", 0.3*windowSize + "px").style("width", getPanelWidth()*0.4 + "px")

	//  Row 2:
	d3.select("#pcaso-selection").style("height", 0.6*windowSize + "px").style("width", getPanelWidth()*0.2 + "px")
	d3.select("#pcaso-legend").style("height", 0.6*windowSize + "px").style("width", getPanelWidth()*0.4 + "px")
    }

    function getPanelWidth() {
	var w = window,
	d = document,
	e = d.documentElement,
	g = d.getElementsByTagName('body')[0];

	var windowHeight = w.innerHeight|| e.clientHeight|| g.clientHeight,
	windowWidth  = w.innerWidth || e.clientWidth || g.clientWidth,
	panelWidth   =  Math.min(windowWidth, windowHeight)

	return panelWidth*0.7;


    }
    // Return best window size to have room for plots and sidebar
    function getWindowSize()
    {
	var w = window,
	d = document,
	e = d.documentElement,
	g = d.getElementsByTagName('body')[0];

	var windowHeight = w.innerHeight|| e.clientHeight|| g.clientHeight,
	windowWidth  = w.innerWidth || e.clientWidth || g.clientWidth,
	windowSize   = Math.min(windowWidth, windowHeight)

	windowSize -= _c["padding"] + _c['margin-left']*2 + _c['svg-margin-bottom']*2 + 100 //200

	return windowSize
    }

    // ===========================================================================
    // == Compatibility
    // ===========================================================================

    // For IE <= 8: http://stackoverflow.com/a/1181586
    if(!Array.prototype.indexOf)
    {
	Array.prototype.indexOf = function(needle)
	{
	    for(var i = 0; i < this.length; i++) {
		if(this[i] === needle) {
		    return i;
		}
	    }
	    return -1;
	};
    }

    // ===========================================================================
    // == Misc
    // ===========================================================================
    function l(m) { console.log(m); }
    // http://stackoverflow.com/a/9716488
    function isNumeric(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
    // http://stackoverflow.com/a/11582513
    function getURLParameter(name) { return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null }

    var colorbrewer={
	YlGn:{3:["#f7fcb9","#addd8e","#31a354"],4:["#ffffcc","#c2e699","#78c679","#238443"],5:["#ffffcc","#c2e699","#78c679","#31a354","#006837"],6:["#ffffcc","#d9f0a3","#addd8e","#78c679","#31a354","#006837"],7:["#ffffcc","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#005a32"],8:["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#005a32"],9:["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"]},
	YlGnBu:{3:["#edf8b1","#7fcdbb","#2c7fb8"],4:["#ffffcc","#a1dab4","#41b6c4","#225ea8"],5:["#ffffcc","#a1dab4","#41b6c4","#2c7fb8","#253494"],6:["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#2c7fb8","#253494"],7:["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#0c2c84"],8:["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#0c2c84"],9:["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]},
	GnBu:{3:["#e0f3db","#a8ddb5","#43a2ca"],4:["#f0f9e8","#bae4bc","#7bccc4","#2b8cbe"],5:["#f0f9e8","#bae4bc","#7bccc4","#43a2ca","#0868ac"],6:["#f0f9e8","#ccebc5","#a8ddb5","#7bccc4","#43a2ca","#0868ac"],7:["#f0f9e8","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#08589e"],8:["#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#08589e"],9:["#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#0868ac","#084081"]},
	BuGn:{3:["#e5f5f9","#99d8c9","#2ca25f"],4:["#edf8fb","#b2e2e2","#66c2a4","#238b45"],5:["#edf8fb","#b2e2e2","#66c2a4","#2ca25f","#006d2c"],6:["#edf8fb","#ccece6","#99d8c9","#66c2a4","#2ca25f","#006d2c"],7:["#edf8fb","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#005824"],8:["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#005824"],9:["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#006d2c","#00441b"]},
	PuBuGn:{3:["#ece2f0","#a6bddb","#1c9099"],4:["#f6eff7","#bdc9e1","#67a9cf","#02818a"],5:["#f6eff7","#bdc9e1","#67a9cf","#1c9099","#016c59"],6:["#f6eff7","#d0d1e6","#a6bddb","#67a9cf","#1c9099","#016c59"],7:["#f6eff7","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016450"],8:["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016450"],9:["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016c59","#014636"]},
	PuBu:{3:["#ece7f2","#a6bddb","#2b8cbe"],4:["#f1eef6","#bdc9e1","#74a9cf","#0570b0"],5:["#f1eef6","#bdc9e1","#74a9cf","#2b8cbe","#045a8d"],6:["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#2b8cbe","#045a8d"],7:["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#034e7b"],8:["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#034e7b"],9:["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#045a8d","#023858"]},
	BuPu:{3:["#e0ecf4","#9ebcda","#8856a7"],4:["#edf8fb","#b3cde3","#8c96c6","#88419d"],5:["#edf8fb","#b3cde3","#8c96c6","#8856a7","#810f7c"],6:["#edf8fb","#bfd3e6","#9ebcda","#8c96c6","#8856a7","#810f7c"],7:["#edf8fb","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#6e016b"],8:["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#6e016b"],9:["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#810f7c","#4d004b"]},
	RdPu:{3:["#fde0dd","#fa9fb5","#c51b8a"],4:["#feebe2","#fbb4b9","#f768a1","#ae017e"],5:["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"],6:["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#c51b8a","#7a0177"],7:["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"],8:["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"],9:["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177","#49006a"]},
	PuRd:{3:["#e7e1ef","#c994c7","#dd1c77"],4:["#f1eef6","#d7b5d8","#df65b0","#ce1256"],5:["#f1eef6","#d7b5d8","#df65b0","#dd1c77","#980043"],6:["#f1eef6","#d4b9da","#c994c7","#df65b0","#dd1c77","#980043"],7:["#f1eef6","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#91003f"],8:["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#91003f"],9:["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#980043","#67001f"]},
	OrRd:{3:["#fee8c8","#fdbb84","#e34a33"],4:["#fef0d9","#fdcc8a","#fc8d59","#d7301f"],5:["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"],6:["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#e34a33","#b30000"],7:["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"],8:["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"],9:["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]},
	YlOrRd:{3:["#ffeda0","#feb24c","#f03b20"],4:["#ffffb2","#fecc5c","#fd8d3c","#e31a1c"],5:["#ffffb2","#fecc5c","#fd8d3c","#f03b20","#bd0026"],6:["#ffffb2","#fed976","#feb24c","#fd8d3c","#f03b20","#bd0026"],7:["#ffffb2","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],8:["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],9:["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#bd0026","#800026"]},
	YlOrBr:{3:["#fff7bc","#fec44f","#d95f0e"],4:["#ffffd4","#fed98e","#fe9929","#cc4c02"],5:["#ffffd4","#fed98e","#fe9929","#d95f0e","#993404"],6:["#ffffd4","#fee391","#fec44f","#fe9929","#d95f0e","#993404"],7:["#ffffd4","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#8c2d04"],8:["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#8c2d04"],9:["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#993404","#662506"]},
	Purples:{3:["#efedf5","#bcbddc","#756bb1"],4:["#f2f0f7","#cbc9e2","#9e9ac8","#6a51a3"],5:["#f2f0f7","#cbc9e2","#9e9ac8","#756bb1","#54278f"],6:["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"],7:["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"],8:["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"],9:["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#54278f","#3f007d"]},
	Blues:{3:["#deebf7","#9ecae1","#3182bd"],4:["#eff3ff","#bdd7e7","#6baed6","#2171b5"],5:["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"],6:["#eff3ff","#c6dbef","#9ecae1","#6baed6","#3182bd","#08519c"],7:["#eff3ff","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],8:["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],9:["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"]},
	Greens:{3:["#e5f5e0","#a1d99b","#31a354"],4:["#edf8e9","#bae4b3","#74c476","#238b45"],5:["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"],6:["#edf8e9","#c7e9c0","#a1d99b","#74c476","#31a354","#006d2c"],7:["#edf8e9","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],8:["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],9:["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]},
	Oranges:{3:["#fee6ce","#fdae6b","#e6550d"],4:["#feedde","#fdbe85","#fd8d3c","#d94701"],5:["#feedde","#fdbe85","#fd8d3c","#e6550d","#a63603"],6:["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#e6550d","#a63603"],7:["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],8:["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],9:["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#a63603","#7f2704"]},
	Reds:{3:["#fee0d2","#fc9272","#de2d26"],4:["#fee5d9","#fcae91","#fb6a4a","#cb181d"],5:["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"],6:["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"],7:["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],8:["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],9:["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"]},
	Greys:{3:["#f0f0f0","#bdbdbd","#636363"],4:["#f7f7f7","#cccccc","#969696","#525252"],5:["#f7f7f7","#cccccc","#969696","#636363","#252525"],6:["#f7f7f7","#d9d9d9","#bdbdbd","#969696","#636363","#252525"],7:["#f7f7f7","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525"],8:["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525"],9:["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525","#000000"]},
	PuOr:{3:["#f1a340","#f7f7f7","#998ec3"],4:["#e66101","#fdb863","#b2abd2","#5e3c99"],5:["#e66101","#fdb863","#f7f7f7","#b2abd2","#5e3c99"],6:["#b35806","#f1a340","#fee0b6","#d8daeb","#998ec3","#542788"],7:["#b35806","#f1a340","#fee0b6","#f7f7f7","#d8daeb","#998ec3","#542788"],8:["#b35806","#e08214","#fdb863","#fee0b6","#d8daeb","#b2abd2","#8073ac","#542788"],9:["#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788"],10:["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"],11:["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"]},BrBG:{3:["#d8b365","#f5f5f5","#5ab4ac"],4:["#a6611a","#dfc27d","#80cdc1","#018571"],5:["#a6611a","#dfc27d","#f5f5f5","#80cdc1","#018571"],6:["#8c510a","#d8b365","#f6e8c3","#c7eae5","#5ab4ac","#01665e"],7:["#8c510a","#d8b365","#f6e8c3","#f5f5f5","#c7eae5","#5ab4ac","#01665e"],8:["#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e"],9:["#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e"],10:["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"],11:["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"]},PRGn:{3:["#af8dc3","#f7f7f7","#7fbf7b"],4:["#7b3294","#c2a5cf","#a6dba0","#008837"],5:["#7b3294","#c2a5cf","#f7f7f7","#a6dba0","#008837"],6:["#762a83","#af8dc3","#e7d4e8","#d9f0d3","#7fbf7b","#1b7837"],7:["#762a83","#af8dc3","#e7d4e8","#f7f7f7","#d9f0d3","#7fbf7b","#1b7837"],8:["#762a83","#9970ab","#c2a5cf","#e7d4e8","#d9f0d3","#a6dba0","#5aae61","#1b7837"],9:["#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837"],10:["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"],11:["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"]},PiYG:{3:["#e9a3c9","#f7f7f7","#a1d76a"],4:["#d01c8b","#f1b6da","#b8e186","#4dac26"],5:["#d01c8b","#f1b6da","#f7f7f7","#b8e186","#4dac26"],6:["#c51b7d","#e9a3c9","#fde0ef","#e6f5d0","#a1d76a","#4d9221"],7:["#c51b7d","#e9a3c9","#fde0ef","#f7f7f7","#e6f5d0","#a1d76a","#4d9221"],8:["#c51b7d","#de77ae","#f1b6da","#fde0ef","#e6f5d0","#b8e186","#7fbc41","#4d9221"],9:["#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221"],10:["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"],11:["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"]},RdBu:{3:["#ef8a62","#f7f7f7","#67a9cf"],4:["#ca0020","#f4a582","#92c5de","#0571b0"],5:["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"],6:["#b2182b","#ef8a62","#fddbc7","#d1e5f0","#67a9cf","#2166ac"],7:["#b2182b","#ef8a62","#fddbc7","#f7f7f7","#d1e5f0","#67a9cf","#2166ac"],8:["#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac"],9:["#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac"],10:["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"],11:["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"]},
	RdGy:{3:["#ef8a62","#ffffff","#999999"],4:["#ca0020","#f4a582","#bababa","#404040"],5:["#ca0020","#f4a582","#ffffff","#bababa","#404040"],6:["#b2182b","#ef8a62","#fddbc7","#e0e0e0","#999999","#4d4d4d"],7:["#b2182b","#ef8a62","#fddbc7","#ffffff","#e0e0e0","#999999","#4d4d4d"],8:["#b2182b","#d6604d","#f4a582","#fddbc7","#e0e0e0","#bababa","#878787","#4d4d4d"],9:["#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d"],10:["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"],11:["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"]},
	RdYlBu:{3:["#fc8d59","#ffffbf","#91bfdb"],4:["#d7191c","#fdae61","#abd9e9","#2c7bb6"],5:["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"],6:["#d73027","#fc8d59","#fee090","#e0f3f8","#91bfdb","#4575b4"],7:["#d73027","#fc8d59","#fee090","#ffffbf","#e0f3f8","#91bfdb","#4575b4"],8:["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"],9:["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4"],10:["#a50026","#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"],11:["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"]},Spectral:{3:["#fc8d59","#ffffbf","#99d594"],4:["#d7191c","#fdae61","#abdda4","#2b83ba"],5:["#d7191c","#fdae61","#ffffbf","#abdda4","#2b83ba"],6:["#d53e4f","#fc8d59","#fee08b","#e6f598","#99d594","#3288bd"],7:["#d53e4f","#fc8d59","#fee08b","#ffffbf","#e6f598","#99d594","#3288bd"],8:["#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd"],9:["#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd"],10:["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"],11:["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]},RdYlGn:{3:["#fc8d59","#ffffbf","#91cf60"],4:["#d7191c","#fdae61","#a6d96a","#1a9641"],5:["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],6:["#d73027","#fc8d59","#fee08b","#d9ef8b","#91cf60","#1a9850"],7:["#d73027","#fc8d59","#fee08b","#ffffbf","#d9ef8b","#91cf60","#1a9850"],8:["#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850"],9:["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"],10:["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"],11:["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"]},Accent:{3:["#7fc97f","#beaed4","#fdc086"],4:["#7fc97f","#beaed4","#fdc086","#ffff99"],5:["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0"],6:["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f"],7:["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17"],8:["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17","#666666"]},Dark2:{3:["#1b9e77","#d95f02","#7570b3"],4:["#1b9e77","#d95f02","#7570b3","#e7298a"],5:["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e"],6:["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02"],7:["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d"],8:["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]},Paired:{3:["#a6cee3","#1f78b4","#b2df8a"],4:["#a6cee3","#1f78b4","#b2df8a","#33a02c"],5:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99"],6:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c"],7:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f"],8:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00"],9:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6"],10:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a"],11:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99"],12:["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]},Pastel1:{3:["#fbb4ae","#b3cde3","#ccebc5"],4:["#fbb4ae","#b3cde3","#ccebc5","#decbe4"],5:["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6"],6:["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc"],7:["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd"],8:["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec"],9:["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]},Pastel2:{3:["#b3e2cd","#fdcdac","#cbd5e8"],4:["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4"],5:["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"],6:["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae"],7:["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc"],8:["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc","#cccccc"]},Set1:{3:["#e41a1c","#377eb8","#4daf4a"],4:["#e41a1c","#377eb8","#4daf4a","#984ea3"],5:["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00"],6:["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33"],7:["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628"],8:["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf"],9:["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"]},
	Set2:{3:["#66c2a5","#fc8d62","#8da0cb"],4:["#66c2a5","#fc8d62","#8da0cb","#e78ac3"],5:["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854"],6:["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f"],7:["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494"],8:["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494","#b3b3b3"]},Set3:{3:["#8dd3c7","#ffffb3","#bebada"],4:["#8dd3c7","#ffffb3","#bebada","#fb8072"],5:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3"],6:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462"],7:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"],8:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"],9:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9"],10:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd"],11:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5"],12:["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]}}; 

}

document.addEventListener("DOMContentLoaded", init);
