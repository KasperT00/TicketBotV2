import { Component } from '@angular/core';
import { TicketBotService } from '../services/bot-service';
import { Axios } from 'axios';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-bot',
  templateUrl: './bot.component.html',
  styleUrls: ['./bot.component.css', '../../styles.css']
})

export class BotComponent {
  token = '';
  eventId = 0;
  eventName = '';
  eventDescriptionHTML = '';
  boolEventStarted = false;
  boolEventEnded = false;
  eventDateSalesFrom = new Date();
  eventUrl = '';

  ticketAmountWanted = 1;
  keyword: string = '';
  keyword2: string = '';
  andOr: string = 'AND';
  authorized = false;
  running = false;
  consoleOutput = '';
  botStatus = '';
  ticketAmountReserved = 0;

  constructor(private ticketBotService: TicketBotService) {
    this.ticketBotService = ticketBotService;
    this.loadToken();
   }

  loadToken(): void {
    const token = sessionStorage.getItem('token');
    this.token = token ? token : '';
    if (token) {
      this.authorized = true;
    }
  }

  setToken(): void {
    sessionStorage.setItem('token', this.token);
    this.authorized = true;
  }

  eventDescription(): string {
    return this.eventDescriptionHTML;
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  searchProduct(): void {
    if(this.eventUrl == '') {
      this.consoleOutput = 'No event URL given !!!';
      return;
    }
    var data = this.fetchEventData();
  }

  async fetchEventData(): Promise<any> {
    try {
      const fullData = await this.ticketBotService.fetchEventData(this.eventUrl);
      console.log(fullData);

      const data = fullData.data;
      console.log(data);
      this.eventId = data.model.product.id;
      this.eventName = data.model.product.name;
      this.eventDescriptionHTML = data.model.product.description;
      this.boolEventStarted = data.model.product.salesStarted;
      this.boolEventEnded = data.model.product.salesEnded;
      this.eventDateSalesFrom = new Date(data.model.product.dateSalesFrom);

      return data;
    } catch (error) {
      console.log("Error fetching event data - ",error);
      throw error;
    }
  }

  async startBot(): Promise<void> {
    // if authorized and url is given, start the bot
    if(!this.authorized || this.eventUrl == '') {
      this.consoleOutput = 'Not authorized or event url missing !!!';
      return;
    }

    const authHeaders = { headers: { 'Authorization': sessionStorage.getItem('token'), 'X-Requested-Token-C9': '' } };
    this.running = true;
    this.botStatus = 'Bot is running...';

    var eventDateAsTime = this.eventDateSalesFrom.getTime();
    var currentTime = new Date();
    while (this.running && currentTime.getTime() < (eventDateAsTime- 5000)) {
      var diff = eventDateAsTime - currentTime.getTime();
      var diffInHours = Math.floor(diff / 1000 / 60 / 60);
      diff -= diffInHours * 1000 * 60 * 60;
      var diffInMinutes = Math.floor(diff / 1000 / 60);
      diff -= diffInMinutes * 1000 * 60;
      var diffInSeconds = Math.floor(diff / 1000);
      this.consoleOutput = "Waiting for sales to start in: "+diffInHours+" hours, "+diffInMinutes+" minutes, "+diffInSeconds+" seconds";
      
      await this.sleep(2000);
      currentTime = new Date();
    }

    // Once the sales start, start the reservation process
    // Fetch the event data until the data includes the variants so that their length is > 0
    // after this reserve the tickets and increase the ticket amount by 1 until the wanted ticket amount is reached

    var data = await this.fetchEventData();
    // First fetch event data until the variants are available, sleep 10 ms between each fetch. Stop after trying a minute
    var maximumWait = 6000;
    while (this.running && data.model.variants.length == 0 && maximumWait > 0) {
      maximumWait--;
      await this.sleep(10);
      data = await this.fetchEventData();
      this.consoleOutput = 'Starting to fetch event data before it starts...';
      console.log("Fetching event data...");
    }

    if(data.model.variants.length == 0) {
      this.consoleOutput = 'No variants found, stopping bot after a minute...';
      this.running = false;
      this.botStatus = 'Bot stopped';
      return;
    }

    // search for the variant with the keyword
    var variantInventoryId = 0;
    var chosenVariant = 0;

    if(this.running && (this.keyword != '' || this.keyword2 != '')) {
      for(var i = 0; i < data.model.variants.length; i++) {
        var variantName = data.model.variants[i].name.toLowerCase();
        var availability = data.model.variants[i].availability;
        if(this.andOr == 'AND') {
          if(variantName.includes(this.keyword.toLowerCase()) && variantName.includes(this.keyword2.toLowerCase()) && availability > 0) {
            variantInventoryId = data.model.variants[i].inventoryId;
            chosenVariant = i;
            break;
          }
        }
        else if((variantName.includes(this.keyword.toLowerCase()) || variantName.includes(this.keyword2.toLowerCase())) && availability > 0) {
          variantInventoryId = data.model.variants[i].inventoryId;
          chosenVariant = i;
          break;
        }
      }
    }

    // Now that the variants are available, start reserving tickets
    // If variant with the keyword is found, reserve it, otherwise reserve the first variant
    // If the wanted ticket amount is reached, stop the bot
    // Run this maximum of 50 times
    var counter = 50;
    var counterToTryOneTicket = 0;
    while (this.running && this.ticketAmountReserved < this.ticketAmountWanted && counter > 0) {
      counter--;
      if(counter == 0) {
        this.consoleOutput = 'Maximum amount of tries reached, stopping bot...';
        this.running = false;
        this.botStatus = 'Bot stopped';
        break;
      }
      console.log("Reserving tickets...");
      this.consoleOutput = 'Reserving tickets...';
      // Now we either have a variant with the keyword or not
      // This is the case where we have a variant with the keyword
      if(variantInventoryId != 0) {
        if(this.ticketAmountReserved >= data.model.variants[chosenVariant].productVariantMaximumReservableQuantity) {
          this.consoleOutput = 'Maximum reservable quantity reached, stopping bot...'+this.ticketAmountReserved+' pcs';
          this.running = false;
          this.botStatus = 'Bot stopped';
          break;
        }
        const requestId = this.getRequestId(variantInventoryId.toString());

        // _Addd the x-requested-token-28 header to the authHeaders
        authHeaders.headers['X-Requested-Token-C9'] = requestId;

        this.consoleOutput = 'Reserving tickets base on keyword...';
        const payload = {
          toCreate: [
            {
              inventoryId: variantInventoryId,
              quantity: 1+this.ticketAmountReserved,
              productVariantUserForm: null
            }
          ],
          expectCart: true,
          includeDeliveryMethods: false,
          toCancel: []
        };

        try {
          const reservationData = await this.ticketBotService.reserveTickets(payload, authHeaders);
          if(reservationData.status == 200) {
            this.ticketAmountReserved++;
            this.consoleOutput = 'Ticket reserved, current amount: ' + this.ticketAmountReserved;
          }
          else if(reservationData.status == 401) {
            this.consoleOutput = 'Unauthorized, stopping bot...';
            this.running = false;
            this.botStatus = 'Bot stopped';
            break;
          }
          else {
            counterToTryOneTicket++;
            if(counterToTryOneTicket == 5) {
              counterToTryOneTicket = 0;
              variantInventoryId = 0;
            }
          }
        }
        catch (error) {
          console.log(error);
        }
      }
      
      // This is the case where we don't have a variant with the keyword
      else {
        var availableInevntoryId = 0;
        for(var i = 0; i < data.model.variants.length; i++) {
          var availability = data.model.variants[i].availability;
          if(availability > 0) {
            availableInevntoryId = data.model.variants[i].inventoryId;
            chosenVariant = i;
            break;
          }
        }

        if(this.ticketAmountReserved >= data.model.variants[chosenVariant].productVariantMaximumReservableQuantity) {
          this.consoleOutput = 'Maximum reservable quantity reached, stopping bot...'+this.ticketAmountReserved+' pcs';
          this.running = false;
          this.botStatus = 'Bot stopped';
          break;
        }
        var invId = availableInevntoryId!=0?availableInevntoryId : data.model.variants[0].inventoryId;
        authHeaders.headers['X-Requested-Token-C9'] = this.getRequestId(invId.toString());

        const payload = {
          toCreate: [
            {
              inventoryId: availableInevntoryId!=0?availableInevntoryId : data.model.variants[0].inventoryId,
              quantity: 1+this.ticketAmountReserved,
              productVariantUserForm: null
            }
          ],
          expectCart: true,
          includeDeliveryMethods: false,
          toCancel: []
        };
        try{
          const reservationData = await this.ticketBotService.reserveTickets(payload, authHeaders);
          if(reservationData.status == 200) {
            this.ticketAmountReserved++;
            this.consoleOutput = 'Ticket reserved, current amount: ' + this.ticketAmountReserved;
          }
          else if(reservationData.status == 401) {
            this.consoleOutput = 'Unauthorized, stopping bot...';
            this.running = false;
            this.botStatus = 'Bot stopped';
            break;
          }
          else {
            counterToTryOneTicket++;
            if(counterToTryOneTicket > 10) {
              break;
            }
          }
        }
        catch (error) {
          console.log(error);
        }
      }
    }

    // Once the bot's logic is done or stopped:
    this.running = false;
    this.botStatus = 'Bot stopped.';
  }

  stopBot(): void {
    this.running = false;
    this.botStatus = 'Bot stopped.';
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.authorized = false;
  }

  reverseString(str: string): string {
    return Array.from(str).reduce((a, e) => e + a);
  }

  getRequestId(inventoryId: string): string {
    const hash = 'ce7a72';
    return btoa(
      [...inventoryId.replace(/-/g, '')]
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ hash.charCodeAt(i))
        )
        .join('')
    ).substring(0, 8);
  }
}