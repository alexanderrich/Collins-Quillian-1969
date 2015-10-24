library("dplyr")
library("RSQLite")
library("jsonlite")

my_db <- src_sqlite("participants.db")
table <- collect(tbl(my_db, "turkdemo"))

datastrings <- table$datastring
datastrings_json <- sapply(datastrings, fromJSON, simplify=F)

trialdata <- sapply(datastrings_json,
                    function (x) {x[["data"]][["trialdata"]]},
                    simplify=F)
names(trialdata) <- NULL
trialdata <- do.call(rbind, trialdata)

trialdata <- trialdata %>% filter(is.na(phase))
trialdata$phase <- NULL
trialdata$templates <- NULL
trialdata$action <- NULL
trialdata$template <- NULL
trialdata$indexOf <- NULL
trialdata$viewTime <- NULL

write.csv(trialdata, file="participants.csv")


