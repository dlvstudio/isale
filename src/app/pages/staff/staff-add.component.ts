import { Component, Input } from '@angular/core';

@Component({
    selector: 'staff-add',
    templateUrl: 'staff-add.component.html',
})
export class StaffAddComponent {
    @Input() table = 'staff';
    @Input() fieldsList = ['name', 'userName', 'storeId', 'shiftId', 'isCollaborator', 'avatarUrl', 'hasFullAccess', 'canCreateOrder', 'hourLimit', 'canUpdateDeleteOrder', 'updateStatusExceptDone', 'canCreateUpdateDebt', 'canCreateUpdateNote', 'canViewProductCostPrice', 'canUpdateProductCostPrice', 'canCreateNewTransaction', 'canUpdateDeleteTransaction', 'canViewAllContacts', 'canManageContacts', 'blockViewingQuantity', 'blockEditingOrderPrice']
    @Input() validateFields = ['name', 'userName'];
    @Input() fieldInstructions = {
        storeId: {
            lookup: "store",
            lookupField: "name"
        },
        shiftId: {
            lookup: "shift",
            lookupField: "name"
        },
        hourLimit: {
            type: 'number',
            depend: 'canCreateOrder'
        },
        avatarUrl: {
            type: 'image'
        },
        isCollaborator: {
            type: 'toggle',
        },
        hasFullAccess: {
            type: 'toggle',
        },
        canCreateOrder: {
            type: 'toggle',
        },
        canUpdateDeleteOrder: {
            type: 'toggle',
        },
        updateStatusExceptDone: {
            type: 'toggle',
        },
        canCreateUpdateDebt: {
            type: 'toggle',
        },
        canCreateUpdateNote: {
            type: 'toggle',
        },
        canViewProductCostPrice: {
            type: 'toggle',
        },
        canUpdateProductCostPrice: {
            type: 'toggle',
        },
        canCreateNewTransaction: {
            type: 'toggle',
        },
        canUpdateDeleteTransaction: {
            type: 'toggle',
        },
        canViewAllContacts: {
            type: 'toggle',
        },
        canManageContacts: {
            type: 'toggle',
        },
        blockViewingQuantity: {
            type: 'toggle',
        },
        blockEditingOrderPrice: {
            type: 'toggle',
        }
    }
}
