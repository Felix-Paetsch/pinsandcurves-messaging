import Address from "../../base/address";
import HTTPClientCommunicator from "../../communicator/http_client";
import HTTPServerCommunicator from "../../communicator/http_server";
import { ProxyCommunicator } from "../../communicator/proxy";
import { Lossy } from "../../messaging_extensions/proxy_methods/lossy";

type HttpAddress = {
    port: number
    id: string
}

export const addresses: Record<string, HttpAddress> = {
    coreA: { port: 3010, id: "coreA" },
    coreB: { port: 3009, id: "coreB" },
    coreC: { port: 3008, id: "coreC" },
}


export function server_comm(c: HttpAddress) {
    const original = new HTTPServerCommunicator(
        new Address(c.id),
        c.port
    );

    const p = ProxyCommunicator(original);
    p.apply_proxy(Lossy(1));
    return p;
}

export function client_comm(c: HttpAddress) {
    const original = new HTTPClientCommunicator(
        new Address(c.id),
        `http://localhost:${c.port}`
    );

    const p = ProxyCommunicator(original);
    p.apply_proxy(Lossy(1));
    return p;
}