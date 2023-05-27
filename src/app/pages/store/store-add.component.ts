import { Component, Input } from '@angular/core';

@Component({
    selector: 'store-add',
    templateUrl: 'store-add.component.html',
})
export class StoreAddComponent {
    @Input() table = 'store';
    @Input() fieldsList = ['id', 'name', 'email', 'phone', 'address', 'moneyAccountId', 'bankName', 'bankAccountName', 'bankAccountNumber', 'iconUrl'];
    @Input() validateFields = ['name'];
    @Input() fieldInstructions = {
        id: {
            disabled: true
        },
        email: {
            type: 'email'
        },
        phone: {
            type: 'tel'
        },
        moneyAccountId: {
            lookup: 'money_account',
            lookupField: 'accountName',
            onchange: 'store change money account'
        },
        iconUrl: {
            type: 'image',
        }
    }
    @Input() functionsMap = {
        'store change money account': `
            () => {
                const moneyAccount = this.fieldInstructions['moneyAccountId'].lookupObject;
                this.object.bankName = moneyAccount ? moneyAccount.bankName : null;
                this.object.bankAccountName = moneyAccount ? moneyAccount.bankAccountName : null;
                this.object.bankAccountNumber = moneyAccount ? moneyAccount.bankNumber : null;
            }
        `
    }
}
