import { DebtToCategory } from './../../models/debt-to-category.model';
import { Debt } from './../../models/debt.model';
import { IDebtToCategory } from './../../models/debt-to-category.interface';
import { IDebt } from './../../models/debt.interface';
import { IProduct } from './../../models/product.interface';
import { IContact } from './../../models/contact.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { IOrder } from '../../models/order.interface';
import { IReceivedNote } from '../../models/received-note.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ModalController, AlertController } from '@ionic/angular';
import { DebtService } from '../../providers/debt.service';
import { ContactService } from '../../providers/contact.service';
import { ProductService } from '../../providers/product.service';
import { OrderService } from '../../providers/order.service';
import { UserService } from '../../providers/user.service';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ReceivedNoteService } from '../../providers/received-note.service';
import { StaffService } from '../../providers/staff.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'debt-add',
    templateUrl: 'debt-add.component.html',
})
export class DebtAddComponent {
    contactSelected: IContact;
    params: any = null;
    productSelected: IProduct;
    orderSelected: IOrder;
    receivedNoteSelected: IReceivedNote;
    debt: IDebt = new Debt();
    noteSegment = 'content';
    categories: IDebtToCategory[] = [];
    categoriesToRemove: IDebtToCategory[] = [];
    currency: any;
    page = 'debts';
    isNew = true;
    saveDisabled = false;
    store;

    constructor(
        public navCtrl: RouteHelperService,
        private staffService: StaffService,
        private modalCtrl: ModalController,
        private debtService: DebtService,
        private contactService: ContactService,
        private productService: ProductService,
        private orderService: OrderService,
        private receivedNoteService: ReceivedNoteService,
        private alertCtrl: AlertController,
        private userService: UserService,
        private storeService: StoreService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
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
        await this.analyticsService.setCurrentScreen('debt-add');
    }

