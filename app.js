const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const bodyParser = require('body-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');

const userRouter = require('./routes/userRoutes');
const roomRouter = require('./routes/roomRoutes');

// passport config
require('./passport')(passport);

const app = express();

// security
app.use(helmet());

// global middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// request rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 1000 * 60 * 60, // 1 hour
  message: 'Too many requests.'
});
app.use('/api', limiter);

// cors
app.use(cors());

// body parser
app.use(express.json({
  limit: '8kb'
}));

// sanitize request data
// NoSQL injection
app.use(mongoSanitize());

// XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: []
  })
);

// add request time to request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

const dbOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
};

const connection = mongoose
  .connect(DB, dbOptions)
  .then(() => console.log('DB connection success'));

// session
const sessionStore = new MongoStore({
  mongooseConnect: connection,
  collection: 'sessions',
  url: DB,
});

const sessionConfig = {
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: process.env.COOKIE_AGE || 1000 * 60 * 60, // 1 hour for dev
  },
  name: 'session',
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET || 'keepitsecretkeepitsafe',
  store: sessionStore,
};

app.use(session(sessionConfig));

// passport
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/rooms', roomRouter);

app.get('/', (req, res) => {
  res.status(200)
  .json({ data: req.session })
})

// route fallback
app.all('*', (req, res, next) => {
  const errMessage = `${req.originalUrl} is not defined`;
  // express assumes that any argument in next() is an error
  next(new AppError(errMessage, 404));
});

// error catching
app.use(globalErrorHandler);

module.exports = app;
