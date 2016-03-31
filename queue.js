'use strict';

var redis = require("redis");
var rclient = redis.createClient({prefix: 'queue:'});

class Queue{

	static get(id){ return new this(id); }

	constructor(id){ this.id = id; }

	getItems(){

		return (new Promise((res, rej) => {

			rclient.hgetall(this.id, (err, obj) => {

				if(err) rej(err);
				res(obj);

			});

		}));

	}

	newItem(callback){

		this.getItems()
			.then(items => {

				var value = 0;
				if(items){

					var keys = Object.keys(items);
					var lastKey = keys.pop();
					value = items[lastKey];

				}

				return value;

			}).then(value => {

				value++;
				var key = this.id[0] + value;
				rclient.hset(this.id, key, value);

				if(callback) callback(key);

				return key;

			})
			.catch(err => { console.log(err); });

	}

	rmItem(key, callback){ rclient.hdel(this.id, key, callback); }
	
}

module.exports = Queue;
