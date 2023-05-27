import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ContactService } from '../../../providers/contact.service';
import { UserService } from '../../../providers/user.service';
import { ExcelService } from '../../../providers/excel.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { AnalyticsService } from '../../../providers/analytics.service';
import { ProductService } from '../../../providers/product.service';
import { TransferNoteService } from '../../../providers/transfer-note.service';
import { StoreService } from '../../../providers/store.service';
import { DataService } from '../../../providers/data.service';
import { TradeService } from '../../../providers/trade.service';

@Component({
    selector: 'transfer-note-detail',
    templateUrl: 'transfer-note-detail.component.html',
})
export class TransferNoteDetailComponent {
    params: any = null;
    note: any = {};
    currency: string;
    isDisabled = false;
    tab = 'info';
    stores = [];
    mainStore;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private transferNoteService: TransferNoteService,
        private contactService: ContactService,
        private userService: UserService,
        private storeService: StoreService,
        private actionSheetCtrl: ActionSheetController,
        private excelService: ExcelService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private tradeService: TradeService,
        private productService: ProductService,
        private dataService: DataService
    ) {
        const reloadNoteHandle = (event) => {
            const note = event.detail;
            if (this.note && note.id === this.note.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadTransferNote', reloadNoteHandle);
        this.navCtrl.subscribe('reloadTransferNote', reloadNoteHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('transfer-note-detail');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.stores = await this.storeService.getStores();
        this.reload();
    }

    reload = async () => {
        this.currency = await this.userService.getAttr('current-currency');
        this.mainStore = await this.dataService.getFirstObject('shop');
        this.note = {};
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            const id = data.id;
            const loading = await this.navCtrl.loading();
            this.transferNoteService.get(id).then(async (note) => {
                this.note = note;
                this.mainStore.isMainShop = true;
                this.note.exportStore = this.note.exportStoreId && this.stores && this.stores.length
                    ? this.stores.find(s => s.id == this.note.exportStoreId)
                    : this.mainStore;
                this.note.importStore = this.note.importStoreId && this.stores && this.stores.length
                    ? this.stores.find(s => s.id == this.note.importStoreId)
                    : this.mainStore;
                if (!note) {
                    return;
                }
                this.note.items = note && note.itemsJson ? JSON.parse(note.itemsJson) : [];
                await loading.dismiss();
            });
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.note.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.note.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.note.contact.lastActive = DateTimeService.toDbString();
        this.note.contact.lastAction = action;
        return this.contactService.saveContact(this.note.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.note.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.note.contact.avatarUrl);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateTimeString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/transfer-note/add', { id: this.note.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('transfer-note.delete-transfer-note'),
                    role: 'destructive',
                    handler: () => {
                        this.delete();
                    }
                }, {
                    text: this.translateService.instant('transfer-note-detail.share'),
                    handler: () => {
                        this.share();
                    }
                }, {
                    text: this.translateService.instant('transfer-note-detail.print'),
                    handler: () => {
                        this.print();
                    }
                }, {
                    text: this.translateService.instant('transfer-note-detail.export'),
                    handler: () => {
                        this.export();
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

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('transfer-note.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.deleteRelated();
                        this.transferNoteService.delete(this.note).then(async () => {
                            this.analyticsService.logEvent('transfer-note-detail-delete-success');
                            this.navCtrl.publish('reloadTransferNoteList');
                            this.navCtrl.publish('reloadContact', this.note.contact);
                            this.navCtrl.pop();
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

    async deleteRelated() {
        const arr = [];
        const tradesToDelete = await this.tradeService.getTradesByTransferNote(this.note.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }
        const productNotesToDelete = await this.productService.getNotesByTransferNote(this.note.id);
        for (const item of productNotesToDelete) {
            arr.push(this.productService.deleteProductNote(item));
        }
        await Promise.all(arr);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    share(): void {
        this.navCtrl.push('/transfer-note/detail-share', { note: this.note });
    }

    print(): void {
        this.navCtrl.push('/transfer-note/detail-print', { note: this.note });
    }

    async export(): Promise<void> {
        const loading = await this.navCtrl.loading();
        const fileName = 'transfer-note-detail-' + this.note.id + '.xlsx';
        this.excelService.createTransferNoteFile(fileName, this.note.id).then(async (url) => {
            await loading.dismiss();
            this.analyticsService.logEvent('transfer-note-export-downloaded');
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
        }).catch(async () => {
            await loading.dismiss();
        });
    }
}
