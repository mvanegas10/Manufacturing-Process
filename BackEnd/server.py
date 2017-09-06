#!venv/bin/python
from flask import Flask
from flask import request
from flask import jsonify
import MySQLdb

db = MySQLdb.connect(
	host	= "localhost", 
	user	= "root", 
	passwd	= "1234", 
	db 		= "secom"
)

app = Flask( __name__ )

# Creates a cursor
def get_cursor( ):
	return db.cursor( )

# Closes a connection
def close_connection( cursor ):
	cursor.connection.close( )

# Gets the date count for a specific status
@app.route( '/get_count_date/<status>', methods = [ 'POST' ] )
def get_count_date( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT ( MONTH( timestamp ) - 1 ) as m, ( DAYOFWEEK( timestamp ) - 1 ) as d, COUNT( * ) as v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY m, d' % ( status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

# Gets the hour count for a specific status
@app.route( '/get_count_hour/<status>', methods = [ 'POST' ] )
def get_count_hour( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT HOUR( timestamp ) as h, COUNT( * ) as v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY h' % ( status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

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

	if data['from'] < data['to']:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) as m, ( DAYOFWEEK( timestamp ) - 1 ) as d, COUNT( * ) as v FROM table_secom WHERE results = %d AND HOUR( timestamp ) >= %d AND HOUR( timestamp ) <= %d GROUP BY m, d' % ( status_value, int( data['from'] ), int( data['to'] ) )
	else:
		query = 'SELECT ( MONTH( timestamp ) - 1 ) as m, ( DAYOFWEEK( timestamp ) - 1 ) as d, COUNT( * ) as v FROM table_secom WHERE results = %d AND ( HOUR( timestamp ) >= %d OR HOUR( timestamp ) <= %d ) GROUP BY m, d' % ( status_value, int( data['from'] ), int( data['to'] ) )

	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

# Gets the hour count for a specific status
@app.route( '/get_count_hour_tod/<status>', methods = [ 'POST' ] )
def get_count_hour_tod( status ):

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
		query = 'SELECT HOUR( timestamp ) as h, COUNT( * ) as v FROM table_secom WHERE results = %d AND HOUR( timestamp ) >= %d AND HOUR( timestamp ) <= %d GROUP BY h' % ( status_value, int( data['from'] ), int( data['to'] ) )
	else:
		query = 'SELECT HOUR( timestamp ) as h, COUNT( * ) as v FROM table_secom WHERE results = %d AND ( HOUR( timestamp ) >= %d OR HOUR( timestamp ) <= %d ) GROUP BY h' % ( status_value, int( data['from'] ), int( data['to'] ) )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

# Gets the date count for a specific status
@app.route( '/get_count_date_dow/<status>', methods = [ 'POST' ] )
def get_count_date_dow( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT ( MONTH( timestamp ) - 1 ) as m, ( DAYOFWEEK( timestamp ) - 1 ) as d, COUNT( * ) as v FROM table_secom WHERE results = %d AND DATEPART( WEEKDAY, timestamp ) >= %d AND DATEPART( WEEKDAY, timestamp ) <= %d GROUP BY m, d' % ( status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

# Gets the hour count for a specific status
@app.route( '/get_count_hour_dow/<status>', methods = [ 'POST' ] )
def get_count_hour_dow( status ):

	data = request.form

	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT HOUR( timestamp ) as h, COUNT( * ) as v FROM table_secom WHERE results = %d AND DATEPART( WEEKDAY, timestamp ) >= %d AND DATEPART( WEEKDAY, timestamp ) <= %d GROUP BY h' % ( status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )


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
	query = 'SELECT ( MONTH( timestamp ) - 1 ) as m, ( DAYOFWEEK( timestamp ) - 1 ) as d, AVG( %s ) as v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY m, d' % ( data['var'], status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

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
	query = 'SELECT HOUR( timestamp ) as h, AVG( %s ) as v FROM table_secom WHERE results = %d AND timestamp BETWEEN \'%s\' AND \'%s\' GROUP BY h' % ( data['var'], status_value, data['from'], data['to'] )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )


if __name__ == '__main__':
    app.run(debug=True)