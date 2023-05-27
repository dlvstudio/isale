import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class PointService {


    constructor(private apiService: ApiService,
                private userService: UserService,
                private staffService: StaffService    ) {
    }

    getPointPaymentConfigByInput(data: any): any {
        const lConfigs = data
        if (lConfigs && lConfigs.length) {
            const p = lConfigs[0];
            const config =
            {
                id: p.id,
                allowPointPayment: p.allowPointPayment,
                pointPaymentAfterBuyCount: p.pointPaymentAfterBuyCount,
                pointPaymentExchange: p.pointPaymentExchange,
            };
            return config;
        }
        return null;
    }

    async getPointPaymentConfig(): Promise<any> {
        const model: any = { table: 'shop_config' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        const lConfigs = await this.apiService.post(url, model);
        if (lConfigs && lConfigs.length) {
            const p = lConfigs[0];
            const config =
            {
                id: p.id,
                allowPointPayment: p.allowPointPayment,
                pointPaymentAfterBuyCount: p.pointPaymentAfterBuyCount,
                pointPaymentExchange: p.pointPaymentExchange,
            };
            return config;
        }
        return null;
    }

    getConfigs(): Promise<any[]> {
        const model: any = { table: 'point_config' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getLevelConfigs(): Promise<any[]> {
        const model: any = { table: 'level_config' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getHistories(dateFrom: string = '', dateTo: string = ''): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=point_history';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        if (dateFrom) {
            url += '&dateFrom=' + dateFrom;
        }
        if (dateTo) {
            url += '&dateTo=' + dateTo;
        }
        return this.apiService.get(url);
    }

    getConfig(id: number): Promise<any> {
        const model: any = { id, table: 'point_config' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return new Promise((r, j) => {
            this.apiService.post(url, model).then((rets) => {
                if (rets && rets.length) {
                    r(rets[rets.length - 1]);
                }
                r(null);
            }, (err) => { j(err); }).catch((err) => { j(err); });
        });
    }

    getLevelConfig(id: number): Promise<any> {
        const model: any = { id, table: 'level_config' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return new Promise((r, j) => {
            this.apiService.post(url, model).then((rets) => {
                if (rets && rets.length) {
                    r(rets[rets.length - 1]);
                }
                r(null);
            }, (err) => { j(err); }).catch((err) => { j(err); });
        });
    }

    deleteConfig(config: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=point_config&id=' + config.id, null);
    }

    saveConfig(config: any): Promise<number> {
        return new Promise((r, j) => {
            config.table = 'point_config';
            this.apiService.post(this.userService.apiUrl + '/data/save', config).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                config.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    savePointPaymentConfig(config: any): Promise<number> {
        return new Promise((r, j) => {
            config.table = 'shop_config';
            this.apiService.post(this.userService.apiUrl + '/data/save', config).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                config.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveLevelConfig(config: any): Promise<number> {
        return new Promise((r, j) => {
            config.table = 'level_config';
            this.apiService.post(this.userService.apiUrl + '/data/save', config).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                config.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
