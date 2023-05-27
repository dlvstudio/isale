import { Component, OnInit } from '@angular/core';
import { Platform, ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { UserService } from '../../providers/user.service';
import { Helper } from '../../providers/helper.service';
import { IProduct } from '../../models/product.interface';
import { IDebt } from '../../models/debt.interface';
import { ProductService } from '../../providers/product.service';
import { DebtService } from '../../providers/debt.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { AnalyticsService } from '../../providers/analytics.service';
import { ExcelService } from '../../providers/excel.service';
import { PlanService } from '../../providers/plan.service';
import { DateTimeService } from '../../providers/datetime.service';
import { DataService } from '../../providers/data.service';
import { StoreService } from '../../providers/store.service';

@Component({
  selector: 'material',
  templateUrl: './material.component.html',
})
export class MaterialComponent implements OnInit {
  originalProducts: IProduct[];
  products: IProduct[];
  searchKey = '';
  currency: string;
  isMobile = true;
  checkProduct = 0;
  currentPlan: any = null;
  start = 0;
  end = 20;
  pageSize = 20;
  currentPage = 0;
  listOption = 'all';
  isOnTrial;
  selectMode = false;
  isSelectAll = false;
  store;
  checkStore;
  selectedStaff;
  canViewProductCostPrice = false;

  constructor(
    private platform: Platform,
    private barcodeScanner: BarcodeScanner,
    private productService: ProductService,
    public staffService: StaffService,
    private debtService: DebtService,
    public translateService: TranslateService,
    private userService: UserService,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    public dataService: DataService,
    public navCtrl: RouteHelperService,
    private analyticsService: AnalyticsService,
    private planService: PlanService,
    private storeService: StoreService,
    private excelService: ExcelService
  ) {
    this.navCtrl.removeEventListener('reloadProductList', this.reload);
    this.navCtrl.addEventListener('reloadProductList', this.reload);
  }

  ngOnInit(): void {
    this.platform.resize.subscribe(() => {
      this.isMobile = this.platform.width() < 720;
    });
    this.reload();
  }

  async ionViewWillEnter() {
    await this.analyticsService.setCurrentScreen('home');
  }

  reload = async () => {
    const loading = await this.navCtrl.loading();
    this.isMobile = this.platform.width() < 720;
    this.currency = await this.userService.getAttr('current-currency');
    this.currentPlan = await this.planService.getCurrentPlan();
    this.selectedStaff = this.staffService.selectedStaff;
    this.store = await this.storeService.getCurrentStore();
    this.canViewProductCostPrice = !this.selectedStaff || this.selectedStaff.hasFullAccess || this.selectedStaff.canViewProductCostPrice;
    this.checkStore = this.store
      ? this.translateService.instant('store.check-store', { shop: this.store.name })
      : null;
    if (!this.currentPlan) {
      this.checkProduct = await this.planService.checkProduct();
      if (this.checkProduct >= 30) {
        this.isOnTrial = await this.planService.isOnTrial(this.currentPlan);
      }
    }
    const p = this.listOption === 'all'
      ? this.productService.getProducts(this.store ? this.store.id : 0, true)
      : this.listOption === 'expiry'
        ? this.productService.getProductsExpiry(this.store ? this.store.id : 0, true)
        : this.productService.getProductsQuantity(this.store ? this.store.id : 0, true);

    p.then(async (products) => {
      for (const product of products) {
        product.units = product.unitsJson ? JSON.parse(product.unitsJson) : [];
      }
      this.originalProducts = JSON.parse(JSON.stringify(products));
      this.products = products;
      await loading.dismiss();
    });
  }

  async openProductAdd(): Promise<void> {
    const hasPermission = this.staffService.canAddUpdateProduct();
    if (!hasPermission) {
      alert(this.translateService.instant('product.no-permission'));
      return;
    }
    if (!this.currentPlan && this.checkProduct >= 30 && !this.isOnTrial) {
      this.analyticsService.logEvent('check-product-alert');
      alert(this.translateService.instant('product.check-product-alert', { total: this.checkProduct }));
      return;
    }
    this.navCtrl.push('/product/quick-add', {isMaterial: true});
  }

  isNotCordova() {
    return this.navCtrl.isNotCordova();
  }

  async scanProduct(): Promise<void> {
    this.analyticsService.logEvent('product-scan-barcode');
    if (this.navCtrl.isNotCordova()) {
      const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (data && data.barcode) {
        this.doEnteredBarcode(data.barcode);
      }
      return;
    }
    this.barcodeScanner.scan().then((barcodeData) => {
      if (!barcodeData || !barcodeData.text) {
        return;
      }
      this.doEnteredBarcode(barcodeData.text);
    });
  }

  doEnteredBarcode = (barcode) => {
    if (!barcode) {
      return;
    }
    this.productService.searchByBarcode(barcode).then((product: IProduct) => {
      if (product) {
        this.analyticsService.logEvent('product-scan-barcode-ok');
        this.navCtrl.push('/product/detail', { id: product.id });
        return;
      }
      this.navCtrl.push('/product/quick-add', { barcode });
    });
  }

  async search(): Promise<void> {
    this.analyticsService.logEvent('product-search');
    let products: IProduct[] = JSON.parse(JSON.stringify(this.originalProducts));
    if (this.searchKey !== null && this.searchKey !== '') {
      const searchKey = this.searchKey.toLowerCase();
      products = products.filter((item) => (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1)
          || (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
          || (item.barcode && item.barcode.toLowerCase().indexOf(searchKey) !== -1));
    }
    this.products = products;
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 0;
  }

  clearSearch() {
    this.searchKey = null;
    this.reload();
  }

  limitText(text: string, maxLength: number = 200): string {
    return Helper.limitText(text, maxLength);
}

  selectProduct(id: number): void {
    if (this.selectMode) {
      return;
    }
    try {
      this.navCtrl.navigateForward('/product/detail', { id });
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  async deleteProduct(product: IProduct): Promise<void> {
    const hasPermission = this.staffService.canAddUpdateProduct();
    if (!hasPermission) {
      alert(this.translateService.instant('product.no-permission'));
      return;
    }
    const confirm = await this.alertCtrl.create({
      header: this.translateService.instant('common.confirm'),
      message: this.translateService.instant('product-detail.delete-alert'),
      buttons: [
        {
          text: this.translateService.instant('common.agree'),
          handler: () => {
            this.productService.deleteProduct(product).then(async () => {
              this.analyticsService.logEvent('product-delete-success');
              let i = this.products.findIndex(item => item.id === product.id);
              if (i >= 0) {
                this.products.splice(i, 1);
              }
              i = this.originalProducts.findIndex(item => item.id === product.id);
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

  importProducts(): void {
    if (!this.currentPlan && this.checkProduct >= 30 && !this.isOnTrial) {
      this.analyticsService.logEvent('check-product-alert');
      alert(this.translateService.instant('product.check-product-alert', { total: this.checkProduct }));
      return;
    }
    this.navCtrl.navigateForward('/product/import', {isMaterial: true});
  }

  async presentActionSheet(product: IProduct) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translateService.instant('action.action'),
      buttons: [
        {
          text: this.translateService.instant('product-detail.delete'),
          role: 'destructive',
          handler: () => {
            this.deleteProduct(product);
          }
        }, {
          text: this.translateService.instant('product-detail.view-detail'),
          handler: () => {
            this.selectProduct(product.id);
          }
        }, {
          text: this.translateService.instant('product-detail.multi-select'),
          handler: () => {
            this.selectMode = true;
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

  productName(code: string, title: string): string {
    return Helper.productName(code, title);
  }

  removeProductDebts(contactId: number): Promise<any> {
    return new Promise((res, rej) => {
      this.debtService.getDebtsByContact(contactId).then((debts: IDebt[]) => {
        const ar: Promise<any>[] = [];
        if (debts && debts.length > 0) {
          for (const debt of debts) {
            debt.productId = 0;
            const p = this.debtService.saveDebt(debt);
            ar.push(p);
          }
        }
        if (ar.length > 0) {
          Promise.all(ar).then(() => {
            res(true);
          }).catch(() => {
            rej(null);
          });
          return;
        }
        res(true);
      }).catch(() => {
        rej(null);
      });
    });
  }

  exportProductNotesReport(reportType: number): void {
    this.navCtrl.navigateForward('/product/export', { reportType });
  }

  goHelpPage(page) {
    this.navCtrl.push('/help/' + page);
  }

  async exportProductsReport(): Promise<void> {
    const fileName = 'products-report.xlsx';
    const loading = await this.navCtrl.loading();
    this.excelService.downloadProductsReport(fileName, true).then(async (url) => {
      this.analyticsService.logEvent('product-export-to-excel-success');
      await loading.dismiss();
      if (this.navCtrl.isNotCordova()) {
        return;
      }
      const confirm = await this.alertCtrl.create({
        header: this.translateService.instant('common.confirm'),
        message: this.translateService.instant('report.file-save-alert') + url,
        buttons: [
          {
            text: this.translateService.instant('common.agree'),
            handler: () => {
            }
          }
        ]
      });
      await confirm.present();
      this.userService.shareFileUrl(fileName, fileName, url);
    });
  }

  requestProPlan() {
    this.navCtrl.push('/request-pro');
  }

  dateFormat(date: string): string {
    return DateTimeService.toUiDateString(date);
  }

  showExpiries() {
    this.navCtrl.navigateForward('/product/expiries');
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
    this.end = this.start + this.pageSize - 1;
    this.isSelectAll = false;
  }

  nextPage() {
    if ((this.currentPage + 1) * this.pageSize >= this.products.length) {
      return;
    }
    this.currentPage++;
    this.start = this.currentPage * this.pageSize;
    this.end = this.start + this.pageSize - 1;
    this.isSelectAll = false;
  }

  changeListOption() {
    this.start = 0;
    this.end = 19;
    this.currentPage = 0;
    this.reload();
  }

  showSelect() {
    this.selectMode = true;
    this.isSelectAll = false;
  }

  exitSelectMode() {
    this.selectMode = false;
    this.isSelectAll = false;
    for (const product of this.products) {
      product.isSelected = false;
    }
  }

  async multiDelete() {
    const count = this.products ? this.products.filter(t => t.isSelected).length : 0;
    if (count === 0) {
      alert(this.translateService.instant('product-detail.multi-delete-no-product-alert'));
      return;
    }
    const confirm = await this.alertCtrl.create({
      header: this.translateService.instant('common.confirm'),
      message: this.translateService.instant('product-detail.multi-delete-alert', { count }),
      buttons: [
        {
          text: this.translateService.instant('common.agree'),
          handler: async () => {
            const loading = await this.navCtrl.loading();
            const productsToDelete = [];
            const arr = [];
            for (const product of this.products) {
              if (product.isSelected) {
                productsToDelete.push(product);
                arr.push(this.productService.deleteProduct(product));
              }
            }
            await Promise.all(arr);
            for (const product of productsToDelete) {
              this.analyticsService.logEvent('product-delete-success');
              let i = this.products.findIndex(item => item.id === product.id);
              if (i >= 0) {
                this.products.splice(i, 1);
              }
              i = this.originalProducts.findIndex(item => item.id === product.id);
              if (i >= 0) {
                this.originalProducts.splice(i, 1);
              }
            }
            this.selectMode = false;
            await loading.dismiss();
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

  selectAll() {
    for (const product of this.products) {
      product.isSelected = false;
    }
    for (let i = this.start; i < this.end; i++) {
      const product = this.products[i];
      product.isSelected = this.isSelectAll;
    }
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
            await this.reload();
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

  floor(num) {
    return Math.floor(num);
  }
}
