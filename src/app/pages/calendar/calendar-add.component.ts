import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { IProduct } from '../../models/product.interface';
import { ModalController, Platform } from '@ionic/angular';
import * as moment from 'moment';
import { DateTimeService } from '../../providers/datetime.service';
import { CalendarService } from '../../providers/calendar.service';
import { Helper } from '../../providers/helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ProductService } from '../../providers/product.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { IContact } from '../../models/contact.interface';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { Contact } from '../../models/contact.model';
import { ContactService } from '../../providers/contact.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'calendar-add',
    templateUrl: 'calendar-add.component.html',
})
export class CalendarAddComponent {
    params: any = null;
    calendar: any = {};
    productSelected: IProduct;
    contactSelected: IContact;
    dateSelected: any;

    constructor(
        public navCtrl: RouteHelperService,
        private calendarService: CalendarService,
        private analyticsService: AnalyticsService,
        private platform: Platform,
        private productService: ProductService,
        private translateService: TranslateService,
        private barcodeScanner: BarcodeScanner,
        private modalCtrl: ModalController,
        private storeService: StoreService,
        private staffService: StaffService,
        private contactService: ContactService
    ) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('calendar-add');
    }

    ngOnInit(): void {
        this.calendar = { status: 0 };
        let id = 0;
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id) {
            id = data.id;
        }

        if (id && id > 0) {
            this.calendarService.getCalendar(id).then((calendar) => {
                this.calendar = calendar;
                this.productSelected = this.calendar.product;
                this.contactSelected = this.calendar.contact;
            });
        }
    }

    async scan(): Promise<void> {
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.analyticsService.logEvent('calendar-add-scanned-web');
                this.doEnteredBarcode(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.doEnteredBarcode(barcodeData.text);
        });
    }

    doEnteredBarcode = (barcode) => {
        if (!barcode) {
            return;
        }
        this.productService.searchByBarcode(barcode).then((product: IProduct) => {
            if (product) {
                this.productSelected = product;
                this.calendar.productId = product.id;
            }
        });
    }

    validate() {
        if (!this.calendar.fullname) {
            alert(this.translateService.instant('calendar-add.missing-fullname'));
            return false;
        }

        if (!this.calendar.email && !this.calendar.phone) {
            alert(this.translateService.instant('calendar-add.missing-email-phone'));
            return false;
        }

        if (!this.calendar.hour) {
            alert(this.translateService.instant('calendar-add.missing-hour'));
            return false;
        }

        if (!this.calendar.day) {
            alert(this.translateService.instant('calendar-add.missing-day'));
            return false;
        }

        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        if (this.staffService.isStaff()) {
            this.calendar.staffId = this.staffService.selectedStaff.id;
        }
        if (!this.contactSelected && this.calendar && this.calendar.fullname && (this.calendar.phone || this.calendar.email)) {
            this.analyticsService.logEvent('calendar-add-new-contact');
            const newContact = new Contact();
            newContact.fullName = this.calendar.fullname;
            newContact.mobile = this.calendar.phone;
            newContact.staffId = this.calendar.staffId;
            newContact.email = this.calendar.email;
            const newContactId = await this.contactService.saveContact(newContact);
            this.contactSelected = newContact;
            this.calendar.contactId = newContactId;
        }
        const store = await this.storeService.getCurrentStore();
        this.calendar.storeId = store ? store.id : 0;
        this.calendarService.saveCalendar(this.calendar).then(async () => {
            if (this.contactSelected) {
                await this.saveLastActive();
            }
            this.analyticsService.logEvent('calendar-add-save-success');
            this.exitPage();
        });
    }

    saveLastActive(): Promise<number> {
        const action = 'calendar';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactCalendar', this.contactSelected.id);
            return result;
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadCalendarList', null);
        this.navCtrl.publish('reloadCalendar', this.calendar);
    }

    async showSearchProduct() {
        const callback = (data) => {
            const product = data;
            if (product) {
                this.productSelected = product;
                this.calendar.productId = product.id;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    removeProduct(): void {
        this.productSelected = null;
        this.calendar.productId = 0;
    }

    showDatePopup(): void {
        this.calendar.day = moment().startOf('day').format('YYYY-MM-DD');
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateString(date);
    }

    removeDate(): void {
        this.calendar.day = '';
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.calendar.contactId = contact.id;
                this.calendar.fullname = this.contactSelected.fullName;
                this.calendar.phone = this.contactSelected.mobile;
                this.calendar.email = this.contactSelected.email;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    removeContact(): void {
        this.contactSelected = null;
        this.calendar.contactId = 0;
        this.calendar.fullname = '';
        this.calendar.phone = '';
        this.calendar.email = '';
    }

    dateChanged() {
        this.calendar.day = this.toUtcTime(this.dateSelected);
    }

    toUtcTime(dateSelected) {
        const d = moment(dateSelected).format('DD');
        const m = moment(dateSelected).format('MM');
        const y = moment(dateSelected).format('YYYY');
        return moment.utc(y + '-' + m + '-' + d, 'YYYY-MM-DD').toDate();
    }

    async changePhone() {
        if (this.contactSelected) {
            return;
        }
        if (!this.calendar.phone) {
            return;
        }
        const contact = await this.contactService.searchContactByPhone(this.calendar.phone);
        if (contact) {
            const mess = this.translateService.instant('order-add.found-phone', {contact: contact.fullName, mobile: contact.mobile});
            if (confirm(mess)) {
                this.contactSelected = contact;
                this.calendar.contactId = contact.id;
                this.calendar.fullname = contact ? contact.fullName : null;
                this.calendar.phone = contact ? contact.mobile : null;
                this.calendar.email = contact ? contact.email : null;
            }
        }
    }
}
