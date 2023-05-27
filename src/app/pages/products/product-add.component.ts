import { ModalController, Platform, ActionSheetController, ToastController, AlertController } from '@ionic/angular';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { Helper } from './../../providers/helper.service';
import { UserService } from './../../providers/user.service';
import { Product } from './../../models/product.model';
import { IProduct } from './../../models/product.interface';
import { GalleryComponent } from './../shared/gallery.component';
import { ProductService } from './../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ProductNoteItem } from '../../models/product-note.model';
import { ITradeToCategory } from '../../models/trade-to-category.interface';
import * as _ from 'lodash';
import { TradeToCategory } from '../../models/trade-to-category.model';
import { TradeService } from '../../providers/trade.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import * as moment from 'moment';
import { DateTimeService } from '../../providers/datetime.service';
import { StoreService } from '../../providers/store.service';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'product-add',
    templateUrl: 'product-add.component.html',
})
export class ProductAddComponent {
    @ViewChild('barcodeInput', { static: true }) barcodeInput;
    @ViewChild('barcodeInputCombo', { static: true }) barcodeInputCombo;
    @ViewChild('barcodeInputMaterial', { static: true }) barcodeInputMaterial;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    params: any = null;
    product: IProduct = new Product();
    lastQuantity = 0;
    pictures: string[] = [];
    imageSize: number;
    storageDirectory = '';
    arr = [];
    lastSamplePictureId = 0;
    currency: any;
    barcode: string;
    barcodeMaterial: string;
    isNew = true;
    fromSearch = false;
    saveDisabled = false;
    fileToUploads: any[];
    uploadDisabled = false;
    categories: ITradeToCategory[] = [];
    categoriesToRemove: ITradeToCategory[] = [];
    store;
    checkStore;
    selectedStaff;
    canViewProductCostPrice;
    canUpdateProductCostPrice;

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
        private translateService: TranslateService,
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
        await this.analyticsService.setCurrentScreen('product-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        if (!this.staffService.canAddUpdateProduct()) {
            this.navCtrl.pop();
            return;
        }
        this.currency = await this.userService.getAttr('current-currency');
        this.selectedStaff = this.staffService.selectedStaff;
        this.canViewProductCostPrice = !this.staffService.isStaff()
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canViewProductCostPrice;
        this.canUpdateProductCostPrice = !this.staffService.isStaff()
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canUpdateProductCostPrice;
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        this.product = new Product();
        let productId = 0;
        let barcode = '';
        if (this.params && this.params.id) {
            productId = this.params.id;
            this.isNew = false;
        } else if (this.params && this.params.barcode) {
            barcode = this.params.barcode;
            this.isNew = true;
        }

        if (productId && productId > 0) {
            const loading = await this.navCtrl.loading();
            this.productService.get(productId, 0).then(async (product) => {
                this.product = product;
                const pictures = product.imageUrlsJson ? JSON.parse(product.imageUrlsJson) : [];
                this.pictures = pictures;
                this.product.items = product.itemsJson ? JSON.parse(product.itemsJson) : [];
                this.product.materials = product.materialsJson ? JSON.parse(product.materialsJson) : [];
                this.product['autoMaterials'] = this.product.materials && this.product.materials.length && true;
                this.product.units = JSON.parse(this.product.unitsJson);
                this.lastQuantity = this.product.count;
                this.categories = await this.tradeService.getCategoriesToTrade(productId);
                this.buildPictureGrid();
                await loading.dismiss();
            }).catch(async () => {
                await loading.dismiss();
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
            }
        }
        return true;
    }

    save(): void {
        const hasPermission = this.staffService.canAddUpdateProduct();
        if (!hasPermission) {
            alert(this.translateService.instant('product.no-permission'));
            return;
        }
        if (!this.validate()) {
            return;
        }
        this.saveDisabled = true;
        if (this.staffService.isStaff()) {
            this.product.staffId = this.staffService.selectedStaff.id;
        }
        this.product.imageUrlsJson = JSON.stringify(this.pictures);
        this.product.materialsJson = JSON.stringify(this.product.materials);
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
        this.product.count = this.lastQuantity;
        this.product.unitsJson = this.product.units ? JSON.stringify(this.product.units) : null;
        this.productService.saveProduct(this.product).then(async () => {
            if (this.lastQuantity !== updatedQuantity) {
                const subNote = new ProductNoteItem();
                subNote.amount = 0; // amount is count to combo;
                subNote.unitPrice = this.product.price;
                subNote.unit = this.product.unit;
                subNote.quantity = updatedQuantity - this.lastQuantity;
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
            }
            this.analyticsService.logEvent('product-add-save-success');
            this.exitPage();
        });
    }

    async exitPage() {
        if (this.fromSearch) {
            await this.navCtrl.pop();
        } else {
            await this.navCtrl.popOnly();
        }
        this.navCtrl.publish('reloadProductList');
        this.navCtrl.publish('reloadProductSelector');
        this.navCtrl.publish('reloadProduct', this.product);
        if (this.isNew && !this.fromSearch) {
            await this.navCtrl.navigateForward('/product/detail', { id: this.product.id });
        }
    }

