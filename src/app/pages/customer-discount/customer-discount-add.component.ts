import { Component, ViewChild } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import * as _ from 'lodash';

import { IProduct } from '../../models/product.interface';
import { IContact } from '../../models/contact.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { StaffService } from '../../providers/staff.service';
import { ContactService } from '../../providers/contact.service';
import { ProductService } from '../../providers/product.service';
import { UserService } from '../../providers/user.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { TranslateService } from '@ngx-translate/core';
import { TradeService } from '../../providers/trade.service';
import { ITradeCategory } from '../../models/trade-category.interface';
import { IStaff } from '../../models/staff.interface';

@Component({
    selector: 'customer-discount-add',
    templateUrl: 'customer-discount-add.component.html',
})
export class CustomerDiscountAddComponent {
    params: any = null;
    contactSelected: IContact;
    staffSelected: IStaff;
    productSelected: IProduct;
    categorySelected: ITradeCategory;
    customerDiscount: any = {type: 0, conditionQuantity: 0};
    oldCustomerDiscount: any = null;
    currency: any;
    isNew = true;
    saveDisabled = false;

    constructor(
        public navCtrl: RouteHelperService,
        private barcodeScanner: BarcodeScanner,
        private actionSheetCtrl: ActionSheetController,
        private modalCtrl: ModalController,
        public staffService: StaffService,
        private contactService: ContactService,
        private productService: ProductService,
        private tradeService: TradeService,
        private analyticsService: AnalyticsService,
        public translateService: TranslateService,
        private alertCtrl: AlertController,
        private userService: UserService,
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

    async ngOnInit(): Promise<void> {
        this.userService.getAttr('current-currency').then((code) => {
            this.currency = Helper.getCurrencyByCode(code);
        });

        this.customerDiscount = {type: 0, conditionQuantity: 0};
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        let customerDiscountId = 0;
        let contactId = 0;
        let productId = 0;
        let categoryId = 0;
        let collaboratorId = 0;
        if (data) {
            if (data && data.id) {
                customerDiscountId = data.id;
                this.isNew = false;
            } else if (data && data.contact) {
                contactId = +data.contact;
            } else if (data && data.product) {
                productId = +data.product;
            } else if (data && data.category) {
                categoryId = +data.category;
            } else if (data && data.staff) {
                collaboratorId = +data.staff;
            }
        }
        if (customerDiscountId && customerDiscountId > 0) {
            const loading = await this.navCtrl.loading();
            this.contactService.getCustomerDiscount(customerDiscountId).then(async (customerDiscount) => {
                await loading.dismiss();
                this.contactSelected = customerDiscount.contact;
                this.productSelected = customerDiscount.product;
                this.staffSelected = customerDiscount.staff;
                this.categorySelected = customerDiscount.category;
                this.customerDiscount = customerDiscount;
                this.oldCustomerDiscount = JSON.parse(JSON.stringify(customerDiscount));
            });
        } else {
            if (contactId && contactId > 0) {
                this.contactService.get(contactId).then((contact: IContact) => {
                    this.contactSelected = contact;
                    this.customerDiscount.contactId = contact.id;
                });
            } else if (productId && productId > 0) {
                this.productService.get(productId, 0).then((product: IProduct) => {
                    this.productSelected = product;
                    this.customerDiscount.productId = product.id;
                });
            } else if (categoryId && categoryId > 0) {
                this.tradeService.getCategory(categoryId).then((category: ITradeCategory) => {
                    this.categorySelected = category;
                    this.customerDiscount.categoryId = category.id;
                });
            } else if (collaboratorId && collaboratorId > 0) {
                this.staffService.get(collaboratorId).then((staff: IStaff) => {
                    this.staffSelected = staff;
                    this.customerDiscount.collaboratorId = staff.id;
                });
            }
        }
    }

    async showSearchStaff() {
        const callback = (data) => {
            const staff = data;
            if (staff) {
                this.staffSelected = staff;
                this.customerDiscount.collaboratorId = staff.id;
            }
        };
        this.navCtrl.push('/staff', { callback, searchMode: true });
    }

    async showSearchCategory() {
        const callback = async (data) => {
            const category = data;
            if (category) {
                this.categorySelected = category;
                this.customerDiscount.categoryId = category.id;
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.customerDiscount.contactId = contact.id;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchProduct() {
        const callback = (data) => {
            const product = data;
            if (product) {
                this.productSelected = product;
                this.customerDiscount.productId = product.id;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async save(): Promise<void> {
        this.doSave();
    }

    async doSave(): Promise<void> {
        if (this.customerDiscount && !this.customerDiscount.discountValue) {
            alert(this.translateService.instant('customer-discount-add.no-discount-alert'));
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.customerDiscount.categoryId = this.categorySelected ? this.categorySelected.id : 0;
        this.contactService.saveCustomerDiscount(this.customerDiscount).then(async () => {
            this.analyticsService.logEvent('customer-discount-add-save-success');
            await this.saveLastActive();
            await loading.dismiss();
            this.exitPage();
        });
    }

    saveLastActive(): Promise<number> {
        if (!this.contactSelected) {
            return;
        }
        const action = 'note';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactDiscount', this.contactSelected.id);
            this.navCtrl.publish('reloadProduct', this.productSelected);
            return result;
        });
    }

    async exitPage() {
        if (this.contactSelected) {
            this.navCtrl.publish('reloadContact', this.contactSelected);
        }
        if (this.categorySelected) {
            this.navCtrl.publish('reloadCategory', this.categorySelected);
        }
        if (this.productSelected) {
            this.navCtrl.publish('reloadProduct', this.productSelected);
        }
        if (this.staffSelected) {
            this.navCtrl.publish('reloadStaff', this.staffSelected);
        }
        await this.navCtrl.popOnly();
    }

    removeContact(): void {
        this.contactSelected = null;
        this.customerDiscount.contactId = 0;
    }

    removeProduct(): void {
        this.productSelected = null;
        this.customerDiscount.productId = 0;
    }

    removeCategory(): void {
        this.categorySelected = null;
        this.customerDiscount.categoryId = 0;
    }

    removeStaff(): void {
        this.staffSelected = null;
        this.customerDiscount.collaboratorId = 0;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('customer-discount-add-scan-barcode');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.checkBarcodeScaned(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.checkBarcodeScaned(barcodeData.text);
        });
    }

    checkBarcodeScaned(barcode) {
        this.productService.searchByBarcode(barcode).then(async (product) => {
            if (!product) {
                return;
            }
            this.productSelected = product;
            this.customerDiscount.productId = product.id;
        });
    }

    addZerosToNumber(zeroCount: number) {
        let str = '';
        for (let i = 0; i < zeroCount; i++) {
            str += '0';
        }
        if (this.customerDiscount && this.customerDiscount.value) {
            let num = this.customerDiscount.discountValue.toString();
            num += str;
            this.customerDiscount.discountValue = Number(num);
        }
    }

    async presentActionSheet() {
        const buttons = [
            {
                text: this.translateService.instant('customer-discount-add.delete'),
                role: 'destructive',
                handler: () => {
                    this.delete();
                }
            }, {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel',
                handler: () => {
                }
            }
        ];
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        await actionSheet.present();
    }

    async delete(): Promise<void> {
        if (this.isNew) {
            return;
        }
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('customer-discount-add.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.contactService.deleteCustomerDiscount(this.customerDiscount).then(async () => {
                            this.analyticsService.logEvent('customer-discount-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadContactList');
                            this.navCtrl.publish('reloadContact', this.contactSelected);
                            this.navCtrl.publish('reloadContactDiscount', this.contactSelected.id);
                            this.navCtrl.publish('reloadProduct', this.productSelected);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }
}
