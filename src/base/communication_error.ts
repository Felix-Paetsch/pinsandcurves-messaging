export const CommunicationError = {
    UNKNOWN_TARGET: "unknown target", // Target is not known / finable

    INACCESSIBLE: "target not accessible", // Target was not there

    ERROR_RESPONSE: "target-side error", // Communicator Protocol worked, but sending messages didn't
    COMMUNICATION_FAILED: "communication failed" // Communicator Protocol didn't work, but we got any response
} as const;

export type CommunicationError = typeof CommunicationError[keyof typeof CommunicationError];
