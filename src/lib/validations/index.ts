// Authentication validations
export * from './auth';

// Project validations
export * from './project';

// Client validations
export * from './client';

// Document validations
export * from './document';

// Calendar validations
export * from './calendar';

// Common validation utilities
import { z } from 'zod';

// Generic API response schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    success: z.boolean(),
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
        totalPages: z.number().optional(),
      })
      .optional(),
  });

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search schema
export const searchSchema = paginationSchema.extend({
  query: z.string().max(100).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Date range schema
export const dateRangeSchema = z
  .object({
    start: z.date(),
    end: z.date(),
  })
  .refine((data) => data.end >= data.start, {
    message: 'End date must be after start date',
    path: ['end'],
  });

// File upload schema
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255),
  mimetype: z.string().min(1, 'MIME type is required'),
  size: z.number().min(1, 'File size must be positive').max(50 * 1024 * 1024), // 50MB max
  buffer: z.instanceof(Buffer).optional(),
  url: z.string().url().optional(),
});

// Validation error schema
export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

// Audit log schema
export const auditLogSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  action: z.string().min(1, 'Action is required'),
  resource: z.string().min(1, 'Resource is required'),
  resourceId: uuidSchema,
  changes: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Common field validations
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format');
export const urlSchema = z.string().url('Invalid URL format');
export const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format');
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format');

// Type exports for common schemas
export type PaginationData = z.infer<typeof paginationSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type DateRangeData = z.infer<typeof dateRangeSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type ValidationErrorData = z.infer<typeof validationErrorSchema>;
export type AuditLogData = z.infer<typeof auditLogSchema>;