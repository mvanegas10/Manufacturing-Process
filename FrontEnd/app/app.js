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
var v0_dim;
var v1_dim;
var v2_dim;
var v3_dim;
var v4_dim;

// Groupings
var count_v0;
var count_v1;
var count_v2;
var count_v3;
var count_v4;

function initialize() {

	d3.json( './data/dict_results.json', function( dict ) {

		year_passed = dict.year_passed;
		tod_passed = dict.tod_passed;
		year_failed = dict.year_failed;
		tod_failed = dict.tod_failed;

		//populate div with the tool
		timewheel = new StradWheel( '#timeview' );

		timewheel.setSelectableYears( [2008] );
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

	} );

	d3.csv( './data/data_join_imp_variables.csv', function( data ) {

		cf = crossfilter( data );

		v0_dim = cf.dimension( function( d ) { return +d3.round(d.V66, -1); } );
		count_v0 = v0_dim.group( ).reduceCount( );

		v1_dim = cf.dimension( function( d ) { return +d3.round(d.V17, 0); } );
		count_v1 = v1_dim.group( ).reduceCount( );

		v2_dim = cf.dimension( function( d ) { return +d3.round(d.V26, 1); } );
		count_v2 = v2_dim.group( ).reduceCount( );

		v3_dim = cf.dimension( function( d ) { return +d3.round(d.V60, -1); } );
		count_v3 = v3_dim.group( ).reduceCount( );

		v4_dim = cf.dimension( function( d ) { return +d3.round(d.V65, -1); } );
		count_v4 = v4_dim.group( ).reduceCount( );

		console.log( count_v0.top( Infinity ) );
		console.log( count_v1.top( Infinity ) );
		console.log( count_v2.top( Infinity ) );
		console.log( count_v3.top( Infinity ) );
		console.log( count_v4.top( Infinity ) );

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