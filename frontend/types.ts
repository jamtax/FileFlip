export interface TablePreview {
  table_id: string | undefined;
  page?: number; // Added page property to resolve the error
  fixed?: boolean;
  // Define your type properties here
}