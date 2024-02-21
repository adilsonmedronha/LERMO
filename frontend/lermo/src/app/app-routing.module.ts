import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { BoardComponent } from './board/board.component';
import { StandardPageComponent } from './standard-page/standard-page.component';
import { ViewerComponent } from './viewer/viewer.component';
import { NotSupportedPageComponent } from './not-supported-page/not-supported-page.component';

const routes: Routes = [
  { path: '', component: ViewerComponent},
  // { path: '', component: ViewerComponent},
  // { path: 'video', component: ViewerComponent },
  { path: 'not-supported', component: NotSupportedPageComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 

  
}
