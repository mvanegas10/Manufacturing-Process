/*
	View
*/
var currentNav = 'general';

/*
	Data
*/
// Passed dataset
var yearPassed;
var todPassed;

// Failed dataset
var yearFailed;
var todFailed;

/*
	STRAD WHEEL
*/ 
var impVariables = { 
	'empty': {},
	'general': {},
	'v0': {},
	'v1': {},
	'v2': {},
	'v3': {},
	'v4': {}
};
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
var cfPassed;
var cfFailed;

// Dimensions
var dimensions = { 'passed':[], 'failed':[] };
var dimPassed;
var dimFailed;
var dateDim = { 'passed':[], 'failed':[] };
var filterDimensions = { 'passed':[], 'failed':[] };
var rounds = [ 0, 0, 0, 1, 2 ];
var minimum = [];
var maximum = [];

// Groupings
var groups = { 'passed':[], 'failed':[] };
var groupPassed;
var groupFailed;

/*
	DC
*/
var charts = { 'passed':[], 'failed':[] };

/*
	Functional methods
*/
function formatDate( date ) {
	return date.toISOString( ).replace( 'T', ' ' ).substring( 0, 10 );
}

/*
	Reset view
*/
function reset() {

	dateDim.passed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dateDim.failed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dc.filterAll(); 
	dc.redrawAll();

	changeView( currentNav );

}

/*
	Changes view
*/
function changeView( view ) {

	d3.select( '#timewheel' )
		.html( '' );

	d3.select( '#button-' + currentNav )
		.attr( 'class', 'btn btn-info rigth no-radius' );

	currentNav = view;

	d3.select( '#button-' + currentNav )
		.attr( 'class', 'btn btn-warning rigth no-radius' );


	if( !timewheel[view] )
	timewheel[view] = createSTRAD( '#timewheel', impVariables[view].passedDoW, impVariables[view].failedDoW, impVariables[view].passedToD, impVariables[view].failedToD );
	
	addPlotLine( );
	addPlotLine( );
	addPlotLine( );
	
}

/*
	Creates a STRAD WHEEL
*/
function createSTRAD( selector, yearPassed, yearFailed, todPassed, todFailed ) {

	function colorScale(n) { return colorArray[n % colorArray.length]; }

	//populate div with the tool
	var tempTimewheel = new StradWheel( selector, colorScale );

	tempTimewheel.setSelectableYears( [ '2008' ] );
	tempTimewheel.setYear( '2008' );

	//Register to changes:

	tempTimewheel.onDatesChange( function( newDatesRange ) {
		
		changeInDates( formatDate( newDatesRange[0] ), formatDate( newDatesRange[1] ) );
		
		var filter = function( d ) { 
			if( newDatesRange[0].valueOf( ) >= newDatesRange[1].valueOf( ) ) return ( d >= newDatesRange[0] || d <= newDatesRange[1] ); 
			else return ( d >= newDatesRange[0] && d <= newDatesRange[1] ); 
		};
		dc.redrawAll( );

	});

	tempTimewheel.onTodChange( function( newTodrange ) {
		
		changeInToD( newTodrange[0], newTodrange[1] );
		
		var filter = function( d ) { 
			var hour = new Date( d ).getHours();
			if( newTodrange[0] >= newTodrange[1] ) return ( hour >= newTodrange[0] || hour <= newTodrange[1] ); 
			else return ( hour >= newTodrange[0] && hour <= newTodrange[1] ); 
		};
		dateDim.passed[1].filter( filter );
		dateDim.failed[1].filter( filter );
		dc.redrawAll( );

	});


	tempTimewheel.onDowsChange( function( newDows ) {
		
		console.log(newDows)
		// changeInDoW( newDows );
		
		var filter = function( d ) { 
			var dow = new Date( d ).getDay();
			return newDows.indexOf( dow ) !== -1 ; 
		};
		dateDim.passed[2].filter( filter );
		dateDim.failed[2].filter( filter );
		dc.redrawAll( );

	});

	tempTimewheel.addYearPlotline( '', impVariables.empty.date );
	tempTimewheel.addYearPlotline( 'Passed Pieces per Day', yearPassed );
	tempTimewheel.addYearPlotline( 'Failed Pieces per Day', yearFailed );
	tempTimewheel.addDayPlotline( '', impVariables.empty.tod );
	tempTimewheel.addDayPlotline( 'Passed Pieces per Hour',todPassed );
	tempTimewheel.addDayPlotline( 'Failed Pieces per Hour', todFailed );

	return tempTimewheel;

}

