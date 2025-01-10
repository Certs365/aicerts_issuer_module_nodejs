const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the Admin model
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Name field is of type String and is required
  email: { type: String, required: true }, // Email field is of type String and is required
  password: { type: String, required: true }, // Password field is of type String and is required
  status: { type: Boolean, required: true } // Status field is of type Boolean and is required
});

// Define the schema for the IssueStatus model
const ServerDetailsSchema = new mongoose.Schema({
  email: { type: String, required: true },
  serverName: { type: String, default: null }, 
  serverEndpoint: { type: String, default: null },
  serverAddress: { type: String, default: null }, 
  serverStatus: { type: Boolean, default: true },
  lastUpdate: { type: Date, default: Date.now } // IssueDate field is of type Date and defaults to the current date/time
});

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
  username: { type: String },
  rejectedDate: { type: Date, default: null },
  invoiceNumber: { type: Number, default: 0 },
  batchSequence: { type: Number, default: 0 },
  transactionFee: { type: Number, default: 0 },
  qrPreference: { type: Number, default: 0 },
  blockchainPreference: { type: Number, default: 0 },
  refreshToken: { type: String },
  certificatesIssued: { type: Number },
  certificatesRenewed: { type: Number },
  approveDate: { type: Date, default: null}
});

// Define the schema for the Issues model
const IssuesSchema = new mongoose.Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
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
  blockchainOption: { type: Number, default: 0 },
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
  blockchainOption: { type: Number, default: 0 },
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
  blockchainOption: { type: Number, default: 0 },
  lastUpdate: { type: Date, default: Date.now } // IssueDate field is of type Date and defaults to the current date/time
});

// Define the schema for the Dynamic single Issues model
const DynamicIssuesSchema = new mongoose.Schema({
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  transactionHash: { type: String, required: true }, // TransactionHash field is of type String and is required
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
  blockchainOption: { type: Number, default: 0 },
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
  blockchainOption: { type: Number, default: 0 },
  url: { type: String },
  type: { type: String, default: 'dynamic' }
});

// Verification Schema
const VerificationSchema = new Schema({
  email: String,
  code: Number,
  verified: Boolean
});

// Define the schema for the VerificationLog model
const VerificationLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  issuerId: { type: String, required: true }, // ID field is of type String and is required
  courses: { type: Object, required: true }, // Using Object type for dynamic key-value pairs
  lastUpdate: { type: Date, default: Date.now } // IssueDate field is of type Date and defaults to the current date/time
});

// Define schema for certificate template
const CrediantialTemplateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  designFields: { type: Object},
  url: { type: String },
  dimentions:{ type: Object}
});

// Define schema for certificate template
const BadgeTemplateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  designFields: { type: Object},
  url: { type: String },
  dimentions:{ type: Object},
  attributes:{ type: Object},
  title:{ type: String },
  subTitle:{type: String },
  description:{type: String }
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

// Define the schema for subscription plan
const SubscriptionPlanSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true }, // The subscription Plan title
  subheader: { type: String, required: true }, // The sub header for the UI
  fee: { type: Number, required: true }, // The subscription fee (rate x limit)
  limit: { type: Number, required: true }, // Allocated Credits
  rate: { type: Number, required: true }, // The rate per credit usage
  validity: { type: Number, default: 30 }, // Number of days the plan valid for
  lastUpdate: { type: Date, default: Date.now }, 
  status: {type: Boolean, default: true}, // Subscription plan status
});

// Store users Subscription plan details
// If updating schema, update in signup code also
const UserSubscriptionPlanSchema = new mongoose.Schema({
  email: { type: String, required: true},
  issuerId: { type: String }, // Issuer Id field is of type String and is required
  subscriptionPlanTitle: { type: [String], required: true },
  purchasedDate: { type: [Date], default: Date.now},
  subscriptionFee: { type: [Number] },
  subscriptionDuration: { type: [Number], default: 30 },
  allocatedCredentials: { type: [Number] },
  currentCredentials: { type: [Number], default: 0 },
  status: {type: Boolean, default: true}
});

const MailSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  from: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'resolved'] },
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
const Verification = mongoose.model('Verification', VerificationSchema);
const ServiceAccountQuotas = mongoose.model('ServiceAccountQuotas', ServiceAccountQuotasSchema);
const User = mongoose.model('User', UserSchema);
const Issues = mongoose.model('Issues', IssuesSchema);
const BatchIssues = mongoose.model('BatchIssues', BatchIssuesSchema);
const IssueStatus = mongoose.model('IssueStatus', IssueStatusSchema);
const DynamicIssues = mongoose.model('DynamicIssues', DynamicIssuesSchema);
const DynamicBatchIssues = mongoose.model('DynamicBatchIssues', DynamicBatchIssuesSchema);
const VerificationLog = mongoose.model('VerificationLog', VerificationLogSchema);
const DynamicParameters = mongoose.model('DynamicParameters', DynamicParamsSchema);
const ServerDetails = mongoose.model('ServerDetails', ServerDetailsSchema);
const CrediantialTemplate = mongoose.model('CrediantialTemplate', CrediantialTemplateSchema);
const UserSubscriptionPlan = mongoose.model('UserSubscriptionPlan', UserSubscriptionPlanSchema);
const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
const MailStatus = mongoose.model('MailStatus', MailSchema);
const BadgeTemplate = mongoose.model('BadgeTemplateSchema', BadgeTemplateSchema);

module.exports = {
  Admin,
  Verification,
  ServerDetails,
  ServiceAccountQuotas,
  User,
  Issues,
  BatchIssues,
  IssueStatus,
  DynamicIssues,
  DynamicBatchIssues,
  VerificationLog,
  DynamicParameters,
  CrediantialTemplate,
  SubscriptionPlan,
  UserSubscriptionPlan,
  MailStatus,
  BadgeTemplate
};