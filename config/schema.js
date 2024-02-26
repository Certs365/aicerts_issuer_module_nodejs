const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    approved: Boolean,
    status: Number,
    address: String,
    country: String,
    organizationType: String,
    city: String,
    zip: String,
    industrySector: String,
    state: String,
    websiteLink: String,
    phoneNumber: String,
    designation: String,
    username: String,
    rejectedDate: Date
  });
  
  module.exports = mongoose.model('User', UserSchema);
  
// Verification Schema
const VerificationSchema = new Schema({
    email: String,
    code: Number,
    verified: Boolean
});

// Issues Schema
const IssuesSchema = new Schema({
    issuerId: String,
    organization: String,
    transactionHash: String,
    certificateHash: String,
    certificateNumber: String,
    name: String,
    course: String,
    grantDate: Date,
    expirationDate: Date,
    issueDate: Date
});

// Batch Issues Schema
const BatchIssuesSchema = new Schema({
    issuerId: String,
    batchId: Number,
    proofHash: [String],
    transactionHash: String,
    certificateHash: String,
    certificateNumber: String,
    issueDate: Date
});


// Define the schema for the Blacklist model
const BlacklistSchema = new mongoose.Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  email: { type: String, required: true }, // Email is of type String and is required
  terminated: { type: Boolean, required: true } // Email termainated is of type Boolean and is required
});

const User = mongoose.model('User', UserSchema);
const Verification = mongoose.model('Verification', VerificationSchema);
const Issues = mongoose.model('Issues', IssuesSchema);
const BatchIssues = mongoose.model('BatchIssues', BatchIssuesSchema);
const Blacklist = mongoose.model('Blacklist', BlacklistSchema);

module.exports = {
    User,
    Verification,
    Issues,
    BatchIssues,
    Blacklist
};
