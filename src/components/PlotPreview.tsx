import React, { useEffect, useState } from 'react';
import { useBlockStore } from '../store/useBlockStore';
import { Play, AlertCircle, Loader, Download, RefreshCw, Settings } from 'lucide-react';
import { webRRunner } from '../core/rRunner/webRRunner';

const PlotPreview: React.FC = () => {
  const { 
    plotUrl, 
    generatedCode, 
    isRunning, 
    runError, 
    isWebRInitialized,
    plotWidth,
    plotHeight,
    plotDPI,
    setPlotUrl, 
    setIsRunning, 
    setRunError,
    setIsWebRInitialized,
    setPlotSettings
  } = useBlockStore();
  
  const [initStatus, setInitStatus] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempWidth, setTempWidth] = useState<number>(plotWidth);
  const [tempHeight, setTempHeight] = useState<number>(plotHeight);
  const [tempDPI, setTempDPI] = useState<number>(plotDPI);

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

      // 运行代码并生成图表（传递用户设置）
      const result = await webRRunner.runPlot(generatedCode, {
        width: plotWidth,
        height: plotHeight,
        dpi: plotDPI
      });

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

  const handleApplySettings = () => {
    setPlotSettings(tempWidth, tempHeight, tempDPI);
    setShowSettings(false);
    // 如果已经有图表，提示重新运行
    if (plotUrl) {
      alert('设置已保存！请重新运行代码以应用新的图片尺寸。');
    }
  };

  const handleResetSettings = () => {
    setTempWidth(20);
    setTempHeight(20);
    setTempDPI(720);
  };

  // 同步 store 的值到临时状态
  useEffect(() => {
    setTempWidth(plotWidth);
    setTempHeight(plotHeight);
    setTempDPI(plotDPI);
  }, [plotWidth, plotHeight, plotDPI]);

  // 计算像素尺寸
  const pixelWidth = tempWidth * tempDPI;
  const pixelHeight = tempHeight * tempDPI;
  const estimatedSizeMB = (pixelWidth * pixelHeight * 3) / (1024 * 1024); // RGB 估算

  return (
    <div className="plot-preview">
      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <h3>图片导出设置</h3>
            
            <div className="setting-group">
              <label>
                宽度（英寸）:
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  step="1"
                  value={tempWidth}
                  onChange={(e) => setTempWidth(Number(e.target.value))}
                />
              </label>
            </div>
            
            <div className="setting-group">
              <label>
                高度（英寸）:
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  step="1"
                  value={tempHeight}
                  onChange={(e) => setTempHeight(Number(e.target.value))}
                />
              </label>
            </div>
            
            <div className="setting-group">
              <label>
                DPI (分辨率):
                <input 
                  type="number" 
                  min="72" 
                  max="2400" 
                  step="72"
                  value={tempDPI}
                  onChange={(e) => setTempDPI(Number(e.target.value))}
                />
              </label>
            </div>
            
            <div className="settings-info">
              <div className="info-row">
                <span>输出尺寸：</span>
                <strong>{pixelWidth} × {pixelHeight} 像素</strong>
              </div>
              <div className="info-row">
                <span>预估大小：</span>
                <strong className={estimatedSizeMB > 500 ? 'warning' : ''}>
                  约 {estimatedSizeMB.toFixed(0)} MB
                  {estimatedSizeMB > 500 && ' ⚠️'}
                </strong>
              </div>
              {estimatedSizeMB > 500 && (
                <div className="warning-message">
                  ⚠️ 图片太大可能导致浏览器内存不足！建议降低尺寸或 DPI。
                </div>
              )}
            </div>
            
            <div className="settings-presets">
              <h4>快速预设：</h4>
              <button onClick={() => { setTempWidth(10); setTempHeight(10); setTempDPI(300); }}>
                网页 (10×10, 300 DPI)
              </button>
              <button onClick={() => { setTempWidth(16); setTempHeight(16); setTempDPI(600); }}>
                论文 (16×16, 600 DPI)
              </button>
              <button onClick={() => { setTempWidth(20); setTempHeight(20); setTempDPI(720); }}>
                默认 (20×20, 720 DPI)
              </button>
              <button onClick={() => { setTempWidth(40); setTempHeight(40); setTempDPI(720); }}>
                超高清 (40×40, 720 DPI)
              </button>
            </div>
            
            <div className="settings-actions">
              <button className="btn-secondary" onClick={handleResetSettings}>
                重置为默认
              </button>
              <button className="btn-secondary" onClick={() => setShowSettings(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleApplySettings}>
                应用设置
              </button>
            </div>
          </div>
        </div>
      )}
      
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
            <div className="action-left">
              <span className="plot-info">
                📐 {plotWidth}×{plotHeight} 英寸 · {plotDPI} DPI
              </span>
            </div>
            <div className="action-right">
              <button className="action-btn" onClick={() => setShowSettings(true)} title="图片设置">
                <Settings size={16} />
                设置
              </button>
              <button className="action-btn" onClick={handleDownloadPlot} title="下载图表">
                <Download size={16} />
                下载
              </button>
              <button className="action-btn" onClick={handleRerun} title="重新运行">
                <RefreshCw size={16} />
                重新运行
              </button>
            </div>
          </div>
          <img src={plotUrl} alt="Generated plot" />
        </div>
      )}
    </div>
  );
};

export default PlotPreview;

