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
import { IStaff } from '../../models/staff.interface';

@Component({
    selector: 'customer-price-add',
    templateUrl: 'customer-price-add.component.html',
})
export class CustomerPriceAddComponent {
    params: any = null;
    contactSelected: IContact;
    productSelected: IProduct;
    staffSelected: IStaff;
    customerPrice: any = {isCollaboratorPrice: false};
    oldCustomerPrice: any = null;
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
        this.currency = await this.userService.getAttr('current-currency');

        this.customerPrice = {isCollaboratorPrice: false};
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        let customerPriceId = 0;
        let contactId = 0;
        let productId = 0;
        let collaboratorId = 0;
        if (data) {
            if (data && data.id) {
                customerPriceId = data.id;
                this.isNew = false;
            } else if (data && data.contact) {
                contactId = +data.contact;
            } else if (data && data.product) {
                productId = +data.product;
            } else if (data && data.collaborator) {
                collaboratorId = +data.collaborator;
            }
        }
        if (customerPriceId && customerPriceId > 0) {
            const loading = await this.navCtrl.loading();
            this.contactService.getCustomerPrice(customerPriceId).then(async (customerPrice) => {
                await loading.dismiss();
                this.contactSelected = customerPrice.contact;
                this.productSelected = customerPrice.product;
                this.staffSelected = customerPrice.staff;
                this.customerPrice = customerPrice;
                this.oldCustomerPrice = JSON.parse(JSON.stringify(customerPrice));
            });
        } else {
            if (contactId && contactId > 0) {
                this.contactService.get(contactId).then((contact: IContact) => {
                    this.contactSelected = contact;
                    this.customerPrice.contactId = contact.id;
                });
            } else if (productId && productId > 0) {
                this.productService.get(productId, 0).then((product: IProduct) => {
                    this.productSelected = product;
                    this.customerPrice.productId = product.id;
                    this.customerPrice.value = product.price;
                });
            } else if (collaboratorId && collaboratorId > 0) {
                this.staffService.get(collaboratorId).then((staff: IStaff) => {
                    this.staffSelected = staff;
                    this.customerPrice.collaboratorId = staff.id;
                });
            }
        }
    }

    async showSearchStaff() {
        const callback = (data) => {
            const staff = data;
            if (staff) {
                this.staffSelected = staff;
                this.customerPrice.collaboratorId = staff.id;
            }
        };
        this.navCtrl.push('/staff', { callback, searchMode: true });
    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.customerPrice.contactId = contact.id;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchProduct() {
        const callback = (data) => {
            const product = data;
            if (product) {
                this.productSelected = product;
                this.customerPrice.productId = product.id;
                this.customerPrice.price = product.price;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async save(): Promise<void> {
        this.doSave();
    }

    async doSave(): Promise<void> {
        if (!this.staffSelected && !this.contactSelected && !this.customerPrice.isCollaboratorPrice) {
            alert(this.translateService.instant('customer-price-add.no-owner-alert'));
            return;
        }
        if (!this.productSelected) {
            alert(this.translateService.instant('customer-price-add.no-product-alert'));
            return;
        }
        if (this.customerPrice && !this.customerPrice.price) {
            alert(this.translateService.instant('customer-price-add.no-price-alert'));
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.contactService.saveCustomerPrice(this.customerPrice).then(async () => {
            this.analyticsService.logEvent('customer-price-add-save-success');
            const arr: Promise<any>[] = [Promise.resolve(1)];
            if (this.contactSelected) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            Promise.all(arr).then(async () => {
                await loading.dismiss();
                this.exitPage();
            });
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
            this.navCtrl.publish('reloadContactPrice', this.contactSelected.id);
            return result;
        });
    }

    async exitPage() {
        if (this.customerPrice.contact && this.customerPrice.contact.id != 0) {
            this.navCtrl.publish('reloadContact', this.contactSelected);
        }
        if (this.staffSelected) {
            this.navCtrl.publish('reloadStaff', this.staffSelected);
        }
        if (this.productSelected) {
            this.navCtrl.publish('reloadProduct', this.productSelected);
        }
        await this.navCtrl.popOnly();
    }

    removeContact(): void {
        this.contactSelected = null;
        this.customerPrice.contactId = 0;
    }

    removeStaff(): void {
        this.staffSelected = null;
        this.customerPrice.collaboratorId = 0;
    }

    removeProduct(): void {
        this.productSelected = null;
        this.customerPrice.productId = 0;
        this.customerPrice.price = 0;
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
        this.analyticsService.logEvent('customer-price-add-scan-barcode');
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
            this.customerPrice.productId = product.id;
        });
    }

    addZerosToNumber(zeroCount: number) {
        let str = '';
        for (let i = 0; i < zeroCount; i++) {
            str += '0';
        }
        if (this.customerPrice && this.customerPrice.value) {
            let num = this.customerPrice.price.toString();
            num += str;
            this.customerPrice.price = Number(num);
        }
    }

    async presentActionSheet() {
        const buttons = [
            {
                text: this.translateService.instant('customer-price-add.delete'),
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
            message: this.translateService.instant('customer-price-add.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.contactService.deleteCustomerPrice(this.customerPrice).then(async () => {
                            this.analyticsService.logEvent('customer-price-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadContactList');
                            this.navCtrl.publish('reloadContact', this.contactSelected);
                            this.navCtrl.publish('reloadContactPrice', this.contactSelected.id);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }
}
