import Message from "./message";

export type MessageListener = (msg: Message) => void;

interface NamedMiddleware {
    (msg: Message, next: () => void): void;
    middleware_name?: string;
}

export type Middleware = NamedMiddleware;