/* eslint-disable no-bitwise */
import { Component, Input, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';
import { IonInput } from '@ionic/angular';

@Component({
    selector: 'money-input',
    templateUrl: 'money-input.component.html'
})
export class MoneyInputComponent {
    @ViewChild('template', { static: true }) template;
    @ViewChild('input1', { static: false }) input1: IonInput;
    @ViewChild('input2', { static: false }) input2: IonInput;
    @Input() moneyValue: any;
    @Input() placeholder: string;
    @Input() disabled: boolean;
    @Output() moneyValueChange = new EventEmitter();
    @Input() clear = false;
    moneyValueString;
    decimal = '.';
    thousands = ',';
    decimalCount = 2;
    changing = false;
    bottom;
    style;
    currentPopover;
    oldValue;

    constructor(
        private viewContainerRef: ViewContainerRef,
    ) {}

    async ngOnInit() {
        this.thousands = this.thousandsSeparator();
        this.decimal = this.thousands === '.' ? ',' : '.';
        setTimeout(() => {
            if (!this.moneyValue) {
                this.moneyValueString = this.moneyValue;
            } else {
                this.moneyValueString = this.formatMoney(this.moneyValue);
            }
        }, 1000);
        this.viewContainerRef.createEmbeddedView(this.template);
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

    change(newValue) {
        this.moneyValue = newValue;
        if (!newValue) {
            this.moneyValueString = newValue;
            this.oldValue = newValue;
        } else {
            this.moneyValueString = this.formatMoney(newValue);
            this.oldValue = this.moneyValueString;
        }
    }

    async ionFocus() {
    }

    ionBlur() {
        if (!this.moneyValueString) {
            this.moneyValue = this.moneyValueString;
            if (this.moneyValueString != this.oldValue) {
                this.moneyValueChange.emit(this.moneyValueString);
                this.oldValue = this.moneyValueString;
            }
        } else {
            let money = this.moneyValueString.split(this.decimal).join('');
            money = money.split(this.thousands).join(this.thousandsSeparator());
            this.moneyValue = +money;
            if (this.moneyValueString != this.oldValue) {
                this.moneyValueChange.emit(+money);
                this.oldValue = this.moneyValueString;
            }
        }
        this.moneyValueString = this.formatMoney(this.moneyValue);
        setTimeout(() => {
            this.changing = false;
        }, 300);
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
            const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')';
            const num = amount.toFixed(Math.max(0, ~~n));

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
        this.ionBlur();
    }

    async onEnter() {
        const input = this.input1 ? this.input1 : this.input2;
        if (!input) {
            return;
        }
        const elm = await input.getInputElement();
        if (!elm) {
            return;
        }
        elm.blur();
    }
}
