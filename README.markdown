#WHAT IS JSFTI?

JSFTI is short for Javascript Full Text Indexing. It's a pure Javascript fulltext indexing and search library for CouchDB.  
In contrast to Lucene, it does not need Java and runs purely in the browser. This makes it possible to offer fulltext search on mobile devices that use CouchDB but do not have Java. Furthermore, indexes are kept in a separate CouchDB database (named 'jsfti'), which makes it possible to synchronise the indexed master database together with the jsfti index database. This way, the mobile device starts out with an indexed and searchable database and does not need to commit resources for initial indexation.  
JSFTI only has one dependency : JQuery, which comes standard with CouchDB.
Licensed under the Apache License, Version 2.0.

##HOW TO USE JSFTI?

If you want to test jsfti, make a CouchApp (or database) 'test' in CouchchDB and add following documents :

*var doc1 = {'_id':'doc1', 'song':'gangnam style', 'genre':'Korean Pop', 'author':'PSY', 'year':2012};*  
*var doc2 = {'_id':'doc2', 'song':'Calling You Because It\'s Raining', 'genre':'K-POP', 'author':'PSY', 'year':'2006'};*  

*$.couch.db('test').saveDoc(doc1, {});*  
*$.couch.db('test').saveDoc(doc2, {});*  

Create a 'scripts' subdirectory in '_attachments' and add the 'jsfti.js' and 'main.js' files. Then add the included html file ('index.html') to the '_attachments' directory.
Point your browser (only tested in Firefox 16.0 until now!) to http://127.0.0.1:5984/test/_design/app/index.html and index your database first by entering 'test' in the 'Database to index' field. Click on 'Go' and wait until the indexing is finished.
You should now have a new database 'jsfti' which contains all the words of the two documents as separate documents (the indexes).
Query the database as a fulltext search where all fields are searched for the words. Example of a fulltext search : 'gangnam and 2012 and PSY or 2006'. No field names (will be added in a following version) or quotes are required. Only single words are accepted. If you want to search for a sentence, you have to combine all the words with 'and'.

##AVAILABLE METHODS

* To index a database : **FTIndexer.indexDB(databaseName)**  
This deletes any previous index databases and creates a new 'jsfti' index database.

* To index just one document : **FTIndexer.addDoc(doc)**  
This avoids having to index the whole database whenever a new document is added to the master database. Please note that the document itself is passed to the function, not the name. Also note that you are still responsible to make sure that the document is saved in the master database in a separate call (e.g. $.couch.db('test').saveDoc(doc1, {})).

* To remove an indexed document : **FTIndexer.removeDoc(docName)**  
This removes all index information from the 'jsfti' database. In contrast to the addDoc method, the name of the indexed document is passed to the function. Please note that you are still responsible to make sure that the document is removed from the master database in a separate call (e.g. $.couch.db('test').removeDoc(doc1, {}))

* To update an already indexed document : **FTIndexer.updateDoc(doc)**  
This updates a document that was already indexed. Please note that the document itself is passed to the function, not the name. Also note that you are still responsible to make sure that the document is updated in the master database in a separate call (e.g. $.couch.db('test').saveDoc(doc1, {})).

* To execute a query : **FTIndexer.searchDB(query, callbackFunction)**  
Results will be passed to the callback function you provide as a parameter. For an example of such a callback, take a look at the 'main.js' file.  
Results are JSON objects in the following format : *{doc='docName', field='fieldName1,fieldName2,fieldName3,...', word='wordName1, wordName2, wordName3,...'}*, where  
	* docName is the name of the document that satisfies the query
	* field is a string that contains one or more fields that contain the searched words
	* word is a string that contains one or more searched words  
An example : if the query 'gangnam and 2012 and PSY or 2006' is launched on the testdata (see higher), then two search result objects are returned :  
	            1. *{ doc='doc2', field='year', word='2006'}* => this satisfies 'or 2006'  
	            2. *{ doc='doc1', field='song,year,author', word='gangnam,2012,psy'}* => this satisfies 'gangnam and 2012 and PSY'  

* To add stopwords (ignored in the indexing process) : **Util.setStopWords(['newStopWord', 'anotherStopWord'], false)**  
If you use a 'true' value for the last parameter, the existing stopwords array is replaced by the passed stopwords array. Please look at the 'jsfti.js' file to see the stopwords that are used.

* To count the occurences of a word in your database : **FTIndexer.getWordFrequency(word, callbackFunction)**  
This will count the occurences of a word in all documents in your database and pass this value to the callback function you provide as a parameter. For an example of such a callback, take a look at the 'main.js' file.
Words that occur several times in the same field in the same document are only counted once. If they occur several times in different fields in the same document, they are counted separately.




