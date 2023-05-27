import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { PointService } from '../../providers/point.service';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'point-add',
    templateUrl: 'point-add.component.html',
})
export class PointAddComponent {
    params: any = null;
    config: any = {forAllCustomer: true, paymentAfterBuyCount: 0};
    fromSearch = false;
    saveDisabled = false;
    contactSelected: any;
    productSelected: any;
    categorySelected: any;
    currency: any;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private pointService: PointService,
        private userService: UserService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController
    ) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('point-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currency = await this.userService.getAttr('current-currency');
        this.config = {forAllCustomer: true, paymentAfterBuyCount: 0};
        let configId = 0;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id) {
            configId = this.params.id;
        }

        if (configId && configId > 0) {
            this.pointService.getConfig(configId).then((config) => {
                this.config = config;
                this.contactSelected = this.config.contact;
                this.productSelected = this.config.product;
                this.categorySelected = this.config.category;
            });
        }
    }

    async showSearchContact() {
        this.analyticsService.logEvent('point-add-search-contact');
        const callback = (data) => {
            const item = data;
            if (item) {
                this.contactSelected = item;
                this.config.contactId = item.id;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchProduct() {
        this.analyticsService.logEvent('point-add-search-product');
        const callback = (data) => {
            const item = data;
            if (item) {
                this.productSelected = item;
                this.config.productId = item.id;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async showSearchCategory() {
        this.analyticsService.logEvent('point-add-search-category');
        const callback = (data) => {
            const item = data;
            if (item) {
                this.categorySelected = item;
                this.config.categoryId = item.id;
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    validate(): boolean {
        if (!this.config.exchange) {
            alert(this.translateService.instant('point-add.no-exchange-alert'));
            return false;
        }
        if (!this.config.forAllCustomer && !this.contactSelected) {
            alert(this.translateService.instant('point-add.no-contact-alert'));
            return false;
        }
        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.pointService.saveConfig(this.config).then(async () => {
            this.analyticsService.logEvent('config-save-successfully');
            this.saveDisabled = false;
            await loading.dismiss();
            this.exitPage();
        }).catch(async () => {
            this.saveDisabled = false;
            await loading.dismiss();
        });
    }

    removeContact(): void {
        this.contactSelected = null;
        this.config.contactId = 0;
    }

    removeProduct(): void {
        this.productSelected = null;
        this.config.productId = 0;
    }

    removeCategory(): void {
        this.categorySelected = null;
        this.config.categoryId = 0;
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
        this.navCtrl.publish('reloadPointConfigList', null);
        this.navCtrl.publish('reloadPointConfig', this.config);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    contactImageOrPlaceholder(contact: any): string {
        return Helper.contactImageOrPlaceholder(contact.iconUrl);
    }

    async delete() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('point-add.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.pointService.deleteConfig(this.config).then(async () => {
                            this.analyticsService.logEvent('point-config-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadPointConfigList', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }
}
