// File: frontend/src/components/BatchProcessor.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  Modal,
  Tag,
  ProgressBar,
  InlineLoading,
  InlineNotification,
  Tile,
  Checkbox,
  Pagination,
  Dropdown,
  TextInput,
  Toggle,
  Search
} from '@carbon/react';
import {
  Add,
  Upload,
  DocumentPdf,
  Checkmark,
  Error,
  Warning,
  TrashCan,
  Pause,
  Play,
  SettingsAdjust,
  Download,
  StopFilled,
  ChartBar,
  Task,
  FolderAdd
} from '@carbon/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { ConversionOptions } from '../../types';

interface BatchFile {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  addedAt: string;
  completedAt?: string;
  error?: string;
  outputFormat?: string;
  outputUrl?: string;
  tableCount?: number;
  selected: boolean;
}

interface BatchStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalTables: number;
  averageProcessingTime: number; // in milliseconds
  totalProcessingTime: number;
}

interface BatchProcessorProps {
  defaultConversionOptions?: ConversionOptions;
  onProcessComplete?: (processedFiles: BatchFile[]) => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({
  defaultConversionOptions,
  onProcessComplete
}) => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showAddFilesModal, setShowAddFilesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BatchFile | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [batchStats, setBatchStats] = useState<BatchStats>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalTables: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0
  });
  
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(
    defaultConversionOptions || {
      format: 'csv',
      delimiter: ',',
      sheet_name: 'Sheet1',
      include_headers: true
    }
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    return file.file.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Paginate filtered files
  const paginatedFiles = filteredFiles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  // Update batch stats when files change
  useEffect(() => {
    const completed = files.filter(f => f.status === 'completed');
    const failed = files.filter(f => f.status === 'failed');
    
    // Calculate processing times (in a real app, you'd store actual processing times)
    const processingTimes = completed.map(f => {
      if (f.completedAt && f.addedAt) {
        return new Date(f.completedAt).getTime() - new Date(f.addedAt).getTime();
      }
      return 0;
    });
    
    const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);
    const averageProcessingTime = processingTimes.length > 0 
      ? totalProcessingTime / processingTimes.length 
      : 0;
    
    const totalTables = completed.reduce((sum, file) => sum + (file.tableCount || 0), 0);
    
    setBatchStats({
      totalFiles: files.length,
      completedFiles: completed.length,
      failedFiles: failed.length,
      totalTables,
      averageProcessingTime,
      totalProcessingTime
    });
    
  }, [files]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: BatchFile[] = Array.from(e.target.files).map(file => ({
        id: `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        file,
        status: 'queued',
        progress: 0,
        addedAt: new Date().toISOString(),
        selected: false
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      setShowAddFilesModal(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Start batch processing
  const startProcessing = () => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setIsPaused(false);
    
    // Start processing timer to simulate progress
    processingTimerRef.current = setInterval(() => {
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        
        // Find the next file to process
        const nextFileIndex = updatedFiles.findIndex(
          file => file.status === 'queued' || (file.status === 'processing' && file.progress < 100)
        );
        
        if (nextFileIndex === -1) {
          // All files processed
          clearInterval(processingTimerRef.current as NodeJS.Timeout);
          setIsProcessing(false);
          
          if (onProcessComplete) {
            onProcessComplete(updatedFiles);
          }
          
          return updatedFiles;
        }
        
        const file = updatedFiles[nextFileIndex];
        
        if (file.status === 'queued') {
          // Start processing this file
          updatedFiles[nextFileIndex] = {
            ...file,
            status: 'processing',
            progress: 0
          };
        } else if (file.status === 'processing') {
          // Update progress
          const newProgress = file.progress + (5 + Math.floor(Math.random() * 15));
          
          if (newProgress >= 100) {
            // File processing complete
            updatedFiles[nextFileIndex] = {
              ...file,
              status: Math.random() > 0.9 ? 'failed' : 'completed', // 10% chance of failure for demo
              progress: 100,
              completedAt: new Date().toISOString(),
              error: Math.random() > 0.9 ? 'Failed to extract tables from PDF' : undefined,
              outputFormat: conversionOptions.format,
              outputUrl: `#sample-output-${file.id}`,
              tableCount: Math.floor(Math.random() * 5) + 1 // Random number of tables for demo
            };
          } else {
            // Update progress
            updatedFiles[nextFileIndex] = {
              ...file,
              progress: newProgress
            };
          }
        }
        
        return updatedFiles;
      });
    }, 500);
  };
  
  // Pause batch processing
  const pauseProcessing = () => {
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setIsPaused(true);
  };
  
  // Resume batch processing
  const resumeProcessing = () => {
    setIsPaused(false);
    startProcessing();
  };
  
  // Stop batch processing
  const stopProcessing = () => {
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.map(file => {
        if (file.status === 'processing') {
          return {
            ...file,
            status: 'queued',
            progress: 0
          };
        }
        return file;
      });
      
      return updatedFiles;
    });
    
    setIsProcessing(false);
    setIsPaused(false);
  };
  
  // Remove selected files
  const removeSelectedFiles = () => {
    setFiles(prevFiles => prevFiles.filter(file => !file.selected));
    setSelectAll(false);
  };
  
  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setFiles(prevFiles => 
      prevFiles.map(file => ({
        ...file,
        selected: checked
      }))
    );
  };
  
  // Handle individual file selection
  const handleSelectFile = (id: string, checked: boolean) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, selected: checked } : file
      )
    );
    
    // Update selectAll state
    const updatedFiles = files.map(file => 
      file.id === id ? { ...file, selected: checked } : file
    );
    
    const allSelected = updatedFiles.every(file => file.selected);
    const noneSelected = updatedFiles.every(file => !file.selected);
    
    if (allSelected) {
      setSelectAll(true);
    } else if (noneSelected) {
      setSelectAll(false);
    }
  };
  
  // Handle pagination change
  const handlePaginationChange = ({ page, pageSize }: { page: number; pageSize: number }) => {
    setPage(page);
    setPageSize(pageSize);
  };
  
  // Format time for display
  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
          Batch Processing
        </h3>
        
        <div className="flex space-x-2">
          <Button
            kind="tertiary"
            renderIcon={ChartBar}
            onClick={() => setShowStatsModal(true)}
            size="sm"
          >
            Statistics
          </Button>
          
          <Button
            kind="tertiary"
            renderIcon={SettingsAdjust}
            onClick={() => setShowSettingsModal(true)}
            size="sm"
          >
            Settings
          </Button>
          
          <Button
            renderIcon={FolderAdd}
            onClick={() => setShowAddFilesModal(true)}
          >
            Add Files
          </Button>
        </div>
      </div>
      
      {/* Batch Status */}
      <Tile className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-carbon-gray-100 dark:text-white mb-1">
              Batch Status
            </h4>
            <div className="flex space-x-4">
              <div className="text-sm">
                <span className="text-carbon-gray-70 dark:text-carbon-gray-30">Total Files:</span>{' '}
                <span className="font-medium">{files.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-carbon-gray-70 dark:text-carbon-gray-30">Queued:</span>{' '}
                <span className="font-medium">{files.filter(f => f.status === 'queued').length}</span>
              </div>
              <div className="text-sm">
                <span className="text-carbon-gray-70 dark:text-carbon-gray-30">Processing:</span>{' '}
                <span className="font-medium">{files.filter(f => f.status === 'processing').length}</span>
              </div>
              <div className="text-sm">
                <span className="text-carbon-gray-70 dark:text-carbon-gray-30">Completed:</span>{' '}
                <span className="font-medium text-green-600">{files.filter(f => f.status === 'completed').length}</span>
              </div>
              <div className="text-sm">
                <span className="text-carbon-gray-70 dark:text-carbon-gray-30">Failed:</span>{' '}
                <span className="font-medium text-red-600">{files.filter(f => f.status === 'failed').length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {files.some(f => f.selected) && (
              <Button
                kind="danger--ghost"
                renderIcon={TrashCan}
                onClick={removeSelectedFiles}
                size="sm"
              >
                Remove Selected
              </Button>
            )}
            
            {!isProcessing && files.some(f => f.status === 'queued') && (
              <Button
                renderIcon={Play}
                onClick={startProcessing}
              >
                Start Processing
              </Button>
            )}
            
            {isProcessing && !isPaused && (
              <>
                <Button
                  kind="tertiary"
                  renderIcon={Pause}
                  onClick={pauseProcessing}
                >
                  Pause
                </Button>
                <Button
                  kind="danger"
                  renderIcon={StopFilled}
                  onClick={stopProcessing}
                >
                  Stop
                </Button>
              </>
            )}
            
            {isProcessing && isPaused && (
              <>
                <Button
                  kind="primary"
                  renderIcon={Play}
                  onClick={resumeProcessing}
                >
                  Resume
                </Button>
                <Button
                  kind="danger"
                  renderIcon={StopFilled}
                  onClick={stopProcessing}
                >
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Overall Progress */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm">
                {files.filter(f => f.status === 'completed' || f.status === 'failed').length} / {files.length} files
              </span>
            </div>
            <ProgressBar
              value={Math.round(
                (files.filter(f => f.status === 'completed' || f.status === 'failed').length / Math.max(files.length, 1)) * 100
              )}
              max={100}
              helperText={isPaused ? 'Paused' : undefined}
              status={isPaused ? 'paused' : undefined}
            />
          </div>
        )}
      </Tile>
      
      {/* File List */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <Checkbox
            id="select-all-files"
            labelText=""
            checked={selectAll}
            onChange={(_, { checked }) => handleSelectAll(checked)}
            className="mr-2"
          />
          <span className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
            {files.filter(f => f.selected).length} selected
          </span>
        </div>
        
        <Search
          id="search-files"
          labelText=""
          placeHolderText="Search files..."
          size="sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {files.length === 0 ? (
        <Tile className="text-center p-8">
          <DocumentPdf size={48} className="mx-auto mb-4 text-carbon-gray-50" />
          <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
            No files added to the batch. Click "Add Files" to begin.
          </p>
          <Button
            renderIcon={Add}
            onClick={() => setShowAddFilesModal(true)}
          >
            Add Files
          </Button>
        </Tile>
      ) : (
        <div>
          <DataTable rows={paginatedFiles} headers={[
            { key: 'checkbox', header: '' },
            { key: 'file', header: 'File' },
            { key: 'status', header: 'Status' },
            { key: 'progress', header: 'Progress' },
            { key: 'added', header: 'Added' },
            { key: 'output', header: 'Output' },
            { key: 'actions', header: 'Actions' }
          ]}>
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()} size="lg">
                  <TableHead>
                    <TableRow>
                      {headers.map((header, i) => (
                        <TableHeader key={i} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, i) => {
                      const file = filteredFiles[i + (page - 1) * pageSize];
                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          <TableCell>
                            <Checkbox
                              id={`select-file-${file.id}`}
                              labelText=""
                              hideLabel
                              checked={file.selected}
                              onChange={(_, { checked }) => handleSelectFile(file.id, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DocumentPdf size={20} className="mr-2 text-carbon-gray-70" />
                              <div>
                                <div className="font-medium text-carbon-gray-100 dark:text-white">
                                  {file.file.name}
                                </div>
                                <div className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                                  {Math.round(file.file.size / 1024)} KB
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {file.status === 'queued' && (
                              <Tag type="gray">Queued</Tag>
                            )}
                            {file.status === 'processing' && (
                              <Tag type="blue">Processing</Tag>
                            )}
                            {file.status === 'completed' && (
                              <Tag type="green">Completed</Tag>
                            )}
                            {file.status === 'failed' && (
                              <Tag type="red">Failed</Tag>
                            )}
                            {file.status === 'paused' && (
                              <Tag type="purple">Paused</Tag>
                            )}
                          </TableCell>
                          <TableCell>
                            {file.status === 'processing' ? (
                              <ProgressBar
                                value={file.progress}
                                max={100}
                                size="sm"
                                hideLabel
                                helperText=""
                              />
                            ) : file.status === 'completed' ? (
                              <div className="flex items-center text-green-600">
                                <Checkmark size={16} className="mr-1" />
                                <span>100%</span>
                              </div>
                            ) : file.status === 'failed' ? (
                              <div className="flex items-center text-red-600">
                                <Error size={16} className="mr-1" />
                                <span>Failed</span>
                              </div>
                            ) : (
                              <span className="text-carbon-gray-70 dark:text-carbon-gray-30">
                                {file.progress}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(file.addedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {file.status === 'completed' ? (
                              <div className="flex items-center">
                                <Tag type="blue">{file.outputFormat?.toUpperCase()}</Tag>
                                <span className="ml-2 text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                                  {file.tableCount} table{file.tableCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : file.status === 'failed' ? (
                              <div className="text-sm text-red-600">
                                {file.error || 'Processing failed'}
                              </div>
                            ) : (
                              <span className="text-carbon-gray-70 dark:text-carbon-gray-30">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex">
                              {file.status === 'completed' && (
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  renderIcon={Download}
                                  iconDescription="Download"
                                  hasIconOnly
                                  tooltipPosition="bottom"
                                  tooltipAlignment="center"
                                  onClick={() => {
                                    // Simulate download in demo
                                    alert(`Downloading output for ${file.file.name}`);
                                  }}
                                />
                              )}
                              {file.status === 'failed' && (
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  renderIcon={Task}
                                  iconDescription="View Error Details"
                                  hasIconOnly
                                  tooltipPosition="bottom"
                                  tooltipAlignment="center"
                                  onClick={() => {
                                    setSelectedFile(file);
                                    // Show error details modal
                                  }}
                                />
                              )}
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={TrashCan}
                                iconDescription="Remove"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => {
                                  setFiles(prevFiles => 
                                    prevFiles.filter(f => f.id !== file.id)
                                  );
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          
          {/* Pagination */}
          <div className="mt-4 flex justify-end">
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={[10, 20, 50]}
              totalItems={filteredFiles.length}
              onChange={handlePaginationChange}
            />
          </div>
        </div>
      )}
      
      {/* Add Files Modal */}
      <Modal
        open={showAddFilesModal}
        modalHeading="Add Files to Batch"
        primaryButtonText="Add Files"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => fileInputRef.current?.click()}
        onRequestClose={() => setShowAddFilesModal(false)}
      >
        <div className="p-4">
          <p className="mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
            Select PDF files to add to the batch processing queue. You can select multiple files at once.
          </p>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
          />
          
          <div className="border-2 border-dashed p-8 rounded-lg text-center cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <Upload size={48} className="mx-auto mb-4 text-carbon-gray-70" />
            <p className="mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
              Click to select files or drag and drop PDF files here
            </p>
            <Button>Browse Files</Button>
          </div>
        </div>
      </Modal>
      
      {/* Batch Settings Modal */}
      <Modal
        open={showSettingsModal}
        modalHeading="Batch Processing Settings"
        primaryButtonText="Apply Settings"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => setShowSettingsModal(false)}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <div className="p-4">
          <h4 className="font-medium text-carbon-gray-100 dark:text-white mb-4">
            Output Format Settings
          </h4>
          
          <div className="space-y-4 mb-6">
            <Dropdown
              id="output-format"
              titleText="Output Format"
              label="Select format"
              items={[
                { id: 'csv', text: 'CSV (Comma Separated Values)' },
                { id: 'xlsx', text: 'Excel Workbook (XLSX)' },
                { id: 'sage', text: 'Sage Accounting Format' }
              ]}
              selectedItem={{ 
                id: conversionOptions.format, 
                text: conversionOptions.format === 'csv' 
                  ? 'CSV (Comma Separated Values)'
                  : conversionOptions.format === 'xlsx'
                  ? 'Excel Workbook (XLSX)'
                  : 'Sage Accounting Format'
              }}
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  setConversionOptions({
                    ...conversionOptions,
                    format: selectedItem.id as 'csv' | 'xlsx' | 'sage'
                  });
                }
              }}
            />
            
            {conversionOptions.format === 'csv' && (
              <TextInput
                id="csv-delimiter"
                labelText="CSV Delimiter"
                value={conversionOptions.delimiter || ','}
                onChange={(e) => setConversionOptions({
                  ...conversionOptions,
                  delimiter: e.target.value
                })}
              />
            )}
            
            {conversionOptions.format === 'xlsx' && (
              <TextInput
                id="sheet-name"
                labelText="Default Sheet Name"
                value={conversionOptions.sheet_name || 'Sheet1'}
                onChange={(e) => setConversionOptions({
                  ...conversionOptions,
                  sheet_name: e.target.value
                })}
              />
            )}
            
            <Checkbox
              id="include-headers"
              labelText="Include Headers"
              checked={conversionOptions.include_headers !== false}
              onChange={(_, { checked }) => setConversionOptions({
                ...conversionOptions,
                include_headers: checked
              })}
            />
          </div>
          
          <h4 className="font-medium text-carbon-gray-100 dark:text-white mb-4">
            Batch Processing Settings
          </h4>
          
          <div className="space-y-4">
            <TextInput
              id="max-concurrent"
              labelText="Maximum Concurrent Processes"
              type="number"
              min={1}
              max={10}
              value="1"
              helperText="Number of files to process simultaneously"
            />
            
            <Checkbox
              id="auto-start"
              labelText="Automatically Start Processing When Files Are Added"
              checked={false}
            />
            
            <Checkbox
              id="auto-download"
              labelText="Automatically Download Results When Complete"
              checked={false}
            />
            
            <Checkbox
              id="stop-on-error"
              labelText="Stop Batch Processing on First Error"
              checked={false}
            />
          </div>
        </div>
      </Modal>
      
      {/* Batch Stats Modal */}
      <Modal
        open={showStatsModal}
        modalHeading="Batch Processing Statistics"
        primaryButtonText="Close"
        onRequestSubmit={() => setShowStatsModal(false)}
        onRequestClose={() => setShowStatsModal(false)}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Tile>
              <h5 className="text-sm font-medium mb-1 text-carbon-gray-70 dark:text-carbon-gray-30">
                Total Files
              </h5>
              <p className="text-2xl font-bold">{batchStats.totalFiles}</p>
            </Tile>
            
            <Tile>
              <h5 className="text-sm font-medium mb-1 text-carbon-gray-70 dark:text-carbon-gray-30">
                Completed Files
              </h5>
              <p className="text-2xl font-bold text-green-600">{batchStats.completedFiles}</p>
            </Tile>
            
            <Tile>
              <h5 className="text-sm font-medium mb-1 text-carbon-gray-70 dark:text-carbon-gray-30">
                Failed Files
              </h5>
              <p className="text-2xl font-bold text-red-600">{batchStats.failedFiles}</p>
            </Tile>
            
            <Tile>
              <h5 className="text-sm font-medium mb-1 text-carbon-gray-70 dark:text-carbon-gray-30">
                Total Tables Extracted
              </h5>
              <p className="text-2xl font-bold">{batchStats.totalTables}</p>
            </Tile>
            
            <Tile>
              <h5 className="text-sm font-medium mb-1 text-carbon-gray-70 dark:text-carbon-gray-30">
                Avg. Processing Time
              </h5>
              <p className="text-2xl font-bold">{formatTime(batchStats.averageProcessingTime)}</p>
            </Tile>
            
            <Tile>
              <h5 className="text-sm font-medium mb-1 text-carbon-gray-70 dark:text-carbon-gray-30">
                Total Processing Time
              </h5>
              <p className="text-2xl font-bold">{formatTime(batchStats.totalProcessingTime)}</p>
            </Tile>
          </div>
          
          <h4 className="font-medium text-carbon-gray-100 dark:text-white mb-4">
            Completion Rate
          </h4>
          
          <ProgressBar
            value={batchStats.completedFiles}
            max={Math.max(batchStats.totalFiles, 1)}
            labelText="Completion"
            helperText={`${batchStats.completedFiles} of ${batchStats.totalFiles} files completed`}
          />
          
          <div className="mt-6">
            <h4 className="font-medium text-carbon-gray-100 dark:text-white mb-4">
              Status Distribution
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-32 text-sm">Completed</div>
                <div className="flex-grow">
                  <ProgressBar
                    value={batchStats.completedFiles}
                    max={Math.max(batchStats.totalFiles, 1)}
                    labelText=""
                    hideLabel
                    helperText=""
                    status="active"
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {batchStats.totalFiles ? Math.round((batchStats.completedFiles / batchStats.totalFiles) * 100) : 0}%
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-32 text-sm">Failed</div>
                <div className="flex-grow">
                  <ProgressBar
                    value={batchStats.failedFiles}
                    max={Math.max(batchStats.totalFiles, 1)}
                    labelText=""
                    hideLabel
                    helperText=""
                    status="error"
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {batchStats.totalFiles ? Math.round((batchStats.failedFiles / batchStats.totalFiles) * 100) : 0}%
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-32 text-sm">In Progress</div>
                <div className="flex-grow">
                  <ProgressBar
                    value={files.filter(f => f.status === 'processing').length}
                    max={Math.max(batchStats.totalFiles, 1)}
                    labelText=""
                    hideLabel
                    helperText=""
                    status="active"
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {batchStats.totalFiles ? Math.round((files.filter(f => f.status === 'processing').length / batchStats.totalFiles) * 100) : 0}%
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-32 text-sm">Queued</div>
                <div className="flex-grow">
                  <ProgressBar
                    value={files.filter(f => f.status === 'queued').length}
                    max={Math.max(batchStats.totalFiles, 1)}
                    labelText=""
                    hideLabel
                    helperText=""
                    status="inactive"
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {batchStats.totalFiles ? Math.round((files.filter(f => f.status === 'queued').length / batchStats.totalFiles) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchProcessor;