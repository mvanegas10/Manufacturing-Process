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
var cf;

// Dimensions
var dimensions = [];
var rounds = [ -1, -1, -1, 0, 1 ];
var minimum = [];
var maximum = [];

// Groupings
var groups = [];

/*
	DC
*/
var charts = [];

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

	cf = crossfilter( data );
	console.log( important_vars );

	for ( var i = 0; i < important_vars.length; i++ ) {

		dimensions.push( cf.dimension( function( d ) { return +d3.round(d[important_vars[i]], rounds[i]); } ) );
		groups.push( dimensions[i].group( ).reduceCount( ) );

		console.log( groups[i].top( Infinity ) );

		minimum.push( dimensions[i].bottom(1)[0][important_vars[i]] );
		maximum.push( dimensions[i].top(1)[0][important_vars[i]] );

		var name = 'variable' + i;
		console.log( name );
		var width = document.getElementById( name ).offsetWidth * 0.9;

		var chart = dc.barChart( '#' + name )
			.width(width)
			.height(200)
			.x( d3.scale.linear( ).domain( [ minimum[i], maximum[i] ] ) )
			.dimension( dimensions[i] )
			.group( groups[i] );


		charts.push( chart );		

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