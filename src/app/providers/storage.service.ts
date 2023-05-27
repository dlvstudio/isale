import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable()
export class StorageService {
    constructor(
        private storage: Storage
    ) {
        this.storage = new Storage();
        this.storage.create();
    }

    get(key: string): Promise<any> {
        return this.storage.get(key);
    }

    set(key: string, value: any): Promise<any> {
        return this.storage.set(key, value);
    }

    remove(key: string): Promise<any> {
        return this.storage.remove(key);
    }
}
