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
	'general': {}
};
var timewheel = { 
	'general': undefined
};
var colorArray = ['#fff', '#31D66C', '#FF5E57'];

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
var minimum = { 'passed':[], 'failed':[] };
var maximum = { 'passed':[], 'failed':[] };

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

	changeView( currentNav );

}

/*
	Changes view
*/
function changeView( view ) {

	dateDim.passed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dateDim.failed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dc.filterAll(); 
	dc.redrawAll();

	d3.select( '#timewheel' )
		.html( '' );

	d3.select( '#button-' + currentNav )
		.attr( 'class', 'btn btn-info rigth no-radius' );

	currentNav = view;

	d3.select( '#button-' + currentNav )
		.attr( 'class', 'btn btn-warning rigth no-radius' );


	if( !impVariables[view] ) {

		var tempData = {
			'from': '2008-01-01 00:00:00',
			'to': '2008-12-31 00:00:00',
			'reducer': 'AVG',
			'reducer_variable': currentNav
		};

		var passedDate = post( 'get_date/passed', tempData );
		var failedDate = post( 'get_date/failed', tempData );
		var passedHour = post( 'get_hour/passed', tempData );
		var failedHour = post( 'get_hour/failed', tempData );

		Promise.all( [ passedDate, failedDate, passedHour, failedHour ] ).then( function( values ){

			impVariables[view] = {};
			
			// Database information for current view.
			impVariables[view].passedDoW = values[0];
			impVariables[view].failedDoW = values[1];
			impVariables[view].passedToD = values[2];
			impVariables[view].failedToD = values[3];

			timewheel[view] = createSTRAD( '#timewheel', impVariables[view].passedDoW, impVariables[view].failedDoW, impVariables[view].passedToD, impVariables[view].failedToD );
			updatePlotLine( );
		
		} );

	}
	else {
		
		timewheel[view] = createSTRAD( '#timewheel', impVariables[view].passedDoW, impVariables[view].failedDoW, impVariables[view].passedToD, impVariables[view].failedToD );
		updatePlotLine( );
	
	}
	
	
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
			if( newDatesRange[0].valueOf( ) >= newDatesRange[1].valueOf( ) ) return ( d >= newDatesRange[0].valueOf( ) || d <= newDatesRange[1].valueOf( ) ); 
			else return ( d >= newDatesRange[0].valueOf( ) && d <= newDatesRange[1].valueOf( ) ); 
		};
		dateDim.passed[0].filter( filter );
		dateDim.failed[0].filter( filter );
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
		
		changeInDoW( newDows );
		
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
	Creates the a number display
*/
function createNumberDisplay( selector, valueAccesor, formatNumber, group, string ) {

	dc.numberDisplay( selector )
		.valueAccessor( valueAccesor )
		.formatNumber( formatNumber )
		.group( group )
		.html( {
			one:'<p class="numberDisplay ' +  string + '"> %number ' +  string + ' <br>piece </p>',
			some:'<p class="numberDisplay ' +  string + '"> %number ' +  string + ' <br>pieces </p>',
			none:'<p class="numberDisplay ' +  string + '"> No ' +  string + ' <br>pieces</p>'
		} );

}

