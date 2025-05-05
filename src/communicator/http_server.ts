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
    }

    private handleRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): void {
        if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(`error: only POST allowed`);
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const msg = Message.deserialize(body);

                if (msg.target.agrees_with(this)) {
                    return this.recieve_http_request(msg, res);
                }

                this.send(msg);
                res.statusCode = 200;
                res.end('ok');
            } catch (err: any) {
                this.internal_event("MSG_ERROR", {
                    message: new Message(this.get_address()),
                    err: CommunicationError.ERROR_RESPONSE
                });
                res.statusCode = 400;
                res.end(`error: ${err.message || 'invalid message'}`);
            }
        });

        req.on('error', () => {
            this.internal_event("MSG_ERROR", {
                message: new Message(this.get_address()),
                err: CommunicationError.COMMUNICATION_FAILED
            });
            res.statusCode = 500;
            res.end(`error: communication failed`);
        });
    }

    recieve_http_request(msg: Message, res: http.ServerResponse<http.IncomingMessage>) {
        res.statusCode = 200;
        res.end('ok');
        this.receive(msg);
    }

    public close(): void {
        this.server.close();
    }
}
