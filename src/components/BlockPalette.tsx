import React, { useState } from 'react';
import { BlockCategory, BlockDefinition } from '../types/blocks';
import { blocksByCategory } from '../data/blockDefinitions';

const categoryLabels: Record<BlockCategory, string> = {
  [BlockCategory.DATA]: '📊 数据',
  [BlockCategory.GEOM]: '📈 几何对象',
  [BlockCategory.AES]: '🎨 美学映射',
  [BlockCategory.SCALE]: '📏 标度',
  [BlockCategory.THEME]: '🎭 主题',
  [BlockCategory.COORD]: '📐 坐标系',
  [BlockCategory.STAT]: '📊 统计',
  [BlockCategory.FACET]: '🔲 分面',
  [BlockCategory.LABS]: '🏷️ 标签'
};

interface BlockPaletteProps {
  onBlockDragStart: (block: BlockDefinition) => void;
}

const BlockPalette: React.FC<BlockPaletteProps> = ({ onBlockDragStart }) => {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>(BlockCategory.DATA);
  
  const categories = Object.keys(blocksByCategory) as BlockCategory[];
  const currentBlocks = blocksByCategory[activeCategory] || [];
  
  return (
    <div className="block-palette">
      <div className="palette-header">
        <h2>积木面板</h2>
      </div>
      
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>
      
      <div className="blocks-list">
        {currentBlocks.map(block => (
          <div
            key={block.id}
            className="block-item"
            draggable
            onDragStart={() => onBlockDragStart(block)}
            style={{ borderLeftColor: block.color }}
          >
            <div className="block-header">
              <span className="block-label">{block.label}</span>
            </div>
            <div className="block-description">
              {block.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockPalette;