    async ngOnInit(): Promise<void> {
        this.userService.getAttr('current-currency').then((code) => {
            this.currency = Helper.getCurrencyByCode(code);
        });
        this.debt = new Debt();
        this.params = this.navCtrl.getParams(this.params);
        let debtId = 0;
        let contactId = 0;
        let productId = 0;
        let orderId = 0;
        this.store = await this.storeService.getCurrentStore();
        let receivedNoteId = 0;
        if (this.params) {
            if (this.params.id) {
                debtId = this.params.id;
                this.isNew = false;
            } else if (this.params.contact) {
                contactId = +this.params.contact;
            } else if (this.params.product) {
                productId = +this.params.product;
            } else if (this.params.order) {
                orderId = +this.params.order;
            } else if (this.params.receivedNote) {
                receivedNoteId = +this.params.receivedNote;
            }

            if (this.params.debtType) {
                this.debt.debtType = this.params.debtType;
                if (this.params.debtType == 0 || this.params.debtType == 1) {
                    this.page = 'loans';
                } else {
                    this.page = 'debts';
                }
            } else {
                this.debt.debtType = 0;
                this.page = 'loans';
            }
        }

        if (debtId && debtId > 0) {
            const loading = await this.navCtrl.loading();
            this.debtService.get(debtId).then(async (debt) => {
                await loading.dismiss();
                this.contactSelected = debt.contact;
                this.productSelected = debt.product;
                this.orderSelected = debt.order;
                this.debt = debt;
                this.debtService.getCategoriesToDebt(debtId).then((categories: IDebtToCategory[]) => {
                    this.categories = categories;
                });
            });
        } else if (contactId && contactId > 0) {
            this.contactService.get(contactId).then((contact: IContact) => {
                this.contactSelected = contact;
                this.debt.contactId = contact.id;
            });
        } else if (productId && productId > 0) {
            this.productService.get(productId, this.store ? this.store.id : 0).then((product: IProduct) => {
                this.productSelected = product;
                this.debt.productId = product.id;
            });
        } else if (orderId && orderId > 0) {
            this.orderService.get(orderId).then((order: IOrder) => {
                this.orderSelected = order;
                this.contactSelected = order.contact;
                this.debt.contact = order.contact;
                this.debt.contactId = order.contact ? order.contactId : 0;
                this.debt.order = order;
                this.debt.orderId = order.id;
                this.debt.debtType = 3;
                this.debt.value = this.orderSelected.total;
                this.page = 'debts';
            });
        } else if (receivedNoteId && receivedNoteId > 0) {
            this.receivedNoteService.get(receivedNoteId).then((receivedNote: IReceivedNote) => {
                this.receivedNoteSelected = receivedNote;
                this.contactSelected = receivedNote.contact;
                this.debt.contact = receivedNote.contact;
                this.debt.contactId = receivedNote.contact ? receivedNote.contactId : 0;
                this.debt.receivedNote = receivedNote;
                this.debt.receivedNoteId = receivedNote.id;
                this.debt.debtType = 2;
                this.debt.value = this.receivedNoteSelected.total;
                this.page = 'debts';
            });
        }
    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.debt.contactId = contact.id;
                this.debt.contact = contact;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchProduct() {
        const callback = (data) => {
            const product = data;
            if (product) {
                this.productSelected = product;
                this.debt.productId = product.id;
                this.debt.product = product;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async save(): Promise<void> {
        this.saveDisabled = true;
        if (this.staffService.isStaff()) {
            this.debt.staffId = this.staffService.selectedStaff.id;
        }
        const loading = await this.navCtrl.loading();
        this.debt.storeId = this.store ? this.store.id : 0;
        this.debtService.saveDebt(this.debt).then(async (id) => {
            this.analyticsService.logEvent('debt-add-save-success');
            const arr: Promise<any>[] = [];
            if (this.contactSelected) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            if (this.categories && this.categories.length > 0) {
                const p = this.debtService.saveCategoriesToDebt(this.categories, +id);
                arr.push(p);
            }
            if (this.categoriesToRemove && this.categoriesToRemove.length > 0) {
                const p = this.debtService.deleteCategoriesToDebt(this.categoriesToRemove);
                arr.push(p);
            }
            Promise.all(arr).then(async () => {
                await loading.dismiss();
                this.navCtrl.publish('reloadDebtList', { type: this.debt.debtType.toString() });
                this.navCtrl.publish('reloadDebt', this.debt);

                if (this.debt.contact && this.debt.contact.id != 0) {
                    this.navCtrl.publish('reloadContact', this.debt.contact);
                    this.navCtrl.publish('reloadContactDebt', this.debt.contact.id);
                }
                if (this.debt.order && this.debt.order.id != 0) {
                    this.debt.order.status = 5;
                    this.orderService.saveOrder(this.debt.order).then(() => {
                        this.navCtrl.publish('reloadOrder', this.debt.order);
                        this.navCtrl.publish('reloadOrderList', null);
                    });
                }
                if (this.debt.receivedNote && this.debt.receivedNote.id != 0) {
                    this.navCtrl.publish('reloadReceivedNoteList');
                    this.navCtrl.publish('reloadReceivedNote', this.debt.receivedNote);
                }
                this.exitPage();
            });
        });
    }

    saveLastActive(): Promise<number> {
        const action = 'trade';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList', null);
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactDebt', this.contactSelected.id);
            return result;
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadDebtList', { type: this.debt.debtType.toString() });
        this.navCtrl.publish('reloadDebt', this.debt);
        if (this.isNew) {
            await this.navCtrl.push('/debt/detail', { id: this.debt.id });
        }
        if (this.debt.debtType == 0 || this.debt.debtType == 1) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('debt.loan-alert'),
                buttons: [
                    {
                        text: this.translateService.instant('common.cancel'),
                        handler: () => {
                        }
                    },
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: async () => {
                            this.debtService.saveDebt(this.debt);
                            await this.navCtrl.push('/trade/add', { loan: this.debt.id });
                        }
                    },
                ]
            });
            confirm.present();
        }
    }

    removeCategory(category: IDebtToCategory) {
        if (category.id !== 0) {
            this.categoriesToRemove.push(category);
        }
        _.remove(this.categories, (item: IDebtToCategory) => item.categoryId === category.categoryId);
    }

    async showSearchCategory() {
        const callback = async (data) => {
            const category = data;
            if (category) {
                if (this.categories.findIndex((item: IDebtToCategory) => item.categoryId === category.id) >= 0) {
                    const alert = await this.alertCtrl.create({
                        header: 'Chú ý',
                        subHeader: 'Bạn đã thêm Danh mục này rồi.',
                        buttons: ['OK']
                    });
                    alert.present();
                } else {
                    const debtToCategory = new DebtToCategory();
                    debtToCategory.tradeCategory = category;
                    debtToCategory.categoryId = category.id;
                    this.categories.push(debtToCategory);
                }
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    removeContact(): void {
        this.contactSelected = null;
        this.debt.contactId = 0;
    }

    removeProduct(): void {
        this.productSelected = null;
        this.debt.productId = 0;
        this.debt.productCount = 0;
        this.debt.isPurchase = false;
    }

    changeProductCount(): void {
        if (!this.productSelected || !this.debt.isPurchase) {
            return;
        }
        this.debt.value = this.debt.productCount * this.productSelected.price;
    }

    changeIsPurchase(): void {
        this.debt.productCount = 0;
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }
}
