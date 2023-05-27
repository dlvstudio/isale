import { GalleryComponent } from './../shared/gallery.component';
import { NotePicture } from './../../models/note-picture.model';
import { INotePicture } from './../../models/note-picture.interface';
import { Note } from './../../models/note.model';
import { INote } from './../../models/note.interface';
import { IContact } from './../../models/contact.interface';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { RouteHelperService } from '../../providers/route-helper.service';
import { IonSlides, ModalController, Platform, ActionSheetController } from '@ionic/angular';
import { NoteService } from '../../providers/note.service';
import { ContactService } from '../../providers/contact.service';
import { TranslateService } from '@ngx-translate/core';
import { DateTimeService } from '../../providers/datetime.service';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'note-add',
    templateUrl: 'note-add.component.html',
})
export class NoteAddComponent {
    @ViewChild('mySlider', { static: true }) slider: IonSlides;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    params: any = null;
    title = 'Thêm/Sửa ghi chú';
    contactSelected: IContact;
    note: INote = new Note();
    noteSegment = 'content';
    pictures: INotePicture[] = [];
    imageSize: number;
    storageDirectory = '';
    isInViewPictureMode = false;
    picturesToDelete: INotePicture[] = [];
    arr = [];
    lastSamplePictureId = 0;
    isNew = true;
    fileToUpload: any;
    uploadDisabled = false;

    constructor(
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private noteService: NoteService,
        private dataService: DataService,
        private camera: Camera,
        private file: File,
        private transfer: FileTransfer,
        private contactService: ContactService,
        private platform: Platform,
        private actionSheetController: ActionSheetController,
        private translateService: TranslateService,
        private analyticsService: AnalyticsService
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
        await this.analyticsService.setCurrentScreen('note-add');
    }

    async ngOnInit(): Promise<void> {
        this.note = new Note();
        let noteId = 0;
        let contactId = 0;
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data) {
            if (data.id) {
                noteId = data.id;
                this.isNew = false;
            } else if (data.contact) {
                contactId = +data.contact;
            }
        }

        if (noteId && noteId > 0) {
            const loading = await this.navCtrl.loading();
            this.noteService.get(noteId).then(async (note) => {
                await loading.dismiss();
                this.contactSelected = note.contact;
                this.note = note;
                this.noteService.getNotePicturesByNoteId(this.note.id).then((notePictures: INotePicture[]) => {
                    this.pictures = notePictures;
                    this.buildPictureGrid();

                    if (this.note.content == '' && this.arr.length > 0) {
                        this.noteSegment = 'picture';
                    }
                });
            });
        } else {

            const arr = [];
            let row = [];
            for (const picture of this.pictures) {
                row.push(picture);
                if (row.length == 3) {
                    arr.push(row);
                    row = [];
                }
            }
            if (row.length > 0) {
                arr.push(row);
            }
            this.arr = arr;

            if (contactId && contactId > 0) {
                this.contactService.get(contactId).then((contact: IContact) => {
                    this.contactSelected = contact;
                    this.note.contactId = contact.id;
                });
            }
        }

    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.note.contactId = contact.id;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.noteService.saveNote(this.note).then(async (id) => {
            this.analyticsService.logEvent('note-add-save-success');
            const arr: Promise<any>[] = [];
            if (this.contactSelected && this.contactSelected.id !== 0) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            this.note.notePictures = this.pictures;
            const sn = this.noteService.saveNotePictures(this.note);
            arr.push(sn);
            if (this.picturesToDelete.length > 0) {
                const dl = this.noteService.deleteNotePictures(this.picturesToDelete);
                arr.push(dl);
            }
            Promise.all(arr).then(async () => {
                await loading.dismiss();
                this.exitPage();
            });
        });
    }

    saveLastActive(): Promise<number> {
        const action = 'note';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactNote', this.contactSelected.id);
            return result;
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        const filter = this.note.important
            ? 'important'
            : this.note.frequency
                ? 'frequency'
                : 'recent';
        this.navCtrl.publish('reloadNoteList', { filter });
        this.navCtrl.publish('reloadNote', this.note);
        if (this.isNew) {
            await this.navCtrl.push('/note/detail', { id: this.note.id });
        }
    }

    rememberFile($event): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture();
    }

    addImage(picture: INotePicture, isCapture: boolean): void {
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.uploadDisabled = true;
        this.dataService.uploadPicture(this.fileToUpload).then((message) => {
            if (message && message.url) {
                this.doAdd(message.url, picture);
            } else if (message && message.error) {
                alert(this.translateService.instant(message.error));
                this.uploadDisabled = false;
            }
        }).catch((err) => {
            console.error(err);
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            this.uploadDisabled = false;
        });
    }

    downloadImage(imageId: string, imageLocation: string, picture: INotePicture) {
        this.platform.ready().then(async () => {
            const fileTransfer = this.transfer.create();
            const loading = await this.navCtrl.loading();
            fileTransfer.download(imageLocation, this.storageDirectory + imageId).then(async (entry) => {
                this.doAdd(entry.toURL(), picture);
                await loading.dismiss();
            }, async (error) => {
                await loading.dismiss();
            });
        });
    }

    doAdd(url: string, picture: INotePicture): void {
        picture.imageUrl = url;
        this.pictures.push(picture);
        this.buildPictureGrid();
        this.refreshAvatar();
        this.uploadDisabled = false;
        this.fileToUpload = null;
        this.fileUploadInput.nativeElement.value = null;
    }

    refreshAvatar(): void {
        if (this.pictures && this.pictures.length > 0) {
            this.note.avatarUrl = this.pictures[0].imageUrl;
        } else {
            this.note.avatarUrl = null;
        }
    }

    async takePicture(): Promise<void> {
        this.analyticsService.logEvent('note-add-take-piture');
        const picture = new NotePicture();
        this.addImage(picture, true);
    }

    async browsePicture(): Promise<void> {
        this.analyticsService.logEvent('note-add-browse-piture');
        const picture = new NotePicture();
        this.addImage(picture, false);
    }

    async showImage(picture: INotePicture): Promise<void> {
        const i = this.pictures.findIndex(item => item.id == picture.id);
        const images = this.pictures.map(item => item.imageUrl);
        const modal = await this.modalCtrl.create({
            component: GalleryComponent,
            componentProps: { images, id: i, canDelete: true }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data && data.idsToDelete) {
            const idsToDelete: any[] = data.idsToDelete;
            for (const id of idsToDelete) {
                this.removePicture(id);
            }
        }
    }

    closeViewPicture(): void {
        this.isInViewPictureMode = false;
    }

    buildPictureGrid(): void {
        const arr = [];
        let row = [];
        for (const picture of this.pictures) {
            row.push(picture);
            if (row.length == 3) {
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
        const picture: INotePicture = this.pictures[i];
        if (picture.id != 0) {
            this.picturesToDelete.push(picture);
        }
        this.pictures.splice(i, 1);

        this.buildPictureGrid();

        this.refreshAvatar();
    }

    changePicture(picture: INotePicture): void {
        this.addImage(picture, false);
    }

    removeContact(): void {
        this.contactSelected = null;
        this.note.contactId = 0;
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
        const picture = new NotePicture();
        const options: CameraOptions = {
            quality: 100,
            sourceType,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE
        };
        this.uploadDisabled = true;
        this.camera.getPicture(options).then(async (imageData) => {
            const base64Image = imageData;
            const loading = await this.navCtrl.loading();
            this.dataService.uploadPictureBase64(base64Image).then(async (message) => {
                await loading.dismiss();
                if (message && message.url) {
                    this.doAdd(message.url, picture);
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
}