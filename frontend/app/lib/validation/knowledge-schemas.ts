/**
 * Validation schemas for knowledge management
 */

import { z } from 'zod';

// Knowledge upload method enum
export enum KnowledgeUploadMethod {
  FILE = "file",
  TEXT = "text",
  URL = "url"
}

// Knowledge category enum
export enum KnowledgeCategory {
  GENERAL = "general",
  TECHNICAL = "technical",
  BUSINESS = "business",
  RESEARCH = "research",
  DOCUMENTATION = "documentation",
  TRAINING = "training",
  REFERENCE = "reference"
}

// Knowledge file type enum
export enum KnowledgeFileType {
  PDF = "pdf",
  TXT = "txt",
  DOCX = "docx",
  CSV = "csv",
  JSON = "json",
  MD = "md"
}

// Knowledge upload schema
export const knowledgeUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.nativeEnum(KnowledgeCategory)
    .default(KnowledgeCategory.GENERAL),
  
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
  
  file: z.instanceof(File, { message: 'Please select a file' })
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine(
      (file) => {
        const allowedTypes = [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/csv',
          'application/json',
          'text/markdown'
        ];
        return allowedTypes.includes(file.type);
      },
      'File type not supported. Please upload PDF, TXT, DOCX, CSV, JSON, or MD files'
    ),
  
  uploadMethod: z.nativeEnum(KnowledgeUploadMethod)
    .default(KnowledgeUploadMethod.FILE)
});

// Knowledge text upload schema
export const knowledgeTextUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.nativeEnum(KnowledgeCategory)
    .default(KnowledgeCategory.GENERAL),
  
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
  
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content must be less than 100,000 characters'),
  
  uploadMethod: z.literal(KnowledgeUploadMethod.TEXT)
});

// Knowledge URL upload schema
export const knowledgeUrlUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.nativeEnum(KnowledgeCategory)
    .default(KnowledgeCategory.GENERAL),
  
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
  
  url: z.string()
    .url('Please enter a valid URL')
    .min(1, 'URL is required'),
  
  uploadMethod: z.literal(KnowledgeUploadMethod.URL)
});

// Knowledge search schema
export const knowledgeSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(500, 'Search query must be less than 500 characters'),
  
  category: z.nativeEnum(KnowledgeCategory).optional(),
  
  fileType: z.nativeEnum(KnowledgeFileType).optional(),
  
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(20),
  
  offset: z.number()
    .min(0, 'Offset must be non-negative')
    .default(0)
});

// Export types
export type KnowledgeUploadFormData = z.infer<typeof knowledgeUploadSchema>;
export type KnowledgeTextUploadFormData = z.infer<typeof knowledgeTextUploadSchema>;
export type KnowledgeUrlUploadFormData = z.infer<typeof knowledgeUrlUploadSchema>;
export type KnowledgeSearchFormData = z.infer<typeof knowledgeSearchSchema>;
