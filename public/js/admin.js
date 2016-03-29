var Admin = function(){}

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
