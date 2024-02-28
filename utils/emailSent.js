// const nodemailer = require("nodemailer");
// const { format, subDays } = require("date-fns");

// const emailSent = async (req, res, getAllNews, firmData, newsSchema, flag) => {
//   const processedTickerSymbols = new Set();

//   if (getAllNews.length === 0) {
//     // No previous news, save all firm data and respond
//     firmData.forEach(async function (data) {
//       const newResponse = data.payload;
//       const newNews = await new newsSchema({
//         firm: data.firm,
//         payload: newResponse,
//       });
//       newNews.save();
//     });
//     {
//       flag !== true && res.json(firmData);
//     }
//   } else if (getAllNews.length !== firmData.length) {
//     // Comparing ticker with previous 60 days ticker and send mail
//     firmData.forEach(async function (data) {
//       // If ticker symbol is not found in previous news, proceed
//       const newlyTickerDate = data.payload.dateTimeIssued;
//       const formattedDate = format(newlyTickerDate, "MMMM dd, yyyy");
//       const sixtyDaysBefore = subDays(formattedDate, 60);
//       const formattedDateSixtyDay = format(sixtyDaysBefore, "MMMM dd, yyyy");
//       const dateToCompare = new Date(formattedDateSixtyDay);
//       const newsWithinSixtyDays = getAllNews.filter(
//         (compareNews) =>
//           dateToCompare < new Date(compareNews.payload.dateTimeIssued)
//       );

//       if (
//         !newsWithinSixtyDays.some(
//           (compareSixtyNews) =>
//             compareSixtyNews.payload.tickerSymbol === data.payload.tickerSymbol
//         )
//       ) {
//         // If no news found for the ticker within 60 days, send email
//         if (!processedTickerSymbols.has(data.payload.tickerSymbol)) {
//           const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//               user: "blocklevitonalerts@gmail.com",
//               pass: "yrhc nqwl gmah odvp",
//             },
//             secure: false,
//             port: 25,
//             tls: {
//               rejectUnauthorized: false,
//             },
//           });

//           // Define the email options
//           const mailOptions = {
//             from: "blocklevitonalerts@gmail.com",
//             to: "akshay.bisht1@ftechiz.com", //client email: mailto:jake@blockleviton.com
//             subject: `Alert: First Press Release for ${data?.payload?.tickerSymbol}`,
//             html: `<p><span style='font-weight:bold;'>${data.firm}</span> issued a press release for <span style='font-weight:bold;'>${data?.payload?.tickerSymbol}</span>. This is the first press release observed for <span style='font-weight:bold;'>${data?.payload?.tickerSymbol}</span> in the past 60 days.<br/><br/>View the release here: ${data?.payload?.urlToRelease}.</p>`,
//           };

//           // Send the email
//           transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//               return console.error("Error:", error.message);
//             }
//           });
//           processedTickerSymbols.add(data.payload.tickerSymbol);
//         }
//       }

//       const newNews = new newsSchema({
//         firm: data.firm,
//         payload: data.payload,
//       });
//       newNews.save();
//     });

//     setTimeout(async () => {
//       const response = await newsSchema.find();
//       {
//         flag !== true && res.json(response);
//       }
//     }, 1000);
//   } else {
//     const response = await newsSchema.find();
//     {
//       flag !== true && res.send(response);
//     }
//   }
// };

// module.exports = emailSent;





const nodemailer = require("nodemailer");
const { format, subDays } = require("date-fns");

const emailSent = async (req, res, getAllNews, firmData, newsSchema, flag) => {
  const processedTickerSymbols = new Set();

  if (getAllNews.length === 0) {
    // No previous news, save all firm data and respond
    firmData.forEach(async function (data) {
      const newResponse = data.payload;
      const newNews = new newsSchema({
        firm: data.firm,
        payload: newResponse,
      });
      await newNews.save();
    });
    {
      flag !== true && res.json(firmData);
    }
  } else if (getAllNews.length !== firmData.length) {
    // Comparing ticker with previous 60 days ticker and send mail
    for (const data of firmData) {
      // If ticker symbol is not found in previous news, proceed
      const newlyTickerDate = data.payload.dateTimeIssued;
      const formattedDate = format(newlyTickerDate, "MMMM dd, yyyy");
      const sixtyDaysBefore = subDays(formattedDate, 60);
      const formattedDateSixtyDay = format(sixtyDaysBefore, "MMMM dd, yyyy");
      const dateToCompare = new Date(formattedDateSixtyDay);
      const newsWithinSixtyDays = getAllNews.filter(
        (compareNews) =>
          dateToCompare < new Date(compareNews.payload.dateTimeIssued)
      );

      if (
        !newsWithinSixtyDays.some(
          (compareSixtyNews) =>
            compareSixtyNews.payload.tickerSymbol === data.payload.tickerSymbol
        )
      ) {
        // Check if the ticker symbol exists in the database
        const existingNews = await newsSchema.findOne({
          "payload.tickerSymbol": data.payload.tickerSymbol
        });

        if (!existingNews || !processedTickerSymbols.has(data.payload.tickerSymbol)) {
          const newNews = new newsSchema({
            firm: data.firm,
            payload: data.payload,
          });
          await newNews.save();

          // If no news found for the ticker within 60 days and email not sent already, send email
          if (!processedTickerSymbols.has(data.payload.tickerSymbol)) {
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "blocklevitonalerts@gmail.com",
                pass: "yrhc nqwl gmah odvp",
              },
              secure: false,
              port: 25,
              tls: {
                rejectUnauthorized: false,
              },
            });

            // Define the email options
            const mailOptions = {
              from: "blocklevitonalerts@gmail.com",
              to: "akshay.bisht1@ftechiz.com",
              subject: `Alert: First Press Release for ${data?.payload?.tickerSymbol}`,
              html: `<p><span style='font-weight:bold;'>${data.firm}</span> issued a press release for <span style='font-weight:bold;'>${data?.payload?.tickerSymbol}</span>. This is the first press release observed for <span style='font-weight:bold;'>${data?.payload?.tickerSymbol}</span> in the past 60 days.<br/><br/>View the release here: ${data?.payload?.urlToRelease}.</p>`,
            };

            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                return console.error("Error:", error.message);
              }
            });
            processedTickerSymbols.add(data.payload.tickerSymbol);
          }
        }
      }
    }

    setTimeout(async () => {
      const response = await newsSchema.find();
      {
        flag !== true && res.json(response);
      }
    }, 1000);
  } else {
    const response = await newsSchema.find();
    {
      flag !== true && res.send(response);
    }
  }
};

module.exports = emailSent;
