# 圆形堆叠条形图代码分析

## 代码中使用的R语法特性

### 1. **管道操作符 `%>%`** (tidyverse)
```r
data <- data %>% gather(key = "observation", value="value", -c(1,2))
data <- data %>% arrange(group, individual)
label_data <- data %>% group_by(id, individual) %>% summarize(tot=sum(value))
base_data <- data %>% group_by(group) %>% summarize(start=min(id), end=max(id) - empty_bar) %>% rowwise() %>% mutate(title=mean(c(start, end)))
```
**状态**: ❌ 缺少专门的管道积木

### 2. **数据框索引/访问 `$`**
```r
data$observation
data$group
label_data$id
label_data$angle
grid_data$end
```
**状态**: ❌ 缺少索引访问积木

### 3. **向量负索引 `-c(1,2)`**
```r
gather(key = "observation", value="value", -c(1,2))
```
**状态**: ❌ 缺少负索引语法支持

### 4. **复杂的算术表达式**
```r
angle <- 90 - 360 * (label_data$id-0.5) /number_of_bar
grid_data$end <- grid_data$end[ c( nrow(grid_data), 1:nrow(grid_data)-1)] + 1
```
**状态**: ❌ 缺少算术表达式积木

### 5. **ifelse 条件表达式**
```r
label_data$hjust <- ifelse( angle < -90, 1, 0)
label_data$angle <- ifelse(angle < -90, angle+180, angle)
```
**状态**: ✅ 有 `ifelse` 积木定义，但可能解析不正确

### 6. **数组子集访问 `[]`**
```r
grid_data$end[ c( nrow(grid_data), 1:nrow(grid_data)-1)]
grid_data[-1,]
```
**状态**: ❌ 缺少数组子集积木

### 7. **`as.factor()` 函数**
```r
nObsType <- nlevels(as.factor(data$observation))
nlevels(data$group)
```
**状态**: ✅ 有 `as_factor` 积木，但名称不匹配（R中是 `as.factor`）

### 8. **`theme()` 的复杂参数**
```r
theme(
  legend.position = "none",
  axis.text = element_blank(),
  axis.title = element_blank(),
  panel.grid = element_blank(),
  plot.margin = unit(rep(-1,4), "cm") 
)
```
**状态**: ⚠️ 有 `theme`, `element_blank`, `unit` 积木，但解析可能不完整

### 9. **`geom_text` 的 `angle` 参数引用外部变量**
```r
geom_text(data=label_data, aes(x=id, y=tot+10, label=individual, hjust=hjust), 
          color="black", fontface="bold",alpha=0.6, size=5, 
          angle= label_data$angle, inherit.aes = FALSE )
```
**状态**: ⚠️ `angle` 参数引用变量，可能解析不正确

### 10. **`ggplot2::annotate()` 完全限定名**
```r
ggplot2::annotate("text", x = rep(max(data$id),5), ...)
```
**状态**: ⚠️ 命名空间前缀可能解析不正确

## 关键问题总结

### 优先级1: 核心缺失
1. **管道操作符** `%>%` - tidyverse的核心
2. **索引访问** `$` - R数据框的基本操作
3. **算术表达式** - 数学计算

### 优先级2: 高级特性
4. **数组子集** `[]` - 向量/数组操作
5. **负索引** `-c(...)` - 排除列
6. **命名空间** `package::function` - 完全限定名

### 优先级3: 参数引用
7. **参数中的变量引用** - 如 `angle = label_data$angle`
8. **参数中的函数调用** - 如 `x = rep(max(data$id),5)`

## 建议

### 短期方案
对于复杂的表达式，使用 `custom_code` 积木作为兜底方案

### 长期方案
1. 添加管道操作符积木（连接多个数据操作）
2. 添加索引访问积木 (`data$column`)
3. 添加算术表达式积木 (支持 `+`, `-`, `*`, `/`, 括号等)
4. 改进解析器，识别更多复杂模式

