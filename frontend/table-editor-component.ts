// File: frontend/src/components/TableEditor.tsx
import React, { useState, useEffect } from 'react';
import { DataTable, TableToolbar, TableToolbarContent, TableToolbarSearch, Button, Modal, TextInput, Select, SelectItem, InlineLoading, Tag } from '@carbon/react';
import { Edit, Save, TrashCan, Add, ArrowUp, ArrowDown } from '@carbon/icons-react';
import { TablePreview } from '../types';

interface TableEditorProps {
  table: TablePreview;
  onSave: (updatedData: Record<string, any>[]) => void;
}

const TableEditor: React.FC<TableEditorProps> = ({ table, onSave }) => {
  const [editedData, setEditedData] = useState<Record<string, any>[]>([...table.preview_data]);
  const [originalData] = useState<Record<string, any>[]>([...table.preview_data]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, columnKey: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [columnOrder, setColumnOrder] = useState<string[]>([...table.column_names]);
  const [dataTypes, setDataTypes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Infer data types on initial load
  useEffect(() => {
    const inferredTypes = inferDataTypes(table.preview_data, table.column_names);
    setDataTypes(inferredTypes);
  }, [table]);

  // Function to infer data types from data
  const inferDataTypes = (data: Record<string, any>[], columns: string[]): Record<string, string> => {
    const types: Record<string, string> = {};
    
    columns.forEach(column => {
      // Get non-empty values for this column
      const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) {
        types[column] = 'text';
        return;
      }
      
      // Check if all values are numbers
      const allNumbers = values.every(val => {
        const parsed = parseFloat(String(val).replace(/,/g, ''));
        return !isNaN(parsed);
      });
      
      if (allNumbers) {
        types[column] = 'number';
        return;
      }
      
      // Check if all values are dates
      const allDates = values.every(val => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      });
      
      if (allDates) {
        types[column] = 'date';
        return;
      }
      
      // Default to text
      types[column] = 'text';
    });
    
    return types;
  };

  const handleEditStart = (rowIndex: number, columnKey: string, value: any) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(String(value));
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditSave = () => {
    if (!editingCell) return;

    const { rowIndex, columnKey } = editingCell;
    const newData = [...editedData];
    
    // Convert value based on column type
    let convertedValue = editValue;
    if (dataTypes[columnKey] === 'number') {
      convertedValue = parseFloat(editValue.replace(/,/g, ''));
      if (isNaN(convertedValue)) convertedValue = 0;
    }
    
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnKey]: convertedValue
    };
    
    setEditedData(newData);
    setEditingCell(null);
    setEditValue('');
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    
    // Add the new column to all rows with empty values
    const newData = editedData.map(row => ({
      ...row,
      [newColumnName]: ''
    }));
    
    setEditedData(newData);
    setColumnOrder([...columnOrder, newColumnName]);
    setDataTypes({
      ...dataTypes,
      [newColumnName]: 'text'
    });
    
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  const handleDeleteColumn = (columnKey: string) => {
    // Remove the column from all rows
    const newData = editedData.map(row => {
      const newRow = { ...row };
      delete newRow[columnKey];
      return newRow;
    });
    
    setEditedData(newData);
    setColumnOrder(columnOrder.filter(col => col !== columnKey));
    
    const newDataTypes = { ...dataTypes };
    delete newDataTypes[columnKey];
    setDataTypes(newDataTypes);
  };

  const handleMoveColumn = (columnKey: string, direction: 'up' | 'down') => {
    const currentIndex = columnOrder.indexOf(columnKey);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === columnOrder.length - 1)
    ) {
      return;
    }
    
    const newColumnOrder = [...columnOrder];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap columns
    [newColumnOrder[currentIndex], newColumnOrder[targetIndex]] = 
      [newColumnOrder[targetIndex], newColumnOrder[currentIndex]];
    
    setColumnOrder(newColumnOrder);
  };

  const handleChangeDataType = (columnKey: string, newType: string) => {
    setDataTypes({
      ...dataTypes,
      [columnKey]: newType
    });
    
    // Convert existing values if needed
    if (newType === 'number') {
      const newData = editedData.map(row => ({
        ...row,
        [columnKey]: typeof row[columnKey] === 'string' 
          ? parseFloat(row[columnKey].replace(/,/g, '')) || 0 
          : row[columnKey]
      }));
      setEditedData(newData);
    }
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    
    // Convert all values according to their data types
    const processedData = editedData.map(row => {
      const newRow: Record<string, any> = {};
      
      Object.keys(row).forEach(key => {
        if (dataTypes[key] === 'number' && typeof row[key] === 'string') {
          newRow[key] = parseFloat(row[key].replace(/,/g, '')) || 0;
        } else if (dataTypes[key] === 'date' && typeof row[key] === 'string') {
          try {
            newRow[key] = new Date(row[key]).toISOString().split('T')[0];
          } catch (e) {
            newRow[key] = row[key];
          }
        } else {
          newRow[key] = row[key];
        }
      });
      
      return newRow;
    });
    
    // Simulate async save
    setTimeout(() => {
      onSave(processedData);
      setIsSaving(false);
      setIsEditing(false);
    }, 500);
  };

  const handleDiscardChanges = () => {
    setEditedData([...originalData]);
    setColumnOrder([...table.column_names]);
    setIsEditing(false);
  };

  // Create headers based on column order
  const headers = columnOrder.map(col => ({
    key: col,
    header: col,
    type: dataTypes[col] || 'text'
  }));

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white mr-4">
            Table Editor
          </h3>
          {Object.entries(dataTypes).map(([col, type]) => (
            <Tag 
              key={col} 
              type={type === 'number' ? 'blue' : type === 'date' ? 'green' : 'gray'}
              className="mr-2"
            >
              {col}: {type}
            </Tag>
          ))}
        </div>
        
        {isEditing ? (
          <div className="flex items-center">
            {isSaving ? (
              <InlineLoading description="Saving changes..." />
            ) : (
              <>
                <Button 
                  kind="secondary" 
                  size="sm" 
                  onClick={handleDiscardChanges}
                  className="mr-2"
                >
                  Discard
                </Button>
                <Button 
                  renderIcon={Save} 
                  size="sm" 
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        ) : (
          <Button 
            renderIcon={Edit} 
            onClick={() => setIsEditing(true)}
          >
            Edit Table
          </Button>
        )}
      </div>
      
      <DataTable rows={editedData} headers={headers}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <div className="overflow-x-auto">
            <TableToolbar>
              <TableToolbarContent>
                {isEditing && (
                  <Button 
                    renderIcon={Add} 
                    size="sm" 
                    kind="ghost" 
                    onClick={() => setIsAddingColumn(true)}
                  >
                    Add Column
                  </Button>
                )}
                <TableToolbarSearch onChange={() => {}} />
              </TableToolbarContent>
            </TableToolbar>
            
            <table {...getTableProps()} className="w-full border-collapse">
              <thead>
                <tr>
                  {headers.map(header => (
                    <th 
                      key={header.key} 
                      {...getHeaderProps({ header })}
                      className="bg-carbon-gray-10 dark:bg-carbon-gray-90 text-left p-2 border border-carbon-gray-20 dark:border-carbon-gray-80"
                    >
                      <div className="flex items-center">
                        {header.header}
                        
                        {isEditing && (
                          <div className="flex ml-2">
                            <button 
                              onClick={() => handleMoveColumn(header.key, 'up')}
                              className="p-1 text-carbon-gray-70 hover:text-carbon-blue-60"
                              disabled={columnOrder.indexOf(header.key) === 0}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => handleMoveColumn(header.key, 'down')}
                              className="p-1 text-carbon-gray-70 hover:text-carbon-blue-60"
                              disabled={columnOrder.indexOf(header.key) === columnOrder.length - 1}
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteColumn(header.key)}
                              className="p-1 text-carbon-gray-70 hover:text-carbon-red-60"
                            >
                              <TrashCan size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="mt-1">
                          <Select 
                            id={`type-${header.key}`}
                            labelText="" 
                            hideLabel
                            size="sm"
                            value={dataTypes[header.key] || 'text'}
                            onChange={(e) => handleChangeDataType(header.key, e.target.value)}
                          >
                            <SelectItem value="text" text="Text" />
                            <SelectItem value="number" text="Number" />
                            <SelectItem value="date" text="Date" />
                          </Select>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} {...getRowProps({ row })}>
                    {row.cells.map(cell => (
                      <td 
                        key={cell.id}
                        className="p-2 border border-carbon-gray-20 dark:border-carbon-gray-80"
                      >
                        {isEditing && editingCell?.rowIndex === row.id && editingCell?.columnKey === cell.info.header.key ? (
                          <div className="flex">
                            <TextInput
                              id={`cell-${cell.id}`}
                              size="sm"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                              onBlur={handleEditSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className={`${isEditing ? 'cursor-pointer hover:bg-carbon-gray-10 dark:hover:bg-carbon-gray-80' : ''} p-1 ${
                              dataTypes[cell.info.header.key] === 'number' ? 'text-right' : ''
                            }`}
                            onClick={() => isEditing && handleEditStart(row.id, cell.info.header.key, cell.value)}
                          >
                            {cell.value}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTable>
      
      {/* Add Column Modal */}
      <Modal
        open={isAddingColumn}
        modalHeading="Add New Column"
        primaryButtonText="Add"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleAddColumn}
        onRequestClose={() => setIsAddingColumn(false)}
      >
        <TextInput
          id="new-column-name"
          labelText="Column Name"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="Enter column name"
        />
      </Modal>
    </div>
  );
};

export default TableEditor;
