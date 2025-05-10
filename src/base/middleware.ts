import Message from "./message";

export type Middleware = (msg: Message, next: Middleware) => void;