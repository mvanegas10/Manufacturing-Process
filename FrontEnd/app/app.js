/*
	Data
*/
// Passed dataset
var year_passed;
var tod_passed;

// Failed dataset
var year_failed;
var tod_failed;

/*
	STRAD WHEEL
*/ 
var timewheel;
var colorArray = ["#31D66C", "#FF5E57"];

/*
	Crossfilter variables
*/
var cf_passed;
var cf_failed;

// Dimensions
var dimensions = { 'passed':[], 'failed':[] };
var dim_passed;
var dim_failed;
var date_dim = { 'passed':[], 'failed':[] };
var filter_dimensions = { 'passed':[], 'failed':[] };
var rounds = [ 0, 0, 0, 1, 2 ];
var minimum = [];
var maximum = [];

// Groupings
var groups = { 'passed':[], 'failed':[] };
var group_passed;
var group_failed;

/*
	DC
*/
var charts = { 'passed':[], 'failed':[] };

/*
	Creates a STRAD WHEEL
*/
function createSTRAD( selector, year_passed, year_failed, tod_passed, tod_failed ) {

	function colorScale(n) { return colorArray[n % colorArray.length]; }

	//populate div with the tool
	timewheel = new StradWheel( selector, colorScale );

	timewheel.setSelectableYears( [ '2008' ] );
	timewheel.setYear( '2008' );

	//Register to changes:

	timewheel.onDatesChange(function(new_datesrange){
		var filter = function( d ) { 
			if( new_datesrange[0].valueOf( ) >= new_datesrange[1].valueOf( ) ) return ( d >= new_datesrange[0] || d <= new_datesrange[1] ); 
			else return ( d >= new_datesrange[0] && d <= new_datesrange[1] ); 
		};
		date_dim.passed[0].filter( filter );
		date_dim.failed[0].filter( filter );
		dc.redrawAll( );

		d3.select( '#dateSelection' )
			.text( 'Date selection from: ' + new_datesrange[0].toDateString() + ' to ' + new_datesrange[1].toDateString() )
			.transition( )
			.duration( 500 )
			.attr('class', 'alert alert-warning')
			.transition( )
			.duration( 500 )
			.attr('class', 'alert alert-info');

	});

	timewheel.onTodChange(function(new_todrange){
		var filter = function( d ) { 
			var hour = new Date( d ).getHours();
			if( new_todrange[0] >= new_todrange[1] ) return ( hour >= new_todrange[0] || hour <= new_todrange[1] ); 
			else return ( hour >= new_todrange[0] && hour <= new_todrange[1] ); 
		};
		date_dim.passed[1].filter( filter );
		date_dim.failed[1].filter( filter );
		dc.redrawAll( );

		d3.select( '#todSelection' )
			.text( 'Hour selection from: ' +new_todrange[0] + 'h to ' + new_todrange[1] + 'h' )
			.transition( )
			.duration( 500 )
			.attr('class', 'alert alert-warning')
			.transition( )
			.duration( 500 )
			.attr('class', 'alert alert-info');

	});


	timewheel.onDowsChange(function(new_dows){
		var filter = function( d ) { 
			var dow = new Date( d ).getDay();
			return new_dows.indexOf( dow ) !== -1 ; 
		};
		date_dim.passed[1].filter( filter );
		date_dim.failed[1].filter( filter );
		dc.redrawAll( );

		d3.select( '#dowSelection' )
			.text( 'Day selection: ' + new_dows.join( ', ' ) )
			.transition( )
			.duration( 500 )
			.attr('class', 'alert alert-warning')
			.transition( )
			.duration( 500 )
			.attr('class', 'alert alert-info');

	});

	timewheel.addYearPlotline('Passed Pieces per DoW', year_passed);
	timewheel.addYearPlotline('Failed Pieces per DoW', year_failed);
	timewheel.addDayPlotline('Passed Pieces per Hour',tod_passed);
	timewheel.addDayPlotline('Failed Pieces per Hour', tod_failed);

}

