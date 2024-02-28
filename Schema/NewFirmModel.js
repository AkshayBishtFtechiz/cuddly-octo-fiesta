const mongoose = require("mongoose");

const NewFirmsWireSchema = new mongoose.Schema({
  firmName: String,
  label: String,
  index: Number,
});

module.exports = mongoose.model("new-firm-wires-news", NewFirmsWireSchema);
