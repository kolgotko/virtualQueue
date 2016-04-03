'use strict';

var redis = require("redis");
var rclient = redis.createClient({prefix: 'queue:'});
rclient.on("error", (err) => { console.log("Error " + err); });

class Queue{

	static get(id){ return new this(id); }

	static getAll(callback){

		return (new Promise((res, rej) => {

			rclient.keys('queue:*', (err, keys) => {

				if(err) rej(err);
				res(keys);

			});

		}))
			.then(keys => {

				var result = keys.map(key => {
					return this.get.call(this, key.split(':')[1]);
				});

				if(callback) callback(result);
				return result;

			})
			.catch(err => { console.log(err); });

	}

	static subscribe(callback){

		var subscriber = redis.createClient({prefix: 'queue:'});
		subscriber.on("error", (err) => { console.log("Error " + err); });

		subscriber.on('message', (channel, message) => {
			callback(channel, message);
			subscriber.quit();
		});

		subscriber.subscribe('channel');

	}

	static publish(message){ rclient.publish('channel', message); }

	constructor(id){ this.id = id; }

	getItems(callback){

		return (new Promise((res, rej) => {

			rclient.hgetall(this.id, (err, obj) => {

				if(err) rej(err);
				if(callback) callback(obj);
				res(obj);

			});

		}));

	}

	newItem(callback){

		return this.getItems()
			.then(items => {

				var value = 0;
				if(items){

					var keys = Object.keys(items);
					var lastKey = keys.pop();
					value = items[lastKey];

				}

				return value;

			})
			.then(value => {

				value++;
				var key = this.id[0] + value;
				rclient.hset(this.id, key, value);

				if(callback) callback(key);

				return key;

			})
			.catch(err => { console.log(err); });

	}

	rmItem(key, callback){ rclient.hdel(this.id, key, callback); }

	rm(callback){ rclient.del(this.id, callback); }

}

module.exports = Queue;
