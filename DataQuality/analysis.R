# Global Configurations
Sys.setenv(LANG = "en")
setwd("/home/meili/Documents/TUK/Projekt/Manufacturing-Process/DataQuality")

# Requirements
library(caret)

# Read data from CSV file
data <- read.csv(file="data/cleansed/table_secom.csv",head=FALSE,sep=";")
print(data)

# Creates control group for Reverse Feature Elimination
control <- rfeControl(functions=rfFuncs)

# Reverse Feature Elimination
results <- rfe(data[,1:590], as.factor(data[,591]), sizes=c(5), rfeControl=control)

predictors(results)

cols <-varImp(results)

cols.names <- row.names(cols)    

cols$names <- cols.names

#get the 100 names

predictors100 <- cols[1:100,2]

print(predictors100)
