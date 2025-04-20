// File: frontend/src/components/ExportHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Tag,
  ComboBox,
  Modal,
  Loading,
  SkeletonText,
  Pagination,
  Search,
  TooltipIcon,
  Tooltip
} from '@carbon/react';
import { Download, Information, TrashCan, DocumentPdf, ViewFilled, Calendar } from '@carbon/icons-react';
import { formatDistanceToNow } from 'date-fns';

interface ExportRecord {
  id: string;
  filename: string;
  format: 'csv' | 'xlsx' | 'sage';
  exportDate: string;
  fileSize: number;
  documentName: string;
  success: boolean;
  downloadUrl?: string;
}

interface ExportHistoryProps {
  onReapply?: (exportRecord: ExportRecord) => void;
}

const ExportHistory: React.FC<ExportHistoryProps> = ({ onReapply }) => {
  const [exportRecords, setExportRecords] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<string | null>(null);

  // Load export history from localStorage
  useEffect(() => {
    const loadExportHistory = async () => {
      setLoading(true);
      try {
        // In a real application, this would be an API call
        // For this example, we'll simulate loading from localStorage
        const savedHistory = localStorage.getItem('fileflip-export-history');
        
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory) as ExportRecord[];
          setExportRecords(parsed);
          setTotalItems(parsed.length);
        } else {
          // Generate sample data if none exists
          const sampleData = generateSampleExportHistory();
          setExportRecords(sampleData);
          setTotalItems(sampleData.length);
          localStorage.setItem('fileflip-export-history', JSON.stringify(sampleData));
        }
      } catch (error) {
        console.error('Failed to load export history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExportHistory();
  }, []);

  const generateSampleExportHistory = (): ExportRecord[] => {
    const formats = ['csv', 'xlsx', 'sage'] as const;
    const sample: ExportRecord[] = [];

    // Generate 20 sample records
    for (let i = 1; i <= 20; i++) {
      const format = formats[Math.floor(Math.random() * formats.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
      
      sample.push({
        id: `export_${i}`,
        filename: `export_${i}_${format}.${format}`,
        format,
        exportDate: date.toISOString(),
        fileSize: Math.floor(Math.random() * 5000000) + 1000, // Random size between 1KB and 5MB
        documentName: `Sample Invoice ${i}.pdf`,
        success: Math.random() > 0.1, // 10% chance of failure for demonstration
        downloadUrl: `#sample-download-${i}` // Placeholder URL
      });
    }

    return sample;
  };

  const handleDownload = (record: ExportRecord) => {
    // In a real application, this would trigger a file download
    // For this example, we'll just show an alert
    alert(`Downloading ${record.filename}`);
  };

  const handleDelete = () => {
    if (!selectedRecord) return;

    // Remove the record from state
    const updatedRecords = exportRecords.filter(record => record.id !== selectedRecord.id);
    setExportRecords(updatedRecords);
    setTotalItems(updatedRecords.length);
    
    // Update localStorage
    localStorage.setItem('fileflip-export-history', JSON.stringify(updatedRecords));
    
    // Close the modal
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  };

  const handleViewDetails = (record: ExportRecord) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  const handleReapplySettings = () => {
    if (selectedRecord && onReapply) {
      onReapply(selectedRecord);
      setIsDetailsModalOpen(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handlePageChange = ({ page, pageSize }: { page: number; pageSize: number }) => {
    setPage(page);
    setPageSize(pageSize);
  };

  // Filter records based on search query and format filter
  const filteredRecords = exportRecords.filter(record => {
    const matchesSearch = !searchQuery || 
      record.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.documentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFormat = !formatFilter || record.format === formatFilter;
    
    return matchesSearch && matchesFormat;
  });

  // Paginate records
  const startIndex = (page - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  const headers = [
    { key: 'filename', header: 'Filename' },
    { key: 'format', header: 'Format' },
    { key: 'exportDate', header: 'Export Date' },
    { key: 'fileSize', header: 'Size' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' }
  ];

  const formatOptions = [
    { id: 'csv', text: 'CSV' },
    { id: 'xlsx', text: 'Excel (XLSX)' },
    { id: 'sage', text: 'Sage Format' }
  ];

  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
          Export History
        </h3>
        
        <div className="flex gap-2">
          <Search
            labelText="Search exports"
            placeholder="Search by filename or document name"
            size="sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          
          <ComboBox
            id="format-filter"
            titleText=""
            placeholder="Filter by format"
            items={formatOptions}
            itemToString={(item) => (item ? item.text : '')}
            onChange={({ selectedItem }) => setFormatFilter(selectedItem?.id || null)}
            size="sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="border rounded-lg p-4">
          <SkeletonText heading={false} lineCount={10} />
        </div>
      ) : exportRecords.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-carbon-gray-30 dark:border-carbon-gray-70 rounded-lg">
          <DocumentPdf size={32} className="mx-auto mb-4 text-carbon-gray-50" />
          <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
            No export history available. Your exports will appear here.
          </p>
        </div>
      ) : (
        <>
          <DataTable rows={paginatedRecords} headers={headers}>
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map(header => (
                        <TableHeader {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => {
                      const record = exportRecords.find(r => r.id === row.id);
                      if (!record) return null;
                      
                      return (
                        <TableRow {...getRowProps({ row })}>
                          <TableCell>
                            <div className="flex items-center">
                              {record.format === 'csv' && <span className="mr-2 text-carbon-gray-70">📄</span>}
                              {record.format === 'xlsx' && <span className="mr-2 text-carbon-gray-70">📊</span>}
                              {record.format === 'sage' && <span className="mr-2 text-carbon-gray-70">📚</span>}
                              <div>
                                <div className="font-medium">{record.filename}</div>
                                <div className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                                  {record.documentName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tag type={
                              record.format === 'csv' ? 'green' :
                              record.format === 'xlsx' ? 'blue' : 'purple'
                            }>
                              {record.format.toUpperCase()}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-1 text-carbon-gray-70" />
                              <span title={formatDate(record.exportDate)}>
                                {formatDistanceToNow(new Date(record.exportDate), { addSuffix: true })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatBytes(record.fileSize)}
                          </TableCell>
                          <TableCell>
                            <Tag type={record.success ? 'green' : 'red'}>
                              {record.success ? 'Completed' : 'Failed'}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            <div className="flex">
                              {record.success && (
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  renderIcon={Download}
                                  iconDescription="Download"
                                  hasIconOnly
                                  tooltipPosition="bottom"
                                  tooltipAlignment="center"
                                  onClick={() => handleDownload(record)}
                                />
                              )}
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={ViewFilled}
                                iconDescription="View Details"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => handleViewDetails(record)}
                              />
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={TrashCan}
                                iconDescription="Delete"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setIsDeleteModalOpen(true);
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
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
              Showing {Math.min(startIndex + 1, filteredRecords.length)} to {Math.min(startIndex + pageSize, filteredRecords.length)} of {filteredRecords.length} exports
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={[10, 20, 50]}
              totalItems={filteredRecords.length}
              onChange={handlePageChange}
            />
          </div>
        </>
      )}
      
      {/* Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        modalHeading="Export Details"
        primaryButtonText={onReapply ? "Reapply Settings" : undefined}
        secondaryButtonText="Close"
        onRequestSubmit={handleReapplySettings}
        onRequestClose={() => setIsDetailsModalOpen(false)}
      >
        {selectedRecord && (
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Document</h4>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">{selectedRecord.documentName}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Exported File</h4>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">{selectedRecord.filename}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Format</h4>
              <Tag type={
                selectedRecord.format === 'csv' ? 'green' :
                selectedRecord.format === 'xlsx' ? 'blue' : 'purple'
              }>
                {selectedRecord.format.toUpperCase()}
              </Tag>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Export Date</h4>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">{formatDate(selectedRecord.exportDate)}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">File Size</h4>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">{formatBytes(selectedRecord.fileSize)}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Status</h4>
              <Tag type={selectedRecord.success ? 'green' : 'red'}>
                {selectedRecord.success ? 'Completed' : 'Failed'}
              </Tag>
            </div>
            
            {selectedRecord.success && (
              <div className="mt-6">
                <Button
                  renderIcon={Download}
                  onClick={() => handleDownload(selectedRecord)}
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        modalHeading="Delete Export Record"
        danger
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleDelete}
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        {selectedRecord && (
          <p className="p-4">
            Are you sure you want to delete the export record for "{selectedRecord.filename}"? This action cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
};

// File: frontend/src/components/UsageAnalytics.tsx
import React, { useState, useEffect } from 'react';
import {
  Tile,
  AreaChart,
  LineChart,
  PieChart,
  BarChart,
  StackedBarChart
} from '@carbon/charts-react';
import '@carbon/charts/styles.css';
import { Grid, Column, Select, SelectItem, Dropdown } from '@carbon/react';

interface UsageData {
  totalConversions: number;
  totalFiles: number;
  conversionsPerFormat: {
    csv: number;
    xlsx: number;
    sage: number;
  };
  conversionsByDate: Array<{
    date: string;
    count: number;
    format: string;
  }>;
  averageFileSize: number;
  conversionSuccess: number;
  conversionFailures: number;
  popularDocumentTypes: Array<{
    type: string;
    count: number;
  }>;
}

const UsageAnalytics: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // In a real application, this would be an API call with the timeRange parameter
        // For this example, we'll generate sample data
        const data = generateSampleAnalytics(parseInt(timeRange));
        setUsageData(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  const generateSampleAnalytics = (days: number): UsageData => {
    // Generate sample conversions by date
    const conversionsByDate: Array<{ date: string; count: number; format: string }> = [];
    const formats = ['csv', 'xlsx', 'sage'];
    
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      formats.forEach(format => {
        // More CSV than others, with some randomness
        const baseCount = format === 'csv' ? 5 : format === 'xlsx' ? 3 : 1;
        const count = Math.floor(Math.random() * baseCount) + (format === 'csv' ? 3 : 1);
        
        conversionsByDate.push({
          date: dateStr,
          count,
          format
        });
      });
    }
    
    // Calculate totals
    const csvCount = conversionsByDate.filter(item => item.format === 'csv').reduce((sum, item) => sum + item.count, 0);
    const xlsxCount = conversionsByDate.filter(item => item.format === 'xlsx').reduce((sum, item) => sum + item.count, 0);
    const sageCount = conversionsByDate.filter(item => item.format === 'sage').reduce((sum, item) => sum + item.count, 0);
    
    const totalConversions = csvCount + xlsxCount + sageCount;
    
    // Generate sample document types
    const documentTypes = [
      { type: 'Invoice', count: Math.floor(totalConversions * 0.4) },
      { type: 'Bank Statement', count: Math.floor(totalConversions * 0.25) },
      { type: 'Receipt', count: Math.floor(totalConversions * 0.15) },
      { type: 'Report', count: Math.floor(totalConversions * 0.1) },
      { type: 'Other', count: Math.floor(totalConversions * 0.1) }
    ];
    
    return {
      totalConversions,
      totalFiles: Math.floor(totalConversions * 0.7), // Some files have multiple conversions
      conversionsPerFormat: {
        csv: csvCount,
        xlsx: xlsxCount,
        sage: sageCount
      },
      conversionsByDate,
      averageFileSize: Math.floor(Math.random() * 1000000) + 500000, // Random file size average
      conversionSuccess: Math.floor(totalConversions * 0.95), // 95% success rate
      conversionFailures: Math.floor(totalConversions * 0.05), // 5% failure rate
      popularDocumentTypes: documentTypes
    };
  };

  // Prepare chart data
  const getConversionsByDateData = () => {
    if (!usageData) return { data: [] };
    
    // Group by date first, then format
    const groupedData = usageData.conversionsByDate.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {
          date: item.date,
          csv: 0,
          xlsx: 0,
          sage: 0
        };
      }
      
      acc[item.date][item.format] += item.count;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by date
    const chartData = Object.values(groupedData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return {
      data: chartData,
      options: {
        title: 'Conversions Over Time',
        axes: {
          left: {
            title: 'Number of Conversions',
            mapsTo: 'value'
          },
          bottom: {
            title: 'Date',
            mapsTo: 'date',
            scaleType: 'time'
          }
        },
        curve: 'curveMonotoneX',
        height: '400px'
      }
    };
  };

  const getFormatDistributionData = () => {
    if (!usageData) return { data: [] };
    
    const data = [
      {
        group: 'Format Distribution',
        key: 'CSV',
        value: usageData.conversionsPerFormat.csv
      },
      {
        group: 'Format Distribution',
        key: 'Excel (XLSX)',
        value: usageData.conversionsPerFormat.xlsx
      },
      {
        group: 'Format Distribution',
        key: 'Sage',
        value: usageData.conversionsPerFormat.sage
      }
    ];
    
    return {
      data,
      options: {
        title: 'Conversions by Format',
        resizable: true,
        height: '400px',
        color: {
          scale: {
            'CSV': '#00A78F',
            'Excel (XLSX)': '#4589FF',
            'Sage': '#8A3FFC'
          }
        }
      }
    };
  };

  const getDocumentTypesData = () => {
    if (!usageData) return { data: [] };
    
    const data = usageData.popularDocumentTypes.map(item => ({
      group: 'Document Types',
      key: item.type,
      value: item.count
    }));
    
    return {
      data,
      options: {
        title: 'Popular Document Types',
        resizable: true,
        height: '400px'
      }
    };
  };

  const getSuccessRateData = () => {
    if (!usageData) return { data: [] };
    
    const data = [
      {
        group: 'Conversion Results',
        key: 'Success',
        value: usageData.conversionSuccess
      },
      {
        group: 'Conversion Results',
        key: 'Failure',
        value: usageData.conversionFailures
      }
    ];
    
    return {
      data,
      options: {
        title: 'Conversion Success Rate',
        resizable: true,
        height: '400px',
        color: {
          scale: {
            'Success': '#24A148',
            'Failure': '#DA1E28'
          }
        }
      }
    };
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
          Usage Analytics
        </h3>
        
        <div className="flex items-center">
          <p className="mr-2 text-carbon-gray-70 dark:text-carbon-gray-30">Time Range:</p>
          <Select
            id="time-range"
            labelText=""
            hideLabel
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <SelectItem value="7" text="Last 7 days" />
            <SelectItem value="30" text="Last 30 days" />
            <SelectItem value="90" text="Last 90 days" />
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center p-8">
          <Loading description="Loading analytics..." withOverlay={false} />
        </div>
      ) : usageData && (
        <>
          {/* Summary Cards */}
          <Grid fullWidth className="mb-6">
            <Column lg={4} md={4} sm={4}>
              <Tile className="h-full">
                <h4 className="text-sm font-medium mb-2 text-carbon-gray-70 dark:text-carbon-gray-30">
                  Total Conversions
                </h4>
                <p className="text-3xl font-bold text-carbon-gray-100 dark:text-white">
                  {usageData.totalConversions}
                </p>
              </Tile>
            </Column>
            
            <Column lg={4} md={4} sm={4}>
              <Tile className="h-full">
                <h4 className="text-sm font-medium mb-2 text-carbon-gray-70 dark:text-carbon-gray-30">
                  Files Processed
                </h4>
                <p className="text-3xl font-bold text-carbon-gray-100 dark:text-white">
                  {usageData.totalFiles}
                </p>
              </Tile>
            </Column>
            
            <Column lg={4} md={4} sm={4}>
              <Tile className="h-full">
                <h4 className="text-sm font-medium mb-2 text-carbon-gray-70 dark:text-carbon-gray-30">
                  Average File Size
                </h4>
                <p className="text-3xl font-bold text-carbon-gray-100 dark:text-white">
                  {formatBytes(usageData.averageFileSize)}
                </p>
              </Tile>
            </Column>
          </Grid>
          
          {/* Charts */}
          <Grid fullWidth className="mb-6">
            <Column lg={12} md={8} sm={4}>
              <Tile>
                <LineChart
                  data={getConversionsByDateData().data}
                  options={{
                    ...getConversionsByDateData().options,
                    theme: 'g100'
                  }}
                />
              </Tile>
            </Column>
          </Grid>
          
          <Grid fullWidth className="mb-6">
            <Column lg={6} md={4} sm={4}>
              <Tile>
                <PieChart
                  data={getFormatDistributionData().data}
                  options={{
                    ...getFormatDistributionData().options,
                    theme: 'g100'
                  }}
                />
              </Tile>
            </Column>
            
            <Column lg={6} md={4} sm={4}>
              <Tile>
                <PieChart
                  data={getSuccessRateData().data}
                  options={{
                    ...getSuccessRateData().options,
                    theme: 'g100'
                  }}
                />
              </Tile>
            </Column>
          </Grid>
          
          <Grid fullWidth>
            <Column lg={12} md={8} sm={4}>
              <Tile>
                <BarChart
                  data={getDocumentTypesData().data}
                  options={{
                    ...getDocumentTypesData().options,
                    theme: 'g100'
                  }}
                />
              </Tile>
            </Column>
          </Grid>
        </>
      )}
    </div>
  );
};

export default UsageAnalytics;
