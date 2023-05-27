import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { PromotionService } from '../../providers/promotion.service';
import { UserService } from '../../providers/user.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';

@Component({
    selector: 'promotion-add',
    templateUrl: 'promotion-add.component.html',
})
export class PromotionAddComponent {
    params: any = null;
    config: any = { isPercent: false, promotionMaxValue: 0, conditionTotalAmount: 0, conditionTotalQuantity: 0, promotionValue: 0, forAllCustomer: true, isActive: true, isDiscount: true, isGift: true };
    fromSearch = false;
    saveDisabled = false;
    contactSelected: any;
    productSelected: any;
    categorySelected: any;
    promotionProductSelected: any;
    promotionCategorySelected: any;
    storeSelected: any;
    currency: any;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private promotionService: PromotionService,
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
        await this.analyticsService.setCurrentScreen('promotion-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currency = await this.userService.getAttr('current-currency');
        this.config = { isPercent: false, romotionMaxValue: 0, conditionTotalAmount: 0, conditionTotalQuantity: 0, promotionValue: 0, forAllCustomer: true, isActive: true, isDiscount: true, isGift: true };
        let configId = 0;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id) {
            configId = this.params.id;
        }

        if (configId && configId > 0) {
            this.promotionService.getConfig(configId).then((config) => {
                if (config.maxPromotionQuantity && (config.promotionCategory || config.promotionProduct
                )) {
                    config.isGift = true;
                }
                if (config.promotionValue && config.promotionMaxValue
                ) {
                    config.isDiscount = true;
                }
                this.config = config;
                this.contactSelected = this.config.contact;
                this.productSelected = this.config.product;
                this.categorySelected = this.config.category;
                this.storeSelected = this.config.store;
                this.promotionProductSelected = this.config.promotionProduct;
                this.promotionCategorySelected = this.config.promotionCategory;
            });
        }
    }

    async showSearchContact() {
        this.analyticsService.logEvent('promotion-add-search-contact');
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
        this.analyticsService.logEvent('promotion-add-search-product');
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
        this.analyticsService.logEvent('promotion-add-search-category');
        const callback = (data) => {
            const item = data;
            if (item) {
                this.categorySelected = item;
                this.config.categoryId = item.id;
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    async showSearchPromotionProduct() {
        this.analyticsService.logEvent('promotion-add-search-promotion-product');
        const callback = (data) => {
            const item = data;
            if (item) {
                this.promotionProductSelected = item;
                this.config.promotionProductId = item.id;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async showSearchPromotionCategory() {
        this.analyticsService.logEvent('promotion-add-search-promotion-category');
        const callback = (data) => {
            const item = data;
            if (item) {
                this.promotionCategorySelected = item;
                this.config.promotionCategoryId = item.id;
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    validate(): boolean {
        if (!this.config.name) {
            alert(this.translateService.instant('promotion-add.no-name-alert'));
            return false;
        }
        if (!this.config.name) {
            alert(this.translateService.instant('promotion-add.no-code-alert'));
            return false;
        }
        if (!this.config.startDate) {
            alert(this.translateService.instant('promotion-add.no-start-date-alert'));
            return false;
        }
        if (!this.config.endDate) {
            alert(this.translateService.instant('promotion-add.no-end-date-alert'));
            return false;
        }
        if (!this.config.isDiscount && !this.config.isGift) {
            alert(this.translateService.instant('promotion-add.must-select-at-least-one-type'));
            return false;
        }
        if (this.config.isDiscount && !this.config.promotionValue) {
            alert(this.translateService.instant('promotion-add.no-promotion-value-alert'));
            return false;
        }
        if (!this.config.forAllCustomer && !this.contactSelected) {
            alert(this.translateService.instant('promotion-add.no-contact-alert'));
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
        this.promotionService.saveConfig(this.config).then(async () => {
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

    removePromotionProduct(): void {
        this.promotionProductSelected = null;
        this.config.promotionProductId = 0;
    }

    removePromotionCategory(): void {
        this.promotionCategorySelected = null;
        this.config.promotionCategoryId = 0;
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
        this.navCtrl.publish('reloadPromotionList', null);
        this.navCtrl.publish('reloadPromotion', this.config);
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
            message: this.translateService.instant('promotion.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.promotionService.deleteConfig(this.config).then(async () => {
                            this.analyticsService.logEvent('promotion-config-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadPromotionList', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async showSearchStore() {
        const callback = (data) => {
            const store = data;
            if (store) {
                this.storeSelected = store;
                this.config.storeId = store.id;
            }
        };
        this.navCtrl.push('/store', { callback, searchMode: true });
    }

    removeStore(): void {
        this.storeSelected = null;
        this.config.storeId = 0;
    }
}
