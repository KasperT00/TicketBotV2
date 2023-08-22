# Instructions -
!! NOTE !! - This bot is only designed learning and educational purposes. It is not intended to be used in any harmful way, only as a way to learn. 

Locally start with "ng serve" in visual studio bash console, must have some like npm installed -> google this

Available in localhost:4200

1. Input Bearer token in form of "Bearer xyc...c" of course without the " marks.
    - From kide website -> F12 in chrome -> network -> some call -> Authorization
    - This will be stored to session storage so you will stay authorized. 
    - HOWEVER token expires, so you should give it every time again

2. input the url of the event

3. Give the number of tickets

4. Give the keyword

5. Press Start

6 IF something goes wrong, press stop, if this does not work, close bot by running CTRL + C in the cmd console

if keyword is not found, it will take the first ticket or other available
if maximum reservable amount is reached, bot will stop
Bot will stop resercing five seconds before event starts

More detailed under:

# TicketBotV2

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
