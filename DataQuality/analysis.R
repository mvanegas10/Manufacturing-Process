Sys.setenv(LANG = "en")
setwd("/Users/meili/Documents/TUK/Manufacturing-Process/CalidadDatos/")

data <- read.table("data/secom.data")

print('------------------------- data -------------------------')
print(data)

names(data)

labels <- read.table("data/secom_labels.data")

print('------------------------- labels -------------------------')
print(labels)

label <- labels$V1

print('------------------------- label -------------------------')
print(label)

head(label)

secom <- cbind(data,label)

head(secom)

#Replace the missing values of NaN with 0.
secom[secom == "NaN"] <- 0

########################################################################

install.packages("caret", repos="http://cran.rstudio.com/")
install.packages('e1071', dependencies=TRUE)
library(caret)

control <- rfeControl(functions=rfFuncs)

results <- rfe(secom[,1:590], as.factor(secom[,591]), sizes=c(100), rfeControl=control)

predictors(results)

cols <-varImp(results)

cols.names <- row.names(cols)    

cols$names <- cols.names

#get the 100 names

predictors100 <- cols[1:100,2]

print(predictors100)
