import { ConnectorConfig } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Conversion_Key {
  id: UUIDString;
  __typename?: 'Conversion_Key';
}

export interface MappingTemplate_Key {
  id: UUIDString;
  __typename?: 'MappingTemplate_Key';
}

export interface TransactionRecord_Key {
  id: UUIDString;
  __typename?: 'TransactionRecord_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

