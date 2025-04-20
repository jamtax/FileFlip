// File: frontend/src/components/FieldMappingDesigner.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Tile,
  Tag,
  TextInput,
  Dropdown,
  Modal,
  Grid,
  Column,
  Toggle,
  Search,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  OverflowMenu,
  OverflowMenuItem,
  InlineNotification,
  ToastNotification,
  // FormGroup,
  Checkbox,
  // CodeSnippet,
  Tabs,
  Tab,
  Accordion,
  AccordionItem
} from '@carbon/react';
import {
  ArrowRight,
  // Edit,
  Add,
  TrashCan,
  Save,
  Upload,
  Download,
  // Settings,
  DocumentExport,
  DocumentImport,
  // ChartColumn,
  // DataBase,
  // Copy,
  // FilterEdit,
  // Warning,
  // Information,
  // Checkmark,
  Chart_3D,
  Chart3D
} from '@carbon/icons-react';
// Ensure the correct path or create a placeholder type if the module is missing
interface TablePreview {
  column_names: string[];
  preview_data: Record<string, any>[];
}

interface FieldMapping {
  id: string;
  name: string;
  description: string;
  sourceColumn: string;
  targetField: string;
  targetSystem: string;
  transformations: Transformation[];
  required: boolean;
  validationRules: ValidationRule[];
  defaultValue?: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  active: boolean;
  isCustom: boolean;
  fallbackColumns?: string[];
}

interface Transformation {
  id: string;
  type: 'replace' | 'concat' | 'substring' | 'format' | 'math' | 'lookup' | 'conditional' | 'custom';
  displayName: string;
  config: Record<string, any>;
  order: number;
  active: boolean;
}

interface ValidationRule {
  id: string;
  type: 'required' | 'format' | 'range' | 'regex' | 'custom';
  config: Record<string, any>;
  errorMessage: string;
  severity: 'error' | 'warning';
  active: boolean;
}

interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  targetSystem: string;
  mappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  documentType?: string;
  compatibilityScore?: number;
}

interface SystemField {
  id: string;
  name: string;
  description: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  system: string;
  category: string;
  format?: string;
  example?: string;
}

interface TargetSystem {
  id: string;
  name: string;
  type: 'accounting' | 'crm' | 'erp' | 'custom';
  fields: SystemField[];
  documentTypes?: string[];
}

interface FieldMappingDesignerProps {
  table?: TablePreview;
  targetSystems?: TargetSystem[];
  onMappingChange?: (mappings: FieldMapping[]) => void;
  onTemplateSave?: (template: MappingTemplate) => void;
}

