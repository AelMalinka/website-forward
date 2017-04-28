/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const request = require('request-promise-native');

module.exports = function() {
	return async function(ctx, next) {
		ctx.forward = async function(options) {
			if(typeof options === 'string') {
				options = {
					uri: options
				};
			}

			options = options || {};

			delete this.header.host;

			options.resolveWithFullResponse = true;
			options.method = options.method || ctx.method;
			options.headers = options.headers || ctx.headers;
			options.qs = options.qs || ctx.query;

			switch(this.is('json', 'urlencoded')) {
				case 'json':
					delete options.headers['content-length'];

					options.body = options.body || ctx.request.body;
					options.json = true;
				break;
				case 'urlencoded':
					options.form = options.form || ctx.request.body;
				break;
			}

			ctx.body = await request(options).then(function(res) {
				for(const name in res.headers) {
					ctx.response.set(name, res.headers[name]);
				}

				return res.body;
			}).catch(function(err) {
				throw err;
			});
		}

		await next();
	}
}
