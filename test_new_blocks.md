# 新增积木测试

## 测试用例

### 1. 管道操作符 (pipe_operator)
**积木参数:**
- left: `data`
- right: `filter(x > 10)`

**期望生成代码:**
```r
data %>% filter(x > 10)
```

### 2. 索引访问 (index_access)
**积木参数:**
- object: `data`
- field: `column_name`

**期望生成代码:**
```r
data$column_name
```

### 3. 算术表达式 (arithmetic_expr)
**积木参数:**
- expression: `90 - 360 * (x - 0.5) / n`

**期望生成代码:**
```r
90 - 360 * (x - 0.5) / n
```

### 4. 数组子集 (subset_access)
**积木参数:**
- object: `data`
- rows: `1:10`
- cols: `2:5`

**期望生成代码:**
```r
data[1:10, 2:5]
```

**单维度访问:**
- object: `vector`
- rows: `c(1, 3, 5)`
- cols: (空)

**期望生成代码:**
```r
vector[c(1, 3, 5)]
```

### 5. 负索引 (negative_index)
**积木参数:**
- indices: `1, 2`

**期望生成代码:**
```r
-c(1, 2)
```

### 6. 命名空间调用 (namespace_call)
**积木参数:**
- package: `ggplot2`
- function: `annotate`
- args: `"text", x=1, y=2, label="Hello"`

**期望生成代码:**
```r
ggplot2::annotate("text", x=1, y=2, label="Hello")
```

## 圆形堆叠条形图中的应用场景

### 场景1: 管道链数据转换
```r
data <- data %>% gather(key = "observation", value="value", -c(1,2))
```
可以拆解为：
1. **ASSIGN** 积木
   - variable: `data`
   - value: (管道链)
2. **PIPE_OPERATOR** 积木（嵌套）
   - left: `data`
   - right: `gather(key = "observation", value="value", -c(1,2))`

### 场景2: 索引访问
```r
nObsType <- nlevels(as.factor(data$observation))
```
包含：
- **INDEX_ACCESS**: `data$observation`

### 场景3: 算术表达式
```r
angle <- 90 - 360 * (label_data$id-0.5) /number_of_bar
```
包含：
- **ARITHMETIC_EXPR**: `90 - 360 * (label_data$id-0.5) /number_of_bar`
- 嵌套 **INDEX_ACCESS**: `label_data$id`

### 场景4: 数组子集
```r
grid_data$end <- grid_data$end[ c( nrow(grid_data), 1:nrow(grid_data)-1)] + 1
```
包含：
- **SUBSET_ACCESS**: `grid_data$end[c(nrow(grid_data), 1:nrow(grid_data)-1)]`

### 场景5: 命名空间调用
```r
ggplot2::annotate("text", x = rep(max(data$id),5), y = c(0, 50, 100, 150, 200), ...)
```
包含：
- **NAMESPACE_CALL**: `ggplot2::annotate(...)`

## 当前解析器行为

**当前状态**: 解析器能够识别这些语法模式，但会将它们作为**表达式字符串**嵌入到其他积木中，而不是创建独立的积木。

例如：
- `data$column` 会作为字符串出现在参数中
- 管道链 `data %>% filter(...)` 会被整体当作一个表达式

**这是合理的设计**，因为：
1. 这些通常是表达式的一部分，而不是独立的语句
2. 创建过于细粒度的积木会使积木图变得过于复杂
3. 新积木主要用于用户手动构建代码

## 建议的使用方式

1. **解析现有代码**: 保持当前行为，将复杂表达式作为字符串
2. **手动构建代码**: 用户可以使用新积木来组合构建复杂表达式
3. **混合方式**: 对于简单场景使用新积木，复杂场景使用 `custom_code` 积木

