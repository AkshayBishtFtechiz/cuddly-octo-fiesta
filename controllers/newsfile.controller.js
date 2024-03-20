const axios = require("axios");
const cheerio = require("cheerio");
const NewsFileSchema = require("../Schema/NewsFileModel");
const moment = require("moment");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");

exports.getAllNewsFile = async (req, res) => {
  const { flag } = req.body;

  try {
    let law_firms = [];

    if (flag === true) {
      const getAllNewsFirm = await NewFirmsWireSchema.find();

      law_firms = getAllNewsFirm.map((response) => ({
        index: response.index,
        name: response.firmName,
        label: response.label,
      }));
    } else {
      law_firms = [
        { index: 7427, name: "Berger Montague", label: "Berger Montague" },
        {
          index: 6535,
          name: "Bernstein Liebhard",
          label: "Bernstein Liebhard",
        },
        {
          index: 7130,
          name: "Bronstein, Gewirtz",
          label: "Bronstein, Gewirtz",
        },
        { index: 6455, name: "Faruqi & Faruqi", label: "Faruqi & Faruqi" },
        { index: 8797, name: "Grabar", label: "Grabar" },
        { index: 7059, name: "Hagens Berman", label: "Hagens Berman" },
        { index: 7699, name: "Kessler Topaz", label: "Kessler Topaz" },
        { index: 7611, name: "Pomerantz", label: "Pomerantz" },
        { index: 8569, name: "Rigrodsky", label: "Rigrodsky" },
        { index: 6640, name: "Schall", label: "Schall" },
        { index: 7815, name: "Kaskela", label: "Kaskela" },
        { index: 9378, name: "Glancy", label: "Glancy" },
        { index: 7091, name: "Levi & Korsinsky", label: "Levi & Korsinsky" },
        { index: 7397, name: "Rosen", label: "Rosen" },
      ];
    }

    const firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const newsFilesUrl = `https://www.newsfilecorp.com/company/${firm.index}/${firm.name}`;
      const response = await axios.get(newsFilesUrl);
      const $ = cheerio.load(response.data);

      const newsItems = $(".latest-news.no-images li")
        .map((index, element) => {
          const $element = $(element);
          const title = $element
            .find("div.ln-description a.ln-title")
            .text()
            .trim();
          const date = $element
            .find("div.ln-description span.date")
            .text()
            .trim();
          const link = $element
            .find("div.ln-description a.ln-title")
            .attr("href");
          const summary = $element.find("div.ln-description p").text().trim();

          return {
            title,
            date,
            link,
            summary,
          };
        })
        .get();

      const payload = newsItems
        .filter((item) => {
          return (
            item.summary.includes("(NASDAQ:") ||
            item.summary.includes("(NYSE:") ||
            item.summary.includes("(OTCBB:")
          );
        })
        .map((newsItem) => {
          const tickerMatch = newsItem.summary.match(
            /\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/
          );
          const formattedDate = moment(newsItem.date, [
            "YYYY-MM-DD h:mm A Z",
          ]).format("MMMM DD, YYYY");
          const id = uuidv4();

          if (tickerMatch && tickerMatch[2].trim()) {
            return {
              scrapId: id,
              tickerSymbol: tickerMatch[2].trim(),
              firmIssuing: firm.label,
              serviceIssuedOn: "News File Corp", // Replace with actual service
              dateTimeIssued: formattedDate,
              urlToRelease: `https://www.newsfilecorp.com${newsItem.link}`,
              tickerIssuer: tickerMatch[1].toUpperCase(),
            };
          } else {
            return null;
          }
        })
        .filter(Boolean);

      for (const newsData of payload) {
        firmData.push({ firm: law_firms[i].label, payload: newsData });
      }
    }

    const { targetDate } = filterDays(75);
    const last75DaysData = firmData.filter((newsDetails) => {
      const allPRNewsDate = moment(
        newsDetails?.payload.dateTimeIssued,
        "MMMM DD, YYYY"
      );
      return targetDate < allPRNewsDate;
    });
    const getAllNewsFile = await NewsFileSchema.find();
    emailSent(req, res, getAllNewsFile, last75DaysData, NewsFileSchema, flag);
  } catch (error) {
    console.error("Error:", error);
    flag !== true && res.status(500).send("Internal Server Error");
  }
};

exports.deleteNewsFile = async (req, res) => {
  NewsFileSchema.deleteMany({})
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