/*
	Creates the charts
*/
function createCharts( important_vars, data ) {

	cf_passed = crossfilter( data );
	cf_failed = crossfilter( data );

	var add = function (p, v) { return p + 1; };
	var remove = function (p, v) { return p - 1; };
	var initial = function (p, v) { return 0; };

	var value_accesor = function(d) { return d; };
	var date_accesor = function( d ) { return new Date( d.TIMESTAMP ).valueOf(); };
	var format_number = function(d) { return d3.format( ',' )( d3.round( d, 0 ) ); };

	dim_passed = cf_passed.dimension( function( d ) { return d.INDEX; } );
	group_passed = dim_passed.groupAll( ).reduce( add, remove, initial );

	dim_failed = cf_failed.dimension( function( d ) { return d.INDEX; } );
	group_failed = dim_failed.groupAll( ).reduce( add, remove, initial );

	date_dim.passed.push( cf_passed.dimension( date_accesor ) );
	date_dim.passed.push( cf_passed.dimension( date_accesor ) );
	date_dim.passed.push( cf_passed.dimension( date_accesor ) );
	date_dim.failed.push( cf_failed.dimension( date_accesor ) );
	date_dim.failed.push( cf_failed.dimension( date_accesor ) );
	date_dim.failed.push( cf_failed.dimension( date_accesor ) );

	dc.numberDisplay( '#num_passed_pieces' )
		.valueAccessor( value_accesor )
		.formatNumber( format_number )
		.group(group_passed)
		.html({
			one:'<p class="numberDisplay passed"> %number passed <br>piece </p>',
			some:'<p class="numberDisplay passed"> %number passed <br>pieces </p>',
			none:'<p class="numberDisplay passed"> No passed <br>pieces</p>'
		});

	dc.numberDisplay( '#num_failed_pieces' )
		.valueAccessor( value_accesor )
		.formatNumber( format_number )
		.group(group_failed)
		.html({
			one:'<p class="numberDisplay failed"> %number failed <br>piece </p>',
			some:'<p class="numberDisplay failed"> %number failed <br>pieces </p>',
			none:'<p class="numberDisplay failed"> No failed <br>pieces</p>'
		});

	for ( var i = 0; i < important_vars.length; i++ ) {

		var dimension_creator = function( d ) { return +d3.round(d[important_vars[i]], rounds[i]); };
		var filter_dimension_creator = function( d ) { return d.RESULTS? String( d.RESULTS ): 0; };

		dimensions.passed.push( cf_passed.dimension( dimension_creator ) );
		filter_dimensions.passed.push( cf_passed.dimension( filter_dimension_creator ) );
		groups.passed.push( dimensions.passed[i].group( ).reduceCount( ) );

		minimum.push( dimensions.passed[i].bottom(1)[0][important_vars[i]] );
		maximum.push( dimensions.passed[i].top(1)[0][important_vars[i]] );		

		filter_dimensions.passed[i].filter( function( d ) { return String( d ) === String( -1 ); } )


		var name_passed = 'passed_variable' + i;
		var width_passed = document.getElementById( name_passed ).offsetWidth * 0.98;

		var chart = dc.barChart( '#' + name_passed )
			.width(width_passed)
			.height(150)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.passed[i] )
			.ordinalColors( [ '#31D66C' ] )
			.group( groups.passed[i] )
			.xUnits(function(d){ return 28; });

		charts.passed.push( chart );

		dimensions.failed.push( cf_failed.dimension( dimension_creator ) );
		filter_dimensions.failed.push( cf_failed.dimension( filter_dimension_creator ) );
		groups.failed.push( dimensions.failed[i].group( ).reduceCount( ) );	

		filter_dimensions.failed[0].filter( function( d ) { return String( d ) === String( 1 ); } )

		var name_failed = 'failed_variable' + i;
		var width_failed = document.getElementById( name_failed ).offsetWidth * 0.98;

		var chart = dc.barChart( '#' + name_failed )
			.width(width_failed)
			.height(150)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.failed[i] )
			.ordinalColors( [ '#FF5E57' ] )
			.group( groups.failed[i] )
			.xUnits(function(d){ return 30; });

		charts.failed.push( chart );

	}

	dc.renderAll( );

}

/*
	Initialized the application
*/
function initialize() {

	d3.json( './data/dict_results.json', function( dict ) {

		createSTRAD( '#entireData', dict.year_passed, dict.year_failed, dict.tod_passed, dict.tod_failed );

	} );

	d3.json( './data/date_important_variables.json', function( dict ) {

		createSTRAD( '#v0', dict.v0.passed_date, dict.v0.failed_date, dict.v0.passed_tod, dict.v0.failed_tod );
		createSTRAD( '#v1', dict.v1.passed_date, dict.v1.failed_date, dict.v1.passed_tod, dict.v1.failed_tod );
		createSTRAD( '#v2', dict.v2.passed_date, dict.v2.failed_date, dict.v2.passed_tod, dict.v2.failed_tod );
		createSTRAD( '#v3', dict.v3.passed_date, dict.v3.failed_date, dict.v3.passed_tod, dict.v3.failed_tod );
		createSTRAD( '#v4', dict.v4.passed_date, dict.v4.failed_date, dict.v4.passed_tod, dict.v4.failed_tod );

	} );

	d3.csv( './data/data_join_imp_variables.csv', function( data ) {

		d3.csv( './data/var_importance.csv', function( important_vars ) {

			createCharts( important_vars.map( function( d ) { return d.Variables; } ), data );

		} );

	} );

	
}

initialize();