import { Component } from '@angular/core';
import { ITicket } from '../../models/ticket.interface';
import { Ticket } from '../../models/ticket.model';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../providers/helper.service';
import { TicketService } from '../../providers/ticket.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'ticket-add',
    templateUrl: 'ticket-add.component.html',
})
export class TicketAddComponent {
    ticket: ITicket = new Ticket();

    constructor(
        public navCtrl: RouteHelperService,
        private translate: TranslateService,
        private ticketService: TicketService,
        private analyticsService: AnalyticsService
    ) {
    }
    
    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('ticket-add');
    }

    ngOnInit(): void {
        this.ticket = new Ticket();
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.ticketService.save(this.ticket).then(async () => {
            this.analyticsService.logEvent('ticket-add-save-success');
            await loading.dismiss();
            const message = this.translate.instant('ticket-add.done');
            alert(message);
            this.exitPage();
        });
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async exitPage() {
        await this.navCtrl.popOnly();
    }
}
