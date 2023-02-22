import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { NoteService } from '../../providers/note.service';
import { StoreService } from '../../providers/store.service';
import { IMoneyAccount } from '../../models/money-account.interface';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'store-add',
    templateUrl: 'store-add.component.html',
})
export class StoreAddComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    fileToUpload: any;
    params: any = null;
    store: any = {};
    fromSearch = false;
    saveDisabled = false;
    moneyAccountSelected: IMoneyAccount;

    constructor(
        public navCtrl: RouteHelperService,
        private storeService: StoreService,
        private analyticsService: AnalyticsService,
        private actionSheetController: ActionSheetController,
        private translateService: TranslateService,
        private camera: Camera,
        private noteService: NoteService,
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
        await this.analyticsService.setCurrentScreen('category-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.store = {};
        let storeId = 0;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id) {
            storeId = this.params.id;
        }

        if (storeId && storeId > 0) {
            this.storeService.getStore(storeId).then((store) => {
                this.store = store;
                if (this.store.moneyAccount) {
                    this.moneyAccountSelected = this.store.moneyAccount;
                }
            });
        }
    }

    async showSearchMoneyAccount() {
        this.analyticsService.logEvent('store-add-search-money-account');
        const callback = (data) => {
            const moneyAccount = data as IMoneyAccount;
            if (moneyAccount) {
                this.moneyAccountSelected = moneyAccount as IMoneyAccount;
                this.store.moneyAccountId = moneyAccount.id;
                this.store.bankName = this.moneyAccountSelected.bankName;
                this.store.bankAccountName = this.moneyAccountSelected.bankAccountName;
                this.store.bankAccountNumber = this.moneyAccountSelected.bankNumber;
            }
        };
        this.navCtrl.push('/money-account/search', { callback });
    }

    async save(): Promise<void> {
        if (!this.store || !this.store.name) {
            alert(this.translateService.instant('shop-add.no-name-alert'));
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.storeService.saveStore(this.store).then(async () => {
            this.analyticsService.logEvent('store-save-successfully');
            this.saveDisabled = false;
            await loading.dismiss();
            this.exitPage();
        }).catch(async () => {
            this.saveDisabled = false;
            await loading.dismiss();
        });
    }

    removeMoneyAccount(): void {
        this.moneyAccountSelected = null;
        this.store.moneyAccountId = 0;
        this.store.bankName = null;
        this.store.bankAccountName = null;
        this.store.bankAccountNumber = null;
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
        this.navCtrl.publish('reloadStoreList', null);
        this.navCtrl.publish('reloadStore', this.store);
    }

    async upload(callback) {
        const actionSheet = await this.actionSheetController.create({
            header: this.translateService.instant('common.select-image-source'),
            buttons: [{
                text: this.translateService.instant('common.load-from-gallery'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.PHOTOLIBRARY,
                        (url) => { callback(url); });
                }
            },
            {
                text: this.translateService.instant('common.use-camera'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.CAMERA,
                        (url) => { callback(url); });
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

    async doUpload(sourceType: number, callBack) {
        const options: CameraOptions = {
            quality: 100,
            sourceType,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE
        };
        this.camera.getPicture(options).then(async (imageData) => {
            const base64Image = imageData;
            const loading = await this.navCtrl.loading();
            this.noteService.uploadPictureBase64(base64Image).then(async (message) => {
                await loading.dismiss();
                if (message && message.url) {
                    callBack(message.url);
                } else if (message && message.error) {
                    alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                }
            }).catch(async (err) => {
                await loading.dismiss();
                console.error(err);
            });
        });
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    removeShopPhoto() {
        this.store.iconUrl = null;
    }

    uploadCallBack = (url) => {
        this.store.iconUrl = url;
        this.fileToUpload = null;
        this.fileUploadInput.nativeElement.value = null;
    }

    rememberFile($event, callback): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture(callback);
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.store.iconUrl);
    }

    browsePicture(callback): void {
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.noteService.uploadPicture(this.fileToUpload).then((message) => {
            if (message && message.url) {
                callback(message.url);
            } else if (message && message.error) {
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            }
        }).catch(() => {
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
        });
    }
}
