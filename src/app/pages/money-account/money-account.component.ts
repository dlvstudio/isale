import { Component } from '@angular/core';
import { IMoneyAccount } from '../../models/money-account.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { MoneyAccountService } from '../../providers/money-account.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'money-account',
    templateUrl: 'money-account.component.html'
})
export class MoneyAccountComponent {
    originalProducts: IMoneyAccount[];
    products: IMoneyAccount[];
    searchKey: string = '';
    currency: string;

    constructor(
        private productService: MoneyAccountService,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private userService: UserService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadMoneyAccountList', this.reload);
        this.navCtrl.subscribe('reloadMoneyAccountList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getCurrentCurrency();
        this.productService.getMoneyAccounts().then(async (products) => {
            await loading.dismiss();
            this.originalProducts = JSON.parse(JSON.stringify(products));
            this.products = products;
        });
    }

    openProductAdd(): void {
        this.navCtrl.push('/money-account/add');
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('money-account-search');
        let products: IMoneyAccount[] = JSON.parse(JSON.stringify(this.originalProducts));
        if (this.searchKey !== null && this.searchKey !== '') {
            let searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => {
                return (item.accountName && item.accountName.toLowerCase().indexOf(searchKey) !== -1)
                ;
            });
        }
        this.products = products;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectProduct(id: number): void {
        try {
            this.navCtrl.push('/money-account/detail', { id: id });
        } catch (error) {
            alert(error);
            console.error(error);
        }
    }

    async deleteProduct(product: IMoneyAccount): Promise<void> {
        let confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('money-account-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.productService.deleteMoneyAccount(product).then(async () => {
                            this.analyticsService.logEvent('money-account-delete-success');
                            let i = this.products.findIndex(item => item.id == product.id);
                            if (i >= 0) {
                                this.products.splice(i, 1);
                            }
                            i = this.originalProducts.findIndex(item => item.id == product.id);
                            if (i >= 0) {
                                this.originalProducts.splice(i, 1);
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

    async presentActionSheet(product: IMoneyAccount) {
        let actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('money-account-detail.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteProduct(product);
                    }
                }, {
                    text: this.translateService.instant('money-account-detail.view-detail'),
                    handler: () => {
                        this.selectProduct(product.id);
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

    productName(title: string): string {
        return title;
    }
}
