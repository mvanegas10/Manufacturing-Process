/**
* Created by carol on 1/08/16.
*/
var timewheel;

//sample data:

var year_passed=[{'m': 0, 'd': 1, 'v': 1}, {'m': 0, 'd': 2, 'v': 1}, {'m': 0, 'd': 3, 'v': 1}, {'m': 1, 'd': 6, 'v': 5}, {'m': 2, 'd': 6, 'v': 1}, {'m': 3, 'd': 1, 'v': 2}, {'m': 3, 'd': 3, 'v': 1}, {'m': 4, 'd': 3, 'v': 1}, {'m': 4, 'd': 5, 'v': 6}, {'m': 5, 'd': 1, 'v': 5}, {'m': 5, 'd': 6, 'v': 1}, {'m': 6, 'd': 0, 'v': 3}, {'m': 6, 'd': 1, 'v': 5}, {'m': 6, 'd': 2, 'v': 2}, {'m': 6, 'd': 3, 'v': 2}, {'m': 6, 'd': 4, 'v': 1}, {'m': 6, 'd': 5, 'v': 3}, {'m': 7, 'd': 0, 'v': 5}, {'m': 7, 'd': 1, 'v': 3}, {'m': 7, 'd': 2, 'v': 6}, {'m': 7, 'd': 3, 'v': 4}, {'m': 7, 'd': 4, 'v': 7}, {'m': 7, 'd': 5, 'v': 5}, {'m': 7, 'd': 6, 'v': 8}, {'m': 8, 'd': 0, 'v': 3}, {'m': 8, 'd': 1, 'v': 2}, {'m': 8, 'd': 2, 'v': 4}, {'m': 8, 'd': 4, 'v': 4}, {'m': 8, 'd': 5, 'v': 2}, {'m': 8, 'd': 6, 'v': 2}, {'m': 9, 'd': 2, 'v': 6}, {'m': 10, 'd': 6, 'v': 2}];

var tod_passed=[{'h': 0, 'v': 3}, {'h': 1, 'v': 3}, {'h': 2, 'v': 3}, {'h': 3, 'v': 5}, {'h': 4, 'v': 6}, {'h': 5, 'v': 4}, {'h': 6, 'v': 5}, {'h': 7, 'v': 3}, {'h': 8, 'v': 3}, {'h': 9, 'v': 6}, {'h': 10, 'v': 1}, {'h': 11, 'v': 5}, {'h': 12, 'v': 3}, {'h': 13, 'v': 5}, {'h': 14, 'v': 3}, {'h': 15, 'v': 11}, {'h': 16, 'v': 4}, {'h': 17, 'v': 2}, {'h': 18, 'v': 3}, {'h': 19, 'v': 4}, {'h': 20, 'v': 6}, {'h': 21, 'v': 7}, {'h': 22, 'v': 4}, {'h': 23, 'v': 5}];

var year_failed=[{'m': 0, 'd': 1, 'v': 7}, {'m': 0, 'd': 2, 'v': 25}, {'m': 0, 'd': 3, 'v': 16}, {'m': 1, 'd': 4, 'v': 1}, {'m': 1, 'd': 5, 'v': 62}, {'m': 1, 'd': 6, 'v': 30}, {'m': 2, 'd': 0, 'v': 25}, {'m': 2, 'd': 5, 'v': 10}, {'m': 2, 'd': 6, 'v': 14}, {'m': 3, 'd': 1, 'v': 16}, {'m': 3, 'd': 2, 'v': 13}, {'m': 3, 'd': 3, 'v': 17}, {'m': 4, 'd': 3, 'v': 27}, {'m': 4, 'd': 4, 'v': 2}, {'m': 4, 'd': 5, 'v': 26}, {'m': 5, 'd': 1, 'v': 43}, {'m': 5, 'd': 6, 'v': 18}, {'m': 6, 'd': 0, 'v': 7}, {'m': 6, 'd': 1, 'v': 21}, {'m': 6, 'd': 2, 'v': 20}, {'m': 6, 'd': 3, 'v': 30}, {'m': 6, 'd': 5, 'v': 9}, {'m': 6, 'd': 6, 'v': 11}, {'m': 7, 'd': 0, 'v': 36}, {'m': 7, 'd': 1, 'v': 33}, {'m': 7, 'd': 2, 'v': 31}, {'m': 7, 'd': 3, 'v': 83}, {'m': 7, 'd': 4, 'v': 103}, {'m': 7, 'd': 5, 'v': 87}, {'m': 7, 'd': 6, 'v': 60}, {'m': 8, 'd': 0, 'v': 66}, {'m': 8, 'd': 1, 'v': 58}, {'m': 8, 'd': 2, 'v': 32}, {'m': 8, 'd': 3, 'v': 43}, {'m': 8, 'd': 4, 'v': 57}, {'m': 8, 'd': 5, 'v': 72}, {'m': 8, 'd': 6, 'v': 68}, {'m': 9, 'd': 0, 'v': 22}, {'m': 9, 'd': 1, 'v': 16}, {'m': 9, 'd': 2, 'v': 40}, {'m': 9, 'd': 3, 'v': 26}, {'m': 9, 'd': 4, 'v': 13}, {'m': 10, 'd': 0, 'v': 11}, {'m': 10, 'd': 5, 'v': 5}, {'m': 10, 'd': 6, 'v': 17}, {'m': 11, 'd': 0, 'v': 5}, {'m': 11, 'd': 1, 'v': 22}, {'m': 11, 'd': 2, 'v': 7}];

