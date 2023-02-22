import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { PointService } from '../../providers/point.service';

@Component({
    selector: 'search-level',
    templateUrl: 'search-level.component.html'
})
export class SearchLevelComponent {
    items: any[];
    originalItems: any[];
    searchKey = '';
    callback;
    params;

    constructor(
        public viewCtrl: ModalController,
        public navCtrl: RouteHelperService,
        private pointService: PointService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.removeEventListener('reloadLevels', this.reload);
        this.navCtrl.addEventListener('reloadLevels', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('search-level');
    }

    reload = () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.pointService.getLevelConfigs().then((itemsGot) => {
            this.originalItems = JSON.parse(JSON.stringify(itemsGot));
            this.items = itemsGot;
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
        this.analyticsService.logEvent('search-level-search');
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
        this.navCtrl.navigateForward('/point/add-level', { fromSearch: true });
    }

    edit(item): void {
        this.navCtrl.navigateForward('/point/add-level', { fromSearch: true, id: item.id });
    }
}
