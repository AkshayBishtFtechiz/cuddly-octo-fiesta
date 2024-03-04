const BusinessWireSchema = require("../Schema/BusinessWireModel");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");
const cheerio = require("cheerio");
const axios = require("axios");

// BUSINESS WIRE API

exports.getAllBussinessWire = async (req, res) => {
  const { flag } = req.body;

  try {
    if (flag === true) {
      var law_firms = [];
      var getAllNewsFirm = await NewFirmsWireSchema.find();

      getAllNewsFirm?.forEach((response, index) => {
        law_firms.push(response.firmName);
      });
      var listed_firms = [...law_firms];
    } else {
      var law_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        "Grabar",
        "Hagens Berman",
        "Kessler Topaz",
        "Pomerantz",
        "Rigrodsky",
        "Schall",
        "Kaskela",
        "Glancy",
        "Levi & Korsinsky",
        "Rosen",
      ];

      var listed_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        "Grabar",
        "Hagens Berman",
        "Kessler Topaz",
        "Pomerantz",
        "Rigrodsky",
        "Schall",
        "Kaskela",
        "Glancy",
        "Levi & Korsinsky",
        "Rosen",
      ];
    }

    let firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const encodedFirm = encodeURI(firm);
      const businessWireUrl = `https://www.businesswire.com/portal/site/home/search/?searchType=all&searchTerm=${encodedFirm}&searchPage=1`;

      const response = await axios.get(businessWireUrl);
      const $ = cheerio.load(response.data);

      $(".bw-news-section li").each((index, element) => {
        const title = $(element).find("h3 a").text().trim();
        const date = $(element).find(".bw-news-meta time").text().trim();
        const link = $(element).find("h3 a").attr("href");
        const summary = $(element).find("p").text().trim();
        const thumb = $(element).find(".bw-news-thumbs a").attr("href");

        if (
          summary.includes("(NASDAQ:") ||
          summary.includes("(NYSE:") ||
          summary.includes("(OTCBB:")
        ) {
          const tickerMatch = summary.match(
            /\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/
          );
          const id = uuidv4();
          const tickerSymbol = tickerMatch ? tickerMatch[2].trim() : "";
          const tickerIssuer = summary.includes("(NASDAQ:")
            ? "NASDAQ"
            : summary.includes("(NYSE:")
            ? "NYSE"
            : summary.includes("(OTCBB:")
            ? "OTCBB"
            : "";

          if (tickerSymbol && tickerIssuer && thumb !== undefined) {
            firmData.push({
              firm: listed_firms[i],
              payload: {
                scrapId: id,
                tickerSymbol: tickerSymbol,
                firmIssuing: firm,
                serviceIssuedOn: "BusinessWire",
                dateTimeIssued: date,
                urlToRelease: link,
                tickerIssuer: tickerIssuer,
              },
            });
          }
        }
      });
    }

    // JSON OF NEW TICKER.

    // firmData.push({
    //   firm: "Berger Montague",
    //   payload: {
    //     scrapId: uuidv4(),
    //     tickerSymbol: "NEWTICKER", // NEW TICKER THAT COMES
    //     firmIssuing: "Berger Montague",
    //     serviceIssuedOn: "BusinessWire",
    //     dateTimeIssued: "January 23, 2024",
    //     urlToRelease:
    //       "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
    //     tickerIssuer: "NYSE",
    //   },
    // });

    // JSON OF TICKER ALREADY THAT EXISTS IN LAST 60 DAYS.

    // firmData.push({
    //   firm: "Levi & Korsinsky",
    //   payload: {
    //     scrapId: uuidv4(),
    //     tickerSymbol: "BTI", //TICKER ALREADY EXISTS
    //     firmIssuing: "Levi & Korsinsky",
    //     serviceIssuedOn: "BusinessWire",
    //     dateTimeIssued: "January 31, 2024",
    //     urlToRelease:
    //       "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
    //     tickerIssuer: "NASDAQ",
    //   },
    // });

    // Search news details 75 days before the current date and remove before 75 days news details

    try {
      const { targetDate, formattedTargetDate } = filterDays(75);
      const last75DaysData = firmData.filter((newsDetails) => {
        const allPRNewsDate = moment(
          newsDetails?.payload.dateTimeIssued,
          "MMMM DD, YYYY"
        );
        return targetDate < allPRNewsDate;
      });
      const getAllBusinessNews = await BusinessWireSchema.find();
      emailSent(
        req,
        res,
        getAllBusinessNews,
        last75DaysData,
        BusinessWireSchema,
        flag
      );
    } catch (error) {
      console.error("Error:", error);
      {
        flag !== true && res.status(500).send("Internal Server Error");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    {
      flag !== true && res.status(500).send("Internal Server Error");
    }
  }
};

// Delete BussinessWireNews

exports.deleteBussinessAll = async (req, res) => {
  BusinessWireSchema.deleteMany({})
    .then((data) => {
      data === null
        ? res.send({
            message: "News already deleted",
          })
        : res.send({
            message: "News deleted successfully",
          });
    })
    .catch((err) => {
      res.send(err);
    });
};
