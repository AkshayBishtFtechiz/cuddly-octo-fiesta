const BusinessWireRoute = (app) => {
  const businessWire = require("../controllers/bussinesswire.controller.js");
  var router = require("express").Router();

  // Get all BusinessWire details
  /**
   * @swagger
   * /api/business-wire:
   *  get:
   *     tags:
   *     - Bussinesswire
   *     description: Returns API operational status
   *     responses:
   *       200:
   *         description: API is  running
   */
  router.get("/business-wire", businessWire.getAllBussinessWire);

  // Delete Bussiness wire details
  /**
     * @swagger
     * '/api/business-wire/deleteall':
     *  delete:
     *     tags:
     *     - Businesswire Deleted
     *     summary: Delete_Newswire
     *     responses:
     *      200:
     *        description: Removed
     *      400:
     *        description: Bad request
     *      404:
     *        description: Not Found
     *      500:
     *        description: Server Error
     */
  router.delete("/business-wire/deleteall", businessWire.deleteBussinessAll);

  app.use("/api", router);
};
module.exports = BusinessWireRoute;
