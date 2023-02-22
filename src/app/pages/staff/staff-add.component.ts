import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { Component } from '@angular/core';
import { IStaff } from '../../models/staff.interface';
import { Staff } from '../../models/staff.model';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { DataService } from '../../providers/data.service';
import { AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateTimeService } from '../../providers/datetime.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'staff-add',
    templateUrl: 'staff-add.component.html',
})
export class StaffAddComponent {
    params: any = null;
    gender = 'male';
    staff: IStaff;
    shop: any;
    storageDirectory = '';
    date: string;
    isNew = true;
    fromSearch = false;
    countStore = 0;
    storeSelected = null;
    shiftSelected = null;

    constructor(public navCtrl: RouteHelperService,
                private camera: Camera,
                private transfer: FileTransfer,
                private file: File,
                private staffService: StaffService,
                private dataService: DataService,
                private alertCtrl: AlertController,
                private storeService: StoreService,
                private translateService: TranslateService,
                private platform: Platform,
                private analyticsService: AnalyticsService,
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
        }, (err) => {
            alert(err);
            console.error(err);
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
        await this.analyticsService.setCurrentScreen('staff-add');
    }

    async ngOnInit(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.staff = new Staff();
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        this.shop = await this.dataService.getFirstObject('shop');
        this.countStore = await this.storeService.countStores();
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            this.staffService.get(id).then(async (staff) => {
                await loading.dismiss();
                this.staff = staff;
                this.staff.shopName = this.shop ? this.shop.name : '';
                this.storeSelected = this.staff && this.staff.store ? this.staff.store : null;
                this.shiftSelected = this.staff && this.staff.shift ? this.staff.shift : null;
            });
        } else {
            await loading.dismiss();
            this.staff.shopName = this.shop ? this.shop.name : '';
        }
    }

    validate() {
        if (!this.staff.name) {
            alert(this.translateService.instant('staff-add.no-name-alert'));
            return false;
        }
        if (!this.staff.userName) {
            alert(this.translateService.instant('staff-add.no-user-name-alert'));
            return false;
        }
        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        const loading = await this.navCtrl.loading();
        this.staffService.saveStaff(this.staff).then(async () => {
            this.analyticsService.logEvent('staff-add-save-success');
            await loading.dismiss();
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('staff-add.alert-new-staff') + this.staff.userName,
                buttons: ['OK']
            });
            await alert.present();
            this.exitPage();
        });
    }

    async exitPage() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
        this.navCtrl.publish('reloadStaffList');
        this.navCtrl.publish('reloadStaff', this.staff);
        if (this.isNew && !this.fromSearch) {
            await this.navCtrl.push('/staff/detail', { id: this.staff.id });
        }
    }

    takePicture(): void {
        if (!this.platform.is('capacitor')) {
            return;
        }
        this.camera.getPicture({
            destinationType: this.camera.DestinationType.FILE_URI,
            correctOrientation: true,
            saveToPhotoAlbum: false,
            sourceType: this.camera.PictureSourceType.CAMERA
        }).then((imageLocation) => {
            // imageData is a base64 encoded string
            const fileName = imageLocation.substr(imageLocation.lastIndexOf('/') + 1);
            const imageId = 'staff_image_' + fileName;

            this.downloadImage(imageId, imageLocation);
        }, (err) => {
            console.error(err);
        });
    }

    staffImageOrPlaceholder(): string {
        return this.staff.avatarUrl !== null && this.staff.avatarUrl !== ''
            ? this.staff.avatarUrl
            : 'assets/person-placeholder.jpg';
    }

    downloadImage(imageId: string, imageLocation: string) {
        this.platform.ready().then(async () => {
            const fileTransfer = this.transfer.create();
            const loading = await this.navCtrl.loading();
            fileTransfer.download(imageLocation, this.storageDirectory + imageId).then(async (entry) => {
                const url = entry.toURL();
                this.staff.avatarUrl = url;
                await loading.dismiss();
            }, async () => {
                await loading.dismiss();
            });
        });
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    browsePicture(): void {
        if (!this.platform.is('capacitor')) {
            return;
        }
        this.camera.getPicture({
            destinationType: this.camera.DestinationType.FILE_URI,
            correctOrientation: true,
            saveToPhotoAlbum: false,
            sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM
        }).then((imageLocation) => {
            // imageData is a base64 encoded string
            const fileName = imageLocation.substr(imageLocation.lastIndexOf('/') + 1);
            const imageId = 'staff_image_' + fileName;

            this.downloadImage(imageId, imageLocation);
        }, (err) => {
            console.error(err);
        });
    }

    async showSearchStore() {
        const callback = (data) => {
            const store = data;
            if (store) {
                this.storeSelected = store;
                this.staff.storeId = store.id;
            }
        };
        this.navCtrl.push('/store/search', { callback });
    }

    removeStore(): void {
        this.storeSelected = null;
        this.staff.storeId = 0;
    }

    async showSearchShift() {
        const callback = (data) => {
            const shift = data;
            if (shift) {
                this.shiftSelected = shift;
                this.staff.shiftId = shift.id;
            }
        };
        this.navCtrl.push('/staff/shift-search', { callback, fromSearch: this.fromSearch });
    }

    removeShift(): void {
        this.shiftSelected = null;
        this.staff.shiftId = 0;
    }
}
