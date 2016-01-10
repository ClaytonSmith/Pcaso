var mongoose       = require('mongoose');
var extend         = require('mongoose-schema-extend');
var Async          = require('async');

var FileContainers = require('./fileContainer');
var Comments       = require('./comments');

var BaseSchema = mongoose.Schema({ 
    dateAdded:      { type: Number,  default: Date.now },            // Join date
    lastUpdated:    { type: Number,  default: Date.now }             // Last seen
});

BaseSchema.method({

    
    /** File management ********************************************/
    
    // Saves file's ID in list of files
    attachFile: function(fileID){
	return this.files.push(fileID);
    },
    
    // Removes a file from the user's list of files
    deleteFile: function(fileID){	
	var index = this.files.indexOf( fileID );
        
	if( index !== -1 ){
	    // log
	    
	    FileContainers.findOne({ _id: fileID }, function(err, doc){
		console.log('Found the doc');
		doc.remove();
	    });
	    
	    // Return deleted IDs. All other IDs left untouched
	    return this.files.splice( index, 1);
	} else {
	    
            // Err: just return empty array
	    return [];
	}
    },
    
    transferFileOwnership: function( entityID, collection, fileID ){

        FileContainers.findOne({ _id: fileID }, function(ferr, file){
            if( ferr )  return handleError( err );
            if( !file ) return; // Do something here
            
            // This is really cool
            var collection = mongoose.model(file.parent.collection);
            
            collection.findOne({ _id: entityID}, function(err, doc){
                if( derr ) return handleError( derr );
                
                // Can't give a file to something that doesn't exist
                if( !doc ) return false;
                
                // Cant give a file to someone who doesn't want it
                if( !doc.acceptFiles ) return false;
                
                // Tell file it has a new parent 
                file.assignNewOwner( doc );
                
                // tell doc it now owns a new file
                doc.attachFile( fileID );
                
                var index = this.files.indexOf( file._id );
                
                // We know the file does exist, just being save 
	        if( index !== -1 ){
	            return this.files.splice( index, 1);
	        } else {
	            return [];
	        }
            });
        });
    },
    
    /** comment management *****************************************/

    // Adds new comment ID to list of comments IFF commenting is enabled
    addComment: function(commentID){
        if( !this.commentable )
            return new Error( 'Commenting is not allowed on this object' );
        return this.comments.push( commentID );
    },
    
    // Commet must be deleted if the entity commented on is being removed
    deleteComment: function(commentID){	
	var index = this.comments.indexOf( commentID );
        
	if( index !== -1 ){
	    Comments.findOne({ _id: commentID }, function(err, doc){
		console.log('Found the comment');
		doc.remove();
	    });
            
            return this.comments.splice( index, 1);
	} else {
	    return [];
	}
    },


    /** pre-save ***************************************************/
    
    // Function called for base presave
    basePreSave: function(){
        this.lastUpdated = Date.now();
        // Other base related stuff
    },
    

    /** pre-remove cleanup *****************************************/

    // Function used to cleanup comments and files
    basePreRemove: function(){
        var base = this; 
        
        // pop pop pop
        while( base.fileIDs.length !== 0 ){
	    console.log('Deleting file', base.fileIDs[0]);
	    base.deleteFile( user.fileIDs[0] );
        };

        // pop pop pop
        while( base.comments.length !== 0 ){
	    console.log('Deleting file', base.fileIDs[0]);
	    base.deleteComment( user.fileIDs[0] );
        }; 
        
        // log
    }
});
                  

module.exports = mongoose.model('BaseSchema', BaseSchema);
