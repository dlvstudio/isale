import { TradeCategory } from './../../models/trade-category.model';
import { ITradeCategory } from './../../models/trade-category.interface';
import { IContact } from './../../models/contact.interface';
import { Component } from '@angular/core';
import { TradeService } from '../../providers/trade.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'category-add',
    templateUrl: 'category-add.component.html',
})
export class CategoryAddComponent {
    params: any = null;
    lastOrderIndex = 0;
    contactSelected: IContact;
    category: ITradeCategory = new TradeCategory();
    noteSegment = 'content';
    isReceived = 'money-in';
    fromSearch = false;

    constructor(
        public navCtrl: RouteHelperService,
        private tradeService: TradeService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category-add');
    }

    ngOnInit(): void {
        this.category = new TradeCategory();
        let categoryId = 0;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id) {
            categoryId = this.params.id;
        }
        if (this.params && this.params.lastOrderIndex) {
            this.lastOrderIndex = this.params.lastOrderIndex;
        }

        if (categoryId && categoryId > 0) {
            this.tradeService.getCategory(categoryId).then((category) => {
                this.category = category;
            });
        }
    }

    save(): void {
        if (this.category.id === 0) {
            this.category.orderIndex = this.lastOrderIndex + 1;
        }
        this.tradeService.saveCategory(this.category).then(async () => {
            this.analyticsService.logEvent('category-add-save-success');
            this.exitPage();
        });
    }

    async dismiss() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
    }

    async exitPage() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
        this.navCtrl.publish('reloadCategoryList', null);
        this.navCtrl.publish('reloadCategory', this.category);
    }
}
