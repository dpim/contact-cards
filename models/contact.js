const mongoose = require('mongoose');
const contactSchema = mongoose.Schema({
    displayName: String,
    phoneNumber: String,
    emailAddress: String
});
const contactModel = mongoose.model('Contact', contactSchema);

module.exports = contactModel;