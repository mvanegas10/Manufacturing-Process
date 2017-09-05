/*
	View
*/

(function() {

	var config = '../../assets/config/config.json';

	function get( path ) {

		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: config.REST.URL + path,
			success: function(data){        
				alert(data);
			}
		});
		
	}

	return {
		get : get,
	};

} )();


