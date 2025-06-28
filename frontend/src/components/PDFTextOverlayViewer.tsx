import React from 'react';
import { PDFPageInfo } from '../hooks/usePDF';

interface Props {
  page: PDFPageInfo;
}

const PDFTextOverlayViewer: React.FC<Props> = ({ page }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: page.width,
        height: page.height,
        border: '1px solid #ccc',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}
    >
      {page.textItems.map((item, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            fontSize: '10px',
            color: 'blue',
            backgroundColor: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none'
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};

export default PDFTextOverlayViewer;
