/* 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions
 * and limitations under the License.
 */

"use strict";
 
var STOPWORDS = ["a", "an", "and", "are", "as", "at", "be", "but",
		     "by", "for", "if", "in", "into", "is", "it", "no",
		     "no", "not", "of", "on", "or", "s", "such", "t",
		     "that", "the", "their", "they", "then", "there", 
		     "these", "this", "to", "was", "will", "with"];

var INDEX_DB = 'jsfti';

var Util = {
		split: function(indexString){
			var results = [];
			var words = indexString.toLowerCase().split(/\s+/);
			$.each(words, function(key, val){
				var w = val.replace(/[,\."]+/g, "");
				if(w.length > 0 && ($.inArray(w, STOPWORDS) === -1)){ results[results.length] = w; }
			});
			return results;
		},
		
		// check if object is in array
		isObjectInArray: function(entry, arr){
			var r = -1;
		    $.grep(arr, function(n, i){
		        if(n.doc === entry.doc && n.field === entry.field){ r = 0; }
		    });
		    return r;
		},
		
		// check if key (part of object) is in array 
		// and return the field
		isKeyInArray: function(key, arr){
			var f = '';
		    $.grep(arr, function(n, i){
		        if(n.doc === key){ f = n.field; }
		    });
		    return f;
		},
		
		removeKeyInArray: function(key, arr){
			var newArr;
			newArr = $.grep(arr, function(n){ return n.doc !== key; });
			return newArr;
		},
		
		intersect: function(arr1, arr2, fields){
			var result = [];
			var field;
			// nothing in common, because one array is empty
			if(arr1.length === 0 || arr2.length === 0){
				return result;
			}
			$.each(arr1, function(key, val){
				if((field = Util.isKeyInArray(val.doc, arr2)) !== ''
						&& Util.isObjectInArray(val, result) === -1){
					val.field += ',' + field;
					result.push(val);
				}
			});
			return result;
		},
		
		setStopWords: function(arr, append){
			if(append === true){ $.each(arr, function(key, val){ STOPWORDS.push(val); }); }
			else{ STOPWORDS = arr; }
		}
};

var FTIndexer = {
	addDoc: function(doc){
		var docID = doc._id;
		$.each(doc, function(field, val){
		    val = val.toString();
		    var words = Util.split(val);
			$.each(words, function(idx, word){
				// don't index id and rev fields
				if(field !== '_id'){
					if(field !== '_rev'){ FTIndexer.addIndex(word, docID, field); }
				}
		    });
		});
	},
	
	removeDoc: function(docID){
		$.couch.db(INDEX_DB).allDocs({
		    success: function(data){
		    	$.each(data.rows, function(key, val){
		    		// leave design docs alone
		    		if(val.id !== '_design/app'){
		    			$.couch.db(INDEX_DB).openDoc(val.id, {
		    				success: function(data){
		    					var docs = Util.removeKeyInArray(docID, data.docs);
		    					if(docs.length > 0){
		    						data.docs = docs;
		    						$.couch.db(INDEX_DB).saveDoc(data, {});
		    					}
		    					// no docs with keyword left, remove index
		    					else{ $.couch.db(INDEX_DB).removeDoc(data, {}); }
		    				}
		    			});
		    		}
				});
		    }
		});
	},
	
	updateDoc: function(doc){
		$.when(FTIndexer.removeDoc(doc._id)).done(FTIndexer.addDoc(doc));
	},
	
	searchDB: function(query, callback){
		if(query === ''){ return }
		var orRequest;
		var index;
		var andRequests = [];
		var intersect = [];
		var orInput = [];
		var andInput = [];
		var docs = [];
		var intersectStart = true;
		orInput = query.toLowerCase().split(' or ');
		$.each(orInput, function(key, orTerm){
			andInput = orTerm.split(' and ');
			andRequests = [];
			intersect = [];
			var endResult = [];
			$.each(andInput, function(key, andTerm){ andRequests.push($.ajax('../../../' + INDEX_DB + '/' + andTerm)); });
			intersectStart = true;
			$.when.apply($, andRequests).done(function(){
			    $.each(arguments, function(key, val){
			    	// single 'or' term
			    	if(!(val instanceof Array)){
			    		// get the keyword
			    		if(val.promise){
			    			index = JSON.parse(val.responseText);
			    			docs = index.docs;
					    	$.each(docs, function(key, val){
					    		val.word = orTerm;
					    		callback.call(this, val);
					    	});
			    		}
			    	}
			    	// several 'and' terms
			    	else{
				    	index = JSON.parse(val[2].responseText);
				    	docs = index.docs;
				    	// add searched word to docs
				    	$.each(docs, function(key, val){ val.word = orTerm.replace(/ and /g, ','); });
				    	// first run, nothing to intersect yet
				    	if(intersectStart == true){
			    			intersect = docs;
			    			intersectStart = false;
			    		}
				    	// other runs, find common doc
			    		else{ intersect = Util.intersect(intersect, docs); }
			    	}
			    });
			    // now call the callback with the intersected values
		    	$.each(intersect, function(key, val){ callback.call(this, val); });
			});
		});
	},
	
	getWordFrequency: function(word, callback){
		$.when($.ajax('../../../' + INDEX_DB + '/' + word.toLowerCase())).done(function(ajaxArgs){
			callback.call(this, JSON.parse(ajaxArgs).docs.length);
		});
	},

	indexDB: function(db){
		if(db == ''){ return }
		$.couch.db(INDEX_DB).drop({
		    success: function(data) {
		    	$.couch.db(INDEX_DB).create({});
		    	// save the name of the indexed db
		    	// not used now, but necessary for includeDocs
		    	var doc = {'_id':'indexeddbname_','name':db};
				$.couch.db(INDEX_DB).saveDoc(doc, {});
		    	$.couch.db(db).allDocs({
				    success: function(data){
				    	$.each(data.rows, function(key, val){
				    		if(val.id !== '_design/app'){
					    		$.couch.db(db).openDoc(val.id, {
					    		    success: function(data){ FTIndexer.addDoc(data); }
					    		});
				    		}
						});
				    }
				});
		    },
		    error: function(XMLHttpRequest, textStatus, errorThrown){
		    	// try again
		    	$.couch.db(INDEX_DB).create({});
		    	FTIndexer.indexDB(db);
		    }
		});
	},
	
	addIndex: function(word, docID, field){
		var d = {};
		d.doc = docID;
		d.field = field;
		$.couch.db(INDEX_DB).openDoc(word, {
			success: function(data){
				// avoid duplicates
				if(Util.isObjectInArray(d, data.docs) === -1){
					data.docs.push(d);
					$.couch.db(INDEX_DB).saveDoc(data, {
					    error: function(status) {
					    	// try again : async doc update conflict
					    	FTIndexer.addIndex(word, docID, field);
					    }
					});
				}
			},
			// index doesn't exist yet
			error: function(XMLHttpRequest, textStatus, errorThrown){
				var idx = {};
				idx.docs = [];
				idx.docs.push(d);
				idx._id = word;
				$.couch.db(INDEX_DB).saveDoc(idx, {});
			}
		});
	}
};
