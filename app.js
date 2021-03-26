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
const roomRouter = require('./routes/roomRoutes');
const storyRouter = require('./routes/storyRoutes');

const app = express();

// security
app.use(helmet());

// global middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// request rate limiting
const limiter = rateLimit({
  max: 1000,
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
app.use(express.urlencoded({ extended: true }));

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
app.use((req, _, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/stories', storyRouter);

app.get('/', (req, res) => {
  res.status(200)
  .json({ data: req.session })
})

// route fallback
app.all('*', (req, _, next) => {
  const errMessage = `${req.originalUrl} is not defined`;
  // express assumes that any argument in next() is an error
  next(new AppError(errMessage, 404));
});

// error catching
app.use(globalErrorHandler);

module.exports = app;
