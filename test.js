/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const koa = require('koa');
const me = require('./');

const body = require('koa-bodyparser');
const request = require('request');

const vows = require('vows');
const assert = require('assert');

const baseapp = new koa();
const forwardapp = new koa();

baseapp.use(body());
baseapp.use(async (ctx) => {
	if(ctx.request.method === 'POST') {
		ctx.body = 'Hello!\n';
		ctx.body += JSON.stringify(ctx.request.body);
		ctx.body += '\n';
	} else {
		ctx.body = 'Hello!\n';
	}
});

forwardapp.use(me());
forwardapp.use(async (ctx) => {
	return await ctx.forward('http://localhost:3001/');
});

const base = baseapp.listen(3001);
const forward = forwardapp.listen(3000);

const empty = {};
const value = {
	value: 'test',
	other: 'meow!',
};

vows.describe('Forwrad').addBatch({
	'Base': {
		topic: base,
		'GET': {
			topic: function () {
				request({
					uri: 'http://localhost:3001/',
				}, this.callback);
			},
			'not errored': function(err, res, body) {
				assert.isTrue(!err);
			},
			'is 200 OK': function(err, res, body) {
				assert.equal(res.statusCode, 200);
			},
			'is Hello!': function(err, res, body) {
				assert.equal(body, 'Hello!\n');
			},
		},
		'empty POST': {
			topic: function() {
				request({
					uri: 'http://localhost:3001/',
					method: 'POST',
					form: empty,
				}, this.callback);
			},
			'not errored': function(err, res, body) {
				assert.isTrue(!err);
			},
			'is 200 OK': function(err, res, body) {
				assert.equal(res.statusCode, 200);
			},
			'is correct response': function(err, res, body) {
				assert.equal(body, 'Hello!\n' + JSON.stringify(empty) + '\n');
			},
		},
		'POST': {
			topic: function() {
				request({
					uri: 'http://localhost:3001/',
					method: 'POST',
					form: value,
				}, this.callback);
			},
			'not errored': function(err, res, body) {
				assert.isTrue(!err);
			},
			'is 200 OK': function(err, res, body) {
				assert.equal(res.statusCode, 200);
			},
			'is correct response': function(err, res, body) {
				assert.equal(body, 'Hello!\n' + JSON.stringify(value) + '\n');

				// 2017-05-13 AMR NOTE: objects are not equal to each other, TODO?
				const v = JSON.parse(body.split('\n')[1]);
				assert.equal(value.value, v.value);
				assert.equal(value.other, v.other);
			},
		},
		'Forward': {
			topic: forward,
			'GET': {
				topic: function () {
					request({
						uri: 'http://localhost:3000/',
					}, this.callback);
				},
				'not errored': function(err, res, body) {
					assert.isTrue(!err);
				},
				'is 200 OK': function(err, res, body) {
					assert.equal(res.statusCode, 200);
				},
				'is Hello!': function(err, res, body) {
					assert.equal(body, 'Hello!\n');
				},
			},
			'empty POST': {
				topic: function() {
					request({
						uri: 'http://localhost:3000/',
						method: 'POST',
						form: empty,
					}, this.callback);
				},
				'not errored': function(err, res, body) {
					assert.isTrue(!err);
				},
				'is 200 OK': function(err, res, body) {
					assert.equal(res.statusCode, 200);
				},
				'is correct response': function(err, res, body) {
					assert.equal(body, 'Hello!\n' + JSON.stringify(empty) + '\n');
				},
			},
			'POST': {
				topic: function() {
					request({
						uri: 'http://localhost:3000/',
						method: 'POST',
						form: value,
					}, this.callback);
				},
				'not errored': function(err, res, body) {
					assert.isTrue(!err);
				},
				'is 200 OK': function(err, res, body) {
					assert.equal(res.statusCode, 200);
				},
				'is correct response': function(err, res, body) {
					assert.equal(body, 'Hello!\n' + JSON.stringify(value) + '\n');

					// 2017-05-13 AMR NOTE: objects are not equal to each other, TODO?
					const v = JSON.parse(body.split('\n')[1]);
					assert.equal(value.value, v.value);
					assert.equal(value.other, v.other);
				},
			},
		},
	}
}).addBatch({
	'Base': {
		'close': function() {
			base.close();
		},
	},
	'Forward': {
		'close': function() {
			forward.close();
		}
	},
}).run();
