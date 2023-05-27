import { Component, Input } from '@angular/core';

@Component({
    selector: 'contact-add',
    templateUrl: 'contact-add.component.html',
})
export class ContactAddComponent {
    @Input() table = 'contact';
    @Input() fieldsList = ['code', 'fullName', 'mobile', 'gender', 'email', 'address', 'dateOfBirth', 'isImportant', 'staffId', 'businessTypeId', 'salesLineId', 'avatarUrl']
    @Input() validateFields = ['fullName'];
    @Input() fieldInstructions = {
        gender: {
            type: "gender",
        },
        avatarUrl: {
            type: "image",
        },
        dateOfBirth: {
            type: 'date',
        },
        isImportant: {
            type: 'toggle',
        },
        staffId: {
            lookup: 'staff',
            lookupField: 'name',
        },
        businessTypeId: {
            lookup: 'business_type',
            lookupField: 'title',
        },
        salesLineId: {
            lookup: 'sales_line',
            lookupField: 'title',
        }
    }
}
