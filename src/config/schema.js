const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the ServiceQuota model
const ServiceAccountQuotasSchema = new Schema({
  issuerId: { type: String, required: true }, // Issuer Id field is of type String and is required
  serviceId: { type: String, required: true }, // Service Id field is of type String and is required
  limit: { type: Number, default: 0 },
  status: { type: Boolean },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resetAt: { type: Date, default: Date.now }
});

// Define the schema for the User/Isseur model
const UserSchema = new Schema({
  name: { type: String, required: true },
  organization: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  issuerId: { type: String, required: true },
  approved: { type: Boolean },
  status: { type: Number },
  address: { type: String },
  country: { type: String },
  organizationType: { type: String },
  city: { type: String },
  zip: { type: String },
  industrySector: { type: String },
  state: { type: String },
  websiteLink: { type: String },
  phoneNumber: { type: String },
  designation: { type: String },
  username: { type: String, unique: true },
  rejectedDate: { type: Date, default: null },
  certificatesIssued: { type: Number },
  certificatesRenewed: { type: Number },
  approveDate: { type: Date, default: null}
});

// Define the schema for the Issues model
const IssuesSchema = new mongoose.Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
  transactionFee: { type: Number, default: 0}, // TransactionFee field is of type Number
  certificateHash: { type: String, required: true }, // CertificateHash field is of type String and is required
  certificateNumber: { type: String, required: true }, // CertificateNumber field is of type String and is required
  name: { type: String, required: true }, // Name field is of type String and is required
  course: { type: String, required: true }, // Course field is of type String and is required
  grantDate: { type: String, required: true }, // GrantDate field is of type String and is required
  expirationDate: { type: String, required: true }, // ExpirationDate field is of type String and is required
  certificateStatus: { type: Number, required: true, default: 1 },
  issueDate: { type: Date, default: Date.now },// issueDate field is of type Date and defaults to the current date/time
  positionX: { type: Number, default: 0},
  positionY: { type: Number, default: 0},
  qrSize: { type: Number, default: 0},
  width: { type: Number },
  height: { type: Number },
  qrOption: { type: Number, default: 0 },
  url: { type: String },
  type: { type: String, default: null }
});

// Batch Issues Schema
const BatchIssuesSchema = new Schema({
  issuerId: { type: String, required: true },
  batchId: { type: Number, required: true },
  proofHash: [String],
  encodedProof: { type: String, required: true },
  transactionHash: { type: String, required: true },
  transactionFee: { type: Number, default: 0}, // TransactionFee field is of type Number
  certificateHash: { type: String, required: true },
  certificateNumber: { type: String, required: true },
  name: { type: String, required: true },
  course: { type: String, required: true },
  grantDate: { type: String, required: true },
  expirationDate: { type: String, required: true },
  certificateStatus: { type: Number, default: 1 },
  issueDate: { type: Date, default: Date.now },
  positionX: { type: Number, default: 0},
  positionY: { type: Number, default: 0},
  qrSize: { type: Number, default: 0},
  width: { type: Number },
  height: { type: Number },
  qrOption: { type: Number, default: 0 },
  url: { type: String }
});

// Define the schema for the IssueStatus model
const IssueStatusSchema = new mongoose.Schema({
  email: { type: String, required: true },
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  batchId: { type: Number, default: null },
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
  certificateNumber: { type: String, required: true }, // CertificateNumber field is of type String and is required
  name: { type: String, required: true }, // Name field is of type String and is required
  course: { type: String, required: true },
  expirationDate: { type: String, required: true }, // ExpirationDate field is of type String and is required
  certStatus: { type: Number, required: true },
  lastUpdate: { type: Date, default: Date.now } // IssueDate field is of type Date and defaults to the current date/time
});

