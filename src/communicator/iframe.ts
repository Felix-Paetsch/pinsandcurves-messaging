import Address from '../base/address';
import Communicator from '../base/communicator';
import Message from "../base/message";
import Core from './core';

type PortEvent = {
    type: 'ck-message' | 'ck-successful-init';
    serialized_message?: string;
}

// A communicator living inside the iframe communicating with the outside world
class IframeInnerCommunicator extends Communicator {
    private port: MessagePort;

    private constructor(port: MessagePort, address: Address) {
        super(address, "iframe", "MSG_ALL");
        this.port = port;

        this.port.onmessage = (event: MessageEvent) => {
            const data = event.data as PortEvent;
            if (data.type === 'ck-message' && data.serialized_message) {
                this.incomming_message(
                    Message.deserialize(data.serialized_message)
                );
            }
        };
        this.port.start();
        this.port.postMessage({ type: 'ck-successful-init' });
    }

    static async init(): Promise<IframeInnerCommunicator> {
        return new Promise((resolve) => {
            // Start requesting init with a decay from 100ms to 1000ms
            let initAttempts = 0;
            let requestInterval = setInterval(() => {
                window.parent.postMessage({ type: 'ck-request-init' }, '*');
                if (initAttempts++ >= 10) { // After 1 second (10 attempts at 100ms each)
                    clearInterval(requestInterval);
                    requestInterval = setInterval(
                        () => {
                            window.parent.postMessage({ type: 'ck-request-init' }, '*');
                        },
                        1000
                    );
                }
            }, 100);

            const initListener = (event: MessageEvent) => {
                if (event.data.type === 'ck-port-init') {
                    clearInterval(requestInterval);
                    window.removeEventListener('message', initListener);

                    const port = event.ports[0];
                    const address = Address.deserialize(event.data.address);

                    resolve(new IframeInnerCommunicator(port, address));
                }
            };

            window.addEventListener('message', initListener);
        });
    }

    transmit_message(msg: Message): void {
        this.port.postMessage({
            type: 'ck-message',
            serialized_message: msg.serialize()
        } as PortEvent);
    }
}

// A communicator living in the parent window communicating with the iframe
class IframeOuterCommunicator extends Communicator {
    private port: MessagePort;
    private iframe: HTMLIFrameElement;
    private messageChannel: MessageChannel;

    constructor(iframeElement: HTMLIFrameElement, address: Address) {
        super(address, "parent", "MSG_ALL");
        this.iframe = iframeElement;
        this.messageChannel = new MessageChannel();
        this.port = this.messageChannel.port1;

        // Setup message handling on port1
        this.port.onmessage = (event: MessageEvent) => {
            const data = event.data as PortEvent;
            if (data.type === 'ck-message' && data.serialized_message) {
                this.incomming_message(
                    Message.deserialize(data.serialized_message)
                );
            } else if (data.type === 'ck-successful-init') {
                this.internal_event("INITIALIZED");
            }
        };
        this.port.start();

        // Listen for init requests from the iframe
        window.addEventListener('message', (event) => {
            if (event.source === this.iframe.contentWindow &&
                event.data.type === 'ck-request-init') {
                this.sendInitMessage();
            }
        });

        // Initial setup once iframe loads
        this.iframe.addEventListener('load', () => {
            this.sendInitMessage();
        });
    }

    private sendInitMessage(): void {
        this.iframe.contentWindow?.postMessage({
            type: 'ck-port-init',
            address: Core().get_address().serialize()
        }, '*', [this.messageChannel.port2]);
    }

    transmit_message(msg: Message): void {
        this.port.postMessage({
            type: 'ck-message',
            serialized_message: msg.serialize()
        } as PortEvent);
    }
}

export { IframeInnerCommunicator, IframeOuterCommunicator };