import { ModalController, Platform, ActionSheetController, ToastController, AlertController } from '@ionic/angular';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { Helper } from '../../providers/helper.service';
import { UserService } from '../../providers/user.service';
import { Product } from '../../models/product.model';
import { IProduct } from '../../models/product.interface';
import { GalleryComponent } from '../shared/gallery.component';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ProductNoteItem } from '../../models/product-note.model';
import * as _ from 'lodash';
import { ITradeToCategory } from '../../models/trade-to-category.interface';
import { TradeToCategory } from '../../models/trade-to-category.model';
import { TradeService } from '../../providers/trade.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { DateTimeService } from '../../providers/datetime.service';
import * as moment from 'moment';
import { StoreService } from '../../providers/store.service';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'product-quick-add',
    templateUrl: 'product-quick-add.component.html'
})
export class ProductQuickAddComponent {
    @ViewChild('barcodeInput', { static: true }) barcodeInput;
    @ViewChild('barcodeInputCombo', { static: true }) barcodeInputCombo;
    @ViewChild('barcodeInputMaterial', { static: true }) barcodeInputMaterial;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    params: any = null;
    product: IProduct = new Product();
    pictures: string[] = [];
    productAttributesSaved: any[];
    productBarcodesSaved: any[];
    productTypesSaved: any[];
    imageSize: number;
    barcode: string;
    barcodeMaterial: string;
    storageDirectory = '';
    arr = [];
    lastSamplePictureId = 0;
    currency: any;
    isNew = true;
    saveDisabled = false;
    fileToUploads: any;
    uploadDisabled = false;
    isExtend = false;
    productsAdded: IProduct[] = [];
    fromSearch = false;
    isMobile = false;
    tab = 'inprogress';
    categories: ITradeToCategory[] = [];
    categoriesToRemove: ITradeToCategory[] = [];
    addCount = 0;
    store;
    checkStore;
    selectedStaff;
    canViewProductCostPrice;
    canUpdateProductCostPrice;
    isMaterial = false;

    constructor(
        public navCtrl: RouteHelperService,
        private camera: Camera,
        private transfer: FileTransfer,
        private userService: UserService,
        private dataService: DataService,
        private staffService: StaffService,
        private modalCtrl: ModalController,
        private productService: ProductService,
        private barcodeScanner: BarcodeScanner,
        private platform: Platform,
        public translateService: TranslateService,
        private actionSheetController: ActionSheetController,
        private file: File,
        private analyticsService: AnalyticsService,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController,
        private storeService: StoreService,
        private tradeService: TradeService,
    ) {
        this.platform.ready().then(() => {
            // make sure this is on a device, not an emulation (e.g. chrome tools device mode)
            if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
                return false;
            }

            if (this.platform.is('ios')) {
                this.storageDirectory = this.file.documentsDirectory;
            } else if (this.platform.is('android')) {
                this.storageDirectory = this.file.dataDirectory;
            } else {
                // exit otherwise, but you could add further types here e.g. Windows
                return false;
            }
        });
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save(true, false);
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-quick-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        if (!this.staffService.canAddUpdateProduct()) {
            this.navCtrl.pop();
            return;
        }
        this.userService.getAttr('current-currency').then((code) => {
            this.currency = Helper.getCurrencyByCode(code);
        });
        this.selectedStaff = this.staffService.selectedStaff;
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        this.product = new Product();
        this.product.count = 1;
        this.product.price = null;
        let productId = 0;
        let barcode = '';
        this.canViewProductCostPrice = !this.staffService.isStaff()
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canViewProductCostPrice;
        this.canUpdateProductCostPrice = !this.staffService.isStaff()
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canUpdateProductCostPrice;
        if (this.params && this.params.id) {
            productId = this.params.id;
            this.isNew = false;
        } else if (this.params && this.params.barcode) {
            barcode = this.params.barcode;
            this.isNew = true;
        } else if (this.params && this.params.copy) {
            this.product = this.params.copy;
            this.product.id = 0;
            this.isNew = true;
        }
        this.isMaterial = this.params && this.params.isMaterial;

