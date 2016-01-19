# Pcaso


## Getting Started 

### Installation

Pcaso is meant to run in a linux environment. Assuming [nodejs V5.3.0^](https://nodejs.org/en/download/package-manager/) has been installed, 

Run the following:
> git clone http://github.com/claytonsmith/pcaso

> cd pcaso

> npm install

### Starting the server
> npm start 

By default, the server will run on port 3000. If you wish to change the port number, be sure to change the auth paths in `config/auth`.

## Features

V1 Backend 

- [ ] User accounts 
  - [X] Login 
  - [X] Logout
  - [X] Sessions 
  - [ ] Alerts 
    - [ ] Email
    - [ ] In app
  - [X] Remove account
  - [X] Email authentication
    - [X] Unique registration link
    - [X] Email( verb ) registration link
- [X] Email service
  - [X] Able to end emails through Pcaso domain
  - [X] Email templating using EJS
    - [ ] Add more templates 
- [ ] File management
  - [X] File upload
  - [X] File download
  - [X] Privileged file viewing
  - [X] Bind files to user accounts 
  - [ ] Modify privacy settings
  - [ ] Pretty "bullet" URLs to files 
- [ ] Comments
  - [X] Bind comments to entities 
  - [ ] Remove comments - IN DEVELOPMENT
  - [ ] Edit comments?? - Maybe
- [ ] Statistics
  - [ ] File "view" count
  - [ ] Traffic
- [ ] Garbage collection
  - [ ] Comments
  - [ ] Files
  - [ ] User
- [ ] Test
  - [X] Unit tests 
    - [X] User accounts
    - [X] Email services
    - [X] File managment	
    - [X] Comments
  - System 
    - [ ] User accounts - In development
    - [ ] Email services
    - [ ] File managment	
    - [ ] Comments
    - [ ] Garbage collection - In development
    - [ ] API