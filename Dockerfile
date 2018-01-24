# Use an official Python runtime as a parent image
FROM python:2.7

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /src
ADD . /app

# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt

# Run server.py when the container launches
CMD ["python", "server.py"]
