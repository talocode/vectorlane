export {
  VectorLaneClient,
  type VectorLaneClientOptions,
  type IngestInput,
  type IngestTextInput,
  type IngestUrlInput,
  type SearchInput,
  type FolderIngestResult,
  type DoctorResult,
  type DemoResult,
  runDoctor,
  runDemo,
} from "./sdk/client.js";

export {
  createCollection,
  listCollections,
  getCollection,
  deleteCollection,
  addDocument,
  addChunks,
  addVectors,
  search,
  stats,
  clearCollection,
  type Collection,
  type DocumentRecord,
  type ChunkRecord,
  type EmbeddingRecord,
  type SearchResult,
  type IngestResult,
  type StatsResult,
} from "./core/store.js";

export {
  ingestText,
  ingestFile,
  ingestFolder,
  ingestUrl,
  type IngestOptions,
  type FolderIngestResult as FolderIngestResultCore,
  type IngestResult as IngestResultCore,
} from "./core/ingest.js";

export {
  importMemoryLane,
  importContextLane,
  syncMemoryLane,
  syncContextLane,
  type ImportResult,
} from "./core/integrations.js";

export {
  createEmbeddingProvider,
  embedTexts,
  type EmbeddingProvider,
} from "./core/embedder.js";

export { chunkText, type ChunkOptions } from "./core/chunker.js";

export {
  cosineSimilarity,
  normalizeVector,
  dotProduct,
  vectorMagnitude,
} from "./core/math.js";

export { buildCitation, buildMetadata, hashContent } from "./core/metadata.js";

export {
  formatCitation,
  formatCitationShort,
} from "./core/citations.js";

export {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  getDefaultConfig,
} from "./core/config.js";

export {
  ensureStorage,
  getStorageRoot,
  getCollectionsPath,
  getCollectionDir,
  getCollectionJsonPath,
} from "./core/storage.js";

export {
  VectorLaneError,
  CollectionNotFoundError,
  DocumentNotFoundError,
  ChunkNotFoundError,
  EmbeddingError,
  SearchError,
  IngestError,
  ConfigError,
  AuthError,
} from "./core/errors.js";

export type {
  Citation,
  ChunkMetadata,
  SearchFilter,
  VectorLaneConfig,
} from "./core/types.js";
