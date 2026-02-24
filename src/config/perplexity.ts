/**
 * Perplexity AI Configuration
 * Centralized model configuration to easily switch models without code changes
 */

export const PERPLEXITY_CONFIG = {
  // Read from environment variable, fallback to current model
  model: process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online',
  
  // Available models for reference
  availableModels: {
    'sonar-small': 'llama-3.1-sonar-small-128k-online',
    'sonar-large': 'llama-3.1-sonar-large-128k-online',
    'sonar-huge': 'llama-3.1-sonar-huge-128k-online',
  },

  // Temperature for consistent translations
  temperature: 0.2,
  
  // API endpoint
  apiUrl: 'https://api.perplexity.ai/chat/completions',
};

export const getPerplexityModel = (): string => {
  return PERPLEXITY_CONFIG.model;
};
