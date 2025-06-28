// File: frontend/src/components/PDFPreview.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loading, Button, Slider, Pagination, InlineNotification, Tag } from '@carbon/react';
import { ZoomIn, ZoomOut, ScanDisabled, ViewMode, FitToScreen } from '@carbon/icons-react';
import { TablePreview } from '../types';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  file: File;
  detectedTables: TablePreview[];
  onSelectTable?: (tableId: string) => void;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ file, detectedTables, onSelectTable }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotate, setRotate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableHighlights, setTableHighlights] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Group tables by page
  const tablesByPage = detectedTables.reduce((acc: Record<number, TablePreview[]>, table) => {
    if (!acc[table.page]) {
      acc[table.page] = [];
    }
    acc[table.page].push(table);
    return acc;
  }, {});
  
  useEffect(() => {
    // Initialize all tables as highlighted
    const initialHighlights: Record<string, boolean> = {};
    detectedTables.forEach(table => {
      initialHighlights[table.table_id] = true;
    });
    setTableHighlights(initialHighlights);
  }, [detectedTables]);
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };
  
  const onDocumentLoadError = (error: Error) => {
    setIsLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
  };
  
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };
  
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };
  
  const handleZoomReset = () => {
    setScale(1.0);
  };
  
  const handleRotate = () => {
    setRotate(prevRotate => (prevRotate + 90) % 360);
  };
  
  const handlePageChange = ({ page }: { page: number }) => {
    setPageNumber(page);
  };
  
  const toggleTableHighlight = (tableId: string) => {
    setTableHighlights(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
    
    if (onSelectTable) {
      onSelectTable(tableId);
    }
  };
  
  // Calculate approximate table positions based on metadata
  // In a real implementation, these would come from backend analysis
  const getTablePosition = (table: TablePreview, pageIndex: number): React.CSSProperties => {
    // This is a placeholder for actual positioning logic
    // In a real implementation, the backend would provide bounding box coordinates
    
    // We'll use the table index on the page to stagger positions for demonstration
    const tablesOnPage = tablesByPage[pageIndex] || [];
    const tableIndex = tablesOnPage.findIndex(t => t.table_id === table.table_id);
    
    // Create a staggered layout based on table index
    const topPercentage = 20 + (tableIndex * 15);
    const leftPercentage = 10 + (tableIndex * 5);
    const widthPercentage = 80 - (tableIndex * 5);
    
    // Scale based on number of columns and rows
    const height = Math.min(40, Math.max(15, table.rows * 2));
    
    return {
      position: 'absolute',
      top: `${topPercentage}%`,
      left: `${leftPercentage}%`,
      width: `${widthPercentage}%`,
      height: `${height}%`,
      border: '2px dashed',
      borderColor: tableHighlights[table.table_id] ? 'rgba(0, 98, 255, 0.7)' : 'rgba(200, 200, 200, 0.4)',
      backgroundColor: tableHighlights[table.table_id] ? 'rgba(0, 98, 255, 0.1)' : 'transparent',
      cursor: 'pointer',
      borderRadius: '4px',
      zIndex: 1000,
      transition: 'all 0.2s ease'
    };
  };
  
  return (
    <div className="my-6 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded-lg overflow-hidden">
      <div className="bg-carbon-gray-10 dark:bg-carbon-gray-90 p-4 border-b border-carbon-gray-20 dark:border-carbon-gray-80">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
            PDF Preview {file.name && `- ${file.name}`}
          </h3>
          <div className="flex space-x-2">
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ZoomOut}
              iconDescription="Zoom Out"
              hasIconOnly
              onClick={handleZoomOut}
            />
            <div className="w-32">
              <Slider
                id="scale-slider"
                value={scale * 100}
                min={50}
                max={300}
                step={10}
                labelText=""
                hideTextInput
                onChange={({ value }) => setScale(value / 100)}
              />
            </div>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ZoomIn}
              iconDescription="Zoom In"
              hasIconOnly
              onClick={handleZoomIn}
            />
            <Button
              kind="ghost"
              size="sm"
              renderIcon={FitToScreen}
              iconDescription="Reset Zoom"
              hasIconOnly
              onClick={handleZoomReset}
            />
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ViewMode}
              iconDescription="Rotate"
              hasIconOnly
              onClick={handleRotate}
            />
          </div>
        </div>
        
        {Object.keys(tablesByPage).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-carbon-gray-100 dark:text-white">
              Detected Tables
            </h4>
            <div className="flex flex-wrap gap-2">
              {detectedTables.map(table => (
                <Tag
                  key={table.table_id}
                  type={tableHighlights[table.table_id] ? "blue" : "gray"}
                  className="cursor-pointer"
                  onClick={() => toggleTableHighlight(table.table_id)}
                >
                  Table {table.table_id.split('_').pop()} (Page {table.page})
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="relative bg-carbon-gray-20 dark:bg-carbon-gray-100 min-h-[500px] p-4 flex justify-center overflow-auto"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-carbon-gray-10 dark:bg-carbon-gray-90 bg-opacity-70 dark:bg-opacity-70 z-10">
            <Loading description="Loading PDF..." withOverlay={false} />
          </div>
        )}
        
        {error && (
          <div className="w-full p-4">
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              hideCloseButton
            />
          </div>
        )}
        
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<></>}
          noData={<></>}
          className="relative"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotate}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          >
            {/* Table Highlight Overlays */}
            {(tablesByPage[pageNumber] || []).map(table => (
              <div
                key={table.table_id}
                style={getTablePosition(table, pageNumber)}
                onClick={() => toggleTableHighlight(table.table_id)}
                className="relative"
              >
                <div className="absolute top-[-20px] left-[0] bg-carbon-blue-60 text-white text-xs py-1 px-2 rounded-t">
                  Table {table.table_id.split('_').pop()} ({table.rows}×{table.columns})
                </div>
              </div>
            ))}
          </Page>
        </Document>
      </div>
      
      {numPages && numPages > 1 && (
        <div className="p-4 border-t border-carbon-gray-20 dark:border-carbon-gray-80 flex justify-center">
          <Pagination
            page={pageNumber}
            pageSize={1}
            totalItems={numPages}
            onChange={handlePageChange}
            itemsPerPageText=""
            pageSizes={[1]}
          />
        </div>
      )}
    </div>
  );
};

export default PDFPreview;

// File: frontend/src/hooks/usePDF.ts
import { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

// Initialize PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  textItems: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface UsePDFReturn {
  pagesInfo: PDFPageInfo[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export const usePDF = (file: File | null): UsePDFReturn => {
  const [pagesInfo, setPagesInfo] = useState<PDFPageInfo[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPagesInfo([]);
      setTotalPages(0);
      setError(null);
      return;
    }

    const processDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Load the PDF document
        const loadingTask = pdfjs.getDocument(uint8Array);
        const pdfDocument = await loadingTask.promise;
        
        setTotalPages(pdfDocument.numPages);
        
        // Process each page
        const pages: PDFPageInfo[] = [];
        
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Get text content
          const textContent = await page.getTextContent();
          
          // Transform text items to a more usable format
          const textItems = textContent.items.map((item: any) => {
            const transform = pdfjs.Util.transform(
              viewport.transform,
              item.transform
            );
            
            return {
              text: item.str,
              x: transform[4],
              y: transform[5],
              width: item.width || 0,
              height: item.height || 0
            };
          });
          
          pages.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
            textItems
          });
        }
        
        setPagesInfo(pages);
      } catch (err) {
        setError(`Failed to process PDF: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    processDocument();
  }, [file]);

  return { pagesInfo, totalPages, loading, error };
};
