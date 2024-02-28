const mongoose = require("mongoose");

const NewsFileSchema = new mongoose.Schema({
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

module.exports = mongoose.model("news-files", NewsFileSchema);