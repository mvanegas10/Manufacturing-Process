# Global Configurations
Sys.setenv(LANG = "en")
setwd("/home/meili/Documents/TUK/Projekt/Manufacturing-Process/DataQuality")

# Requirements
library(FSelector)

# Read data from CSV file
data <- read.csv(file="data/cleansed/table_secom.csv",head=FALSE,sep=";")

# Creates symbolic description of a model
factor <- as.factor(data[,2])

# Separates relevant features from dataset 
features <- data[,4:526]

# Calculates weights using the symbolic description of the model and the selected features
random_forest_importance_weights <- random.forest.importance(factor ~ ., features)
colnames(random_forest_importance_weights)[1] <- "random_forest_importance"
print('Finished random.forest.importance')

chi_squared_weights <- chi.squared(factor ~ ., features)
colnames(chi_squared_weights)[1] <- "chi_squared"
print('Finished chi.squared')

# linear_correlation_weights <- linear.correlation(factor ~ ., features)
# colnames(linear_correlation_weights)[1] <- "linear_correlation"
# print('Finished linear.correlation')

# rank_correlation_weights <- rank.correlation(factor ~ ., features)
# colnames(rank_correlation_weights)[1] <- "rank_correlation"
# print('Finished rank.correlation')

information_gain_weights <- information.gain(factor ~ ., features)
colnames(information_gain_weights)[1] <- "information_gain"
print('Finished information.gain')

gain_ratio_weights <- gain.ratio(factor ~ ., features)
colnames(gain_ratio_weights)[1] <- "gain_ratio"
print('Finished gain.ratio')

symmetrical_uncertainty_weights <- symmetrical.uncertainty(factor ~ ., features)
colnames(symmetrical_uncertainty_weights)[1] <- "symmetrical_uncertainty"
print('Finished symmetrical.uncertainty')

oneR_weights <- oneR(factor ~ ., features)
colnames(oneR_weights)[1] <- "oneR"
print('Finished oneR')

# Writes results in CSV file
write.csv(random_forest_importance_weights, file = "data/analysis/featureSelection.csv")
write.csv(chi_squared_weights, file = "data/analysis/chiSquared.csv")
# write.csv(linear_correlation_weights, file = "data/analysis/linearCorrelation.csv")
# write.csv(rank_correlation_weights, file = "data/analysis/rankCorrelation.csv")
write.csv(information_gain_weights, file = "data/analysis/informationGain.csv")
write.csv(gain_ratio_weights, file = "data/analysis/gainRatio.csv")
write.csv(symmetrical_uncertainty_weights, file = "data/analysis/symmetricalUncertainty.csv")
write.csv(oneR_weights, file = "data/analysis/oneR.csv")