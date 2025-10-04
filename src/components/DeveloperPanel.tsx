/**
 * 开发者面板
 * 集中管理所有开发者专用的测试和调试功能
 */

import React, { useState } from 'react';
import { testReversibility, TEST_CASES } from '../utils/testReversibility';
import { useBlockStore } from '../store/useBlockStore';
import { TestTube, Code, Zap } from 'lucide-react';

interface DeveloperPanelProps {
  webR: any;
}

const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ webR }) => {
  const [activeTab, setActiveTab] = useState<'reversibility' | 'debug' | 'performance'>('reversibility');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    originalNormalized: string;
    generatedNormalized: string;
    diff?: string[];
  } | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<string>('simpleGgplot');
  
  const { generatedCode, blocks } = useBlockStore();
  
  // 测试当前代码的可逆性
  const handleTestCurrent = async () => {
    if (!generatedCode || !webR) {
      alert('请先生成代码或等待 WebR 初始化');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await testReversibility(generatedCode, webR);
      setTestResult(result);
    } catch (error) {
      console.error('测试失败:', error);
      alert('测试失败: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };
  
  // 测试预定义测试用例
  const handleTestCase = async () => {
    if (!webR) {
      alert('请等待 WebR 初始化');
      return;
    }
    
    const code = TEST_CASES[selectedTestCase as keyof typeof TEST_CASES];
    if (!code) {
      alert('无效的测试用例');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await testReversibility(code, webR);
      setTestResult(result);
    } catch (error) {
      console.error('测试失败:', error);
      alert('测试失败: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="developer-panel">
      {/* 标题栏 */}
      <div className="developer-panel-header">
        <h3>开发者工具</h3>
      </div>
      
      {/* 标签页导航 */}
      <div className="developer-panel-tabs">
        <button
          className={`developer-tab ${activeTab === 'reversibility' ? 'active' : ''}`}
          onClick={() => setActiveTab('reversibility')}
        >
          <TestTube size={16} />
          可逆性测试
        </button>
        <button
          className={`developer-tab ${activeTab === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          <Code size={16} />
          调试信息
        </button>
        <button
          className={`developer-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <Zap size={16} />
          性能监控
        </button>
      </div>
      
      {/* 内容区 */}
      <div className="developer-panel-content">
        {/* 可逆性测试标签页 */}
        {activeTab === 'reversibility' && (
          <div className="developer-tab-content">
            {/* 测试说明 */}
            <div className="developer-info-box">
              <h4>📋 关于可逆性测试</h4>
              <p>
                可逆性测试验证 <strong>代码 → 积木 → 代码</strong> 的转换是否保持语义一致。
                这确保了编辑器的双向转换功能正常工作。
              </p>
            </div>
            
            {/* 测试选项 */}
            <div className="developer-section">
              <h4>🧪 测试选项</h4>
              
              {/* 测试当前代码 */}
              <div className="developer-test-group">
                <label>测试当前画布代码：</label>
                <button
                  onClick={handleTestCurrent}
                  disabled={testing || !generatedCode}
                  className="developer-btn primary"
                >
                  {testing ? '测试中...' : '测试当前代码'}
                </button>
                {!generatedCode && (
                  <p className="developer-hint">请先在画布上添加积木</p>
                )}
              </div>
              
              {/* 测试预定义用例 */}
              <div className="developer-test-group">
                <label>测试预定义用例：</label>
                <select
                  value={selectedTestCase}
                  onChange={(e) => setSelectedTestCase(e.target.value)}
                  className="developer-select"
                >
                  <option value="simpleGgplot">简单 ggplot 链</option>
                  <option value="withDataImport">带数据导入</option>
                  <option value="multipleStatements">多个语句</option>
                  <option value="complexGgplot">复杂 ggplot 链</option>
                </select>
                <button
                  onClick={handleTestCase}
                  disabled={testing}
                  className="developer-btn secondary"
                >
                  {testing ? '测试中...' : '测试选中用例'}
                </button>
              </div>
            </div>
            
            {/* 测试结果 */}
            {testResult && (
              <div className="developer-section">
                <h4>📊 测试结果</h4>
                
                <div className={`developer-result-box ${testResult.success ? 'success' : 'failure'}`}>
                  <strong>
                    {testResult.success ? '✅ 测试通过！代码完全可逆' : '❌ 测试失败！代码不可逆'}
                  </strong>
                </div>
                
                {/* 原始代码 */}
                <div className="developer-code-block">
                  <h5>规范化后的原始代码：</h5>
                  <pre>{testResult.originalNormalized}</pre>
                </div>
                
                {/* 生成代码 */}
                <div className="developer-code-block">
                  <h5>规范化后的生成代码：</h5>
                  <pre>{testResult.generatedNormalized}</pre>
                </div>
                
                {/* 差异 */}
                {testResult.diff && testResult.diff.length > 0 && (
                  <div className="developer-code-block diff">
                    <h5>差异详情：</h5>
                    <pre>{testResult.diff.join('\n')}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 调试信息标签页 */}
        {activeTab === 'debug' && (
          <div className="developer-tab-content">
            <div className="developer-info-box">
              <h4>🐛 调试信息</h4>
              <p>查看应用的实时状态和调试信息</p>
            </div>
            
            <div className="developer-section">
              <h4>📦 积木状态</h4>
              <div className="developer-info-item">
                <span className="label">积木数量：</span>
                <span className="value">{blocks.length}</span>
              </div>
              <div className="developer-info-item">
                <span className="label">生成代码长度：</span>
                <span className="value">{generatedCode?.length || 0} 字符</span>
              </div>
            </div>
            
            <div className="developer-section">
              <h4>💻 系统信息</h4>
              <div className="developer-info-item">
                <span className="label">浏览器：</span>
                <span className="value">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
              </div>
              <div className="developer-info-item">
                <span className="label">WebR 状态：</span>
                <span className="value">{webR ? '✅ 已就绪' : '⏳ 未初始化'}</span>
              </div>
            </div>
            
            <div className="developer-section">
              <h4>🔍 当前代码</h4>
              <div className="developer-code-block">
                <pre>{generatedCode || '// 暂无代码'}</pre>
              </div>
            </div>
          </div>
        )}
        
        {/* 性能监控标签页 */}
        {activeTab === 'performance' && (
          <div className="developer-tab-content">
            <div className="developer-info-box">
              <h4>⚡ 性能监控</h4>
              <p>监控应用的性能指标和资源使用情况</p>
            </div>
            
            <div className="developer-section">
              <h4>📈 性能指标</h4>
              <div className="developer-info-item">
                <span className="label">积木渲染数量：</span>
                <span className="value">{blocks.length}</span>
              </div>
              <div className="developer-info-item">
                <span className="label">内存使用：</span>
                <span className="value">
                  {(performance as any).memory 
                    ? `${((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2)} MB`
                    : '不可用'}
                </span>
              </div>
            </div>
            
            <div className="developer-section">
              <h4>🎯 优化建议</h4>
              <ul className="developer-tips">
                <li>当积木数量超过 50 个时，考虑使用虚拟滚动</li>
                <li>定期清理不需要的积木以提高性能</li>
                <li>避免频繁的代码生成操作</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperPanel;

