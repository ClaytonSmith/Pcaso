# Pcaso


## Getting Started 

### Installation

Pcaso is meant to run in a linux environment. Assuming [nodejs V5.4.1^](https://nodejs.org/en/download/package-manager/) has been installed, 

Run the following:
> git clone http://github.com/claytonsmith/pcaso

> cd pcaso

> npm install

### Starting the server
> npm start 

By default, the server will run on port 3000. If you wish to change the port number, be sure to change the auth paths in `config/auth`.

## Features

V1 Backend 

- [X] User accounts 
  - [X] Login 
  - [X] Logout
  - [X] Sessions 
  - [X] Google OAuth
  - [X] Alerts 
    - [X] Email - WIP
    - [X] In app
  - [X] Remove account
  - [X] Email authentication
    - [X] Unique registration link
    - [X] Email( verb ) registration link
- [X] Email service
  - [X] Able to end emails through Pcaso domain
  - [X] Email templating using EJS
    - [X] Add more templates - WIP
- [X] File management
  - [X] File upload
  - [X] File download
  - [X] Privileged file viewing
  - [X] Bind files to user accounts 
  - [X] Modify privacy settings
  - [X] Pretty "bullet" URLs to files 
- [X] Comments
  - [X] Bind comments to entities 
  - [X] Remove comments
  - [X] Edit comments
- [X] API for the above 
- [ ] Statistics
  - [X] File "view" count
  - [ ] Traffic - views per day...
- [X] Garbage collection
  - [X] Comments 
  - [x] Files
  - [X] User
- [ ] Test - Needs updating
  - [X] Unit tests 
    - [X] User accounts
    - [X] Email services
    - [X] File managment	
    - [X] Comments
  - [ ] Integration 
    - [X] User accounts
    - [X] File managment	
    - [X] Comments
    - [X] Garbage collection
  - [ ] E2E
    - [ ] API
