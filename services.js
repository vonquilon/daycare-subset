"use strict";

var debug = require('debug')('app:routes:services' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    bcrypt = require('bcryptjs'),
    jwt = require("jwt-simple"),
    jfs = require('jsonfile'),
    fs = require('fs'),
    mustache = require('mustache'),
    winston = require('winston'),
    utils = require("../utils.js"),
    passportService = require('./passport'),
    config = require(path.join(__dirname, "..", "config.json")),
    passport = require('passport'),
    mongoose = require('mongoose'),
    extend = require('extend'),
    request = require('request');

var util = require('util');

var multiparty = require('connect-multiparty'),
    pathToUploads =  path.join(__dirname, "../web/assets/uploads"),
    multipartyMiddleware = multiparty({
        uploadDir: pathToUploads
    });

// Mongo Objects
var User = require(path.join(__dirname, "..", "models", "user.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js")),
    OwnerRequest = require(path.join(__dirname, "..", "models", "owner_request.js")),
    UserMessage = require(path.join(__dirname, "..", "models", "message.js"));


var HOST_SERVER = 'http://www.ratingsville.com';

// TWILIO

var twilio = require('twilio');
var client = new twilio.RestClient(accountSid, authToken);

var Router = require("express").Router;

var rootDir = path.join(path.dirname(fs.realpathSync(__filename)), '..');

var basedir = "baseline";
var simfile;
var defaultfile;

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: '/tmp/services.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/tmp/services-exceptions.log'
        })
    ]
});

function sendOwnershipApprovalEmail(ownerId,listingId, isApproved) {
    logger.info("### sendOwnershipApprovalEmail ###");

    User.find({_id:ownerId},{},{}).exec(function(err,res){
        if(!err && res){
            Listing.find({_id:listingId},{},{}).exec(function(_err,_res){
                if(!_err && _res){

                    var receiver = res[0];
                    var daycare = _res[0];
                    send(receiver,daycare);

                }else{
                    logger.info("sendOwnershipApprovalEmailFailedToLoadListing");
                }

            });
        }else{
            logger.info("sendOwnershipApprovalEmailFailedToLoadUser");
        }  
    });

    function send(receiver,daycare){
        console.log("### SENDING EMAIL ### TO:" + receiver.firstName+" "+receiver.lastName +" DAYCARE:"+daycare.name);
    
        var myEmail = "ratingsville@gmail.com";

        var linebreak = "\n\n";

        var subj = "Ownership Request Notification for "+daycare.name;

        // TODO: Create message content for approve and reject
        var approve = " we are pleased to inform you that your request for ownership of "+daycare.name+" has been approved.";

        var reject = " we regret to inform you that your request for ownership of "+daycare.name+" has been rejected.";

        // TODO: Create a template body/message header
        var body = "Dear "+receiver.firstName+","+linebreak+
        "On behalf of the Ratingsville team, ";

        var footer = "The Ratingsville Team";

        if(isApproved=="approved"){
            body+=approve;
        }else{
            body+=reject;
        }

        body+= (linebreak + linebreak + footer);

        // create template based sender function
        var sendOwnershipApprovalEmail = transporter.templateSender({
            subject: subj,
            text: body,
        }, {
            from: 'Ratingsville <ratingsville@gmail.com>',
        });

        sendOwnershipApprovalEmail({
            to: receiver.email
        }, {
            username: receiver.username
        }, function (err, info) {
            if (err) {
                logger.info('Ownership Approval Error');
            } else {
                logger.info('Ownership Approval Email Sent');
            }
        });
    }
}

module.exports = function () {

    var router = new Router();

    router.route('/owner-request').post(function (req, res, next) {
        var ownerRequest = new OwnerRequest(req.body);
        ownerRequest.save(function (err) {
            if (err) {
                next(err);
            } else {
                res.send({
                    owner_requested: true
                });
            }
        });
    }).get(function (req, res, next) {
        OwnerRequest.find({})
            .populate('owner', '-password -used_password')
            .populate({
                path: 'listing',
                select: '_id name owner_id',
                model: 'Listing',
                populate: {
                    path: 'owner_id',
                    select: '-password -used_password',
                    model: 'User'
                }
            }).exec(function (err, ownerRequests) {
            if (err) {
                next(err);
            }

            res.json({searchResult: ownerRequests});
        });
    });

    router.route('/owner-request/:ownerRequestId').put(requireUserType('admin'),function (req, res, next) {
        if (typeof req.body._id != 'undefined') {
            delete req.body._id;
        }

        req.body.modify_date = Date.now();

        OwnerRequest.update({
            _id: req.params.ownerRequestId
        }, req.body, {
            multi: true
        }, function (err, resp) {
            if (err) {
                return next(err);
            }

            if (req.body.status && (req.body.owner && req.body.owner._id) && (req.body.listing && req.body.listing._id)) {
                var data = {owner_id: null};
                if (req.body.status == 'approved') {
                    data.owner_id = req.body.owner._id;
                }
                sendOwnershipApprovalEmail(req.body.owner._id,req.body.listing._id,req.body.status); // SEND EMAIL TO USER
                Listing.update({
                    _id: req.body.listing._id
                }, data, function (err, resp2) {
                    if (err) {
                        return next(err);
                    }

                    res.json({
                        result: resp2
                    });
                });
            } else {
                res.json({
                    result: resp
                });
            }
        });
    }).delete(function (req, res, next) {
        OwnerRequest.findOneAndRemove({_id: req.params.ownerRequestId}, function (err, ownerRequest) {
            if (err) {
                return next(err);
            }

            Listing.update({
                _id: ownerRequest.listing
            }, {owner_id: null}, function (err, resp) {
                if (err) {
                    return next(err);
                }

                return res.status(200).json({
                    "message": "Ownership request has been successfully deleted"
                });
            });
        });
    });

    router.route('/owner-request/user/:userId/listing/:listingId').get(function (req, res, next) {
        OwnerRequest.findOne({owner: req.params.userId, listing: req.params.listingId}, function (err, ownerRequest) {
            if (err) {
                next(err);
            }

            res.json(ownerRequest);
        });
    });

    return router;
};