/*
	Creates the charts
*/
function createCharts( importantVars, data ) {

	cfPassed = crossfilter( data );
	cfFailed = crossfilter( data );

	var add = function (p, v) { return p + 1; };
	var remove = function (p, v) { return p - 1; };
	var initial = function (p, v) { return 0; };

	var valueAccesor = function(d) { return d; };
	var dateAccesor = function( d ) { return new Date( d.TIMESTAMP ).valueOf(); };
	var formatNumber = function(d) { return d3.format( ',' )( d3.round( d, 0 ) ); };

	dimPassed = cfPassed.dimension( function( d ) { return d.INDEX; } );
	groupPassed = dimPassed.groupAll( ).reduce( add, remove, initial );

	dimFailed = cfFailed.dimension( function( d ) { return d.INDEX; } );
	groupFailed = dimFailed.groupAll( ).reduce( add, remove, initial );

	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );

	dc.numberDisplay( '#num_passed_pieces' )
		.valueAccessor( valueAccesor )
		.formatNumber( formatNumber )
		.group(groupPassed)
		.html({
			one:'<p class="numberDisplay passed"> %number passed <br>piece </p>',
			some:'<p class="numberDisplay passed"> %number passed <br>pieces </p>',
			none:'<p class="numberDisplay passed"> No passed <br>pieces</p>'
		});

	dc.numberDisplay( '#num_failed_pieces' )
		.valueAccessor( valueAccesor )
		.formatNumber( formatNumber )
		.group(groupFailed)
		.html({
			one:'<p class="numberDisplay failed"> %number failed <br>piece </p>',
			some:'<p class="numberDisplay failed"> %number failed <br>pieces </p>',
			none:'<p class="numberDisplay failed"> No failed <br>pieces</p>'
		});

	for ( var i = 0; i < importantVars.length; i++ ) {

		var dimensionCreator = function( d ) { return +d3.round(d[importantVars[i]], rounds[i]); };
		var filterDimensionCreator = function( d ) { return d.RESULTS? String( d.RESULTS ): 0; };

		dimensions.passed.push( cfPassed.dimension( dimensionCreator ) );
		filterDimensions.passed.push( cfPassed.dimension( filterDimensionCreator ) );
		groups.passed.push( dimensions.passed[i].group( ).reduceCount( ) );

		minimum.push( dimensions.passed[i].bottom(1)[0][importantVars[i]] );
		maximum.push( dimensions.passed[i].top(1)[0][importantVars[i]] );		

		filterDimensions.passed[i].filter( function( d ) { return String( d ) === String( -1 ); } )


		var namePassed = 'passed_variable' + i;
		var widthPassed = document.getElementById( namePassed ).offsetWidth * 0.98;

		var chart = dc.barChart( '#' + namePassed )
			.width(widthPassed)
			.height(120)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.passed[i] )
			.ordinalColors( [ '#31D66C' ] )
			.group( groups.passed[i] )
			.xUnits(function(d){ return 40; });

		charts.passed.push( chart );

		dimensions.failed.push( cfFailed.dimension( dimensionCreator ) );
		filterDimensions.failed.push( cfFailed.dimension( filterDimensionCreator ) );
		groups.failed.push( dimensions.failed[i].group( ).reduceCount( ) );	

		filterDimensions.failed[0].filter( function( d ) { return String( d ) === String( 1 ); } )

		var nameFailed = 'failed_variable' + i;
		var widthFailed = document.getElementById( nameFailed ).offsetWidth * 0.98;

		var chart = dc.barChart( '#' + nameFailed )
			.width(widthFailed)
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
function changeInDates( from, to ) {

	var tempData = {
		'from': from,
		'to': to
	};
	var passedDate = post( 'get_count_date/passed', tempData );
	var failedDate = post( 'get_count_date/failed', tempData );
	var passedHour = post( 'get_count_hour/passed', tempData );
	var failedHour = post( 'get_count_hour/failed', tempData );

	Promise.all( [ passedDate, failedDate, passedHour, failedHour ] ).then( function( values ){
		
		timewheel[currentNav].addYearPlotline( 'Passed Pieces per Day', values[0] );
		timewheel[currentNav].addYearPlotline( 'Failed Pieces per Day', values[1] );
		timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', values[2] );
		timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', values[3] );
	
	} );

}

