import Message from "../../base/message";
import { Middleware } from "../../base/middleware";
import { MessageLogger } from "../message_logger";

export function log_middleware(middleware?: Middleware): Middleware {
    const logger = new MessageLogger();

    if (!middleware) {
        const simple_logger: Middleware = (msg: Message, next: () => void) => {
            logger.log(msg, 1, {
                log_source: "message_logging_middleware",
            });
            next();
        };
        simple_logger.middleware_name = "log_message";
        return simple_logger;
    }

    const logging_wrapper: Middleware = (msg: Message, next: () => void) => {
        logger.log(msg, 1, {
            log_source: "action_logging_middleware",

            middleware: middleware.middleware_name || "[anonymous]",
            phase: "before"
        });

        middleware(msg, () => {
            logger.log(msg, 1, {
                log_source: "action_logging_middleware",

                middleware: middleware.middleware_name || "[anonymous]",
                phase: "after"
            });
            next();
        });
    };

    logging_wrapper.middleware_name = "log_middleware_action";
    return logging_wrapper;
}

