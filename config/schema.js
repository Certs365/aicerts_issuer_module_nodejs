const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: String,
    organization: String,
    email: String,
    password: String,
    id: String,
    approved: Boolean
});

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

const User = mongoose.model('User', UserSchema);
const Verification = mongoose.model('Verification', VerificationSchema);
const Issues = mongoose.model('Issues', IssuesSchema);
const BatchIssues = mongoose.model('BatchIssues', BatchIssuesSchema);


module.exports = {
    User,
    Verification,
    Issues,
    BatchIssues
};
