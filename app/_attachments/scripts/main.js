function searchDB(query){
	$('#searchResults').empty();
	$('#searchResults').append('<h2>Search Results</h2>');
	FTIndexer.searchDB(query, function(result){
		$('#searchResults').append('<li>' + result.doc + ' : ' + result.word + ' in ' + result.field);
	});
}

function getWordFrequency(word){
	FTIndexer.getWordFrequency(word, function test(r){ 
		alert('Frequency : ' + r); 
	});
}