const FieldMappingDesigner: React.FC<FieldMappingDesignerProps> = ({
  table,
  targetSystems = [],
  onMappingChange,
  onTemplateSave
}) => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<MappingTemplate | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTemplateListModalOpen, setIsTemplateListModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTargetSystem, setSelectedTargetSystem] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMappings, setFilteredMappings] = useState<FieldMapping[]>([]);
  const [activeTab, setActiveTab] = useState('mappings');
  const [newMapping, setNewMapping] = useState<Partial<FieldMapping>>({
    name: '',
    description: '',
    sourceColumn: '',
    targetField: '',
    targetSystem: '',
    transformations: [],
    required: false,
    validationRules: [],
    dataType: 'string',
    active: true,
    isCustom: false
  });
  const [tempTransformation, setTempTransformation] = useState<Partial<Transformation>>({
    type: 'replace',
    displayName: 'Replace Text',
    config: {},
    order: 0,
    active: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sample target systems if none provided
  const defaultTargetSystems: TargetSystem[] = [
    {
      id: 'sage',
      name: 'Sage Accounting',
      type: 'accounting',
      fields: [
        {
          id: 'description',
          name: 'Description',
          description: 'Transaction description or narrative',
          dataType: 'string',
          required: true,
          system: 'sage',
          category: 'transaction',
          example: 'Invoice payment for services'
        },
        {
          id: 'reference',
          name: 'Reference',
          description: 'Invoice or transaction reference number',
          dataType: 'string',
          required: true,
          system: 'sage',
          category: 'transaction',
          example: 'INV-2023-001'
        },
        {
          id: 'date',
          name: 'Transaction Date',
          description: 'Date of the transaction',
          dataType: 'date',
          required: true,
          system: 'sage',
          category: 'transaction',
          format: 'YYYY-MM-DD',
          example: '2023-04-15'
        },
        {
          id: 'amount',
          name: 'Amount',
          description: 'Transaction amount (positive for debit, negative for credit)',
          dataType: 'number',
          required: true,
          system: 'sage',
          category: 'transaction',
          example: '1250.75'
        },
        {
          id: 'account_code',
          name: 'Account Code',
          description: 'GL account code',
          dataType: 'string',
          required: true,
          system: 'sage',
          category: 'accounting',
          example: '4000'
        },
        {
          id: 'tax_code',
          name: 'Tax Code',
          description: 'Tax code for the transaction',
          dataType: 'string',
          required: false,
          system: 'sage',
          category: 'taxation',
          example: 'T1'
        },
        {
          id: 'contact_name',
          name: 'Contact Name',
          description: 'Name of the contact or customer',
          dataType: 'string',
          required: false,
          system: 'sage',
          category: 'customer',
          example: 'ACME Corporation'
        }
      ],
      documentTypes: ['invoice', 'receipt', 'statement']
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      type: 'accounting',
      fields: [
        {
          id: 'memo',
          name: 'Memo',
          description: 'Transaction description or memo',
          dataType: 'string',
          required: true,
          system: 'quickbooks',
          category: 'transaction',
          example: 'Monthly service fee'
        },
        {
          id: 'doc_number',
          name: 'Document Number',
          description: 'Invoice or document reference number',
          dataType: 'string',
          required: true,
          system: 'quickbooks',
          category: 'transaction',
          example: 'INV-2023-001'
        },
        {
          id: 'txn_date',
          name: 'Transaction Date',
          description: 'Date of the transaction',
          dataType: 'date',
          required: true,
          system: 'quickbooks',
          category: 'transaction',
          format: 'MM/DD/YYYY',
          example: '04/15/2023'
        },
        {
          id: 'amount',
          name: 'Amount',
          description: 'Transaction amount',
          dataType: 'number',
          required: true,
          system: 'quickbooks',
          category: 'transaction',
          example: '1250.75'
        },
        {
          id: 'account_number',
          name: 'Account Number',
          description: 'GL account number',
          dataType: 'string',
          required: true,
          system: 'quickbooks',
          category: 'accounting',
          example: '40000'
        }
      ],
      documentTypes: ['invoice', 'receipt', 'bill']
    },
    {
      id: 'custom',
      name: 'Custom Export',
      type: 'custom',
      fields: [
        {
          id: 'field1',
          name: 'Field 1',
          description: 'Custom field 1',
          dataType: 'string',
          required: false,
          system: 'custom',
          category: 'custom'
        },
        {
          id: 'field2',
          name: 'Field 2',
          description: 'Custom field 2',
          dataType: 'string',
          required: false,
          system: 'custom',
          category: 'custom'
        },
        {
          id: 'field3',
          name: 'Field 3',
          description: 'Custom field 3',
          dataType: 'string',
          required: false,
          system: 'custom',
          category: 'custom'
        }
      ]
    }
  ];
  
  const effectiveTargetSystems = targetSystems.length > 0 ? targetSystems : defaultTargetSystems;
  
  // Sample templates
  const sampleTemplates: MappingTemplate[] = [
    {
      id: 'template_1',
      name: 'Standard Invoice to Sage',
      description: 'Maps standard invoice fields to Sage Accounting',
      targetSystem: 'sage',
      mappings: [
        {
          id: 'mapping_1',
          name: 'Invoice Description',
          description: 'Maps description or details field to Sage description',
          sourceColumn: 'Description',
          targetField: 'description',
          targetSystem: 'sage',
          transformations: [],
          required: true,
          validationRules: [],
          dataType: 'string',
          active: true,
          isCustom: false
        },
        {
          id: 'mapping_2',
          name: 'Invoice Number',
          description: 'Maps invoice number to Sage reference',
          sourceColumn: 'Invoice Number',
          targetField: 'reference',
          targetSystem: 'sage',
          transformations: [],
          required: true,
          validationRules: [],
          dataType: 'string',
          active: true,
          isCustom: false,
          fallbackColumns: ['Reference', 'Invoice No', 'No.']
        },
        {
          id: 'mapping_3',
          name: 'Invoice Date',
          description: 'Maps invoice date to Sage transaction date',
          sourceColumn: 'Date',
          targetField: 'date',
          targetSystem: 'sage',
          transformations: [
            {
              id: 'transform_1',
              type: 'format',
              displayName: 'Format Date',
              config: {
                inputFormat: 'auto',
                outputFormat: 'YYYY-MM-DD'
              },
              order: 0,
              active: true
            }
          ],
          required: true,
          validationRules: [
            {
              id: 'validation_1',
              type: 'format',
              config: {
                format: 'date'
              },
              errorMessage: 'Invalid date format',
              severity: 'error',
              active: true
            }
          ],
          dataType: 'date',
          format: 'YYYY-MM-DD',
          active: true,
          isCustom: false,
          fallbackColumns: ['Invoice Date', 'Transaction Date']
        },
        {
          id: 'mapping_4',
          name: 'Invoice Amount',
          description: 'Maps invoice amount to Sage amount',
          sourceColumn: 'Amount',
          targetField: 'amount',
          targetSystem: 'sage',
          transformations: [
            {
              id: 'transform_2',
              type: 'replace',
              displayName: 'Remove Currency Symbols',
              config: {
                find: '[$£€]',
                replace: '',
                useRegex: true
              },
              order: 0,
              active: true
            }
          ],
          required: true,
          validationRules: [
            {
              id: 'validation_2',
              type: 'format',
              config: {
                format: 'number'
              },
              errorMessage: 'Amount must be a number',
              severity: 'error',
              active: true
            }
          ],
          dataType: 'number',
          active: true,
          isCustom: false,
          fallbackColumns: ['Total', 'Amount (inc. VAT)', 'Grand Total']
        }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isDefault: true,
      documentType: 'invoice'
    },
    {
      id: 'template_2',
      name: 'Bank Statement to QuickBooks',
      description: 'Maps bank statement to QuickBooks format',
      targetSystem: 'quickbooks',
      mappings: [
        {
          id: 'mapping_5',
          name: 'Transaction Description',
          description: 'Maps description field to QuickBooks memo',
          sourceColumn: 'Description',
          targetField: 'memo',
          targetSystem: 'quickbooks',
          transformations: [],
          required: true,
          validationRules: [],
          dataType: 'string',
          active: true,
          isCustom: false,
          fallbackColumns: ['Narrative', 'Details', 'Transaction Details']
        },
        {
          id: 'mapping_6',
          name: 'Reference Number',
          description: 'Maps reference to QuickBooks document number',
          sourceColumn: 'Reference',
          targetField: 'doc_number',
          targetSystem: 'quickbooks',
          transformations: [],
          required: false,
          validationRules: [],
          dataType: 'string',
          active: true,
          isCustom: false,
          fallbackColumns: ['Ref', 'Transaction Ref']
        },
        {
          id: 'mapping_7',
          name: 'Transaction Date',
          description: 'Maps date to QuickBooks transaction date',
          sourceColumn: 'Date',
          targetField: 'txn_date',
          targetSystem: 'quickbooks',
          transformations: [
            {
              id: 'transform_3',
              type: 'format',
              displayName: 'Format Date',
              config: {
                inputFormat: 'auto',
                outputFormat: 'MM/DD/YYYY'
              },
              order: 0,
              active: true
            }
          ],
          required: true,
          validationRules: [],
          dataType: 'date',
          format: 'MM/DD/YYYY',
          active: true,
          isCustom: false,
          fallbackColumns: ['Transaction Date', 'Posting Date']
        },
        {
          id: 'mapping_8',
          name: 'Amount',
          description: 'Maps amount to QuickBooks amount',
          sourceColumn: 'Amount',
          targetField: 'amount',
          targetSystem: 'quickbooks',
          transformations: [],
          required: true,
          validationRules: [],
          dataType: 'number',
          active: true,
          isCustom: false,
          fallbackColumns: ['Debit', 'Credit', 'Value']
        }
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isDefault: false,
      documentType: 'bank_statement'
    }
  ];
  
  // Load templates and initialize on mount
  useEffect(() => {
    // In a real app, fetch from API or localStorage
    const savedTemplates = localStorage.getItem('fileflip-mapping-templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates(sampleTemplates);
      }
    } else {
      setTemplates(sampleTemplates);
    }
    
    // Initialize with empty mappings
    setMappings([]);
    
    // Sample preview data from table if available
    if (table && table.preview_data) {
      setPreviewData(table.preview_data);
    }
  }, []);
  
  // Filter mappings when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMappings(mappings);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = mappings.filter(mapping => 
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
      setFilteredMappings(filtered);
    }
  }, [searchQuery, mappings]);
  
  // Generate field mapping suggestions when table or target system changes
  useEffect(() => {
    if (table && selectedTargetSystem && showSuggestions) {
      generateMappingSuggestions();
    }
  }, [table, selectedTargetSystem, showSuggestions]);
  
  // Generate mapping suggestions based on column names and target system
  const generateMappingSuggestions = () => {
    if (!table || !selectedTargetSystem) return;
    
    const targetSystem = effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem);
    if (!targetSystem) return;
    
    // Clear existing mappings if we're starting fresh
    if (mappings.length === 0) {
      const suggestedMappings: FieldMapping[] = [];
      
      // Try to find matching templates first
      const matchingTemplate = findMatchingTemplate(table.column_names, selectedTargetSystem);
      
      if (matchingTemplate) {
        // Use the template mappings as a base
        const adaptedMappings = adaptTemplateMappings(matchingTemplate, table.column_names);
        setMappings(adaptedMappings);
        setFilteredMappings(adaptedMappings);
        setCurrentTemplate(matchingTemplate);
        
        setNotification({
          type: 'success',
          title: 'Template Applied',
          message: `Applied "${matchingTemplate.name}" template with ${adaptedMappings.length} field mappings.`
        });
        
        return;
      }
      
      // If no template matches, generate mappings from scratch
      // For each target field, try to find a matching source column
      targetSystem.fields.forEach(field => {
        const match = findMatchingSourceColumn(field, table.column_names);
        
        if (match) {
          // Create a new mapping
          const newMapping: FieldMapping = {
            id: `mapping_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: field.name,
            description: `Maps ${match} to ${field.name}`,
            sourceColumn: match,
            targetField: field.id,
            targetSystem: targetSystem.id,
            transformations: [],
            required: field.required,
            validationRules: [],
            dataType: field.dataType,
            format: field.format,
            active: true,
            isCustom: false
          };
          
          // Add format transformation for dates
          if (field.dataType === 'date' && field.format) {
            newMapping.transformations.push({
              id: `transform_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: 'format',
              displayName: 'Format Date',
              config: {
                inputFormat: 'auto',
                outputFormat: field.format
              },
              order: 0,
              active: true
            });
          }
          
          // Add validation based on data type
          if (field.required) {
            newMapping.validationRules.push({
              id: `validation_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: 'required',
              config: {},
              errorMessage: `${field.name} is required`,
              severity: 'error',
              active: true
            });
          }
          
          if (field.dataType === 'number') {
            newMapping.validationRules.push({
              id: `validation_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: 'format',
              config: {
                format: 'number'
              },
              errorMessage: `${field.name} must be a number`,
              severity: 'error',
              active: true
            });
            
            // Add transformation to handle currency symbols
            newMapping.transformations.push({
              id: `transform_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: 'replace',
              displayName: 'Remove Currency Symbols',
              config: {
                find: '[$£€]',
                replace: '',
                useRegex: true
              },
              order: 0,
              active: true
            });
          }
          
          suggestedMappings.push(newMapping);
        }
      });
      
      if (suggestedMappings.length > 0) {
        setMappings(suggestedMappings);
        setFilteredMappings(suggestedMappings);
        
        setNotification({
          type: 'info',
          title: 'Mappings Suggested',
          message: `${suggestedMappings.length} field mappings have been suggested based on column names.`
        });
      }
    }
  };
  
  // Find a matching source column for a target field
  const findMatchingSourceColumn = (field: SystemField, columns: string[]): string | null => {
    // Convert the field name and alternatives to lowercase for case-insensitive matching
    const fieldNameLower = field.name.toLowerCase();
    const fieldIdLower = field.id.toLowerCase();
    
    // Try direct matches first
    for (const column of columns) {
      const columnLower = column.toLowerCase();
      
      // Check for exact matches or close matches
      if (
        columnLower === fieldNameLower ||
        columnLower === fieldIdLower ||
        columnLower.replace(/\s+/g, '') === fieldNameLower.replace(/\s+/g, '') ||
        columnLower.replace(/[_-]/g, '') === fieldNameLower.replace(/\s+/g, '')
      ) {
        return column;
      }
    }
    
    // Try partial matches
    const commonMappings: Record<string, string[]> = {
      'amount': ['total', 'sum', 'value', 'price', 'cost', 'net', 'gross', 'inc', 'excl'],
      'date': ['date', 'time', 'day', 'when'],
      'description': ['desc', 'narration', 'narrative', 'details', 'particular', 'item'],
      'reference': ['ref', 'invoice', 'no', 'number', 'transaction', 'id'],
      'contact': ['customer', 'supplier', 'vendor', 'client', 'name', 'company'],
      'account': ['acc', 'gl', 'ledger', 'nominal', 'category']
    };
    
    // Check if field matches any of our common mapping categories
    const matchingCategory = Object.keys(commonMappings).find(category => 
      fieldIdLower.includes(category) || fieldNameLower.includes(category)
    );
    
    if (matchingCategory) {
      const keywordsToMatch = commonMappings[matchingCategory];
      
      // Look for columns containing these keywords
      for (const keyword of keywordsToMatch) {
        const matchingColumn = columns.find(column => 
          column.toLowerCase().includes(keyword)
        );
        
        if (matchingColumn) {
          return matchingColumn;
        }
      }
    }
    
    return null;
  };
  
  // Find a matching template for the current table and target system
  const findMatchingTemplate = (columns: string[], targetSystemId: string): MappingTemplate | null => {
    const matchingTemplates = templates.filter(template => 
      template.targetSystem === targetSystemId
    );
    
    if (matchingTemplates.length === 0) return null;
    
    // Score each template based on how many of its mappings match the available columns
    const scoredTemplates = matchingTemplates.map(template => {
      let matchScore = 0;
      let totalMappings = template.mappings.length;
      
      template.mappings.forEach(mapping => {
        // Check if source column exists in our columns
        if (columns.includes(mapping.sourceColumn)) {
          matchScore += 1;
        } else if (mapping.fallbackColumns) {
          // Check fallback columns
          const hasFallback = mapping.fallbackColumns.some(fallback => 
            columns.includes(fallback)
          );
          
          if (hasFallback) {
            matchScore += 0.8; // Slightly lower score for fallback matches
          }
        }
      });
      
      const score = (matchScore / totalMappings) * 100;
      
      return {
        ...template,
        compatibilityScore: score
      };
    });
    
    // Sort by score descending
    scoredTemplates.sort((a, b) => 
      (b.compatibilityScore || 0) - (a.compatibilityScore || 0)
    );
    
    // Use the highest scoring template if it has at least 50% match
    if (scoredTemplates.length > 0 && (scoredTemplates[0].compatibilityScore || 0) >= 50) {
      return scoredTemplates[0];
    }
    
    return null;
  };
  
  // Adapt template mappings to the current table columns
  const adaptTemplateMappings = (template: MappingTemplate, columns: string[]): FieldMapping[] => {
    return template.mappings.map(mapping => {
      // Check if the source column exists
      if (columns.includes(mapping.sourceColumn)) {
        // Use the mapping as is
        return {
          ...mapping,
          id: `mapping_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };
      } else if (mapping.fallbackColumns) {
        // Try fallback columns
        const fallbackColumn = mapping.fallbackColumns.find(fallback => 
          columns.includes(fallback)
        );
        
        if (fallbackColumn) {
          return {
            ...mapping,
            id: `mapping_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            sourceColumn: fallbackColumn,
            description: `Maps ${fallbackColumn} to ${mapping.targetField} (auto-adapted)`
          };
        }
      }
      
      // If no match, keep the mapping but mark it inactive
      return {
        ...mapping,
        id: `mapping_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        active: false,
        description: `${mapping.description} (needs configuration)`
      };
    });
  };
  
  // Create a new mapping
  const handleCreateMapping = () => {
    if (!newMapping.name || !newMapping.sourceColumn || !newMapping.targetField) {
      setNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    const createdMapping: FieldMapping = {
      id: `mapping_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: newMapping.name || '',
      description: newMapping.description || '',
      sourceColumn: newMapping.sourceColumn || '',
      targetField: newMapping.targetField || '',
      targetSystem: newMapping.targetSystem || selectedTargetSystem,
      transformations: newMapping.transformations || [],
      required: newMapping.required || false,
      validationRules: newMapping.validationRules || [],
      dataType: newMapping.dataType as FieldMapping['dataType'] || 'string',
      format: newMapping.format,
      active: newMapping.active !== false,
      isCustom: newMapping.isCustom || false,
      defaultValue: newMapping.defaultValue
    };
    
    const updatedMappings = [...mappings, createdMapping];
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings);
    
    // Reset form
    setNewMapping({
      name: '',
      description: '',
      sourceColumn: '',
      targetField: '',
      targetSystem: selectedTargetSystem,
      transformations: [],
      required: false,
      validationRules: [],
      dataType: 'string',
      active: true,
      isCustom: false
    });
    
    // Close modal
    setIsNewModalOpen(false);
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
    
    setNotification({
      type: 'success',
      title: 'Mapping Created',
      message: `${createdMapping.name} mapping has been created successfully.`
    });
  };
  
  // Update an existing mapping
  const handleUpdateMapping = () => {
    if (!selectedMapping) return;
    
    const updatedMappings = mappings.map(mapping => 
      mapping.id === selectedMapping.id ? selectedMapping : mapping
    );
    
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // Close modal
    setIsEditModalOpen(false);
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
    
    setNotification({
      type: 'success',
      title: 'Mapping Updated',
      message: `${selectedMapping.name} mapping has been updated successfully.`
    });
  };
  
  // Delete a mapping
  const handleDeleteMapping = () => {
    if (!selectedMapping) return;
    
    const updatedMappings = mappings.filter(mapping => mapping.id !== selectedMapping.id);
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // Close modal
    setIsDeleteModalOpen(false);
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
    
    setNotification({
      type: 'success',
      title: 'Mapping Deleted',
      message: `${selectedMapping.name} mapping has been deleted.`
    });
  };
  
  // Toggle mapping active state
  const toggleMappingActive = (mappingId: string) => {
    const updatedMappings = mappings.map(mapping => 
      mapping.id === mappingId ? { ...mapping, active: !mapping.active } : mapping
    );
    
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
  };
  
  // Save current mappings as a template
  const saveAsTemplate = (templateName: string, templateDescription: string, isDefault: boolean = false) => {
    if (!templateName || mappings.length === 0) {
      setNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a template name and ensure you have mappings defined'
      });
      return;
    }
    
    const newTemplate: MappingTemplate = {
      id: `template_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: templateName,
      description: templateDescription || `Template created on ${new Date().toLocaleDateString()}`,
      targetSystem: selectedTargetSystem,
      mappings: [...mappings],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: isDefault,
      documentType: 'custom'
    };
    
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    setCurrentTemplate(newTemplate);
    
    // Save to localStorage
    localStorage.setItem('fileflip-mapping-templates', JSON.stringify(updatedTemplates));
    
    // Notify callback
    if (onTemplateSave) {
      onTemplateSave(newTemplate);
    }
    
    // Close modal
    setIsTemplateModalOpen(false);
    
    setNotification({
      type: 'success',
      title: 'Template Saved',
      message: `Template "${templateName}" has been saved successfully.`
    });
  };
  
  // Apply a template
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Adapt template mappings to current columns
    if (table && table.column_names) {
      const adaptedMappings = adaptTemplateMappings(template, table.column_names);
      setMappings(adaptedMappings);
      setFilteredMappings(adaptedMappings);
      setCurrentTemplate(template);
      
      // Notify parent component
      if (onMappingChange) {
        onMappingChange(adaptedMappings);
      }
      
      setNotification({
        type: 'success',
        title: 'Template Applied',
        message: `Template "${template.name}" has been applied successfully.`
      });
    } else {
      // No table provided, just use template mappings directly
      setMappings([...template.mappings]);
      setFilteredMappings([...template.mappings]);
      setCurrentTemplate(template);
      
      // Notify parent component
      if (onMappingChange) {
        onMappingChange([...template.mappings]);
      }
      
      setNotification({
        type: 'success',
        title: 'Template Applied',
        message: `Template "${template.name}" has been applied successfully.`
      });
    }
    
    // Close modal
    setIsTemplateListModalOpen(false);
  };
  
  // Import mappings from file
  const handleImportMappings = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process imported file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (event.target && event.target.result) {
            const importedData = JSON.parse(event.target.result as string);
            
            if (importedData.mappings && Array.isArray(importedData.mappings)) {
              // Import as mappings
              setMappings(importedData.mappings);
              setFilteredMappings(importedData.mappings);
              
              // Notify parent component
              if (onMappingChange) {
                onMappingChange(importedData.mappings);
              }
              
              setNotification({
                type: 'success',
                title: 'Mappings Imported',
                message: `${importedData.mappings.length} mappings have been imported successfully.`
              });
            } else if (importedData.id && importedData.name && importedData.mappings) {
              // Import as template
              const newTemplate: MappingTemplate = {
                ...importedData,
                id: `template_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              const updatedTemplates = [...templates, newTemplate];
              setTemplates(updatedTemplates);
              
              // Apply the template
              setMappings(newTemplate.mappings);
              setFilteredMappings(newTemplate.mappings);
              setCurrentTemplate(newTemplate);
              
              // Save to localStorage
              localStorage.setItem('fileflip-mapping-templates', JSON.stringify(updatedTemplates));
              
              // Notify parent component
              if (onMappingChange) {
                onMappingChange(newTemplate.mappings);
              }
              
              setNotification({
                type: 'success',
                title: 'Template Imported',
                message: `Template "${newTemplate.name}" has been imported successfully.`
              });
            } else {
              throw new Error('Invalid import format');
            }
          }
        } catch (error) {
          console.error('Error importing mappings:', error);
          setNotification({
            type: 'error',
            title: 'Import Error',
            message: 'Failed to import mappings: Invalid format'
          });
        }
      };
      
      reader.readAsText(file);
      
      // Reset file input
      e.target.value = '';
    }
  };
  
  // Export mappings to file
  const handleExportMappings = () => {
    if (mappings.length === 0) {
      setNotification({
        type: 'error',
        title: 'Export Error',
        message: 'No mappings to export'
      });
      return;
    }
    
    const exportData = {
      mappings,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field_mappings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setNotification({
      type: 'success',
      title: 'Export Successful',
      message: `${mappings.length} mappings have been exported successfully.`
    });
  };
  
  // Add a transformation to a mapping
  const addTransformation = (mappingId: string, transformation: Transformation) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.id === mappingId) {
        // Get the highest order and add 1
        const highestOrder = mapping.transformations.reduce(
          (max, t) => Math.max(max, t.order),
          -1
        );
        
        const newTransformation = {
          ...transformation,
          id: `transform_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          order: highestOrder + 1
        };
        
        return {
          ...mapping,
          transformations: [...mapping.transformations, newTransformation]
        };
      }
      return mapping;
    });
    
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // If we're editing a mapping, update the selected mapping as well
    if (selectedMapping && selectedMapping.id === mappingId) {
      // Get the highest order and add 1
      const highestOrder = selectedMapping.transformations.reduce(
        (max, t) => Math.max(max, t.order),
        -1
      );
      
      const newTransformation = {
        ...transformation,
        id: `transform_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        order: highestOrder + 1
      };
      
      setSelectedMapping({
        ...selectedMapping,
        transformations: [...selectedMapping.transformations, newTransformation]
      });
    }
    
    // Reset temp transformation
    setTempTransformation({
      type: 'replace',
      displayName: 'Replace Text',
      config: {},
      order: 0,
      active: true
    });
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
  };
  
  // Remove a transformation from a mapping
  const removeTransformation = (mappingId: string, transformationId: string) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          transformations: mapping.transformations.filter(t => t.id !== transformationId)
        };
      }
      return mapping;
    });
    
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // If we're editing a mapping, update the selected mapping as well
    if (selectedMapping && selectedMapping.id === mappingId) {
      setSelectedMapping({
        ...selectedMapping,
        transformations: selectedMapping.transformations.filter(t => t.id !== transformationId)
      });
    }
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
  };
  
  // Add a validation rule to a mapping
  const addValidationRule = (mappingId: string, rule: ValidationRule) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          validationRules: [...mapping.validationRules, {
            ...rule,
            id: `validation_${Date.now()}_${Math.floor(Math.random() * 1000)}`
          }]
        };
      }
      return mapping;
    });
    
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // If we're editing a mapping, update the selected mapping as well
    if (selectedMapping && selectedMapping.id === mappingId) {
      setSelectedMapping({
        ...selectedMapping,
        validationRules: [...selectedMapping.validationRules, {
          ...rule,
          id: `validation_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        }]
      });
    }
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
  };
  
  // Remove a validation rule from a mapping
  const removeValidationRule = (mappingId: string, ruleId: string) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          validationRules: mapping.validationRules.filter(r => r.id !== ruleId)
        };
      }
      return mapping;
    });
    
    setMappings(updatedMappings);
    setFilteredMappings(updatedMappings.filter(mapping => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        mapping.name.toLowerCase().includes(query) ||
        mapping.sourceColumn.toLowerCase().includes(query) ||
        mapping.targetField.toLowerCase().includes(query)
      );
    }));
    
    // If we're editing a mapping, update the selected mapping as well
    if (selectedMapping && selectedMapping.id === mappingId) {
      setSelectedMapping({
        ...selectedMapping,
        validationRules: selectedMapping.validationRules.filter(r => r.id !== ruleId)
      });
    }
    
    // Notify parent component
    if (onMappingChange) {
      onMappingChange(updatedMappings);
    }
  };
  
  // Render transformation form based on type
  const renderTransformationForm = (type: string) => {
    switch (type) {
      case 'replace':
        return (
          <div className="space-y-4 mt-4">
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempTransformation({
              id="transform-find"
              labelText="Find"
              value={tempTransformation.config?.find || ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  find: e.target.value
                }
              })}
              placeholder="Text to find"
            />
            
            <TextInput
              id="transform-replace"
              labelText="Replace With"
              value={tempTransformation.config?.replace || ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  replace: e.target.value
                }
              })}
              placeholder="Replacement text"
            />
            
            <Checkbox
              id="transform-regex"
              labelText="Use Regular Expression"
              checked={tempTransformation.config?.useRegex || false}
              onChange={(checked) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  useRegex: checked
                }
              })}
            />
          </div>
        );
        
      case 'format':
        return (
          <div className="space-y-4 mt-4">
            <Dropdown
              id="transform-input-format"
              titleText="Input Format"
              label="Select input format"
              items={[
                { id: 'auto', text: 'Auto-detect' },
                { id: 'MM/DD/YYYY', text: 'MM/DD/YYYY' },
                { id: 'DD/MM/YYYY', text: 'DD/MM/YYYY' },
                { id: 'YYYY-MM-DD', text: 'YYYY-MM-DD' },
                { id: 'DD-MMM-YYYY', text: 'DD-MMM-YYYY' }
              ]}
              selectedItem={
                tempTransformation.config?.inputFormat
                  ? { id: tempTransformation.config.inputFormat, text: tempTransformation.config.inputFormat === 'auto' ? 'Auto-detect' : tempTransformation.config.inputFormat }
                  : { id: 'auto', text: 'Auto-detect' }
              }
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  setTempTransformation({
                    ...tempTransformation,
                    config: {
                      ...tempTransformation.config,
                      inputFormat: selectedItem.id
                    }
                  });
                }
              }}
            />
            
            <Dropdown
              id="transform-output-format"
              titleText="Output Format"
              label="Select output format"
              items={[
                { id: 'MM/DD/YYYY', text: 'MM/DD/YYYY' },
                { id: 'DD/MM/YYYY', text: 'DD/MM/YYYY' },
                { id: 'YYYY-MM-DD', text: 'YYYY-MM-DD' },
                { id: 'DD-MMM-YYYY', text: 'DD-MMM-YYYY' }
              ]}
              selectedItem={
                tempTransformation.config?.outputFormat
                  ? { id: tempTransformation.config.outputFormat, text: tempTransformation.config.outputFormat }
                  : null
              }
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  setTempTransformation({
                    ...tempTransformation,
                    config: {
                      ...tempTransformation.config,
                      outputFormat: selectedItem.id
                    }
                  });
                }
              }}
            />
          </div>
        );
        
      case 'substring':
        return (
          <div className="space-y-4 mt-4">
            <TextInput
              id="transform-start"
              labelText="Start Position"
              type="number"
              value={tempTransformation.config?.start !== undefined ? String(tempTransformation.config.start) : ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  start: parseInt(e.target.value, 10)
                }
              })}
              placeholder="0"
            />
            
            <TextInput
              id="transform-length"
              labelText="Length (Optional)"
              type="number"
              value={tempTransformation.config?.length !== undefined ? String(tempTransformation.config.length) : ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  length: e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                }
              })}
              placeholder="Extract to end if empty"
            />
          </div>
        );
        
      case 'math':
        return (
          <div className="space-y-4 mt-4">
            <Dropdown
              id="transform-operation"
              titleText="Operation"
              label="Select operation"
              items={[
                { id: 'multiply', text: 'Multiply' },
                { id: 'divide', text: 'Divide' },
                { id: 'add', text: 'Add' },
                { id: 'subtract', text: 'Subtract' },
                { id: 'round', text: 'Round' }
              ]}
              selectedItem={
                tempTransformation.config?.operation
                  ? { id: tempTransformation.config.operation, text: tempTransformation.config.operation.charAt(0).toUpperCase() + tempTransformation.config.operation.slice(1) }
                  : null
              }
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  setTempTransformation({
                    ...tempTransformation,
                    config: {
                      ...tempTransformation.config,
                      operation: selectedItem.id
                    }
                  });
                }
              }}
            />
            
            {tempTransformation.config?.operation !== 'round' && (
              <TextInput
                id="transform-value"
                labelText="Value"
                type="number"
                value={tempTransformation.config?.value !== undefined ? String(tempTransformation.config.value) : ''}
                onChange={(e) => setTempTransformation({
                  ...tempTransformation,
                  config: {
                    ...tempTransformation.config,
                    value: parseFloat(e.target.value)
                  }
                })}
                placeholder="Enter a number"
              />
            )}
            
            {tempTransformation.config?.operation === 'round' && (
              <TextInput
                id="transform-decimals"
                labelText="Decimal Places"
                type="number"
                value={tempTransformation.config?.decimals !== undefined ? String(tempTransformation.config.decimals) : '2'}
                onChange={(e) => setTempTransformation({
                  ...tempTransformation,
                  config: {
                    ...tempTransformation.config,
                    decimals: parseInt(e.target.value, 10)
                  }
                })}
                placeholder="2"
              />
            )}
          </div>
        );
        
      case 'conditional':
        return (
          <div className="space-y-4 mt-4">
            <TextInput
              id="transform-condition"
              labelText="Condition"
              value={tempTransformation.config?.condition || ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  condition: e.target.value
                }
              })}
              placeholder="e.g., value > 0"
            />
            
            <TextInput
              id="transform-if-true"
              labelText="Value If True"
              value={tempTransformation.config?.ifTrue || ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  ifTrue: e.target.value
                }
              })}
              placeholder="Value to use if condition is true"
            />
            
            <TextInput
              id="transform-if-false"
              labelText="Value If False"
              value={tempTransformation.config?.ifFalse || ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  ifFalse: e.target.value
                }
              })}
              placeholder="Value to use if condition is false"
            />
          </div>
        );
            <TextArea
      case 'custom':
        return (
          <div className="space-y-4 mt-4">
            <TextInput.TextArea
              id="transform-custom-code"
              labelText="Custom Transformation Code"
              value={tempTransformation.config?.code || ''}
              onChange={(e) => setTempTransformation({
                ...tempTransformation,
                config: {
                  ...tempTransformation.config,
                  code: e.target.value
                }
              })}
              placeholder="// Use JavaScript code to transform the value\n// Example: return value.toUpperCase();"
              rows={5}
            />
            
            <InlineNotification
              kind="info"
              title="Custom Code Information"
              subtitle="Your code should return the transformed value. The original value is available as 'value'."
              hideCloseButton
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render custom transformation display
  const renderTransformationDisplay = (transformation: Transformation) => {
    switch (transformation.type) {
      case 'replace':
        return (
          <div>
            <p className="text-sm">
              Replace{' '}
              <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                {transformation.config.find || ''}
              </code>{' '}
              with{' '}
              <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                {transformation.config.replace || ''}
              </code>
              {transformation.config.useRegex && ' (using regex)'}
            </p>
          </div>
        );
        
      case 'format':
        return (
          <div>
            <p className="text-sm">
              Format date from{' '}
              <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                {transformation.config.inputFormat || 'auto'}
              </code>{' '}
              to{' '}
              <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                {transformation.config.outputFormat || ''}
              </code>
            </p>
          </div>
        );
        
      case 'substring':
        return (
          <div>
            <p className="text-sm">
              Extract substring from position{' '}
              <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                {transformation.config.start || 0}
              </code>
              {transformation.config.length !== undefined && (
                <>
                  {' '}for{' '}
                  <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                    {transformation.config.length}
                  </code>{' '}
                  characters
                </>
              )}
            </p>
          </div>
        );
        
      case 'math':
        return (
          <div>
            <p className="text-sm">
              {transformation.config.operation === 'round' 
                ? `Round to ${transformation.config.decimals || 2} decimal places`
                : `${transformation.config.operation.charAt(0).toUpperCase() + transformation.config.operation.slice(1)} by ${transformation.config.value || 0}`}
            </p>
          </div>
        );
        
      case 'conditional':
        return (
          <div>
            <p className="text-sm">
              If <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">{transformation.config.condition || ''}</code>,
              then <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">{transformation.config.ifTrue || ''}</code>,
              else <code className="px-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">{transformation.config.ifFalse || ''}</code>
            </p>
          </div>
        );
        
      case 'custom':
        return (
          <div>
            <p className="text-sm">
              Custom code transformation
            </p>
            {transformation.config.code && (
              <code className="text-xs block mt-1 p-1 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                {transformation.config.code.substring(0, 50)}{transformation.config.code.length > 50 ? '...' : ''}
              </code>
            )}
          </div>
        );
        
      default:
        return <div>{transformation.displayName}</div>;
    }
  };
  
  // Find available target fields for dropdown
  const getAvailableTargetFields = () => {
    if (!selectedTargetSystem) return [];
    
    const targetSystem = effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem);
    if (!targetSystem) return [];
    
    return targetSystem.fields.map(field => ({
      id: field.id,
      text: field.name
    }));
  };
  
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
          Field Mapping Designer
        </h3>
        
        <div className="flex space-x-2">
          <Button
            kind="tertiary"
            renderIcon={DocumentImport}
            onClick={handleImportMappings}
            size="sm"
          >
            Import
          </Button>
          
          <Button
            kind="tertiary"
            renderIcon={DocumentExport}
            onClick={handleExportMappings}
            size="sm"
            disabled={mappings.length === 0}
          >
            Export
          </Button>
          
          <Button
            kind="tertiary"
            renderIcon={Save}
            onClick={() => setIsTemplateModalOpen(true)}
            size="sm"
            disabled={mappings.length === 0 || !selectedTargetSystem}
          >
            Save Template
          </Button>
          
          <Button
            renderIcon={Add}
            onClick={() => setIsNewModalOpen(true)}
            disabled={!selectedTargetSystem}
          >
            Add Mapping
          </Button>
        </div>
      </div>
      
      {notification && (
        <ToastNotification
          kind={notification.type}
          title={notification.title}
          subtitle={notification.message}
          timeout={5000}
          onClose={() => setNotification(null)}
          className="mb-4"
        />
      )}
      
      <div className="mb-6">
        <Grid>
          <Column lg={8} md={4} sm={4}>
            <Dropdown
              id="target-system"
              titleText="Target System"
              label="Select target system"
              items={effectiveTargetSystems.map(system => ({
                id: system.id,
                text: system.name
              }))}
              selectedItem={
                selectedTargetSystem
                  ? { 
                      id: selectedTargetSystem, 
                      text: effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem)?.name || ''
                    }
                  : null
              }
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  setSelectedTargetSystem(selectedItem.id);
                  
                  // Reset mappings if changing target system
                  if (mappings.length > 0 && 
                      mappings[0].targetSystem !== selectedItem.id && 
                      !window.confirm('Changing target system will reset your current mappings. Continue?')) {
                    return;
                  }
                  
                  setMappings([]);
                  setFilteredMappings([]);
                  setCurrentTemplate(null);
                }
              }}
              className="mb-4"
            />
          </Column>
          
          <Column lg={4} md={2} sm={4}>
            <div className="flex items-center h-full">
              <Button
                kind="ghost"
                renderIcon={Download}
                onClick={() => setIsTemplateListModalOpen(true)}
                className="mt-7"
                disabled={!selectedTargetSystem}
              >
                Load Template
              </Button>
              
              <Toggle
                id="suggestions-toggle"
                labelText="Auto-suggest mappings"
                toggled={showSuggestions}
                onChange={() => setShowSuggestions(!showSuggestions)}
                className="ml-4 mt-7"
              />
            </div>
          </Column>
          
          <Column lg={4} md={2} sm={4}>
            <div className="mt-7">
              {currentTemplate && (
                <div className="flex items-center space-x-2">
                  <Chart_4 size={20} className="text-carbon-blue-60" />
                  <span className="text-sm">{currentTemplate.name}</span>
                </div>
              )}
            </div>
          </Column>
        </Grid>
      </div>
      
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
      <Tabs selectedIndex={activeTab === 'mappings' ? 0 : 1} onChange={({ selectedIndex }) => {
        handleFileSelect(selectedIndex);
      }}>
        <Tab id="field-mappings" label="Field Mappings">
        <Tab id="field-mappings" label="Field Mappings">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                  {!selectedTargetSystem 
                    ? 'Select a target system to begin mapping fields'
                    : mappings.length === 0
                    ? 'No mappings defined yet. Add a mapping or load a template.'
                    : `${mappings.length} field mappings defined. ${mappings.filter(m => m.active).length} active.`}
                </p>
              </div>
              
              <Search
                id="search-mappings"
                labelText=""
                placeholder="Search mappings"
                size="sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {selectedTargetSystem && mappings.length === 0 && (
              <div className="text-center p-8 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded-lg">
                <Chart_3D size={48} className="mx-auto mb-4 text-carbon-gray-50" />
                <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
                  No field mappings defined yet.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    renderIcon={Add}
                    onClick={() => setIsNewModalOpen(true)}
                  >
                    Add Mapping
                  </Button>
                  
                  <Button
                    renderIcon={Download}
                    onClick={() => setIsTemplateListModalOpen(true)}
                  >
                    Load Template
                  </Button>
                </div>
              </div>
            )}
            
            {mappings.length > 0 && (
              <div className="space-y-4">
                {filteredMappings.map(mapping => (
                  <Tile key={mapping.id} className={`p-4 ${!mapping.active ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <h4 className="text-lg font-medium text-carbon-gray-100 dark:text-white mr-2">
                            {mapping.name}
                          </h4>
                          <Tag type={mapping.required ? 'red' : 'blue'}>
                            {mapping.required ? 'Required' : 'Optional'}
                          </Tag>
                          <Tag type="purple" className="ml-2">
                            {mapping.dataType.charAt(0).toUpperCase() + mapping.dataType.slice(1)}
                          </Tag>
                          {mapping.isCustom && (
                            <Tag type="cyan" className="ml-2">Custom</Tag>
                          )}
                        </div>
                        
                        <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mt-1">
                          {mapping.description}
                        </p>
                        
                        <div className="flex items-center mt-2">
                          <div className="bg-carbon-gray-10 dark:bg-carbon-gray-90 px-2 py-1 rounded text-sm">
                            {mapping.sourceColumn}
                          </div>
                          <ArrowRight size={16} className="mx-2 text-carbon-gray-50" />
                          <div className="bg-carbon-gray-10 dark:bg-carbon-gray-90 px-2 py-1 rounded text-sm">
                            {mapping.targetField}
                          </div>
                        </div>
                        
                        {mapping.transformations.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30 mb-1">
                              Transformations:
                            </p>
                            <div className="space-y-1 ml-2">
                              {mapping.transformations.map(transformation => (
                                <div key={transformation.id} className="flex items-center text-sm">
                                  <span className="w-5 inline-block">
                                    {transformation.order + 1}.
                                  </span>
                                  <span className="font-medium mr-2">
                                    {transformation.displayName}:
                                  </span>
                                  {renderTransformationDisplay(transformation)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {mapping.validationRules.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30 mb-1">
                              Validation Rules:
                            </p>
                            <div className="space-y-1 ml-2">
                              {mapping.validationRules.map(rule => (
                                <div key={rule.id} className="flex items-center">
                                  <Tag 
                                    type={rule.severity === 'error' ? 'red' : 'orange'} 
                                    className="mr-2"
                                  >
                                    {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                                  </Tag>
                                  <span className="text-sm">
                                    {rule.errorMessage}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <Toggle
                          id={`toggle-${mapping.id}`}
                          labelText=""
                          hideLabel
                          toggled={mapping.active}
                          onChange={() => toggleMappingActive(mapping.id)}
                          className="mr-4"
                        />
                        
                        <OverflowMenu flipped>
                          <OverflowMenuItem 
                            itemText="Edit" 
                            onClick={() => {
                              setSelectedMapping(mapping);
                              setIsEditModalOpen(true);
                            }}
                          />
                          <OverflowMenuItem 
                            itemText="Delete" 
                            isDelete 
                            onClick={() => {
                              setSelectedMapping(mapping);
                              setIsDeleteModalOpen(true);
                            }}
                          />
                        </OverflowMenu>
                      </div>
                    </div>
                  </Tile>
                ))}
              </div>
            )}
          </div>
        </Tab>
        
        <Tab id="data-preview" label="Data Preview">
          <div className="p-4">
            <h4 className="text-carbon-gray-100 dark:text-white font-medium mb-4">
              Mapping Preview
            </h4>
            
            {previewData.length > 0 ? (
              <TableContainer title="Sample Data with Mappings" description="Shows how data will be transformed">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Source Column</TableHeader>
                      <TableHeader>Sample Data</TableHeader>
                      <TableHeader>Mapping</TableHeader>
                      <TableHeader>Target Field</TableHeader>
                    {table && table.column_names.map((column: string, index: number) => {
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {table && table.column_names.map((column, index) => {
                      const mapping = mappings.find(m => m.sourceColumn === column && m.active);
                      const sampleValue = previewData[0] ? previewData[0][column] : '';
                      
                      // Simple transformation preview (just to demonstrate concept)
                      // In a real app, this would apply actual transformations
                      let transformedValue = sampleValue;
                      if (mapping) {
                        if (mapping.dataType === 'number' && typeof sampleValue === 'string') {
                          // Remove currency symbols and commas for number types
                          transformedValue = sampleValue.replace(/[$£€,]/g, '');
                        } else if (mapping.dataType === 'date' && mapping.format) {
                          // Format date - this is simplified
                          try {
                            const date = new Date(sampleValue);
                            if (!isNaN(date.getTime())) {
                              transformedValue = mapping.format === 'YYYY-MM-DD' 
                                ? date.toISOString().split('T')[0]
                                : mapping.format === 'MM/DD/YYYY'
                                ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
                                : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            }
                          } catch (e) {
                            // Keep original if date parsing fails
                          }
                        }
                      }
                      
                      return (
                        <TableRow key={column}>
                          <TableCell>{column}</TableCell>
                          <TableCell>{String(sampleValue)}</TableCell>
                          <TableCell>
                            {mapping ? (
                              <Tag type="green">Mapped</Tag>
                            ) : (
                              <Tag type="gray">Unmapped</Tag>
                            )}
                          </TableCell>
                          <TableCell>
                            {mapping ? mapping.targetField : '—'}
                          </TableCell>
                          <TableCell>
                            {mapping ? String(transformedValue) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <p className="text-center p-4 text-carbon-gray-70 dark:text-carbon-gray-30">
                No preview data available.
              </p>
            )}
          </div>
        </Tab>
      </Tabs>
      
      {/* New Mapping Modal */}
      <Modal
        open={isNewModalOpen}
        modalHeading="Create Field Mapping"
        primaryButtonText="Create Mapping"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleCreateMapping}
        onRequestClose={() => setIsNewModalOpen(false)}
        size="lg"
      >
        <div className="p-4">
          <Grid>
            <Column lg={8} md={4} sm={4}>
              <TextInput
                id="new-mapping-name"
                labelText="Mapping Name"
                placeholder="e.g., Invoice Number"
                value={newMapping.name || ''}
                onChange={(e) => setNewMapping({...newMapping, name: e.target.value})}
                className="mb-4"
              />
            </Column>
            
            <Column lg={8} md={4} sm={4}>
                items={table ? table.column_names.map((column: string) => ({
                id="new-mapping-source"
                titleText="Source Column"
                id="new-mapping-source"
                titleText="Source Column"
                label="Select source column"
                items={table ? table.column_names.map((column: string) => ({
                  id: column,
                  text: column
                })) : []}
                selectedItem={
                  newMapping.sourceColumn 
                    ? { id: newMapping.sourceColumn, text: newMapping.sourceColumn } 
                    : null
                }
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    setNewMapping({...newMapping, sourceColumn: selectedItem.id});
                  }
                }}
                className="mb-4"
              />
            </Column>
          </Grid>
          
          <TextInput
            id="new-mapping-description"
            labelText="Description"
            placeholder="Optional description for this mapping"
            value={newMapping.description || ''}
            onChange={(e) => setNewMapping({...newMapping, description: e.target.value})}
            className="mb-4"
          />
          
          <Grid>
            <Column lg={8} md={4} sm={4}>
              <Dropdown
                id="new-mapping-target"
                titleText="Target Field"
                label="Select target field"
                items={getAvailableTargetFields()}
                selectedItem={
                  newMapping.targetField 
                    ? { 
                        id: newMapping.targetField, 
                        text: effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem)?.fields.find(f => f.id === newMapping.targetField)?.name || ''
                      } 
                    : null
                }
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    const targetSystem = effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem);
                    const targetField = targetSystem?.fields.find(f => f.id === selectedItem.id);
                    
                    setNewMapping({
                      ...newMapping, 
                      targetField: selectedItem.id,
                      dataType: targetField?.dataType || 'string',
                      required: targetField?.required || false,
                      format: targetField?.format
                    });
                  }
                }}
                className="mb-4"
              />
            </Column>
            
            <Column lg={4} md={2} sm={2}>
              <Dropdown
                id="new-mapping-data-type"
                titleText="Data Type"
                label="Select data type"
                items={[
                  { id: 'string', text: 'Text' },
                  { id: 'number', text: 'Number' },
                  { id: 'date', text: 'Date' },
                  { id: 'boolean', text: 'Boolean' }
                ]}
                selectedItem={
                  newMapping.dataType 
                    ? { 
                        id: newMapping.dataType, 
                        text: newMapping.dataType === 'string' ? 'Text' : 
                              newMapping.dataType === 'number' ? 'Number' : 
                              newMapping.dataType === 'date' ? 'Date' : 'Boolean'
                      } 
                    : { id: 'string', text: 'Text' }
                }
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    setNewMapping({
                      ...newMapping, 
                      dataType: selectedItem.id as FieldMapping['dataType']
                    });
                  }
                }}
                className="mb-4"
              />
            </Column>
            
            <Column lg={4} md={2} sm={2}>
                onChange={(e) => setNewMapping({...newMapping, required: e.target.checked})}
                id="new-mapping-required"
                labelText="Required Field"
                checked={newMapping.required === true}
                onChange={(checked) => setNewMapping({...newMapping, required: checked})}
                className="mt-7 mb-4"
              />
            </Column>
          </Grid>
          
          {newMapping.dataType === 'date' && (
            <TextInput
              id="new-mapping-format"
              labelText="Date Format"
              placeholder="e.g., YYYY-MM-DD"
              value={newMapping.format || ''}
              onChange={(e) => setNewMapping({...newMapping, format: e.target.value})}
              className="mb-4"
            />
          )}
          
          <TextInput
            id="new-mapping-default"
            labelText="Default Value (Optional)"
            placeholder="Used when source data is missing"
            value={newMapping.defaultValue || ''}
            onChange={(e) => setNewMapping({...newMapping, defaultValue: e.target.value})}
            className="mb-4"
          />
          
            onChange={(e) => setNewMapping({...newMapping, isCustom: e.target.checked})}
            id="new-mapping-custom"
            labelText="Custom Field (not part of standard target system)"
            checked={newMapping.isCustom === true}
            onChange={(checked) => setNewMapping({...newMapping, isCustom: checked})}
            className="mb-4"
          />
        </div>
      </Modal>
      
      {/* Edit Mapping Modal */}
      <Modal
        open={isEditModalOpen}
        modalHeading={`Edit Mapping: ${selectedMapping?.name}`}
        primaryButtonText="Save Changes"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleUpdateMapping}
        onRequestClose={() => setIsEditModalOpen(false)}
        size="lg"
      >
        {selectedMapping && (
          <div className="p-4">
            <Grid>
              <Column lg={8} md={4} sm={4}>
                <TextInput
                  id="edit-mapping-name"
                  labelText="Mapping Name"
                  value={selectedMapping.name}
                  onChange={(e) => setSelectedMapping({...selectedMapping, name: e.target.value})}
                  className="mb-4"
                />
              </Column>
              
              <Column lg={8} md={4} sm={4}>
                <Dropdown
                  id="edit-mapping-source"
                  titleText="Source Column"
                  label="Select source column"
                  items={table ? table.column_names.map(column => ({
                    id: column,
                    text: column
                  })) : []}
                  selectedItem={{ id: selectedMapping.sourceColumn, text: selectedMapping.sourceColumn }}
                  onChange={({ selectedItem }) => {
                    if (selectedItem) {
                      setSelectedMapping({...selectedMapping, sourceColumn: selectedItem.id});
                    }
                  }}
                  className="mb-4"
                />
              </Column>
            </Grid>
            
            <TextInput
              id="edit-mapping-description"
              labelText="Description"
              value={selectedMapping.description}
              onChange={(e) => setSelectedMapping({...selectedMapping, description: e.target.value})}
              className="mb-4"
            />
            
            <Grid>
              <Column lg={8} md={4} sm={4}>
                <Dropdown
                  id="edit-mapping-target"
                  titleText="Target Field"
                  label="Select target field"
                  items={getAvailableTargetFields()}
                  selectedItem={{
                    id: selectedMapping.targetField,
                    text: effectiveTargetSystems.find(sys => sys.id === selectedMapping.targetSystem)?.fields.find(f => f.id === selectedMapping.targetField)?.name || selectedMapping.targetField
                  }}
                  onChange={({ selectedItem }) => {
                    if (selectedItem) {
                      const targetSystem = effectiveTargetSystems.find(sys => sys.id === selectedMapping.targetSystem);
                      const targetField = targetSystem?.fields.find(f => f.id === selectedItem.id);
                      
                      setSelectedMapping({
                        ...selectedMapping, 
                        targetField: selectedItem.id,
                        dataType: targetField?.dataType || selectedMapping.dataType,
                        required: targetField?.required || selectedMapping.required,
                        format: targetField?.format || selectedMapping.format
                      });
                    }
                  }}
                  className="mb-4"
                />
              </Column>
              
              <Column lg={4} md={2} sm={2}>
                <Dropdown
                  id="edit-mapping-data-type"
                  titleText="Data Type"
                  label="Select data type"
                  items={[
                    { id: 'string', text: 'Text' },
                    { id: 'number', text: 'Number' },
                    { id: 'date', text: 'Date' },
                    { id: 'boolean', text: 'Boolean' }
                  ]}
                  selectedItem={{ 
                    id: selectedMapping.dataType, 
                    text: selectedMapping.dataType === 'string' ? 'Text' : 
                          selectedMapping.dataType === 'number' ? 'Number' : 
                          selectedMapping.dataType === 'date' ? 'Date' : 'Boolean'
                  }}
                  onChange={({ selectedItem }) => {
                    if (selectedItem) {
                      setSelectedMapping({
                        ...selectedMapping, 
                        dataType: selectedItem.id as FieldMapping['dataType']
                      });
                    }
                  }}
                  className="mb-4"
                />
              </Column>
              
              <Column lg={4} md={2} sm={2}>
                  onChange={(e) => setSelectedMapping({...selectedMapping, required: e.target.checked})}
                  id="edit-mapping-required"
                  labelText="Required Field"
                  checked={selectedMapping.required}
                  onChange={(checked) => setSelectedMapping({...selectedMapping, required: checked})}
                  className="mt-7 mb-4"
                />
              </Column>
            </Grid>
            
            {selectedMapping.dataType === 'date' && (
              <TextInput
                id="edit-mapping-format"
                labelText="Date Format"
                value={selectedMapping.format || ''}
                onChange={(e) => setSelectedMapping({...selectedMapping, format: e.target.value})}
                className="mb-4"
              />
            )}
            
            <TextInput
              id="edit-mapping-default"
              labelText="Default Value (Optional)"
              placeholder="Used when source data is missing"
              value={selectedMapping.defaultValue || ''}
              onChange={(e) => setSelectedMapping({...selectedMapping, defaultValue: e.target.value})}
              className="mb-4"
            />
            
              onChange={(e) => setSelectedMapping({...selectedMapping, isCustom: e.target.checked})}
              id="edit-mapping-custom"
              labelText="Custom Field (not part of standard target system)"
              checked={selectedMapping.isCustom}
              onChange={(checked) => setSelectedMapping({...selectedMapping, isCustom: checked})}
              className="mb-6"
            />
            
            <Accordion>
              <AccordionItem title="Transformations" open>
                <div className="space-y-4 mt-2">
                  {selectedMapping.transformations.length === 0 ? (
                    <p className="text-carbon-gray-70 dark:text-carbon-gray-30 italic">
                      No transformations defined.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMapping.transformations
                        .sort((a, b) => a.order - b.order)
                        .map(transform => (
                          <div key={transform.id} className="flex items-center justify-between p-2 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                            <div className="flex items-center">
                              <span className="w-6 text-center text-carbon-gray-70 dark:text-carbon-gray-30">
                                {transform.order + 1}.
                              </span>
                              <span className="font-medium text-carbon-gray-100 dark:text-white mr-2">
                                {transform.displayName}
                              </span>
                              {renderTransformationDisplay(transform)}
                            </div>
                            <Button
                              kind="danger--ghost"
                              renderIcon={TrashCan}
                              iconDescription="Remove transformation"
                              hasIconOnly
                              onClick={() => removeTransformation(selectedMapping.id, transform.id)}
                              size="sm"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded">
                    <h5 className="font-medium mb-2">Add Transformation</h5>
                    
                    <Dropdown
                      id="new-transformation-type"
                      titleText="Transformation Type"
                      label="Select type"
                      items={[
                        { id: 'replace', text: 'Replace Text' },
                        { id: 'format', text: 'Format Date' },
                        { id: 'substring', text: 'Extract Substring' },
                        { id: 'math', text: 'Math Operation' },
                        { id: 'conditional', text: 'Conditional Value' },
                        { id: 'custom', text: 'Custom Code' }
                      ]}
                      selectedItem={
                        tempTransformation.type
                          ? { 
                              id: tempTransformation.type, 
                              text: tempTransformation.type === 'replace' ? 'Replace Text' : 
                                    tempTransformation.type === 'format' ? 'Format Date' :
                                    tempTransformation.type === 'substring' ? 'Extract Substring' :
                                    tempTransformation.type === 'math' ? 'Math Operation' :
                                    tempTransformation.type === 'conditional' ? 'Conditional Value' :
                                    'Custom Code'
                            } 
                          : null
                      }
                      onChange={({ selectedItem }) => {
                        if (selectedItem) {
                          const displayNames: Record<string, string> = {
                            'replace': 'Replace Text',
                            'format': 'Format Date',
                            'substring': 'Extract Substring',
                            'math': 'Math Operation',
                            'conditional': 'Conditional Value',
                            'custom': 'Custom Code'
                          };
                          
                          setTempTransformation({
                            type: selectedItem.id as Transformation['type'],
                            displayName: displayNames[selectedItem.id] || selectedItem.text,
                            config: {},
                            order: 0,
                            active: true
                          });
                        }
                      }}
                      className="mb-4"
                    />
                    
                    {renderTransformationForm(tempTransformation.type || '')}
                    
                    <Button
                      renderIcon={Add}
                      onClick={() => addTransformation(selectedMapping.id, tempTransformation as Transformation)}
                      className="mt-4"
                      disabled={!tempTransformation.type}
                    >
                      Add Transformation
                    </Button>
                  </div>
                </div>
              </AccordionItem>
              
              <AccordionItem title="Validation Rules">
                <div className="space-y-4 mt-2">
                  {selectedMapping.validationRules.length === 0 ? (
                    <p className="text-carbon-gray-70 dark:text-carbon-gray-30 italic">
                      No validation rules defined.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMapping.validationRules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-2 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded">
                          <div className="flex items-center">
                            <Tag 
                              type={rule.severity === 'error' ? 'red' : 'orange'} 
                              className="mr-2"
                            >
                              {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                            </Tag>
                            <span className="font-medium text-carbon-gray-100 dark:text-white mr-2">
                              {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}:
                            </span>
                            <span className="text-carbon-gray-70 dark:text-carbon-gray-30">
                              {rule.errorMessage}
                            </span>
                          </div>
                          <Button
                            kind="danger--ghost"
                            renderIcon={TrashCan}
                            iconDescription="Remove rule"
                            hasIconOnly
                            onClick={() => removeValidationRule(selectedMapping.id, rule.id)}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded">
                    <h5 className="font-medium mb-2">Add Validation Rule</h5>
                    
                    <Dropdown
                      id="new-validation-type"
                      titleText="Validation Type"
                      label="Select type"
                      items={[
                        { id: 'required', text: 'Required Field' },
                        { id: 'format', text: 'Format Check' },
                        { id: 'range', text: 'Value Range' },
                        { id: 'regex', text: 'Regular Expression' },
                        { id: 'custom', text: 'Custom Validation' }
                      ]}
                      selectedItem={null}
                      onChange={({ selectedItem }) => {
                        if (!selectedItem) return;
                        
                        let config = {};
                        let errorMessage = '';
                        
                        // Set default config and error message based on validation type
                        switch (selectedItem.id) {
                          case 'required':
                            errorMessage = `${selectedMapping.name} is required`;
                            break;
                            
                          case 'format':
                            config = { format: selectedMapping.dataType };
                            errorMessage = `Invalid ${selectedMapping.dataType} format`;
                            break;
                            
                          case 'range':
                            config = { min: 0 };
                            errorMessage = `Value must be a positive number`;
                            break;
                            
                          case 'regex':
                            config = { pattern: '.*' };
                            errorMessage = `Invalid format`;
                            break;
                            
                          case 'custom':
                            config = { code: '// Return true if valid, false if invalid\n// Value available as "value"' };
                            errorMessage = `Invalid value`;
                            break;
                        }
                        
                        // Add the validation rule
                        addValidationRule(selectedMapping.id, {
                          id: `validation_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                          type: selectedItem.id as ValidationRule['type'],
                          config,
                          errorMessage,
                          severity: 'error',
                          active: true
                        });
                      }}
                      className="mb-4"
                    />
                  </div>
                </div>
              </AccordionItem>
              
              <AccordionItem title="Advanced Options">
                <div className="space-y-4 mt-2">
                  <TextInput.TextArea
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    labelText="Fallback Source Columns"
                    placeholder="Comma-separated list of alternative column names"
                        .map((str: string) => str.trim())
                    onChange={(e) => {
                      const fallbacks = e.target.value
                        .split(',')
                        .map(str => str.trim())
                        .filter(Boolean);
                        
                      setSelectedMapping({
                        ...selectedMapping,
                        fallbackColumns: fallbacks.length > 0 ? fallbacks : undefined
                      });
                    }}
                    rows={2}
                  />
                  
                  <div className="mt-2">
                    <InlineNotification
                      kind="info"
                      title="About Fallback Columns"
                      subtitle="If the primary source column isn't found, these columns will be tried in order as alternatives."
                      hideCloseButton
                    />
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </Modal>
      
      {/* Delete Mapping Modal */}
      <Modal
        open={isDeleteModalOpen}
        modalHeading="Delete Field Mapping"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
        onRequestSubmit={handleDeleteMapping}
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        {selectedMapping && (
          <p className="p-4">
            Are you sure you want to delete the mapping for <strong>{selectedMapping.name}</strong>? This action cannot be undone.
          </p>
        )}
      </Modal>
      
      {/* Save Template Modal */}
      <Modal
        open={isTemplateModalOpen}
        modalHeading="Save Mapping Template"
        primaryButtonText="Save Template"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => {
          const templateName = (document.getElementById('template-name') as HTMLInputElement)?.value;
          const templateDescription = (document.getElementById('template-description') as HTMLInputElement)?.value;
          const isDefault = (document.getElementById('template-default') as HTMLInputElement)?.checked;
          
          saveAsTemplate(templateName, templateDescription, isDefault);
        }}
        onRequestClose={() => setIsTemplateModalOpen(false)}
      >
        <div className="p-4">
          <TextInput
            id="template-name"
            labelText="Template Name"
            placeholder="e.g., Standard Invoice Mapping"
            required
            className="mb-4"
          />
          
          <TextInput.TextArea
            id="template-description"
            labelText="Description"
            placeholder="Description of this template and when to use it"
            rows={3}
            className="mb-4"
          />
          
          <Dropdown
            id="template-document-type"
            titleText="Document Type"
            label="Select document type"
            items={[
              { id: 'invoice', text: 'Invoice' },
              { id: 'receipt', text: 'Receipt' },
              { id: 'statement', text: 'Bank Statement' },
              { id: 'bill', text: 'Bill/Purchase Order' },
              { id: 'custom', text: 'Custom/Other' }
            ]}
            selectedItem={{ id: 'invoice', text: 'Invoice' }}
            className="mb-4"
          />
          
          <Checkbox
            id="template-default"
            labelText="Set as default template for this document type and target system"
            className="mb-4"
          />
          
          <InlineNotification
            kind="info"
            title="Template Information"
            subtitle={`This template will include ${mappings.length} field mappings for ${selectedTargetSystem ? effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem)?.name : 'the selected target system'}.`}
            hideCloseButton
          />
        </div>
      </Modal>
      
      {/* Template List Modal */}
      <Modal
        open={isTemplateListModalOpen}
        modalHeading="Load Mapping Template"
        primaryButtonText="Close"
        onRequestSubmit={() => setIsTemplateListModalOpen(false)}
        onRequestClose={() => setIsTemplateListModalOpen(false)}
        size="lg"
      >
        <div className="p-4">
          <p className="mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
            Select a template to apply to your current mapping. This will replace any existing mappings.
          </p>
          
          {templates.filter(t => t.targetSystem === selectedTargetSystem).length === 0 ? (
            <div className="text-center p-8 bg-carbon-gray-10 dark:bg-carbon-gray-90 rounded-lg">
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                No templates available for {effectiveTargetSystems.find(sys => sys.id === selectedTargetSystem)?.name}.
                Create a template by saving your mappings.
              </p>
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Template Name</TableHeader>
                    <TableHeader>Document Type</TableHeader>
                    <TableHeader>Mappings</TableHeader>
                    <TableHeader>Last Updated</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates
                    .filter(t => t.targetSystem === selectedTargetSystem)
                    .map(template => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {template.name}
                              {template.isDefault && (
                                <Tag type="green" className="ml-2">Default</Tag>
                              )}
                            </div>
                            <div className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                              {template.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.documentType && (
                            <Tag type="blue">
                              {template.documentType.charAt(0).toUpperCase() + template.documentType.slice(1)}
                            </Tag>
                          )}
                        </TableCell>
                        <TableCell>
                          {template.mappings.length} mappings
                        </TableCell>
                        <TableCell>
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => applyTemplate(template.id)}
                          >
                            Apply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </Modal>
      
      {/* Import Mappings Modal */}
      <Modal
        open={isImportModalOpen}
        modalHeading="Import Field Mappings"
        primaryButtonText="Import"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleImportMappings}
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <div className="p-4">
          <p className="mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
            Import mappings from a JSON file. This will replace your current mappings.
          </p>
          
          <div className="border-2 border-dashed p-8 rounded-lg flex flex-col items-center justify-center">
            <Upload size={32} className="mb-4 text-carbon-gray-70" />
            <p className="text-center mb-4">
              Drag and drop a mapping file here or click to browse
            </p>
            <Button onClick={handleImportMappings}>Choose File</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FieldMappingDesigner;