# load libraries
library("dplyr")
library("ggplot2")

# load data from the web
trialdata = read.csv("http://gureckislab.org/courses/fall15/lhc/materials/lab2-fall2015-participants.csv")

# OR, load data from your computer (after downloading it and moving to the correct folder)
trialdata = read.csv("lab2-fall2015-participants.csv")

# make sure reaction times stored as number, not int (prevents possible error later)
trialdata$rt = as.numeric(trialdata$rt)

# group data by subject and find mean correct for each
participant_perf = trialdata %>% group_by(uniqueid) %>%
  summarize(performance=mean(hit))

# some example calculations:
# mean proportion correct
mean_prop_correct = mean(participant_perf$performance)
# mean number wrong
(1 - mean_prop_correct) * 144

# histogram of all data
hist(trialdata$rt, breaks=seq(0, max(trialdata$rt)+100, 100))

# histogram of rt's less than 6000ms
low_rts = trialdata %>% filter(rt < 6000)
hist(low_rts$rt, breaks=seq(0, max(low_rts$rt)+100, 100))

# median rt's for each participant, sentence type, and sentence level
median_rts = trialdata %>% filter(truth==TRUE)%>% # only use true sentences
  filter(hit==TRUE) %>% # only use sentences where participant was correct
  group_by(uniqueid, type, level) %>% # group by the three factors
  summarize(med_rt=median(rt)) # find median rt in each group


# plot median rt's in a histogram, with facet for each type and level
ggplot(median_rts, aes(x=med_rt)) + geom_histogram(binwidth=200) + facet_grid(type~level)

# group individual medians by type and level and take mean and standard
# error of medians
rt_summary = median_rts %>% group_by(type, level) %>%
  summarize(group_mean=mean(med_rt), group_se=sd(med_rt)/sqrt(n()))

# plot mean and standard error of medians by group and level
ggplot(rt_summary, aes(x=level, y=group_mean, color=type)) + geom_line(aes(group=type)) +
  geom_pointrange(aes(ymin=group_mean-group_se, ymax=group_mean+group_se))


# run anova and print summary
fit = aov(med_rt ~ factor(type)*factor(level)+Error(uniqueid), data=median_rts)
summary(fit)

# post-hoc bonferroni corrected comparisons
a=t.test(p0_median_rt$med_rt, p1_median_rt$med_rt,paired=T,alternative="two.sided")
p.adjust(a$p.value,method="bonferroni",n=6)
a=t.test(p1_median_rt$med_rt, p2_median_rt$med_rt,paired=T,alternative="two.sided")
p.adjust(a$p.value,method="bonferroni",n=6)
a=t.test(p1_median_rt$med_rt, p2_median_rt$med_rt,paired=T,alternative="two.sided")
p.adjust(a$p.value,method="bonferroni",n=6)

a=t.test(s0_median_rt$med_rt, s1_median_rt$med_rt,paired=T,alternative="two.sided")
p.adjust(a$p.value,method="bonferroni",n=6)
a=t.test(s1_median_rt$med_rt, s2_median_rt$med_rt,paired=T,alternative="two.sided")
p.adjust(a$p.value,method="bonferroni",n=6)
a=t.test(s1_median_rt$med_rt, s2_median_rt$med_rt,paired=T,alternative="two.sided")
p.adjust(a$p.value,method="bonferroni",n=6)

