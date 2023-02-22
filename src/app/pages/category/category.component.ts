import { ITradeCategory } from './../../models/trade-category.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { TradeService } from '../../providers/trade.service';
import { TranslateService } from '@ngx-translate/core';
import { StaffService } from '../../providers/staff.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'category',
    templateUrl: 'category.component.html'
})
export class CategoryComponent {
    originalCategories: ITradeCategory[];
    categories: ITradeCategory[];
    searchKey: string = '';
    noteFilter: string = 'frequency';

    constructor(
        private tradeService: TradeService,
        private translateService: TranslateService,
        public staffService: StaffService,
        public navCtrl: RouteHelperService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadCategoryList', this.reload);
        this.navCtrl.subscribe('reloadCategoryList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = () => {
        this.tradeService.getTradeCategories().then((categories) => {
            this.originalCategories = JSON.parse(JSON.stringify(categories));
            this.categories = categories;
            this.filter();
        });
    }

    openCategoryAdd(): void {
        this.navCtrl.push('/category/add', {lastOrderIndex: this.categories ? this.categories.length : 0});
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('category-detail-search');
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

    filter(): void {
        let categories: ITradeCategory[] = JSON.parse(JSON.stringify(this.originalCategories));
        // categories = this.sortByModifiedAt(categories);
        this.categories = categories;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectCategory(id: number): void {
        this.navCtrl.push('/category/detail', {id: id});
    }

    async deleteCategory(category: ITradeCategory): Promise<void> {
        let confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('trade-category.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.tradeService.deleteCategory(category).then(async () => {
                            this.analyticsService.logEvent('category-delete-success');
                            let i = this.categories.findIndex(item => item.id == category.id);
                            if (i >= 0) {
                                this.categories.splice(i, 1);
                            }
                            i = this.originalCategories.findIndex(item => item.id == category.id);
                            if (i >= 0) {
                                this.originalCategories.splice(i, 1);
                            }
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    async presentActionSheet(category: ITradeCategory) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('trade-category.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteCategory(category);
                    }
                }, {
                    text: this.translateService.instant('trade-category.view-detail'),
                    handler: () => {
                        this.selectCategory(category.id);
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    addReport(): void {
        this.navCtrl.push('/category-report/add', null)
    }
    
    async up(i) {
        const loading = await this.navCtrl.loading();
        const arr = [];
        this.categories[i].orderIndex = i - 1;
        arr.push(this.tradeService.saveCategory(this.categories[i]));
        this.categories[i - 1].orderIndex = i;
        arr.push(this.tradeService.saveCategory(this.categories[i - 1]));
        for (let id = i + 1; id < this.categories.length; id++) {
            this.categories[id].orderIndex = id;
            arr.push(this.tradeService.saveCategory(this.categories[id]));
        }
        await Promise.all(arr);
        await this.reload();
        await loading.dismiss();
    }

    async down(i) {
        const loading = await this.navCtrl.loading();
        const arr = [];
        this.categories[i].orderIndex = i + 1;
        arr.push(this.tradeService.saveCategory(this.categories[i]));
        this.categories[i + 1].orderIndex = i;
        arr.push(this.tradeService.saveCategory(this.categories[i + 1]));
        for (let id = i + 2; id < this.categories.length; id++) {
            this.categories[id].orderIndex = id;
            arr.push(this.tradeService.saveCategory(this.categories[id]));
        }
        await Promise.all(arr);
        await this.reload();
        await loading.dismiss();
    }
}
