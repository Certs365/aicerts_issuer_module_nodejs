module.exports = {

    // Tasks Messages
    msgDbReady: "Database connection is Ready",
    msgDbNotReady : "Database connection is Not Ready",
    
    // Response code messages
    msgInternalError : "Internal server error. Please try again later.",

    // Validation Error codes Issues (Route)
    msgInvalidFile : "Invalid file uploaded / Please Try again ...",
    msgEnterInvalid : "Entered invalid input / Please check and try again...",
    msgInvalidEmail: "Entered invalid Email",
    msgNonEmpty : "Input field cannot be empty",
    msgInputProvide : "Input should be provided",
    msgInvalidFormat : "Entered input format is invalid ",
    msgInvalidDate : "Entered date format is invalid",
    msgInvalidEthereum : "Invalid Issuer ID format",
    msgPhoneNumberLimit : "Entered Phone Number must not exceed 10 characters",
    msgNameMaxLength : "Entered Name must not exceed 40 characters",
    msgOrgMaxLength : "Entered Organization must not exceed 40 characters",
    msgUnameMaxLength : "Entered Username must not exceed 40 characters",
    msgPwdMaxLength : "Entered password must between 8 to 30 characters",
    msgNoSpecialCharacters : "No special characters are allowed in name",
    
    //Issuer Messages
    msgValidCredentials : "Valid Issuer Credentials",
    msgInvalidPassword : "Invalid password entered!",
    msgInvalidPhone : "Invalid phone number entered!",
    msgErrorOnComparePassword : "An error occurred while comparing passwords",
    msgInvalidOrUnapproved : "Invalid credentials entered (or) Issuer not approved",
    msgExistingUserError : "An error occurred while checking for existing user",
    msgInvalidOtp : "Invalid OTP entered / bad format.",
    msgErrorOnLogin : "Error Occured during the Login",
    msgErrorOnOtp : "An error occurred while sending OTP",
    msgIssuerNotFound : "Issuer not found",
    msgIssuerFound : "Issuer Found",
    msgOtpSent : "OTP sent to the Issuer Email",
    msgExistEmail : "User with the provided email already exists",
    msgSignupSuccess : "User signup successful",
    msgEnterOrgEmail : "Please Enter Your Organisation Email",
    msgIssuerUpdated : "Issuer updated successfully",
    msgErroOnPwdReset : "An error occurred during password reset process!",
    msgPwdNotSame : "Password cannot be the same as the previous one!",
    msgPwdReset : "Password reset successful",
    msgErrorOnSaveUser : "An error occurred while saving user account!",
    msgErrorOnPwdHash : "An error occurred while hashing password!",
    msgNoRecordFound : "No verification record found for the provided email",
    msgCodeNotMatch : "Verification code does not match",
    msgVerfySuccess : "Verification successful",
    msgVerifyError : "An error occurred during the verification process",

    //Authr Messages
    msgInvalidToken: "Provided invalid token",
    msgTokenExpired: "Invalid OTP or Token Expired",

};