import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FbPageRoutingModule } from './fb-page-routing.module';
import { FbPageComponent } from './fb-page.component';
import { FbPageDetailComponent } from './fb-page-detail.component';
import { FbMessageComponent } from './fb-message.component';
import { FbNotificationsComponent } from './fb-notifications.component';
import { FbCommentComponent } from './fb-comment.component';
import { FbAutoReplyComponent } from './fb-auto-reply-config.component';
import { FbAutoReplyAddComponent } from './fb-auto-reply-config-add.component';
import { FbLiveCommentComponent } from './fb-live-comment.component';
import { FbAutoOrderComponent } from './fb-auto-order.component';
import { FbAutoOrderAddComponent } from './fb-auto-order-add.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FbPageRoutingModule,
    SharedModule,
    FontAwesomeModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [FbPageComponent, FbPageDetailComponent, FbMessageComponent, FbNotificationsComponent, FbCommentComponent, FbAutoReplyComponent, FbAutoReplyAddComponent, FbLiveCommentComponent, FbAutoOrderComponent, FbAutoOrderAddComponent]
})
export class FbPageModule {}
