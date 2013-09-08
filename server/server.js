var express   = require('express');
var mongoskin = require('mongoskin');

//Allow CORS requests
var allowCrossDomain = function (req, res, next) {
	res.header('Access-Control-Allow-Origin', config.allowedDomains);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	next();
};

var app = express();

app.configure(function() {
  app.use(express.bodyParser());
  app.use(allowCrossDomain);
});

var db = mongoskin.db('mongodb://admin:contact_manager@paulo.mongohq.com:10093/contact_manager', {safe:true});

app.param('collectionName', function (req, res, next, collectionName) {
	req.collection = db.collection(collectionName);
	return next()
});

app.get('/', function (req, res) {
	res.send('Please select a collection, e.g., /contacts')
});

app.get('/:collectionName', function(req, res, next) {
  req.collection.find({},{limit:1000, sort: [['_id',-1]]}).toArray(function(e, results){
    if (e) return next(e);
    res.send(results)
  })
});

app.post('/:collectionName', function (req, res, next) {
	req.collection.insert(req.body, {}, function (e, results) {
		if (e) return next(e);
		res.send(results)
	})
});

app.get('/:collectionName/:id', function (req, res, next) {
	req.collection.findOne({_id: req.collection.id(req.params.id)}, function (e, result) {
		if (e) return next(e);
		res.send(result)
	})
});

app.put('/:collectionName/:id', function (req, res, next) {
	req.collection.update({_id: req.collection.id(req.params.id)}, {$set: req.body}, {safe: true, multi: false}, function (e, result) {
		if (e) return next(e);
		res.send((result === 1) ? {msg: 'success'} : {msg: 'error'})
	})
});

app.del('/:collectionName/:id', function (req, res, next) {
	req.collection.remove({_id: req.collection.id(req.params.id)}, function (e, result) {
		if (e) return next(e);
		res.send((result === 1) ? {msg: 'success'} : {msg: 'error'})
	})
});


app.listen(8080);
