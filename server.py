#!venv/bin/python

import sys
import os
import time
import ConfigParser

# Flask
from flask import Flask
from flask import request
from flask_cors import CORS

# ORM 
import sqlite3

# Process tree construction
import ast

# Pandas
import pandas as pd
import numpy as np

# Json objects
import simplejson as json

# Deploying Simple HTTP Server
import SimpleHTTPServer
import SocketServer

# Multiprocessing for multiple deployments
import multiprocessing 

PROJECT_DIR = os.path.dirname(os.path.dirname(__file__))
CONFIG_FILE = os.path.join(PROJECT_DIR, "config.cfg")

config = ConfigParser.ConfigParser()
config.read(CONFIG_FILE)

SQLITE_FILE = os.path.join(PROJECT_DIR, config.get('sqlite','file'))

app = Flask( __name__ )
CORS(app)

REST_PORT = 8081
HTTP_PORT = 8080

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
httpd = SocketServer.TCPServer(("", HTTP_PORT), Handler)

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

    # Builds query
    query = 'SELECT id, CAST(results AS NUMERIC) AS results, ( strftime("%%s", timestamp) * 1000 ) AS timevalue, %s FROM table_secom' % ( ', '.join( str( x ) for x in variables )  )

    # Executes query
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute(query)
        result = create_dictionary( cur.description, cur.fetchall( ) )

        # Creates dataframes
        df_raw_data = pd.DataFrame.from_dict( result )

        for c in variables:
            df_raw_data[c] = df_raw_data[c].apply(lambda x:float(x))
        
        df_variables = np.array( variables )
        df_raw_data_variables_passed = df_raw_data[ df_raw_data[ 'results'] == -1 ][ df_variables ]
        df_raw_data_variables_failed = df_raw_data[ df_raw_data[ 'results'] == 1 ][ df_variables ]
        
        # Calculates mean and standard deviation for each variable 
        mean_passed = pd.Series(pd.DataFrame.mean( df_raw_data_variables_passed ), name='mean_passed')
        std_passed = pd.Series(pd.DataFrame.std( df_raw_data_variables_passed ), name='std_passed')
        
        mean_failed = pd.Series(pd.DataFrame.mean( df_raw_data_variables_failed ), name='mean_failed')
        std_failed = pd.Series(pd.DataFrame.std( df_raw_data_variables_failed ), name='std_failed')
        
        # Creates return dictionary
        dictionary = {
            'result': df_raw_data.T.to_dict().values(),
            'stats': pd.concat( [ mean_passed, std_passed, mean_failed, std_failed ], axis=1 ).to_dict( orient='index' )
        }

        # Returns result
        return json.dumps( dictionary )

# Gets the date count/avg for a specific status
@app.route( '/get_date/<status>', methods = [ 'POST' ] )
def get_date( status ):

    data = request.form
    dows  = ast.literal_eval( data[ 'dows' ] )

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

    if data['date1'] <= data['date2']:
        query_date = 'SELECT * FROM table_secom WHERE timestamp BETWEEN \'%s\' AND \'%s\'' % ( data['date1'], data['date2'] )
    else:
        query_date = 'SELECT * FROM table_secom WHERE ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) ' % ( data['date1'], data['date2'] )

    if int( data['hour1'] ) <= int( data['hour2'] ):
        query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE strftime("%%H", timestamp) >= \'%d\' AND strftime("%%H", timestamp) <= \'%d\' ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
    else:
        query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE strftime("%%H", timestamp) >= \'%d\' OR strftime("%%H", timestamp) <= \'%d\' ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
    
    query_dow = 'SELECT * FROM ( %s ) filteredDatesDows WHERE strftime("%%w", timestamp) IN ( \'%s\' )' % ( query_tod, '\', \''.join( str( x ) for x in dows ) )

    query = 'SELECT (CAST( strftime("%%m", timestamp) AS NUMERIC ) - 1) AS m, CAST( strftime("%%w", timestamp) AS NUMERIC) AS d, CAST( %s( %s ) AS NUMERIC ) AS v FROM ( %s ) filteredDatesDowsTods WHERE results = \'%d\' GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], query_dow, status_value )

    # Executes query
    with sqlite3.connect(SQLITE_FILE) as conn:
        print(query)
        cur = conn.cursor()
        cur.execute(query)
        result = create_dictionary( cur.description, cur.fetchall( ) )

        # Returns result
        return json.dumps( result )

