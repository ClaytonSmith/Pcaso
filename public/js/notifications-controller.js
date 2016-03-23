

// Call this somethings that is triggered when upload page is loaded

function init() {
    
    // Globals
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    var columnTypes  = [];
    var file         = null;
    var title        = null;
    
    // calculate once
    var timezoneOffset = 0;// new Date().getTimezoneOffset() / 60 * (-1) ;	   
    
    var dateFormatOptions = {
	weekday: "long",
	year: "numeric", month: "short",
	day: "numeric", hour: "2-digit", minute: "2-digit"
    };
    
    var data = {
	parentID: user._id,
	parentCollectionName: user.__t // will never change unless model name changes
    }
    
    function buildNotification(notification){
	var noteTime = new Date( notification.dateAdded );
	
	noteTime.setHours( noteTime.getHours() - timezoneOffset );
	
	var containerSettings = {
	    id: 'notification-'+ notification._id,
	    class: 'pure-g notification'
	};
	var isNewSettings = {
	    id: 'notification-'+ notification._id +'-is-new',
	    class: 'pure-u-1-8 notification-content',
	    href: '/notifications/'+ notification._id,
	    html: !notification.read ? '<span class="pure-badge-success">New</span>' : ''
	};
	var dateSettings = {
	    id: 'notification-'+ notification._id +'-date',
	    class: 'pure-u-5-24 notification-content',
	    href: '/notifications/'+ notification._id,
	    html: '<p>'+ noteTime.toLocaleTimeString("en-us", dateFormatOptions) +'</p>'
	};
	var bodySettings = {
	    id: 'notification-'+ notification._id +'-body',
	    class: 'pure-u-10-24 notification-content',
	    href: '/notifications/'+ notification._id,
	    html: '<p>'+ notification.title +'</p>'
	};
	var deleteContainerSettings = {
	    id: 'notification-'+ notification._id +'-delete-container',
	    class: 'pure-u-5-24 notification-content'
	}
	var deleteButtonSettings = {
	    id: 'notification-'+ notification._id +'-delete',
	    class: 'pure-button pure-button-error',
	    html: 'Delete'
	}
	
	var container = $('<div/>', containerSettings);
	var isNew = $("<a/>", isNewSettings);
	var date  = $("<a/>", dateSettings);
	var body  = $("<a/>", bodySettings);
	var deleteContainer = $("<div/>", deleteContainerSettings);
	var deleteButton = $('<button/>', deleteButtonSettings)
	


	
	deleteContainer.append( deleteButton );
	
	container.append( isNew );
	container.append( date );
	container.append( body );
	container.append( deleteContainer );


	deleteButton.click(function(){
	    $.ajax({
		url: '/api/notifications' ,
		type: 'DELETE',	
		cache: false,
		data: {notificationID: notification._id}
	    }).success(function(data){
		container.remove();
	    }).error(function(err){
		displayError();
	    });	    
	});
	
	
	return container;
    }


    function constructDisplay(notifications){
        
	var container = $('#notifications-container');
	
	notifications.forEach( function(note){
	    container.append( buildNotification( note ) );
	});
	
    }
    
    function displayError(){
	console.log('bad error')
    }
    
    $.ajax({
	url: '/api/notifications',
	type: 'GET',
	dataType: 'json',	
	cache: false,
	data: data
    }).success(function(data){
	constructDisplay( data );
    }).error(function(err){
	displayError();
    });
}

document.addEventListener("DOMContentLoaded", init);
