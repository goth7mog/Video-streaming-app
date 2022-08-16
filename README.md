# Video Streaming App

## Description
Node.js/Express app using the Stripe API to sell video views.
Currently developing an admin panel for it. 

### Version
1.0.0


## Usage

- git clone

### Installation

Install the dependencies

```sh
$ npm install
```

### Database

1) Install and then run MongoDB

```sh
$ sudo systemctl start mongod          (Ubuntu)
```

2) Create collection according to this schema (models/Content.js)

### Create .env in your root directory and define all these variables:

````
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
JWT_SEC
MONGO_URL
PORT

````

### Serve
To serve in the browser

```sh
$ npm start
```



### Author

Oleksandr Yurishchev
[Link](https://github.com/goth7mog)

