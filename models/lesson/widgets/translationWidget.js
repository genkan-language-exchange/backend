const mongoose = require('mongoose')
const Widget = require('./widgetModel')

const translationSchema = new mongoose.Schema({
  content: [
    {
      main: String,
      target: String,
    },
  ],
},
{
  discriminatorKey: 'type'
})

const TranslationWidget = Widget.discriminator('TranslationWidget', translationSchema)

module.exports = TranslationWidget