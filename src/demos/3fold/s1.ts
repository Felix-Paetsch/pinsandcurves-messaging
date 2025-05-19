import Core, { initCore } from "../../communicator/core";
import BidirectionalMessage, { bi_middleware } from "../../messaging_extensions/middleware/bi_messaging";
import { addresses, client_comm, server_comm } from "./addresses";
import { Logging } from "../../messaging_extensions/proxy_methods/logging";
import defaultLogger from "../../messaging_extensions/message_logger";
import { log_middleware } from "../../messaging_extensions/middleware/logging";

console.log("Restart A");

initCore(addresses.coreA.id);
const local = server_comm(addresses.coreA);
const coreB = client_comm(addresses.coreB).apply_proxy(Logging());
const coreC = client_comm(addresses.coreC);

// Add logging middleware around bi_middleware
Core().use(
    log_middleware(bi_middleware())
);

const msg = new BidirectionalMessage(coreB.get_address(), "Martin");
msg.send().then(r => {
    console.log(r.content);
    // Log all messages from the logger
    console.log("\nMessage Log:");
    defaultLogger.get_logs().forEach(log => {
        console.log(`[${log.message_state}] ${log.context.log_source}:`,
            log.context.phase ? `phase=${log.context.phase}` : '',
            log.context.before ? `before=${log.context.before}` : '',
            log.context.after ? `after=${log.context.after}` : '',
            '\nMessage:', log.message.content,
            log.stack,
            '\n---'
        );
    });
});

/*
    subscribe_to("MSG_ERROR", (e) => {
        console.trace(e.data);
    });
*/