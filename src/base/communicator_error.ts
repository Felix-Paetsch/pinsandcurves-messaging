export type CommunicatorErrorType =
    | "UNKNOWN_TARGET"      // Target is not known / findable
    | "INACCESSIBLE"       // Target was not there
    | "ERROR_RESPONSE"     // Communicator Protocol worked, but sending messages didn't
    | "COMMUNICATION_FAILED" // Communicator Protocol didn't work, but we got any response
    | "INVALID_MESSAGE"    // Message format or content is invalid
    | "INITIALIZATION_FAILED" // Communicator failed to initialize
    | "INTERNAL_ERROR";    // Unexpected internal error

export class CommunicatorError extends Error {
    public is_handled: Boolean = false;

    constructor(
        public readonly type: CommunicatorErrorType,
        message: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'CommunicatorError';
    }

    static fromError(type: CommunicatorErrorType, error: Error): CommunicatorError {
        return new CommunicatorError(type, error.message, error);
    }

    throw_if_unhandled(): void {
        if (!this.is_handled) {
            throw this;
        }
    }
} 