# Gets the hour count/avg for a specific status
@app.route( '/get_hour/<status>', methods = [ 'POST' ] )
def get_hour( status ):

    data = request.form
    dows  = ast.literal_eval( data[ 'dows' ] )

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

    if data['date1'] <= data['date2']:
        query_date = 'SELECT * FROM table_secom WHERE timestamp BETWEEN \'%s\' AND \'%s\'' % ( data['date1'], data['date2'] )
    else:
        query_date = 'SELECT * FROM table_secom WHERE ( timestamp >= \'%s\' OR timestamp <= \'%s\' ) ' % ( data['date1'], data['date2'] )

    if int( data['hour1'] ) <= int( data['hour2'] ):
        query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE strftime("%%H", timestamp) BETWEEN \'%d\' AND \'%d\' ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
    else:
        query_tod = 'SELECT * FROM ( %s ) filteredDates WHERE ( strftime("%%H", timestamp) >= \'%d\' OR strftime("%%H", timestamp) <= \'%d\' ) ' % ( query_date, int( data['hour1'] ), int( data['hour2'] ) )
    
    query_dow = 'SELECT * FROM ( %s ) filteredDatesDows WHERE strftime("%%w", timestamp) IN ( \'%s\' )' % ( query_tod, '\', \''.join( str( x ) for x in dows ) )

    query = 'SELECT CAST( strftime("%%H", timestamp ) AS NUMERIC ) AS h, CAST( %s( %s ) AS NUMERIC ) AS v FROM ( %s ) filteredDatesDowsTods WHERE results = \'%d\' GROUP BY h' % ( data['reducer'], data['reducer_variable'], query_dow, status_value )

    # Executes query
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute(query)
        result = create_dictionary( cur.description, cur.fetchall( ) )    

        # Returns result
        return json.dumps( result )

# Gets the date count/avg for a specific status and a set of ids
@app.route( '/get_date_id/<status>', methods = [ 'POST' ] )
def get_date_id( status ):
    data = request.form
    id_set = ast.literal_eval( data[ 'id_set' ] )

    # Builds query
    query = None
    status_value = None
    
    if status == 'passed':
        status_value = -1
    elif status == 'failed':
        status_value = 1

    query = 'SELECT (CAST( strftime("%%m", timestamp) AS NUMERIC ) - 1) AS m, CAST( strftime("%%w", timestamp) AS NUMERIC ) AS d, CAST( %s( %s ) AS NUMERIC ) AS v FROM table_secom WHERE results = \'%d\' AND id IN ( \'%s\' ) GROUP BY m, d' % ( data['reducer'], data['reducer_variable'], status_value, '\', \''.join( str( x ) for x in id_set ) )
    
    # Executes query
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute(query)
        result = create_dictionary( cur.description, cur.fetchall( ) )    

        # Returns result
        return json.dumps( result )

# Gets the hour count/avg for a specific status and a set of ids
@app.route( '/get_hour_id/<status>', methods = [ 'POST' ] )
def get_hour_id( status ):
    data = request.form
    id_set = ast.literal_eval( data[ 'id_set' ] )

    # Builds query
    query = None
    status_value = None
    if status == 'passed':
        status_value = -1
    elif status == 'failed':
        status_value = 1

    query = 'SELECT CAST(strftime("%%H", timestamp) AS NUMERIC) AS h, CAST(%s( %s ) AS NUMERIC) AS v FROM table_secom WHERE results = \'%d\' AND id IN ( \'%s\' ) GROUP BY h' % ( data['reducer'], data['reducer_variable'], status_value, '\', \''.join( str( x ) for x in id_set ) )
    
    # Executes query
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute(query)
        result = create_dictionary( cur.description, cur.fetchall( ) )    

        # Returns result
        return json.dumps( result )

def start_rest():
    app.run( host= '0.0.0.0', port=REST_PORT )

def start_http_server():
    print " * Running on http://localhost:%d" % HTTP_PORT
    httpd.serve_forever()

def main():
    rest = multiprocessing.Process(target=start_rest)
    rest.start()

    http = multiprocessing.Process(target=start_http_server)
    http.start()

    try:
        while 1:
            time.sleep(.1)

    except KeyboardInterrupt:
        rest.terminate()
        rest.join()

        http.terminate()
        http.join()

        print "Processes successfully terminated."

if __name__ == '__main__':
    main()