/*
	Creates the charts
*/
function createCharts( importantVars, rawData ) {

	var data = rawData.result;

	cfPassed = crossfilter( data );
	cfFailed = crossfilter( data );

	var add = function (p, v) { return p + 1; };
	var remove = function (p, v) { return p - 1; };
	var initial = function (p, v) { return 0; };

	var valueAccesor = function(d) { return d; };
	var dateAccesor = function( d ) { return +d.timevalue };
	var formatNumber = function(d) { return d3.format( ',' )( d3.round( d, 0 ) ); };

	dimPassed = cfPassed.dimension( function( d ) { return d.id; } );
	groupPassed = dimPassed.groupAll( ).reduce( add, remove, initial );

	dimFailed = cfFailed.dimension( function( d ) { return d.id; } );
	groupFailed = dimFailed.groupAll( ).reduce( add, remove, initial );

	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );

	createNumberDisplay( '#num_passed_pieces', valueAccesor, formatNumber, groupPassed, 'passed' );
	createNumberDisplay( '#num_failed_pieces', valueAccesor, formatNumber, groupFailed, 'failed' );

	for ( var i = 0; i < importantVars.length; i++ ) {

		var currentImpVar = importantVars[i];

		var dimensionCreator = function( d ) { return +d3.round(d[currentImpVar], rounds[i]); };
		var filterDimensionCreator = function( d ) { return d.results? String( d.results ): 0; };

		dimensions.passed.push( cfPassed.dimension( dimensionCreator ) );
		filterDimensions.passed.push( cfPassed.dimension( filterDimensionCreator ) );
		groups.passed.push( dimensions.passed[i].group( ).reduceCount( ) );

		filterDimensions.passed[i].filter( function( d ) { return String( d ) === String( -1 ); } )


		var namePassed = 'passed_variable' + i;
		var widthPassed = document.getElementById( namePassed ).offsetWidth * 0.98;

		var chartPassed = dc.barChart( '#' + namePassed )
			.width(widthPassed)
			.height(120)
			.x( d3.scale.linear( ) )
			.elasticX(true)
			.elasticY(true)
			.dimension( dimensions.passed[i] )
			.ordinalColors( [ '#31D66C' ] )
			.group( groups.passed[i] )
			.gap(10);

		chartPassed._groupName = currentImpVar;
		
		chartPassed.yAxis( ).tickFormat( d3.format( 'd' ) );

		chartPassed.on( 'renderlet', function( chart ){
			chart.selectAll( 'rect' )
				.style( 'fill', function( d ) { 
					return ( d && d.x && ( d.x <= ( rawData.stats[chart._groupName].mean_passed - 2*rawData.stats[chart._groupName].std_passed ) || d.x >= ( rawData.stats[chart._groupName].mean_passed + 2*rawData.stats[chart._groupName].std_passed ) ) )? '#FFF873': ''; } );
			charts.passed.push( chartPassed );
		});


		dimensions.failed.push( cfFailed.dimension( dimensionCreator ) );
		filterDimensions.failed.push( cfFailed.dimension( filterDimensionCreator ) );
		groups.failed.push( dimensions.failed[i].group( ).reduceCount( ) );	

		filterDimensions.failed[0].filter( function( d ) { return String( d ) === String( 1 ); } )

		var nameFailed = 'failed_variable' + i;
		var widthFailed = document.getElementById( nameFailed ).offsetWidth * 0.98;

		var chartFailed = dc.barChart( '#' + nameFailed )
			.width(widthFailed)
			.height(120)
			.x( d3.scale.linear( ) )
			.elasticX(true)
			.elasticY(true)
			.dimension( dimensions.failed[i] )
			.ordinalColors( [ '#FF5E57' ] )
			.group( groups.failed[i] )
			.gap(10);

		chartFailed.yAxis( ).tickFormat( d3.format( 'd' ) );

		chartFailed._groupName = currentImpVar;

		chartFailed.on( 'renderlet', function( chart ){
			chart.selectAll( 'rect' )
				.style( 'fill', function( d ) { 
					return ( d && d.x && ( d.x <= ( rawData.stats[chart._groupName].mean_failed - 2*rawData.stats[chart._groupName].std_failed ) || d.x >= ( rawData.stats[chart._groupName].mean_failed + 2*rawData.stats[chart._groupName].std_failed ) ) )? '#FFF873': ''; } );
		});

		charts.failed.push( chartFailed );

	}

	dc.renderAll( );

}

