/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const request = require('request');

module.exports = function() {
	return async function(ctx, next) {
		ctx.forward = async function(options) {
			if(typeof options === 'string') {
				options = {
					uri: options
				};
			}

			options = options || {};

			delete ctx.header.host;

			options.simple = false;
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

			await new Promise(function(resolve, reject) {
				request(options).on('error', function(err) {
					console.log(err);
					return reject(err);
				}).on('response', function(response) {
					delete response.headers['content-length'];
					delete response.headers['transfer-encoding'];

					for(const name in response.headers) {
						ctx.response.set(name, response.headers[name]);
					}

					response.pipe(ctx.res);

					response.on('end', function() {
						resolve();
					});
				});
			});
		}

		await next();
	}
}