    async addImage(idx: number): Promise<void> {
        if (!this.fileToUploads || !this.fileToUploads.length) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.uploadDisabled = true;
        let id = idx;
        for (const fileToUpload of this.fileToUploads) {
            await this.dataService.uploadPicture(fileToUpload).then((message) => {
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

    async takePicture(): Promise<void> {
        this.analyticsService.logEvent('product-add-take-picture');
        await this.addImage(-1);
    }

    async browsePicture(): Promise<void> {
        this.analyticsService.logEvent('product-add-browse-picture');
        await this.addImage(-1);
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

    async changePicture(idx: number): Promise<void> {
        await this.addImage(idx);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('product-add-scanbarcode');
        if (this.navCtrl.isNotCordova()) {
            const r = Math.random().toString(36).substring(7);
            this.product.barcode = r;
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.product.barcode = barcodeData.text;
        });
    }

    autoGenBarcode(): void {
        const r = Math.random().toString(36).substring(7);
        this.product.barcode = r;
    }

    barcodeFocus(): void {
        setTimeout(() => {
            this.barcodeInput.setFocus();
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

    async changeIsOption() {
        if (this.product.isOption) {
            this.analyticsService.logEvent('product-add-set-is-option');
        }
    }

    async viewAttributes() {
        this.navCtrl.push('/product/attribute', { callback: () => { }, productId: this.product.id });
    }

    async viewTypes() {
        this.navCtrl.push('/product/type', { callback: () => { }, productId: this.product.id, product: this.product });
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
        const materials = product.materialsJson ? JSON.parse(product.materialsJson) : null;
        const item: any = {};
        item.price = product.price;
        item.productId = product.id;
        item.productCode = product.code;
        item.productName = product.title;
        item.productAvatar = product.avatarUrl;
        item.unit = product.unit;
        item.count = product.count;
        item.isExpand = false;
        item.options = product.options;
        item.attributes = product.attributes;
        item.materials = materials;

        this.product.items.unshift(item);
        const mess = this.translateService.instant('product-add.added-combo-product',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
    }

    async scanItem(): Promise<void> {
        this.analyticsService.logEvent('product-add-scan-barcode-for-combo-product');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.analyticsService.logEvent('home-scan-for-order-scanned-web');
                this.productService.searchByBarcode(data.barcode).then(async (product: IProduct) => {
                    this.analyticsService.logEvent('product-add-scan-barcode-for-combo-ok');
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
                this.analyticsService.logEvent('product-add-scan-barcode-for-combo-ok');
                this.addProduct(product);
            });
        });
    }

    async addProduct(product: any): Promise<void> {
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

            const materials = product.materialsJson ? JSON.parse(product.materialsJson) : null;
            const item: any = {};
            item.price = product.price;
            item.productId = product.id;
            item.productCode = product.code;
            item.productName = product.title;
            item.productAvatar = product.avatarUrl;
            item.unit = product.unit;
            item.count = product.count;
            item.isExpand = false;
            item.options = product.options;
            item.attributes = product.attributes;
            item.materials = materials;
            this.product.items.unshift(item);

            const mess = this.translateService.instant('product-add.added-combo-product',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
        }
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

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    async barcodeChanged() {
        if (!this.product || !this.product.barcode || this.product.barcode.length < 5) {
            return;
        }
        this.analyticsService.logEvent('product-add-barcode-entered-for-combo');
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
        this.navCtrl.push('/product/barcode', { productId: this.product.id, callback: () => { } });
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
                        await this.exitPage();
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

    increaseUnit(unit) {
        if (!unit.count) {
            unit.count = 1;
            return;
        }
        unit.count++;
    }

    decreaseUnit(unit) {
        unit.count--;
        if (unit.count < 0) {
            unit.count = 0;
        }
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

            const productItem: any = {};
            productItem.price = product.price;
            productItem.productId = product.id;
            productItem.productCode = product.code;
            productItem.productName = product.title;
            productItem.productAvatar = product.avatarUrl;
            productItem.unit = product.unit;
            productItem.count = 1;
            productItem.isExpand = false;

            this.product.materials.unshift(productItem);
            const mess = this.translateService.instant('product-add.added-material',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
        }
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

        const productItem: any = {};
        productItem.price = product.price;
        productItem.productId = product.id;
        productItem.productCode = product.code;
        productItem.productName = product.title;
        productItem.productAvatar = product.avatarUrl;
        productItem.unit = product.unit;
        productItem.count = product.count;
        productItem.isExpand = false;

        this.product.materials.unshift(productItem);
        const mess = this.translateService.instant('product-add.added-material',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
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

    async removeMaterial(productItem: any): Promise<void> {
        const idx = this.product.materials.findIndex(item => item.productId === productItem.productId);
        if (idx >= 0) {
            this.product.materials.splice(idx, 1);
        }
        this.analyticsService.logEvent('product-add-remove-material');
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

    removeDate(): void {
        this.product.expiredAt = '';
    }
}
