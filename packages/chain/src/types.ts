/**
 * Vara Network connection options
 */
export interface ConnectionOptions {
  /** RPC endpoint URL */
  endpoint: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
}

/**
 * Program upload result
 */
export interface UploadResult {
  /** Program ID (address) on the network */
  programId: string;
  /** Block hash where the program was uploaded */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
}

/**
 * Message send result
 */
export interface SendMessageResult {
  /** Message ID */
  messageId: string;
  /** Block hash where the message was included */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
}

/**
 * State read result
 */
export interface ReadStateResult<T = unknown> {
  /** The state data */
  state: T;
  /** Block hash at which state was read */
  blockHash: string;
}

/**
 * Keypair for signing transactions
 * NOTE: In production, this should use proper key management
 */
export interface KeypairInfo {
  /** Public address */
  address: string;
  /** Type of keypair */
  type: 'sr25519' | 'ed25519';
}

/**
 * IDL (Interface Definition Language) structure
 */
export interface ProgramIdl {
  /** Service definitions */
  services: Record<string, ServiceIdl>;
  /** Type definitions */
  types: Record<string, TypeIdl>;
}

/**
 * Service definition in IDL
 */
export interface ServiceIdl {
  /** Methods (commands and queries) */
  methods: Record<string, MethodIdl>;
  /** Events emitted by the service */
  events?: Record<string, EventIdl>;
}

/**
 * Method definition in IDL
 */
export interface MethodIdl {
  /** Input parameters */
  params: Array<{ name: string; type: string }>;
  /** Return type */
  returns: string;
  /** Whether this is a query (read-only) or command */
  isQuery: boolean;
}

/**
 * Event definition in IDL
 */
export interface EventIdl {
  /** Event fields */
  fields: Array<{ name: string; type: string }>;
}

/**
 * Type definition in IDL
 */
export interface TypeIdl {
  /** Type kind (struct, enum, etc.) */
  kind: 'struct' | 'enum' | 'primitive' | 'array' | 'option';
  /** Fields for struct/enum */
  fields?: Array<{ name: string; type: string }>;
  /** Inner type for array/option */
  inner?: string;
}
