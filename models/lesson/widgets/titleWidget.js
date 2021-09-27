const mongoose = require('mongoose')
const Widget = require('./widgetModel')

const titleSchema = new mongoose.Schema({
  content: String,
},
{
  discriminatorKey: 'type'
})

const TitleWidget = Widget.discriminator('TitleWidget', titleSchema)

module.exports = TitleWidget