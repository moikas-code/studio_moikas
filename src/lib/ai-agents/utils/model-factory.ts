import { ChatXAI } from "@langchain/xai";

/**
 * Factory for creating xAI model instances
 */
export class model_factory {
  /**
   * Creates a new xAI model instance with the given options
   * @param model_options - Additional options to configure the model
   * @returns Configured ChatXAI instance
   */
  static create_xai_model(model_options: Record<string, unknown> = {}): ChatXAI {
    return new ChatXAI({
      apiKey: process.env.XAI_API_KEY,
      model: "grok-3-mini-latest",
      ...model_options,
    });
  }

  /**
   * Creates a legacy xAI model instance (for backward compatibility)
   * @param model_options - Additional options to configure the model
   * @returns Configured ChatXAI instance
   */
  static create_legacy_xai_model(model_options: Record<string, unknown> = {}): ChatXAI {
    return new ChatXAI({
      apiKey: process.env.XAI_API_KEY,
      model: "grok-3-mini",
      ...model_options,
    });
  }
}