"use strict";

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var OwnerRequestSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  date_requested: { type: Date, default: Date.now, required: true },
  modify_date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  }
});

module.exports = mongoose.model('OwnerRequest', OwnerRequestSchema);