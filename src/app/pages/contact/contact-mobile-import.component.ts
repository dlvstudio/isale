import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { DateTimeService } from '../../providers/datetime.service';
import { IContact } from '../../models/contact.interface';
import { Contact } from '../../models/contact.model';
import { ContactService } from '../../providers/contact.service';
import { TranslateService } from '@ngx-translate/core';


@Component({
    selector: 'contact-mobile-import',
    templateUrl: 'contact-mobile-import.component.html'
})
export class ContactMobileImportComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    isaleContacts: IContact[] = [];
    originalContacts: any[] = [];
    contacts: any[] = [];
    selectedContacts: any[] = [];
    isSelecteAll = false;
    saveDisabled = false;
    total = 0;
    totalSelected = 0;
    searchKey = '';
    tab = 'all';
    start = 0;
    pageSize = 10;
    end = 39;
    currentPage = 0;

    constructor(
        public navCtrl: RouteHelperService,
        private contactService: ContactService,
        private translateService: TranslateService,
        private analyticsService: AnalyticsService
    ) {
        this.reload();
    }

    async reload() {
        const loading = await this.navCtrl.loading();
        this.params = this.navCtrl.getParams(this.params);
        this.contacts = this.params && this.params.contacts && this.params.contacts.length ? this.params.contacts : [];
        this.originalContacts = JSON.parse(JSON.stringify(this.contacts));
        this.total = this.contacts.length;
        this.totalSelected = 0;
        await loading.dismiss();
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-mobile-import');
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    contactImageOrPlaceholder(base64: string) {
        return base64 !== null && base64 !== ''
            ? base64
            : 'assets/person-placeholder.jpg';
    }

    select() {
        if (this.isSelecteAll) {
            this.searchKey = null;
        }
        this.selectedContacts = [];
        this.contacts = JSON.parse(JSON.stringify(this.originalContacts));
        for (const contact of this.contacts) {
            contact['selected'] = this.isSelecteAll;
            if (this.isSelecteAll) {
                this.selectedContacts.push(contact);
            }
        }
        this.countSelected();
    }

    selectContact(contact) {
        if (!contact['selected']) {
            this.selectedContacts = this.selectedContacts.filter(c => c.contactId !== contact.contactId);
        } else {
            const exist = this.selectedContacts.find(c => c.contactId === contact.contactId);
            if (!exist) {
                this.selectedContacts.push(contact);
            }
        }
        this.countSelected();
    }

    deSelectContact(contact) {
        if (!contact['selected']) {
            this.selectedContacts = this.selectedContacts.filter(c => c.contactId !== contact.contactId);
            const exist = this.contacts.find(c => c.contactId === contact.contactId);
            exist['selected'] = false;
        }
        this.countSelected();
    }

    countSelected() {
        this.totalSelected = this.selectedContacts ? this.selectedContacts.length : 0;
    }

    async save() {
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        let total = 0;
        for (const contact of this.selectedContacts) {
            const isaleContact = new Contact();
            isaleContact.fullName = contact.displayName;
            isaleContact.dateOfBirth = contact.birthday;
            isaleContact.email = contact.emails && contact.emails.length
                ? contact.emails[0].address
                : '';
            isaleContact.mobile = contact.phoneNumbers && contact.phoneNumbers.length
                ? contact.phoneNumbers[0].number
                : '';
            await this.contactService.saveContact(isaleContact);
            total++;
        }
        this.navCtrl.publish('reloadContactList');
        await loading.dismiss();
        this.saveDisabled = false;
        alert(this.translateService.instant('contact-add.import-done', {contact: total}));
        this.navCtrl.pop();
    }

    search() {
        this.analyticsService.logEvent('contact-mobile-import-search');
        let contacts: any[] = JSON.parse(JSON.stringify(this.originalContacts));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            contacts = contacts.filter((item) => (item.displayName && item.displayName.toLowerCase().indexOf(searchKey) !== -1)
                || (item.emails && item.emails.length && (
                    item.emails.filter(e => e.address && e.address.toLowerCase().indexOf(searchKey) !== -1).length > 0
                ))
                || (item.phoneNumbers && item.phoneNumbers.length && (
                    item.phoneNumbers.filter(e => e.number && e.number.toLowerCase().indexOf(searchKey) !== -1).length > 0
                )));
        }
        for (const contact of contacts) {
            const exist = this.selectedContacts.find(c => c.contactId === contact.contactId);
            if (!exist) {
                continue;
            }
            contact['selected'] = true;
        }
        this.contacts = contacts;
    }

    clearSearch() {
        this.searchKey = null;
        this.analyticsService.logEvent('contact-mobile-import-search');
        const contacts = JSON.parse(JSON.stringify(this.originalContacts));
        for (const contact of contacts) {
            const exist = this.selectedContacts.find(c => c.contactId === contact.contactId);
            if (!exist) {
                continue;
            }
            contact['selected'] = true;
        }
        this.contacts = contacts;
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
}

