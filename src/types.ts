type TUnsubscribe = () => void;

export interface ILocalStorageAdapter {
    setState: (nextState: string) => void;
    subscribe: (notifyListener: () => void) => TUnsubscribe;
    getSnapshot: () => unknown;
}

export interface ISetEventPayload extends Pick<StorageEvent, 'key' | 'storageArea' | 'oldValue' | 'newValue' | 'url'> {}

export interface ISerializer {
    parse(value: string): unknown;
    stringify(value: unknown): string;
}

export type TUseSyncLocalStorageReturnType<T> = [
    state: T | null,
    methods: {
        set: (nextState: T) => void;
        remove: () => void;
    },
];
