import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { OmniChannelService } from 'src/app/providers/omni-channel.service';

@Component({
    selector: 'search-page',
    templateUrl: 'search-page.component.html'
})
export class SearchPageComponent {
    searchKey = '';
    callback;
    params;
    items: any[];
    originalItems: any[];

    constructor(
        public viewCtrl: ModalController,
        public navCtrl: RouteHelperService,
        private omniChannelService: OmniChannelService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.removeEventListener('reloadFbPageList', this.reload);
        this.navCtrl.addEventListener('reloadFbPageList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('fb-search-page');
    }

    reload = () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.omniChannelService.getPages().then((pages) => {
            this.originalItems = JSON.parse(JSON.stringify(pages));
            this.items = pages;
        });
    }

    ngOnInit(): void {
        this.reload();
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('fb-search-page-search');
        let items: any[] = JSON.parse(JSON.stringify(this.originalItems));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            items = items.filter((item) => (
                item.pageName && item.pageName.toLowerCase().indexOf(searchKey) !== -1
                || item.pageId && item.pageId.toLowerCase().indexOf(searchKey) !== -1
                ))
            ;
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
}
