import { subscribe_to } from "../../base/event_pool";
import Message from "../../base/message";
import { addresses, client_comm, server_comm } from "./addresses";

const coreA = client_comm(addresses.coreA);
const coreB = client_comm(addresses.coreB);
const local = server_comm(addresses.coreC);

console.log("Restart C");

subscribe_to("RECIEVE_MSG", (e) => {
    const msg: Message = e.data;
    console.log(msg.content);
    coreB.message("Hi back C -> B")
});