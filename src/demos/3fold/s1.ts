import { subscribe_to } from "../../base/event_pool";
import Message from "../../base/message";
import { addresses, client_comm, server_comm } from "./addresses";

const local = server_comm(addresses.coreA);
const coreB = client_comm(addresses.coreB);
const coreC = client_comm(addresses.coreC);

// Call C

console.log("Restart A");

coreB.message("Hi A -> B");
subscribe_to("RECIEVE_MSG", (e) => {
    const msg: Message = e.data;
    console.log(msg.content);
});