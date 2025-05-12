// http_in.ts

import * as http from 'http';
import Address from "../base/address";
import Message from "../base/message";
import Communicator from "../base/communicator";
import { CommunicationError } from "../base/communication_error";

export default class HTTPServerCommunicator extends Communicator {
    private server: http.Server;

    constructor(addr: Address, port: number = 8080) {
        super(addr, "http-in", "INITIALIZING");
        this.server = http.createServer(this.handleRequest.bind(this));
        this.server.listen(port, () => {
            this.modality = "MSG_SOURCE";
            this.internal_event("INITIALIZED");
        });
        this.server.on('error', (e) => {
            this.modality = "INACTIVE";
            this.internal_event("INIT_ERROR", e);
        });
    }

    private handleRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): void {
        if (req.method !== 'POST') {
            if (!res.writableEnded) {
                res.statusCode = 405;
                res.end(`error: only POST allowed`);
            }
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const msg = Message.deserialize(body);

                res.statusCode = 200;
                res.end('ok');
                this.incomming_message(msg);
            } catch (err: any) {
                if (!res.writableEnded) {
                    res.statusCode = 400;
                    res.end(`error: ${err.message || 'invalid message'}`);
                }
                this.internal_event("MSG_ERROR", {
                    message: new Message(this.get_address()),
                    err,
                    err_type: CommunicationError.ERROR_RESPONSE
                });
            }
        });

        req.on('error', (err) => {
            if (!res.writableEnded) {
                res.statusCode = 500;
                res.end(`error: communication failed`);
            }
            this.internal_event("MSG_ERROR", {
                message: new Message(this.get_address()),
                err,
                err_type: CommunicationError.COMMUNICATION_FAILED
            });
        });
    }

    transmit_message() {
        throw new Error("HTTPServerComminicator can't send messages!");
    }

    /*
        recieve_http_request(msg: Message, res: http.ServerResponse<http.IncomingMessage>) {
            res.statusCode = 200;
            res.end('ok');
            this.send(msg);
        }
    */

    public close(): void {
        this.server.close();
    }
}
