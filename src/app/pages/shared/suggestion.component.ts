import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'suggestion',
    templateUrl: 'suggestion.component.html'
})
export class SuggestionComponent {
    @Input() moneyValueString: any;
    decimal = '.';
    thousands = ',';
    decimalCount = 2;
    barcode: any;

    constructor(
                private viewCtrl: ModalController) {
    }

    ngOnInit() {
        this.thousands = this.thousandsSeparator();
        this.decimal = this.thousands === '.' ? ',' : '.';
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    ok(): void {
        this.viewCtrl.dismiss({ barcode: this.barcode });
    }

    formatMoney(amount) {
        if (!amount) {
            return amount;
        }
        const n = this.decimalCount;
        const x = 3;
        const s = this.decimal;
        const c = this.thousands;
        try {
            const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
                num = amount.toFixed(Math.max(0, ~~n));

            let re2 = (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
            if (!re2) {
                return re2;
            }
            if (re2.indexOf(this.thousands + '00')) {
                re2 = re2.split(this.thousands + '00').join('');
            }
            return re2;

        } catch (e) {
            console.error(e)
        }
    };

    thousandsSeparator() {
        const str = parseFloat((0.55).toString()).toLocaleString();
        if (str.indexOf(',55') >= 0) {
            return ',';
        }
        return '.';
    }

    select(value) {
        this.moneyValueString = value;
    }

    getMoneyValueStringToNumber(moneyValueString) {
        if (!moneyValueString) {
            return moneyValueString;
        } else {
            let money = moneyValueString.split(this.decimal).join('');
            money = money.split(this.thousands).join(this.thousandsSeparator());
            return +money;
        }
    }
}
