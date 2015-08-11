sensorPrefix <- '_pearl-AmbTemp'
basePath <- "~/Dropbox/Apps/PearlDAQ/"
colNames <- c('Time', 'Event', 'Device', 'Mins', 'Temp', 'Volts')
timeFormat <- "%Y-%m-%d %H:%M:%S +00:00"

setForTest <- function() {
   .GlobalEnv$sensorPrefix <- "_test-BeanSensor"
   .GlobalEnv$basePath <- "~/Dropbox/Apps/PearlDAQ/"
   .GlobalEnv$filename <- "raspberrypi*"
   .GlobalEnv$timeFormat <- "%Y-%m-%d %H:%M:%S +00:00"
}

setForArray <- function() {
   .GlobalEnv$sensorPrefix <- "_pearl-BeanSensor"
   .GlobalEnv$basePath <- "~/PearlDAQ/"
   .GlobalEnv$filename <- "propst-pi-02_2015-01*"
   .GlobalEnv$timeFormat <- "%Y-%m-%d %H:%M:%S -07:00"
}

datafiles <- function(filePattern=filename) {
   Sys.glob(paste(basePath, filePattern, sep=""))
}

readData <- function() {
   data <- lapply(datafiles(), read.csv, header=F, col.names=colNames)
   data <- lapply(data, function(x) x[x$Event == 'Data',])
   data <- do.call(rbind, data)
   data[1] <- lapply(data[1], strptime, format=timeFormat)
   data[4] <- as.numeric(as.character(data[[4]]))
   return(data)
}

buildSensor <- function(sensorNum) {
   paste(sensorPrefix,formatC(sensorNum, width=2, flag='0'), sep="")
}

devData <- function(sensors, param=NULL) {
   data <- readData()
   sensors <- sapply(sensors, buildSensor)
   data <- lapply(sensors, function(x) data[data$Device == x,c('Time',param)])
   return(data)
}

plotVolts <- function(plotData) {
   minTimes <- lapply(plotData, function(x) as.POSIXlt(min(x[1]$Time)))
   minTime <- min(do.call(c, minTimes))
   maxTimes <- lapply(plotData, function(x) as.POSIXlt(max(x[1]$Time)))
   maxTime <- max(do.call(c, maxTimes))
   plot(1, xlim=as.POSIXct(c(minTime, maxTime)), ylim=c(1.9,3.3),
      type='l', xaxt='n')
   # plot(1, ylim=c(1.9,3.3),type='l', xaxt='n')
   axis.POSIXct(1, x=c(minTime, maxTime), format="%Y-%m-%d", las=2,
      cex.axis=0.75)
   lapply(plotData, function(x) lines(x$Time, x$Volts))
}

sumTest <- function(deadBat=1.95) {
   setForTest()
   sensorData <- devData(1:2, 'Volts')
   plotVolts(sensorData)
   allData <- readData()
   correlation <- cor(as.numeric(allData$Mins), allData$Volts)
   fit <- lm(allData$Volts ~ as.numeric(allData$Mins))
   days <- (fit$coefficients[[1]]-deadBat)/fit$coefficients[[2]]/60/24
   print(paste("Projected Days:", days))
   print(paste("Correlation   :", correlation))
}

sumTest2 <- function(deadBat=1.95) {
   setForTest()
   sensorData <- devData(1:2, 'Volts')
   allData <- readData()
   correlation <- cor(as.numeric(allData$Mins), log(allData$Volts))
   fit <- lm(log(allData$Volts) ~ as.numeric(allData$Mins))
   days <- (log(fit$coefficients[[1]])-log(deadBat)-fit$coefficients[[1]])/ 
      fit$coefficients[[2]]/60/24
   print(paste("Projected Days:", days))
   print(paste("Correlation   :", correlation))
   print(fit)
   projTime <- as.POSIXlt(seq(as.numeric(min(allData$Time)),as.numeric(
      max(allData$Time)),by=60),origin="1970-01-01")
   projVolts <- exp(fit$coefficients[[1]])*exp(fit$coefficients[[2]])^c(1:
      length(projTime))
#   projVolts <- exp(fit$coefficients[[1]]+fit$coefficients[[2]]*c(1:
#      length(projTime)))
   projData <- data.frame(projTime, projVolts)
   names(projData) <- c('Time', 'Volts')
   row.names(projData) <- 1:nrow(projData)
   sensorData[[3]] <- projData
   plotVolts(sensorData)
}
