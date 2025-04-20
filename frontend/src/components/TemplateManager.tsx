// File: frontend/src/components/TemplateManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  TextInput,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  InlineLoading,
  ToastNotification,
  RadioButtonGroup,
  RadioButton,
  Select,
  SelectItem,
  Checkbox,
  NumberInput,
  TextArea,
  Dropdown
} from '@carbon/react';
import { Add, Edit, TrashCan, Save, Download, Copy } from '@carbon/icons-react';
import { ConversionOptions } from '../../types';

interface ConversionTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  options: ConversionOptions;
  columnMappings?: Record<string, string>;
  documentType: string;
}

interface TemplateManagerProps {
  onApplyTemplate: (template: ConversionTemplate) => void;
  availableColumns?: string[];
  documentName?: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onApplyTemplate, 
  availableColumns = [],
  documentName = ''
}) => {
  const [templates, setTemplates] = useState<ConversionTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConversionTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<ConversionTemplate>>({
    name: '',
    description: '',
    documentType: 'invoice',
    options: {
      format: 'csv',
      delimiter: ',',
      sheet_name: 'Sheet1',
      include_headers: true,
      skip_rows: 0
    },
    columnMappings: {}
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  
  const documentTypes = [
    { id: 'invoice', text: 'Invoice' },
    { id: 'statement', text: 'Bank Statement' },
    { id: 'receipt', text: 'Receipt' },
    { id: 'report', text: 'Financial Report' },
    { id: 'other', text: 'Other' }
  ];
  
  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('fileflip-templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    }
  }, []);
  
  // Save templates to localStorage when updated
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('fileflip-templates', JSON.stringify(templates));
    }
  }, [templates]);
  
  // Find matching templates for current document
  const findMatchingTemplates = (): ConversionTemplate[] => {
    if (!documentName) return templates;
    
    return templates.filter(template => {
      // Check if document name contains the template document type
      return documentName.toLowerCase().includes(template.documentType.toLowerCase());
    });
  };
  
  const matchingTemplates = findMatchingTemplates();
  
  const handleCreateTemplate = () => {
    setLoading(true);
    
    setTimeout(() => {
      const newTemplateWithId: ConversionTemplate = {
        id: `template_${Date.now()}`,
        name: newTemplate.name || 'Untitled Template',
        description: newTemplate.description || '',
        documentType: newTemplate.documentType || 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        options: newTemplate.options as ConversionOptions,
        columnMappings: newTemplate.columnMappings || {}
      };
      
      setTemplates([...templates, newTemplateWithId]);
      setNewTemplate({
        name: '',
        description: '',
        documentType: 'invoice',
        options: {
          format: 'csv',
          delimiter: ',',
          sheet_name: 'Sheet1',
          include_headers: true,
          skip_rows: 0
        },
        columnMappings: {}
      });
      
      setNotification({
        type: 'success',
        title: 'Template Created',
        message: `Template "${newTemplateWithId.name}" has been created successfully.`
      });
      
      setIsCreateModalOpen(false);
      setLoading(false);
    }, 500);
  };
  
  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    
    setTimeout(() => {
      const updatedTemplates = templates.map(template => 
        template.id === selectedTemplate.id 
          ? { ...selectedTemplate, updatedAt: new Date().toISOString() } 
          : template
      );
      
      setTemplates(updatedTemplates);
      
      setNotification({
        type: 'success',
        title: 'Template Updated',
        message: `Template "${selectedTemplate.name}" has been updated successfully.`
      });
      
      setIsEditModalOpen(false);
      setLoading(false);
    }, 500);
  };
  
  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    
    setTimeout(() => {
      const filteredTemplates = templates.filter(
        template => template.id !== selectedTemplate.id
      );
      
      setTemplates(filteredTemplates);
      
      setNotification({
        type: 'info',
        title: 'Template Deleted',
        message: `Template "${selectedTemplate.name}" has been deleted.`
      });
      
      setIsDeleteModalOpen(false);
      setLoading(false);
    }, 500);
  };
  
  const handleDuplicateTemplate = (template: ConversionTemplate) => {
    const duplicated: ConversionTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTemplates([...templates, duplicated]);
    
    setNotification({
      type: 'success',
      title: 'Template Duplicated',
      message: `Template "${template.name}" has been duplicated.`
    });
  };
  
  const openEditModal = (template: ConversionTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };
  
  const openDeleteModal = (template: ConversionTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
          Conversion Templates
        </h3>
        <Button 
          renderIcon={Add} 
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Template
        </Button>
      </div>
      
      {notification && (
        <ToastNotification
          kind={notification.type}
          title={notification.title}
          subtitle={notification.message}
          timeout={3000}
          onClose={() => setNotification(null)}
          className="mb-4"
        />
      )}
      
      {templates.length === 0 ? (
        <div className="p-8 border border-dashed border-carbon-gray-30 dark:border-carbon-gray-70 rounded-lg text-center">
          <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
            No templates found. Create a template to save your conversion settings for reuse.
          </p>
          <Button 
            renderIcon={Add} 
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create First Template
          </Button>
        </div>
      ) : (
        <>
          {matchingTemplates.length > 0 && documentName && (
            <div className="mb-4 p-4 bg-carbon-blue-10 dark:bg-carbon-blue-90 rounded-lg border border-carbon-blue-30 dark:border-carbon-blue-70">
              <h4 className="font-medium mb-2 text-carbon-gray-100 dark:text-white">
                Suggested Templates for "{documentName}"
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchingTemplates.map(template => (
                  <Button 
                    key={template.id}
                    kind="tertiary"
                    size="sm"
                    onClick={() => onApplyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        
          <DataTable rows={templates} headers={[
            { key: 'name', header: 'Name' },
            { key: 'documentType', header: 'Document Type' },
            { key: 'format', header: 'Format' },
            { key: 'updatedAt', header: 'Last Modified' },
            { key: 'actions', header: 'Actions' }
          ]}>
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
                      const template = templates.find(t => t.id === row.id);
                      if (!template) return null;
                      
                      return (
                        <TableRow {...getRowProps({ row })}>
                          <TableCell>
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                                {template.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tag type="blue">
                              {documentTypes.find(dt => dt.id === template.documentType)?.text || template.documentType}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            <Tag type={
                              template.options.format === 'csv' ? 'green' :
                              template.options.format === 'xlsx' ? 'purple' : 'teal'
                            }>
                              {template.options.format.toUpperCase()}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            {formatDate(template.updatedAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex">
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Download}
                                iconDescription="Apply Template"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => onApplyTemplate(template)}
                              />
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Edit}
                                iconDescription="Edit Template"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => openEditModal(template)}
                              />
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Copy}
                                iconDescription="Duplicate Template"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => handleDuplicateTemplate(template)}
                              />
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={TrashCan}
                                iconDescription="Delete Template"
                                hasIconOnly
                                tooltipPosition="bottom"
                                tooltipAlignment="center"
                                onClick={() => openDeleteModal(template)}
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
        </>
      )}
      
      {/* Create Template Modal */}
      <Modal
        open={isCreateModalOpen}
        modalHeading="Create Conversion Template"
        primaryButtonText={loading ? "Creating..." : "Create Template"}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleCreateTemplate}
        onRequestClose={() => setIsCreateModalOpen(false)}
        primaryButtonDisabled={loading || !newTemplate.name}
      >
        {loading ? (
          <div className="p-8 flex justify-center">
            <InlineLoading description="Creating template..." />
          </div>
        ) : (
          <div className="p-4">
            <TextInput
              id="template-name"
              labelText="Template Name"
              placeholder="Enter a name for this template"
              value={newTemplate.name || ''}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              className="mb-4"
              required
            />
            
            <TextArea
              id="template-description"
              labelText="Description"
              placeholder="Optional description for this template"
              value={newTemplate.description || ''}
              onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
              className="mb-4"
            />
            
            <Select
              id="document-type"
              labelText="Document Type"
              value={newTemplate.documentType || 'invoice'}
              onChange={(e) => setNewTemplate({...newTemplate, documentType: e.target.value})}
              className="mb-4"
            >
              {documentTypes.map(type => (
                <SelectItem key={type.id} value={type.id} text={type.text} />
              ))}
            </Select>
            
            <h4 className="text-sm font-medium mb-2 mt-4">Output Format</h4>
            <RadioButtonGroup
              name="format"
              valueSelected={newTemplate.options?.format || 'csv'}
              onChange={(value) => setNewTemplate({
                ...newTemplate, 
                options: {...(newTemplate.options || {}), format: value as 'csv' | 'xlsx' | 'sage'}
              })}
              className="mb-4"
            >
              <RadioButton id="format-csv" labelText="CSV" value="csv" />
              <RadioButton id="format-xlsx" labelText="Excel (XLSX)" value="xlsx" />
              <RadioButton id="format-sage" labelText="Sage Format" value="sage" />
            </RadioButtonGroup>
            
            {newTemplate.options?.format === 'csv' && (
              <TextInput
                id="csv-delimiter"
                labelText="CSV Delimiter"
                value={newTemplate.options?.delimiter || ','}
                onChange={(e) => setNewTemplate({
                  ...newTemplate, 
                  options: {...(newTemplate.options || {}), delimiter: e.target.value}
                })}
                className="mb-4"
              />
            )}
            
            {newTemplate.options?.format === 'xlsx' && (
              <TextInput
                id="sheet-name"
                labelText="Sheet Name"
                value={newTemplate.options?.sheet_name || 'Sheet1'}
                onChange={(e) => setNewTemplate({
                  ...newTemplate, 
                  options: {...(newTemplate.options || {}), sheet_name: e.target.value}
                })}
                className="mb-4"
              />
            )}
            
            <Checkbox
              id="include-headers"
              labelText="Include Headers"
              checked={newTemplate.options?.include_headers !== false}
              onChange={(_, { checked }) => setNewTemplate({
                ...newTemplate, 
                options: {...(newTemplate.options || {}), include_headers: checked}
              })}
              className="mb-4"
            />
            
            <NumberInput
              id="skip-rows"
              label="Skip Rows"
              min={0}
              value={newTemplate.options?.skip_rows || 0}
              onChange={(e, { value }) => setNewTemplate({
                ...newTemplate, 
                options: {...(newTemplate.options || {}), skip_rows: value}
              })}
              helperText="Number of rows to skip from the beginning"
              className="mb-4"
            />
            
            {availableColumns.length > 0 && (
              <>
                <h4 className="text-sm font-medium mb-2 mt-4">Column Mappings</h4>
                <p className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
                  Map columns from the extracted table to standard fields for this template.
                </p>
                
                {['Description', 'Amount', 'Date', 'Reference', 'Account'].map(targetField => (
                  <div key={targetField} className="mb-4">
                    <Select
                      id={`mapping-${targetField}`}
                      labelText={`Map to ${targetField}`}
                      value={newTemplate.columnMappings?.[targetField] || ''}
                      onChange={(e) => {
                        const updatedMappings = {
                          ...(newTemplate.columnMappings || {}),
                          [targetField]: e.target.value
                        };
                        setNewTemplate({
                          ...newTemplate,
                          columnMappings: updatedMappings
                        });
                      }}
                      helperText={`Select which column corresponds to ${targetField}`}
                    >
                      <SelectItem value="" text="-- None --" />
                      {availableColumns.map(column => (
                        <SelectItem key={column} value={column} text={column} />
                      ))}
                    </Select>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
      
      {/* Edit Template Modal */}
      <Modal
        open={isEditModalOpen}
        modalHeading="Edit Conversion Template"
        primaryButtonText={loading ? "Updating..." : "Update Template"}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleUpdateTemplate}
        onRequestClose={() => setIsEditModalOpen(false)}
        primaryButtonDisabled={loading || !selectedTemplate?.name}
      >
        {loading ? (
          <div className="p-8 flex justify-center">
            <InlineLoading description="Updating template..." />
          </div>
        ) : selectedTemplate && (
          <div className="p-4">
            <TextInput
              id="edit-template-name"
              labelText="Template Name"
              placeholder="Enter a name for this template"
              value={selectedTemplate.name}
              onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
              className="mb-4"
              required
            />
            
            <TextArea
              id="edit-template-description"
              labelText="Description"
              placeholder="Optional description for this template"
              value={selectedTemplate.description}
              onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
              className="mb-4"
            />
            
            <Select
              id="edit-document-type"
              labelText="Document Type"
              value={selectedTemplate.documentType}
              onChange={(e) => setSelectedTemplate({...selectedTemplate, documentType: e.target.value})}
              className="mb-4"
            >
              {documentTypes.map(type => (
                <SelectItem key={type.id} value={type.id} text={type.text} />
              ))}
            </Select>
            
            <h4 className="text-sm font-medium mb-2 mt-4">Output Format</h4>
            <RadioButtonGroup
              name="edit-format"
              valueSelected={selectedTemplate.options.format}
              onChange={(value) => setSelectedTemplate({
                ...selectedTemplate, 
                options: {...selectedTemplate.options, format: value as 'csv' | 'xlsx' | 'sage'}
              })}
              className="mb-4"
            >
              <RadioButton id="edit-format-csv" labelText="CSV" value="csv" />
              <RadioButton id="edit-format-xlsx" labelText="Excel (XLSX)" value="xlsx" />
              <RadioButton id="edit-format-sage" labelText="Sage Format" value="sage" />
            </RadioButtonGroup>
            
            {selectedTemplate.options.format === 'csv' && (
              <TextInput
                id="edit-csv-delimiter"
                labelText="CSV Delimiter"
                value={selectedTemplate.options.delimiter || ','}
                onChange={(e) => setSelectedTemplate({
                  ...selectedTemplate, 
                  options: {...selectedTemplate.options, delimiter: e.target.value}
                })}
                className="mb-4"
              />
            )}
            
            {selectedTemplate.options.format === 'xlsx' && (
              <TextInput
                id="edit-sheet-name"
                labelText="Sheet Name"
                value={selectedTemplate.options.sheet_name || 'Sheet1'}
                onChange={(e) => setSelectedTemplate({
                  ...selectedTemplate, 
                  options: {...selectedTemplate.options, sheet_name: e.target.value}
                })}
                className="mb-4"
              />
            )}
            
            <Checkbox
              id="edit-include-headers"
              labelText="Include Headers"
              checked={selectedTemplate.options.include_headers !== false}
              onChange={(_, { checked }) => setSelectedTemplate({
                ...selectedTemplate, 
                options: {...selectedTemplate.options, include_headers: checked}
              })}
              className="mb-4"
            />
            
            <NumberInput
              id="edit-skip-rows"
              label="Skip Rows"
              min={0}
              value={selectedTemplate.options.skip_rows || 0}
              onChange={(e, { value }) => setSelectedTemplate({
                ...selectedTemplate, 
                options: {...selectedTemplate.options, skip_rows: value}
              })}
              helperText="Number of rows to skip from the beginning"
              className="mb-4"
            />
            
            {availableColumns.length > 0 && (
              <>
                <h4 className="text-sm font-medium mb-2 mt-4">Column Mappings</h4>
                <p className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
                  Map columns from the extracted table to standard fields for this template.
                </p>
                
                {['Description', 'Amount', 'Date', 'Reference', 'Account'].map(targetField => (
                  <div key={targetField} className="mb-4">
                    <Select
                      id={`edit-mapping-${targetField}`}
                      labelText={`Map to ${targetField}`}
                      value={selectedTemplate.columnMappings?.[targetField] || ''}
                      onChange={(e) => {
                        const updatedMappings = {
                          ...(selectedTemplate.columnMappings || {}),
                          [targetField]: e.target.value
                        };
                        setSelectedTemplate({
                          ...selectedTemplate,
                          columnMappings: updatedMappings
                        });
                      }}
                      helperText={`Select which column corresponds to ${targetField}`}
                    >
                      <SelectItem value="" text="-- None --" />
                      {availableColumns.map(column => (
                        <SelectItem key={column} value={column} text={column} />
                      ))}
                    </Select>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        modalHeading="Delete Template"
        danger
        primaryButtonText={loading ? "Deleting..." : "Delete"}
        secondaryButtonText="Cancel"
        onRequestSubmit={handleDeleteTemplate}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        primaryButtonDisabled={loading}
      >
        {selectedTemplate && (
          <p className="p-4">
            Are you sure you want to delete the template "{selectedTemplate.name}"? This action cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default TemplateManager;