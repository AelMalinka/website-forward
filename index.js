/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const request = require('request');

module.exports = function() {
	return async function(ctx, next) {
		ctx.forward = function(options) {
			if(typeof options === 'string') {
				options = {
					uri: options
				};
			}

			options = options || {};

			delete ctx.header.host;

			options.simple = false;
			options.encoding = null;
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

			// 2017-04-28 AMR TODO: handle compressed data correctly
			return new Promise(function(resolve, reject) {
				request(options, function(err, response, body) {
					if(err) {
						console.log('error: ' + err);
						return reject(err);
					} else if(response.statusCode == 304) {
						ctx.status = 304;
					}

					for(const name in response.headers) {
						ctx.set(name, response.headers[name]);
					}

					ctx.body = body;
					resolve(response);
				});
			});
		}

		await next();
	}
}
