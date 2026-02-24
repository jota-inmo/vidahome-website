/**
 * Perplexity AI Configuration
 * Centralized model configuration to easily switch models without code changes
 *
 * Current valid models (Feb 2026):
 * - sonar: Lightweight search model (recommended - fast, cheap)
 * - sonar-pro: Advanced search model
 * - sonar-reasoning-pro: Complex reasoning with Chain of Thought
 * - sonar-deep-research: Expert-level research
 */

export const PERPLEXITY_CONFIG = {
  // Read from environment variable, fallback to sonar (lightweight, cost-effective)
  model: process.env.PERPLEXITY_MODEL || 'sonar',
  
  // Available models for reference (Feb 2026)
  availableModels: {
    'sonar': 'sonar',  // Lightweight search - RECOMMENDED
    'sonar-pro': 'sonar-pro',  // Advanced search
    'reasoning': 'sonar-reasoning-pro',  // Complex reasoning
    'research': 'sonar-deep-research',  // Deep research
  },

  // Temperature for consistent translations
  temperature: 0.2,
  
  // API endpoint (chat/completions accepts sonar models)
  apiUrl: 'https://api.perplexity.ai/chat/completions',
};

export const getPerplexityModel = (): string => {
  return PERPLEXITY_CONFIG.model;
};
