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
import { StoreService } from '../../providers/store.service';

@Component({
  selector: 'products-expiry',
  templateUrl: './products-expiry.component.html',
})
export class ProductsExpiryComponent implements OnInit {

  originalProducts: IProduct[];
  products: IProduct[];
  searchKey = '';
  currency: string;
  isMobile = true;
  checkProduct = 0;
  currentPlan: any = null;
  isOnTrial;

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
    if (!this.currentPlan) {
      this.checkProduct = await this.planService.checkProduct();
      if (this.checkProduct >= 30) {
        this.isOnTrial = await this.planService.isOnTrial(this.currentPlan);
      }
    }
    const store = await this.storeService.getCurrentStore();
    this.productService.getProductsExpiry(store ? store.id : 0, 0).then(async (products) => {
      this.originalProducts = JSON.parse(JSON.stringify(products));
      this.products = products;
      await loading.dismiss();
    });
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
      this.navCtrl.push('/product/edit', { barcode });
    });
  }

  async search(): Promise<void> {
    this.analyticsService.logEvent('product-search');
    let products: IProduct[] = JSON.parse(JSON.stringify(this.originalProducts));
    if (this.searchKey !== null && this.searchKey !== '') {
      const searchKey = this.searchKey.toLowerCase();
      products = products.filter((item) => (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1)
          || (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1));
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
      this.navCtrl.navigateForward('/product/detail', { id });
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  async deleteProduct(product: IProduct): Promise<void> {
    const confirm = await this.alertCtrl.create({
      header: this.translateService.instant('common.confirm'),
      message: this.translateService.instant('product-detail.delete-alert'),
      buttons: [
        {
          text: this.translateService.instant('common.agree'),
          handler: () => {
            this.productService.deleteProduct(product).then(async () => {
              this.analyticsService.logEvent('product-delete-success');
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

  importProducts(): void {
    if (!this.currentPlan && this.checkProduct >= 30 && !this.isOnTrial) {
      this.analyticsService.logEvent('check-product-alert');
      alert(this.translateService.instant('product.check-product-alert', { total: this.checkProduct }));
      return;
    }
    this.navCtrl.navigateForward('/product/import');
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
    this.excelService.downloadProductsReport(fileName).then(async (url) => {
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

  }
}
