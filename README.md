# Yelp Camp

[Capstone project for Colt Steele's 2023 Web Development Bootcamp](https://yelp-camp-213.fly.dev) deployed on Fly

## Frontend Technologies:

- EJS (View Template)
- Connect-flash (Flash messages)

## Backend Technologies:

- Node (Runtime environment)
- Express (Backend framework)
- MongoDB Atlas / Mongoose (Cloud database)
- Helmet (Security)
- Joi (Data validation)
- Passport (Authentication and Authorization)

## APIs

- [Mapbox](https://www.mapbox.com/) (Map API)
- [Cloudinary](https://cloudinary.com/) (Cloud media storage)

## Local development

Run a local MongoDB instance and create an ignored `.env` containing `DB_URL`,
`SECRET`, `MAPBOX_TOKEN`, and optionally `PORT` (defaults to 3000). Use a random
session secret and a public Mapbox token. Image uploads additionally require
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET`.

Run `npm ci` and `npm start`, then open the configured local port. Development
supports HTTP session cookies; set `NODE_ENV=production` behind HTTPS in deployment.

Run `npm test` for the isolated regression tests. Set `TEST_MONGO_URL` to a local
test database to also exercise encrypted session persistence. This test uses a
dedicated collection and removes its own temporary session.

The scoped `kruptein` override preserves compatibility with connect-mongo 5's
encrypted session format; newer 3.x releases deserialize the payload differently.
Keep the MongoDB round-trip test passing when upgrading the session store.

## Security

This a project for learning purposes only. The site delegates basic security measures to various modules. Passwords are salted and hashed with [Passport](https://www.passportjs.org/), but to be safe, **please do not register with real passwords.**
