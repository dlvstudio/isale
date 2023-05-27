import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FbAutoOrderAddComponent } from './fb-auto-order-add.component';
import { FbAutoOrderComponent } from './fb-auto-order.component';
import { FbAutoReplyAddComponent } from './fb-auto-reply-config-add.component';
import { FbAutoReplyComponent } from './fb-auto-reply-config.component';
import { FbCommentComponent } from './fb-comment.component';
import { FbLiveCommentComponent } from './fb-live-comment.component';
import { FbMessageComponent } from './fb-message.component';
import { FbNotificationsComponent } from './fb-notifications.component';
import { FbPageDetailComponent } from './fb-page-detail.component';
import { FbPageComponent } from './fb-page.component';


const routes: Routes = [
  {
    path: '',
    component: FbPageComponent
  },
  {
    path: 'detail',
    component: FbPageDetailComponent
  },
  {
    path: 'messages',
    component: FbMessageComponent
  },
  {
    path: 'comments',
    component: FbCommentComponent
  },
  {
    path: 'notifications',
    component: FbNotificationsComponent
  },
  {
    path: 'auto-reply',
    component: FbAutoReplyComponent
  },
  {
    path: 'auto-reply-add',
    component: FbAutoReplyAddComponent
  },
  {
    path: 'search-page',
    component: FbPageComponent
  },
  {
    path: 'livestream',
    component: FbLiveCommentComponent
  },
  {
    path: 'auto-order',
    component: FbAutoOrderComponent
  },
  {
    path: 'auto-order-add',
    component: FbAutoOrderAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FbPageRoutingModule {}
