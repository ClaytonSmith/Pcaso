
function init() {
    console.log( !!window.globaData.user._id );
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    
    $('#comments-container').comments({
	profilePictureURL: user.links.avatar,
	roundProfilePictures: true,
	textareaRows: 1,
	fullname: user.username,
	currentUserIsAdmin: false,
	enableAttachments: false,
	enableUpvoting: false,
	enableEdditing: false,
	readOnly: !user._id, // is the user logged in, if not `_id` will be null and thus fale
	fieldMappings: {
	    fullname: 'username',
	    content: 'body',
	    parent: 'target'
	},
	
	getComments: function(success, error) {
	    
	    var data = {
		topic: {
		    id: focusEntity._id,
		    collectionName: focusEntity.__t
		}	
	    };
	    
	    console.log( data );
	    $.ajax({
		url: '/api/comments/get',
		type: 'POST',
		dataType:'json',	
		cache: false,
		data: data,
		success: success,
		error: error
	    });
	},
	postComment: function(data, success, error) {
	    console.log( data );
	    
	    data.topic = {
		id: focusEntity._id,
		collectionName: focusEntity.__t
	    };
	    
console.log( data );
	    $.ajax({
		type: 'post',
		url: '/api/comments',
		data: data,
		cache: false,
		success: success,
		fail: error,
		dataType: 'json'
	    });
	},
	putComment: function(data, success, error) {
	    setTimeout(function() {
		console.log( 'hello' );
		success(data);
	    }, 500);
	},
	deleteComment: function(data, success, error) {
	    $.ajax({
		type: 'DELETE',
		url: '/api/comments',
		data: data,
		success: success,
		fail: error,
		dataType: 'json'
	    });
	}
    });
    
}

document.addEventListener("DOMContentLoaded", init);
