import { Component, ElementRef, ViewChild } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { Platform, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';


@Component({
    selector: 'contact-import',
    templateUrl: 'contact-import.component.html'
})
export class ContactImportComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    currency: string;
    fileToUpload: any;
    uploadDisabled = false;
    contactsImported: any[] = [];

    constructor(
        private userService: UserService,
        private excelService: ExcelService,
        public navCtrl: RouteHelperService,
        private alertCtrl: AlertController,
        private translateService: TranslateService,
        private analyticsService: AnalyticsService
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-import');
    }

    async downloadTemplate(): Promise<void> {
        this.analyticsService.logEvent('contact-import-download');
        const fileName = 'contact-template.xlsx';
        const loading = await this.navCtrl.loading();
        this.excelService.downloadContactsTemplate(fileName).then(async (url) => {
            this.analyticsService.logEvent('contact-import-download-successfully');
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

    rememberFile($event): void {
        this.fileToUpload = $event.target.files[0];
        this.uploadContacts();
    }

    async uploadContacts(): Promise<void> {
        this.analyticsService.logEvent('contact-import-upload');
        this.uploadDisabled = true;
        const loading = await this.navCtrl.loading();
        this.excelService.uploadContactsFile(this.fileToUpload, 0).then(async (message) => {
            this.analyticsService.logEvent('contact-import-upload-successfully');
            await loading.dismiss();
            if (message && message.count) {
                this.analyticsService.logEvent('contact-import-uploaded-success');
                this.contactsImported = message.contacts;
                this.navCtrl.publish('reloadContactList', null);
                alert(this.translateService.instant('contact-import.done'));
            } else if (message && message.error) {
                this.analyticsService.logEvent('contact-import-upload-failed');
                let err = message.error + '';
                err = err.replace('{', '').replace('}', '');
                const arr = err.split(':');
                err = '';
                if (arr.length >= 2) {
                    err = this.translateService.instant('contact-import.' + arr[0]) + arr[1];
                } else {
                    err = this.translateService.instant('contact-import.' + arr[0]);
                }
                alert(err);
            } else {
                this.analyticsService.logEvent('contact-import-upload-failed');
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            }
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        }).catch(async () => {
            await loading.dismiss();
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        });

    }
}
