
const { body } = require('express-validator');
const messageCode = require("./codes");

const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/; // Regular expression for special characters

const validationRoutes = {
    signUp: [
        body("name").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength({ max: 40 }).withMessage(messageCode.msgNameMaxLength),
        body("organization").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength({ max: 40 }).withMessage(messageCode.msgOrgMaxLength),
        body("username").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength({ max: 40 }).withMessage(messageCode.msgUnameMaxLength),
        body("password").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength({ min: 8, max: 30 }).withMessage(messageCode.msgPwdMaxLength),
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail).not().equals("string").withMessage(messageCode.msgInvalidEmail)
    ],
    update: [
        body("name").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength({ max: 40 }).withMessage(messageCode.msgNameMaxLength),
        body("id").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength(42).withMessage(messageCode.msgInvalidEthereum),
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail)
    ],
    credentials: [
        body("password").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength({ min: 8, max: 30 }).withMessage(messageCode.msgPwdMaxLength),
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail)
    ],
    emailCheck: [
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail).not().equals("string").withMessage(messageCode.msgInvalidEmail)
    ],
    loginPhone: [
        body("idToken").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide),
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail).not().equals("string").withMessage(messageCode.msgInvalidEmail)  
    ],
    refreshToken: [
        body("token").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide),
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail).not().equals("string").withMessage(messageCode.msgInvalidEmail)  
    ],
    checkId: [
        body("id").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide)
    ],
    checkServerName: [
        body("serverName").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide)
    ],
    setServer: [
        body("email").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isEmail().withMessage(messageCode.msgInvalidEmail),
        body(["serverName", "serverEndpoint", "serverAddress"]).notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgInputProvide),
    ],
    verifyIssuer: [
        body("code").notEmpty().trim().isNumeric().withMessage(messageCode.msgNonEmpty).isLength(6).withMessage(messageCode.msgInvalidOtp),
        body("email").notEmpty().trim().isEmail().withMessage(messageCode.msgInvalidEmail)  
    ],
    checkAddress: [
        body("address").notEmpty().trim().isString().withMessage(messageCode.msgNonEmpty).not().equals("string").withMessage(messageCode.msgInputProvide).isLength(42).withMessage(messageCode.msgInvalidEthereum)
    ],
    generateExcel: [
        body("email").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isEmail().withMessage(messageCode.msgInvalidEmail),
        body(["startDate", "endDate"]).notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgInputProvide),
    ],
    generateInvoice: [
        body("email").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isEmail().withMessage(messageCode.msgInvalidEmail),
        body(["startDate", "endDate"]).notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgInputProvide),
    ],
    fetchIssuers: [
        body("filter").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgProvideValidFilter),
        body("input").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgInputProvide),
        body("flag").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isNumeric().isIn([1, 2]).withMessage(messageCode.msgInvalidFlag),
    ],
    filterIssues: [
        body("email").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isEmail().withMessage(messageCode.msgInvalidEmail),
        body("filter").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgProvideValidFilter),
        body("input").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().withMessage(messageCode.msgInputProvide),
        body("flag").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isNumeric().isIn([1, 2]).withMessage(messageCode.msgInvalidFlag),
    ],
    adminFilterIssues: [
        body("email").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isEmail().withMessage(messageCode.msgInvalidEmail),
        body("filter").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().not().equals("string").withMessage(messageCode.msgProvideValidFilter),
        body("input").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isString().withMessage(messageCode.msgInputProvide),
        body("flag").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isNumeric().isIn([1, 2]).withMessage(messageCode.msgInvalidFlag),
    ],
    queryCode: [
        body("email").notEmpty().withMessage(messageCode.msgNonEmpty).trim().isEmail().withMessage(messageCode.msgInvalidEmail).not().equals("string").withMessage(messageCode.msgInvalidEmail),
        body("queryCode").optional().notEmpty().withMessage(messageCode.msgNonEmpty).trim().isNumeric().withMessage(messageCode.msgInputProvide).custom((value) => {
            const intValue = parseInt(value);
            if (intValue <= 0) {
                throw new Error(messageCode.msgNonZero);
            }
            return true;
        })

    ]
  };
  
  module.exports = validationRoutes;