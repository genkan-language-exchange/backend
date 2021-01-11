const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');

const app = express();

// security
app.use(helmet());

// 1) GLOBAL MIDDLEWARE
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// request rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 1000 * 60 * 60,
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

// 3) ROUTES
app.use('/api/v1/users', userRouter);

// route fallback
app.all('*', (req, res, next) => {
  const errMessage = `${req.originalUrl} is not defined`;
  // express assumes that any argument in next() is an error
  next(new AppError(errMessage, 404));
});

// error catching
app.use(globalErrorHandler);

module.exports = app;
