const mongoose = require('mongoose')
const Widget = require('./widgetModel')

const textSchema = new mongoose.Schema({
  content: [String],
  textAlign: {
    type: String,
    enum: ['left', 'center', 'right', 'justify'],
    default: 'left',
  }
},
{
  discriminatorKey: 'type'
})

const TextWidget = Widget.discriminator('TextWidget', textSchema)

module.exports = TextWidget