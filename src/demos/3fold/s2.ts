import { addresses, client_comm, server_comm } from "./addresses";
import { subscribe_to } from "../../base/event_pool";
import Message from "../../base/message";
const coreA = client_comm(addresses.coreA);
const local = server_comm(addresses.coreB);
const coreC = client_comm(addresses.coreC);

console.log("Restart B");

subscribe_to("RECIEVE_MSG", (e) => {
    const msg: Message = e.data;
    console.log(msg.content);

    if (msg.content == "Hi A -> B") {
        coreC.message("Hi B -> C");
    } else if (msg.content == "Hi back C -> B") {
        coreA.message("Hi back B -> A");
    }
});