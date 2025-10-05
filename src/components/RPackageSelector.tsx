import React, { useState, useEffect } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { webRRunner } from '../core/rRunner/webRRunner';

// 常用R包列表及其描述
const COMMON_R_PACKAGES = [
  { name: 'ggplot2', description: '强大的数据可视化包（必需）', required: true, category: 'ggplot2' },
  
  // ggplot2 扩展包
  { name: 'ggstream', description: '流图（Stream Graph）', category: 'ggplot2' },
  { name: 'ggridges', description: '山脊图（Ridge Plot）', category: 'ggplot2' },
  { name: 'ggalluvial', description: '冲积图（Alluvial Diagram）', category: 'ggplot2' },
  { name: 'ggforce', description: 'ggplot2 增强功能', category: 'ggplot2' },
  { name: 'ggrepel', description: '自动避让的文本标签', category: 'ggplot2' },
  { name: 'gganimate', description: '创建动画图表', category: 'ggplot2' },
  { name: 'ggpubr', description: '出版级图表', category: 'ggplot2' },
  { name: 'ggthemes', description: '额外的主题样式', category: 'ggplot2' },
  { name: 'ggcorrplot', description: '相关性热图', category: 'ggplot2' },
  { name: 'ggtree', description: '系统发育树可视化', category: 'ggplot2' },
  { name: 'ggraph', description: '网络图和树形图', category: 'ggplot2' },
  { name: 'patchwork', description: '组合多个 ggplot 图表', category: 'ggplot2' },
  { name: 'cowplot', description: '出版级图表主题和布局', category: 'ggplot2' },
  { name: 'gridExtra', description: '图表网格布局', category: 'ggplot2' },
  
  // 配色方案
  { name: 'viridis', description: '色盲友好的配色方案', category: 'color' },
  { name: 'RColorBrewer', description: 'ColorBrewer 配色方案', category: 'color' },
  { name: 'scales', description: '坐标轴刻度和标签格式化', category: 'color' },
  { name: 'ggsci', description: '科学期刊配色方案', category: 'color' },
  { name: 'wesanderson', description: 'Wes Anderson 电影配色', category: 'color' },
  
  // tidyverse 核心包
  { name: 'dplyr', description: '数据处理和转换', category: 'tidyverse' },
  { name: 'tidyr', description: '数据整理和重塑（包含 gather 等）', category: 'tidyverse' },
  { name: 'readr', description: '快速读取数据文件', category: 'tidyverse' },
  { name: 'tibble', description: '现代化的数据框', category: 'tidyverse' },
  { name: 'stringr', description: '字符串处理', category: 'tidyverse' },
  { name: 'forcats', description: '因子处理', category: 'tidyverse' },
  { name: 'purrr', description: '函数式编程工具', category: 'tidyverse' },
  { name: 'lubridate', description: '日期时间处理', category: 'tidyverse' },
  
  // 网络图和流程图
  { name: 'networkD3', description: '交互式网络图和桑基图', category: 'network' },
  { name: 'igraph', description: '网络分析和可视化', category: 'network' },
  { name: 'visNetwork', description: '交互式网络可视化', category: 'network' },
  { name: 'DiagrammeR', description: '流程图和图表', category: 'network' },
  
  // 地理空间可视化
  { name: 'sf', description: '空间数据处理', category: 'geo' },
  { name: 'leaflet', description: '交互式地图', category: 'geo' },
  { name: 'maps', description: '地图数据', category: 'geo' },
  { name: 'mapdata', description: '额外地图数据', category: 'geo' },
  { name: 'mapproj', description: '地图投影', category: 'geo' },
  
  // 交互式可视化和表格
  { name: 'plotly', description: '交互式图表', category: 'interactive' },
  { name: 'DT', description: '交互式数据表格', category: 'interactive' },
  { name: 'htmlwidgets', description: 'HTML 小部件框架', category: 'interactive' },
  { name: 'highcharter', description: 'Highcharts 交互式图表', category: 'interactive' },
  
  // 时间序列分析
  { name: 'zoo', description: '时间序列处理', category: 'timeseries' },
  { name: 'xts', description: '可扩展时间序列', category: 'timeseries' },
  { name: 'forecast', description: '时间序列预测', category: 'timeseries' },
  { name: 'tseries', description: '时间序列分析', category: 'timeseries' },
  
  // 统计建模
  { name: 'car', description: '回归分析辅助工具', category: 'stats' },
  { name: 'lme4', description: '线性混合效应模型', category: 'stats' },
  { name: 'nlme', description: '非线性混合效应模型', category: 'stats' },
  { name: 'survival', description: '生存分析', category: 'stats' },
  { name: 'MASS', description: '统计函数集合', category: 'stats' },
  { name: 'caret', description: '机器学习训练工具', category: 'stats' },
  
  // 专业可视化
  { name: 'circlize', description: '圆形布局可视化', category: 'specialized' },
  { name: 'vcd', description: '分类数据可视化', category: 'specialized' },
  { name: 'treemap', description: '树状图', category: 'specialized' },
  { name: 'wordcloud', description: '词云图', category: 'specialized' },
  { name: 'corrplot', description: '相关系数可视化', category: 'specialized' },
  
  // 数据处理和转换
  { name: 'jsonlite', description: 'JSON 数据处理', category: 'data' },
  { name: 'reshape2', description: '数据重塑（包含 melt/cast）', category: 'data' },
  { name: 'data.table', description: '高性能数据处理', category: 'data' },
  { name: 'tidytext', description: '文本数据处理', category: 'data' },
  { name: 'haven', description: '读取 SPSS/Stata/SAS 数据', category: 'data' },
  { name: 'readxl', description: '读取 Excel 文件', category: 'data' },
  { name: 'xml2', description: 'XML 数据处理', category: 'data' },
  
  // 字符串和文本处理
  { name: 'stringi', description: '高级字符串处理', category: 'text' },
  { name: 'glue', description: '字符串插值', category: 'text' },
  { name: 'tm', description: '文本挖掘', category: 'text' },
  
  // 其他实用工具
  { name: 'base64enc', description: 'Base64 编码（图表导出需要）', category: 'utils' },
  { name: 'knitr', description: '动态报告生成', category: 'utils' },
  { name: 'rmarkdown', description: 'R Markdown 文档', category: 'utils' },
  { name: 'shiny', description: '交互式 Web 应用', category: 'utils' },
];