// Define the schema for the Dynamic single Issues model
const DynamicIssuesSchema = new mongoose.Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
  transactionFee: { type: Number, default: 0}, // TransactionFee field is of type Number
  certificateHash: { type: String, required: true }, // CertificateHash field is of type String and is required
  certificateNumber: { type: String, required: true }, // CertificateNumber field is of type String and is required
  name: { type: String }, // Name field is of type String and is required
  certificateStatus: { type: Number, required: true, default: 1 },
  certificateFields: { type: Object, required: true },
  issueDate: { type: Date, default: Date.now },// issueDate field is of type Date and defaults to the current date/time
  width: { type: Number },
  height: { type: Number },
  positionX: { type: Number, default: 0},
  positionY: { type: Number, default: 0},
  qrSize: { type: Number, default: 0},
  qrOption: { type: Number, default: 0 },
  url: { type: String },
  type: { type: String, default: 'dynamic' }
});

// Define the schema for the Dynamic batch Issues model
const DynamicBatchIssuesSchema = new mongoose.Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  batchId: { type: Number, required: true },
  proofHash: [String],
  encodedProof: { type: String, required: true },
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
  transactionFee: { type: Number, default: 0}, // TransactionFee field is of type Number
  certificateHash: { type: String, required: true }, // CertificateHash field is of type String and is required
  certificateNumber: { type: String, required: true }, // CertificateNumber field is of type String and is required
  name: { type: String }, // Name field is of type String and is required
  certificateStatus: { type: Number, required: true, default: 1 },
  certificateFields: { type: Object, required: true },
  issueDate: { type: Date, default: Date.now },// issueDate field is of type Date and defaults to the current date/time
  width: { type: Number },
  height: { type: Number },
  positionX: { type: Number, default: 0},
  positionY: { type: Number, default: 0},
  qrSize: { type: Number, default: 0},
  qrOption: { type: Number, default: 0 },
  url: { type: String },
  type: { type: String, default: 'dynamic' }
});

// Define the schema for the VerificationLog model
const VerificationLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  courses: { type: Object, required: true }, // Using Object type for dynamic key-value pairs
  lastUpdate: { type: Date, default: Date.now } // IssueDate field is of type Date and defaults to the current date/time
});

// Define the schema for the Short URL model
const ShortUrlSchema = new mongoose.Schema({
  email: { type: String, required: true },
  certificateNumber: { type: String, required: true }, // CertificateNumber field is of type
  url: { type: String, required: true }
});

// Define the schema for the Issues model
const DynamicParamsSchema = new mongoose.Schema({
  email: { type: String, required: true },
  positionX: { type: Number, required: true },
  positionY: { type: Number, required: true },
  qrSide: { type: Number, required: true },
  pdfWidth: { type: Number, required: true },
  pdfHeight: { type: Number, required: true },
  paramStatus: { type: Boolean, default: false },
  modifiedDate: { type: Date, default: Date.now } // issueDate field is of type Date and defaults to the current date/time
});

const CrediantialTemplateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  designFields: { type: Object},
  url: { type: String }
});

const ServiceAccountQuotas = mongoose.model('ServiceAccountQuotas', ServiceAccountQuotasSchema);
const User = mongoose.model('User', UserSchema);
const Issues = mongoose.model('Issues', IssuesSchema);
const BatchIssues = mongoose.model('BatchIssues', BatchIssuesSchema);
const IssueStatus = mongoose.model('IssueStatus', IssueStatusSchema);
const DynamicIssues = mongoose.model('DynamicIssues', DynamicIssuesSchema);
const DynamicBatchIssues = mongoose.model('DynamicBatchIssues', DynamicBatchIssuesSchema);
const VerificationLog = mongoose.model('VerificationLog', VerificationLogSchema);
const ShortUrl = mongoose.model('ShortUrl', ShortUrlSchema);
const DynamicParameters = mongoose.model('DynamicParameters', DynamicParamsSchema);
const CrediantialTemplate = mongoose.model('CrediantialTemplate', CrediantialTemplateSchema);

module.exports = {
  ServiceAccountQuotas,
  User,
  Issues,
  BatchIssues,
  IssueStatus,
  DynamicIssues,
  DynamicBatchIssues,
  VerificationLog,
  ShortUrl,
  DynamicParameters,
  CrediantialTemplate
};