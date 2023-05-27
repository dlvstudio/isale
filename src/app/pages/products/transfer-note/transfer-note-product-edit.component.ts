import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ITransferNoteItem } from '../../../models/transfer-note-item.interface';
import { AnalyticsService } from '../../../providers/analytics.service';
import { Helper } from '../../../providers/helper.service';
import { RouteHelperService } from '../../../providers/route-helper.service';

@Component({
    selector: 'transfer-note-product-edit',
    templateUrl: 'transfer-note-product-edit.component.html'
})
export class TransferNoteProductEditComponent {
    @Input() product: ITransferNoteItem;
    @Input() currency: any;
    @Input() foreignCurrency: any;

    constructor(
        private viewCtrl: ModalController,
        private analyticsService: AnalyticsService,
        private translate: TranslateService,
        public navCtrl: RouteHelperService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('transfer-note-product-edit');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    reload = () => {
        this.reCalc();
    }

    reCalc(): void {
        const netTotal = this.product.actualExport * this.product.unitPrice;
        const discount = this.product.discountType === 0 ? this.product.discount * 1 : (netTotal * this.product.discount / 100);
        this.product.amount = netTotal - discount;
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    validate() {
        if (!this.product.actualImport) {
            alert(this.translate.instant('transfer-note.no-actual-import-alert'));
            return false;
        }
        if (!this.product.actualExport) {
            alert(this.translate.instant('transfer-note.no-actual-export-alert'));
            return false;
        }
        if (this.product.discount === null || this.product.discount === undefined) {
            alert(this.translate.instant('transfer-note.no-discount-alert'));
            return false;
        }
        if (!this.product.productId && !this.product.productCode) {
            alert(this.translate.instant('transfer-note.no-code-alert'));
            return false;
        }
        if (!this.product.productName) {
            alert(this.translate.instant('transfer-note.no-name-alert'));
            return false;
        }
        if (!this.product.unitPrice) {
            alert(this.translate.instant('transfer-note.no-price-alert'));
            return false;
        }
        return true;
    }

    ok(): void {
        if (!this.validate()) {
            return;
        }
        this.viewCtrl.dismiss(this.product);
    }

    increase() {
        this.product.actualExport++;
        this.product.actualImport++;
        this.reCalc();
    }

    decrease() {
        if (this.product.actualExport > 0) {
            this.product.actualExport--;
        }
        if (this.product.actualImport > 0) {
            this.product.actualImport--;
        }
        this.reCalc();
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }
}
