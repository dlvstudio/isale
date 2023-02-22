import { IProduct } from './../../models/product.interface';
import { Component } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import * as _ from 'lodash';
import { PlanService } from '../../providers/plan.service';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../../providers/data.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'product-search',
    templateUrl: 'search.component.html'
})
export class ProductSearchComponent {
    products: IProduct[];
    originalProducts: IProduct[];
    searchKey = '';
    currency: string;
    callback: any;
    params;
    checkProduct = 0;
    currentPlan: any = null;
    start = 0;
    end = 20;
    pageSize = 20;
    currentPage = 0;
    listOption = 'all';
    isMobile = true;
    shop;
    isOnTrial;
    selectedStaff;
    store;
    checkStore;

    constructor(public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private userService: UserService,
        public staffService: StaffService,
        private productService: ProductService,
        private analyticsService: AnalyticsService,
        public translateService: TranslateService,
        private dataService: DataService,
        private storeService: StoreService,
        private planService: PlanService,
        private alertCtrl: AlertController,
    ) {
        this.navCtrl.removeEventListener('reloadProductList', this.reloadProducts);
        this.navCtrl.addEventListener('reloadProductList', this.reloadProducts);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-search');
    }

    reloadProducts = async () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getCurrentCurrency();
        this.selectedStaff = this.staffService.selectedStaff;
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.currentPlan = await this.planService.getCurrentPlan();
        if (!this.currentPlan) {
            this.checkProduct = await this.planService.checkProduct();
            if (this.checkProduct >= 30) {
                this.shop = await this.dataService.getFirstObject('shop');
                const shopCreatedAt = this.shop ? new Date(this.shop.createdAt) : null;
                let shopCreatedAtPlus6 = null;
                if (shopCreatedAt) {
                    shopCreatedAtPlus6 = new Date(this.shop.createdAt);
                    shopCreatedAtPlus6.setDate(shopCreatedAtPlus6.getDate() + 6);
                }
                const currentDateMinus6 = new Date();
                currentDateMinus6.setDate(currentDateMinus6.getDate() - 6);
                this.isOnTrial = !this.currentPlan && shopCreatedAt && (shopCreatedAt >= currentDateMinus6);
            }
        }
        let p = this.listOption === 'all'
            ? this.productService.getProducts(this.store ? this.store.id : 0)
            : this.listOption === 'expiry'
                ? this.productService.getProductsExpiry(this.store ? this.store.id : 0)
                : this.productService.getProductsQuantity(this.store ? this.store.id : 0);
        p.then(async (products) => {
            products = _.orderBy(products, ['modifiedAt'], ['desc']);
            this.originalProducts = JSON.parse(JSON.stringify(products));
            this.products = products;
            await loading.dismiss();
        });
    }

    ngOnInit(): void {
        this.reloadProducts();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-product-search');
        let products: IProduct[] = JSON.parse(JSON.stringify(this.originalProducts));
        if (this.searchKey !== null && this.searchKey !== '') {
            this.start = 0;
            this.end = 19;
            this.currentPage = 0;
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => {
                return (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        products = _.orderBy(products, ['modifiedAt'], ['desc']);
        this.products = products;
    }

    clearSearch() {
        this.start = 0;
        this.end = 19;
        this.currentPage = 0;
        this.searchKey = null;
        this.reloadProducts();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss();
    }

    async selectProduct(product: IProduct): Promise<void> {
        if (this.callback) {
            this.callback(product);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(product);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    openProductAdd(): void {
        if (!this.currentPlan && this.checkProduct >= 30 && !this.isOnTrial) {
            this.analyticsService.logEvent('check-product-alert');
            alert(this.translateService.instant('product.check-product-alert', { total: this.checkProduct }));
            return;
        }
        this.navCtrl.push('/product/quick-add', { fromSearch: true });
    }

    get isShowPaging() {
        if (this.products && this.products.length > this.pageSize) {
            return true;
        }
        return false;
    }

    previousPage() {
        if (this.currentPage <= 0) {
            this.currentPage = 0;
            return;
        }
        this.currentPage--;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize;
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.products.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
    }

    changeListOption() {
        this.start = 0;
        this.end = 19;
        this.currentPage = 0;
        this.reloadProducts();
    }

    async exitStore() {
      const confirm = await this.alertCtrl.create({
        header: this.translateService.instant('common.confirm'),
        message: this.translateService.instant('store.exit-store-alert', { shop: this.store.name }),
        buttons: [
          {
            text: this.translateService.instant('common.agree'),
            handler: async () => {
              await this.storeService.exitStore();
              await this.reloadProducts();
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
}
