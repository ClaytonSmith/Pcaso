(function($){
    $.fn.serializeObject = function(){

        var self = this,
        json = {},
        push_counters = {},
        patterns = {
            "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
            "key":      /[a-zA-Z0-9_]+|(?=\[\])/g,
            "push":     /^$/,
            "fixed":    /^\d+$/,
            "named":    /^[a-zA-Z0-9_]+$/
        };


        this.build = function(base, key, value){
            base[key] = value;
            return base;
        };

        this.push_counter = function(key){
            if(push_counters[key] === undefined){
                push_counters[key] = 0;
            }
            return push_counters[key]++;
        };

        $.each($(this).serializeArray(), function(){

            // skip invalid keys
            if(!patterns.validate.test(this.name)){
                return;
            }

            var k,
            keys = this.name.match(patterns.key),
            merge = this.value,
            reverse_key = this.name;

            while((k = keys.pop()) !== undefined){

                // adjust reverse_key
                reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');

                // push
                if(k.match(patterns.push)){
                    merge = self.build([], self.push_counter(reverse_key), merge);
                }

                // fixed
                else if(k.match(patterns.fixed)){
                    merge = self.build([], k, merge);
                }

                // named
                else if(k.match(patterns.named)){
                    merge = self.build({}, k, merge);
                }
            }

            json = $.extend(true, json, merge);
        });

        return json;
    };


})(jQuery);


// Given a source element containing a file,
// the file will be rendered into a destination
// Targeted for file input and img elements
function renderImageIntoElement(source, dest) {
    if (source.files && source.files[0]) {
        var reader = new FileReader();
        
        reader.onload = function (e) {
            dest.attr('src', e.target.result);
        }
        
        reader.readAsDataURL(source.files[0]);
    }
}


function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName;
    
    for (var i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? undefined : sParameterName[1];
        }
    }
};


function buildTile( datascapeContainer ){
    var dsTime = new Date( datascapeContainer.dateAdded );

    var timezoneOffset = new Date().getTimezoneOffset() / 60 * (-1) ;	

    var dateFormatOptions = {
	year: "numeric", month: "short",
	day: "numeric", hour: "2-digit", minute: "2-digit"
    };

    
    dsTime.setHours( dsTime.getHours() - timezoneOffset - 5);

    var containerSettings = {
	class: "dataspace-tile pure-u-1-5",
	style: 'background-image: url('+ datascapeContainer.links.thumbnail +');'
    };
    var linkSettings = {
	href: datascapeContainer.links.local,
	style: "display: block; height: 100%;"
    };
    var authorSettings = {
	class: "view-count",
	html: 'Painter: '
	    + ( datascapeContainer.parent.name.prefix || '' )
	    + ' '
	    + datascapeContainer.parent.name.first 
	    + ' '
	    + datascapeContainer.parent.name.last[0]
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
	html: 'Created: '+ dsTime.toLocaleTimeString("en-us", dateFormatOptions)
    };
    
    
    var container = $('<div/>', containerSettings )
    var link      = $('<a/>', linkSettings )
    var title     = $('<h4/>', {html: datascapeContainer.displaySettings.title });
    var author    = $('<p/>', authorSettings);
    var views     = $('<p/>', viewSettings);
    var comments  = $('<p/>', commentSettings);
    var created   = $('<p/>', createdSettings);
    
    link.append( title );
    link.append( author );
    link.append( views );
    //link.append( comments );
    //link.append( created );
    container.append( link );

    console.log( container ) ;
    return container;
};
