var Client = function(){}

Client.prototype.change = function(cat){

	var fd = new FormData();
	fd.append('category', cat);

	sf.popup.open();

	var data = {
		dst: '/new-client',
		callback: function(req){
			try{
				var res = JSON.parse(req.responseText);
				if(res.notify) sf.alert(res.notify);
				else if(res.content){
					res.content = '<h1>' + res.content + '</h1>';
					res.content = 'Ваш номер: <br />' + res.content;
					res.content = '<div class="content">' + res.content + '</div>';
					sf.popup.insert(res.content);
				}
				else{
					sf.popup.close();
					sf.alert('Не достаочно данных.', 'warn');
				}
			}
			catch(e){
				sf.popup.close();
				sf.alert('Получены не корректные данные.');
				console.log(e);
				console.log(req.responseText);
			}
		},
		fallback: function(req){
			sf.alert('Произошла ошибка подключения.', 'err');
			sf.popup.close();
		},
	};

	var req = sf.ajax(data);
	req.send(fd);

}

sf.ready(function(){
	client = new Client;
});
