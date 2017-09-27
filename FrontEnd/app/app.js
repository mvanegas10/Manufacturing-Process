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
var colorArray = [ '#FFF', '#31D66C', '#FF5E57' ];

/*
	Crossfilter variables
*/
var cfAll;
var cfPassed;
var cfFailed;

// Dimensions
var dimensions = { 'passed':[], 'failed':[] };
var dimAll;
var dimPassed;
var dimFailed;
var dateDim = { 'all':[], 'passed':[], 'failed':[] };
var filterDimensions = { 'passed':[], 'failed':[] };
var rounds = [ 0, 0, 0.1, 2, 0.01 ];
var minimum = { 'passed':[], 'failed':[] };
var maximum = { 'passed':[], 'failed':[] };

// Groupings
var groups = { 'all':[], 'passed':[], 'failed':[] };
var groupPassed;
var groupFailed;

/*
	DC
*/
var charts = { 'passed':[], 'failed':[] };

/*
	Global Filter State
*/
var originalFilter = {
	'reducer': 'COUNT',
	'reducer_variable': 'id',
	'date1': '2008-01-01 00:00:00',
	'date2': '2008-12-31 00:00:00',
	'hour1': '0',
	'hour2': '23',
	'dows': JSON.stringify( [ 0, 1, 2, 3, 4, 5, 6 ] )
}

