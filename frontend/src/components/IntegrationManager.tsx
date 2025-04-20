// File: frontend/src/components/IntegrationManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Tile,
  Tag,
  InlineNotification,
  Modal,
  TextInput,
  Toggle,
  Dropdown,
  PasswordInput,
  FormGroup,
  Accordion,
  AccordionItem,
  Grid,
  Column,
  CodeSnippet,
  FileUploader,
  Search,
  ToastNotification,
  Tab,
  Tabs,
  OverflowMenu,
  OverflowMenuItem,
  InlineLoading
} from '@carbon/react';
import {
  Cloud,
  Link,
  Add,
  TrashCan,
  Edit,
  Locked,
  Unlocked,
  Information,
  Play,
  Settings,
  Deploy,
  Application,
  CloudUpload,
  UserAvatar,
  LogoDiscord,
  LogoSlack,
  LogoGithub,
  Code,
  CloudDownload,
  DataVis,
  Save,
  Export,
  Renew
} from '@carbon/icons-react';

// Define types for integrations
interface IntegrationConfig {
  id: string;
  name: string;
  type: 'accounting' | 'storage' | 'crm' | 'webhook' | 'custom';
  provider: string;
  isActive: boolean;
  credentials: Record<string, string>;
  settings: Record<string, any>;
  lastSynced?: string;
  createdAt: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  autoSync: boolean;
  syncFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
  syncSettings: {
    onlyExportVerified: boolean;
    includeMetadata: boolean;
    formatOverride?: string;
    mergeTables: boolean;
    targetLocation?: string;
  };
  error?: string;
}

// Integration providers with their configuration options
interface IntegrationProvider {
  id: string;
  name: string;
  type: IntegrationConfig['type'];
  icon: React.ReactNode;
  description: string;
  credentialFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'select';
    required: boolean;
    options?: Array<{ id: string; text: string }>;
    placeholder?: string;
  }>;
  settings: Array<{
    key: string;
    label: string;
    type: 'text' | 'toggle' | 'select' | 'number';
    required: boolean;
    options?: Array<{ id: string; text: string }>;
    default?: any;
    placeholder?: string;
  }>;
}

interface IntegrationManagerProps {
  onIntegrationConfigured?: (integration: IntegrationConfig) => void;
}

