// http_in.ts

import * as http from 'http';
import Address from "../base/address";
import Message from "../base/message";
import Communicator from "../base/communicator";
import { CommunicatorError } from "../base/communicator_error";

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
            this.internal_event("ERROR", {
                error: new CommunicatorError("INITIALIZATION_FAILED", `Failed to initialize HTTP server: ${e.message}`, e)
            });
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
                const error = new CommunicatorError("INVALID_MESSAGE", err.message || 'Invalid message format', err);
                if (!res.writableEnded) {
                    res.statusCode = 400;
                    res.end(`error: ${error.message}`);
                }
                this.internal_event("ERROR", {
                    error,
                    message: new Message(this.get_address())
                });
            }
        });

        req.on('error', (err) => {
            const error = new CommunicatorError("COMMUNICATION_FAILED", "Request processing failed", err);
            if (!res.writableEnded) {
                res.statusCode = 500;
                res.end(`error: ${error.message}`);
            }
            this.internal_event("ERROR", {
                error,
                message: new Message(this.get_address())
            });
        });
    }

    transmit_message() {
        throw new CommunicatorError("INTERNAL_ERROR", "HTTPServerCommunicator can't send messages");
    }

    /*
        receive_http_request(msg: Message, res: http.ServerResponse<http.IncomingMessage>) {
            res.statusCode = 200;
            res.end('ok');
            this.send(msg);
        }
    */

    public close(): void {
        this.server.close();
    }
}
