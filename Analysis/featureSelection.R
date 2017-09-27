# Global Configurations
Sys.setenv(LANG = "en")
setwd("/home/meili/Documents/TUK/Projekt/Manufacturing-Process/Analysis")

# Requirements
library(FSelector)
library(caret)

# Read data from CSV file
data <- read.csv(file="../DataQuality/data/cleansed/table_secom.csv",head=FALSE,sep=";")

# Creates symbolic description of a model
factor <- as.factor(data[,2])

# Separates relevant features from dataset 
features <- data[,4:526]

# Eliminates features using a simple recursive feature elimination
recursive_feature_elimination <- rfe(features, factor, sizes=c(5), rfeControl=rfeControl(functions=rfFuncs))
recursive_feature_elimination_features <-varImp(recursive_feature_elimination)
print('Finished rfe')

# Calculates weights using the symbolic description of the model and the selected features
weights_rfi <- random.forest.importance(factor ~ ., features, importance.type = 1)
random_forest_importance_weights <- cutoff.k(weights_rfi, 5)
print('Finished random.forest.importance')

weights_chi <- chi.squared(factor ~ ., features)
chi_squared_weights <- cutoff.k(weights_chi, 5)
print('Finished chi.squared')

weights_ig <- information.gain(factor ~ ., features)
information_gain_weights <- cutoff.k(weights_ig, 5)
print('Finished information.gain')

weights_gr <- gain.ratio(factor ~ ., features)
gain_ratio_weights <- cutoff.k(weights_gr, 5)
print('Finished gain.ratio')

weights_su <- symmetrical.uncertainty(factor ~ ., features)
symmetrical_uncertainty_weights <- cutoff.k(weights_su, 5)
print('Finished symmetrical.uncertainty')

# Writes results in CSV file
write.csv(recursive_feature_elimination_features, file = "results/recursiveFeatureElimination.csv")
write.csv(random_forest_importance_weights, file = "results/randomForestImportance.csv")
write.csv(chi_squared_weights, file = "results/chiSquared.csv")
write.csv(information_gain_weights, file = "results/informationGain.csv")
write.csv(gain_ratio_weights, file = "results/gainRatio.csv")
write.csv(symmetrical_uncertainty_weights, file = "results/symmetricalUncertainty.csv")
