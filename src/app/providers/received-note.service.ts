import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { TradeService } from './trade.service';
import { IReceivedNote } from '../models/received-note.interface';

@Injectable()
export class ReceivedNoteService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private tradeService: TradeService,
        private userService: UserService
    ) {
    }

    getNotes(dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<IReceivedNote[]> {
        const data: any = {dateFrom, dateTo, storeId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/ReceivedNote/list', data);
    }

    geReceivedNotesByStaff(staffId: number, dateFrom: string = '', dateTo: string = ''): Promise<IReceivedNote[]> {
        const data = {dateFrom, dateTo, staffId};
        return this.apiService.post(this.userService.apiUrl + '/receivednote/list', data);
    }

    get(id: number): Promise<IReceivedNote> {
        let url = this.userService.apiUrl + '/ReceivedNote?id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    async delete(note: IReceivedNote): Promise<any> {
        const trades = await this.tradeService.getTradesByReceivedNote(note.id);
        const arr = [];
        for (const trade of trades) {
            arr.push(this.tradeService.deleteTrade(trade));
        }
        arr.push(this.apiService.post(this.userService.apiUrl + '/ReceivedNote/remove?id=' + note.id, null));
        return Promise.all(arr);
    }

    sync(note: IReceivedNote): Promise<number> {
        return new Promise((r, j) => {
            const offlineId = note.id;
            const offlineContactId = note.contactId;
            note.id = 0;
            note.contactId = note.contact && note.contactId ? note.contact.onlineId : 0;
            this.apiService.post(this.userService.apiUrl + '/receivednote/save', note).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                note.onlineId = ret;
                note.id = offlineId;
                note.contactId = offlineContactId;
                this.save(note).then((result) => {
                    if (!result) {
                        r(0);
                        return;
                    }
                    r(ret);
                }).catch((err) => {
                    j(err);
                });
            }, (err) => {
                j(err);
            });
        });
    }

    save(note: IReceivedNote): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/ReceivedNote/save', note).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                note.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
