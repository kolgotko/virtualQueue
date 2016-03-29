#!/usr/bin/env node
'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var multipart = require('connect-multiparty');

var redis = require("redis");
var rclient = redis.createClient({prefix: 'queue:'});

rclient.on("error", function (err) {
	console.log("Error " + err);
});

 
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

function getContent(){
	
}

app.post('/admin/close', function(req, resp, next){

	if(!req.body.queue || !req.body.id)
		resp.json({ notify: 'Ошибка запроса. Переданы не все данные.' });

		rclient.hdel(req.body.queue, req.body.id, function(err, res){

			resp.json({ content: res});

		});

});

app.post('/new-client', (req, resp) => {

	if(!req.body.category) resp.json({ notify: 'Ошибка запроса.' });

	// rclient.del(req.body.category);
	
	(new Promise((res, rej) => {
		
		rclient.hkeys(req.body.category, function(err, replies){
			if(err) rej(err);
			res(replies);
		});

	}))
		.then(replies => {

			if(replies.length){
				var lastKey = replies.pop();
				return new Promise((res, rej) => {

					rclient.hget(req.body.category, lastKey, (err, replie) => {
						if(err) rej(err);
						res(replie);
					});
				
				});
			} 
			else return 0;
		})
		.then(val => {

			val++;
			var key = req.body.category[0] + val;
			rclient.hset(req.body.category, key, val);
			resp.json({ content: key.toUpperCase() });

		})
		.catch(err => {
			resp.json({ notify: err });
		});

});


app.get('/admin', function(req, resp){

	// rclient.del('queue:first');
	
	var queues = {};

	(new Promise((res, rej) => {

		rclient.keys('queue:*', (err, keys) => {
			if(err) rej(err);
			res(keys);
		});
	
	}))
		.then(keys => {

			var promise = function(key){

				key = key.split(':')[1];

				return new Promise((res, rej) => {

					rclient.hgetall(key, (err, obj) => {
						if(err) rej(err);
						queues[key] = obj;
						res(true);
					});

				});

			}

			return Promise.all(keys.map(promise));

		})
		.then(result => {
			resp.render('admin', {queues: queues});
		})
		.catch(err => { console.log(err); resp.render('admin', {queues: queues}); });

});

app.listen(3000, function(){
	console.log('App listen port: 3000');
});
