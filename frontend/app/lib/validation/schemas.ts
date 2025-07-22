/**
 * Validation schemas for form inputs and API data
 */

import { z } from 'zod';
import {
  AgentType,
  AgentStatus,
  ConversationStatus,
  WorkflowStatus,
  StepType,
  MessageRole,
  MessageType,
  KnowledgeUploadMethod,
  KnowledgeCategory,
  KnowledgeFileType,
} from '../interfaces';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const urlSchema = z.string().url('Invalid URL format');
const nonEmptyString = z.string().min(1, 'This field is required');
const optionalString = z.string().optional();

// Agent Configuration Schema
export const agentConfigurationSchema = z.object({
  name: z.string()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Agent name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  agent_type: z.nativeEnum(AgentType, {
    errorMap: () => ({ message: 'Please select a valid agent type' }),
  }),
  

  
  model_provider: nonEmptyString.refine(
    (val) => ['openai', 'anthropic', 'google', 'local'].includes(val),
    'Please select a valid model provider'
  ),
  
  model_id: nonEmptyString,
  
  model_parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(1).max(100000).optional(),
    top_p: z.number().min(0).max(1).optional(),
    frequency_penalty: z.number().min(-2).max(2).optional(),
    presence_penalty: z.number().min(-2).max(2).optional(),
  }).optional(),
  
  instructions: z.array(z.string().min(1, 'Instruction cannot be empty'))
    .min(1, 'At least one instruction is required')
    .max(20, 'Maximum 20 instructions allowed'),
  
  tools: z.array(z.string()).max(50, 'Maximum 50 tools allowed'),
  
  knowledge_sources: z.array(z.string()).max(100, 'Maximum 100 knowledge sources allowed'),
  
  enable_memory: z.boolean(),
  enable_knowledge_search: z.boolean(),
  is_public: z.boolean(),
  
  tags: z.array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 tags allowed'),
  
  status: z.nativeEnum(AgentStatus).optional(),
});

// Chat Conversation Schema
export const conversationCreateSchema = z.object({
  agent_id: nonEmptyString,
  title: z.string()
    .min(1, 'Conversation title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
});

export const conversationUpdateSchema = z.object({
  title: z.string()
    .min(1, 'Conversation title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
  is_pinned: z.boolean().optional(),
});

// Message Schema
export const messageContentSchema = z.object({
  type: z.nativeEnum(MessageType),
  text: z.string().optional(),
  image_url: urlSchema.optional(),
  file_url: urlSchema.optional(),
  file_name: z.string().optional(),
  file_size: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

export const messageCreateSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.array(messageContentSchema).min(1, 'Message content is required'),
  raw_content: nonEmptyString,
  metadata: z.record(z.any()).optional(),
});

// Workflow Template Schema
export const workflowStepSchema = z.object({
  step_id: nonEmptyString,
  name: z.string()
    .min(1, 'Step name is required')
    .max(100, 'Step name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Step description must be less than 500 characters')
    .optional(),
  step_type: z.nativeEnum(StepType),
  step_order: z.number().min(1),
  agent_id: z.string().optional(),
  input_schema: z.record(z.any()).optional(),
  output_schema: z.record(z.any()).optional(),
  timeout_seconds: z.number().min(1).max(86400), // Max 24 hours
  retry_count: z.number().min(0).max(10),
  conditions: z.array(z.record(z.any())).optional(),
  metadata: z.record(z.any()).optional(),
});

export const workflowTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Workflow name is required')
    .max(100, 'Workflow name must be less than 100 characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.string()
    .min(1, 'Category is required')
    .refine(
      (val) => ['automation', 'analysis', 'collaboration', 'processing', 'custom'].includes(val),
      'Please select a valid category'
    ),
  
  complexity_level: z.string()
    .refine(
      (val) => ['simple', 'moderate', 'complex'].includes(val),
      'Please select a valid complexity level'
    ),
  
  steps: z.array(workflowStepSchema)
    .min(1, 'At least one step is required')
    .max(100, 'Maximum 100 steps allowed'),
  
  input_schema: z.record(z.any()).optional(),
  output_schema: z.record(z.any()).optional(),
  
  tags: z.array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed'),
  
  is_public: z.boolean(),
  requires_approval: z.boolean(),
  is_scheduled: z.boolean(),
  schedule_config: z.record(z.any()).optional(),
});

// Workflow Execution Schema
export const workflowExecuteSchema = z.object({
  template_id: nonEmptyString,
  input_data: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high']),
  timeout_seconds: z.number().min(1).max(86400),
  max_retries: z.number().min(0).max(10),
  metadata: z.record(z.any()).optional(),
});

// Knowledge Management Schemas
export const knowledgeCategorySchema = z.enum([
  'documentation',
  'research',
  'training',
  'reference',
  'policy',
  'procedure',
  'other'
], {
  errorMap: () => ({ message: 'Please select a valid knowledge category' }),
});

export const knowledgeFileTypeSchema = z.enum([
  'pdf',
  'txt',
  'csv',
  'json',
  'docx'
], {
  errorMap: () => ({ message: 'Unsupported file type. Supported types: PDF, TXT, CSV, JSON, DOCX' }),
});

export const knowledgeUploadMethodSchema = z.enum([
  'file',
  'text',
  'url'
], {
  errorMap: () => ({ message: 'Please select a valid upload method' }),
});

// File Upload Schema
export const knowledgeFileUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  category: knowledgeCategorySchema,
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
  file: z.instanceof(File, { message: 'Please select a file to upload' })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        return ['pdf', 'txt', 'csv', 'json', 'docx'].includes(fileExt || '');
      },
      'Unsupported file type. Supported types: PDF, TXT, CSV, JSON, DOCX'
    ),
});

