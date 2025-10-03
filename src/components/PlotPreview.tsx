import React, { useEffect, useState } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { Play, AlertCircle, Loader, Download, RefreshCw } from 'lucide-react';
import { webRRunner } from '../core/rRunner/webRRunner';

const PlotPreview: React.FC = () => {
  const { 
    plotUrl, 
    generatedCode, 
    isRunning, 
    runError, 
    isWebRInitialized,
    setPlotUrl, 
    setIsRunning, 
    setRunError,
    setIsWebRInitialized 
  } = useBlockStore();
  
  const [initStatus, setInitStatus] = useState<string>('');

  useEffect(() => {
    // 组件加载时初始化 WebR
    initializeWebR();
  }, []);

  const initializeWebR = async () => {
    if (webRRunner.isReady()) {
      setIsWebRInitialized(true);
      return;
    }

    try {
      setInitStatus('正在初始化 WebR...');
      await webRRunner.initialize();
      setIsWebRInitialized(true);
      setInitStatus('');
    } catch (error) {
      console.error('WebR 初始化失败:', error);
      setRunError(error instanceof Error ? error.message : 'WebR 初始化失败');
      setInitStatus('');
    }
  };

  const handleRunCode = async () => {
    if (!generatedCode || generatedCode.includes('请添加积木')) {
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setPlotUrl(null);

    try {
      // 确保 WebR 已初始化
      if (!webRRunner.isReady()) {
        await initializeWebR();
      }

      // 运行代码并生成图表
      const result = await webRRunner.runPlot(generatedCode);

      if (result.success && result.plotUrl) {
        setPlotUrl(result.plotUrl);
        setRunError(null);
      } else {
        setRunError(result.error || '图表生成失败');
      }
    } catch (error) {
      console.error('代码执行失败:', error);
      setRunError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadPlot = () => {
    if (!plotUrl) return;

    const a = document.createElement('a');
    a.href = plotUrl;
    a.download = 'ggplot_chart.png';
    a.click();
  };

  const handleRerun = () => {
    handleRunCode();
  };

  return (
    <div className="plot-preview">
      {isRunning ? (
        <div className="plot-loading">
          <Loader size={48} className="spinner" />
          <h3>正在生成图表...</h3>
          <p>请稍候，WebR 正在运行您的 R 代码</p>
        </div>
      ) : runError ? (
        <div className="plot-error">
          <div className="error-icon">
            <AlertCircle size={48} color="#ef4444" />
          </div>
          <h3>代码执行出错</h3>
          <div className="error-message">
            <pre>{runError}</pre>
          </div>
          <button 
            className="run-button"
            onClick={handleRunCode}
            disabled={!generatedCode || generatedCode.includes('请添加积木')}
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      ) : !plotUrl ? (
        <div className="plot-empty">
          {initStatus ? (
            <>
              <Loader size={48} className="spinner" />
              <h3>{initStatus}</h3>
              <p>首次使用需要下载 R 运行环境（约 10-20 秒）</p>
            </>
          ) : (
            <>
              <div className="empty-icon">
                <AlertCircle size={48} />
              </div>
              <h3>暂无图表预览</h3>
              <p>点击下方按钮运行代码生成图表</p>
              <button 
                className="run-button"
                onClick={handleRunCode}
                disabled={!generatedCode || generatedCode.includes('请添加积木') || !isWebRInitialized}
              >
                <Play size={16} />
                {isWebRInitialized ? '运行代码' : '初始化中...'}
              </button>
              
              <div className="info-box">
                <strong>✨ WebR 已集成！</strong>
                <p>现已支持：</p>
                <ul>
                  <li>🚀 浏览器端运行 R 代码（无需服务器）</li>
                  <li>📊 实时图表预览</li>
                  <li>💾 图表下载（PNG 格式）</li>
                  <li>🔄 即时重新运行</li>
                </ul>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="plot-display">
          <div className="plot-actions">
            <button className="action-btn" onClick={handleDownloadPlot} title="下载图表">
              <Download size={16} />
              下载
            </button>
            <button className="action-btn" onClick={handleRerun} title="重新运行">
              <RefreshCw size={16} />
              重新运行
            </button>
          </div>
          <img src={plotUrl} alt="Generated plot" />
        </div>
      )}
    </div>
  );
};

export default PlotPreview;