function changeInToD( from, to ) {

	var tempData = {
		'from': from,
		'to': to
	};
	var passedDate = post( 'get_count_date_tod/passed', tempData );
	var failedDate = post( 'get_count_date_tod/failed', tempData );
	var passedHour = post( 'get_count_hour_tod/passed', tempData );
	var failedHour = post( 'get_count_hour_tod/failed', tempData );

	Promise.all( [ passedDate, failedDate, passedHour, failedHour ] ).then( function( values ){
		
		console.log('-------------------------------------------------')
		console.log('values',values)
		console.log('tempData',tempData)

		timewheel[currentNav].addYearPlotline( 'Passed Pieces per Day', values[0] );
		timewheel[currentNav].addYearPlotline( 'Failed Pieces per Day', values[1] );
		timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', values[2] );
		timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', values[3] );
	
	} );

}

function changeInDoW( dows ) {
	
	tw.addDayPlotline( 'Passed Pieces per Hour', passed );
	
	tw.addDayPlotline( 'Failed Pieces per Hour', failed );

}

/*
	Choose plotlines to add/remove
*/
function updatePlotLine( ) {
	if( $( '#passed_checkbox' ).is( ':checked' ) ) {
		timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', impVariables[currentNav]['passedToD'] );
		timewheel[currentNav].addYearPlotline( 'Passed Pieces per Day', impVariables[currentNav]['passedDoW'] );
	}
	else {
		timewheel[currentNav].removeDayPlotline( 'Passed Pieces per Hour' );
		timewheel[currentNav].removeYearPlotline( 'Passed Pieces per Day' );
	}

	if( $( '#failed_checkbox' ).is( ':checked' ) ) {
		timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', impVariables[currentNav]['failedToD'] );
		timewheel[currentNav].addYearPlotline( 'Failed Pieces per Day', impVariables[currentNav]['failedDoW'] );
	}
	else {
		timewheel[currentNav].removeDayPlotline( 'Failed Pieces per Hour' );
		timewheel[currentNav].removeYearPlotline( 'Failed Pieces per Day' );
	}
}

/*
	Initialized the application
*/
function initialize() {

	var tempData = {
		'from': '2008-01-01 00:00:00',
		'to': '2008-12-31 00:00:00'
	};
	var passedDate = post( 'get_count_date/passed', tempData );
	var failedDate = post( 'get_count_date/failed', tempData );
	var passedHour = post( 'get_count_hour/passed', tempData );
	var failedHour = post( 'get_count_hour/failed', tempData );

	Promise.all( [ passedDate, failedDate, passedHour, failedHour ] ).then( function( values ){
		
		impVariables.general.passedDoW = values[0];
		impVariables.general.failedDoW = values[1];
		impVariables.general.passedToD = values[2];
		impVariables.general.failedToD = values[3];
	
		d3.json( './data/date_important_variables.json', function( dict ) {

			impVariables.empty = dict.empty;
			timewheel.general = createSTRAD( '#timewheel', impVariables.general.passedDoW, impVariables.general.failedDoW, impVariables.general.passedToD, impVariables.general.failedToD );

		} );
	
	} );


	d3.csv( './data/data_join_imp_variables.csv', function( data ) {

		d3.csv( './data/var_importance.csv', function( importantVars ) {

			createCharts( importantVars.map( function( d ) { return d.Variables; } ), data );

		} );

	} );

	
}

initialize();