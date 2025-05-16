import HTTPServerCommunicator from "../../communicator/http_server";
import Address from "../../base/address";
import { initCore } from "../../communicator/core";
import { subscribe_to } from "../../base/event_pool";

const core1_id = "core1";
const core2_id = "core2";
const port = 3000;

// Core communicator ~ somewhat the manager
initCore(core1_id);
// Pool communicator ~ Long term: Allows to listen in,  for now: Log out
// Server communicator ~ listens to messages via http
const core2_address = new Address(core2_id, "core");
const httpIn = new HTTPServerCommunicator(
    core2_address,
    port
);

subscribe_to("RECEIVE_MSG", (e) => {
    console.log(e.data.content);
})