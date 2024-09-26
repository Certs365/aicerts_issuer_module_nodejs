const { Verification } = require("../config/schema");
const { validationResult } = require("express-validator");
var messageCode = require("../common/codes");

  /**
   * API call for Verify Issuer.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
const verifyIssuer = async (req, res) => {
    var validResult = validationResult(req);
    if (!validResult.isEmpty()) {
      return res.status(422).json({
        code: 422, 
        status: "FAILED", 
        message: messageCode.msgEnterInvalid ,
        details: validResult.array() 
    });
    }
    let { email, code } = req.body;
    try {
        const verify = await Verification.findOne({ email });
        
        if (!verify) {
            return res.status(400).json({
                code: 400,
                status: "FAILED",
                message: messageCode.msgNoRecordFound,
            });
        }

        if (verify.code != code) {
            return res.status(400).json({
                code: 400,
                status: "FAILED",
                message: messageCode.msgCodeNotMatch
            });
        }

        if (!verify.verified) {
            verify.verified = true;
            await verify.save();
        }

        return res.json({
            code: 200,
            status: "SUCCESS",
            message: messageCode.msgVerfySuccess
        });

    } catch (error) {
        console.error(messageCode.msgVerifyError, error);
        return res.status(500).json({
            code: 500,
            status: 'FAILED',
            message: messageCode.msgVerifyError
        });
    }
};

module.exports = {
    verifyIssuer
};
