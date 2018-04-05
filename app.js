require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const contact = require('./models/contact');
const twilio = require('twilio');
const vCard = require('vcards-js');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const senderNumber = process.env.TWILIO_SENDER_PHONE_NUMBER;
const ngrokPrefix = "http://f9c1fd76.ngrok.io";

const client = new twilio(accountSid, token);
const app = express();
app.use(bodyParser.json());
app.set('view engine', 'pug')
mongoose.connect('mongodb://localhost/test');
const db = mongoose.connection;

// create a new contact
app.post('/contacts', (req, res) => {
    if (!req.body){
        res.sendStatus(400);
    }
    const newContact = new contact({
        displayName: req.body.displayName,
        emailAddress: req.body.emailAddress,
        phoneNumber: req.body.phoneNumber
    });
    newContact.save( (err, newContact) => {
        if (err){
            res.sendStatus(500);
        } else {
            res.statusCode = 201;
            res.send(newContact);
        }
    });
});

//request info to be sent
app.post('/contacts/:id/sendInfo', (req, res) => {
    contact.findOne({_id: req.params.id}, (err, contact) => { 
        if (err && !contact){
            res.sendStatus(404);
        } else {
            const vcardUrl = ngrokPrefix+"/contacts/"+ req.params.id +"/vcard.vcf"
            client.messages.create({
                from: senderNumber,
                to: "+1"+req.body.recipientPhoneNumber,
                body: "Hey, here's your contact",
                mediaUrl: vcardUrl
            }).then((message) => {
                res.sendStatus(201);
            }).catch((error) => {
                res.sendStatus(400);
            });
        }
    });
});

//renders home
app.get('/', (req, res) => {
    res.render('index', { title: 'Contact cards', message: 'contact cards' })
})

//renders contact
app.get('/contacts/:id', (req, res) => {
    //TODO: lookup id
    contact.findOne({_id: req.params.id}, (err, contact) => { 
        if (err && !contact){
            res.sendStatus(404);
        } else {
            res.render('contact', { contact: contact });
        }
     });
})

//contact vcard
app.get('/contacts/:id/vcard.vcf', (req, res) => {
    contact.findOne({_id: req.params.id}, (err, contact) => { 
        if (err && !contact){
            res.sendStatus(404);
        } else {
            let card = vCard();
            const parts = contact.displayName.split(" ");
            card.firstName = parts[0];
            card.lastName = parts[1];
            card.cellPhone = contact.phoneNumber;
            card.email = contact.emailAddress;
            res.set({ 'content-type': 'text/x-vcard;charset=utf-8' })
            res.send(card.getFormattedString());
        }
     });
})

app.listen(3000);

