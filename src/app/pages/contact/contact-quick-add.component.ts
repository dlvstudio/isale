import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { Contact } from '../../models/contact.model';
import { IContact } from '../../models/contact.interface';
import { Component, ViewChild, ElementRef } from '@angular/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ContactService } from '../../providers/contact.service';
import { TranslateService } from '@ngx-translate/core';
import { StaffService } from '../../providers/staff.service';
import { Platform, ActionSheetController, ToastController, AlertController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'contact-quick-add',
    templateUrl: 'contact-quick-add.component.html'
})
export class ContactQuickAddComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    gender = 'male';
    params: any = null;
    contact: IContact;
    storageDirectory = '';
    date: string;
    isNew = true;
    saveDisabled = false;
    fileToUpload: any;
    uploadDisabled = false;
    contactsAdded: IContact[] = [];
    isExtend = false;
    isMobile = false;
    addCount = 0;
    staffSelected;
    businessTypeSelected;
    salesLineSelected;

    constructor(public navCtrl: RouteHelperService,
                private camera: Camera,
                private file: File,
                private transfer: FileTransfer,
                private contactService: ContactService,
                private translateService: TranslateService,
                private dataService: DataService,
                public staffService: StaffService,
                private actionSheetController: ActionSheetController,
                public platform: Platform,
                private toastCtrl: ToastController,
                private analyticsService: AnalyticsService,
                private alertCtrl: AlertController,
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
        });
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-quick-add');
    }

    ngOnInit(): void {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.contact = new Contact();
        this.contact.dateOfBirth = moment(new Date()).format(DateTimeService.getDbFormat());
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            this.contactService.get(id).then((contact) => {
                this.contact = contact;
            });
        } else {
            if (this.params && this.params.number) {
                this.contact.mobile = this.params.number;
            }
            if (this.params && this.params.cachedName) {
                this.contact.fullName = this.params.cachedName;
            }
        }
    }

    async save(onToolbar: boolean, cont: boolean): Promise<void> {
        if (this.saveDisabled) {
            return;
        }
        if (!this.contact.fullName) {
            alert(this.translateService.instant('contact-add.no-fullname-alert'));
            return;
        }
        this.analyticsService.logEvent('contact-quick-add-save-' + (onToolbar ? 'on-toolbar' : 'on-page'));
        this.saveDisabled = true;
        if (this.staffService.isStaff() && this.contact.staffId === 0) {
            this.contact.staffId = this.staffService.selectedStaff.id;
        }
        const loading = await this.navCtrl.loading();
        this.contactService.saveContact(this.contact).then(async () => {
            this.analyticsService.logEvent('contact-quick-add-save-success');
            const oldContact = JSON.parse(JSON.stringify(this.contact));
            this.contactsAdded.unshift(oldContact);
            const mess = this.translateService.instant('contact-add.added-contact',
                { contact: oldContact.fullName });
            await this.presentToast(mess);
            this.contact = new Contact();
            this.contact.dateOfBirth = moment(new Date()).format(DateTimeService.getDbFormat());
            const filter = this.contact.isImportant
                ? 'important'
                : 'all';
            this.navCtrl.publish('reloadContactList', { filter });
            this.saveDisabled = false;
            await loading.dismiss();

            if (this.addCount > 0) {
                this.analyticsService.logEvent('product-quick-add-save-multi');
            }

            if (cont && this.addCount > 0) {
                return;
            }
            this.addCount++;

            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('contact-add.continue-or-close',
                { contact: oldContact.fullName }),
                buttons: [
                    {
                        text: this.translateService.instant('contact-add.finish-adding'),
                        handler: () => {
                            this.navCtrl.back();
                        }
                    },
                    {
                        text: this.translateService.instant('contact-add.continue-to-add'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
        }).catch(async () => {
            await loading.dismiss();
            this.saveDisabled = false;
        });
    }

    takePicture(): void {
        if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
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
            const imageId = 'contact_image_' + fileName;

            this.downloadImage(imageId, imageLocation);
        }, (err) => {
            console.error(err);
        });
    }

    contactImageOrPlaceholder(contact): string {
        return contact ? Helper.contactImageOrPlaceholder(contact.avatarUrl) : './assets/person-placeholder.jpg';
    }

    downloadImage(imageId: string, imageLocation: string) {
        this.platform.ready().then(async () => {
            const fileTransfer = this.transfer.create();
            const loading = await this.navCtrl.loading();
            fileTransfer.download(imageLocation, this.storageDirectory + imageId).then(async (entry) => {
                const url = entry.toURL();
                this.contact.avatarUrl = url;
                await loading.dismiss();
            }, async () => {
                await loading.dismiss();
            });
        });
    }

    showDatePopup(): void {
        this.contact.dateOfBirth = moment().startOf('day').format('YYYY-MM-DD');
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    async presentToast(message: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'top'
        });
        await toast.present();
    }

    removeDate(): void {
        this.contact.dateOfBirth = '';
    }

    rememberFile($event): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture();
    }

    browsePicture(): void {
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.uploadDisabled = true;
        this.dataService.uploadPicture(this.fileToUpload).then((message) => {
            if (message && message.url) {
                this.contact.avatarUrl = message.url;
            } else if (message && message.error) {
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            }
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        }).catch(() => {
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        });
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
        this.uploadDisabled = true;
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
            this.dataService.uploadPictureBase64(base64Image).then(async (message) => {
                await loading.dismiss();
                if (message && message.url) {
                    this.contact.avatarUrl = message.url;
                    this.uploadDisabled = false;
                    this.fileToUpload = null;
                    this.fileUploadInput.nativeElement.value = null;
                } else if (message && message.error) {
                    alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                }
                this.uploadDisabled = false;
            }).catch(async (err) => {
                await loading.dismiss();
                console.error(err);
            });
        });
    }

    async showSearchStaff() {
        this.analyticsService.logEvent('contact-add-search-staff');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.staffSelected = staff;
                this.contact.staffId = staff.id;
            }
        };
        this.navCtrl.push('/staff', { callback, searchMode: true });
    }

    async showBusinessTypes() {
        this.analyticsService.logEvent('contact-add-search-business-type');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.businessTypeSelected = staff;
                this.contact.businessTypeId = staff.id;
            }
        };
        this.navCtrl.push('/business-type', { callback, searchMode: true });
    }

    async showSalesLines() {
        this.analyticsService.logEvent('contact-add-search-sales-line');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.salesLineSelected = staff;
                this.contact.salesLineId = staff.id;
            }
        };
        this.navCtrl.push('/sales-line', { callback, searchMode: true });
    }

    removeStaff(): void {
        this.staffSelected = null;
        this.contact.staffId = 0;
    }

    removeSalesLine(): void {
        this.salesLineSelected = null;
        this.contact.salesLineId = 0;
    }

    removeBusinessType(): void {
        this.businessTypeSelected = null;
        this.contact.businessTypeId = 0;
    }

    async changePhone() {
        if (!this.contact.mobile) {
            return;
        }
        const contact = await this.contactService.searchContactByPhone(this.contact.mobile);
        if (contact) {
            const mess = this.translateService.instant('contact-add.found-phone', {contact: contact.fullName, mobile: contact.mobile});
            alert(mess);
        }
    }
}
