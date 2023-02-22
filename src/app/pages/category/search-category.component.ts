import { CategoryAddComponent } from './category-add.component';
import { ITradeCategory } from './../../models/trade-category.interface';
import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { TradeService } from '../../providers/trade.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ModalController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'search-category',
    templateUrl: 'search-category.component.html'
})
export class CategorySearchComponent {
    categories: ITradeCategory[];
    originalCategories: ITradeCategory[];
    searchKey = '';
    callback;
    params;

    constructor(public navCtrl: RouteHelperService,
                public staffService: StaffService,
                public viewCtrl: ModalController,
                private tradeService: TradeService,
                private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadCategoryList', this.reload);
        this.navCtrl.subscribe('reloadCategoryList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category-search');
    }

    reload = () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.tradeService.getTradeCategories().then((categories) => {
            this.originalCategories = JSON.parse(JSON.stringify(categories));
            this.categories = categories;
        });
    }

    ngOnInit(): void {
        this.reload();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-category-detail-search');
        let categories: ITradeCategory[] = JSON.parse(JSON.stringify(this.originalCategories));
        if (this.searchKey !== null && this.searchKey !== '') {
            let searchKey = this.searchKey.toLowerCase();
            categories = categories.filter((item) => {
                return (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.categories = categories;
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

    async selectCategory(category: ITradeCategory): Promise<void> {
        if (this.callback) {
            this.callback(category);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(category);
    }

    limitText(text: string, maxLength: number = 200): string {
        if (text && text.length >= maxLength) {
            return text.substr(0, maxLength) + "...";
        }
        return text;
    }

    openCategoryAdd(): void {
        this.navCtrl.push('/category/add', {fromSearch: true});
    }
}
