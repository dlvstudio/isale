import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ContactService } from '../../providers/contact.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'search-sales-line',
    templateUrl: 'search-sales-line.component.html'
})
export class SearchSalesLineComponent {
    importantFilter = 'recent';
    items: any[];
    originalItems: any[];
    searchKey = '';
    callback;
    params;

    constructor(
        public viewCtrl: ModalController,
        public navCtrl: RouteHelperService,
        private contactService: ContactService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.removeEventListener('reloadSalesLines', this.reload);
        this.navCtrl.addEventListener('reloadSalesLines', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-search-sales-line');
    }

    reload = () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.contactService.getSalesLines().then((contacts) => {
            this.originalItems = JSON.parse(JSON.stringify(contacts));
            this.items = contacts;
            let items: any[] = this.originalItems && this.originalItems.length
                ? JSON.parse(JSON.stringify(this.originalItems))
                : [];
            this.items = items;
        });
    }

    ngOnInit(): void {
        this.reload();
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-sales-line-search');
        let items: any[] = JSON.parse(JSON.stringify(this.originalItems));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            items = items.filter((item) => {
                return (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.items = items;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    async select(item: any): Promise<void> {
        if (this.callback) {
            this.callback(item);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(item);
    }

    openAdd(): void {
        this.navCtrl.navigateForward('/contact/add-sales-line', { fromSearch: true });
    }

    edit(item): void {
        this.navCtrl.navigateForward('/contact/add-sales-line', { fromSearch: true, id: item.id });
    }
}
