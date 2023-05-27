import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';

@Component({
    selector: 'tip',
    templateUrl: 'tip.component.html'
})
export class TipComponent {

    content: string;
    contents = [
        'tip.tip1',
        'tip.tip2',
        'tip.tip3',
        'tip.tip4',
        'tip.tip5',
        'tip.tip6',
        'tip.tip7',
        'tip.tip8',
        'tip.tip9',
        'tip.tip10',
        'tip.tip11',
        'tip.tip12',
    ];

    intervalId;

    constructor(
        public navCtrl: RouteHelperService
    ) {
    }

    ngOnInit() {
        this.doInterval();
        this.intervalId = setInterval(
            () => {
                this.doInterval();
            },
            12000
        );
    }

    ngOnDestroy() {
        clearInterval(this.intervalId);
    }

    doInterval = () => {
        this.content = this.contents[Math.floor(Math.random() * this.contents.length)];
    }
}
