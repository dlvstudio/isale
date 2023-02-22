
import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { UserService } from '../../../providers/user.service';
import { ExcelService } from '../../../providers/excel.service';
import { Platform, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../../providers/analytics.service';
import { StoreService } from '../../../providers/store.service';
import { StaffService } from '../../../providers/staff.service';

@Component({
    selector: 'transfer-note-import',
    templateUrl: 'transfer-note-import.component.html'
})
export class TransferNoteImportComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    currency: string;
    fileToUpload: any;
    uploadDisabled = false;
    receivedNotesImported: any[] = [];
    isMobile = true;
    store: any;
    checkStore;
    selectedStaff;

    constructor(
        private userService: UserService,
        private excelService: ExcelService,
        public navCtrl: RouteHelperService,
        private platform: Platform,
        private alertCtrl: AlertController,
        private translateService: TranslateService,
        private storeService: StoreService,
        private staffService: StaffService,
        private analyticsService: AnalyticsService
        ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('received-note-import');
    }

    async ngOnInit(): Promise<void> {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        await this.reload();
    }

    async reload() {
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
    }

    async downloadTemplate(): Promise<void> {
        this.analyticsService.logEvent('received-note-import-download');
        const fileName = 'received-note-template.xlsx';
        this.excelService.downloadReceivedNoteTemplate(fileName).then(async (url) => {
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
        this.uploadNote();
    }

    async uploadNote(): Promise<void> {
        this.analyticsService.logEvent('received-note-import-upload');
        this.uploadDisabled = true;
        const loading = await this.navCtrl.loading(60000);
        this.excelService.uploadReceivedNoteFile(this.fileToUpload, !this.store ? null : this.store.id).then(async (message) => {
            await loading.dismiss();
            if (message && message.id) {
                this.analyticsService.logEvent('received-note-import-uploaded-success');
                this.navCtrl.pop();
                this.navCtrl.publish('reloadReceivedNoteList', null);
                setTimeout(() => {
                    this.navCtrl.push('/received-note/detail', { id: message.id });
                }, 100);
                return;
            } else if (message && message.error) {
                this.analyticsService.logEvent('received-note-import-error');
                let err = message.error + '';
                err = err.replace('{', '').replace('}', '');
                const arr = err.split(':');
                err = '';
                if (arr.length >= 2) {
                    err = this.translateService.instant('received-note-import.' + arr[0]) + arr[1];
                } else {
                    err = this.translateService.instant('received-note-import.' + arr[0]);
                }
                alert(err);
            } else {
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
        })
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
}
