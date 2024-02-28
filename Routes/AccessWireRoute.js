const AccessWireRoute = (app) => {
  const accessWire = require("../controllers/accesswire.controller.js");
  var router = require("express").Router();

// Get all BusinessWire details
/**
 * @swagger
 * /api/access-wire:
 *  get:
 *     tags:
 *     - Accesswire
 *     description: Returns API operational status
 *     responses:
 *       200:
 *         description: API is  running
 */
  router.get("/access-wire", accessWire.getAllAccessWire);

  // Delete Bussiness wire details
   /**
     * @swagger
     * '/api/access-wire/deleteall':
     *  delete:
     *     tags:
     *     - Accesswire Deleted
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
  router.delete("/access-wire/deleteall", accessWire.deleteAccessWireAll);

  app.use("/api", router);
};
module.exports = AccessWireRoute;
