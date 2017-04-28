/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const koa = require('koa');
const logger = require('koa-logger');
const body = require('koa-bodyparser');
const request = require('./');

const app = new koa();

app.use(logger());
app.use(body());
app.use(request());
app.use(async (ctx) => {
	return await ctx.forward('http://google.com/');
});

app.listen(3000);
