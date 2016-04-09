#!/usr/bin/env node
'use strict';

var express = require('express');
var jade = require('jade');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var multipart = require('connect-multiparty');
var queue = require('./queue.js');

var app = express();

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'jade');

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multipart());

app.use(cookieSession({
	name: 'session',
	keys: ['key1', 'key2']
}));

app.get('/admin/subscribe', function(req, res){

	queue.subscribe((channel, data) => {

		res.json({ queue: data });

	});

});

app.post('/admin/close', function(req, res, next){

	if(!req.body.queue || !req.body.id)
		res.json({ notify: 'Ошибка запроса. Переданы не все данные.' });

	queue.get(req.body.queue).rmItem(req.body.id, (err, status) => {
		queue.publish(req.body.queue);
		res.json({ status: status });
	});

});

app.post('/new-client', (req, res) => {

	if(!req.body.id || !req.body.alias) res.json({ notify: 'Ошибка запроса.' });

	queue.get(req.body.id)
		.newAlias(req.body.alias)
		.newItem()
		.then(id => {
			queue.publish(req.body.id);
			res.json({ content: id.toUpperCase() });
		});

});


app.get('/admin', (req, res) => {

	queue.getAllData()
		.then(result => {
			res.render('admin', result);
		});

});

app.get('/admin/queues', (req, res) => {

	queue.getAllData()
		.then(result => {
			res.render('queues', result);
		});

});

app.listen(3000, function(){
	console.log('App listen port: 3000');
});
