import type { ILocalStorageAdapter, ISetEventPayload } from "./types";

// module augmentation event payloads
declare global {
    interface WindowEventMap {
        'sync-store-change': CustomEvent<ISetEventPayload>;
    }
}

/**
 * Класс адаптера.
 *
 * <b>Все методы адаптера привязаны к инстансу и не теряют контекст this</b> - подходят для передачи в колбеки без биндинга.
 * @constructor
 */
export class LocalStorageAdapter implements ILocalStorageAdapter {
    constructor(private listeningKey: string) {}

    /**
     * Выполняет запись сериализованного значения в localStorage.
     * @param nextState
     */
    setState = (nextState: string) => {
        const oldValue = localStorage.getItem(this.listeningKey);
        localStorage.setItem(this.listeningKey, nextState);

        window.dispatchEvent(this.createSyncStorageChangeEvent(oldValue));
    };

    /**
     * Так как storageEvent работает только с внешними источниками aka не в текущей (другая вкладка, dev-tools)
     * симулируем подобное кастомное событие с таким же пейлоадом.
     */
    private createSyncStorageChangeEvent = (oldValue: string | null) => {
        return new CustomEvent<ISetEventPayload>('sync-store-change', {
            detail: {
                key: this.listeningKey,
                oldValue,
                newValue: localStorage.getItem(this.listeningKey),
                storageArea: localStorage,
                url: location.href,
            },
        });
    };

    /**
     * метод подписки на изменения в localStorage.
     *
     * Принимает в качестве параметра функцию колбек, которая будет вызывана при изменении значения заданного ключа в localStorage.
     *
     * Возвращает функцию отписки.
     * @param notifyListener
     */
    subscribe = (notifyListener: () => void) => {
        const storageEventHandler = (e: StorageEvent) => {
            if (Object.is(e.storageArea, localStorage) && e.key === this.listeningKey) {
                notifyListener();
            }
        };
        const syncEventHandler = (e: WindowEventMap['sync-store-change']) => {
            if (Object.is(e.detail.storageArea, localStorage) && e.detail.key === this.listeningKey) {
                notifyListener();
            }
        };
        window.addEventListener('storage', storageEventHandler);
        window.addEventListener('sync-store-change', syncEventHandler);
        return () => {
            window.removeEventListener('storage', storageEventHandler);
            window.removeEventListener('sync-store-change', syncEventHandler);
        };
    };

    /**
     * Возвращает сериализованное значение заданного ключа из localStorage.
     * Так как строка и null иммутабельны, позволяет выполнять поверхностное сравнение.
     */
    getSnapshot = () => {
        return localStorage.getItem(this.listeningKey);
    };

    /**
     * Удаляет значение заданного ключа из localStorage.
     */
    deleteState = () => {
        const oldValue = localStorage.getItem(this.listeningKey);

        localStorage.removeItem(this.listeningKey);

        window.dispatchEvent(this.createSyncStorageChangeEvent(oldValue));
    };
}
