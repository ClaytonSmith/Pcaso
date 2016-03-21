# Pcaso


## Getting Started 

### Installation


> curl -sL https://deb.nodesource.com/setup | sudo bash -

> sudo apt-get install git nodejs mongodb build-essential npm build-essential libssl-dev libgd2-xpm-dev

Set nodejs to node
> sudo ln -s /usr/bin/nodejs /usr/bin/node

install nvm
> curl https://raw.githubusercontent.com/creationix/nvm/v0.16.1/install.sh | sh

> nvm install v5.4.1

set node v5.4.1 as server default
> nvm alias default v5.4.1

clone repo
> git clone https://github.com/claytonsmith/pcaso
> cd pcaso

install app dependencies 
> npm install

When running on a server, install forever to keep the server alive forever
> npm install -g forever

### Setup 
configure the app's secrets in `config/secrets.js`

```
'use strict'

module.exports = {
	
	// User session key
	sessionKey: "Your secret session key.",

	// Email login
	emailCredentials: {

	    // required
	    'no-reply': {
	       user: "no-reply@domain.com",
	       pass: "no-reply's password"

	    },

	    // Optional others
	    'other-auto-email-accounts': {
	       user: "account-name@domain.com",
	       pass: "account-name's password"
	    }
}
```

in `config/auth.js`, add oauth credentials
```
'use strict'                                                                                                                            

// expose our config directly to our application using module.exports                                                                                                                                      
module.exports = {
    googleAuth: {
        clientID: "YOUR CLIENT ID",
        clientSecret: "YOUR CLIENT SECRET",

        // If you change the callback url path, make sure to change the route in `app/routs.js`
        callbackURL: "http://YOUR-DOMAIN/auth/google/callback"
    }
    
    // Additional auth stuff goes here too
};

```

### Setup dev and production environments. 

If you wish to run this app on another domain or just another server, you must reconfigure the domain settings for the app. 
In  `config/env/`, the files `test.js`, `development.js`, and `test.js` can be found. These files inform the app what domain to use for a given environment 'test', 'prod', 'dev' ( default ). To configure Pcaso for your own domain or test machine, set the development or production domain to match the machine you are using.

Example: 

For local testing and deployment I might set `config/env/development` to:
```
module.exports = {
    db: 'mongodb://localhost/pcaso', 
    service: {
	domain: 'http://127.0.0.1:8080/',
	api: 'http://127.0.0.1:8080/api/'
    }
}
```



### Testing

> make test

### Starting the server

> nohup forever start -c "node --harmony_proxies" server.js &

OR

> node --harmony_proxies" server.js


By default, the server will run on port 8080. 


Setting environment variables:
> NODE_ENV=production NODE_COOL_ENVAR=awesome node --harmony_proxies" server.js



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
- [X] Statistics
  - [X] File "view" count
- [X] Garbage collection
  - [X] Comments 
  - [x] Files
  - [X] User
- [ ] Test - Needs updating
  - [X] Unit tests 
    - [X] User accounts
    - [X] Email services
    - [X] File management	
    - [X] Comments
  - [X] Integration 
    - [X] User accounts
    - [X] File management	
    - [X] Comments
    - [X] Garbage collection
  - [ ] E2E
    - [ ] API
