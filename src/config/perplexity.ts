/**
 * Perplexity AI Configuration
 * Centralized model configuration to easily switch models without code changes
 *
 * Model Format: provider/model (e.g., "perplexity/llama-3.1-sonar-small-128k-online")
 * API Endpoint: https://api.perplexity.ai/chat/completions (legacy)
 *              https://api.perplexity.ai/v1/responses (new)
 */

export const PERPLEXITY_CONFIG = {
  // Read from environment variable, fallback to current model
  // Format: provider/model (e.g., "perplexity/llama-3.1-sonar-small-128k-online")
  model: process.env.PERPLEXITY_MODEL || 'perplexity/llama-3.1-sonar-small-128k-online',
  
  // Available models for reference (provider/model format)
  availableModels: {
    'sonar-small': 'perplexity/llama-3.1-sonar-small-128k-online',
    'sonar-large': 'perplexity/llama-3.1-sonar-large-128k-online',
    'sonar-huge': 'perplexity/llama-3.1-sonar-huge-128k-online',
  },

  // Temperature for consistent translations
  temperature: 0.2,
  
  // Legacy API endpoint (still works, simpler)
  apiUrl: 'https://api.perplexity.ai/chat/completions',
  
  // New API endpoint (supports reasoning, tools, etc.)
  apiUrlV1: 'https://api.perplexity.ai/v1/responses',
};

export const getPerplexityModel = (): string => {
  return PERPLEXITY_CONFIG.model;
};
