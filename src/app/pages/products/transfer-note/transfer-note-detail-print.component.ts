import { Component } from '@angular/core';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { UserService } from '../../../providers/user.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { DataService } from '../../../providers/data.service';
import { StoreService } from '../../../providers/store.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'transfer-note-detail-print',
    templateUrl: 'transfer-note-detail-print.component.html',
})
export class TransferNoteDetailPrintComponent {
    params: any = null;
    note: any = {};
    currency: string;
    shop: any;
    noteCustomer: string;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private printer: Printer,
        private dataService: DataService,
        private storeService: StoreService,
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
        this.note = {};
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.note) {
            this.note = this.params.note;
            let contact = '';
            let phone = '';
            if (this.note.contactId != 0 && this.note.contact && this.note.contact.fullName) {
                contact = this.note.contact.fullName;
            }
            if (this.note.contactId != 0 && this.note.contact && this.note.contact.mobile) {
                phone = this.note.contact.mobile;
            }
            if (this.note.contactId == 0 && this.note.contactName) {
                contact = this.note.contactName;
            }
            if (this.note.contactId == 0 && this.note.contactPhone) {
                phone = this.note.contactPhone;
            }
            this.noteCustomer = (contact ? contact : '...') + ' | ' + (phone ? phone : '...');
            setTimeout(async () => {
                const target = document.getElementById('print-page');
                const html = target.innerHTML;
                if (this.navCtrl.isNotCordova()) {
                    Helper.webPrint(html, 500);
                    this.navCtrl.back();
                    return;
                }
                await this.printer.print(html, { orientation: 'landscape' });
                this.navCtrl.back();
            }, 1000);
        }
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
