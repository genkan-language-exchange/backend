const mongoose = require('mongoose')
const Widget = require('./widgetModel')

const tableSchema = new mongoose.Schema({
  content: {
    type: Array,
    default: [
      ["", ""],
      ["", ""],
    ]
  },
  hasHead: {
    type: Boolean,
    default: true,
  }
},
{
  discriminatorKey: 'type'
})

const TableWidget = Widget.discriminator('TableWidget', tableSchema)

module.exports = TableWidget