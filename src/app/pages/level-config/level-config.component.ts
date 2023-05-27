import { Component } from '@angular/core';

@Component({
    selector: 'level-config',
    templateUrl: 'level-config.component.html'
})
export class LevelConfigComponent {
    itemTemplateForLevelConfig = {
        h2: {
            field: 'title'
        },
        pList: [
            {
                short: 'point'
            },
            {
                short: 'buy-count'
            }
        ]
    };

    searchFieldsForLevelConfig = ['title'];
}
