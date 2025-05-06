import HTTPServerCommunicator from "../../communicator/http_server";
import Address from "../../base/address";
import { initCore } from "../../communicator/core";
import MockAgentCommunicator from "../../communicator/testing_mutating/test_agent";

const core1_id = "core1";
const core2_id = "core2";
const port = 3000;

// Core communicator ~ somewhat the manager
initCore(core1_id);
// Pool communicator ~ Long term: Allows to listen in,  for now: Log out
const mock = new MockAgentCommunicator("agent1");
// Server communicator ~ listens to messages via http
const core2_address = new Address(core2_id, "core");
const httpIn = new HTTPServerCommunicator(
    core2_address,
    port
);

