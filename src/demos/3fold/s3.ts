import { initCore } from "../../communicator/core";
import { addresses, client_comm, server_comm } from "./addresses";

console.log("Restart C");

initCore(addresses.coreC.id);
const coreA = client_comm(addresses.coreA);
const coreB = client_comm(addresses.coreB);
const local = server_comm(addresses.coreC);


local.listen((msg) => {
    if (
        !msg.meta_data.verifiedA
        && !msg.meta_data.verifiedB
    ) {
        console.log("ERR");
        throw new Error("Message not verified!");
    }
    console.log(msg.content);
    coreB.message("Hi back C -> B")
});