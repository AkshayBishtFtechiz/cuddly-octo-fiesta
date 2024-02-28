const NewFirmsWireSchema = require("../Schema/NewFirmModel");

const prnewswire = require("./prnewswire.controller");

const accessWire = require("./accesswire.controller");

const businessWire = require("./bussinesswire.controller");

const globenewswire = require("./globenewswire.controller");

const newsfilewire = require("./newsfile.controller");

// Create NewFirmWireNews
exports.createNewFirmWire = async (req, res) => {
  const r = req.body;

  await NewFirmsWireSchema.find({
    $and: [{ firmName: r.firmName }, { index: r.index }],
  })
    .then(async (data) => {
      if (data.length > 0) {
        const getNewFirm = await NewFirmsWireSchema.find();
        res.send([
          {
            message: "Firm is already present!",
            newFirms: getNewFirm,
          },
        ]);
      } else {
        // Insert new firm in db
        NewFirmsWireSchema.create(r)
          .then(async (data) => {
            const getNewFirm = await NewFirmsWireSchema.find();

            accessWire.getAllAccessWire(req, res);
            businessWire.getAllBussinessWire(req, res);
            globenewswire.getAllGlobeNewsWire(req, res);
            newsfilewire.getAllNewsFile(req, res);
            prnewswire.getAllPRNewsWire(req, res);

            res.send(getNewFirm);
          })
          .catch((err) => {
            res.send(err);
          });
      }
    })
    .catch((err) => {
      res.send(err);
    });
};

// Get NewFirmsNew Details

exports.getNewFirmDetails = (req, res) => {
  NewFirmsWireSchema.find()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.send(err);
    });
};

// Delete NewFirmWireNews

exports.deleteNewFirmWire = async (req, res) => {
  const { _id } = req.body;
  NewFirmsWireSchema.deleteOne({ _id })
    .then((data) => {
      res.send({
        message: "Firm has been deleted successfully.",
      });
    })
    .catch((err) => {
      res.send(err);
    });
};

// Delete NewFirmWireNews

exports.deleteAllNewFirmWire = async (req, res) => {
  NewFirmsWireSchema.deleteMany({})
    .then((data) => {
      data.deletedCount === 0
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