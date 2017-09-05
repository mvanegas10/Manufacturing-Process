#!venv/bin/python
from flask import Flask
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
@app.route( '/get_all_count_date/<status>', methods = [ 'GET' ] )
def get_all_count_date( status ):
	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT MONTH( timestamp ) as m, DAY( timestamp ) as d, COUNT( * ) as v FROM table_secom WHERE results = %d GROUP BY MONTH( timestamp ), DAY( timestamp )' % ( status_value )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )

# Gets the hour count for a specific status
@app.route( '/get_all_count_hour/<status>', methods = [ 'GET' ] )
def get_all_count_hour( status ):
	# Creates cursor
	cur = get_cursor( )

	# Builds query
	status_value = None
	if status == 'passed':
		status_value = -1
	elif status == 'failed':
		status_value = 1
	query = 'SELECT HOUR( timestamp ) as h, COUNT( * ) as v FROM table_secom WHERE results = %d GROUP BY HOUR( timestamp )' % ( status_value )
	
	# Executes query
	cur.execute( query )
	result = [ dict( ( cur.description[i][0], value ) \
		for i, value in enumerate( row ) ) for row in cur.fetchall( ) ]

	# Returns result
	return jsonify( result )


if __name__ == '__main__':
    app.run(debug=True)