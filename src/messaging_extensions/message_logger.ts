import { ICommunicator } from "../base/communicator"
import Message, { MessageTransmissionState } from "../base/message"

function getStackTrace(skipLevels: number = 0): string {
    const error = new Error();
    const stack = error.stack || '';
    const lines = stack.split('\n').map(line => line.trim());
    return lines.slice(skipLevels + 1).join('\n');
}

export type LogContext = {
    log_source: string | null;
    [key: string]: any;
};

export class MessageLog {
    public readonly message: Message;
    public readonly timestamp: number;
    public readonly stack: string;
    public readonly communicator: ICommunicator | null;
    public readonly message_state: MessageTransmissionState | null;
    public readonly context: LogContext;

    constructor(
        message: Message,
        stack_skip_level: number = 0,
        context: Record<string, any> = {}
    ) {
        this.message = message;
        this.timestamp = Date.now();
        this.stack = getStackTrace(stack_skip_level + 1);
        this.context = {
            log_source: context.log_source ?? null,
            ...context
        };
        this.communicator = message.computed_data.communicator as ICommunicator | null;
        this.message_state = message.computed_data.message_state;
    }

    serialize(): Record<string, any> {
        return {
            timestamp: this.timestamp,
            stack: this.stack,
            context: this.context,
            communicator: this.communicator?.type || null,
            message_state: this.message_state,
            message: this.message.serialize_log()
        };
    }
}

export class MessageLogger {
    private logs: MessageLog[] = [];

    log(message: Message, stack_skip_level: number = 0, context: Record<string, any> = {}): MessageLog {
        const log = new MessageLog(message, stack_skip_level + 2, context);
        this.logs.push(log);
        return log;
    }

    get_logs(): readonly MessageLog[] {
        return this.logs;
    }
}

