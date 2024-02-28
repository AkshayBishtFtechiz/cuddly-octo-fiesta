const mongoose = require("mongoose");

const PRNewsWireSchema = new mongoose.Schema({
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

module.exports = mongoose.model("pr-news-wire", PRNewsWireSchema);
