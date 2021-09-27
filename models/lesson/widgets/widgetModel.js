const mongoose = require('mongoose')

const widgetSchema = new mongoose.Schema({
  createdBy: String,
  forLesson: String,
},
{
  discriminatorKey: "type"
}
)

const Widget = mongoose.model('Widget', widgetSchema)

module.exports = Widget