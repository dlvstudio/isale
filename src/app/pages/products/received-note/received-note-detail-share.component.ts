import { Component } from '@angular/core';
import { IReceivedNote } from '../../../models/received-note.interface';
import { ReceivedNote } from '../../../models/received-note.model';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { UserService } from '../../../providers/user.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { DataService } from '../../../providers/data.service';
import { TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from '@angular/common';
import { StoreService } from '../../../providers/store.service';

@Component({
    selector: 'received-note-detail-share',
    templateUrl: 'received-note-detail-share.component.html',
})
export class ReceivedNoteDetailShareComponent {
    params: any = null;
    receivedNote: IReceivedNote = new ReceivedNote();
    currency: string;
    shop: any;
    noteCustomer: string;

    constructor(
        public navCtrl: RouteHelperService,
        private dataService: DataService,
        private currencyPipe: CurrencyPipe,
        private storeService: StoreService,
        public translateService: TranslateService,
        private userService: UserService) {
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        const store = await this.storeService.getCurrentStore();
        this.shop = store ? store : await this.dataService.getFirstObject('shop');
        this.receivedNote = new ReceivedNote();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.receivedNote) {
            this.receivedNote = this.params.receivedNote;
            let contact = '';
            let phone = '';
            if (this.receivedNote.contactId != 0 && this.receivedNote.contact && this.receivedNote.contact.fullName) {
                contact = this.receivedNote.contact.fullName;
            }
            if (this.receivedNote.contactId != 0 && this.receivedNote.contact && this.receivedNote.contact.mobile) {
                phone = this.receivedNote.contact.mobile;
            }
            if (this.receivedNote.contactId == 0 && this.receivedNote.contactName) {
                contact = this.receivedNote.contactName;
            }
            if (this.receivedNote.contactId == 0 && this.receivedNote.contactPhone) {
                phone = this.receivedNote.contactPhone;
            }
            this.noteCustomer = (contact ? contact : '...') + ' | ' + (phone ? phone : '...');
            setTimeout(async () => {
                await this.shareNote();
                this.navCtrl.back();
            }, 1000);
        }
    }

    async shareNote(): Promise<void> {
        if (this.navCtrl.isNotCordova()) {
            alert(this.translateService.instant('common.feature-only-on-app'));
            return;
        }
        const money = this.currencyPipe.transform(this.receivedNote.total, this.currency, true, '1.0-2');
        const ship = this.currencyPipe.transform(this.receivedNote.shippingFee, this.currency, true, '1.0-2');
        const tax = this.currencyPipe.transform(this.receivedNote.tax, this.currency, true, '1.0-2');

        const arrBody = [
            this.translateService.instant('received-note-add.code') + ': #' + this.receivedNote.id,
            this.translateService.instant('received-note-add.total') + ': ' + money
        ];
        if (this.receivedNote.shippingFee != 0) {
            arrBody.push(this.translateService.instant('received-note-add.shipping-fee') + ': ' + ship)
        }
        if (this.receivedNote.tax != 0) {
            arrBody.push(this.translateService.instant('received-note-add.tax') + ': ' + tax)
        }

        let contact = '';
        let phone = '';
        if (this.receivedNote.contactId != 0 && this.receivedNote.contact && this.receivedNote.contact.fullName) {
            contact = this.receivedNote.contact.fullName;
        }
        if (this.receivedNote.contactId != 0 && this.receivedNote.contact && this.receivedNote.contact.mobile) {
            phone = this.receivedNote.contact.mobile;
        }
        if (this.receivedNote.contactId == 0 && this.receivedNote.contactName) {
            contact = this.receivedNote.contactName;
        }
        if (this.receivedNote.contactId == 0 && this.receivedNote.contactPhone) {
            phone = this.receivedNote.contactPhone;
        }
        const arrContact = [];
        if (contact) {
            arrContact.push(contact);
        }
        if (phone) {
            arrContact.push(phone);
        }
        const contactShow = arrContact && arrContact.length > 0 ? arrContact.join(' - ') : '';
        if (contactShow) {
            arrBody.push(contactShow);
        }
        const body = arrBody.join(' - ');

        await this.userService.shareScreenshot(body);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }
}
