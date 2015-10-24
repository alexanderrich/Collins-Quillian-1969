library("ggplot2")
library("dplyr")

trialdata <- read.csv("participants.csv")
trialdata %>% filter(hit) %>%
  filter(truth) %>%
  group_by(level, type) %>%
  summarize(rt=mean(rt)) %>%
  ggplot(aes(x=level, y=rt, group=type)) +
  geom_line()
