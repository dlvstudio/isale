import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'order',
    loadChildren: () => import('./pages/order/order.module').then(m => m.OrderModule)
  },
  {
    path: 'quote',
    loadChildren: () => import('./pages/quote/quote.module').then(m => m.QuoteModule)
  },
  {
    path: 'online-order',
    loadChildren: () => import('./pages/online-order/online-order.module').then(m => m.OnlineOrderModule)
  },
  {
    path: 'product',
    loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsPageModule)
  },
  {
    path: 'received-note',
    loadChildren: () => import('./pages/products/received-note/received-note.module').then(m => m.ReceivedNoteModule)
  },
  {
    path: 'transfer-note',
    loadChildren: () => import('./pages/products/transfer-note/transfer-note.module').then(m => m.TransferNoteModule)
  },
  {
    path: 'trade-category',
    loadChildren: () => import('./pages/category/category.module').then(m => m.CategoryModule)
  },
  {
    path: 'debt',
    loadChildren: () => import('./pages/debt-management/debt.module').then(m => m.DebtManagementPageModule)
  },
  {
    path: 'contact',
    loadChildren: () => import('./pages/contact/contact.module').then(m => m.ContactModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterModule)
  },
  {
    path: 'logout',
    loadChildren: () => import('./pages/logout/logout.module').then( m => m.LogoutPageModule)
  },
  {
    path: 'config',
    loadChildren: () => import('./pages/config/config.module').then( m => m.ConfigModule)
  },
  {
    path: 'money-account',
    loadChildren: () => import('./pages/money-account/money-account.module').then( m => m.MoneyAccountModule)
  },
  {
    path: 'table',
    loadChildren: () => import('./pages/shop-table/shop-table.module').then( m => m.TableModule)
  },
  {
    path: 'calendar',
    loadChildren: () => import('./pages/calendar/calendar.module').then( m => m.CalendarModule)
  },
  {
    path: 'note',
    loadChildren: () => import('./pages/note/note.module').then( m => m.NoteModule)
  },
  {
    path: 'ticket',
    loadChildren: () => import('./pages/ticket/ticket.module').then( m => m.TicketModule)
  },
  {
    path: 'excel-report',
    loadChildren: () => import('./pages/excel-export/excel-report.module').then( m => m.ExcelReportModule)
  },
  {
    path: 'report',
    loadChildren: () => import('./pages/report/report.module').then( m => m.ReportModule)
  },
  {
    path: 'timely-report',
    loadChildren: () => import('./pages/report/timely/timely-report.module').then( m => m.TimelyReportModule)
  },
  {
    path: 'category-report',
    loadChildren: () => import('./pages/report/category-report.module').then( m => m.CategoryReportModule)
  },
  {
    path: 'debt-report',
    loadChildren: () => import('./pages/report/debt/debt-report.module').then( m => m.DebtReportModule)
  },
  {
    path: 'product-report',
    loadChildren: () => import('./pages/report/product/product-report.module').then( m => m.ProductReportModule)
  },
  {
    path: 'chart',
    loadChildren: () => import('./pages/report/chart/chart.module').then( m => m.ChartModule)
  },
  {
    path: 'staff',
    loadChildren: () => import('./pages/staff/staff.module').then( m => m.StaffModule)
  },
  {
    path: 'help',
    loadChildren: () => import('./pages/help/help.module').then( m => m.HelpModule)
  },
  {
    path: 'change-password',
    loadChildren: () => import('./pages/change-password/change-password.module').then( m => m.ChangePasswordModule)
  },
  {
    path: 'request-pro',
    loadChildren: () => import('./pages/request-pro/request-pro.module').then( m => m.RequestProModule)
  },
  {
    path: 'survey',
    loadChildren: () => import('./pages/survey/survey.module').then( m => m.SurveyModule)
  },
  {
    path: 'trade',
    loadChildren: () => import('./pages/transaction/trade.module').then( m => m.TradeModule)
  },
  {
    path: 'store',
    loadChildren: () => import('./pages/store/store.module').then( m => m.StoreModule)
  },
  {
    path: 'point-config',
    loadChildren: () => import('./pages/point/point.module').then( m => m.PointModule)
  },
  {
    path: 'promotion',
    loadChildren: () => import('./pages/promotion/promotion.module').then( m => m.PromotionModule)
  },
  {
    path: 'fbpage',
    loadChildren: () => import('./pages/fb-page/fb-page.module').then( m => m.FbPageModule)
  },
  {
    path: 'business-type',
    loadChildren: () => import('./pages/business-type/business-type.module').then( m => m.BusinessTypeModule)
  },
  {
    path: 'sales-line',
    loadChildren: () => import('./pages/sales-line/sales-line.module').then( m => m.SalesLineModule)
  },
  {
    path: 'shift',
    loadChildren: () => import('./pages/shift/shift.module').then( m => m.ShiftModule)
  },
  {
    path: 'level-config',
    loadChildren: () => import('./pages/level-config/level-config.module').then( m => m.LevelConfigModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
