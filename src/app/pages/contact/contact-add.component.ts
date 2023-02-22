import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { Contact } from './../../models/contact.model';
import { IContact } from './../../models/contact.interface';
import { Component, ViewChild, ElementRef } from '@angular/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ContactService } from '../../providers/contact.service';
import { TranslateService } from '@ngx-translate/core';
import { NoteService } from '../../providers/note.service';
import { StaffService } from '../../providers/staff.service';
import { Platform, ActionSheetController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'contact-add',
    templateUrl: 'contact-add.component.html',
})
export class ContactAddComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    gender = 'male';
    params: any = null;
    contact: IContact;
    storageDirectory = '';
    date: string;
    isNew = true;
    fromSearch = false;
    saveDisabled = false;
    fileToUpload: any;
    uploadDisabled = false;
    staffSelected;
    businessTypeSelected;
    salesLineSelected;

    constructor(public navCtrl: RouteHelperService,
                private camera: Camera,
                private file: File,
                private transfer: FileTransfer,
                private contactService: ContactService,
                private translateService: TranslateService,
                private noteService: NoteService,
                public staffService: StaffService,
                private actionSheetController: ActionSheetController,
                private platform: Platform,
                private analyticsService: AnalyticsService
    ) {
        this.platform.ready().then(() => {
            // make sure this is on a device, not an emulation (e.g. chrome tools device mode)
            if (!this.platform.is('capacitor')) {
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
        await this.analyticsService.setCurrentScreen('contact-add');
    }

    async ngOnInit(): Promise<void> {
        this.contact = new Contact();
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            const loading = await this.navCtrl.loading();
            await this.contactService.get(id).then(async (contact) => {
                await loading.dismiss();
                this.contact = contact;
                this.staffSelected = contact.staff;
                this.businessTypeSelected = contact.businessType;
                this.salesLineSelected = contact.salesLine;
            });
        } else {
            if (this.params && this.params.number) {
                this.contact.mobile = this.params.number;
            }
            if (this.params && this.params.cachedName) {
                this.contact.fullName = this.params.cachedName;
            }
        }
        if (this.params && this.params.flow) {
            this.contact.fullName = this.params.flow.fromUserName;
            this.contact.fbUserId = this.params.flow.fromUserId;
            this.contact.source = 'Facebook';
        }
        if (this.params && this.params.fbcomment) {
            this.contact.fullName = this.params.fbcomment.fromUserName;
            this.contact.fbUserId = this.params.fbcomment.fromUserId;
            this.contact.mobile = this.params.fbcomment.phone ? this.params.fbcomment.phone : '';
            this.contact.source = 'Facebook';
        }
        if (this.params && this.params.phone) {
            this.contact.mobile = this.params.phone;
            this.contact.source = 'Facebook';
        }
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.saveDisabled = true;
        if (this.staffService.isStaff() && this.contact.staffId === 0) {
            this.contact.staffId = this.staffService.selectedStaff.id;
        }
        this.contactService.saveContact(this.contact).then(async () => {
            this.analyticsService.logEvent('contact-add-save-success');
            await loading.dismiss();
            this.exitPage();
        });
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
        const filter = this.contact.isImportant
            ? 'important'
            : 'all';
        this.navCtrl.publish('reloadContactList', { filter });
        this.navCtrl.publish('reloadContact', this.contact);
        if (this.isNew && !this.fromSearch) {
            await this.navCtrl.push('/contact/detail', { id: this.contact.id });
        }
    }

    async takePicture(): Promise<void> {
        this.analyticsService.logEvent('contact-add-take-avatar');
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
            const imageId = 'contact_image_' + fileName;

            this.downloadImage(imageId, imageLocation);
        }, (err) => {
            console.error(err);
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.contact.avatarUrl);
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

    removeDate(): void {
        this.contact.dateOfBirth = '';
    }

    rememberFile($event): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture();
    }

    async browsePicture(): Promise<void> {
        this.analyticsService.logEvent('contact-add-browse-avatar');
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.uploadDisabled = true;
        this.noteService.uploadPicture(this.fileToUpload).then((message) => {
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

    async upload() {
        this.analyticsService.logEvent('contact-add-upload-avatar');
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
            this.noteService.uploadPictureBase64(base64Image).then(async (message) => {
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

    removePhoto() {
        this.contact.avatarUrl = null;
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
        this.navCtrl.push('/staff/search', { callback });
    }

    removeStaff(): void {
        this.staffSelected = null;
        this.contact.staffId = 0;
    }

    async changePhone() {
        if (!this.contact.mobile) {
            return;
        }
        const contact = await this.contactService.searchContactByPhone(this.contact.mobile);
        if (contact && contact.id !== this.contact.id) {
            const mess = this.translateService.instant('contact-add.found-phone', {contact: contact.fullName, mobile: contact.mobile});
            alert(mess);
        }
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
        this.navCtrl.push('/contact/search-business-type', { callback });
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
        this.navCtrl.push('/contact/search-sales-line', { callback });
    }

    removeSalesLine(): void {
        this.salesLineSelected = null;
        this.contact.salesLineId = 0;
    }

    removeBusinessType(): void {
        this.businessTypeSelected = null;
        this.contact.businessTypeId = 0;
    }
}
