// Core Components
export { default as Communicator } from './base/communicator';
export type { ICommunicator } from './base/communicator';
export type { InternalEvent } from './base/communicator';

// Message Types
export { default as Message } from './base/message';
export type { IPreMessage, MessageMetaData, MessageTransmissionState, ComputedMessageData } from './base/message';

// Address
export { default as Address } from './base/address';

// Middleware
export type { Middleware, MessageListener } from './base/middleware';

// Error Handling
export { CommunicatorError } from './base/communicator_error';
export type { CommunicatorErrorType } from './base/communicator_error';

// Events
export type { CommunicatorEvent, CommunicatorEventType, ErrorEvent } from './base/event_pool';

// Proxy
export { ProxyCommunicator } from './communicator/proxy';
export type { IProxyCommunicator } from './communicator/proxy';

// Configuration
export type { Config } from './config';
export { getConfig } from './config'; 