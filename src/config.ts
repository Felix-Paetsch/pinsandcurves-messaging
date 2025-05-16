export interface Config {
    // If true, unhandled errors will be thrown rather than just logged
    hard_errors: boolean;
}

const conf: Config = {
    hard_errors: false
};

export function getConfig(): Readonly<Config> {
    return conf;
}