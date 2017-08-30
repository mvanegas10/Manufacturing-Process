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

/*
	Crossfilter variables
*/
var cf_passed;
var cf_failed;

// Dimensions
var dimensions = { 'passed':[], 'failed':[] };
var dim_passed;
var dim_failed;
var filter_dimensions = { 'passed':[], 'failed':[] };
var rounds = [ -1, -1, -1, 0, 1 ];
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
	Creates the STRAD WHEEL
*/
function createSTRAD( dict ) {

	year_passed = dict.year_passed;
	tod_passed = dict.tod_passed;
	year_failed = dict.year_failed;
	tod_failed = dict.tod_failed;

	//populate div with the tool
	timewheel = new StradWheel( '#timeview' );

	timewheel.setSelectableYears( [ 2008 ] );
	timewheel.setYear( 2008 );

	//Register to changes:

	timewheel.onDatesChange(function(new_datesrange){
		$('#notifications').notify('The selected dates range is now: '

			+new_datesrange ,{position:'bottom left',autoHideDelay:3000, className: 'info'

		})
	});

	timewheel.onTodChange(function(new_todrange){
		$('#notifications').notify('The selected time range is now: ['
			
			+timewheel.getTodRange() +']',{position:'bottom left',autoHideDelay:3000, className: 'info'

		})
	});


	timewheel.onDowsChange(function(new_dows){
		$('#notifications').notify('The selected dows are now: ['
			
			+timewheel.getDows() +']',{position:'bottom left',autoHideDelay:3000, className: 'info'

		})
	});

	timewheel.onChange(function(prop){
		$('#notifications2').notify('This has changed: '
		
			+prop ,{position:'bottom left',autoHideDelay:3000, className: 'success'
		
		})
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
	var format_number = function(d) { return d3.format( ',' )( d3.round( d, 0 ) ); };

	dim_passed = cf_passed.dimension( function( d ) { return d.INDEX; } );
	group_passed = dim_passed.groupAll( ).reduce( add, remove, initial );

	dim_failed = cf_failed.dimension( function( d ) { return d.INDEX; } );
	group_failed = dim_failed.groupAll( ).reduce( add, remove, initial );

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

		filter_dimensions.passed[i].filter( function( d ) { return String( d ) === String( 1 ); } )


		var name = 'passed_variable' + i;
		var width = document.getElementById( name ).offsetWidth * 0.9;

		var chart = dc.barChart( '#' + name )
			.width(width)
			.height(150)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.passed[i] )
			.ordinalColors( [ '#31D66C' ] )
			.group( groups.passed[i] )
			.xUnits(function(d){ return 18; });

		charts.passed.push( chart );

		dimensions.failed.push( cf_failed.dimension( dimension_creator ) );
		filter_dimensions.failed.push( cf_failed.dimension( filter_dimension_creator ) );
		groups.failed.push( dimensions.failed[i].group( ).reduceCount( ) );	

		filter_dimensions.failed[0].filter( function( d ) { return String( d ) === String( -1 ); } )

		var name = 'failed_variable' + i;
		var width = document.getElementById( name ).offsetWidth * 0.9;

		var chart = dc.barChart( '#' + name )
			.width(width)
			.height(150)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.elasticY(true)
			.dimension( dimensions.failed[i] )
			.ordinalColors( [ '#FF5E57' ] )
			.group( groups.failed[i] )
			.xUnits(function(d){ return 18; });

		charts.failed.push( chart );

	}

	dc.renderAll( );

}

/*
	Initialized the application
*/
function initialize() {

	d3.json( './data/dict_results.json', function( dict ) {

		createSTRAD( dict );

	} );

	d3.csv( './data/data_join_imp_variables.csv', function( data ) {

		d3.csv( './data/var_importance.csv', function( important_vars ) {

			createCharts( important_vars.map( function( d ) { return d.Variables; } ), data );

		} );

	} );

	
}
initialize();



//choose plotlines to add/remove:
$('#btn_add_yearplotline').click(function(){
	var line=$('#add_yearplotline').val();
	switch (line)
	{
		case 'Passed Pieces':
		timewheel.addYearPlotline('Passed Pieces per DoW', year_passed);
		break;
		case 'Failed Pieces':
		timewheel.addYearPlotline('Failed Pieces per DoW', year_failed);
		break;
	}
	$('#add_yearplotline option[value="'+line+'"]').remove();
	$('#rm_yearplotline').append('<option value="'+line+'">'+line+'</option>');
});

$('#btn_add_dayplotline').click(function(){
	var line=$('#add_dayplotline').val();
	switch (line)
	{
		case 'Passed Pieces':
		timewheel.addDayPlotline('Passed Pieces per Hour', tod_passed);
		break;
		case 'Failed Pieces':
		timewheel.addDayPlotline('Failed Pieces per Hour', tod_failed);
		break;
	}
	$('#add_dayplotline option[value="'+line+'"]').remove();
	$('#rm_dayplotline').append('<option value="'+line+'">'+line+'</option>');
});

$('#btn_rm_yearplotline').click(function(){
	var line=$('#rm_yearplotline').val();
	timewheel.removeYearPlotline(line);
	$('#rm_yearplotline option[value="'+line+'"]').remove();
	$('#add_yearplotline').append('<option value="'+line+'">'+line+'</option>');
});

$('#btn_rm_dayplotline').click(function(){
	var line=$('#rm_dayplotline').val();
	timewheel.removeDayPlotline(line);
	$('#rm_dayplotline option[value="'+line+'"').remove();
	$('#add_dayplotline').append('<option value="'+line+'">'+line+'</option>');

});