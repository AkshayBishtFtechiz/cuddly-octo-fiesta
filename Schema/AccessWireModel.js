const mongoose = require("mongoose");

const AccessWireSchema = new mongoose.Schema({
  firm: String,
  payload: {
    scrapId: String,
    tickerSymbol: String,
    firmIssuing: String,
    serviceIssuedOn: String,
    dateTimeIssued: String,
    urlToRelease: String,
    tickerIssuer: String,
  }
});

module.exports = mongoose.model("access-wire", AccessWireSchema);