import { IContact } from './../../models/contact.interface';
import { Component, ViewChild } from '@angular/core';
import { Contacts } from '@capacitor-community/contacts';
import * as _ from 'lodash';
import { ActionSheetController, AlertController, IonContent, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ContactService } from '../../providers/contact.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ExcelService } from '../../providers/excel.service';
import { StaffService } from '../../providers/staff.service';


@Component({
    selector: 'contact',
    templateUrl: 'contact.component.html'
})
export class ContactComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    importantFilter = 'recent';
    contacts: IContact[];
    originalContacts: IContact[];
    searchKey = '';
    selectedStaff;
    isShowFilter = false;
    maxTopRecent = 50;
    start = 0;
    pageSize = 20;
    end = 39;
    currentPage = 0;
    businessTypeSelected;
    salesLineSelected;

    constructor(
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private actionSheetCtrl: ActionSheetController,
        private contactService: ContactService,
        private platform: Platform,
        private excelService: ExcelService,
        public staffService: StaffService,
        private alertCtrl: AlertController,
        private userService: UserService,
        private analyticsService: AnalyticsService
    ) {
        const reloadContactListHandle = (event) => {
            const data = event.detail;
            if (data && data.filter) {
                this.importantFilter = data.filter;
            }
            this.reloadContacts();
        };
        this.navCtrl.unsubscribe('reloadContactList', reloadContactListHandle);
        this.navCtrl.subscribe('reloadContactList', reloadContactListHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact');
    }

    async reloadContacts(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.contactService.getContacts(this.selectedStaff ? this.selectedStaff.id : 0).then(async (contacts) => {
            let filteredContacts = contacts;
            if (this.businessTypeSelected) {
                filteredContacts = filteredContacts.filter(c => c.businessTypeId === this.businessTypeSelected.id);
            }
            if (this.salesLineSelected) {
                filteredContacts = filteredContacts.filter(c => c.salesLineId === this.salesLineSelected.id);
            }
            this.originalContacts = JSON.parse(JSON.stringify(filteredContacts));
            this.contacts = filteredContacts;
            await loading.dismiss();
            if (!this.contacts || this.contacts.length === 0) {
                this.importantFilter = 'all';
                return;
            }
            this.filterByImportant();
        });
    }

    // tslint:disable-next-line: use-lifecycle-interface
    ngOnInit(): void {
        this.reloadContacts();
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(contact: IContact): void {
        this.saveLastActive(contact, 'call');
        Helper.callPhone(contact.mobile);
    }

    text(contact: IContact): void {
        this.saveLastActive(contact, 'text');
        Helper.sendSms(contact.mobile);
    }

    saveLastActive(contact: IContact, action: string): Promise<number> {
        contact.lastActive = DateTimeService.toDbString();
        contact.lastAction = action;
        return this.contactService.saveContact(contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', contact);
            return result;
        });
    }

    importContacts(): void {
        this.navCtrl.navigateForward('/contact/import', null);
    }

    async exportContacts(): Promise<void> {
        const fileName = 'contacts-export.xlsx';
        const loading = await this.navCtrl.loading();
        this.excelService.downloadContactsReport(fileName).then(async (url) => {
            this.analyticsService.logEvent('product-export-to-excel-success');
            await loading.dismiss();
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + url,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFileUrl(fileName, fileName, url);
        });
    }

    filterByImportant(): void {
        this.start = 0;
        this.end = this.pageSize - 1;
        this.currentPage = 0;
        let contacts: IContact[] = this.originalContacts && this.originalContacts.length
            ? JSON.parse(JSON.stringify(this.originalContacts))
            : [];
        if (this.importantFilter === 'important') {
            contacts = contacts.filter((item) => item.isImportant);
            contacts = _.orderBy(contacts, [contact => contact.fullName ? contact.fullName.toLowerCase() : ''], ['asc']);
        } else if (this.importantFilter === 'recent') {
            contacts = contacts.filter((item) =>
                // tslint:disable-next-line:triple-equals
                item.lastActive != null && item.lastActive != ''
            );
            contacts = _.orderBy(contacts, ['lastActive'], ['desc']);
            contacts = contacts.slice(0, this.maxTopRecent);
        } else {
            contacts = _.orderBy(contacts, [contact => contact.fullName ? contact.fullName.toLowerCase() : ''], ['asc']);
        }
        this.contacts = contacts;
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    openContactAdd(): void {
        this.navCtrl.push('/contact/quick-add');
    }

    selectContact(id: number): void {
        this.navCtrl.push('/contact/detail', { id });
    }

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl)
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('contact-search');
        let contacts: IContact[] = JSON.parse(JSON.stringify(this.originalContacts));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            contacts = contacts.filter((item) => (item.fullName && Helper.stringSpecialContains(searchKey, item.fullName))
                || (item.mobile && Helper.stringSpecialContains(searchKey, item.mobile))
                || (item.email && Helper.stringSpecialContains(searchKey, item.email))
                || (item.address && Helper.stringSpecialContains(searchKey, item.address))
                || (item.staff && item.staff.name && Helper.stringSpecialContains(searchKey, item.staff.name))
                || (item.code && Helper.stringSpecialContains(searchKey, item.code)));
        }
        this.contacts = contacts;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadContacts();
    }

    async openContactAddOptions(): Promise<void> {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('contact.create-new'),
                    handler: () => {
                        this.openContactAdd();
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    async presentActionSheet() {
        const buttons = [
            {
                text: this.translateService.instant('contact.new-trade'),
                handler: () => {
                    this.navCtrl.navigateForward('/trade/add', null);
                }
            }
        ];
        buttons.push(
            {
                text: this.translateService.instant('contact.new-note'),
                handler: () => {
                    this.navCtrl.navigateForward('/note/add', null);
                }
            }, {
            text: this.translateService.instant('contact.new-debts'),
            handler: () => {
                this.navCtrl.navigateForward('/debt/add', null);
            }
        }
        );
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        await actionSheet.present();
    }

    async presentContactActionSheet(contact: IContact) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('contact.new-note'),
                    handler: () => {
                        this.navCtrl.navigateForward('/note/add', { contact: contact.id });
                    }
                }, {
                    text: this.translateService.instant('contact.new-trade'),
                    handler: () => {
                        this.navCtrl.navigateForward('/trade/add', { contact: contact.id });
                    }
                }
            ]
        });
        actionSheet.present();
    }

    async showSearchStaff() {
        this.analyticsService.logEvent('contact-select-staff');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.selectedStaff = staff;
                this.reloadContacts();
            }
        };
        this.navCtrl.push('/staff/search', { callback });
    }

    removeStaff(): void {
        this.selectedStaff = null;
        this.reloadContacts();
    }

    showFilter() {
        this.isShowFilter = !this.isShowFilter;
    }

    get isShowPaging() {
        if (this.contacts && this.contacts.length > this.pageSize) {
            return true;
        }
        return false;
    }

    previousPage() {
        if (this.currentPage <= 0) {
            this.currentPage = 0;
            return;
        }
        this.currentPage--;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.content.scrollToTop();
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.contacts.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        this.content.scrollToTop();
    }

    async showBusinessTypes() {
        this.analyticsService.logEvent('contact-add-search-business-type');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.businessTypeSelected = staff;
                this.reloadContacts();
            }
        };
        this.navCtrl.push('/contact/search-business-type', { callback });
    }

    async showSalesLines() {
        this.analyticsService.logEvent('contact-add-search-sales-line');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.salesLineSelected = staff;
                this.reloadContacts();
            }
        };
        this.navCtrl.push('/contact/search-sales-line', { callback });
    }

    removeSalesLine(): void {
        this.salesLineSelected = null;
        this.reloadContacts();
    }

    removeBusinessType(): void {
        this.businessTypeSelected = null;
        this.reloadContacts();
    }

    async import() {
        if (this.platform.is('capacitor') || this.platform.is('cordova')) {
            await Contacts.getPermissions();
        }
        const isGranted = (this.platform.is('capacitor') || this.platform.is('cordova'))
            ? await Contacts.getPermissions()
            : true;
        if (!isGranted) {
            return;
        }
        const temp = {
            contacts: [
                {
                    contactId: '123',
                    displayName: '123',
                    photoThumbnail: '',
                    birthday: '2002-11-11',
                    emails: [
                        { label: "main", address: 'abc@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '123999' }
                    ],
                },
                {
                    contactId: '456',
                    displayName: '456',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                },
                {
                    contactId: '456',
                    displayName: '456',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                },
                {
                    contactId: '456',
                    displayName: '456',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                },
                {
                    contactId: '456',
                    displayName: '456',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                },
                {
                    contactId: '789',
                    displayName: '789',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                },
                {
                    contactId: '789',
                    displayName: '789',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                },
                {
                    contactId: '789',
                    displayName: '789',
                    photoThumbnail: '',
                    birthday: '2012-11-11',
                    emails: [
                        { label: "main", address: 'xyz@gmail.com' }
                    ],
                    phoneNumbers: [
                        // eslint-disable-next-line id-blacklist
                        { label: "mobile", number: '+8889898989' }
                    ],
                }
            ]
        };
        const result = this.platform.is('capacitor')
            ? (await Contacts.getContacts())
            : temp;
        if (!result || !result.contacts || !result.contacts.length) {
            alert(this.translateService.instant('contact.no-contacts-to-load'))
            return;
        }
        const arr = [];
        for (const contact of result.contacts) {
            let exists = false;
            for (const isaleContact of this.contacts) {
                if (isaleContact.email && contact.emails && contact.emails.length && isaleContact.email === contact.emails[0].address) {
                    exists = true;
                    break;
                }
                if (isaleContact.mobile && contact.phoneNumbers && contact.phoneNumbers.length && isaleContact.mobile === contact.phoneNumbers[0].number) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                continue;
            }
            arr.push(contact);
        }
        this.navCtrl.push('/contact/mobile-import', { contacts: arr });
    }
}