const IntegrationManager: React.FC<IntegrationManagerProps> = ({ onIntegrationConfigured }) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [newIntegration, setNewIntegration] = useState<Partial<IntegrationConfig>>({
    name: '',
    type: 'accounting',
    provider: '',
    isActive: true,
    credentials: {},
    settings: {},
    status: 'disconnected',
    autoSync: false,
    syncSettings: {
      onlyExportVerified: true,
      includeMetadata: true,
      mergeTables: false
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'error' | 'success' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('configured');
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  
  // Sample integration providers
  const integrationProviders: IntegrationProvider[] = [
    {
      id: 'sage',
      name: 'Sage Accounting',
      type: 'accounting',
      icon: <DataVis size={32} />,
      description: 'Connect to Sage Accounting to automatically export converted data',
      credentialFields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Your Sage API key'
        },
        {
          key: 'accountId',
          label: 'Account ID',
          type: 'text',
          required: true,
          placeholder: 'Your Sage account ID'
        }
      ],
      settings: [
        {
          key: 'environment',
          label: 'Environment',
          type: 'select',
          required: true,
          options: [
            { id: 'production', text: 'Production' },
            { id: 'sandbox', text: 'Sandbox' }
          ],
          default: 'sandbox'
        },
        {
          key: 'defaultAccount',
          label: 'Default Account',
          type: 'text',
          required: false,
          placeholder: 'Default account code'
        }
      ]
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      type: 'accounting',
      icon: <DataVis size={32} />,
      description: 'Connect to QuickBooks to sync your converted files',
      credentialFields: [
        {
          key: 'clientId',
          label: 'Client ID',
          type: 'text',
          required: true
        },
        {
          key: 'clientSecret',
          label: 'Client Secret',
          type: 'password',
          required: true
        },
        {
          key: 'realmId',
          label: 'Realm ID',
          type: 'text',
          required: true
        }
      ],
      settings: [
        {
          key: 'environment',
          label: 'Environment',
          type: 'select',
          required: true,
          options: [
            { id: 'production', text: 'Production' },
            { id: 'sandbox', text: 'Sandbox' }
          ],
          default: 'sandbox'
        }
      ]
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      type: 'storage',
      icon: <CloudUpload size={32} />,
      description: 'Connect to Dropbox to automatically save converted files',
      credentialFields: [
        {
          key: 'accessToken',
          label: 'Access Token',
          type: 'password',
          required: true
        }
      ],
      settings: [
        {
          key: 'folderPath',
          label: 'Folder Path',
          type: 'text',
          required: false,
          placeholder: '/FileFlip Exports'
        }
      ]
    },
    {
      id: 'gdrive',
      name: 'Google Drive',
      type: 'storage',
      icon: <CloudUpload size={32} />,
      description: 'Connect to Google Drive to store your converted files',
      credentialFields: [
        {
          key: 'clientId',
          label: 'Client ID',
          type: 'text',
          required: true
        },
        {
          key: 'clientSecret',
          label: 'Client Secret',
          type: 'password',
          required: true
        },
        {
          key: 'refreshToken',
          label: 'Refresh Token',
          type: 'password',
          required: true
        }
      ],
      settings: [
        {
          key: 'folderId',
          label: 'Folder ID',
          type: 'text',
          required: false
        }
      ]
    },
    {
      id: 'webhook',
      name: 'Webhook',
      type: 'webhook',
      icon: <Code size={32} />,
      description: 'Set up a webhook to notify external systems when conversions complete',
      credentialFields: [
        {
          key: 'url',
          label: 'Webhook URL',
          type: 'text',
          required: true,
          placeholder: 'https://your-webhook-endpoint.com'
        },
        {
          key: 'secret',
          label: 'Secret Key',
          type: 'password',
          required: false,
          placeholder: 'Optional: Secret key for webhook authentication'
        }
      ],
      settings: [
        {
          key: 'method',
          label: 'HTTP Method',
          type: 'select',
          required: true,
          options: [
            { id: 'POST', text: 'POST' },
            { id: 'PUT', text: 'PUT' }
          ],
          default: 'POST'
        },
        {
          key: 'contentType',
          label: 'Content Type',
          type: 'select',
          required: true,
          options: [
            { id: 'application/json', text: 'JSON' },
            { id: 'application/x-www-form-urlencoded', text: 'Form URL Encoded' }
          ],
          default: 'application/json'
        },
        {
          key: 'includeFileData',
          label: 'Include File Data',
          type: 'toggle',
          required: false,
          default: false
        }
      ]
    },
    {
      id: 'slack',
      name: 'Slack',
      type: 'webhook',
      icon: <LogoSlack size={32} />,
      description: 'Get notified in Slack when conversions complete',
      credentialFields: [
        {
          key: 'webhookUrl',
          label: 'Webhook URL',
          type: 'text',
          required: true,
          placeholder: 'https://hooks.slack.com/services/...'
        }
      ],
      settings: [
        {
          key: 'channel',
          label: 'Channel',
          type: 'text',
          required: false,
          placeholder: '#conversions'
        },
        {
          key: 'username',
          label: 'Bot Username',
          type: 'text',
          required: false,
          placeholder: 'FileFlip Bot'
        },
        {
          key: 'notifyOnError',
          label: 'Notify on Errors Only',
          type: 'toggle',
          required: false,
          default: false
        }
      ]
    },
    {
      id: 'custom',
      name: 'Custom API',
      type: 'custom',
      icon: <Application size={32} />,
      description: 'Connect to any custom API endpoint',
      credentialFields: [
        {
          key: 'baseUrl',
          label: 'Base URL',
          type: 'text',
          required: true,
          placeholder: 'https://api.example.com'
        },
        {
          key: 'apiKey',
          label: 'API Key/Token',
          type: 'password',
          required: false
        },
        {
          key: 'authType',
          label: 'Authentication Type',
          type: 'select',
          required: true,
          options: [
            { id: 'none', text: 'None' },
            { id: 'apiKey', text: 'API Key' },
            { id: 'bearer', text: 'Bearer Token' },
            { id: 'basic', text: 'Basic Auth' }
          ]
        }
      ],
      settings: [
        {
          key: 'headers',
          label: 'Custom Headers (JSON)',
          type: 'text',
          required: false,
          placeholder: '{"Content-Type": "application/json"}'
        },
        {
          key: 'timeout',
          label: 'Timeout (seconds)',
          type: 'number',
          required: false,
          default: 30
        }
      ]
    }
  ];
  
  // Initialize with sample integrations
  useEffect(() => {
    // Simulated loading of integrations from localStorage or API
    const loadIntegrations = () => {
      const savedIntegrations = localStorage.getItem('fileflip-integrations');
      if (savedIntegrations) {
        try {
          setIntegrations(JSON.parse(savedIntegrations));
        } catch (error) {
          console.error('Failed to load integrations:', error);
          setIntegrations(getSampleIntegrations());
        }
      } else {
        setIntegrations(getSampleIntegrations());
      }
    };
    
    loadIntegrations();
  }, []);
  
  // Save integrations to localStorage when they change
  useEffect(() => {
    if (integrations.length > 0) {
      localStorage.setItem('fileflip-integrations', JSON.stringify(integrations));
    }
  }, [integrations]);
  
  // Filter integrations based on search query
  const filteredIntegrations = integrations.filter(integration => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      integration.name.toLowerCase().includes(query) ||
      integration.provider.toLowerCase().includes(query) ||
      integration.type.toLowerCase().includes(query)
    );
  });
  
  // Generate sample integrations for demo
  const getSampleIntegrations = (): IntegrationConfig[] => {
    return [
      {
        id: 'integration_123456',
        name: 'Sage Accounting Export',
        type: 'accounting',
        provider: 'sage',
        isActive: true,
        credentials: {
          apiKey: '••••••••••••••••',
          accountId: 'SA12345'
        },
        settings: {
          environment: 'sandbox',
          defaultAccount: '6000'
        },
        lastSynced: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        status: 'connected',
        autoSync: true,
        syncFrequency: 'daily',
        syncSettings: {
          onlyExportVerified: true,
          includeMetadata: true,
          formatOverride: 'sage',
          mergeTables: false,
          targetLocation: '/invoices'
        }
      },
      {
        id: 'integration_654321',
        name: 'Dropbox Storage',
        type: 'storage',
        provider: 'dropbox',
        isActive: true,
        credentials: {
          accessToken: '••••••••••••••••'
        },
        settings: {
          folderPath: '/FileFlip Exports'
        },
        lastSynced: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        createdAt: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
        status: 'connected',
        autoSync: true,
        syncFrequency: 'hourly',
        syncSettings: {
          onlyExportVerified: false,
          includeMetadata: true,
          mergeTables: true
        }
      }
    ];
  };
  
  // Find provider details
  const getProviderDetails = (providerId: string): IntegrationProvider | undefined => {
    return integrationProviders.find(provider => provider.id === providerId);
  };
  
  // Handle creating a new integration
  const handleCreateIntegration = () => {
    if (!newIntegration.name || !newIntegration.provider) {
      setNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    const provider = getProviderDetails(newIntegration.provider);
    if (!provider) return;
    
    // Check if all required credential fields are filled
    const missingCredentials = provider.credentialFields
      .filter(field => field.required)
      .filter(field => !newIntegration.credentials?.[field.key]);
    
    if (missingCredentials.length > 0) {
      setNotification({
        type: 'error',
        title: 'Missing Credentials',
        message: `Please provide values for: ${missingCredentials.map(f => f.label).join(', ')}`
      });
      return;
    }
    
    const newId = `integration_${Date.now()}`;
    const createdIntegration: IntegrationConfig = {
      id: newId,
      name: newIntegration.name || 'New Integration',
      type: newIntegration.type as IntegrationConfig['type'],
      provider: newIntegration.provider,
      isActive: newIntegration.isActive !== false,
      credentials: newIntegration.credentials || {},
      settings: newIntegration.settings || {},
      createdAt: new Date().toISOString(),
      status: 'pending',
      autoSync: newIntegration.autoSync || false,
      syncFrequency: newIntegration.syncFrequency,
      syncSettings: newIntegration.syncSettings || {
        onlyExportVerified: true,
        includeMetadata: true,
        mergeTables: false
      }
    };
    
    setIntegrations([...integrations, createdIntegration]);
    
    // Reset form
    setNewIntegration({
      name: '',
      type: 'accounting',
      provider: '',
      isActive: true,
      credentials: {},
      settings: {},
      status: 'disconnected',
      autoSync: false,
      syncSettings: {
        onlyExportVerified: true,
        includeMetadata: true,
        mergeTables: false
      }
    });
    
    // Close modal
    setIsAddModalOpen(false);
    
    // Show success notification
    setNotification({
      type: 'success',
      title: 'Integration Added',
      message: `${createdIntegration.name} has been successfully added. Testing connection...`
    });
    
    // Simulate testing the connection
    setTimeout(() => {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === newId 
            ? { 
                ...integration, 
                status: Math.random() > 0.2 ? 'connected' : 'error',
                error: Math.random() > 0.2 ? undefined : 'Failed to connect: Invalid credentials'
              } 
            : integration
        )
      );
    }, 2000);
    
    // Notify parent if callback provided
    if (onIntegrationConfigured) {
      onIntegrationConfigured(createdIntegration);
    }
  };
  
  // Handle updating an integration
  const handleUpdateIntegration = () => {
    if (!selectedIntegration) return;
    
    const updatedIntegrations = integrations.map(integration => 
      integration.id === selectedIntegration.id ? selectedIntegration : integration
    );
    
    setIntegrations(updatedIntegrations);
    setIsEditModalOpen(false);
    
    // Show success notification
    setNotification({
      type: 'success',
      title: 'Integration Updated',
      message: `${selectedIntegration.name} has been successfully updated.`
    });
  };
  
  // Handle deleting an integration
  const handleDeleteIntegration = () => {
    if (!selectedIntegration) return;
    
    const updatedIntegrations = integrations.filter(
      integration => integration.id !== selectedIntegration.id
    );
    
    setIntegrations(updatedIntegrations);
    setIsDeleteModalOpen(false);
    
    // Show success notification
    setNotification({
      type: 'success',
      title: 'Integration Removed',
      message: `${selectedIntegration.name} has been removed.`
    });
  };
  
  // Handle testing a connection
  const handleTestConnection = (integration: IntegrationConfig) => {
    setIsTestingConnection(true);
    setSelectedIntegration(integration);
    
    // Simulate API call
    setTimeout(() => {
      // 80% chance of success for demo
      const success = Math.random() > 0.2;
      
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integration.id 
            ? { 
                ...i, 
                status: success ? 'connected' : 'error',
                error: success ? undefined : 'Connection test failed: Invalid credentials or network issue'
              } 
            : i
        )
      );
      
      setNotification({
        type: success ? 'success' : 'error',
        title: success ? 'Connection Successful' : 'Connection Failed',
        message: success 
          ? `Successfully connected to ${integration.name}` 
          : `Failed to connect to ${integration.name}. Please check your credentials and try again.`
      });
      
      setIsTestingConnection(false);
    }, 2000);
  };
  
  // Handle syncing
  const handleSync = (integration: IntegrationConfig) => {
    setIsSyncing(true);
    setSelectedIntegration(integration);
    
    // Simulate API call
    setTimeout(() => {
      // 90% chance of success for demo
      const success = Math.random() > 0.1;
      
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integration.id 
            ? { 
                ...i, 
                lastSynced: new Date().toISOString(),
                status: success ? 'connected' : 'error',
                error: success ? undefined : 'Sync failed: Network timeout'
              } 
            : i
        )
      );
      
      setNotification({
        type: success ? 'success' : 'error',
        title: success ? 'Sync Successful' : 'Sync Failed',
        message: success 
          ? `Successfully synced with ${integration.name}` 
          : `Failed to sync with ${integration.name}. Please try again.`
      });
      
      setIsSyncing(false);
    }, 3000);
  };
  
  // Toggle integration active state
  const toggleIntegrationActive = (integration: IntegrationConfig) => {
    setIntegrations(prev => 
      prev.map(i => 
        i.id === integration.id 
          ? { ...i, isActive: !i.isActive } 
          : i
      )
    );
  };
  
  // Render credentials form based on provider
  const renderCredentialsForm = (providerId: string, isEdit: boolean = false) => {
    const provider = getProviderDetails(providerId);
    if (!provider) return null;
    
    return (
      <div className="space-y-4">
        {provider.credentialFields.map(field => (
          <div key={field.key}>
            {field.type === 'password' ? (
              <PasswordInput
                id={`${isEdit ? 'edit' : 'new'}-${field.key}`}
                labelText={`${field.label}${field.required ? ' *' : ''}`}
                value={
                  isEdit
                    ? selectedIntegration?.credentials[field.key] || ''
                    : newIntegration.credentials?.[field.key] || ''
                }
                onChange={(e) => {
                  if (isEdit && selectedIntegration) {
                    setSelectedIntegration({
                      ...selectedIntegration,
                      credentials: {
                        ...selectedIntegration.credentials,
                        [field.key]: e.target.value
                      }
                    });
                  } else {
                    setNewIntegration({
                      ...newIntegration,
                      credentials: {
                        ...(newIntegration.credentials || {}),
                        [field.key]: e.target.value
                      }
                    });
                  }
                }}
                placeholder={field.placeholder}
              />
            ) : field.type === 'select' && field.options ? (
              <Dropdown
                id={`${isEdit ? 'edit' : 'new'}-${field.key}`}
                titleText={`${field.label}${field.required ? ' *' : ''}`}
                label="Select an option"
                items={field.options}
                selectedItem={
                  isEdit && selectedIntegration?.credentials[field.key]
                    ? { id: selectedIntegration.credentials[field.key], text: field.options.find(o => o.id === selectedIntegration.credentials[field.key])?.text || '' }
                    : newIntegration.credentials?.[field.key]
                    ? { id: newIntegration.credentials[field.key], text: field.options.find(o => o.id === newIntegration.credentials[field.key])?.text || '' }
                    : null
                }
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    if (isEdit && selectedIntegration) {
                      setSelectedIntegration({
                        ...selectedIntegration,
                        credentials: {
                          ...selectedIntegration.credentials,
                          [field.key]: selectedItem.id
                        }
                      });
                    } else {
                      setNewIntegration({
                        ...newIntegration,
                        credentials: {
                          ...(newIntegration.credentials || {}),
                          [field.key]: selectedItem.id
                        }
                      });
                    }
                  }
                }}
              />
            ) : (
              <TextInput
                id={`${isEdit ? 'edit' : 'new'}-${field.key}`}
                labelText={`${field.label}${field.required ? ' *' : ''}`}
                value={
                  isEdit
                    ? selectedIntegration?.credentials[field.key] || ''
                    : newIntegration.credentials?.[field.key] || ''
                }
                onChange={(e) => {
                  if (isEdit && selectedIntegration) {
                    setSelectedIntegration({
                      ...selectedIntegration,
                      credentials: {
                        ...selectedIntegration.credentials,
                        [field.key]: e.target.value
                      }
                    });
                  } else {
                    setNewIntegration({
                      ...newIntegration,
                      credentials: {
                        ...(newIntegration.credentials || {}),
                        [field.key]: e.target.value
                      }
                    });
                  }
                }}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render settings form based on provider
  const renderSettingsForm = (providerId: string, isEdit: boolean = false) => {
    const provider = getProviderDetails(providerId);
    if (!provider) return null;
    
    return (
      <div className="space-y-4">
        {provider.settings.map(setting => (
          <div key={setting.key}>
            {setting.type === 'toggle' ? (
              <Toggle
                id={`${isEdit ? 'edit' : 'new'}-${setting.key}`}
                labelText={`${setting.label}${setting.required ? ' *' : ''}`}
                toggled={
                  isEdit
                    ? selectedIntegration?.settings[setting.key] !== undefined
                      ? selectedIntegration.settings[setting.key]
                      : setting.default
                    : newIntegration.settings?.[setting.key] !== undefined
                    ? newIntegration.settings[setting.key]
                    : setting.default
                }
                onChange={(toggled) => {
                  if (isEdit && selectedIntegration) {
                    setSelectedIntegration({
                      ...selectedIntegration,
                      settings: {
                        ...selectedIntegration.settings,
                        [setting.key]: toggled
                      }
                    });
                  } else {
                    setNewIntegration({
                      ...newIntegration,
                      settings: {
                        ...(newIntegration.settings || {}),
                        [setting.key]: toggled
                      }
                    });
                  }
                }}
              />
            ) : setting.type === 'select' && setting.options ? (
              <Dropdown
                id={`${isEdit ? 'edit' : 'new'}-${setting.key}`}
                titleText={`${setting.label}${setting.required ? ' *' : ''}`}
                label="Select an option"
                items={setting.options}
                selectedItem={
                  isEdit && selectedIntegration?.settings[setting.key]
                    ? { id: selectedIntegration.settings[setting.key], text: setting.options.find(o => o.id === selectedIntegration.settings[setting.key])?.text || '' }
                    : newIntegration.settings?.[setting.key]
                    ? { id: newIntegration.settings[setting.key], text: setting.options.find(o => o.id === newIntegration.settings[setting.key])?.text || '' }
                    : setting.default
                    ? { id: setting.default, text: setting.options.find(o => o.id === setting.default)?.text || '' }
                    : null
                }
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    if (isEdit && selectedIntegration) {
                      setSelectedIntegration({
                        ...selectedIntegration,
                        settings: {
                          ...selectedIntegration.settings,
                          [setting.key]: selectedItem.id
                        }
                      });
                    } else {
                      setNewIntegration({
                        ...newIntegration,
                        settings: {
                          ...(newIntegration.settings || {}),
                          [setting.key]: selectedItem.id
                        }
                      });
                    }
                  }
                }}
              />
            ) : setting.type === 'number' ? (
              <TextInput
                id={`${isEdit ? 'edit' : 'new'}-${setting.key}`}
                labelText={`${setting.label}${setting.required ? ' *' : ''}`}
                type="number"
                value={
                  isEdit
                    ? selectedIntegration?.settings[setting.key] !== undefined
                      ? selectedIntegration.settings[setting.key]
                      : setting.default !== undefined ? setting.default : ''
                    : newIntegration.settings?.[setting.key] !== undefined
                    ? newIntegration.settings[setting.key]
                    : setting.default !== undefined ? setting.default : ''
                }
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  if (isEdit && selectedIntegration) {
                    setSelectedIntegration({
                      ...selectedIntegration,
                      settings: {
                        ...selectedIntegration.settings,
                        [setting.key]: value
                      }
                    });
                  } else {
                    setNewIntegration({
                      ...newIntegration,
                      settings: {
                        ...(newIntegration.settings || {}),
                        [setting.key]: value
                      }
                    });
                  }
                }}
                placeholder={setting.placeholder}
              />
            ) : (
              <TextInput
                id={`${isEdit ? 'edit' : 'new'}-${setting.key}`}
                labelText={`${setting.label}${setting.required ? ' *' : ''}`}
                value={
                  isEdit
                    ? selectedIntegration?.settings[setting.key] !== undefined
                      ? selectedIntegration.settings[setting.key]
                      : setting.default !== undefined ? setting.default : ''
                    : newIntegration.settings?.[setting.key] !== undefined
                    ? newIntegration.settings[setting.key]
                    : setting.default !== undefined ? setting.default : ''
                }
                onChange={(e) => {
                  if (isEdit && selectedIntegration) {
                    setSelectedIntegration({
                      ...selectedIntegration,
                      settings: {
                        ...selectedIntegration.settings,
                        [setting.key]: e.target.value
                      }
                    });
                  } else {
                    setNewIntegration({
                      ...newIntegration,
                      settings: {
                        ...(newIntegration.settings || {}),
                        [setting.key]: e.target.value
                      }
                    });
                  }
                }}
                placeholder={setting.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render sync settings form
  const renderSyncSettingsForm = (isEdit: boolean = false) => {
    const syncSettings = isEdit && selectedIntegration 
      ? selectedIntegration.syncSettings
      : newIntegration.syncSettings || {
          onlyExportVerified: true,
          includeMetadata: true,
          mergeTables: false
        };
        
    const syncFrequency = isEdit && selectedIntegration
      ? selectedIntegration.syncFrequency
      : newIntegration.syncFrequency;
      
    const autoSync = isEdit && selectedIntegration
      ? selectedIntegration.autoSync
      : newIntegration.autoSync;
    
    return (
      <div className="space-y-4">
        <Toggle
          id={`${isEdit ? 'edit' : 'new'}-auto-sync`}
          labelText="Automatic Synchronization"
          toggled={autoSync === true}
          onChange={(toggled) => {
            if (isEdit && selectedIntegration) {
              setSelectedIntegration({
                ...selectedIntegration,
                autoSync: toggled
              });
            } else {
              setNewIntegration({
                ...newIntegration,
                autoSync: toggled
              });
            }
          }}
        />
        
        {(isEdit ? selectedIntegration?.autoSync : newIntegration.autoSync) && (
          <Dropdown
            id={`${isEdit ? 'edit' : 'new'}-sync-frequency`}
            titleText="Sync Frequency"
            label="Select frequency"
            items={[
              { id: 'hourly', text: 'Hourly' },
              { id: 'daily', text: 'Daily' },
              { id: 'weekly', text: 'Weekly' },
              { id: 'monthly', text: 'Monthly' }
            ]}
            selectedItem={
              syncFrequency 
                ? { id: syncFrequency, text: syncFrequency.charAt(0).toUpperCase() + syncFrequency.slice(1) } 
                : null
            }
            onChange={({ selectedItem }) => {
              if (selectedItem) {
                if (isEdit && selectedIntegration) {
                  setSelectedIntegration({
                    ...selectedIntegration,
                    syncFrequency: selectedItem.id as IntegrationConfig['syncFrequency']
                  });
                } else {
                  setNewIntegration({
                    ...newIntegration,
                    syncFrequency: selectedItem.id as IntegrationConfig['syncFrequency']
                  });
                }
              }
            }}
          />
        )}
        
        <Toggle
          id={`${isEdit ? 'edit' : 'new'}-only-export-verified`}
          labelText="Only Export Verified Data"
          toggled={syncSettings.onlyExportVerified !== false}
          onChange={(toggled) => {
            if (isEdit && selectedIntegration) {
              setSelectedIntegration({
                ...selectedIntegration,
                syncSettings: {
                  ...selectedIntegration.syncSettings,
                  onlyExportVerified: toggled
                }
              });
            } else {
              setNewIntegration({
                ...newIntegration,
                syncSettings: {
                  ...(newIntegration.syncSettings || {}),
                  onlyExportVerified: toggled
                }
              });
            }
          }}
        />
        
        <Toggle
          id={`${isEdit ? 'edit' : 'new'}-include-metadata`}
          labelText="Include File Metadata"
          toggled={syncSettings.includeMetadata !== false}
          onChange={(toggled) => {
            if (isEdit && selectedIntegration) {
              setSelectedIntegration({
                ...selectedIntegration,
                syncSettings: {
                  ...selectedIntegration.syncSettings,
                  includeMetadata: toggled
                }
              });
            } else {
              setNewIntegration({
                ...newIntegration,
                syncSettings: {
                  ...(newIntegration.syncSettings || {}),
                  includeMetadata: toggled
                }
              });
            }
          }}
        />
        
        <Toggle
          id={`${isEdit ? 'edit' : 'new'}-merge-tables`}
          labelText="Merge Tables into Single Output"
          toggled={syncSettings.mergeTables === true}
          onChange={(toggled) => {
            if (isEdit && selectedIntegration) {
              setSelectedIntegration({
                ...selectedIntegration,
                syncSettings: {
                  ...selectedIntegration.syncSettings,
                  mergeTables: toggled
                }
              });
            } else {
              setNewIntegration({
                ...newIntegration,
                syncSettings: {
                  ...(newIntegration.syncSettings || {}),
                  mergeTables: toggled
                }
              });
            }
          }}
        />
        
        <Dropdown
          id={`${isEdit ? 'edit' : 'new'}-format-override`}
          titleText="Format Override (Optional)"
          label="Select format"
          items={[
            { id: '', text: 'Use default format' },
            { id: 'csv', text: 'CSV' },
            { id: 'xlsx', text: 'Excel (XLSX)' },
            { id: 'sage', text: 'Sage Format' }
          ]}
          selectedItem={
            syncSettings.formatOverride 
              ? { id: syncSettings.formatOverride, text: syncSettings.formatOverride === 'csv' ? 'CSV' : syncSettings.formatOverride === 'xlsx' ? 'Excel (XLSX)' : 'Sage Format' } 
              : { id: '', text: 'Use default format' }
          }
          onChange={({ selectedItem }) => {
            if (selectedItem) {
              if (isEdit && selectedIntegration) {
                setSelectedIntegration({
                  ...selectedIntegration,
                  syncSettings: {
                    ...selectedIntegration.syncSettings,
                    formatOverride: selectedItem.id || undefined
                  }
                });
              } else {
                setNewIntegration({
                  ...newIntegration,
                  syncSettings: {
                    ...(newIntegration.syncSettings || {}),
                    formatOverride: selectedItem.id || undefined
                  }
                });
              }
            }
          }}
        />
        
        <TextInput
          id={`${isEdit ? 'edit' : 'new'}-target-location`}
          labelText="Target Location (Optional)"
          placeholder="e.g., /exports or account-code"
          value={syncSettings.targetLocation || ''}
          onChange={(e) => {
            if (isEdit && selectedIntegration) {
              setSelectedIntegration({
                ...selectedIntegration,
                syncSettings: {
                  ...selectedIntegration.syncSettings,
                  targetLocation: e.target.value || undefined
                }
              });
            } else {
              setNewIntegration({
                ...newIntegration,
                syncSettings: {
                  ...(newIntegration.syncSettings || {}),
                  targetLocation: e.target.value || undefined
                }
              });
            }
          }}
        />
      </div>
    );
  };
  
  // Get status type for Tag component
  const getStatusType = (status: string): string => {
    switch (status) {
      case 'connected': return 'green';
      case 'disconnected': return 'gray';
      case 'error': return 'red';
      case 'pending': return 'blue';
      default: return 'gray';
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get relative time
  const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minutes ago`;
    
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hours ago`;
    
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} days ago`;
  };
  
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
          Integration Manager
        </h3>
        
        <div className="flex space-x-2">
          <Button
            kind="tertiary"
            renderIcon={Code}
            onClick={() => setIsWebhookModalOpen(true)}
            size="sm"
          >
            Webhook URL
          </Button>
          
          <Button
            renderIcon={Add}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Integration
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
      
      <Tabs selected={activeTab === 'configured' ? 0 : 1} onChange={({ selectedIndex }) => {
        setActiveTab(selectedIndex === 0 ? 'configured' : 'available');
      }}>
        <Tab id="configured-integrations" label="Configured Integrations">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                  Manage your existing integrations with external services.
                </p>
              </div>
              
              <Search
                id="search-integrations"
                labelText=""
                placeholder="Search integrations"
                size="sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {integrations.length === 0 ? (
              <Tile className="text-center p-8">
                <Cloud size={48} className="mx-auto mb-4 text-carbon-gray-50" />
                <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
                  No integrations configured. Click "Add Integration" to connect with external services.
                </p>
                <Button
                  renderIcon={Add}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Integration
                </Button>
              </Tile>
            ) : filteredIntegrations.length === 0 ? (
              <p className="text-center p-4 text-carbon-gray-70 dark:text-carbon-gray-30">
                No integrations match your search criteria.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredIntegrations.map(integration => {
                  const provider = getProviderDetails(integration.provider);
                  
                  return (
                    <Tile key={integration.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="mr-4 mt-1">
                            {provider?.icon || <Cloud size={32} />}
                          </div>
                          
                          <div>
                            <div className="flex items-center">
                              <h4 className="text-lg font-medium text-carbon-gray-100 dark:text-white mr-2">
                                {integration.name}
                              </h4>
                              <Tag type={getStatusType(integration.status)}>
                                {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                              </Tag>
                              {!integration.isActive && (
                                <Tag type="gray" className="ml-2">Disabled</Tag>
                              )}
                            </div>
                            
                            <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mt-1">
                              {provider?.name || integration.provider} • {integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}
                            </p>
                            
                            {integration.lastSynced && (
                              <p className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30 mt-2">
                                Last synced: {getRelativeTime(integration.lastSynced)}
                              </p>
                            )}
                            
                            {integration.error && (
                              <InlineNotification
                                kind="error"
                                title="Error"
                                subtitle={integration.error}
                                hideCloseButton
                                className="mt-3"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Toggle
                            id={`toggle-${integration.id}`}
                            labelText=""
                            hideLabel
                            toggled={integration.isActive}
                            onChange={() => toggleIntegrationActive(integration)}
                            className="mr-4"
                          />
                          
                          <OverflowMenu flipped>
                            <OverflowMenuItem 
                              itemText="Edit" 
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setIsEditModalOpen(true);
                              }}
                            />
                            <OverflowMenuItem 
                              itemText="Test Connection" 
                              onClick={() => handleTestConnection(integration)}
                              disabled={isTestingConnection}
                            />
                            <OverflowMenuItem 
                              itemText="Sync Now" 
                              onClick={() => handleSync(integration)}
                              disabled={isSyncing || integration.status !== 'connected' || !integration.isActive}
                            />
                            <OverflowMenuItem 
                              itemText="Delete" 
                              isDelete 
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setIsDeleteModalOpen(true);
                              }}
                            />
                          </OverflowMenu>
                          
                          {isTestingConnection && selectedIntegration?.id === integration.id && (
                            <InlineLoading description="Testing connection..." />
                          )}
                          
                          {isSyncing && selectedIntegration?.id === integration.id && (
                            <InlineLoading description="Syncing..." />
                          )}
                        </div>
                      </div>
                      
                      <Grid className="mt-4" condensed>
                        {integration.autoSync && (
                          <Column sm={2} md={3} lg={4}>
                            <div className="flex items-center">
                              <Renew size={16} className="mr-1 text-carbon-gray-70" />
                              <span className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                                Auto-sync: {integration.syncFrequency || 'Manual'}
                              </span>
                            </div>
                          </Column>
                        )}
                        
                        <Column sm={2} md={3} lg={4}>
                          <div className="flex items-center">
                            <Save size={16} className="mr-1 text-carbon-gray-70" />
                            <span className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                              Format: {integration.syncSettings.formatOverride || 'Default'}
                            </span>
                          </div>
                        </Column>
                        
                        {integration.syncSettings.targetLocation && (
                          <Column sm={2} md={3} lg={4}>
                            <div className="flex items-center">
                              <Export size={16} className="mr-1 text-carbon-gray-70" />
                              <span className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30">
                                Target: {integration.syncSettings.targetLocation}
                              </span>
                            </div>
                          </Column>
                        )}
                      </Grid>
                      
                      <div className="mt-4 flex justify-end">
                        <Button
                          kind="ghost"
                          renderIcon={Deploy}
                          onClick={() => handleSync(integration)}
                          disabled={isSyncing || integration.status !== 'connected' || !integration.isActive}
                          size="sm"
                        >
                          Sync Now
                        </Button>
                        
                        <Button
                          kind="ghost"
                          renderIcon={Settings}
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setIsEditModalOpen(true);
                          }}
                          size="sm"
                        >
                          Configure
                        </Button>
                      </div>
                    </Tile>
                  );
                })}
              </div>
            )}
          </div>
        </Tab>
        
        <Tab id="available-integrations" label="Available Integrations">
          <div className="p-4">
            <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
              Connect FileFlip with these services to automate your workflow. Click on a service to set it up.
            </p>
            
            <Grid>
              {integrationProviders.map(provider => {
                const isConfigured = integrations.some(i => i.provider === provider.id);
                
                return (
                  <Column key={provider.id} sm={4} md={4} lg={4} className="mb-4">
                    <Tile 
                      className={`h-full flex flex-col p-4 cursor-pointer transition-all ${isConfigured ? 'border-carbon-blue-40' : ''}`}
                      onClick={() => {
                        setSelectedProviderId(provider.id);
                        setNewIntegration({
                          ...newIntegration,
                          provider: provider.id,
                          type: provider.type
                        });
                        setIsAddModalOpen(true);
                      }}
                    >
                      <div className="flex items-center mb-3">
                        <div className="mr-3">{provider.icon}</div>
                        <div>
                          <h4 className="font-medium text-carbon-gray-100 dark:text-white">
                            {provider.name}
                          </h4>
                          <Tag type="blue" className="mt-1">
                            {provider.type.charAt(0).toUpperCase() + provider.type.slice(1)}
                          </Tag>
                        </div>
                      </div>
                      
                      <p className="text-sm text-carbon-gray-70 dark:text-carbon-gray-30 mb-3 flex-grow">
                        {provider.description}
                      </p>
                      
                      <div className="mt-auto">
                        {isConfigured ? (
                          <Tag type="green">Configured</Tag>
                        ) : (
                          <Button
                            kind="ghost"
                            renderIcon={Add}
                            size="sm"
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </Tile>
                  </Column>
                );
              })}
            </Grid>
          </div>
        </Tab>
      </Tabs>
      
      {/* Add Integration Modal */}
      <Modal
        open={isAddModalOpen}
        modalHeading="Add Integration"
        primaryButtonText="Add Integration"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleCreateIntegration}
        onRequestClose={() => setIsAddModalOpen(false)}
        size="lg"
      >
        <div className="p-4">
          <TextInput
            id="new-integration-name"
            labelText="Integration Name"
            placeholder="e.g., Sage Accounting Export"
            value={newIntegration.name || ''}
            onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
            className="mb-4"
          />
          
          <Dropdown
            id="new-integration-provider"
            titleText="Provider"
            label="Select a provider"
            items={integrationProviders.map(provider => ({
              id: provider.id,
              text: provider.name
            }))}
            selectedItem={
              newIntegration.provider 
                ? { 
                    id: newIntegration.provider, 
                    text: integrationProviders.find(p => p.id === newIntegration.provider)?.name || ''
                  } 
                : null
            }
            onChange={({ selectedItem }) => {
              if (selectedItem) {
                const provider = integrationProviders.find(p => p.id === selectedItem.id);
                setNewIntegration({
                  ...newIntegration,
                  provider: selectedItem.id,
                  type: provider?.type || 'custom',
                  // Reset credentials and settings when provider changes
                  credentials: {},
                  settings: {}
                });
              }
            }}
            className="mb-4"
          />
          
          {newIntegration.provider && (
            <Accordion>
              <AccordionItem title="Authentication" open>
                {renderCredentialsForm(newIntegration.provider)}
              </AccordionItem>
              
              <AccordionItem title="Settings">
                {renderSettingsForm(newIntegration.provider)}
              </AccordionItem>
              
              <AccordionItem title="Synchronization Settings">
                {renderSyncSettingsForm()}
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </Modal>
      
      {/* Edit Integration Modal */}
      <Modal
        open={isEditModalOpen}
        modalHeading={`Edit Integration: ${selectedIntegration?.name}`}
        primaryButtonText="Save Changes"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleUpdateIntegration}
        onRequestClose={() => setIsEditModalOpen(false)}
        size="lg"
      >
        {selectedIntegration && (
          <div className="p-4">
            <TextInput
              id="edit-integration-name"
              labelText="Integration Name"
              value={selectedIntegration.name}
              onChange={(e) => setSelectedIntegration({...selectedIntegration, name: e.target.value})}
              className="mb-4"
            />
            
            <Accordion>
              <AccordionItem title="Authentication" open>
                {renderCredentialsForm(selectedIntegration.provider, true)}
              </AccordionItem>
              
              <AccordionItem title="Settings">
                {renderSettingsForm(selectedIntegration.provider, true)}
              </AccordionItem>
              
              <AccordionItem title="Synchronization Settings">
                {renderSyncSettingsForm(true)}
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        modalHeading="Delete Integration"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
        onRequestSubmit={handleDeleteIntegration}
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        {selectedIntegration && (
          <p className="p-4">
            Are you sure you want to delete the integration with {selectedIntegration.name}? This action cannot be undone.
          </p>
        )}
      </Modal>
      
      {/* Webhook Information Modal */}
      <Modal
        open={isWebhookModalOpen}
        modalHeading="FileFlip Webhook URL"
        primaryButtonText="Close"
        onRequestSubmit={() => setIsWebhookModalOpen(false)}
        onRequestClose={() => setIsWebhookModalOpen(false)}
      >
        <div className="p-4">
          <p className="mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
            Use this webhook URL to receive notifications when conversions are completed. You can configure
            external systems to listen for these events.
          </p>
          
          <FormGroup legendText="Your Webhook URL">
            <CodeSnippet type="single" feedback="Copied to clipboard">
              https://fileflip.jamtax.co.za/api/webhook/YOUR_UNIQUE_ID
            </CodeSnippet>
          </FormGroup>
          
          <h4 className="font-medium text-carbon-gray-100 dark:text-white mt-6 mb-3">
            Webhook Payload Example
          </h4>
          
          <CodeSnippet type="multi" feedback="Copied to clipboard">
            {`{
  "event": "conversion.completed",
  "timestamp": "2025-04-19T15:30:45Z",
  "data": {
    "fileId": "file_1234567890",
    "fileName": "invoice_april.pdf",
    "outputFormat": "csv",
    "tableCount": 2,
    "status": "success"
  }
}`}
          </CodeSnippet>
          
          <h4 className="font-medium text-carbon-gray-100 dark:text-white mt-6 mb-3">
            Available Events
          </h4>
          
          <ul className="list-disc pl-5 text-carbon-gray-70 dark:text-carbon-gray-30">
            <li>conversion.completed - Triggered when a conversion is successfully completed</li>
            <li>conversion.failed - Triggered when a conversion fails</li>
            <li>integration.synced - Triggered when data is synced with an integration</li>
          </ul>
          
          <div className="mt-6">
            <Button
              kind="tertiary"
              renderIcon={Code}
              onClick={() => {
                // Generate a new webhook ID
                alert('A new webhook secret has been generated.');
              }}
            >
              Generate New Secret
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IntegrationManager;