
import * as _ from 'lodash';
import { Component } from '@angular/core';
import { IReceivedNote } from '../../../models/received-note.interface';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { Platform, ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { ReceivedNoteService } from '../../../providers/received-note.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../providers/user.service';
import { ProductService } from '../../../providers/product.service';
import { ExcelService } from '../../../providers/excel.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { BarcodeInputComponent } from '../../shared/barcode-input.component';
import { IProduct } from '../../../models/product.interface';
import { AnalyticsService } from '../../../providers/analytics.service';
import { StoreService } from '../../../providers/store.service';
import { StaffService } from '../../../providers/staff.service';
import { TradeService } from '../../../providers/trade.service';

@Component({
    selector: 'received-note',
    templateUrl: 'received-note.component.html'
})
export class ReceivedNoteComponent {
    originalNotes: IReceivedNote[];
    notes: IReceivedNote[];
    searchKey = '';
    params: any = null;
    noteFilter = 'frequency';
    total = 0;
    dateFrom = '';
    dateTo = '';
    currency: string;
    isMobile = true;
    store: any;
    checkStore;
    selectedStaff;
    stores: any[];

    constructor(
        private platform: Platform,
        private receivedNoteService: ReceivedNoteService,
        public translateService: TranslateService,
        private userService: UserService,
        private productService: ProductService,
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private file: File,
        private barcodeScanner: BarcodeScanner,
        private excelService: ExcelService,
        private actionSheetCtrl: ActionSheetController,
        private storeService: StoreService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        public staffService: StaffService,
        private tradeService: TradeService,
    ) {
        this.navCtrl.unsubscribe('reloadReceivedNoteList', this.reload);
        this.navCtrl.subscribe('reloadReceivedNoteList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('received-note');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    async onPeriodChanged(data: any): Promise<void> {
        if (data) {
            const loading = await this.navCtrl.loading();
            if (data.dateFrom != '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo != '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.receivedNoteService.getNotes(this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (notes) => {
                const arr = [];
                if (notes && notes.length) {
                    for (const note of notes) {
                        note.items = JSON.parse(note.itemsJson);
                        note.store = !this.checkStore && note.storeId && this.stores && this.stores.length
                            ? this.stores.find(s => s.id == note.storeId)
                            : null;
                        arr.push(note);
                    }
                }
                this.originalNotes = JSON.parse(JSON.stringify(arr));
                this.notes = arr;
                this.total = _.sumBy(this.notes, (item: IReceivedNote) => item.total);
                this.filter();
                await loading.dismiss();
            });
        }
    }

    reload = async () => {
        this.isMobile = this.platform.width() < 720;
        this.currency = await this.userService.getAttr('current-currency');
        // this.dateFrom = '';
        // this.dateTo = '';
        this.params = this.navCtrl.getParams(this.params);
        this.stores = await this.storeService.getStores();
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
        if (this.params && this.params.dateFrom) {
            this.dateFrom = this.params.dateFrom;
        } else {
            this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
        }
        if (this.params && this.params.dateTo) {
            this.dateTo = this.params.dateTo;
        } else {
            this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
        }
        const loading = await this.navCtrl.loading();
        this.receivedNoteService.getNotes(this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (notes) => {
            await loading.dismiss();
            const arr = [];
            if (notes && notes.length) {
                for (const note of notes) {
                    note.items = JSON.parse(note.itemsJson);
                    note.store = !this.checkStore && note.storeId && this.stores && this.stores.length
                        ? this.stores.find(s => s.id === note.storeId)
                        : null;
                    arr.push(note);
                }
            }
            this.originalNotes = JSON.parse(JSON.stringify(arr));
            this.notes = arr;
            this.total = _.sumBy(this.notes, (item: IReceivedNote) => item.total);
            this.filter();
        });
    }

    openAdd(): void {
        this.navCtrl.push('/received-note/add');
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('received-note-search');
        let notes: IReceivedNote[] = JSON.parse(JSON.stringify(this.originalNotes));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            notes = notes.filter((item) => (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.id && item.id.toString().toLowerCase().indexOf(searchKey) !== -1)
                    || ('#' + item.id.toString() === searchKey)
                    || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.staff && item.staff.name && item.staff.name.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.staff && item.staff.userName && item.staff.userName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.store && item.store.name && item.store.name.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contactName && item.contactName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contactPhone && item.contactPhone.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.deliveryPerson && item.deliveryPerson.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.receiver && item.receiver.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.items && item.items.length
                        && item.items.filter(p => (p.productCode && p.productCode.toLowerCase().indexOf(searchKey) !== -1)
                                || (p.productName && p.productName.toLowerCase().indexOf(searchKey) !== -1)
                                || (p.note && p.note.toLowerCase().indexOf(searchKey) !== -1)).length > 0)
                    );
        }
        this.notes = notes;
        this.total = _.sumBy(this.notes, (item: IReceivedNote) => item.total);
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let notes: IReceivedNote[] = JSON.parse(JSON.stringify(this.originalNotes));
        notes = this.sortByModifiedAt(notes);
        this.notes = notes;
    }

    sortByModifiedAt(notes: IReceivedNote[]): IReceivedNote[] {
        if (notes) {
            return _.orderBy(notes, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    select(id: number): void {
        this.navCtrl.push('/received-note/detail', { id });
    }

    async deleteNote(note: IReceivedNote): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('received-note.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.deleteRelated(note);
                        this.receivedNoteService.delete(note).then(async () => {
                            this.analyticsService.logEvent('received-note-delete-success');
                            let i = this.notes.findIndex(item => item.id === note.id);
                            if (i >= 0) {
                                this.notes.splice(i, 1);
                                this.total = _.sumBy(this.notes, (item: IReceivedNote) => item.total);
                            }
                            i = this.originalNotes.findIndex(item => item.id === note.id);
                            if (i >= 0) {
                                this.originalNotes.splice(i, 1);
                            }
                        });
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

    async deleteRelated(note: IReceivedNote) {
        const arr = [];
        const tradesToDelete = await this.tradeService.getTradesByReceivedNote(note.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }
        const productNotesToDelete = await this.productService.getNotesByReceivedNote(note.id);
        for (const item of productNotesToDelete) {
            arr.push(this.productService.deleteProductNote(item));
        }
        await Promise.all(arr);
    }

    async presentOtherActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('export.export-to-excel'),
                    handler: () => {
                        this.exportExcel();
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    exportExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.received-note-report')]);
        if (this.dateFrom && this.dateTo) {
            const strFrom = this.translateService.instant('common.from');
            const strTo = this.translateService.instant('common.to');
            const str = strFrom + ' ' + this.dateFormat(this.dateFrom) + ' ' + strTo + ' ' + this.dateFormat(this.dateTo);
            data.push([str]);
        }
        data.push([
            this.translateService.instant('common.total') + ': ' +
            this.total + ' ' +
            this.currency
        ]);
        data.push([
            this.translateService.instant('export.receipt-code'),
            this.translateService.instant('export.contact'),
            this.translateService.instant('export.money'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const note of this.notes) {
            data.push([
                note.id,
                note.contactId !== 0 && note.contact ? note.contact.fullName : '',
                note.total,
                this.currency,
                this.dateFormat(note.createdAt)
            ]);
        }
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'received-note-report-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async (content) => {
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + this.file.externalDataDirectory + fileName,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFile(null, content);
        });
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateTimeString(date);
    }

    async presentActionSheet(note: IReceivedNote) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('received-note.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteNote(note);
                    }
                }, {
                    text: this.translateService.instant('received-note.edit'),
                    handler: () => {
                        this.select(note.id);
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    importNote(): void {
        this.navCtrl.push('/received-note/import');
    }

    async scan(): Promise<void> {
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.doEnteredBarcode(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.doEnteredBarcode(barcodeData.text);
        });
    }

    doEnteredBarcode = (barcode) => {
        if (!barcode) {
            return;
        }
        this.productService.searchByBarcode(barcode).then((product: IProduct) => {
            if (product) {
                this.navCtrl.push('/received-note/add', { product: product.id });
                return;
            }
        });
    }

    exportProductNotesReport(reportType: number): void {
        this.navCtrl.push('/product/export', { reportType });
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

    contactImageOrPlaceholder(contact: any): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl)
    }
}
