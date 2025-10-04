import React, { useState } from 'react';
import { useBlockStore } from '../store/useBlockStore';

// 常用R包列表及其描述
const COMMON_R_PACKAGES = [
  { name: 'ggplot2', description: '强大的数据可视化包（必需）', required: true },
  { name: 'dplyr', description: '数据处理和转换（tidyverse核心包）', category: 'tidyverse' },
  { name: 'tidyr', description: '数据整理和重塑（tidyverse核心包，包含gather等）', category: 'tidyverse' },
  { name: 'readr', description: '快速读取数据文件', category: 'tidyverse' },
  { name: 'tibble', description: '现代化的数据框', category: 'tidyverse' },
  { name: 'stringr', description: '字符串处理', category: 'tidyverse' },
  { name: 'forcats', description: '因子处理', category: 'tidyverse' },
  { name: 'purrr', description: '函数式编程工具', category: 'tidyverse' },
  { name: 'viridis', description: '色盲友好的配色方案' },
  { name: 'scales', description: '坐标轴刻度和标签格式化' },
  { name: 'RColorBrewer', description: '配色方案' },
  { name: 'gridExtra', description: '图表网格布局' },
  { name: 'cowplot', description: '出版级图表主题' },
  { name: 'ggrepel', description: '自动避让的文本标签' },
  { name: 'gganimate', description: '创建动画图表' },
  { name: 'plotly', description: '交互式图表' },
  { name: 'lubridate', description: '日期时间处理' },
  { name: 'jsonlite', description: 'JSON数据处理' },
];

interface RPackageSelectorProps {
  onClose?: () => void;
}

const RPackageSelector: React.FC<RPackageSelectorProps> = ({ onClose }) => {
  const { selectedPackages, setSelectedPackages } = useBlockStore();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedPackages);

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

  // 全选
  const selectAll = () => {
    setLocalSelection(COMMON_R_PACKAGES.map(pkg => pkg.name));
  };

  // 取消全选（保留必需的包）
  const deselectAll = () => {
    setLocalSelection(COMMON_R_PACKAGES.filter(pkg => pkg.required).map(pkg => pkg.name));
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
    const recommended = ['ggplot2', 'dplyr', 'tidyr', 'viridis', 'scales'];
    setLocalSelection([...new Set([...localSelection, ...recommended])]);
  };

  // 确认选择
  const handleConfirm = () => {
    setSelectedPackages(localSelection);
    if (onClose) {
      onClose();
    }
  };

  // 按分类分组包
  const tidyversePackages = COMMON_R_PACKAGES.filter(pkg => pkg.category === 'tidyverse');
  const otherPackages = COMMON_R_PACKAGES.filter(pkg => !pkg.category && !pkg.required);
  const requiredPackages = COMMON_R_PACKAGES.filter(pkg => pkg.required);

  return (
    <div className="r-package-selector">
      <div className="package-selector-header">
        <h3>📦 选择要安装的 R 包</h3>
        <p className="package-selector-subtitle">
          选择你需要的包，首次安装可能需要几分钟时间
        </p>
        <div className="package-selector-tip">
          💡 提示：如果你的代码中使用了 <code>library(tidyverse)</code>，
          请选择 Tidyverse 系列的包（特别是 dplyr 和 tidyr）
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
          className="selector-btn selector-btn-tidyverse" 
          onClick={selectTidyverse}
        >
          📊 选择 Tidyverse
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
          <h4 className="category-title">必需包</h4>
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

        {/* Tidyverse 系列 */}
        <div className="package-category">
          <h4 className="category-title">Tidyverse 系列</h4>
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

        {/* 其他常用包 */}
        <div className="package-category">
          <h4 className="category-title">其他常用包</h4>
          {otherPackages.map(pkg => (
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
      `}</style>
    </div>
  );
};

export default RPackageSelector;

