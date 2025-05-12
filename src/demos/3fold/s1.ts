import { subscribe_to } from "../../base/event_pool";
import Core, { initCore } from "../../communicator/core";
import BidirectionalMessage, { bi_middleware } from "../../messaging_extensions/bi_messaging/bi_message";
import { addresses, client_comm, server_comm } from "./addresses";

console.log("Restart A");

initCore(addresses.coreA.id);
const local = server_comm(addresses.coreA);
const coreB = client_comm(addresses.coreB);
const coreC = client_comm(addresses.coreC);

Core().use(bi_middleware())

const msg = new BidirectionalMessage(coreB.get_address(), "Martin");
msg.send().then(r => {
    console.log(r.content);
});

/*
    subscribe_to("MSG_ERROR", (e) => {
        console.trace(e.data);
    });
*/