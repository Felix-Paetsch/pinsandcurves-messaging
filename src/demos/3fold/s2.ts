import { addresses, client_comm, server_comm } from "./addresses";
import { bi_middleware } from "../../messaging_extensions/bi_messaging/bi_message";
import { PreMessage } from "../../base/message";
import { subscribe_to } from "../../base/event_pool";
import Core, { initCore } from "../../communicator/core";

console.log("Restart B");

initCore(addresses.coreB.id);
const coreA = client_comm(addresses.coreA);
const local = server_comm(addresses.coreB);
const coreC = client_comm(addresses.coreC);

Core().use(
    bi_middleware((msg, respond, next) => {
        respond(new PreMessage(`Hello ${msg.content}`));
    })
)

/*
    subscribe_to("RECIEVE_MSG", (e) => {
        console.log(e.data);
    });

    subscribe_to("MSG_ERROR", (e) => {
        console.trace(e.data);
    });
*/