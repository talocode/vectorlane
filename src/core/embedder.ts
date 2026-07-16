import { createHash } from "node:crypto";
import { normalizeVector } from "./math.js";
import { EmbeddingError } from "./errors.js";

export interface EmbeddingProvider {
  name: string;
  model: string;
  dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

class LocalHashEmbeddingProvider implements EmbeddingProvider {
  name = "local-hash";
  model = "local-hash";
  dimensions = 256;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.embedSingle(text));
  }

  private embedSingle(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const tokens = text.toLowerCase().split(/[\s\W]+/).filter((t) => t.length > 0);
    for (const token of tokens) {
      const hash = createHash("sha256").update(token).digest();
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] += (hash[i % hash.length] / 255.0) * 2 - 1;
      }
    }
    return normalizeVector(vector);
  }
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = "openai";
  model: string;
  dimensions = 1536;
  private apiKey: string;

  constructor(model?: string) {
    this.model = model ?? "text-embedding-3-small";
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    if (!this.apiKey) {
      throw new EmbeddingError("OPENAI_API_KEY environment variable is required for OpenAI embeddings");
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new EmbeddingError(`OpenAI API error: ${response.status}`, { status: response.status, body });
    }
    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((item) => item.embedding);
  }
}

class TeraEmbeddingProvider implements EmbeddingProvider {
  name = "tera";
  model: string;
  dimensions = 1024;
  private apiKey: string;
  private apiBase: string;

  constructor(model?: string) {
    this.model = model ?? "tera-embed-v1";
    this.apiKey = process.env.TALOCODE_API_KEY ?? process.env.TERA_API_KEY ?? "";
    this.apiBase = process.env.TERA_API_BASE_URL ?? "";
    if (!this.apiKey) {
      throw new EmbeddingError("TALOCODE_API_KEY or TERA_API_KEY environment variable is required for Tera embeddings");
    }
    if (!this.apiBase) {
      throw new EmbeddingError("TERA_API_BASE_URL environment variable is required for Tera embeddings");
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.apiBase}/v1/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new EmbeddingError(`Tera API error: ${response.status}`, { status: response.status, body });
    }
    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((item) => item.embedding);
  }
}

class DummyEmbeddingProvider implements EmbeddingProvider {
  name = "dummy";
  model = "dummy";
  dimensions = 128;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.embedSingle(text));
  }

  private embedSingle(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const hash = createHash("md5").update(text).digest();
    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = (hash[i % hash.length] / 255.0) * 2 - 1;
    }
    return normalizeVector(vector);
  }
}

export function createEmbeddingProvider(name?: string, model?: string): EmbeddingProvider {
  const providerName = name ?? "local-hash";
  switch (providerName) {
    case "local-hash": return new LocalHashEmbeddingProvider();
    case "openai": return new OpenAIEmbeddingProvider(model);
    case "tera": return new TeraEmbeddingProvider(model);
    case "dummy": return new DummyEmbeddingProvider();
    default: throw new EmbeddingError(`Unknown embedding provider: ${providerName}`);
  }
}

export async function embedTexts(texts: string[], provider?: EmbeddingProvider): Promise<number[][]> {
  const p = provider ?? createEmbeddingProvider();
  return p.embed(texts);
}
