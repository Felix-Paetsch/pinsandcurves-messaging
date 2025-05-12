import Message from "../../base/message";
import HTTPClientCommunicator from "../../communicator/http_client";
import Address from "../../base/address";
import { initCore } from "../../communicator/core";
import { subscribe_to } from "../../base/event_pool";

const core1_id = "core1";
const core2_id = "core2";
const port = 3000;

// Core communicator
initCore(core2_id);
// Client communicator ~ can send messages over http
const core1_address = new Address(core1_id, "core");
const httpOut = new HTTPClientCommunicator(
    core1_address,
    `http://localhost:${port}`
);

// Message
const msg = new Message(
    core1_address,
    "Awesome content!!!"
)

httpOut.send(msg);