#!venv/bin/python

# Flask
from flask import Flask
from flask import request
from flask_cors import CORS

# ORM 
import MySQLdb

# Process tree construction
import ast

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
	data = ast.literal_eval( request.form[ 'variables' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	query = 'SELECT id, results, ( UNIX_TIMESTAMP( timestamp ) * 1000 ) AS timevalue, %s FROM table_secom' % ( ', '.join( str( x ) for x in data)  )

	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the date count for a specific status
@app.route( '/get_count_date/<status>', methods = [ 'POST' ] )
def get_count_date( status ):

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
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, COUNT( * ) AS v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY m, d' % ( status_value, data['from'], data['to'] )
	else:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, COUNT( * ) AS v FROM table_secom WHERE results = %d AND ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) GROUP BY m, d' % ( status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour count for a specific status
@app.route( '/get_count_hour/<status>', methods = [ 'POST' ] )
def get_count_hour( status ):

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
		query = 'SELECT HOUR( timestamp ) AS h, COUNT( * ) AS v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY h' % ( status_value, data['from'], data['to'] )
	else:
		query = 'SELECT HOUR( timestamp ) AS h, COUNT( * ) AS v FROM table_secom WHERE results = %d AND ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) GROUP BY h' % ( status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the date count for a specific status
@app.route( '/get_count_date_tod/<status>', methods = [ 'POST' ] )
def get_count_date_tod( status ):

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
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, COUNT( * ) AS v FROM table_secom WHERE results = %d AND HOUR( timestamp ) >= %d AND HOUR( timestamp ) <= %d GROUP BY m, d' % ( status_value, int( data['from'] ), int( data['to'] ) )
	else:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, COUNT( * ) AS v FROM table_secom WHERE results = %d AND ( HOUR( timestamp ) >= %d OR HOUR( timestamp ) <= %d ) GROUP BY m, d' % ( status_value, int( data['from'] ), int( data['to'] ) )

	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the date count for a specific status
@app.route( '/get_count_date_dow/<status>', methods = [ 'POST' ] )
def get_count_date_dow( status ):

	# Create array from jsonified string
	data  = ast.literal_eval( request.form[ 'dows' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, COUNT( * ) AS v FROM table_secom WHERE results = %d AND ( DAYOFWEEK( timestamp ) - 1 ) IN ( %s ) GROUP BY m, d' % ( status_value, ', '.join( str( x ) for x in data ) )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour count for a specific status
@app.route( '/get_count_hour_dow/<status>', methods = [ 'POST' ] )
def get_count_hour_dow( status ):

	# Create array from jsonified string
	data  = ast.literal_eval( request.form[ 'dows' ] )

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT HOUR( timestamp ) AS h, COUNT( * ) AS v FROM table_secom WHERE results = %d AND ( DAYOFWEEK( timestamp ) - 1 ) IN ( %s ) GROUP BY h' % ( status_value, ', '.join( str( x ) for x in data ) )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )


# Gets the date average for a specific status
@app.route( '/get_avg_date/<status>', methods = [ 'POST' ] )
def get_avg_date( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT ( MONTH( timestamp ) - 1 ) AS m, ( DAYOFWEEK( timestamp ) - 1 ) AS d, AVG( %s ) AS v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY m, d' % ( data['var'], status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )

# Gets the hour average for a specific status
@app.route( '/get_avg_hour/<status>', methods = [ 'POST' ] )
def get_avg_hour( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT HOUR( timestamp ) AS h, AVG( %s ) AS v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY h' % ( data['var'], status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = create_dictionary( cur.description, cur.fetchall( ) )

	# Returns result
	return json.dumps( result )


if __name__ == '__main__':
    app.run( host= '0.0.0.0', port=5000, debug=True )