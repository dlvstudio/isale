import { Component, OnInit, ViewChild } from '@angular/core';
import { Platform, ActionSheetController, AlertController, ModalController, IonContent, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { CurrencyPipe } from '@angular/common';
import * as _ from 'lodash';
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
import { ProductNoteItem } from '../../models/product-note.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
})
export class ProductsPage implements OnInit {
  @ViewChild(IonContent, { static: true }) content: IonContent;
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
  categorySelected;
  params;
  multiEditMode = false;
  price;
  costPrice;
  quantity;
  selectedCount;
  sortOrder = 'asc';
  searchMode = false;
  callback;
  blockViewingQuantity = false;

  constructor(
    private platform: Platform,
    private printer: Printer,
    private barcodeScanner: BarcodeScanner,
    private productService: ProductService,
    public staffService: StaffService,
    private debtService: DebtService,
    public translateService: TranslateService,
    private userService: UserService,
    private currencyPipe: CurrencyPipe,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    public dataService: DataService,
    public navCtrl: RouteHelperService,
    private analyticsService: AnalyticsService,
    private planService: PlanService,
    private storeService: StoreService,
    private toastCtrl: ToastController,
    private excelService: ExcelService
  ) {
    this.navCtrl.removeEventListener('reloadProductList', this.reload);
    this.navCtrl.addEventListener('reloadProductList', this.reload);
  }

  multiEdit() {
    this.multiEditMode = !this.multiEditMode;
  }

  ngOnInit(): void {
    this.platform.resize.subscribe(() => {
      this.isMobile = this.platform.width() < 720;
    });
    this.reload();
  }

  async ionViewWillEnter() {
    this.params = this.navCtrl.getParams(this.params);
    if (this.params && this.params.callback) {
        this.callback = this.params.callback;
    }
    if (this.params && this.params.categorySelected) {
      this.categorySelected = this.params.categorySelected;
    }
    if (this.params && this.params.searchMode) {
      this.searchMode = this.params.searchMode;
    }
    await this.analyticsService.setCurrentScreen('product');
  }

  reload = async () => {
    const loading = await this.navCtrl.loading();
    this.isMobile = this.platform.width() < 720;
    this.currency = await this.userService.getAttr('current-currency');
    this.currentPlan = await this.planService.getCurrentPlan();
    this.selectedStaff = this.staffService.selectedStaff;
    this.blockViewingQuantity = this.selectedStaff && this.selectedStaff.blockViewingQuantity;
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
      ? this.productService.getProducts(this.store ? this.store.id : 0, this.categorySelected ? this.categorySelected.id : 0)
      : this.listOption === 'expiry'
        ? this.productService.getProductsExpiry(this.store ? this.store.id : 0, this.categorySelected ? this.categorySelected.id : 0)
        : this.productService.getProductsQuantity(this.store ? this.store.id : 0, this.categorySelected ? this.categorySelected.id : 0);

    p.then(async (products) => {
      for (const product of products) {
        product.units = product.unitsJson ? JSON.parse(product.unitsJson) : [];
      }
      const ordered = _.orderBy(products, ['title'], [this.sortOrder]);
      this.originalProducts = JSON.parse(JSON.stringify(ordered));
      this.products = ordered;
      await loading.dismiss();
    });
  }

  changeSortOrder() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.reload();
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
    this.navCtrl.push('/product/quick-add');
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

  doEnteredBarcode = (barcode, noadd = false) => {
    if (!barcode) {
      return;
    }
    this.productService.searchByBarcode(barcode).then((product: IProduct) => {
      if (product) {
        if (noadd) {
          this.searchKey = '';
        }
        this.analyticsService.logEvent('product-scan-barcode-ok');
        this.navCtrl.push('/product/detail', { id: product.id });
        return;
      }
      if (!noadd) {
        this.navCtrl.push('/product/quick-add', { barcode });
      }
    });
  }

