//	var doc1 = {'_id':'doc1', 'song':'gangnam style', 'genre':'Korean Pop', 'author':'PSY', 'year':2012};
//	var doc2 = {'_id':'doc2', 'song':'Calling You Because It\'s Raining', 'genre':'K-POP', 'author':'PSY', 'year':'2006'};
//
//	$.couch.db('jsfti').saveDoc(doc1, {});
//	$.couch.db('jsfti').saveDoc(doc2, {});

//	FTIndexer.indexDB('jsfti');

//	FTIndexer.addDoc(doc1);
//	FTIndexer.addDoc(doc2);
//	FTIndexer.removeDoc('doc2');
//	FTIndexer.updateDoc(doc2);

//	Util.setStopWords(['newStopWord', 'anotherStopWord'], false);

var results = [];

function searchDB(query, checkFields){
	$('#searchResults').empty();
	FTIndexer.searchDB(query, checkFields, getResult);
}

function getResult(result){
	results.push(result.doc);
	$('#searchResults').append('<li>' + result.doc);
}
