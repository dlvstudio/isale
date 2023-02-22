import { IContact } from './../../models/contact.interface';
import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ContactService } from '../../providers/contact.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'search',
    templateUrl: 'search.component.html'
})
export class ContactSearchComponent {
    importantFilter = 'recent';
    contacts: IContact[];
    originalContacts: IContact[];
    searchKey = '';
    callback;
    params;
    businessTypeSelected;
    salesLineSelected;
    selectedStaff;
    isShowFilter = false;

    constructor(
        public viewCtrl: ModalController,
        public navCtrl: RouteHelperService,
        private contactService: ContactService,
        public staffService: StaffService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.removeEventListener('reloadContactList', this.reloadContacts);
        this.navCtrl.addEventListener('reloadContactList', this.reloadContacts);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-search');
    }

    reloadContacts = () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.contactService.getContacts(this.selectedStaff ? this.selectedStaff.id : 0).then((contacts) => {
            let filteredContacts = contacts;
            if (this.businessTypeSelected) {
                filteredContacts = filteredContacts.filter(c => c.businessTypeId === this.businessTypeSelected.id);
            }
            if (this.salesLineSelected) {
                filteredContacts = filteredContacts.filter(c => c.salesLineId === this.salesLineSelected.id);
            }
            this.originalContacts = JSON.parse(JSON.stringify(filteredContacts));
            this.contacts = filteredContacts;
            if (!this.contacts || this.contacts.length === 0) {
                this.importantFilter = 'all';
                return;
            }
            this.filterByImportant();
        });
    }

    ngOnInit(): void {
        this.reloadContacts();
    }

    filterByImportant(): void {
        let contacts: IContact[] = this.originalContacts && this.originalContacts.length
            ? JSON.parse(JSON.stringify(this.originalContacts))
            : [];
        if (this.importantFilter === 'important') {
            contacts = contacts.filter((item) => item.isImportant);
        } else if (this.importantFilter === 'recent') {
            contacts = contacts.filter((item) => item.lastActive != null && item.lastActive !== '').sort((item1, item2) => {
                if (item1.lastActive < item2.lastActive) {
                    return 1;
                }

                if (item1.lastActive > item2.lastActive) {
                    return -1;
                }

                return 0;
            });
        }
        this.contacts = contacts;
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-contact-search');
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

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    async selectContact(contact: IContact): Promise<void> {
        if (this.callback) {
            this.callback(contact);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(contact);
    }

    openContactAdd(): void {
        this.navCtrl.navigateForward('/contact/add', { fromSearch: true });
    }

    showFilter() {
        this.isShowFilter = !this.isShowFilter;
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
}
