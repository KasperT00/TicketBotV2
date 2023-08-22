// Create basic constructors and imports
// Path: src\app\bot-component.ts
// import { Component, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// Goal for this component is to create a bot that can be used to reserve tickets. 
// The bot will first ask for the user's token that he/she has taken from the website.
// Bot will then save the token in local storage so that it can be used later on.
// It will then try to authorize with the token and if it is valid it will set authorized to true.
// There will also be a boolean to check if the bot is "running" or not.
// There will also be a variable to show the current console output of the bot.
// There will also be a variable to show the current time.
// There will also be a variable to show the current date.
// After this the bot will ask for the event url and the amount of tickets the user wants to reserve.
// A keywoard provided by the user will be used to check for a specific ticket and if no options are provided it will try to reserve the first ticket it finds.
// There will be a button where the user can start the process of reserving tickets.
// The bot will then check the event's time of release and will start the reserving of the tickets couple seconds before it starts.

// The reserving api works like this:
// Before the event starts this endpoint will not return the tickets: https://api.kide.app/api/products/xxx where the xxx is the event id.
// After the event starts this endpoint will return the tickets: https://api.kide.app/api/products/xxx where the xxx is the event id.
// After the bot receives a valid response from the endpoint which contains the event jsons, it will take the inventory id from event.model.variants[0].inventoryId and create payload and authorization headers to reserve the tickets:
/*const authHeaders = { headers: { 'Authorization': sessionStorage.getItem('token') } };
const payload = {
  toCreate: [
    {
      inventoryId: this.state.prod.model.variants[0].inventoryId,
      quantity: 1,
      productVariantUserForm: null
    }
  ],
  toCancel: []
};*/
// Then bot will try to then search for the keyword. Different events are in prod.model.variants and the name the keyworad is used is: prod.model.variants[i].name
// If the keyword is found, the bot will take the inventory id from prod.model.variants[i].inventoryId and create payload and authorization headers to reserve the tickets:
// it will try to reserve as many tickets as the user has provided in the input field by changing the quantity in the payload.
// Then it will create a post call similar to this: const { data } = await axios.post('https://api.kide.app/api/reservations', payload, authHeaders);
// This must be done as async function because the bot must wait for the response from the api.
// if the STOP button is pressed at any time, the bot will stop the process and will not reserve any tickets. Imports and constructors and code for the bot:
import { Injectable } from '@angular/core';
import axios, { AxiosResponse } from 'axios';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TicketBotService {
  private stopSignal$ = new Subject<void>();
    private status: number = 0;

  constructor() {
  }

  async fetchEventData(url: string): Promise<any> {
    var prodid = url.substring(url.lastIndexOf('/') + 1);
    return await axios.get('https://api.kide.app/api/products/'+prodid, { headers: { 'Authorization': sessionStorage.getItem('token') } });
  }

  reserveTickets(payload: any, authHeaders: any): Promise<any> {
    var reservationUrl = 'https://api.kide.app/api/reservations';
    return axios.post(reservationUrl, payload, authHeaders).then((resp) => {
        console.log("Response data from reservation: "+resp.data);
        this.status = resp.data.status;
        return {status: resp.status, data: resp.data};
    });
  }
}
