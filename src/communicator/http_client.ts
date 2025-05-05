// http_out.ts

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { IncomingMessage } from 'http';
import Address from "../base/address";
import Message from "../base/message";
import Communicator from "../base/communicator";
import { CommunicationError } from "../base/communication_error";
import Core from './core';

export default class HTTPClientCommunicator extends Communicator {
    private endpoint: URL;

    constructor(addr: Address, endpointUrl: string) {
        super(addr, "http-out", "MSG_SINK");
        this.endpoint = new URL(endpointUrl);
    }

    send(msg: Message): void {
        const data = msg.serialize();
        const isHttps = this.endpoint.protocol === 'https:';
        const transport = isHttps ? https : http;

        const req = transport.request({
            hostname: this.endpoint.hostname,
            port: this.endpoint.port || (isHttps ? 443 : 80),
            path: this.endpoint.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            this.handleResponse(res, msg);
        });

        req.on('error', () => {
            this.internal_event("MSG_ERROR", {
                message: msg,
                err: CommunicationError.COMMUNICATION_FAILED
            });
        });

        req.write(data);
        req.end();
    }

    private handleResponse(res: IncomingMessage, msg: Message): void {
        const { statusCode } = res;
        let body = "";

        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
            if (statusCode === undefined) {
                this.internal_event("MSG_ERROR", {
                    message: msg,
                    err: CommunicationError.INACCESSIBLE
                });
                return;
            }

            if (statusCode < 200 || statusCode >= 300) {
                this.internal_event("MSG_ERROR", {
                    message: msg,
                    err: CommunicationError.ERROR_RESPONSE
                });
                return;
            }

            const text = body.trim();

            if (text === "ok") {
                return;
            }

            if (text.toLowerCase().startsWith("error")) {
                this.internal_event("MSG_ERROR", {
                    message: msg,
                    err: CommunicationError.ERROR_RESPONSE
                });
                return;
            }

            try {
                const response = Message.deserialize(text);
                Core().send(response);
            } catch {
                this.internal_event("MSG_ERROR", {
                    message: msg,
                    err: CommunicationError.ERROR_RESPONSE
                });
            }
        });
    }

    receive(_msg: Message): void {
        throw new Error("HTTPOutCommunicator does not support receiving messages.");
    }
}