var tod_failed=[{'h': 0, 'v': 62}, {'h': 1, 'v': 39}, {'h': 2, 'v': 57}, {'h': 3, 'v': 65}, {'h': 4, 'v': 59}, {'h': 5, 'v': 70}, {'h': 6, 'v': 57}, {'h': 7, 'v': 70}, {'h': 8, 'v': 61}, {'h': 9, 'v': 49}, {'h': 10, 'v': 52}, {'h': 11, 'v': 63}, {'h': 12, 'v': 64}, {'h': 13, 'v': 45}, {'h': 14, 'v': 74}, {'h': 15, 'v': 88}, {'h': 16, 'v': 54}, {'h': 17, 'v': 56}, {'h': 18, 'v': 60}, {'h': 19, 'v': 59}, {'h': 20, 'v': 73}, {'h': 21, 'v': 64}, {'h': 22, 'v': 52}, {'h': 23, 'v': 70}];

function initialize() {

	//populate div with the tool
	timewheel=new StradWheel('#timeview');

	timewheel.setSelectableYears([2014,2015,2016]);
	timewheel.setYear(2015);

	//Register to changes:

	timewheel.onDatesChange(function(new_datesrange){
		$('#notifications').notify('The selected dates range is now: '
			+new_datesrange
	//Could also be:
	//+timewheel.getDatesRange()
	,{position:'bottom left',autoHideDelay:3000, className: 'info'})
	});

	timewheel.onTodChange(function(new_todrange){
		$('#notifications').notify('The selected time range is now: ['
			+timewheel.getTodRange()
	//Could also be:
	//+new_todrange
	+']',{position:'bottom left',autoHideDelay:3000, className: 'info'})
	});


	timewheel.onDowsChange(function(new_dows){
		$('#notifications').notify('The selected dows are now: ['
			+timewheel.getDows()
	//Could also be:
	//+new_dows
	+']',{position:'bottom left',autoHideDelay:3000, className: 'info'})
	});

	timewheel.onChange(function(prop){
		$('#notifications2').notify('This has changed: '
			+prop
			,{position:'bottom left',autoHideDelay:3000, className: 'success'})
	});
}
initialize();

timewheel.addYearPlotline('Number of pieces that passed', year_passed);
timewheel.addYearPlotline('Number of pieces that failed', year_failed);
timewheel.addDayPlotline('Number of pieces that passed',tod_passed);
timewheel.addDayPlotline('Number of pieces that failed', tod_failed);

//choose plotlines to add/remove:
$('#btn_add_yearplotline').click(function(){
	var line=$('#add_yearplotline').val();
	switch (line)
	{
		case 'Number of pieces that passed':
		timewheel.addYearPlotline('Number of pieces that passed', year_passed);
		break;
		case 'Number of pieces that failed':
		timewheel.addYearPlotline('Number of pieces that failed', year_failed);
		break;
	}
	$('#add_yearplotline option[value="'+line+'"]').remove();
	$('#rm_yearplotline').append('<option value="'+line+'">'+line+'</option>');
});

$('#btn_add_dayplotline').click(function(){
	var line=$('#add_dayplotline').val();
	switch (line)
	{
		case 'Number of pieces that passed':
		timewheel.addDayPlotline('Number of pieces that passed', tod_passed);
		break;
		case 'Number of pieces that failed':
		timewheel.addDayPlotline('Number of pieces that failed', tod_failed);
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