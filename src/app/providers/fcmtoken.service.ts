import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

@Injectable()
export class FcmTokenService {

    constructor(
        private apiService: ApiService,
        private storageService: StorageService,
        private userService: UserService) {
    }

    async removeLoggedTokens() {
        const tokens = await this.getTokensByString();
        if (!tokens || !tokens.length) {
            return;
        }
        const arr = [];
        for (const token of tokens) {
            arr.push(this.deleteToken(token));
        }
        await Promise.all(arr);
        await this.storageService.remove('fcm-token');
    }

    deleteToken(token): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=fcmtoken&id=' + token.id, null);
    }

    async getTokensByString(token: string = null): Promise<any[]> {
        let tokenString = '';
        if (!token) {
            const tokenSaved = await this.storageService.get('fcm-token');
            if (!tokenSaved) {
                return null;
            }
            tokenString = tokenSaved;
        } else {
            tokenString = token;
        }
        const model: any = { table: 'fcmtoken', token: tokenString };
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    async saveToken(token: string): Promise<number> {
        await this.storageService.set('fcm-token', token);
        const existTokens = await this.getTokensByString(token);
        if (existTokens && existTokens.length) {
            return 0;
        }
        const model: any = {};
        model.token = token;
        return new Promise((r, j) => {
            model.table = 'fcmtoken';
            this.apiService.post(this.userService.apiUrl + '/data/save', model).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                model.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