interface RPackageSelectorProps {
  onClose?: () => void;
}

const RPackageSelector: React.FC<RPackageSelectorProps> = ({ onClose }) => {
  const { selectedPackages, setSelectedPackages } = useBlockStore();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedPackages);
  const [customPackages, setCustomPackages] = useState<Array<{name: string, description: string}>>([]);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageDesc, setNewPackageDesc] = useState('');
  const [cacheInfo, setCacheInfo] = useState<{ cachedPackages: string[], hasCachedData: boolean }>({ 
    cachedPackages: [], 
    hasCachedData: false 
  });

  // 加载缓存信息
  useEffect(() => {
    const info = webRRunner.getCacheInfo();
    setCacheInfo(info);
  }, []);

  // 切换单个包
  const togglePackage = (packageName: string) => {
    const pkg = COMMON_R_PACKAGES.find(p => p.name === packageName);
    if (pkg?.required) return; // 必需的包不能取消选择

    if (localSelection.includes(packageName)) {
      setLocalSelection(localSelection.filter(p => p !== packageName));
    } else {
      setLocalSelection([...localSelection, packageName]);
    }
  };

  // 添加自定义包
  const addCustomPackage = () => {
    if (!newPackageName.trim()) return;
    
    const exists = [...COMMON_R_PACKAGES, ...customPackages].some(
      pkg => pkg.name.toLowerCase() === newPackageName.trim().toLowerCase()
    );
    
    if (exists) {
      alert('该包已存在！');
      return;
    }
    
    const newPkg = {
      name: newPackageName.trim(),
      description: newPackageDesc.trim() || '自定义包'
    };
    
    setCustomPackages([...customPackages, newPkg]);
    setLocalSelection([...localSelection, newPkg.name]);
    setNewPackageName('');
    setNewPackageDesc('');
  };

  // 删除自定义包
  const removeCustomPackage = (packageName: string) => {
    setCustomPackages(customPackages.filter(pkg => pkg.name !== packageName));
    setLocalSelection(localSelection.filter(p => p !== packageName));
  };

  // 全选
  const selectAll = () => {
    const allPackages = [...COMMON_R_PACKAGES.map(pkg => pkg.name), ...customPackages.map(pkg => pkg.name)];
    setLocalSelection(allPackages);
  };

  // 取消全选（保留必需的包）
  const deselectAll = () => {
    setLocalSelection(COMMON_R_PACKAGES.filter(pkg => pkg.required).map(pkg => pkg.name));
  };

  // 选择 ggplot2 扩展系列
  const selectGgplot2Extensions = () => {
    const ggplot2Packages = COMMON_R_PACKAGES
      .filter(pkg => pkg.category === 'ggplot2')
      .map(pkg => pkg.name);
    setLocalSelection([...new Set([...localSelection, ...ggplot2Packages])]);
  };

  // 选择 tidyverse 系列
  const selectTidyverse = () => {
    const tidyversePackages = COMMON_R_PACKAGES
      .filter(pkg => pkg.category === 'tidyverse' || pkg.required)
      .map(pkg => pkg.name);
    setLocalSelection([...new Set([...localSelection, ...tidyversePackages])]);
  };

  // 选择推荐的包（包括运行示例所需的包）
  const selectRecommended = () => {
    const recommended = ['ggplot2', 'dplyr', 'tidyr', 'viridis', 'scales', 'RColorBrewer', 'ggstream', 'ggalluvial', 'networkD3'];
    setLocalSelection([...new Set([...localSelection, ...recommended])]);
  };

  // 确认选择
  const handleConfirm = () => {
    setSelectedPackages(localSelection);
    if (onClose) {
      onClose();
    }
  };

  // 清除缓存
  const handleClearCache = () => {
    if (confirm('确定要清除所有已缓存的 R 包吗？\n下次启动时需要重新下载安装。')) {
      webRRunner.clearCache();
      setCacheInfo({ cachedPackages: [], hasCachedData: false });
      alert('✅ 缓存已清除！下次启动将重新下载包。');
    }
  };

  // 按分类分组包
  const requiredPackages = COMMON_R_PACKAGES.filter(pkg => pkg.required);
  const ggplot2Packages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'ggplot2' && !pkg.required);
  const colorPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'color');
  const tidyversePackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'tidyverse');
  const networkPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'network');
  const geoPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'geo');
  const interactivePackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'interactive');
  const timeseriesPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'timeseries');
  const statsPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'stats');
  const specializedPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'specialized');
  const dataPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'data');
  const textPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'text');
  const utilsPackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'utils');

  return (
    <div className="r-package-selector">
      <div className="package-selector-header">
        <h3>📦 选择要安装的 R 包</h3>
        <p className="package-selector-subtitle">
          选择你需要的包，首次安装可能需要几分钟时间
        </p>
        
        {/* 缓存信息提示 */}
        {cacheInfo.hasCachedData && (
          <div className="cache-info-banner">
            <div style={{ flex: 1 }}>
              <strong>💾 缓存状态：</strong> 已缓存 {cacheInfo.cachedPackages.length} 个包
              <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#059669' }}>
                {cacheInfo.cachedPackages.slice(0, 5).join(', ')}
                {cacheInfo.cachedPackages.length > 5 && ` 等 ${cacheInfo.cachedPackages.length} 个包`}
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#6b7280' }}>
                ⚡ 这些包将快速加载，无需重新下载
              </div>
            </div>
            <button 
              className="clear-cache-btn"
              onClick={handleClearCache}
              title="清除缓存后，下次启动需要重新下载"
            >
              🗑️ 清除缓存
            </button>
          </div>
        )}
        
        <div className="package-selector-tip">
          💡 提示：
          <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
            <li>使用 <code>library(tidyverse)</code>？请选择 Tidyverse 系列包</li>
            <li>绘制桑基图？请选择 <code>networkD3</code> 包</li>
            <li>绘制流图？请选择 <code>ggstream</code> 包</li>
            <li>需要导出图表？<code>base64enc</code> 已在推荐包中</li>
            <li>⚡ <strong>新功能：</strong>已安装的包会自动缓存，重启后快速加载！</li>
          </ul>
        </div>
      </div>

      <div className="package-selector-actions">
        <button 
          className="selector-btn selector-btn-recommended" 
          onClick={selectRecommended}
          title="选择运行大多数示例所需的核心包"
        >
          ⭐ 推荐包
        </button>
        <button 
          className="selector-btn selector-btn-ggplot2" 
          onClick={selectGgplot2Extensions}
          title="选择所有 ggplot2 扩展包"
        >
          📊 ggplot2 扩展
        </button>
        <button 
          className="selector-btn selector-btn-tidyverse" 
          onClick={selectTidyverse}
        >
          🔧 Tidyverse
        </button>
        <button 
          className="selector-btn selector-btn-primary" 
          onClick={selectAll}
        >
          ✓ 全选
        </button>
        <button 
          className="selector-btn" 
          onClick={deselectAll}
        >
          ✗ 取消全选
        </button>
      </div>

      <div className="package-selector-stats">
        已选择: <strong>{localSelection.length}</strong> 个包
      </div>

      <div className="package-list">
        {/* 必需的包 */}
        <div className="package-category">
          <h4 className="category-title">✅ 必需包</h4>
          {requiredPackages.map(pkg => (
            <label 
              key={pkg.name} 
              className="package-item package-item-required"
            >
              <input
                type="checkbox"
                checked={true}
                disabled={true}
              />
              <div className="package-info">
                <span className="package-name">{pkg.name}</span>
                <span className="package-desc">{pkg.description}</span>
              </div>
            </label>
          ))}
        </div>

        {/* ggplot2 扩展包 */}
        <div className="package-category">
          <h4 className="category-title">📊 ggplot2 扩展包</h4>
          {ggplot2Packages.map(pkg => (
            <label 
              key={pkg.name} 
              className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={localSelection.includes(pkg.name)}
                onChange={() => togglePackage(pkg.name)}
              />
              <div className="package-info">
                <span className="package-name">{pkg.name}</span>
                <span className="package-desc">{pkg.description}</span>
              </div>
            </label>
          ))}
        </div>

        {/* 配色方案 */}
        <div className="package-category">
          <h4 className="category-title">🎨 配色方案</h4>
          {colorPackages.map(pkg => (
            <label 
              key={pkg.name} 
              className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={localSelection.includes(pkg.name)}
                onChange={() => togglePackage(pkg.name)}
              />
              <div className="package-info">
                <span className="package-name">{pkg.name}</span>
                <span className="package-desc">{pkg.description}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Tidyverse 系列 */}
        <div className="package-category">
          <h4 className="category-title">🔧 Tidyverse 系列</h4>
          {tidyversePackages.map(pkg => (
            <label 
              key={pkg.name} 
              className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={localSelection.includes(pkg.name)}
                onChange={() => togglePackage(pkg.name)}
              />
              <div className="package-info">
                <span className="package-name">{pkg.name}</span>
                <span className="package-desc">{pkg.description}</span>
              </div>
            </label>
          ))}
        </div>

        {/* 网络图和流程图 */}
        {networkPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">🕸️ 网络图和流程图</h4>
            {networkPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 地理空间可视化 */}
        {geoPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">🗺️ 地理空间可视化</h4>
            {geoPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 交互式可视化 */}
        {interactivePackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">⚡ 交互式可视化</h4>
            {interactivePackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 时间序列分析 */}
        {timeseriesPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">📈 时间序列分析</h4>
            {timeseriesPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 统计建模 */}
        {statsPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">📊 统计建模</h4>
            {statsPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 专业可视化 */}
        {specializedPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">🎯 专业可视化</h4>
            {specializedPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 数据处理和转换 */}
        {dataPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">💾 数据处理和转换</h4>
            {dataPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 字符串和文本处理 */}
        {textPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">📝 字符串和文本</h4>
            {textPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 其他实用工具 */}
        {utilsPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">🔧 实用工具</h4>
            {utilsPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 自定义包 */}
        {customPackages.length > 0 && (
          <div className="package-category">
            <h4 className="category-title">🔖 自定义包</h4>
            {customPackages.map(pkg => (
              <label 
                key={pkg.name} 
                className={`package-item ${localSelection.includes(pkg.name) ? 'package-item-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={localSelection.includes(pkg.name)}
                  onChange={() => togglePackage(pkg.name)}
                />
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-desc">{pkg.description}</span>
                </div>
                <button
                  className="remove-custom-pkg-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    removeCustomPackage(pkg.name);
                  }}
                  title="删除自定义包"
                >
                  ✕
                </button>
              </label>
            ))}
          </div>
        )}

        {/* 添加自定义包 */}
        <div className="package-category">
          <h4 className="category-title">➕ 添加自定义包</h4>
          <div className="add-custom-package">
            <input
              type="text"
              className="custom-pkg-input"
              placeholder="包名（如：ggstream）"
              value={newPackageName}
              onChange={(e) => setNewPackageName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomPackage()}
            />
            <input
              type="text"
              className="custom-pkg-input"
              placeholder="描述（可选）"
              value={newPackageDesc}
              onChange={(e) => setNewPackageDesc(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomPackage()}
            />
            <button
              className="add-custom-pkg-btn"
              onClick={addCustomPackage}
              disabled={!newPackageName.trim()}
            >
              添加
            </button>
          </div>
        </div>
      </div>

      <div className="package-selector-footer">
        <button 
          className="selector-btn selector-btn-confirm" 
          onClick={handleConfirm}
        >
          确认并开始安装
        </button>
      </div>

      <style>{`
        .r-package-selector {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 700px;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .package-selector-header {
          margin-bottom: 20px;
          text-align: center;
        }

        .package-selector-header h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .package-selector-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .package-selector-tip {
          margin-top: 12px;
          padding: 12px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #92400e;
          text-align: left;
        }

        .package-selector-tip code {
          background: #fed7aa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.85rem;
        }

        .package-selector-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .selector-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .selector-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .selector-btn-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .selector-btn-primary:hover {
          background: #2563eb;
        }

        .selector-btn-recommended {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
          font-weight: 600;
        }

        .selector-btn-recommended:hover {
          background: #d97706;
        }

        .selector-btn-ggplot2 {
          background: #06b6d4;
          color: white;
          border-color: #06b6d4;
        }

        .selector-btn-ggplot2:hover {
          background: #0891b2;
        }

        .selector-btn-tidyverse {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
        }

        .selector-btn-tidyverse:hover {
          background: #7c3aed;
        }

        .selector-btn-confirm {
          width: 100%;
          padding: 12px;
          background: #10b981;
          color: white;
          border: none;
          font-weight: 600;
          font-size: 1rem;
        }

        .selector-btn-confirm:hover {
          background: #059669;
        }

        .package-selector-stats {
          padding: 12px;
          background: #f0f9ff;
          border-radius: 6px;
          margin-bottom: 16px;
          text-align: center;
          color: #1e40af;
        }

        .package-list {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .package-category {
          margin-bottom: 24px;
        }

        .package-category:last-child {
          margin-bottom: 0;
        }

        .category-title {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #4b5563;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .package-item {
          display: flex;
          align-items: center;
          padding: 10px;
          margin-bottom: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .package-item:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .package-item-selected {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .package-item-required {
          background: #fef3c7;
          border-color: #fbbf24;
          cursor: not-allowed;
          opacity: 0.8;
        }

        .package-item input[type="checkbox"] {
          margin-right: 12px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .package-item-required input[type="checkbox"] {
          cursor: not-allowed;
        }

        .package-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .package-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .package-desc {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .package-selector-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }

        .add-custom-package {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
        }

        .custom-pkg-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .custom-pkg-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .add-custom-pkg-btn {
          padding: 8px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .add-custom-pkg-btn:hover:not(:disabled) {
          background: #059669;
        }

        .add-custom-pkg-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .remove-custom-pkg-btn {
          padding: 4px 8px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          margin-left: 8px;
        }

        .remove-custom-pkg-btn:hover {
          background: #dc2626;
        }

        .package-item {
          position: relative;
        }

        .cache-info-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          padding: 12px;
          background: #d1fae5;
          border-left: 4px solid #10b981;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #065f46;
        }

        .clear-cache-btn {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .clear-cache-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </div>
  );
};

export default RPackageSelector;

