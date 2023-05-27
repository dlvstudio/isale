import { Component, Input } from '@angular/core';

@Component({
    selector: 'money-account-add',
    templateUrl: 'money-account-add.component.html',
})
export class MoneyAccountAddComponent {
    @Input() table = 'money_account';
    @Input() fieldsList = ['accountName', 'total', 'isDefault', 'bankName', 'bankAccountName', 'bankNumber'];
    @Input() validateFields = ['accountName'];
    @Input() fieldInstructions = {
        total: {
            type: 'money'
        },
        isDefault: {
            type: 'toggle',
        }
    }
}
