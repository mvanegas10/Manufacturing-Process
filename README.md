# Manufacturing-Process

## Dependencies
### FrontEnd
```
npm install live-server
```

### BackEnd
```
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
```

### DataQuality
```
sudo su - -c "R -e \"install.packages('caret', repos = 'http://cran.rstudio.com/')\""
sudo su - -c "R -e \"install.packages('e1071', repos = 'http://cran.rstudio.com/')\""
sudo su - -c "R -e \"install.packages('randomForest', repos = 'http://cran.rstudio.com/')\""
```