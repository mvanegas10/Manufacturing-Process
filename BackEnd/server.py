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
	df_raw_data_variables = df_raw_data[ df_variables ]

	# Parses important variables to numeric
	for col in df_raw_data_variables.columns:
		df_raw_data_variables[ col ] = pd.to_numeric( df_raw_data_variables[ col ], errors='coerce' )
	
	# Calculates mean and standard deviation for each variable 
	mean = pd.Series(pd.DataFrame.mean( df_raw_data_variables ), name='mean')
	std = pd.Series(pd.DataFrame.std( df_raw_data_variables ), name='std')
	
	# Creates return dictionary
	dictionary = {
		'result': result,
		'stats': pd.concat( [ mean, std ], axis=1 ).to_dict( orient='index' )
	}

	# Returns result
	return json.dumps( dictionary )

# Gets the date count/avg for a specific status
@app.route( '/get_date/<status>', methods = [ 'POST' ] )
def get_date( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	status_value = None
	
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	if data['from'] < data['to']:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, %s( %s ) AS v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, data['from'], data['to'] )
	else:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, %s( %s ) AS v FROM table_secom WHERE results = %d AND ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour count/avg for a specific status
@app.route( '/get_hour/<status>', methods = [ 'POST' ] )
def get_hour( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	if data['from'] < data['to']:
		query = 'SELECT HOUR( timestamp ) AS h, %s( %s ) AS v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY h' % ( data['reducer'], data['reducer_variable'], status_value, data['from'], data['to'] )
	else:
		query = 'SELECT HOUR( timestamp ) AS h, %s( %s ) AS v FROM table_secom WHERE results = %d AND ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) GROUP BY h' % ( data['reducer'], data['reducer_variable'], status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the date count/avg for a specific status
@app.route( '/get_date_tod/<status>', methods = [ 'POST' ] )
def get_date_tod( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = None
	status_value = None

	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1

	if int( data['from'] ) < int( data['to'] ):
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, %s( %s ) AS v FROM table_secom WHERE results = %d AND HOUR( timestamp ) >= %d AND HOUR( timestamp ) <= %d GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, int( data['from'] ), int( data['to'] ) )
	else:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, %s( %s ) AS v FROM table_secom WHERE results = %d AND ( HOUR( timestamp ) >= %d OR HOUR( timestamp ) <= %d ) GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, int( data['from'] ), int( data['to'] ) )

	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the date count/avg for a specific status
@app.route( '/get_date_dow/<status>', methods = [ 'POST' ] )
def get_date_dow( status ):

	# Create array from jsonified string
	data = request.form
	dows  = ast.literal_eval( data[ 'dows' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, %s( %s ) AS v FROM table_secom WHERE results = %d AND ( DAYOFWEEK( timestamp ) - 1 ) IN ( %s ) GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, ', '.join( str( x ) for x in dows ) )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour count/avg for a specific status
@app.route( '/get_hour_dow/<status>', methods = [ 'POST' ] )
def get_hour_dow( status ):

	# Create array from jsonified string
	data = request.form
	dows  = ast.literal_eval( data[ 'dows' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT HOUR( timestamp ) AS h, %s( %s ) AS v FROM table_secom WHERE results = %d AND ( DAYOFWEEK( timestamp ) - 1 ) IN ( %s ) GROUP BY h' % ( data['reducer'], data['reducer_variable'], status_value, ', '.join( str( x ) for x in dows ) )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

if __name__ == '__main__':
    app.run( host= '0.0.0.0', port=5000, debug=True )