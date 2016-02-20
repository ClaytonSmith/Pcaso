

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    // Globals
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    var columnTypes  = [];
    var file         = null;
    

    $('#avatar-select').change(function(e){
	if( !e.target.files ) return null;
	
	file = e.target.files[0];
    	renderImageIntoElement(this, $('#avatar-display'));
	return false;
    });
    
    $('input:checkbox[name="email-visibility"]').
	prop('checked', focusEntity.profileSettings.displayEmail); 
    
    $('input:radio[name=privacySettings]').
	filter('[value='+ focusEntity.fileSettings.defaults.visibility +' ]').
	prop('checked', true );


    $.validator.prototype.checkForm = function () {
        //overriden in a specific page
        this.prepareForm();
        for (var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++) {
            if (this.findByName(elements[i].name).length != undefined
		&& this.findByName(elements[i].name).length > 1) {
                for (var cnt = 0; cnt < this.findByName(elements[i].name).length; cnt++) {
                    this.check(this.findByName(elements[i].name)[cnt]);
                }
            } else {
                this.check(elements[i]);
            }
        }
        return this.valid();
    }
    
    // Form validation
    $("#profile-settings-form").validate({
	submitHandler: function(form) {
    	    var form      = $("#profile-settings-form");
    	    var formData  = new FormData();	
	    var actionURL = form.attr('action');
	    var method    = form.attr('method').toUpperCase();

	    formData.append( 'displayEmail', $('input:checkbox[name="email-visibility"]').is(':checked') );
	    formData.append( 'defaultVisibility', $('input:radio[name=privacySettings]:checked').val() );
	    
	    formData.append( 'file', file);	    
	    
	    $.ajax({
                url: actionURL,
                type: method,
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
	    }).success( function(data, textStatus){
                window.location.replace( data );
	    });
	}
    });
    
}

document.addEventListener("DOMContentLoaded", init);