var currentFilter = jQuery.extend(true, {}, originalFilter);

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

	currentFilter = jQuery.extend(true, {}, originalFilter);

	dateDim.all.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dateDim.passed.forEach( function( filter ) {
		filter.filterAll( );
	} );

	dateDim.failed.forEach( function( filter ) {
		filter.filterAll( );
	} );	

	d3.select( '#timewheel' )
		.html( '' );

	d3.select( '#button-' + currentNav )
		.attr( 'class', 'btn btn-info rigth no-radius' );

	currentNav = view;

	var reducer = 'AVG';
	var reducerVariable = currentNav;

	if( currentNav === 'general' ) {

		reducer = 'COUNT';
		reducerVariable = 'id';

	}

	currentFilter.reducer = reducer;
	currentFilter.reducer_variable = reducerVariable;
	
	d3.select( '#button-' + currentNav )
		.attr( 'class', 'btn btn-warning rigth no-radius' );


	if( !impVariables[view] ) {

		var passedDate = post( 'get_date/passed', currentFilter );
		var failedDate = post( 'get_date/failed', currentFilter );
		var passedHour = post( 'get_hour/passed', currentFilter );
		var failedHour = post( 'get_hour/failed', currentFilter );

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

	removeSelectedPlotline( );

	dc.filterAll(); 
	dc.redrawAll();

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
			if( newDatesRange[0].valueOf( ) > newDatesRange[1].valueOf( ) ) return ( d >= newDatesRange[0].valueOf( ) || d <= newDatesRange[1].valueOf( ) ); 
			else return ( d >= newDatesRange[0].valueOf( ) && d <= newDatesRange[1].valueOf( ) ); 
		};
		dateDim.all[0].filter( filter );
		dateDim.passed[0].filter( filter );
		dateDim.failed[0].filter( filter );

		dc.redrawAll( );

	});

	tempTimewheel.onTodChange( function( newTodrange ) {
		
		changeInToD( newTodrange[0], newTodrange[1] );
		
		var filter = function( d ) { 
			var hour = new Date( d ).getHours();
			if( newTodrange[0] > newTodrange[1] ) return ( hour >= newTodrange[0] || hour <= newTodrange[1] ); 
			else return ( hour >= newTodrange[0] && hour <= newTodrange[1] ); 
		};
		dateDim.all[1].filter( filter );
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
		dateDim.all[2].filter( filter );
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
	Recalculates x axis ranges for the charts
*/
function elasticXAxis( emiter ) {
	
	var importantVars = manifactoringProcessConfig.IMPORTANT_VARIABLES

	var minTemp = { 'passed':[], 'failed':[] };
	var maxTemp = { 'passed':[], 'failed':[] }; 

	for ( var i = 0; i < importantVars.length; i++ ) {

		var currentImpVar = importantVars[i];

		if( !emiter || ( emiter && currentImpVar !== emiter ) ) {

			if( dimensions.passed[i].bottom(1)[0] ) minTemp.passed.push( dimensions.passed[i].bottom(1)[0][currentImpVar] - 1 );
	 		else minTemp.passed.push( minimum.passed[i] );
			if( dimensions.passed[i].top(1)[0] ) maxTemp.passed.push( dimensions.passed[i].top(1)[0][currentImpVar] + 1 );
	 		else maxTemp.passed.push( maximum.passed[i] );
			if( dimensions.failed[i].bottom(1)[0] ) minTemp.failed.push( dimensions.failed[i].bottom(1)[0][currentImpVar] - 1 );
	 		else minTemp.failed.push( minimum.failed[i] );
			if( dimensions.failed[i].top(1)[0] ) maxTemp.failed.push( dimensions.failed[i].top(1)[0][currentImpVar] + 1 );
	 		else maxTemp.failed.push( maximum.failed[i] );

			charts.passed[i]
				.x( d3.scale.linear( ).domain( [ minTemp.passed[i], maxTemp.passed[i] ] ) );
			charts.failed[i]
				.x( d3.scale.linear( ).domain( [ minTemp.failed[i], maxTemp.failed[i] ] ) );

		}
		else {
			minTemp.passed.push( NaN );
			maxTemp.passed.push( NaN );
			minTemp.failed.push( NaN );
			maxTemp.failed.push( NaN );
		}

	}

	dc.redrawAll();

}

/*
	Creates the a number display
*/
function createNumberDisplay( selector, valueAccesor, formatNumber, group, classed, string ) {

	dc.numberDisplay( selector )
		.valueAccessor( valueAccesor )
		.formatNumber( formatNumber )
		.group( group )
		.html( {
			one:'<p class="numberDisplay ' +  classed + '">%number ' +  string + '</p>',
			some:'<p class="numberDisplay ' +  classed + '">%number ' +  string + '</p>',
			none:'<p class="numberDisplay ' +  classed + '">-</p>'
		} );

}

/*
	Creates the charts
*/
function createCharts( importantVars, rawData ) {

	var data = rawData.result;

	cfAll = crossfilter( data );
	cfPassed = crossfilter( data );
	cfFailed = crossfilter( data );

	var add = function (p, v) { return p + 1; };
	var remove = function (p, v) { return p - 1; };
	var initial = function (p, v) { return 0; };

	var dateAccesor = function( d ) { return +d.timevalue };
	var valueAccesor = function(d) { return d; };
	var formatNumber = function(d) { return d3.format( ',' )( d3.round( d, 0 ) ); };
	var valueAccesorPercentage = function(d) { return groupAll.value( )? d / groupAll.value( ): 0; };
	var formatNumberPercentage = function(d) { return d3.format( ',.2%' )( d ); };
	var valueAccesorPercentageFromTotal = function(d) { return groupAllTotal.size( )? d / groupAllTotal.size( ): 0; };

	dimAll = cfAll.dimension( function( d ) { return d.id; } );
	groupAllTotal = dimAll.group( ).reduce( add, remove, initial );
	groupAll = dimAll.groupAll( ).reduce( add, remove, initial );

	dimPassed = cfPassed.dimension( function( d ) { return d.id; } );
	groupPassed = dimPassed.groupAll( ).reduce( add, remove, initial );

	dimFailed = cfFailed.dimension( function( d ) { return d.id; } );
	groupFailed = dimFailed.groupAll( ).reduce( add, remove, initial );

	dateDim.all.push( cfAll.dimension( dateAccesor ) );
	dateDim.all.push( cfAll.dimension( dateAccesor ) );
	dateDim.all.push( cfAll.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.passed.push( cfPassed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
	dateDim.failed.push( cfFailed.dimension( dateAccesor ) );
			
	createNumberDisplay( '#num_all', valueAccesor, formatNumber, groupAll, '', 'pieces' );
	createNumberDisplay( '#percentage_all', valueAccesorPercentageFromTotal, formatNumberPercentage, groupAll, '', ' of total' );
	createNumberDisplay( '#num_passed_pieces', valueAccesor, formatNumber, groupPassed, 'passed', 'passed pieces' );
	createNumberDisplay( '#num_failed_pieces', valueAccesor, formatNumber, groupFailed, 'failed', 'failed pieces' );
	createNumberDisplay( '#percentage_total_passed_pieces', valueAccesorPercentageFromTotal, formatNumberPercentage, groupPassed, 'passed', ' of total' );
	createNumberDisplay( '#percentage_total_failed_pieces', valueAccesorPercentageFromTotal, formatNumberPercentage, groupFailed, 'failed', ' of total' );
	createNumberDisplay( '#percentage_passed_pieces', valueAccesorPercentage, formatNumberPercentage, groupPassed, 'passed', '' );
	createNumberDisplay( '#percentage_failed_pieces', valueAccesorPercentage, formatNumberPercentage, groupFailed, 'failed', '' );

	for ( var i = 0; i < importantVars.length; i++ ) {

		var currentImpVar = importantVars[i];

		var title = d3.select( '#title_variable' + i );
		title.append( 'p' ).attr( 'class', 'small' ).text( 'FEATURE ' + currentImpVar.toUpperCase( ) +  ' (68.26%)' );
		title.append( 'p' ).attr( 'class', 'small' ).text( 'passed: [' + d3.round( rawData.stats[currentImpVar].mean_passed - rawData.stats[currentImpVar].std_passed, 2 ) + ', ' +  d3.round( rawData.stats[currentImpVar].mean_passed + rawData.stats[currentImpVar].std_passed, 2 ) + ']' );
		title.append( 'p' ).attr( 'class', 'small' ).text( 'failed: [' + d3.round( rawData.stats[currentImpVar].mean_failed - rawData.stats[currentImpVar].std_failed, 2 ) + ', ' +  d3.round( rawData.stats[currentImpVar].mean_failed + rawData.stats[currentImpVar].std_failed, 2 ) + ']' );

		var roundFunction = d3.format('.' + rounds[ i ] + 'f');
		var dimensionCreator = function( d ) { return parseFloat(roundFunction( +d[currentImpVar] )); };
		var filterDimensionCreator = function( d ) { return d.results? String( d.results ): 0; };

		dimensions.passed.push( cfPassed.dimension( dimensionCreator ) );
		filterDimensions.passed.push( cfPassed.dimension( filterDimensionCreator ) );
		groups.passed.push( dimensions.passed[i].group( ).reduceCount( ) );

		minimum.passed.push( parseFloat(roundFunction(dimensions.passed[i].bottom(1)[0][currentImpVar] - 0.01)) );
		maximum.passed.push( parseFloat(roundFunction(dimensions.passed[i].top(1)[0][currentImpVar] + 0.01)) );

		filterDimensions.passed[i].filter( function( d ) { return String( d ) === String( -1 ); } )

		var namePassed = 'passed_variable' + i;
		var widthPassed = document.getElementById( namePassed ).offsetWidth * 0.98;

		var chartPassed = dc.barChart( '#' + namePassed )
			.width(widthPassed)
			.height(120)
			.x( d3.scale.linear( ).domain( [ minimum.passed[i], maximum.passed[i] ] ) )
			.elasticX(false)
			.elasticY(true)
			.dimension( dimensions.passed[i] )
			.ordinalColors( [ '#31D66C' ] )
			.group( groups.passed[i] )
			.gap( 1 )
			.xUnits( function(d) {return 90;} )

		chartPassed._groupName = currentImpVar;
		
		chartPassed.yAxis( ).tickFormat( d3.format( 'd' ) );

		chartPassed.on( 'filtered' , function( chart, filter ){
			var idSet = dimensions.passed[0].top( Infinity ).map( function( d ) { return d.id; } );
			if( idSet.length < 1463 ){
				changeInIds( idSet );
				dc.redrawAll( );	
			} 
			else removeSelectedPlotline( );			
		} );

		chartPassed.on( 'renderlet', function( chart ){
			chart.selectAll( 'rect' )
				.style( 'fill', function( d ) { 
					return ( d && d.x && ( d.x <= ( rawData.stats[chart._groupName].mean_passed - rawData.stats[chart._groupName].std_passed ) || d.x >= ( rawData.stats[chart._groupName].mean_passed + rawData.stats[chart._groupName].std_passed ) ) )? '#BBB': ''; } );
		});

		charts.passed.push( chartPassed );

		dimensions.failed.push( cfFailed.dimension( dimensionCreator ) );
		filterDimensions.failed.push( cfFailed.dimension( filterDimensionCreator ) );
		groups.failed.push( dimensions.failed[i].group( ).reduceCount( ) );	

		minimum.failed.push( parseFloat(roundFunction(dimensions.failed[i].bottom(1)[0][currentImpVar] - 0.01)) );
		maximum.failed.push( parseFloat(roundFunction(dimensions.failed[i].top(1)[0][currentImpVar] + 0.01)) );

		filterDimensions.failed[0].filter( function( d ) { return String( d ) === String( 1 ); } )

		var nameFailed = 'failed_variable' + i;
		var widthFailed = document.getElementById( nameFailed ).offsetWidth * 0.98;
		
		var chartFailed = dc.barChart( '#' + nameFailed )
			.width(widthFailed)
			.height(120)
			.x( d3.scale.linear( ).domain( [ minimum.failed[i], maximum.failed[i] ] ) )
			.elasticX(false)
			.elasticY(true)
			.dimension( dimensions.failed[i] )
			.ordinalColors( [ '#BBB' ] )
			.group( groups.failed[i] )
			.gap( 1 )
			.xUnits( function(d) {return 90;} )

		chartFailed.on( 'filtered' , function( chart, filter ){
			var idSet = dimensions.failed[0].top( Infinity ).map( function( d ) { return d.id; } );
			if( idSet.length < 104 ) {
				changeInIds( idSet );
				dc.redrawAll( );	
			}
			else removeSelectedPlotline( );			
		} );

		chartFailed.yAxis( ).tickFormat( d3.format( 'd' ) );

		chartFailed._groupName = currentImpVar;

		chartFailed.on( 'renderlet', function( chart ){
			chart.selectAll( 'rect' )
				.style( 'fill', function( d ) { 
					return ( d && d.x && ( d.x <= ( rawData.stats[chart._groupName].mean_passed - rawData.stats[chart._groupName].std_passed ) || d.x >= ( rawData.stats[chart._groupName].mean_passed + rawData.stats[chart._groupName].std_passed ) ) )? '#FF5E57': ''; } );
		});

		charts.failed.push( chartFailed );

	}

	dc.renderAll( );

}

/*
	Remove the plotline for a selected id set
*/
function removeSelectedPlotline( ) {

	try {
		timewheel[currentNav].removeYearPlotline( 'Selected Pieces per Date' );
	}
	catch( e ) { /*Do nothing*/ }
	try {
		timewheel[currentNav].removeDayPlotline( 'Selected Pieces per Date' );
	}
	catch( e ) { /*Do nothing*/ }

}

/*
	Update plotlines
*/
function changeInIds( idSet ) {

	if( idSet.length > 0 ) {

		var reducer = 'AVG';
		var reducerVariable = currentNav;

		if( currentNav === 'general' ) {

			reducer = 'COUNT';
			reducerVariable = 'id';

		}

		var tempData = {
			'reducer': reducer,
			'reducer_variable': reducerVariable,
			'id_set' : JSON.stringify( idSet )
		};
		var passedDate = post( 'get_date_id/passed', tempData );
		var failedDate = post( 'get_date_id/failed', tempData );
		var passedHour = post( 'get_hour_id/passed', tempData );
		var failedHour = post( 'get_hour_id/failed', tempData );

		Promise.all( [ passedDate, failedDate, passedHour, failedHour ] ).then( function( values ){

			if( values[0].length > 0 )
				timewheel[currentNav].addYearPlotline( 'Selected Pieces per Date', values[0] );
			if( values[1].length > 0 )
				timewheel[currentNav].addYearPlotline( 'Selected Pieces per Date', values[1] );
			if( values[2].length > 0 )
				timewheel[currentNav].addDayPlotline( 'Selected Pieces per Hour', values[2] );
			if( values[3].length > 0 )
				timewheel[currentNav].addDayPlotline( 'Selected Pieces per Hour', values[3] );
		
		} );

	}

}

function changeInDates( from, to ) {

	if( from && to ) {

		var reducer = 'AVG';
		var reducerVariable = currentNav;

		if( currentNav === 'general' ) {

			reducer = 'COUNT';
			reducerVariable = 'id';

		}

		currentFilter.date1 = from;
		currentFilter.date2 = to;
		currentFilter.reducer = reducer;
		currentFilter.reducer_variable = reducerVariable;

		var tempData = jQuery.extend(true, {}, currentFilter);

		tempData.hour1 = originalFilter.hour1;
		tempData.hour2 = originalFilter.hour2;

		var passedHour = post( 'get_hour/passed', tempData );
		var failedHour = post( 'get_hour/failed', tempData );

		Promise.all( [ passedHour, failedHour ] ).then( function( values ){

			if( $( '#passed_checkbox' ).is( ':checked' ) ) 
				timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', values[0] );

			if( $( '#failed_checkbox' ).is( ':checked' ) ) 
				timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', values[1] );
		
		} );

	}

}

function changeInToD( from, to ) {

	if( from && to ) {

		var reducer = 'AVG';
		var reducerVariable = currentNav;

		if( currentNav === 'general' ) {

			reducer = 'COUNT';
			reducerVariable = 'id';

		}

		currentFilter.hour1 = from;
		currentFilter.hour2 = to;
		currentFilter.reducer = reducer;
		currentFilter.reducer_variable = reducerVariable;

		var tempData = jQuery.extend(true, {}, currentFilter);

		tempData.date1 = originalFilter.date1;
		tempData.date2 = originalFilter.date2;

		var passedDate = post( 'get_date/passed', tempData );
		var failedDate = post( 'get_date/failed', tempData );

		Promise.all( [ passedDate, failedDate ] ).then( function( values ){

			if( $( '#passed_checkbox' ).is( ':checked' ) ) 
				timewheel[currentNav].addYearPlotline( 'Passed Pieces per Day', values[0] );
			
			if( $( '#failed_checkbox' ).is( ':checked' ) ) 
				timewheel[currentNav].addYearPlotline( 'Failed Pieces per Day', values[1] );
		
		} );

	}

}

function changeInDoW( dows ) {

	if( dows.length > 0 ) {

		var reducer = 'AVG';
		var reducerVariable = currentNav;

		if( currentNav === 'general' ) {

			reducer = 'COUNT';
			reducerVariable = 'id';

		}

		currentFilter.dows = JSON.stringify( dows );
		currentFilter.reducer = reducer;
		currentFilter.reducer_variable = reducerVariable;

		if( dows.length > 0 ) {

			var passedHour = post( 'get_hour/passed', currentFilter );
			var failedHour = post( 'get_hour/failed', currentFilter );

		}

		Promise.all( [ passedHour, failedHour ] ).then( function( values ){
			
			if( $( '#passed_checkbox' ).is( ':checked' ) ) 
				timewheel[currentNav].addDayPlotline( 'Passed Pieces per Hour', values[0] );
			
			if( $( '#failed_checkbox' ).is( ':checked' ) ) 
				timewheel[currentNav].addDayPlotline( 'Failed Pieces per Hour', values[1] );

		} );	

	}
		
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

	var varData = {
		'variables': JSON.stringify( manifactoringProcessConfig.IMPORTANT_VARIABLES )
	};
	var passedDate = post( 'get_date/passed', currentFilter );
	var failedDate = post( 'get_date/failed', currentFilter );
	var passedHour = post( 'get_hour/passed', currentFilter );
	var failedHour = post( 'get_hour/failed', currentFilter );
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