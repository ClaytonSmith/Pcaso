
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
	enableDeletingCommentWithReplies: true,
	readOnly: !user._id, 
	fieldMappings: {
	    fullname: 'username',
	    content: 'body',
	    parent: 'target',
	    createdByCurrentUser: 'createdByCurrentUser'
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
		error: error
	    }).success(function(data){
		
		if( !user._id ) success( data );
		else success( data.map( function(comment){
		    comment.createdByCurrentUser = ( user.username === comment.username);
		    return comment;
		}));
	    });
	},
	postComment: function(data, success, error) {
	    
	    data.topic = {
		id: focusEntity._id,
		collectionName: focusEntity.__t,
	    };
	    
	    $.ajax({
		type: 'POST',
		url: '/api/comments/create',
		data: data,
		cache: false,
		fail: error,
		dataType: 'json'
	    }).success(function(data){
		data.createdByCurrentUser = true;
		success( data );
	    });
	},
	putComment: function(data, success, error) {
	    
	    $.ajax({
		type: 'POST',
		url: '/api/comments/edit',
		data: data,
		cache: false,
		fail: error,
	    }).success(function(data){
		data.createdByCurrentUser = true;
		console.log( data );
		success( data );
	    });
	    
	    
	},
	deleteComment: function(data, success, error) {
	    $.ajax({
		type: 'DELETE',
		url: '/api/comments/' + data.id,
		success: success,
		fail: error
	    });
	}
    });
    
}

document.addEventListener("DOMContentLoaded", init);