// Text Upload Schema
export const knowledgeTextUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  category: knowledgeCategorySchema,
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
  textContent: z.string()
    .min(1, 'Text content is required')
    .max(100000, 'Text content must be less than 100,000 characters'),
});

// URL Upload Schema
export const knowledgeUrlUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  category: knowledgeCategorySchema,
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
  url: urlSchema,
});

// Combined Knowledge Upload Schema
export const knowledgeUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  category: knowledgeCategorySchema,
  uploadMethod: knowledgeUploadMethodSchema,
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional(),
}).and(
  z.discriminatedUnion('uploadMethod', [
    z.object({
      uploadMethod: z.literal('file'),
      file: z.instanceof(File, { message: 'Please select a file to upload' })
        .refine(
          (file) => file.size <= 10 * 1024 * 1024,
          'File size must be less than 10MB'
        )
        .refine(
          (file) => {
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            return ['pdf', 'txt', 'csv', 'json', 'docx'].includes(fileExt || '');
          },
          'Unsupported file type. Supported types: PDF, TXT, CSV, JSON, DOCX'
        ),
    }),
    z.object({
      uploadMethod: z.literal('text'),
      textContent: z.string()
        .min(1, 'Text content is required')
        .max(100000, 'Text content must be less than 100,000 characters'),
    }),
    z.object({
      uploadMethod: z.literal('url'),
      url: urlSchema,
    }),
  ])
);

// User Authentication Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Search and Filter Schemas
export const agentSearchSchema = z.object({
  query: z.string().optional(),
  agent_type: z.nativeEnum(AgentType).optional(),
  status: z.nativeEnum(AgentStatus).optional(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

export const conversationSearchSchema = z.object({
  query: z.string().optional(),
  agent_id: z.string().optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
  is_pinned: z.boolean().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

export const workflowSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  complexity: z.string().optional(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {} as Record<string, string>);
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

export const validateField = <T>(schema: z.ZodSchema<T>, value: unknown): {
  isValid: boolean;
  error?: string;
} => {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Validation failed' };
  }
};

// Type exports for TypeScript
export type AgentConfigurationInput = z.infer<typeof agentConfigurationSchema>;
export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;
export type ConversationUpdateInput = z.infer<typeof conversationUpdateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type WorkflowTemplateInput = z.infer<typeof workflowTemplateSchema>;
export type WorkflowExecuteInput = z.infer<typeof workflowExecuteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AgentSearchInput = z.infer<typeof agentSearchSchema>;
export type ConversationSearchInput = z.infer<typeof conversationSearchSchema>;
export type WorkflowSearchInput = z.infer<typeof workflowSearchSchema>;
