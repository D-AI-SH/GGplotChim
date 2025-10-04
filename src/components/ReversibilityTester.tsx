/**
 * 可逆性测试面板
 * 用于测试代码生成和解析的可逆性
 */

import React, { useState } from 'react';
import { testReversibility, TEST_CASES, normalizeRCode } from '../utils/testReversibility';
import { useBlockStore } from '../store/useBlockStore';

interface ReversibilityTesterProps {
  webR: any;
}

const ReversibilityTester: React.FC<ReversibilityTesterProps> = ({ webR }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    originalNormalized: string;
    generatedNormalized: string;
    diff?: string[];
  } | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<string>('simpleGgplot');
  
  const { generatedCode } = useBlockStore();
  
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
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
      >
        🧪 测试可逆性
      </button>
    );
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '600px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#4f46e5',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>🧪 可逆性测试</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>
      
      {/* 内容区 */}
      <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        {/* 测试说明 */}
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            可逆性测试：验证 <strong>代码 → 积木 → 代码</strong> 的转换是否保持语义一致
          </p>
        </div>
        
        {/* 测试选项 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>测试选项</h4>
          
          {/* 测试当前代码 */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={handleTestCurrent}
              disabled={testing || !generatedCode}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: testing ? '#d1d5db' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {testing ? '测试中...' : '测试当前代码'}
            </button>
          </div>
          
          {/* 测试预定义用例 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
              选择测试用例：
            </label>
            <select
              value={selectedTestCase}
              onChange={(e) => setSelectedTestCase(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="simpleGgplot">简单 ggplot 链</option>
              <option value="withDataImport">带数据导入</option>
              <option value="multipleStatements">多个语句</option>
              <option value="complexGgplot">复杂 ggplot 链</option>
            </select>
            <button
              onClick={handleTestCase}
              disabled={testing}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: testing ? '#d1d5db' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {testing ? '测试中...' : '测试选中用例'}
            </button>
          </div>
        </div>
        
        {/* 测试结果 */}
        {testResult && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>测试结果</h4>
            
            <div
              style={{
                padding: '12px',
                backgroundColor: testResult.success ? '#d1fae5' : '#fee2e2',
                border: `2px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            >
              <strong style={{ color: testResult.success ? '#065f46' : '#991b1b' }}>
                {testResult.success ? '✅ 测试通过！代码完全可逆' : '❌ 测试失败！代码不可逆'}
              </strong>
            </div>
            
            {/* 原始代码 */}
            <div style={{ marginBottom: '12px' }}>
              <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                规范化后的原始代码：
              </h5>
              <pre
                style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '150px',
                  margin: 0,
                }}
              >
                {testResult.originalNormalized}
              </pre>
            </div>
            
            {/* 生成代码 */}
            <div style={{ marginBottom: '12px' }}>
              <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                规范化后的生成代码：
              </h5>
              <pre
                style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '150px',
                  margin: 0,
                }}
              >
                {testResult.generatedNormalized}
              </pre>
            </div>
            
            {/* 差异 */}
            {testResult.diff && testResult.diff.length > 0 && (
              <div>
                <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                  差异详情：
                </h5>
                <pre
                  style={{
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '150px',
                    margin: 0,
                    color: '#92400e',
                  }}
                >
                  {testResult.diff.join('\n')}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReversibilityTester;

