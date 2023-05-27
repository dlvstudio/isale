import { Component, Input } from '@angular/core';

@Component({
    selector: 'category-add',
    templateUrl: 'category-add.component.html',
})
export class CategoryAddComponent {
    @Input() table = 'store';
    @Input() fieldsList = ['title'];
    @Input() validateFields = ['title'];
}