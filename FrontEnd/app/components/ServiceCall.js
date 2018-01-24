/*
	Consumming REST
*/
function get( path ) {

	return new Promise(
		function( resolve, reject ) { 
			$.ajax({

				type: 'GET',
				dataType: 'json',
				url: config.REST.URL + path,
				success: function( result ){        
					resolve( result );
				},
				error: function( status, err ) {
					reject( err )
				}

			} );
		} 
	);

}

function post( path, data ) {

	return new Promise(
		function( resolve, reject ) { 
			$.ajax({

				type: 'POST',
				dataType: 'json',
				url: config.REST.URL + path,
				data: data,
				success: function( result ){
					console.log(result)
					resolve( result );
				},
				error: function( status, err ) {
					reject( err )
				}

			});
		} 
	);

}

