'use strict';

var redis = require("redis");
var rclient = redis.createClient({prefix: 'virtual_queue:'});
rclient.on("error", (err) => { console.log("Error " + err); });

class Queue{

	static get(id){ return new this(id); }

	static getAll(callback){

		return (new Promise((res, rej) => {

			rclient.keys('virtual_queue:queue:*', (err, keys) => {

				if(err) rej(err);
				res(keys);

			});

		}))
			.then(keys => {

				var result = keys.map(key => {
					return this.get.call(this, key.split(':')[2]);
				});

				console.log(result)

				if(callback) callback(result);
				return result;

			})
			.catch(err => { console.log(err); });

	}

	static subscribe(callback){

		var subscriber = redis.createClient();
		subscriber.on("error", (err) => { console.log("Error " + err); });

		subscriber.on('message', (channel, message) => {
			callback(channel, message);
			subscriber.quit();
		});

		subscriber.subscribe('virtual_queue:channel');

	}

	static publish(message){ rclient.publish('virtual_queue:channel', message); }

	constructor(id){ this.id = id; }

	getItems(callback){

		return (new Promise((res, rej) => {

			rclient.hgetall('queue:' + this.id, (err, obj) => {

				if(err) rej(err);
				if(callback) callback(obj);
				res(obj);

			});

		}));

	}

	newAlias(alias){

		rclient.hset('aliases', this.id, alias);
		return this;

	}

	getAlias(callback){

		return new Promise((res, rej) => {

			rclient.hget('aliases', this.id, (err, alias) => {
				if(err) rej(err);
				if(callback) callback(alias);
				res(alias);
			});

		});

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

				return this.getAlias()
					.then( alias => {

						value++;
						var key = alias ? alias[0] : this.id[0];
						key = key + value;
						rclient.hset('queue:' + this.id, key, value);
						if(callback) callback(key);
						return key;

					});

			})
			.catch(err => { console.log(err); });

	}

	rmItem(key, callback){ rclient.hdel('queue:' + this.id, key, callback); }

	rm(callback){ rclient.del('queue:' + this.id, callback); }

}

module.exports = Queue;
