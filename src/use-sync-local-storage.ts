import { useDebugValue, useMemo, useSyncExternalStore, useCallback } from 'react';

import { LocalStorageAdapter } from './local-storage-adapter';
import type { ISerializer, TUseSyncLocalStorageReturnType } from './types';



/**
 * @todo: валидатор входящих/исходящих данных?
 * @todo: обработка ошибок и дефолтное значение?
 * @param key - ключ localStorage для подписки на изменения и внесения изменений. При обновлении выполняется переподписка и возврат нового значения.
 * @param [serializer=JSON] - объект сериалайзер - объект, сериализующий и десериализующий значение из localStorage.
 */
export function useSyncLocalStorage<T = unknown>(
    key: string,
    serializer: ISerializer = JSON,
): TUseSyncLocalStorageReturnType<T> {
    useDebugValue(`SyncLocalStorage Hook subscribed at ${key}`);

    // метод subscribe не должен пересоздаваться в рамках ключа, что бы не происходило переподписок, поэтому держим инстанс, пока не сменится ключ.
    const adapterInstance = useMemo(() => {
        return new LocalStorageAdapter(key);
    }, [key]);

    const value = useSyncExternalStore(adapterInstance.subscribe, adapterInstance.getSnapshot);

    const set = useCallback(
        (nextValue: T): void => {
            try {
                adapterInstance.setState(serializer.stringify(nextValue));
            } catch (e) {
                console.error(e);
            }
        },
        [adapterInstance, serializer],
    );

    // мемоизируем десериализованное значение по иммутабельному возвращаемому значению и сериализатору.
    const state = useMemo<T | null>(() => {
        try {
            return value ? (serializer.parse(value) as T | null) : null;
        } catch (e) {
            console.error(e);
            return null;
        }
    }, [serializer, value]);

    const remove = useCallback(() => {
        adapterInstance.deleteState();
    }, [adapterInstance]);

    return [
        state,
        {
            set,
            remove,
        },
    ];
}
