/*
	ServiceCall
*/
var service = './components/ServiceCall.js';

/*
	View
*/
var current_nav = 'general';

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
var imp_variables;
var timewheel = { 
	'general': undefined,
	'v0': undefined,
	'v1': undefined,
	'v2': undefined,
	'v3': undefined,
	'v4': undefined
};
var colorArray = ['#fff', '#31D66C', '#FF5E57'];
// var colorArray = '#000';

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
	Reset view
*/
function reset() {

	date_dim.passed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	date_dim.failed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dc.filterAll(); 
	dc.redrawAll();

	changeView( current_nav );

}

/*
	Changes view
*/
function changeView( view ) {

	d3.select( '#timewheel' )
		.html( '' );

	d3.select( '#button-' + current_nav )
		.attr( 'class', 'btn btn-info rigth no-radius' );

	current_nav = view;

	d3.select( '#button-' + current_nav )
		.attr( 'class', 'btn btn-warning rigth no-radius' );


	timewheel[view] = createSTRAD( '#timewheel', imp_variables[view].passed_date, imp_variables[view].failed_date, imp_variables[view].passed_tod, imp_variables[view].failed_tod );
	
	addPlotLine( );
	addPlotLine( );
	addPlotLine( );
	
}

/*
	Creates a STRAD WHEEL
*/
function createSTRAD( selector, year_passed, year_failed, tod_passed, tod_failed ) {

	function colorScale(n) { return colorArray[n % colorArray.length]; }

	//populate div with the tool
	var temp_timewheel = new StradWheel( selector, colorScale );

	temp_timewheel.setSelectableYears( [ '2008' ] );
	temp_timewheel.setYear( '2008' );

	//Register to changes:

	temp_timewheel.onDatesChange( function( new_datesrange ) {
		var filter = function( d ) { 
			if( new_datesrange[0].valueOf( ) >= new_datesrange[1].valueOf( ) ) return ( d >= new_datesrange[0] || d <= new_datesrange[1] ); 
			else return ( d >= new_datesrange[0] && d <= new_datesrange[1] ); 
		};
		date_dim.passed[0].filter( filter );
		date_dim.failed[0].filter( filter );
		dc.redrawAll( );

		// updateDayPlotLine( timewheel[current_nav], temp_passed, temp_failed );

	});

	temp_timewheel.onTodChange( function( new_todrange ) {
		var filter = function( d ) { 
			var hour = new Date( d ).getHours();
			if( new_todrange[0] >= new_todrange[1] ) return ( hour >= new_todrange[0] || hour <= new_todrange[1] ); 
			else return ( hour >= new_todrange[0] && hour <= new_todrange[1] ); 
		};
		date_dim.passed[1].filter( filter );
		date_dim.failed[1].filter( filter );
		dc.redrawAll( );

	});


	temp_timewheel.onDowsChange( function( new_dows ) {
		var filter = function( d ) { 
			var dow = new Date( d ).getDay();
			return new_dows.indexOf( dow ) !== -1 ; 
		};
		date_dim.passed[2].filter( filter );
		date_dim.failed[2].filter( filter );
		dc.redrawAll( );

	});

	temp_timewheel.addYearPlotline( '', imp_variables.empty.date );
	temp_timewheel.addYearPlotline( 'Passed Pieces per Day', year_passed );
	temp_timewheel.addYearPlotline( 'Failed Pieces per Day', year_failed );
	temp_timewheel.addDayPlotline( '', imp_variables.empty.tod );
	temp_timewheel.addDayPlotline( 'Passed Pieces per Hour',tod_passed );
	temp_timewheel.addDayPlotline( 'Failed Pieces per Hour', tod_failed );

	return temp_timewheel;

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
			.height(120)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.passed[i] )
			.ordinalColors( [ '#31D66C' ] )
			.group( groups.passed[i] )
			.xUnits(function(d){ return 40; });

		charts.passed.push( chart );

		dimensions.failed.push( cf_failed.dimension( dimension_creator ) );
		filter_dimensions.failed.push( cf_failed.dimension( filter_dimension_creator ) );
		groups.failed.push( dimensions.failed[i].group( ).reduceCount( ) );	

		filter_dimensions.failed[0].filter( function( d ) { return String( d ) === String( 1 ); } )

		var name_failed = 'failed_variable' + i;
		var width_failed = document.getElementById( name_failed ).offsetWidth * 0.98;

		var chart = dc.barChart( '#' + name_failed )
			.width(width_failed)
			.height(120)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.failed[i] )
			.ordinalColors( [ '#FF5E57' ] )
			.group( groups.failed[i] )
			.xUnits(function(d){ return 40; });

		charts.failed.push( chart );

	}

	dc.renderAll( );

}

/*
	Update plotlines
*/
function updateYearPlotLine( tw, passed, failed ) {

	tw.addYearPlotline( 'Passed Pieces per Day', passed );

	tw.addYearPlotline( 'Failed Pieces per Day', failed );

}

function updateDayPlotLine( tw, passed, failed ) {
	
	tw.addDayPlotline( 'Passed Pieces per Hour', passed );
	
	tw.addDayPlotline( 'Failed Pieces per Hour', failed );

}

/*
	Choose plotlines to add/remove
*/
function updatePlotLine( ) {
	if( $( '#passed_checkbox' ).is( ':checked' ) ) {
		timewheel[current_nav].addDayPlotline( 'Passed Pieces per Hour', imp_variables[current_nav]['passed_tod'] );
		timewheel[current_nav].addYearPlotline( 'Passed Pieces per Day', imp_variables[current_nav]['passed_date'] );
	}
	else {
		timewheel[current_nav].removeDayPlotline( 'Passed Pieces per Hour' );
		timewheel[current_nav].removeYearPlotline( 'Passed Pieces per Day' );
	}

	if( $( '#failed_checkbox' ).is( ':checked' ) ) {
		timewheel[current_nav].addDayPlotline( 'Failed Pieces per Hour', imp_variables[current_nav]['failed_tod'] );
		timewheel[current_nav].addYearPlotline( 'Failed Pieces per Day', imp_variables[current_nav]['failed_date'] );
	}
	else {
		timewheel[current_nav].removeDayPlotline( 'Failed Pieces per Hour' );
		timewheel[current_nav].removeYearPlotline( 'Failed Pieces per Day' );
	}
}

/*
	Initialized the application
*/
function initialize() {

	service.get('get_all_count_date/passed')

	d3.json( './data/date_important_variables.json', function( dict ) {

		imp_variables = dict;
		timewheel.general = createSTRAD( '#timewheel', dict.general.passed_date, dict.general.failed_date, dict.general.passed_tod, dict.general.failed_tod );

	} );

	d3.csv( './data/data_join_imp_variables.csv', function( data ) {

		d3.csv( './data/var_importance.csv', function( important_vars ) {

			createCharts( important_vars.map( function( d ) { return d.Variables; } ), data );

		} );

	} );

	
}

initialize();