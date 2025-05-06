import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Address from "../../base/address";
import Message from "../../base/message";
import Communicator from "../../base/communicator";
import Core from "../core";

export default class LoggingCommunicator extends Communicator {
    private logPath: string;

    constructor(logFilePath: string = './log.txt') {
        const host_id = Core().host_id;
        const plugin_id = uuidv4();
        super(new Address(host_id, plugin_id), "logging", "MSG_SINK");
        this.logPath = path.resolve(logFilePath);
    }

    receive(msg: Message): void {
        const entry = `[${new Date().toISOString()}]\nMeta Data: ${JSON.stringify(msg.meta_data)
            }\nContent:  ${JSON.stringify(msg.content)
            }\n`;
        fs.appendFile(this.logPath, entry, (err) => {
            if (err) console.error("Failed to write log:", err);
        });
    }
}