        if (productId && productId > 0) {
            this.productService.get(productId, 0).then((product) => {
                this.product = product;
                const pictures = product.imageUrlsJson ? JSON.parse(product.imageUrlsJson) : [];
                this.pictures = pictures;
                this.product.units = JSON.parse(this.product.unitsJson);
                this.buildPictureGrid();
            });
        } else {
            if (barcode) {
                const product = new Product();
                product.barcode = barcode;
                this.product = product;
            }
            const arr = [];
            let row = [];
            for (const picture of this.pictures) {
                row.push(picture);
                if (row.length === 3) {
                    arr.push(row);
                    row = [];
                }
            }
            if (row.length > 0) {
                arr.push(row);
            }
            this.arr = arr;
        }
        this.barcodeFocus();
    }

    validate(): boolean {
        if (!this.product.title) {
            alert(this.translateService.instant('product-add.no-title-alert'));
            return false;
        }
        if (this.isMaterial && this.product.costPrice && !this.product.price) {
            this.product.price = this.product.costPrice;
        }
        if (!this.product.price) {
            alert(this.translateService.instant('product-add.no-price-alert'));
            return false;
        }
        if (this.product.units && this.product.units.length) {
            for (const unit of this.product.units) {
                if (!unit.unit) {
                    alert(this.translateService.instant('product-add.no-unit-unit-alert'));
                    return false;
                }
                if (!unit.price) {
                    alert(this.translateService.instant('product-add.no-unit-price-alert'));
                    return false;
                }
                if (!unit.exchange) {
                    alert(this.translateService.instant('product-add.no-unit-exchange-alert'));
                    return false;
                }
            }
        }
        return true;
    }

    async save(onToolbar: boolean, cont: boolean): Promise<void> {
        if (!this.validate()) {
            return;
        }
        if (this.saveDisabled) {
            return;
        }
        this.analyticsService.logEvent('product-quick-add-save-' + (onToolbar ? 'on-toolbar' : 'on-page'));
        this.saveDisabled = true;
        if (this.staffService.isStaff()) {
            this.product.staffId = this.staffService.selectedStaff.id;
        }
        this.product.isMaterial = this.isMaterial;
        this.product.imageUrlsJson = JSON.stringify(this.pictures);
        const loading = await this.navCtrl.loading();
        if (this.product.barcode) {
            const productByBarcode = await this.productService.searchByBarcode(this.product.barcode);
            if (productByBarcode) {
                this.analyticsService.logEvent('product-quick-add-duplicated-barcode');
                const mess = this.translateService.instant('product-add.duplicate-barcode-alert',
                    { barcode: this.product.barcode });
                alert(mess);
                this.saveDisabled = false;
                await loading.dismiss();
                return;
            }
        }
        if (this.product.code) {
            const productsByCode = await this.productService.getProductsByCode(this.product.code);
            if (productsByCode && productsByCode.length) {
                this.analyticsService.logEvent('product-quick-add-duplicated-code');
                const mess = this.translateService.instant('product-add.duplicate-code-alert',
                    { code: this.product.code });
                alert(mess);
                this.saveDisabled = false;
                await loading.dismiss();
                return;
            }
        }
        const productsByName = await this.productService.getProductsByTitle(this.product.title);
        if (productsByName && productsByName.length) {
            this.analyticsService.logEvent('product-quick-add-duplicated-title');
            const mess = this.translateService.instant('product-add.duplicate-title-alert',
                { title: this.product.title });
            alert(mess);
            this.saveDisabled = false;
            await loading.dismiss();
            return;
        }
        if (this.product.isCombo) {
            if (!this.product.items || !this.product.items.length) {
                const mess = this.translateService.instant('product-add.no-combo-products',
                    { title: this.product.title });
                alert(mess);
                return;
            }
            this.product.itemsJson = JSON.stringify(this.product.items);
        }
        const updatedQuantity = this.product.count;
        this.product.count = 0;
        this.product.unitsJson = this.product.units ? JSON.stringify(this.product.units) : null;
        this.product.materialsJson = this.product.materials && this.product.materials.length
            ? JSON.stringify(this.product.materials)
            : null;
        this.productService.saveProduct(this.product).then(async () => {
            if (updatedQuantity > 0) {
                const subNote = new ProductNoteItem();
                subNote.amount = 0; // amount is count to combo;
                subNote.unitPrice = this.product.price;
                subNote.unit = this.product.unit;
                subNote.quantity = updatedQuantity;
                subNote.productId = this.product.id;
                subNote.productCode = this.product.code;
                subNote.productName = this.product.title;
                subNote.discount = 0;
                subNote.discountType = 0;
                subNote.storeId = this.store ? this.store.id : subNote.storeId;
                subNote.note = this.translateService.instant('product-add.update-quantity-manually');
                subNote.staffId = this.staffService.isStaff() ? this.staffService.selectedStaff.id : 0;
                await this.productService.saveProductNote(subNote);
            }
            const arr = [];
            if (this.categories && this.categories.length > 0) {
                const p = this.tradeService.saveCategoriesToTrade(this.categories, this.product.id);
                arr.push(p);
            }
            if (this.categoriesToRemove && this.categoriesToRemove.length > 0) {
                const p = this.tradeService.deleteCategoriesToTrade(this.categoriesToRemove);
                arr.push(p);
            }
            if (arr.length) {
                await Promise.all(arr);
                this.categories = [];
                this.categoriesToRemove = [];
            }
            this.analyticsService.logEvent('product-quick-add-save-success');
            if (this.productBarcodesSaved && this.productBarcodesSaved.length) {
                const arrSave = [];
                for (const barcode of this.productBarcodesSaved) {
                    barcode.productId = this.product.id;
                    arrSave.push(this.productService.saveProductBarcode(barcode));
                }
                if (arrSave.length) {
                    await Promise.all(arrSave);
                }
            }
            if (this.productAttributesSaved && this.productAttributesSaved.length) {
                const arrSave = [];
                for (const attribute of this.productAttributesSaved) {
                    attribute.productId = this.product.id;
                    arrSave.push(this.productService.saveProductAttribute(attribute));
                }
                if (arrSave.length) {
                    await Promise.all(arrSave);
                }
            }
            if (this.productTypesSaved && this.productTypesSaved.length) {
                const arrSave = [];
                for (const type of this.productTypesSaved) {
                    type.productId = this.product.id;
                    arrSave.push(this.productService.saveProductType(type));
                }
                if (arrSave.length) {
                    await Promise.all(arrSave);
                }
            }
            if (this.productTypesSaved && this.productTypesSaved.length) {
                const arrSave = [];
                for (const type of this.productTypesSaved) {
                    if (!type.values) {
                        continue;
                    }
                    for (const val of type.values) {
                        val.productTypeId = type.id;
                        val.productId = type.productId;
                        arrSave.push(this.productService.saveProductTypeValue(val));
                    }
                }
                if (arrSave.length) {
                    await Promise.all(arrSave);
                }
            }
            await loading.dismiss();
            const oldProduct = JSON.parse(JSON.stringify(this.product));
            const mess = this.translateService.instant('product-add.added-product',
                { product: Helper.productName(oldProduct.code, oldProduct.title) });
            await this.presentToast(mess);
            this.productsAdded.unshift(oldProduct);
            this.arr = [];
            this.product = new Product();
            this.pictures = [];
            this.product.imageUrlsJson = JSON.stringify(this.pictures);
            this.product.count = 1;
            this.navCtrl.publish('reloadProductList');
            this.saveDisabled = false;
            this.barcodeFocus();

            if (this.addCount > 0) {
                this.analyticsService.logEvent('product-quick-add-save-multi');
            }

            if (cont && this.addCount > 0) {
                return;
            }
            this.addCount++;

            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('product-add.continue-or-close',
                    { product: Helper.productName(oldProduct.code, oldProduct.title) }),
                buttons: [
                    {
                        text: this.translateService.instant('product-add.finish-adding'),
                        handler: async () => {
                            if (this.fromSearch) {
                                await this.navCtrl.pop();
                            } else {
                                await this.navCtrl.popOnly();
                            }
                            this.navCtrl.publish('reloadProductList');
                            this.navCtrl.publish('reloadProductSelector');
                        }
                    },
                    {
                        text: this.translateService.instant('product-add.continue-to-add'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
        }).catch(() => {
            this.saveDisabled = false;
        });
    }

    async presentToast(message: string, duration = 1686) {
        const toast = await this.toastCtrl.create({
            message,
            duration,
            position: 'bottom',
            color: 'danger'
        });
        await toast.present();
    }

    increase() {
        if (!this.product) {
            return;
        }
        this.product.count++;
    }

    decrease() {
        if (!this.product) {
            return;
        }
        this.product.count--;
        if (this.product.count < 0) {
            this.product.count = 0;
        }
    }

    async addImage(idx: number): Promise<void> {
        if (!this.fileToUploads || !this.fileToUploads.length) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        const l = this.fileToUploads.length;
        this.uploadDisabled = true;
        let id = idx;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < l; i++) {
            const fileUpload = this.fileToUploads.item(i);
            await this.dataService.uploadPicture(fileUpload).then((message) => {
                if (message && message.url) {
                    this.doAdd(message.url, id);
                } else if (message && message.error) {
                    alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                    this.uploadDisabled = false;
                }
            }).catch(() => {
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                this.uploadDisabled = false;
            });
            id++;
        }
        this.afterAdd();
    }

    rememberFile($event): void {
        this.fileToUploads = $event.target.files;
        this.browsePicture();
    }

    takePicture(): void {
        this.addImage(-1);
    }

    browsePicture(): void {
        this.addImage(-1);
    }

    downloadImage(imageId: string, imageLocation: string, idx: number) {
        this.platform.ready().then(async () => {
            const fileTransfer = this.transfer.create();
            const loading = await this.navCtrl.loading();
            fileTransfer.download(imageLocation, this.storageDirectory + imageId).then(async (entry) => {
                this.doAdd(entry.toURL(), idx);
                this.afterAdd();
                await loading.dismiss();
            }, async () => {
                await loading.dismiss();
            });
        });
    }

    doAdd(url: string, idx: number): void {
        if (idx >= 0 && idx <= this.pictures.length - 1) {
            this.pictures.push(url);
        } else {
            this.pictures.push(url);
        }
        this.buildPictureGrid();
        this.refreshAvatar();
    }

    afterAdd(): void {
        this.uploadDisabled = false;
        this.fileToUploads = null;
        this.fileUploadInput.nativeElement.value = null;
    }

    refreshAvatar(): void {
        if (this.pictures && this.pictures.length > 0) {
            this.product.avatarUrl = this.pictures[0];
        } else {
            this.product.avatarUrl = null;
        }
    }

    addZerosToNumber(zeroCount: number) {
        let str = '';
        for (let i = 0; i < zeroCount; i++) {
            str += '0';
        }
        if (this.product && this.product.price) {
            let num = this.product.price.toString();
            num += str;
            this.product.price = Number(num);
        }
    }

    addZerosToNumberToUnit(zeroCount: number, unit: any) {
        let str = '';
        for (let i = 0; i < zeroCount; i++) {
            str += '0';
        }
        if (unit && unit.price) {
            let num = unit.price.toString();
            num += str;
            unit.price = Number(num);
        }
    }

    addZerosToNumberToUnitCostPrice(zeroCount: number, unit: any) {
        let str = '';
        for (let i = 0; i < zeroCount; i++) {
            str += '0';
        }
        if (unit && unit.costPrice) {
            let num = unit.costPrice.toString();
            num += str;
            unit.costPrice = Number(num);
        }
    }

    async showImage(idx: number): Promise<void> {
        const images = JSON.parse(JSON.stringify(this.pictures));
        const modal = await this.modalCtrl.create({
            component: GalleryComponent,
            componentProps: { images, id: idx, canDelete: true }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();
        if (data && data.idsToDelete) {
            const idsToDelete: any[] = data.idsToDelete;
            for (const id of idsToDelete) {
                this.removePicture(id);
            }
        }
    }

    buildPictureGrid(): void {
        const arr = [];
        let row = [];
        for (const picture of this.pictures) {
            row.push(picture);
            if (row.length === 3) {
                arr.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            arr.push(row);
        }
        this.arr = arr;
    }

    removePicture(i: number): void {
        this.pictures.splice(i, 1);

        this.buildPictureGrid();

        this.refreshAvatar();
    }

    changePicture(idx: number): void {
        this.addImage(idx);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('product-quick-add-scan-barcode');
        if (this.navCtrl.isNotCordova()) {
            const r = Math.random().toString(36).substring(7);
            this.product.barcode = r;
            return;
        }
        this.barcodeScanner.scan().then(async (barcodeData) => {
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            const product = await this.productService.searchByBarcode(barcodeData.text);
            if (product && product.barcode !== this.product.barcode) {
                alert(this.translateService.instant('product-add.barcode-exist-alert'));
                return;
            }
            this.product.barcode = barcodeData.text;
        });
    }

    async barcodeMaterialChanged() {
        if (!this.barcodeMaterial) {
            return;
        }
        this.productService.searchByBarcode(this.barcodeMaterial).then((product: IProduct) => {
            if (!product || !product.isMaterial) {
                return;
            }
            this.addMaterial(product);
        });
        this.analyticsService.logEvent('product-quick-add-barcode-entered-for-material');
    }

    async barcodeComboChanged() {
        if (!this.barcode) {
            return;
        }
        this.productService.searchByBarcode(this.barcode).then((product: IProduct) => {
            if (!product || product.isMaterial) {
                return;
            }
            this.addProduct(product);
        });
        this.analyticsService.logEvent('product-quick-add-barcode-entered-for-combo');
    }

    async autoGenBarcode(): Promise<void> {
        this.analyticsService.logEvent('product-quick-add-auto-gen-barcode');
        const r = Math.random().toString(36).substring(7);
        this.product.barcode = r;
    }

    barcodeFocus(): void {
        this.doFocus(this.barcodeInput);
    }

    barcodeFocusCombo(): void {
        this.doFocus(this.barcodeInputCombo);
    }

    barcodeFocusMaterial(): void {
        this.doFocus(this.barcodeInputMaterial);
    }

    doFocus(input) {
        setTimeout(() => {
            if (typeof input === 'undefined' || !input) {
                return;
            }
            input.setFocus();
        }, 500);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    async upload() {
        const actionSheet = await this.actionSheetController.create({
            header: this.translateService.instant('common.select-image-source'),
            buttons: [{
                text: this.translateService.instant('common.load-from-gallery'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.PHOTOLIBRARY);
                }
            },
            {
                text: this.translateService.instant('common.use-camera'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.CAMERA);
                }
            },
            {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel'
            }
            ]
        });
        await actionSheet.present();
    }

    async doUpload(sourceType: number) {
        const idx = -1;
        this.uploadDisabled = true;
        const options = {
            quality: 100,
            sourceType,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE
        };
        this.camera.getPicture(options).then(async (imageData) => {
            const base64Image = imageData;
            const loading = await this.navCtrl.loading();
            this.dataService.uploadPictureBase64(base64Image).then(async (message) => {
                await loading.dismiss();
                if (message && message.url) {
                    this.doAdd(message.url, idx);
                    this.afterAdd();
                } else if (message && message.error) {
                    alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                    this.uploadDisabled = false;
                }
            }).catch(async (err) => {
                await loading.dismiss();
                console.error(err);
            });
        });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    async changeIsOption(product: IProduct) {
        if (product.isOption) {
            this.analyticsService.logEvent('product-quick-add-set-is-option');
        }
    }

    async viewTypes() {
        const callback = (data) => {
            if (this.product.id === 0) {
                this.productTypesSaved = data;
            }
        };
        this.navCtrl.push('/product/type', {
            callback,
            productId: this.product.id,
            productTypesSaved: this.productTypesSaved
        });
    }

    async viewAttributes() {
        const callback = (data) => {
            if (this.product.id === 0) {
                this.productAttributesSaved = data;
            }
        };
        this.navCtrl.push('/product/attribute', {
            callback,
            productId: this.product.id,
            productAttributesSaved: this.productAttributesSaved
        });
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    async showOptions(item) {
        const product: any = {};
        product.price = item.price;
        product.id = item.productId;
        product.code = item.productCode;
        product.title = item.productName;
        product.avatarUrl = item.productAvatar;
        product.unit = item.unit;
        product.count = item.count;
        product.options = item.options;
        product.total = item.total;
        product.attributes = item.attributes;
        this.analyticsService.logEvent('product-add-show-combo-options');
        const callback = (data) => {
            if (data) {
                item.options = data.options;
                item.attributes = data.attributes;
            }
        };
        await this.navCtrl.push('/order/option-selector', {
            callback,
            mainProduct: JSON.parse(JSON.stringify(product))
        });
    }

    async increaseItem(item) {
        this.analyticsService.logEvent('product-add-increase-combo-item');
        item.count++;
    }

    async decreaseItem(item) {
        if (item && item.count === 0) {
            return;
        }
        this.analyticsService.logEvent('product-add-decrease-combo-item');
        item.count--;
    }

    async removeProduct(productItem: any): Promise<void> {
        const idx = this.product.items.findIndex(item => item.productId === productItem.productId);
        if (idx >= 0) {
            this.product.items.splice(idx, 1);
        }
        this.analyticsService.logEvent('product-add-remove-combo-item');
    }

    async removeMaterial(productItem: any): Promise<void> {
        const idx = this.product.materials.findIndex(item => item.productId === productItem.productId);
        if (idx >= 0) {
            this.product.materials.splice(idx, 1);
        }
        this.analyticsService.logEvent('product-add-remove-material');
    }

    async showProductSelector() {
        this.analyticsService.logEvent('product-add-search-combo-product');
        const callback = (data) => {
            if (!data || !data.length) {
                return;
            }

            for (const item of this.product.items) {
                item.isExpand = false;
            }
            for (const product of data) {
                this.addProductFromArr(product);
            }
        };
        await this.navCtrl.push('/order/product-selector', { callback });
    }

    async showMaterialSelector() {
        this.analyticsService.logEvent('product-add-search-material');
        const callback = (data) => {
            if (!data || !data.length) {
                return;
            }

            for (const item of this.product.items) {
                item.isExpand = false;
            }
            for (const product of data) {
                this.addMaterialFromArr(product);
            }
        };
        await this.navCtrl.push('/order/product-selector', { callback, isMaterial: true });
    }

    async addProductFromArr(product: any): Promise<void> {
        if (!product) {
            return;
        }

        const idx = this.product.items.findIndex(
            (p) => p.productId === product.id
                    && (!p.attributes || !p.attributes.length)
                    && (!p.options || !p.options.length)
        );
        if (idx >= 0) {
            return;
        }

        const item: any = this.newProductItem(product, product.count);
        item.options = product.options;
        item.attributes = product.attributes;
        this.product.items.unshift(item);

        const mess = this.translateService.instant('product-add.added-combo-product',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
    }

    async addMaterialFromArr(product: any): Promise<void> {
        if (!product) {
            return;
        }

        const idx = this.product.materials.findIndex(
            (p) => p.productId === product.id
        );
        if (idx >= 0) {
            return;
        }
        const materials = product.materialsJson ? JSON.parse(product.materialsJson) : null;

        const productItem: any = this.newProductItem(product, product.count);
        productItem.materials = materials;

        this.product.materials.unshift(productItem);
        const mess = this.translateService.instant('product-add.added-material',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
    }

    async scanItem(): Promise<void> {
        this.analyticsService.logEvent('product-quick-add-scan-barcode-for-combo-product');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.productService.searchByBarcode(data.barcode).then(async (product: IProduct) => {
                    this.analyticsService.logEvent('product-quick-add-scan-barcode-for-combo-ok');
                    this.addProduct(product);
                });
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.productService.searchByBarcode(barcodeData.text).then(async (product: IProduct) => {
                this.analyticsService.logEvent('product-quick-scan-barcode-for-combo-ok');
                this.addProduct(product);
            });
        });
    }

    async scanMaterialItem(): Promise<void> {
        this.analyticsService.logEvent('product-quick-add-scan-barcode-for-material');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.productService.searchByBarcode(data.barcode).then(async (product: IProduct) => {
                    this.analyticsService.logEvent('product-quick-add-scan-barcode-for-material-ok');
                    this.addMaterial(product);
                });
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.productService.searchByBarcode(barcodeData.text).then(async (product: IProduct) => {
                this.analyticsService.logEvent('product-quick-scan-barcode-for-combo-ok');
                this.addMaterial(product);
            });
        });
    }

    async addProduct(product: IProduct): Promise<void> {
        if (product) {
            for (const item of this.product.items) {
                item.isExpand = false;
            }

            const idx = this.product.items.findIndex(item =>
                item.productId === product.id
                && (!item.attributes || !item.attributes.length)
                && (!item.options || !item.options.length)
            );
            if (idx >= 0) {
                const item = this.product.items[idx];
                item.isExpand = true;
                item.count = item.count * 1 + 1;
                const mess1 = this.translateService.instant('product-add.qty-combo-product', {
                    product: item.productName,
                    count: item.count + ''
                });
                this.presentToast(mess1);
                return;
            }

            const productItem: any = this.newProductItem(product, 1);
            this.product.items.unshift(productItem);
            const mess = this.translateService.instant('product-add.added-combo-product',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
        }
    }

    async addMaterial(product: IProduct): Promise<void> {
        if (product) {
            for (const item of this.product.materials) {
                item.isExpand = false;
            }

            const idx = this.product.materials.findIndex(item =>
                item.productId === product.id
            );
            if (idx >= 0) {
                const item = this.product.materials[idx];
                item.isExpand = true;
                item.count = item.count * 1 + 1;
                const mess1 = this.translateService.instant('product-add.qty-material', {
                    product: item.productName,
                    count: item.count + ''
                });
                this.presentToast(mess1);
                return;
            }

            const materials = product.materialsJson ? JSON.parse(product.materialsJson) : null;
            const productItem: any = this.newProductItem(product, 1);
            productItem.materials = materials;

            this.product.materials.unshift(productItem);
            const mess = this.translateService.instant('product-add.added-material',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
        }
    }

    newProductItem(product: IProduct, count: number) {
        const productItem: any = {};
        productItem.price = product.price;
        productItem.productId = product.id;
        productItem.productCode = product.code;
        productItem.productName = product.title;
        productItem.productAvatar = product.avatarUrl;
        productItem.unit = product.unit;
        productItem.count = count;
        productItem.isExpand = false;
        return productItem;
    }

    async showSearchCategory() {
        const callback = async (data) => {
            const category = data;
            if (category) {
                if (this.categories.findIndex((item: ITradeToCategory) => item.categoryId === category.id) >= 0) {
                    const alert = await this.alertCtrl.create({
                        header: 'Chú ý',
                        subHeader: 'Bạn đã thêm Danh mục này rồi.',
                        buttons: ['OK']
                    });
                    await alert.present();
                } else {
                    const tradeToCategory = new TradeToCategory();
                    tradeToCategory.tradeCategory = category;
                    tradeToCategory.categoryId = category.id;
                    this.categories.push(tradeToCategory);
                }
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    removeCategory(category: ITradeToCategory) {
        if (category.id !== 0) {
            this.categoriesToRemove.push(category);
        }
        _.remove(this.categories, (item: ITradeToCategory) => item.categoryId === category.categoryId);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateString(date);
    }

    showDatePopup(): void {
        this.product.expiredAt = moment().startOf('day').format('YYYY-MM-DD');
    }

    addOtherBarcode() {
        const callback = (data) => {
            if (this.product.id === 0) {
                this.productBarcodesSaved = data;
            }
        };
        this.navCtrl.push('/product/barcode', {
            callback,
            productId: this.product.id,
            productBarcodesSaved: this.productBarcodesSaved
        });
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
                        this.selectedStaff = this.staffService.selectedStaff;
                        this.store = await this.storeService.getCurrentStore();
                        this.checkStore = this.store
                            ? this.translateService.instant('store.check-store', { shop: this.store.name })
                            : null;
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

    addUnit() {
        if (!this.product.units) {
            this.product.units = [];
        }
        this.product.units.unshift({});
    }

    removeUnit(unit, index) {
        if (!unit.unit) {
            this.product.units.splice(index, 1);
            return;
        }
        if (!confirm(this.translateService.instant('product-add.remove-unit', { unit: unit.unit }))) {
            return;
        }
        this.product.units.splice(index, 1);
    }

    changeUnit(unit) {
        if (unit.exchange && unit.unit) {
            this.presentToast('1 ' + unit.unit + ' = ' + unit.exchange + ' ' + this.product.unit);
        }
    }

    changeUnitDefault(unit) {
        if (unit.isDefault) {
            this.presentToast(this.translateService.instant('product-add.unit-default-alert', { unit: unit.unit }), 3000);
            for (const u of this.product.units) {
                if (u.unit === unit.unit) {
                    continue;
                }
                u.isDefault = false;
            }
        }
    }

    async expandCombo(product: any): Promise<void> {
        const isExpand = !product.isExpand;
        for (const item of this.product.items) {
            item.isExpand = false;
        }
        product.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('product-selector-expand');
        }
    }

    async expandMaterial(product: any): Promise<void> {
        const isExpand = !product.isExpand;
        for (const item of this.product.materials) {
            item.isExpand = false;
        }
        product.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('product-selector-expand');
        }
    }

    removeDate(): void {
        this.product.expiredAt = '';
    }
}