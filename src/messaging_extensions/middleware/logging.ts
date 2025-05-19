import Message from "../../base/message";
import { Middleware } from "../../base/middleware";
import { MessageLogger, defaultLogger } from "../message_logger";

interface LoggerMiddleware extends Middleware {
    logger: MessageLogger;
}

export function log_middleware(middleware?: Middleware, logger: MessageLogger = defaultLogger): LoggerMiddleware {
    if (!middleware) {
        const simple_logger: LoggerMiddleware = (msg: Message, next: () => void) => {
            logger.log(msg, 1, {
                log_source: "message_logging_middleware",
            });
            next();
        };
        simple_logger.middleware_name = "log_message";
        simple_logger.logger = logger;
        return simple_logger;
    }

    const logging_wrapper: LoggerMiddleware = (msg: Message, next: () => void) => {
        logger.log(msg, 1, {
            log_source: "action_logging_middleware",

            middleware: middleware.middleware_name || "[anonymous]",
            phase: "before"
        });

        middleware(msg, () => {
            logger.log(msg, 3, {
                log_source: "action_logging_middleware",

                middleware: middleware.middleware_name || "[anonymous]",
                phase: "after"
            });
            next();
        });
    };

    logging_wrapper.middleware_name = "log_middleware_action";
    logging_wrapper.logger = logger;
    return logging_wrapper;
}

