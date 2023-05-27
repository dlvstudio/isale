import { Component, ElementRef, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { TranslateService } from '@ngx-translate/core';
import { camelToKebab, snakeToKebabCase } from '../../providers/helper';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'form-image, [form-image]',
    templateUrl: 'form-image.component.html',
})
export class FormImageComponent {
    @ViewChild('template', { static: true }) template;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    @Input() table = '';
    @Input() object: any = {};
    @Input() field = '';
    @Input() fieldsList = [];
    @Input() fieldInstructions = {}
    fileToUpload: any;
    params: any = null;
    tableKebab;

    constructor(
        private viewContainerRef: ViewContainerRef,
        public navCtrl: RouteHelperService,
        private dataService: DataService,
        private actionSheetController: ActionSheetController,
        private translateService: TranslateService,
        private camera: Camera,
    ) {
    }

    camelToKebab(str: string): string {
        return camelToKebab(str);
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.tableKebab = snakeToKebabCase(this.table);
        this.viewContainerRef.createEmbeddedView(this.template);
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
            this.dataService.uploadPictureBase64(base64Image).then(async (message) => {
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

    removePhoto() {
        this.object[this.field] = null;
    }

    uploadCallBack = (url) => {
        this.object[this.field] = url;
        this.fileToUpload = null;
        this.fileUploadInput.nativeElement.value = null;
    }

    rememberFile($event, callback): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture(callback);
    }

    imageOrPlaceholder(field): string {
        return Helper.contactImageOrPlaceholder(this.object[field]);
    }

    browsePicture(callback): void {
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.dataService.uploadPicture(this.fileToUpload).then((message) => {
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
