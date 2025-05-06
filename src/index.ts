import { initCore } from "./communicator/core";
import MockAgentCommunicator from "./communicator/testing_mutating/test_agent";
import MockCoreCommunicator from "./communicator/testing/mock_core";

const core = initCore()
const mock1 = new MockCoreCommunicator();
const mock2 = new MockAgentCommunicator();