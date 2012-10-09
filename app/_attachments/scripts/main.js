function searchDB(query, checkFields){
	$('#searchResults').empty();
	$('#searchResults').append('<h2>Search Results</h2>');
	FTIndexer.getWordFrequency('PSY', printResult);
	FTIndexer.searchDB(query, checkFields, getResult);
}

function getResult(result){
	console.log(result);
	$('#searchResults').append('<li>' + result.doc + ' : ' + result.word + ' in ' + result.field);
}

function printResult(result){
	console.log('Frequency : ' + result)
}