  async search(): Promise<void> {
    this.analyticsService.logEvent('product-search');
    let products: IProduct[] = JSON.parse(JSON.stringify(this.originalProducts));
    if (this.searchKey !== null && this.searchKey !== '') {
      const searchKey = this.searchKey.toLowerCase();
      products = products.filter((item) => (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1)
        || (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1));
      if ((!products || !products.length) && this.searchKey.length >= 5) {
        this.doEnteredBarcode(this.searchKey, true);
      }
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

  async selectProduct(product: any): Promise<void> {
    if (this.selectMode) {
      return;
    }
    if (this.searchMode) {
        if (this.callback) {
            this.callback(product);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(product);
        return;
    }
    this.navCtrl.push('/product/detail', { id: product.id });
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
          text: this.translateService.instant('product-detail.copy'),
          handler: () => {
            this.copyProduct(product);
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

  async copyProduct(product) {
    const copy = JSON.parse(JSON.stringify(product));
    this.navCtrl.push('/product/quick-add', { copy });
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
    this.content.scrollToTop();
  }

  nextPage() {
    if ((this.currentPage + 1) * this.pageSize >= this.products.length) {
      return;
    }
    this.currentPage++;
    this.start = this.currentPage * this.pageSize;
    this.end = this.start + this.pageSize - 1;
    this.isSelectAll = false;
    this.content.scrollToTop();
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
    this.revertValues();
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
    this.productSelectedChange();
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

  async showSearchCategory() {
    this.analyticsService.logEvent('product-filter-by-category');
    const callback = (data) => {
      const item = data;
      if (item) {
        this.categorySelected = item;
        this.reload();
      }
    };
    this.navCtrl.push('/trade-category', { callback, searchMode: true });
  }

  removeCategory() {
    this.categorySelected = null;
    this.reload();
  }

  showHelpMultiEditForField() {
    alert(this.translateService.instant('product.multi-edit-field-apply-des'));
  }

  applyMultiEditForField(field) {
    const value = field === 'price'
      ? this.price
      : field === 'costPrice'
        ? this.costPrice
        : this.quantity;
    if (!value) {
      alert(this.translateService.instant('common.no-value-alert'));
      return;
    }
    let rowCount = 0
    for (const product of this.products) {
      if (product.isSelected) {
        product[field] = value;
        rowCount++;
      }
    }
    if (!rowCount) {
      alert(this.translateService.instant('common.no-selected-item-alert'));
    }
  }

  async saveMultiEdit() {
    const loading = await this.navCtrl.loading();
    let rowCount = 0
    for (const product of this.products) {
      if (product.isSelected) {
        const updatedQuantity = product.count;
        const oldProduct = this.originalProducts.find(p => p.id === product.id);
        if (!oldProduct) {
          continue;
        }
        product.count = oldProduct.count !== product.count
          ? oldProduct.count
          : product.count;
        await this.productService.saveProduct(product);
        if (oldProduct.count !== updatedQuantity) {
          const subNote = new ProductNoteItem();
          subNote.amount = 0; // amount is count to combo;
          subNote.unitPrice = product.price;
          subNote.unit = product.unit;
          subNote.quantity = updatedQuantity - oldProduct.count;
          subNote.productId = product.id;
          subNote.productCode = product.code;
          subNote.productName = product.title;
          subNote.discount = 0;
          subNote.discountType = 0;
          subNote.storeId = this.store ? this.store.id : subNote.storeId;
          subNote.note = this.translateService.instant('product-add.update-quantity-manually');
          subNote.staffId = this.staffService.isStaff() ? this.staffService.selectedStaff.id : 0;
          await this.productService.saveProductNote(subNote);
        }
        rowCount++;
        product.count = updatedQuantity;
        oldProduct.count = updatedQuantity;
        oldProduct.price = product.price;
        oldProduct.costPrice = product.costPrice;
      }
    }
    if (!rowCount) {
      await loading.dismiss();
      alert(this.translateService.instant('common.no-selected-item-alert'));
      return;
    }
    await loading.dismiss();
    this.presentToast(this.translateService.instant('common.saved-item-alert', { count: rowCount }));
    this.price = null;
    this.quantity = null;
    this.costPrice = null;

  }

  revertValues() {
    let rowCount = 0
    for (const product of this.products) {
      if (product.isSelected) {
        const oldProduct = this.originalProducts.find(p => p.id === product.id);
        rowCount++;
        product.count = oldProduct.count;
        product.price = oldProduct.price;
        product.costPrice = oldProduct.costPrice;
      }
    }
    if (!rowCount) {
      alert(this.translateService.instant('common.no-selected-item-alert'));
      return;
    }
  }

  productSelectedChange() {
    let selectedCount = 0;
    for (const product of this.products) {
      if (product.isSelected) {
        selectedCount++;
      }
    }
    this.selectedCount = selectedCount;
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  printMultiBarcode(): void {
    let html = '';
    let rowCount = 0;
    for (const product of this.products) {
      if (product.isSelected && product.barcode) {
        const price = this.currencyPipe.transform(product.price, this.currency, 'symbol', '1.0-2', this.translateService.currentLang);
        const productHtml = `
          ${rowCount ? '<div style="break-after:page"></div>' : ""}
          <div style='text-align: center;'>
            <img src='${this.userService.apiUrl}/qrcode/barcode?code=${product.barcode}'/>       
            <div>
              <small>${product.barcode}</small>
              <br>
              <b>${product.title}.&nbsp;<span>${price}</span></b></span>
            </div>
          </div>
          `;
        html += productHtml;
        rowCount++;
      }
    }

    if (!rowCount) {
      alert(this.translateService.instant('common.no-selected-item-alert'));
      return;
    }

    if (this.navCtrl.isNotCordova()) {
      Helper.webPrint(html);
      return;
    }
    this.printer.print(html).then(() => { });
  }

  changeValue(product, field) {
    const oldProduct = this.originalProducts.find(p => p.id === product.id);
    if (!oldProduct) {
      return;
    }
    if (product[field] !== oldProduct[field] && !product.isSelected) {
      product.isSelected = true;
      this.productSelectedChange();
    }
  }

  async dismiss() {
      if (this.callback) {
          this.callback(null);
          await this.navCtrl.back();
          return;
      }
      this.modalCtrl.dismiss();
  }
}