/*
	Update plotlines
*/
function changeInDates( from, to ) {

	var reducer = 'AVG';
	var reducer_variable = currentNav;

	if( currentNav === 'general' ) {

		reducer = 'COUNT';
		reducer_variable = 'id';

	}

	var tempData = {
		'from': from,
		'to': to,
		'reducer': reducer,
		'reducer_variable': reducer_variable
	};
	var passedHour = post( 'get_hour/passed', tempData );
	var failedHour = post( 'get_hour/failed', tempData );

	Promise.all( [ passedHour, failedHour ] ).then( function( values ){

		if( $( '#passed_checkbox' ).is( ':checked' ) ) 
			timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', values[0] );

		if( $( '#failed_checkbox' ).is( ':checked' ) ) 
			timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', values[1] );
	
	} );

}

function changeInToD( from, to ) {

	var reducer = 'AVG';
	var reducer_variable = currentNav;

	if( currentNav === 'general' ) {

		reducer = 'COUNT';
		reducer_variable = 'id';

	}

	var tempData = {
		'from': from,
		'to': to,
		'reducer': reducer,
		'reducer_variable': reducer_variable
	};
	var passedDate = post( 'get_date_tod/passed', tempData );
	var failedDate = post( 'get_date_tod/failed', tempData );

	Promise.all( [ passedDate, failedDate ] ).then( function( values ){
		
		if( $( '#passed_checkbox' ).is( ':checked' ) ) 
			timewheel[currentNav].addYearPlotline( 'Passed Pieces per Day', values[0] );
		
		if( $( '#failed_checkbox' ).is( ':checked' ) ) 
			timewheel[currentNav].addYearPlotline( 'Failed Pieces per Day', values[1] );
	
	} );

}

function changeInDoW( dows ) {

	var reducer = 'AVG';
	var reducer_variable = currentNav;

	if( currentNav === 'general' ) {

		reducer = 'COUNT';
		reducer_variable = 'id';

	}

	var tempData = {
		'dows': JSON.stringify(dows),
		'reducer': reducer,
		'reducer_variable': reducer_variable
	};
	if( dows.length > 0 ) {

		var passedHour = post( 'get_hour_dow/passed', tempData );
		var failedHour = post( 'get_hour_dow/failed', tempData );

	}

	Promise.all( [ passedHour, failedHour ] ).then( function( values ){
		
		if( $( '#passed_checkbox' ).is( ':checked' ) ) 
			timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', values[0] );
		
		if( $( '#failed_checkbox' ).is( ':checked' ) ) 
			timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', values[1] );

	} );	
	
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
		'to': '2008-12-31 00:00:00',
		'reducer': 'COUNT',
		'reducer_variable': 'id'
	};

	var varData = {
		'variables': JSON.stringify( manifactoringProcessConfig.IMPORTANT_VARIABLES )
	};
	var passedDate = post( 'get_date/passed', tempData );
	var failedDate = post( 'get_date/failed', tempData );
	var passedHour = post( 'get_hour/passed', tempData );
	var failedHour = post( 'get_hour/failed', tempData );
	var rawDataImpVariables = post( 'get_raw_data/', varData );

	Promise.all( [ passedDate, failedDate, passedHour, failedHour, rawDataImpVariables ] ).then( function( values ){
		
		// Import from ./assets/ManufactoringProcessModule/manufactoringProcess-config.js.
		// This component is necessary to avoid white spaces between undefined points in the STRAD-Wheel.
		impVariables.empty = manifactoringProcessConfig.EMPTY_DATASET;
		
		// Database information for general view.
		impVariables.general.passedDoW = values[0];
		impVariables.general.failedDoW = values[1];
		impVariables.general.passedToD = values[2];
		impVariables.general.failedToD = values[3];

		timewheel.general = createSTRAD( '#timewheel', impVariables.general.passedDoW, impVariables.general.failedDoW, impVariables.general.passedToD, impVariables.general.failedToD );

		createCharts( manifactoringProcessConfig.IMPORTANT_VARIABLES, values[4] );

	} );
	
}

initialize();