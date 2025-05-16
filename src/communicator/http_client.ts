// http_out.ts

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { IncomingMessage } from 'http';
import Address from "../base/address";
import Message from "../base/message";
import Communicator from "../base/communicator";
import { CommunicatorError } from "../base/communicator_error";
import Core from './core';

export default class HTTPClientCommunicator extends Communicator {
    private endpoint: URL;

    constructor(addr: Address, endpointUrl: string) {
        super(addr, "http-out", "MSG_SINK");
        this.endpoint = new URL(endpointUrl);
    }

    transmit_message(msg: Message): void {
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

        req.on('error', (e) => {
            this.internal_event("ERROR", {
                error: new CommunicatorError("COMMUNICATION_FAILED", `Failed to send HTTP request: ${e.message}`, e),
                message: msg
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
                this.internal_event("ERROR", {
                    error: new CommunicatorError("INACCESSIBLE", "No status code received from server"),
                    message: msg
                });
                return;
            }

            if (statusCode < 200 || statusCode >= 300) {
                this.internal_event("ERROR", {
                    error: new CommunicatorError("ERROR_RESPONSE", `Server responded with status ${statusCode}`),
                    message: msg
                });
                return;
            }

            const text = body.trim();

            if (text === "ok") {
                return;
            }

            if (text.toLowerCase().startsWith("error")) {
                this.internal_event("ERROR", {
                    error: new CommunicatorError("ERROR_RESPONSE", `Server error: ${text}`),
                    message: msg
                });
                return;
            }

            try {
                const response = Message.deserialize(text);
                Core().send(response);
            } catch (error) {
                this.internal_event("ERROR", {
                    error: new CommunicatorError("INVALID_MESSAGE", "Failed to deserialize response message", error instanceof Error ? error : undefined),
                    message: msg
                });
            }
        });
    }

    receive(_msg: Message): void {
        throw new CommunicatorError("INTERNAL_ERROR", "HTTPOutCommunicator does not support receiving messages");
    }
}
