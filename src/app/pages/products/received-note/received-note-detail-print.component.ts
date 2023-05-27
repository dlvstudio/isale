import { Component } from '@angular/core';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { IReceivedNote } from '../../../models/received-note.interface';
import { ReceivedNote } from '../../../models/received-note.model';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { UserService } from '../../../providers/user.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { DataService } from '../../../providers/data.service';
import { StoreService } from '../../../providers/store.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'received-note-detail-print',
    templateUrl: 'received-note-detail-print.component.html',
})
export class ReceivedNoteDetailPrintComponent {
    params: any = null;
    receivedNote: IReceivedNote = new ReceivedNote();
    currency: string;
    shop: any;
    noteCustomer: string;
    totalProductsAmount = 0;

    constructor(
        public navCtrl: RouteHelperService,
        private printer: Printer,
        public translateService: TranslateService,
        private dataService: DataService,
        private storeService: StoreService,
        private userService: UserService) {
    }

    ngOnInit(): void {
        this.reload();
    }

    getProductsAmount() {
        let netValue = 0;
        for (const item of this.receivedNote.items) {
            netValue += item.amount * 1;
        }
        this.totalProductsAmount = netValue;
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
            this.getProductsAmount();
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
                const target = document.getElementById('print-page');
                const html = target.innerHTML;
                if (this.navCtrl.isNotCordova()) {
                    Helper.webPrint(html, 500);
                    this.navCtrl.pop();
                    return;
                }

                await this.printer.print(html, { orientation: 'landscape' });
                this.navCtrl.pop();
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
