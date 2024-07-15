const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the User/Isseur model
const UserSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  issuerId: { type: String, required: true },
  approved: { type: Boolean },
  status: { type: Number },
  address: { type:String },
  country: { type:String },
  organizationType: { type:String },
  city: { type:String },
  zip: { type:String },
  industrySector: { type:String },
  state: { type:String },
  websiteLink: { type:String },
  phoneNumber: { type:String },
  designation: { type:String },
  username: { type: String, unique: true },
  rejectedDate: { type: Date, default: null },
  certificatesIssued: { type: Number },
  certificatesRenewed: { type: Number },
});

const ServiceAccountQuotasSchema = new Schema({
  issuerId: { type: String, required: true }, // Issuer Id field is of type String and is required
  serviceId: { type: String, required: true }, // Service Id field is of type String and is required
  limit: {type: Number, default: 0},
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
  
// Verification Schema
const VerificationSchema = new Schema({
    email: { type: String, required: true },
    code: { type: Number, required: true },
    verified: { type: Boolean }
});

// Define the schema for the Issues model
const IssuesSchema = new Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
  certificateHash: { type: String, required: true }, // CertificateHash field is of type String and is required
  certificateNumber: { type: String, required: true }, // CertificateNumber field is of type String and is required
  name: { type: String, required: true }, // Name field is of type String and is required
  course: { type: String, required: true }, // Course field is of type String and is required
  grantDate: { type: String, required: true }, // GrantDate field is of type String and is required
  expirationDate: { type: String, required: true }, // ExpirationDate field is of type String and is required
  certificateStatus: { type: Number, required: true, default: 1 },
  issueDate: { type: Date, default: Date.now } // issueDate field is of type Date and defaults to the current date/time
});

// Batch Issues Schema
const BatchIssuesSchema = new Schema({
    issuerId: { type: String, required: true },
    batchId: { type: Number, required: true },
    proofHash: [String],
    encodedProof: { type: String, required: true },
    transactionHash: { type: String, required: true },
    certificateHash: { type: String, required: true },
    certificateNumber: { type: String, required: true },
    name: { type: String, required: true },
    course: { type: String, required: true },
    grantDate: { type: String, required: true },
    expirationDate: { type: String, required: true },
    issueDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const ServiceAccountQuotas = mongoose.model('ServiceAccountQuotas', ServiceAccountQuotasSchema);
const Verification = mongoose.model('Verification', VerificationSchema);
const Issues = mongoose.model('Issues', IssuesSchema);
const BatchIssues = mongoose.model('BatchIssues', BatchIssuesSchema);


module.exports = {
    User,
    ServiceAccountQuotas,
    Verification,
    Issues,
    BatchIssues
};
