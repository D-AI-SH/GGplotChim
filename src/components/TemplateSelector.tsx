import React, { useState } from 'react';
import { CodeTemplate, codeTemplates, getTemplatesByCategory } from '../data/templates';
import { X, FileCode, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useBlockStore } from '../store/useBlockStore';
import '../styles/TemplateSelector.css';

interface TemplateSelectorProps {
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updateCodeAndSync, installedPackages, isWebRReady } = useBlockStore();
  
  const templatesByCategory = getTemplatesByCategory();
  
  const handleTemplateClick = (template: CodeTemplate) => {
    setSelectedTemplate(template);
  };
  
  const handleLoadTemplate = async () => {
    if (!selectedTemplate) return;
    
    // 检查所需的包是否已安装
    const missingPackages = selectedTemplate.requiredPackages.filter(
      pkg => !installedPackages.includes(pkg)
    );
    
    if (missingPackages.length > 0) {
      const confirmLoad = window.confirm(
        `此模板需要以下包，但尚未安装：\n${missingPackages.join(', ')}\n\n是否继续加载？（可能无法正常运行）`
      );
      
      if (!confirmLoad) return;
    }
    
    setIsLoading(true);
    
    try {
      // 清空当前积木并加载模板代码
      if (window.confirm('加载模板将清空当前所有积木，确定继续吗？')) {
        // 使用 updateCodeAndSync 将代码转换为积木
        await updateCodeAndSync(selectedTemplate.code);
        
        // 成功后关闭对话框
        onClose();
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      alert('加载模板失败，请查看控制台了解详情');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 检查包的安装状态
  const getPackageStatus = (packages: string[]) => {
    const installed = packages.filter(pkg => installedPackages.includes(pkg));
    const missing = packages.filter(pkg => !installedPackages.includes(pkg));
    
    return { installed, missing };
  };
  
  return (
    <div className="template-selector-overlay" onClick={onClose}>
      <div className="template-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-selector-header">
          <div>
            <h2>📚 选择代码模板</h2>
            <p className="template-selector-subtitle">
              从预设模板快速开始创建图表
            </p>
          </div>
          <button className="template-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="template-selector-content">
          {/* 左侧：模板列表 */}
          <div className="template-list">
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} className="template-category">
                <h3 className="template-category-title">{category}</h3>
                {templates.map(template => {
                  const { installed, missing } = getPackageStatus(template.requiredPackages);
                  const isSelected = selectedTemplate?.id === template.id;
                  
                  return (
                    <div
                      key={template.id}
                      className={`template-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleTemplateClick(template)}
                    >
                      <div className="template-item-icon">
                        <FileCode size={20} />
                      </div>
                      <div className="template-item-content">
                        <h4 className="template-item-name">{template.name}</h4>
                        <p className="template-item-description">{template.description}</p>
                        
                        {/* 包状态指示器 */}
                        <div className="template-packages-status">
                          {missing.length === 0 ? (
                            <span className="packages-status-ready">
                              <CheckCircle size={14} />
                              所有包已安装
                            </span>
                          ) : (
                            <span className="packages-status-missing">
                              <AlertCircle size={14} />
                              缺少 {missing.length} 个包
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {codeTemplates.length === 0 && (
              <div className="template-empty">
                <p>暂无可用模板</p>
              </div>
            )}
          </div>
          
          {/* 右侧：模板详情 */}
          <div className="template-detail">
            {selectedTemplate ? (
              <>
                <div className="template-detail-header">
                  <h3>{selectedTemplate.name}</h3>
                  <span className="template-detail-category">{selectedTemplate.category}</span>
                </div>
                
                <p className="template-detail-description">
                  {selectedTemplate.description}
                </p>
                
                {/* 所需包列表 */}
                <div className="template-detail-packages">
                  <h4>
                    <Package size={16} />
                    所需 R 包
                  </h4>
                  <div className="template-packages-list">
                    {selectedTemplate.requiredPackages.map(pkg => {
                      const isInstalled = installedPackages.includes(pkg);
                      return (
                        <span
                          key={pkg}
                          className={`template-package-badge ${isInstalled ? 'installed' : 'missing'}`}
                        >
                          {isInstalled ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {pkg}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {/* 代码预览 */}
                <div className="template-detail-code">
                  <h4>代码预览</h4>
                  <pre className="template-code-preview">
                    <code>{selectedTemplate.code}</code>
                  </pre>
                </div>
                
                {/* 加载按钮 */}
                <div className="template-detail-actions">
                  <button
                    className="template-load-btn"
                    onClick={handleLoadTemplate}
                    disabled={isLoading || !isWebRReady}
                  >
                    {isLoading ? '加载中...' : '加载此模板'}
                  </button>
                  {!isWebRReady && (
                    <p className="template-warning">
                      <AlertCircle size={14} />
                      WebR 尚未就绪，请等待初始化完成
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="template-detail-empty">
                <FileCode size={48} />
                <p>请从左侧选择一个模板查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;

