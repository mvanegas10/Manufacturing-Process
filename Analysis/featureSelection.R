# Global Configurations
Sys.setenv(LANG = "en")
setwd("/home/meili/Documents/TUK/Projekt/Manufacturing-Process/Analysis")

print("Begging at")
Sys.time()

# Requirements
library(FSelector)
library(caret)

# Read data from CSV file
data <- read.csv(file="../DataQuality/data/cleansed/table_secom.csv",head=TRUE,sep=",")

# Creates symbolic description of a model
factor <- as.factor(data[,2])

# Separates relevant features from dataset 
features <- data[,4:526]

recursive_feature_elimination_features <- matrix(NA, nrow=10, ncol=5)
random_forest_importance_weights <- matrix(NA, nrow=10, ncol=5) 

for (i in 1:10) {
	# Eliminates features using a simple recursive feature elimination
	recursive_feature_elimination <- rfe(features, factor, sizes=c(5), rfeControl=rfeControl(functions=rfFuncs))
	recursive_feature_elimination_features_temp <-varImp(recursive_feature_elimination)
	recursive_feature_elimination_features_temp.names <- row.names(recursive_feature_elimination_features_temp)
	recursive_feature_elimination_features_temp$names <- recursive_feature_elimination_features_temp.names
	rfe_vector <- recursive_feature_elimination_features_temp[1:5,2]
	recursive_feature_elimination_features[i,] <- rfe_vector
	cat("Finished rfe ", i)
	Sys.time()

	# Calculates weights using the symbolic description of the model and the selected features
	weights_rfi <- random.forest.importance(factor ~ ., features, importance.type = 1)
	random_forest_importance_weights_temp <- cutoff.k(weights_rfi, 5)
	random_forest_importance_weights[i,] <- random_forest_importance_weights_temp
	cat("Finished random.forest.importance ", i)
	Sys.time()
	
	# Writes results in CSV file
	write.csv(recursive_feature_elimination_features, file = "results/recursiveFeatureElimination.csv")
	write.csv(random_forest_importance_weights, file = "results/randomForestImportance.csv")
	
}

# Writes results in CSV file
write.csv(recursive_feature_elimination_features, file = "results/recursiveFeatureElimination.csv")
write.csv(random_forest_importance_weights, file = "results/randomForestImportance.csv")