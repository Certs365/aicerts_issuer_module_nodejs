const { Verification } = require("../config/schema");

const verifyIssuer = async (req, res) => {
    let { email, code } = req.body;
    try {
        const verify = await Verification.findOne({ email });
        
        if (!verify) {
            return res.status(400).json({
                status: "FAILED",
                message: "No verification record found for the provided email",
            });
        }

        if (verify.code !== code) {
            return res.status(400).json({
                status: "FAILED",
                message: "Verification code does not match",
            });
        }

        if (!verify.verified) {
            verify.verified = true;
            await verify.save();
        }

        res.json({
            status: "PASSED",
            message: "Verification successful",
        });

    } catch (error) {
        console.error("Error occurred during verification:", error);
        res.status(500).json({
            status: 'FAILED',
            message: 'An error occurred during the verification process',
        });
    }
};

module.exports = {
    verifyIssuer
};
