#!venv/bin/python

# Flask
from flask import Flask
from flask import request
from flask_cors import CORS

# ORM 
import MySQLdb

# Process tree construction
import ast

# Pandas
import pandas as pd
import numpy as np

# Json objects
import simplejson as json

db = MySQLdb.connect(
	host	= "localhost", 
	user	= "root", 
	passwd	= "1234", 
	db 		= "secom"
)

app = Flask( __name__ )
CORS(app)

# Creates a cursor
def get_cursor( ):
	return db.cursor( )

# Closes a connection
def close_connection( cursor ):
	cursor.connection.close( )

# Creates a dictionary from a query result
def create_dictionary( query_description, query_result ):
	return [ dict( ( query_description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in query_result ]

# Gets the raw data for a specific variable
@app.route( '/get_raw_data/', methods = [ 'POST' ] )
def get_raw_data( ):

	# Create array from jsonified string
	data = request.form
	variables = ast.literal_eval( data[ 'variables' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = 'SELECT id, results, ( UNIX_TIMESTAMP( timestamp ) * 1000 ) AS timevalue, %s FROM table_secom' % ( ', '.join( str( x ) for x in variables )  )

	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Creates dataframes
	df_raw_data = pd.DataFrame.from_dict( result )
	df_variables = np.array( variables )
	df_raw_data_variables_passed = df_raw_data[ df_raw_data[ 'results'] == -1 ][ df_variables ]
	df_raw_data_variables_failed = df_raw_data[ df_raw_data[ 'results'] == 1 ][ df_variables ]

	# Parses important variables to numeric
	for col in df_raw_data_variables_passed.columns:
		df_raw_data_variables_passed[ col ] = pd.to_numeric( df_raw_data_variables_passed[ col ], errors='coerce' ).abs( )
		df_raw_data_variables_failed[ col ] = pd.to_numeric( df_raw_data_variables_failed[ col ], errors='coerce' ).abs( )
	
	# Calculates mean and standard deviation for each variable 
	mean_passed = pd.Series(pd.DataFrame.mean( df_raw_data_variables_passed ), name='mean_passed')
	std_passed = pd.Series(pd.DataFrame.std( df_raw_data_variables_passed ), name='std_passed')
	
	mean_failed = pd.Series(pd.DataFrame.mean( df_raw_data_variables_failed ), name='mean_failed')
	std_failed = pd.Series(pd.DataFrame.std( df_raw_data_variables_failed ), name='std_failed')
	
	# Creates return dictionary
	dictionary = {
		'result': result,
		'stats': pd.concat( [ mean_passed, std_passed, mean_failed, std_failed ], axis=1 ).to_dict( orient='index' )
	}

	# Returns result
	return json.dumps( dictionary )

# Gets the date count/avg for a specific status
@app.route( '/get_date/<status>', methods = [ 'POST' ] )
def get_date( status ):

	data = request.form
	dows  = ast.literal_eval( data[ 'dows' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	query_date = None
	query_tod = None
	query_dow = None
	status_value = None
	
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	if data['date1'] < data['date2']:
		query_date = 'SELECT * FROM table_secom WHERE timestamp BETWEEN \'%s\' AND \'%s\'' % ( data['date1'], data['date2'] )
	else:
		query_date = 'SELECT * FROM table_secom WHERE ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) ' % ( data['date1'], data['date2'] )

	if int( data['hour1'] ) < int( data['hour2'] ):
		query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE HOUR( timestamp ) >= %d AND HOUR( timestamp ) <= %d ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
	else:
		query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE ( HOUR( timestamp ) >= %d OR HOUR( timestamp ) <= %d ) ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
	
	query_dow = 'SELECT * FROM ( %s ) filteredDatesDows WHERE ( DAYOFWEEK( timestamp ) - 1 ) IN ( %s )' % ( query_tod, ', '.join( str( x ) for x in dows ) )

	query = 'SELECT temp.month as m, temp.dow as d, %s( temp.value ) AS v FROM ( SELECT ( MONTH( timestamp ) - 1 ) AS month, ( DAYOFWEEK( timestamp ) - 1 ) AS dow, ABS( %s ) AS value FROM ( %s ) filteredDatesDowsTods WHERE results = %d ) temp GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], query_dow, status_value )

	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour count/avg for a specific status
@app.route( '/get_hour/<status>', methods = [ 'POST' ] )
def get_hour( status ):

	data = request.form
	dows  = ast.literal_eval( data[ 'dows' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	query_date = None
	query_tod = None
	query_dow = None
	status_value = None
	
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	if data['date1'] < data['date2']:
		query_date = 'SELECT * FROM table_secom WHERE timestamp BETWEEN \'%s\' AND \'%s\'' % ( data['date1'], data['date2'] )
	else:
		query_date = 'SELECT * FROM table_secom WHERE ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) ' % ( data['date1'], data['date2'] )

	if int( data['hour1'] ) < int( data['hour2'] ):
		query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE HOUR( timestamp ) BETWEEN %d AND %d ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
	else:
		query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE ( HOUR( timestamp ) >= %d OR HOUR( timestamp ) <= %d ) ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
	
	query_dow = 'SELECT * FROM ( %s ) filteredDatesDows WHERE ( DAYOFWEEK( timestamp ) - 1 ) IN ( %s )' % ( query_tod, ', '.join( str( x ) for x in dows ) )

	query = 'SELECT temp.hour as h, %s( temp.value ) AS v FROM ( SELECT HOUR( timestamp ) AS hour, ABS( %s ) AS value FROM ( %s ) filteredDatesDowsTods WHERE results = %d ) temp GROUP BY h' % ( data['reducer'], data['reducer_variable'], query_dow, status_value )

	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the date count/avg for a specific status and a set of ids
@app.route( '/get_date_id/<status>', methods = [ 'POST' ] )
def get_date_id( status ):
	data = request.form
	id_set = ast.literal_eval( data[ 'id_set' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	status_value = None
	
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	query = 'SELECT temp.month as m, temp.dow as d, %s( temp.value ) AS v FROM ( SELECT ( MONTH( timestamp ) - 1 ) AS month, ( DAYOFWEEK( timestamp ) - 1 ) AS dow, ABS( %s ) AS value FROM table_secom WHERE results = %d AND id IN ( %s ) ) temp GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, ', '.join( str( x ) for x in id_set ) )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour count/avg for a specific status and a set of ids
@app.route( '/get_hour_id/<status>', methods = [ 'POST' ] )
def get_hour_id( status ):
	data = request.form
	id_set = ast.literal_eval( data[ 'id_set' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	query = 'SELECT temp.hour as h, %s( temp.value ) as v FROM ( SELECT HOUR( timestamp ) AS hour, ABS( %s ) AS value FROM table_secom WHERE results = %d AND id IN ( %s ) ) temp GROUP BY h' % ( data['reducer'], data['reducer_variable'], status_value, ', '.join( str( x ) for x in id_set ) )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

if __name__ == '__main__':
    app.run( host= '0.0.0.0', port=5000, debug=True )