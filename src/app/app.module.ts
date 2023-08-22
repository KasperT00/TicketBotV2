import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { BotComponent } from './bot/bot.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    BotComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [BotComponent]
})
export class AppModule { }
