library("ggplot2")
library("dplyr")

trialdata <- read.csv("participants.csv")

indiv_perf <- trialdata %>% group_by(uniqueid) %>%
  summarize(rt=mean(rt), performance=mean(hit))

indiv_perf %>%
  ggplot(aes(rt, performance)) + geom_point()

outliers <- indiv_perf %>% filter(performance < .85) %>% .$uniqueid

trialdata %>% filter(hit) %>%
  filter(!(uniqueid %in% outliers)) %>%
  filter(truth) %>%
  group_by(level, type) %>%
  summarize(rt=mean(rt)) %>%
  ggplot(aes(x=level, y=rt, group=type)) +
  geom_line()
