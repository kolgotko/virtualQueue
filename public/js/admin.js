var Admin = function(){
	this.subscribe();
}

Admin.prototype.subscribe = function(){

	var data = {
		dst: '/admin/subscribe',
		context: this,
		method: 'GET',
		callback: function(req){
			try{
				var res = JSON.parse(req.responseText);
				if(res.queue) this.refresh(res.queue);
			}
			catch(e){ console.log(e); }
			this.subscribe();
		},
		fallback: function(){
			var self = this;
			console.log('Connection error. Retry...');
			setTimeout(function(){ self.subscribe(); }, 2000);
		},
	};

	sf.ajax(data).send();

}

Admin.prototype.refresh = function(id){

	var data = {
		context: this,
		dst: '/admin/' + id,
		method: 'GET',
		callback: function(req){
			sf('#'+id).inner = req.responseText;
		},
		fallback: function(){ sf.alert('Возникли проблемы с подключением.', 'err'); },
	}

	sf.ajax(data).send();

}

Admin.prototype.close = function(queue, id){

	var fd = new FormData;
	fd.append('queue', queue);
	fd.append('id', id);

	var data = {
		dst: '/admin/close',
		callback: function(req){
			console.log(req.responseText);
		},
		fallback: function(req){ sf.alert('Проблема с сетевым подключением.'); },
	};

	var req = sf.ajax(data);
	if(req) req.send(fd);
}

var admin = new Admin;
