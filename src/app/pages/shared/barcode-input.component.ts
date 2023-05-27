import { Component, ViewChild } from '@angular/core';
import { IonInput, ModalController } from '@ionic/angular';
import { ProductService } from '../../providers/product.service';

@Component({
    selector: 'barcode-input',
    templateUrl: 'barcode-input.component.html'
})
export class BarcodeInputComponent {
    @ViewChild('barcodeInput', { static: true }) barcodeInput: IonInput;
    barcode: any;

    constructor(
                private viewCtrl: ModalController,
                private productService: ProductService) {
    }

    ngOnInit() {
        this.barcodeFocus();
    }

    ionViewLoaded() {
        this.barcodeFocus();
    }

    barcodeFocus(): void {
        setTimeout(() => {
            this.barcodeInput.setFocus();
        }, 600);
    }

    barcodeChanged(): void {
        if (!this.barcode || this.barcode.length < 5) {
            return;
        }
        this.productService.searchByBarcode(this.barcode).then((product) => {
            if (!product) {
                return;
            }
            this.ok();
        });
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    ok(): void {
        this.viewCtrl.dismiss({ barcode: this.barcode });
    }
}
